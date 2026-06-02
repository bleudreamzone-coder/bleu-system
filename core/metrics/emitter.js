'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const metricEventSchema = require('../schemas/metric_event_v1.1.schema.json');
const { NotImplementedError } = require('../agents/_adapter');

const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');

const METRIC_EVENT_TYPES = Object.freeze([
  'chat_turn',
  'gate_fired',
  'refusal_triggered',
  'commerce_gate_state',
  'agent_invoked',
  'tool_invoked',
  'decision_emitted',
  'trust_packet_emitted',
  'error_caught',
]);

/**
 * Build an AJV validator when dependencies are present, otherwise use the local fallback.
 *
 * @returns {{validate: Function, errorsText: Function}} MetricEvent validator bundle.
 */
function createValidator() {
  if (fs.existsSync(`${ajv2020Path}.js`) && fs.existsSync(ajvFormatsPath)) {
    const Ajv2020 = require(ajv2020Path);
    const addFormats = require(ajvFormatsPath);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    return { validate: ajv.compile(metricEventSchema), errorsText: (errors) => ajv.errorsText(errors) };
  }

  return { validate: fallbackMetricEventValidator, errorsText: () => fallbackMetricEventValidator.errors.join(', ') };
}

/**
 * Fallback MetricEvent validator used only when AJV is unavailable.
 *
 * @param {Object} event Candidate MetricEvent.
 * @returns {boolean} True when the candidate satisfies the minimum MetricEvent contract.
 */
function fallbackMetricEventValidator(event) {
  const errors = [];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const hashedSession = /^h_[0-9a-f]{16}$/;

  if (!event || typeof event !== 'object' || Array.isArray(event)) errors.push('event must be object');
  if (event && !uuid.test(event.event_id || '')) errors.push('event_id must be uuid');
  if (event && !METRIC_EVENT_TYPES.includes(event.event_type)) errors.push('invalid event_type');
  if (event && !kebab.test(event.event_subtype || '')) errors.push('event_subtype must be kebab-case');
  if (event && !hashedSession.test(event.session_id || '')) errors.push('session_id must be hashed');
  if (event && event.citizen_id !== null && !uuid.test(event.citizen_id || '')) errors.push('citizen_id must be uuid or null');
  if (event && event.schema_version !== '1.1') errors.push('schema_version must be 1.1');
  if (event && Number.isNaN(Date.parse(event.occurred_at))) errors.push('occurred_at must be date-time');
  if (!event || !event.td_010_compliance || event.td_010_compliance.plaintext_email_stored !== false) errors.push('plaintext_email_stored must be false');
  if (!event || !event.td_010_compliance || event.td_010_compliance.plaintext_phone_stored !== false) errors.push('plaintext_phone_stored must be false');
  if (!event || !event.td_010_compliance || event.td_010_compliance.plaintext_phone_in_payload !== false) errors.push('plaintext_phone_in_payload must be false');
  if (!event || !event.event_data || typeof event.event_data !== 'object') errors.push('event_data must be object');

  const data = event && event.event_data ? event.event_data : {};
  if (event && event.event_type === 'chat_turn' && data.turn_index === undefined) errors.push('chat_turn missing turn_index');
  if (event && event.event_type === 'gate_fired' && !data.gate_name) errors.push('gate_fired missing gate_name');
  if (event && event.event_type === 'refusal_triggered' && !Number.isInteger(data.refusal_number)) errors.push('refusal_triggered missing refusal_number');
  if (event && event.event_type === 'commerce_gate_state' && typeof data.allowed !== 'boolean') errors.push('commerce_gate_state missing allowed');

  fallbackMetricEventValidator.errors = errors;
  return errors.length === 0;
}

fallbackMetricEventValidator.errors = [];

/**
 * Hash a raw session id into the TD-010 compliant h_ prefixed convention.
 *
 * @param {string} rawSessionId Raw caller/session identifier.
 * @returns {string} h_ prefixed SHA-256 digest truncated to 16 hexadecimal characters.
 */
