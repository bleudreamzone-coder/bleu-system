'use strict';

const fs = require('node:fs');
const path = require('node:path');
const trustPacketSchema = require('../../schemas/trust_packet_v1.1.schema.json');

/** @constant {ReadonlyArray<'buffer'|'stdout'|'supabase'>} Supported Trust Packet sinks. */
const TRUST_PACKET_SINKS = Object.freeze(['buffer', 'stdout', 'supabase']);

class NotImplementedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

function compileWithAjv(schemaDocument) {
  const ajv2020Path = path.join(__dirname, '../../../node_modules/ajv/dist/2020');
  const ajvFormatsPath = path.join(__dirname, '../../../node_modules/ajv-formats');
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schemaDocument);
}

function fallbackTrustPacketValidator(packet) {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return false;
  if (!packet.packet_id || !packet.signal_id || !packet.decision_id) return false;
  if (!packet.response || !packet.counterfactual || !packet.outcome_plan || !packet.audit) return false;
  if (!trustPacketSchema.properties.counterfactual.properties.class.enum.includes(packet.counterfactual.class)) return false;
  if (!packet.counterfactual.prevented_wrong_answer) return false;
  const td010 = packet.audit.td_010;
  if (!td010 || td010.plaintext_email_stored !== false || td010.plaintext_phone_stored !== false) return false;
  return true;
}

const compiledTrustPacketValidator = compileWithAjv(trustPacketSchema);

function isTruthyEnv(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());
}

function resolveSink(configSink) {
  const sink = configSink || process.env.TRUST_PACKET_LOGGER_SINK || 'buffer';
  return TRUST_PACKET_SINKS.includes(sink) ? sink : 'buffer';
}

function reject(reason) {
  return { accepted: false, reason };
}

function td010(packet) {
  return packet && packet.audit && packet.audit.td_010;
}

function hasMandatoryCounterfactual(packet) {
  return Boolean(
    packet
      && packet.counterfactual
      && typeof packet.counterfactual.prevented_wrong_answer === 'string'
      && packet.counterfactual.prevented_wrong_answer.trim().length > 0,
  );
}

/**
 * Create a dormant-by-default Trust Packet logger with buffer/stdout/supabase sink selection.
 * emit() never throws to callers; validation problems resolve accepted=false, and infrastructure
 * exceptions are swallowed with a [TRUST] console prefix under Refusal 18 discipline.
 * @param {{enabled?: boolean, sink?: 'buffer'|'stdout'|'supabase'}} [config] Logger configuration.
 * @returns {{emit: Function, flush: Function, isEnabled: Function, getSink: Function, getBufferedCount: Function}}
 */
function createTrustPacketLogger(config = {}) {
  const buffer = [];
  let emittedCount = 0;
  let droppedCount = 0;
  const sink = resolveSink(config.sink);

  return {
    /**
     * Validate and emit a Trust Packet to the configured sink.
     * @param {object} packet Trust Packet v1.1 object.
     * @returns {Promise<{accepted: boolean, reason?: string}>} Acceptance result.
     */
    async emit(packet) {
      try {
        if (!hasMandatoryCounterfactual(packet)) {
          droppedCount += 1;
          return reject('counterfactual_missing_mandatory_field');
        }

        const compliance = td010(packet);
        if (
          compliance
          && (compliance.plaintext_email_stored === true || compliance.plaintext_phone_stored === true)
        ) {
          droppedCount += 1;
          return reject('td_010_violation');
        }

        const valid = compiledTrustPacketValidator
          ? compiledTrustPacketValidator(packet)
          : fallbackTrustPacketValidator(packet);
        if (!valid) {
          droppedCount += 1;
          return reject('schema_validation_failed');
        }

        if (!this.isEnabled()) {
          return { accepted: true, reason: 'logger_disabled' };
        }

        if (sink === 'buffer') {
          buffer.push(packet);
        } else if (sink === 'stdout') {
          console.log(`[TRUST] ${JSON.stringify(packet)}`);
        } else if (sink === 'supabase') {
          buffer.push(packet);
        }
        emittedCount += 1;
        return { accepted: true };
      } catch (error) {
        droppedCount += 1;
        console.error(`[TRUST] ${error.message}`);
        return reject('infrastructure_error');
      }
    },

    /**
     * Flush buffered Trust Packets or report stdout sink state; supabase wiring is intentionally future work.
     * @returns {Promise<{emitted_count: number, dropped_count: number, sink_state: object}>} Flush state.
     * @throws {NotImplementedError} For the dormant supabase sink until a future wiring PR.
     */
    async flush() {
      if (sink === 'supabase') {
        throw new NotImplementedError('supabase Trust Packet sink is not implemented');
      }
      const buffered_count = buffer.length;
      buffer.length = 0;
      return {
        emitted_count: emittedCount,
        dropped_count: droppedCount,
        sink_state: {
          sink,
          buffered_count,
        },
      };
    },

    /** @returns {boolean} Whether TRUST_PACKET_LOGGER_ENABLED/config enables emission. */
    isEnabled() {
      if (typeof config.enabled === 'boolean') return config.enabled;
      return isTruthyEnv(process.env.TRUST_PACKET_LOGGER_ENABLED);
    },

    /** @returns {'buffer'|'stdout'|'supabase'} Active sink name. */
    getSink() {
      return sink;
    },

    /** @returns {number} Current buffered packet count for test observability. */
    getBufferedCount() {
      return buffer.length;
    },
  };
}

module.exports = {
  TRUST_PACKET_SINKS,
  NotImplementedError,
  createTrustPacketLogger,
};
