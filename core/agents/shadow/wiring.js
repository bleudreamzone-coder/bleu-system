// STATUS: DORMANT — shadow wiring scaffold only; not imported by server.js.
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const schemaPath = path.join(__dirname, '../../schemas/shadow_comparison_v1.0.schema.json');
const ajv2020Path = path.join(__dirname, '../../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../../node_modules/ajv-formats');
const shadowComparisonSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

/** Frozen list of supported shadow wiring comparison sinks. */
const SHADOW_WIRING_SINKS = Object.freeze(['buffer', 'stdout', 'supabase']);

const AGENT_TIERS = Object.freeze(['tier_1_captain', 'tier_2_felicia', 'tier_3_felicia_autonomous', 'tier_infrastructure']);
const CLINICAL_AGENT_TIERS = Object.freeze(['tier_2_felicia', 'tier_3_felicia_autonomous']);
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_64 = /^[a-f0-9]{64}$/;

/**
 * Log an infrastructure error without allowing shadow wiring to affect production behavior.
 *
 * @param {*} error Error-like value to log.
 * @returns {void}
 */
function logShadowWiringError(error) {
  try {
    const message = error && error.stack ? error.stack : String(error);
    console.error(`[SHADOW_WIRING] ${message}`);
  } catch (_ignored) {
    // Refusal 18: logging failures cannot break production.
  }
}

/**
 * Compile the ShadowComparisonResult schema with AJV when local dev dependencies are installed.
 *
 * @returns {{validate: Function, errorsText: Function}|null} AJV helpers, or null when unavailable.
 */
function compileComparisonValidator() {
  try {
    if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
    const Ajv2020 = require(ajv2020Path);
    const addFormats = require(ajvFormatsPath);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    return { validate: ajv.compile(shadowComparisonSchema), errorsText: (errors) => ajv.errorsText(errors) };
  } catch (error) {
    logShadowWiringError(error);
    return null;
  }
}

const compiledComparisonValidator = compileComparisonValidator();

/**
 * Validate ShadowComparisonResult records when AJV is unavailable.
 *
 * @param {*} record Candidate comparison record.
 * @returns {boolean} True when the fallback schema subset passes.
 */
function fallbackComparisonValidator(record) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) errors.push('record must be object');
  if (errors.length === 0) {
    for (const field of shadowComparisonSchema.required) {
      if (record[field] === undefined) errors.push(`missing required property ${field}`);
    }
    if (typeof record.comparison_id !== 'string' || !UUID.test(record.comparison_id)) errors.push('comparison_id must be uuid');
    if (record.schema_version !== '1.0') errors.push('schema_version must be 1.0');
    if (typeof record.signal_id !== 'string' || !UUID.test(record.signal_id)) errors.push('signal_id must be uuid');
    if (typeof record.production_response_hash !== 'string' || !HEX_64.test(record.production_response_hash)) errors.push('production_response_hash must be 64 hex chars');
    if (!Number.isInteger(record.production_word_count) || record.production_word_count < 0) errors.push('production_word_count must be integer >= 0');
    if (typeof record.shadow_response_hash !== 'string' || !HEX_64.test(record.shadow_response_hash)) errors.push('shadow_response_hash must be 64 hex chars');
    if (!Number.isInteger(record.shadow_word_count) || record.shadow_word_count < 0) errors.push('shadow_word_count must be integer >= 0');
    if (typeof record.hashes_match !== 'boolean') errors.push('hashes_match must be boolean');
    if (!Number.isInteger(record.word_count_delta)) errors.push('word_count_delta must be integer');
    if (record.hashes_match === true && record.word_count_delta !== 0) errors.push('hashes_match true requires word_count_delta 0');
    if (typeof record.agent_id !== 'string' || record.agent_id.length < 3 || !KEBAB_CASE.test(record.agent_id)) errors.push('agent_id must be kebab-case minLength 3');
    if (!AGENT_TIERS.includes(record.agent_tier)) errors.push('invalid agent_tier');
    if (typeof record.observation_window_id !== 'string' || record.observation_window_id.length < 1) errors.push('observation_window_id required');
    if (typeof record.observed_at !== 'string' || Number.isNaN(Date.parse(record.observed_at))) errors.push('observed_at must be date-time');
    if (!validTd010(record.td_010_compliance)) errors.push('invalid td_010_compliance');
    if (!Object.keys(record).every((key) => shadowComparisonSchema.required.includes(key))) errors.push('additional top-level property');
  }
  fallbackComparisonValidator.errors = errors;
  return errors.length === 0;
}

