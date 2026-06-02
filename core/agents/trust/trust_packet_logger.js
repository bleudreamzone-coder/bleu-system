const fs = require('node:fs');
const path = require('node:path');

const schemaPath = path.join(__dirname, '../../schemas/trust_packet_v1.1.schema.json');
const trustPacketSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

/**
 * Supported Trust Packet logger sink modes.
 *
 * @type {ReadonlyArray<'buffer'|'stdout'|'supabase'>}
 */
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
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackTrustPacketValidator(packet) {
  const errors = [];
  const classes = trustPacketSchema.properties.counterfactual.properties.class.enum;
  if (!packet || typeof packet !== 'object') errors.push('packet object required');
  for (const field of trustPacketSchema.required) {
    if (!packet || packet[field] === undefined) errors.push(`missing required property ${field}`);
  }
  if (packet && packet.counterfactual) {
    for (const field of trustPacketSchema.properties.counterfactual.required) {
      if (packet.counterfactual[field] === undefined) errors.push(`counterfactual missing ${field}`);
    }
    if (!classes.includes(packet.counterfactual.class)) errors.push('invalid counterfactual class');
    if (typeof packet.counterfactual.prevented_wrong_answer !== 'string' || packet.counterfactual.prevented_wrong_answer.length < 1) {
      errors.push('prevented_wrong_answer required');
    }
    if (typeof packet.counterfactual.bleu_difference !== 'string' || packet.counterfactual.bleu_difference.length < 1) {
      errors.push('bleu_difference required');
    }
    if (typeof packet.counterfactual.confidence !== 'number' || packet.counterfactual.confidence < 0 || packet.counterfactual.confidence > 1) {
      errors.push('confidence invalid');
    }
  }
  if (packet && packet.audit && packet.audit.td_010) {
    if (packet.audit.td_010.plaintext_email_stored !== false) errors.push('plaintext_email_stored blocked');
    if (packet.audit.td_010.plaintext_phone_stored !== false) errors.push('plaintext_phone_stored blocked');
  }
  fallbackTrustPacketValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(trustPacketSchema);
const validateTrustPacket = compiled ? compiled.validate : fallbackTrustPacketValidator;

function safeReject(reason) {
  return { accepted: false, reason };
}

function hasMissingMandatoryCounterfactual(packet) {
  return !packet
    || !packet.counterfactual
    || typeof packet.counterfactual.prevented_wrong_answer !== 'string'
    || packet.counterfactual.prevented_wrong_answer.length < 1;
}

function hasTd010Violation(packet) {
  const td010 = packet && (packet.td_010_compliance || (packet.audit && packet.audit.td_010));
  return Boolean(td010 && (td010.plaintext_email_stored === true || td010.plaintext_phone_stored === true));
}

function safeLogTrustError(error) {
  try {
    console.error('[TRUST] Trust Packet logger dropped packet:', error && error.message ? error.message : String(error));
  } catch (_) {
    // Refusal 18: never let logging failures escape the logger.
  }
}

/**
 * Create a dormant-by-default Trust Packet logger.
 *
 * The logger validates Trust Packet v1.1 records, enforces the mandatory
 * Counterfactual proof field and TD-010 plaintext guards, and never throws from
 * emit(). Caller errors resolve with accepted=false; infrastructure errors are
 * swallowed, logged with [TRUST], and dropped per Refusal 18.
 *
 * @param {{sink?: 'buffer'|'stdout'|'supabase'}} [config={}] - Logger configuration.
 * @returns {{emit: function(object): Promise<{accepted: boolean, reason: (string|null)}>, flush: function(): Promise<{emitted_count: number, dropped_count: number, sink_state: string}>, isEnabled: function(): boolean, getSink: function(): string, getBufferedCount: function(): number}} Trust Packet logger instance.
 */
function createTrustPacketLogger(config = {}) {
  const configuredSink = config && TRUST_PACKET_SINKS.includes(config.sink) ? config.sink : process.env.TRUST_PACKET_LOGGER_SINK;
  const sink = TRUST_PACKET_SINKS.includes(configuredSink) ? configuredSink : 'buffer';
  const buffer = [];
  let emittedCount = 0;
  let droppedCount = 0;

  return {
    /**
     * Emit one Trust Packet to the configured sink without throwing to caller.
     *
     * @param {object} packet - Trust Packet candidate.
     * @returns {Promise<{accepted: boolean, reason: (string|null)}>} Acceptance result.
     */
    async emit(packet) {
      try {
        if (hasMissingMandatoryCounterfactual(packet)) {
          droppedCount += 1;
          return safeReject('counterfactual_missing_mandatory_field');
        }
        if (hasTd010Violation(packet)) {
          droppedCount += 1;
          return safeReject('td_010_violation');
        }
        if (!validateTrustPacket(packet)) {
          droppedCount += 1;
          return safeReject('schema_validation_failed');
        }
        if (sink === 'supabase') {
          buffer.push(packet);
          emittedCount += 1;
          return { accepted: true, reason: null };
        }
        if (sink === 'stdout') {
          process.stdout.write(`[TRUST] ${JSON.stringify(packet)}\n`);
        }
        buffer.push(packet);
        emittedCount += 1;
        return { accepted: true, reason: null };
      } catch (error) {
        droppedCount += 1;
        safeLogTrustError(error);
        return safeReject('infrastructure_error');
      }
    },

    /**
     * Flush buffered Trust Packets and return sink counters.
     *
     * Supabase writes are intentionally not implemented until a future PR wires
     * persistence after retention-policy signoff and migration application.
     *
     * @returns {Promise<{emitted_count: number, dropped_count: number, sink_state: string}>} Flush state.
     * @throws {NotImplementedError} For the dormant supabase sink only.
     */
    async flush() {
      if (sink === 'supabase') {
        throw new NotImplementedError('supabase Trust Packet sink is not implemented');
      }
      const snapshot = {
        emitted_count: emittedCount,
        dropped_count: droppedCount,
        sink_state: sink,
      };
      buffer.length = 0;
      return snapshot;
    },

    /**
     * Return whether Trust Packet logger activation is explicitly enabled.
     *
     * @returns {boolean} True only when TRUST_PACKET_LOGGER_ENABLED is exactly "true".
     */
    isEnabled() {
      return process.env.TRUST_PACKET_LOGGER_ENABLED === 'true';
    },

    /**
     * Return the configured sink, defaulting to in-memory buffer.
     *
     * @returns {'buffer'|'stdout'|'supabase'} Logger sink.
     */
    getSink() {
      return sink;
    },

    /**
     * Return the number of currently buffered Trust Packets for tests.
     *
     * @returns {number} Current buffer length.
     */
    getBufferedCount() {
      return buffer.length;
    },
  };
}

module.exports = {
  TRUST_PACKET_SINKS,
  createTrustPacketLogger,
};
