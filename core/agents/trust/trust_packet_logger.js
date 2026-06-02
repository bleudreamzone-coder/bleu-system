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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function rejectAdditionalProperties(value, allowedProperties, label, errors) {
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowedProperties.includes(key)) errors.push(`${label} additional property ${key} not allowed`);
  }
}

function requireString(value, label, errors) {
  if (typeof value !== 'string' || value.length < 1) errors.push(`${label} required`);
}

function requireBoolean(value, label, errors) {
  if (typeof value !== 'boolean') errors.push(`${label} invalid`);
}

function requireNumberInRange(value, label, errors) {
  if (typeof value !== 'number' || value < 0 || value > 1) errors.push(`${label} invalid`);
}

function validateOutcomeCheckpoint(checkpoint, label, errors) {
  const statuses = trustPacketSchema.$defs.outcome_checkpoint.properties.status.enum;
  const allowedProperties = Object.keys(trustPacketSchema.$defs.outcome_checkpoint.properties);
  if (!isPlainObject(checkpoint)) {
    errors.push(`${label} object required`);
    return;
  }
  rejectAdditionalProperties(checkpoint, allowedProperties, label, errors);
  for (const field of trustPacketSchema.$defs.outcome_checkpoint.required) {
    if (checkpoint[field] === undefined) errors.push(`${label} missing ${field}`);
  }
  if (!statuses.includes(checkpoint.status)) errors.push(`${label} status invalid`);
  requireString(checkpoint.rationale, `${label} rationale`, errors);
  for (const optionalStringField of ['metric', 'owner']) {
    if (checkpoint[optionalStringField] !== undefined) requireString(checkpoint[optionalStringField], `${label} ${optionalStringField}`, errors);
  }
}

function validateStringArray(value, label, { minItems = 0 } = {}, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${label} array required`);
    return;
  }
  if (value.length < minItems) errors.push(`${label} must contain at least ${minItems} item(s)`);
  for (const item of value) requireString(item, `${label} item`, errors);
}

function fallbackTrustPacketValidator(packet) {
  const errors = [];
  const classes = trustPacketSchema.properties.counterfactual.properties.class.enum;
  if (!isPlainObject(packet)) errors.push('packet object required');
  for (const field of trustPacketSchema.required) {
    if (!packet || packet[field] === undefined) errors.push(`missing required property ${field}`);
  }
  rejectAdditionalProperties(packet, Object.keys(trustPacketSchema.properties), 'packet', errors);

  if (packet && packet.response) {
    const responseProperties = Object.keys(trustPacketSchema.properties.response.properties);
    rejectAdditionalProperties(packet.response, responseProperties, 'response', errors);
    for (const field of trustPacketSchema.properties.response.required) {
      if (packet.response[field] === undefined) errors.push(`response missing ${field}`);
    }
    requireString(packet.response.hash, 'response hash', errors);
    requireString(packet.response.model, 'response model', errors);
    if (!Number.isInteger(packet.response.word_count) || packet.response.word_count < 0) errors.push('response word_count invalid');
    requireBoolean(packet.response.evaluator_passed, 'response evaluator_passed', errors);
    if (Object.prototype.hasOwnProperty.call(packet.response, 'text')) errors.push('raw response text must not be persisted');
    if (packet.response.voice_scores !== undefined) {
      rejectAdditionalProperties(packet.response.voice_scores, Object.keys(trustPacketSchema.properties.response.properties.voice_scores.properties), 'response voice_scores', errors);
      for (const score of Object.values(packet.response.voice_scores || {})) requireNumberInRange(score, 'voice score', errors);
    }
  }

  if (packet && packet.counterfactual) {
    rejectAdditionalProperties(packet.counterfactual, Object.keys(trustPacketSchema.properties.counterfactual.properties), 'counterfactual', errors);
    for (const field of trustPacketSchema.properties.counterfactual.required) {
      if (packet.counterfactual[field] === undefined) errors.push(`counterfactual missing ${field}`);
    }
    if (!classes.includes(packet.counterfactual.class)) errors.push('invalid counterfactual class');
    requireString(packet.counterfactual.prevented_wrong_answer, 'prevented_wrong_answer', errors);
    requireString(packet.counterfactual.bleu_difference, 'bleu_difference', errors);
    requireNumberInRange(packet.counterfactual.confidence, 'confidence', errors);
  }

  if (packet && packet.outcome_plan) {
    rejectAdditionalProperties(packet.outcome_plan, Object.keys(trustPacketSchema.properties.outcome_plan.properties), 'outcome_plan', errors);
    for (const key of trustPacketSchema.properties.outcome_plan.required) {
      if (!packet.outcome_plan[key]) errors.push(`${key} required`);
      validateOutcomeCheckpoint(packet.outcome_plan[key], key, errors);
    }
  }

  if (packet && packet.audit) {
    rejectAdditionalProperties(packet.audit, Object.keys(trustPacketSchema.properties.audit.properties), 'audit', errors);
    for (const field of trustPacketSchema.properties.audit.required) {
      if (packet.audit[field] === undefined) errors.push(`audit missing ${field}`);
    }
    requireString(packet.audit.code_version, 'code_version', errors);
    validateStringArray(packet.audit.doctrine_refs, 'doctrine_refs', { minItems: 1 }, errors);
    if (!Array.isArray(packet.audit.refusals_checked)) {
      errors.push('refusals_checked array required');
    } else if (packet.audit.refusals_checked.some((item) => !Number.isInteger(item) || item < 1 || item > 20)) {
      errors.push('refusals_checked item invalid');
    }
    validateStringArray(packet.audit.pressures_countered, 'pressures_countered', {}, errors);
    if (packet.audit.td_010) {
      rejectAdditionalProperties(packet.audit.td_010, Object.keys(trustPacketSchema.properties.audit.properties.td_010.properties), 'td_010', errors);
      requireBoolean(packet.audit.td_010.pii_hashed, 'pii_hashed', errors);
      if (packet.audit.td_010.plaintext_email_stored !== false) errors.push('plaintext_email_stored blocked');
      if (packet.audit.td_010.plaintext_phone_stored !== false) errors.push('plaintext_phone_stored blocked');
    }
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