/**
 * Return whether TD-010 compliance fields prove hash-only storage.
 *
 * @param {*} td010 Candidate TD-010 compliance object.
 * @returns {boolean} True when comparison records store no raw text or plaintext phone/email fields.
 */
function validTd010(td010) {
  return Boolean(
    td010 &&
    typeof td010 === 'object' &&
    !Array.isArray(td010) &&
    td010.pii_hashed === true &&
    td010.plaintext_email_stored === false &&
    td010.plaintext_phone_stored === false &&
    td010.contains_raw_response_text === false &&
    Object.keys(td010).every((key) => ['pii_hashed', 'plaintext_email_stored', 'plaintext_phone_stored', 'contains_raw_response_text'].includes(key))
  );
}

/**
 * Validate a completed comparison record against the JSON Schema contract.
 *
 * @param {Object} record Candidate ShadowComparisonResult.
 * @returns {{valid: boolean, reason: string|null}} Validation result with stable reason text.
 */
function validateComparisonRecord(record) {
  try {
    const validate = compiledComparisonValidator ? compiledComparisonValidator.validate : fallbackComparisonValidator;
    if (validate(record)) return { valid: true, reason: null };
    const reason = compiledComparisonValidator
      ? compiledComparisonValidator.errorsText(validate.errors)
      : (fallbackComparisonValidator.errors || []).join(', ');
    return { valid: false, reason: reason || 'schema_validation_failed' };
  } catch (error) {
    logShadowWiringError(error);
    return { valid: false, reason: 'schema_validation_failed' };
  }
}

/**
 * Hash response text with an inline SHA-256 hasher so this PR is independent of future Trust Packet plumbing.
 *
 * @param {*} value Response text or value to stringify.
 * @returns {string} Lowercase SHA-256 hex digest.
 */
function hashResponse(value) {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex');
}

/**
 * Count whitespace-delimited words in a response string.
 *
 * @param {*} value Response text or value to stringify.
 * @returns {number} Non-negative word count.
 */
function countWords(value) {
  const text = String(value ?? '').trim();
  if (text.length === 0) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Return a Signal UUID from the Signal object or a direct signal id string.
 *
 * @param {*} signal Signal object or UUID string.
 * @returns {string|null} UUID string when present and valid-looking, otherwise null.
 */
function extractSignalId(signal) {
  if (typeof signal === 'string' && UUID.test(signal)) return signal;
  if (signal && typeof signal === 'object') {
    if (typeof signal.signal_id === 'string' && UUID.test(signal.signal_id)) return signal.signal_id;
    if (typeof signal.id === 'string' && UUID.test(signal.id)) return signal.id;
  }
  return null;
}

/**
 * Return a valid sink name from config or safe default.
 *
 * @param {Object} config Shadow wiring config.
 * @returns {string} One of SHADOW_WIRING_SINKS.
 */
function normalizeSink(config) {
  const configured = config && typeof config.sink === 'string' ? config.sink : process.env.SHADOW_WIRING_SINK;
  return SHADOW_WIRING_SINKS.includes(configured) ? configured : 'buffer';
}

/**
 * Validate a proposed shadow agent subscription request.
 *
 * @param {Object} request Registration request.
 * @param {Object} config Shadow wiring config.
 * @returns {{valid: boolean, reason: string|null}} Validation result.
 */
function validateRegistrationRequest(request, config) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) return { valid: false, reason: 'invalid_registration_request' };
  if (typeof request.agentId !== 'string' || request.agentId.length < 3 || !KEBAB_CASE.test(request.agentId)) return { valid: false, reason: 'invalid_agent_id' };
  if (!AGENT_TIERS.includes(request.agentTier)) return { valid: false, reason: 'invalid_agent_tier' };
  if (!validObservationFilter(request.observationFilter)) return { valid: false, reason: 'invalid_observation_filter' };
  if (CLINICAL_AGENT_TIERS.includes(request.agentTier) && !config.felicia_signoff_doc) {
    return { valid: false, reason: 'clinical_agent_requires_felicia_signoff' };
  }
  return { valid: true, reason: null };
}

/**
 * Validate the optional observation filter shape without making future filter keys impossible.
 *
 * @param {*} observationFilter Optional shadow observation filter.
 * @returns {boolean} True when absent or object-shaped with known array filters correctly typed.
 */