function hashSessionId(rawSessionId) {
  const digest = crypto.createHash('sha256').update(String(rawSessionId || '')).digest('hex').slice(0, 16);
  return `h_${digest}`;
}

/**
 * Redact plaintext PII and common secret patterns from an error message.
 *
 * @param {unknown} message Error message candidate.
 * @returns {string} Redacted message safe for an error_caught metric payload.
 */
function redactErrorMessage(message) {
  return String(message || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]')
    .replace(/\b(?:sk|pk|rk|pat|key|api_key|token)_[A-Za-z0-9._-]+\b/g, '[REDACTED_SECRET]');
}

/**
 * Create a dormant-by-default MetricEvent emitter.
 *
 * The returned emitter validates events, writes only to the configured shadow sink, and swallows every
 * schema/sink/runtime error with a [METRICS] log prefix so metrics can never break production callers.
 *
 * @param {Object} config Future emitter configuration placeholder.
 * @returns {{emit: Function, flush: Function, getBufferedCount: Function, getSink: Function, isEnabled: Function}} Emitter API.
 */
function createMetricEmitter(config = {}) {
  const buffer = [];
  const validator = createValidator();
  let emittedCount = 0;
  let droppedCount = 0;

  /**
   * Return whether runtime metrics emission has been explicitly enabled.
   *
   * @returns {boolean} True only when METRIC_EMITTER_ENABLED is exactly "true".
   */
  function isEnabled() {
    return process.env.METRIC_EMITTER_ENABLED === 'true';
  }

  /**
   * Return the configured metrics sink name.
   *
   * @returns {'stdout'|'buffer'|'supabase'} Metrics sink, defaulting to buffer for no-I/O shadow mode.
   */
  function getSink() {
    const sink = process.env.METRIC_EMITTER_SINK || config.sink || 'buffer';
    return ['stdout', 'buffer', 'supabase'].includes(sink) ? sink : 'buffer';
  }

  /**
   * Return the number of events currently held by the test-observable in-memory buffer.
   *
   * @returns {number} Buffered event count.
   */
  function getBufferedCount() {
    return buffer.length;
  }

  /**
   * Emit a MetricEvent to the configured shadow sink without ever throwing to the caller.
   *
   * @param {Object} event MetricEvent candidate.
   * @returns {Promise<void>} Resolves even when validation or sink behavior fails.
   */
  async function emit(event) {
    try {
      if (!validator.validate(event)) {
        droppedCount += 1;
        const eventId = event && event.event_id ? event.event_id : 'unknown';
        console.error(`[METRICS] schema validation failed for event_id=${eventId}: ${validator.errorsText(validator.validate.errors)}`);
        return;
      }

      const sink = getSink();
      if (sink === 'supabase') {
        throw new NotImplementedError('MetricEvent Supabase sink not yet wired');
      }

      buffer.push(event);
      emittedCount += 1;
      if (sink === 'stdout') console.log(`[METRICS] ${JSON.stringify(event)}`);
    } catch (error) {
      droppedCount += 1;
      console.error(`[METRICS] emission dropped: ${redactErrorMessage(error && error.message ? error.message : error)}`);
    }
  }

  /**
   * Flush the in-memory MetricEvent buffer and return emission counters.
   *
   * @returns {Promise<{emitted_count: number, dropped_count: number}>} Counters accumulated since emitter creation.
   */
  async function flush() {
    try {
      const counters = { emitted_count: emittedCount, dropped_count: droppedCount };
      buffer.splice(0, buffer.length);
      return counters;
    } catch (error) {
      console.error(`[METRICS] flush failed: ${redactErrorMessage(error && error.message ? error.message : error)}`);
      return { emitted_count: emittedCount, dropped_count: droppedCount };
    }
  }

  return Object.freeze({ emit, flush, getBufferedCount, getSink, isEnabled });
}

module.exports = { METRIC_EVENT_TYPES, createMetricEmitter, hashSessionId, redactErrorMessage };