function validObservationFilter(observationFilter) {
  if (observationFilter === undefined) return true;
  if (!observationFilter || typeof observationFilter !== 'object' || Array.isArray(observationFilter)) return false;
  const knownArrayKeys = ['variant_tags', 'gates_required', 'agent_ids', 'signal_risk_flags'];
  return knownArrayKeys.every((key) => observationFilter[key] === undefined || Array.isArray(observationFilter[key]));
}

/**
 * Create a dormant shadow wiring facade for registering shadow agents and recording hash-only comparisons.
 *
 * @param {Object} [config={}] Shadow wiring dependencies and controls.
 * @param {string} [config.sink] Optional sink override: buffer, stdout, or supabase.
 * @param {Object} [config.supabaseClient] Optional Supabase client for future persistence.
 * @param {string} [config.felicia_signoff_doc] Required before tier_2 or tier_3 agent registration succeeds.
 * @returns {{registerShadowAgent: Function, getActiveSubscriptions: Function, getSubscriptionCount: Function, observeAndCompare: Function, getComparisons: Function, getDivergenceCount: Function, clearBuffer: Function, isEnabled: Function, getSink: Function}} Safe shadow wiring facade.
 */
function createShadowWiring(config = {}) {
  const safeConfig = config && typeof config === 'object' ? { ...config } : {};
  const sink = normalizeSink(safeConfig);
  const subscriptions = [];
  const comparisons = [];

  return {
    /**
     * Register a shadow agent subscription without invoking the agent or changing production behavior.
     *
     * @param {Object} request Registration request.
     * @param {string} request.agentId Kebab-case agent id.
     * @param {string} request.agentTier Agent authority tier.
     * @param {Object} [request.observationFilter] Optional filter for future Shadow Runner windows.
     * @returns {Promise<{registered: boolean, subscription_id: string|null, reason: string|null}>} Registration result.
     */
    async registerShadowAgent(request) {
      try {
        const validation = validateRegistrationRequest(request, safeConfig);
        if (!validation.valid) return { registered: false, subscription_id: null, reason: validation.reason };
        const subscription = Object.freeze({
          subscription_id: crypto.randomUUID(),
          agent_id: request.agentId,
          agent_tier: request.agentTier,
          observation_filter: Object.freeze({ ...(request.observationFilter || {}) }),
          registered_at: new Date().toISOString(),
        });
        subscriptions.push(subscription);
        return { registered: true, subscription_id: subscription.subscription_id, reason: null };
      } catch (error) {
        logShadowWiringError(error);
        return { registered: false, subscription_id: null, reason: 'infrastructure_error' };
      }
    },

    /**
     * Return active subscriptions as a defensive copy.
     *
     * @returns {Array<Object>} Registered shadow agent subscriptions.
     */
    getActiveSubscriptions() {
      try {
        return subscriptions.map((subscription) => ({ ...subscription, observation_filter: { ...subscription.observation_filter } }));
      } catch (error) {
        logShadowWiringError(error);
        return [];
      }
    },

    /**
     * Return the number of active shadow agent subscriptions.
     *
     * @returns {number} Subscription count.
     */
    getSubscriptionCount() {
      try {
        return subscriptions.length;
      } catch (error) {
        logShadowWiringError(error);
        return 0;
      }
    },

    /**
     * Compare production and shadow responses for one Signal using hashes and word counts only.
     *
     * @param {Object} request Comparison request.
     * @param {Object|string} request.signal Signal object with signal_id, or UUID string.
     * @param {*} request.productionResponse Production response text; never persisted.
     * @param {*} request.shadowResponse Shadow response text; never persisted.
     * @param {string} request.observationWindowId Shadow Runner observation window reference.
     * @param {string} request.agentId Shadow agent id.
     * @param {string} request.agentTier Shadow agent tier.
     * @returns {Promise<{recorded: boolean, comparison_id: string|null, reason: string|null}>} Recording result.
     */
    async observeAndCompare(request) {
      try {
        const req = request && typeof request === 'object' ? request : {};
        const signalId = extractSignalId(req.signal);
        if (!signalId) return { recorded: false, comparison_id: null, reason: 'invalid_signal_id' };
        if (typeof req.agentId !== 'string' || req.agentId.length < 3 || !KEBAB_CASE.test(req.agentId)) {
          return { recorded: false, comparison_id: null, reason: 'invalid_agent_id' };
        }
        if (!AGENT_TIERS.includes(req.agentTier)) return { recorded: false, comparison_id: null, reason: 'invalid_agent_tier' };
        if (typeof req.observationWindowId !== 'string' || req.observationWindowId.length < 1) {
          return { recorded: false, comparison_id: null, reason: 'invalid_observation_window_id' };
        }

        const productionHash = hashResponse(req.productionResponse);
        const shadowHash = hashResponse(req.shadowResponse);
        const productionWordCount = countWords(req.productionResponse);
        const shadowWordCount = countWords(req.shadowResponse);
        const record = Object.freeze({
          comparison_id: crypto.randomUUID(),
          schema_version: '1.0',
          signal_id: signalId,
          production_response_hash: productionHash,
          production_word_count: productionWordCount,
          shadow_response_hash: shadowHash,
          shadow_word_count: shadowWordCount,
          hashes_match: productionHash === shadowHash,
          word_count_delta: shadowWordCount - productionWordCount,
          agent_id: req.agentId,
          agent_tier: req.agentTier,
          observation_window_id: req.observationWindowId,
          observed_at: new Date().toISOString(),
          td_010_compliance: Object.freeze({
            pii_hashed: true,
            plaintext_email_stored: false,
            plaintext_phone_stored: false,
            contains_raw_response_text: false,
          }),
        });

        const validation = validateComparisonRecord(record);
        if (!validation.valid) return { recorded: false, comparison_id: null, reason: validation.reason || 'schema_validation_failed' };

        if (sink === 'supabase') {
          if (!safeConfig.supabaseClient) return { recorded: false, comparison_id: null, reason: 'supabase_sink_not_configured' };
          const result = await safeConfig.supabaseClient.from('shadow_comparisons').insert(record);
          if (result && result.error) return { recorded: false, comparison_id: null, reason: 'supabase_insert_failed' };
        } else if (sink === 'stdout') {
          console.log(JSON.stringify({ type: 'shadow_comparison', comparison: record }));
        } else {
          comparisons.push(record);
        }

        return { recorded: true, comparison_id: record.comparison_id, reason: null };
      } catch (error) {
        logShadowWiringError(error);
        return { recorded: false, comparison_id: null, reason: 'infrastructure_error' };
      }
    },

    /**
     * Return buffer-sink comparisons as a defensive copy for tests only.
     *
     * @returns {Array<Object>} Recorded comparison records from the local buffer sink.
     */
    getComparisons() {
      try {
        return comparisons.map((comparison) => ({ ...comparison, td_010_compliance: { ...comparison.td_010_compliance } }));
      } catch (error) {
        logShadowWiringError(error);
        return [];
      }
    },

    /**
     * Count recorded divergences where production and shadow response hashes differ.
     *
     * @returns {number} Divergence count for the local buffer sink.
     */
    getDivergenceCount() {
      try {
        return comparisons.filter((comparison) => comparison.hashes_match === false).length;
      } catch (error) {
        logShadowWiringError(error);
        return 0;
      }
    },

    /**
     * Clear the testing buffer; Supabase sink intentionally refuses test-only clearing.
     *
     * @returns {Promise<{cleared_count: number}>} Number of buffer records removed.
     */
    async clearBuffer() {
      if (sink === 'supabase') throw new Error('clearBuffer unavailable for supabase sink');
      try {
        const cleared = comparisons.length;
        comparisons.length = 0;
        return { cleared_count: cleared };
      } catch (error) {
        logShadowWiringError(error);
        return { cleared_count: 0 };
      }
    },

    /**
     * Report whether shadow wiring is explicitly enabled by environment.
     *
     * @returns {boolean} True only when SHADOW_WIRING_ENABLED is exactly "true".
     */
    isEnabled() {
      try {
        return process.env.SHADOW_WIRING_ENABLED === 'true';
      } catch (error) {
        logShadowWiringError(error);
        return false;
      }
    },

    /**
     * Return the configured shadow comparison sink.
     *
     * @returns {string} One of SHADOW_WIRING_SINKS.
     */
    getSink() {
      try {
        return sink;
      } catch (error) {
        logShadowWiringError(error);
        return 'buffer';
      }
    },
  };
}

module.exports = { createShadowWiring, SHADOW_WIRING_SINKS };
