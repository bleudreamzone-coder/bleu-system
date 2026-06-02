// STATUS: DORMANT — model router scaffold only; not imported by server.js.
'use strict';

const fs = require('node:fs');

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MODEL_TIER_LABELS = Object.freeze(['fast', 'balanced', 'deep', 'specialized']);
const MODEL_PROVIDERS = Object.freeze(['openai', 'anthropic', 'local', 'stub']);

/**
 * Recursively freeze a value so registered model specs cannot mutate after registration.
 *
 * @param {*} value Value to freeze.
 * @returns {*} The same frozen value.
 */
function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return value;
}

/**
 * Assert that a field is an object rather than null or an array.
 *
 * @param {*} value Candidate value.
 * @param {string} label Human-readable label for error text.
 * @returns {void}
 */
function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

/**
 * Assert that an integer field satisfies an inclusive or exclusive lower bound.
 *
 * @param {*} value Candidate value.
 * @param {string} field Field name.
 * @param {number} min Lower bound.
 * @param {boolean} exclusive Whether the lower bound is exclusive.
 * @returns {void}
 */
function assertIntegerMinimum(value, field, min, exclusive = false) {
  if (!Number.isInteger(value) || (exclusive ? value <= min : value < min)) {
    throw new TypeError(`${field} must be an integer ${exclusive ? '>' : '>='} ${min}`);
  }
}

/**
 * Assert that a number field satisfies a minimum value.
 *
 * @param {*} value Candidate value.
 * @param {string} field Field name.
 * @param {number} min Minimum value.
 * @returns {void}
 */
function assertNumberMinimum(value, field, min) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < min) {
    throw new TypeError(`${field} must be a number >= ${min}`);
  }
}

/**
 * Validate the ModelSpec shape used by the dormant model registry.
 *
 * @param {Object} modelSpec Candidate ModelSpec record.
 * @throws {TypeError} When the record fails validation.
 * @returns {void}
 */
function validateModelSpec(modelSpec) {
  assertObject(modelSpec, 'ModelSpec');
  const required = [
    'model_id',
    'provider',
    'tier_label',
    'latency_p50_ms',
    'latency_p95_ms',
    'cost_per_1k_input_tokens_usd',
    'cost_per_1k_output_tokens_usd',
    'max_context_tokens',
    'max_output_tokens',
    'capabilities',
    'clinical_appropriate',
    'registered_at',
    'audit_doc',
  ];

  for (const field of required) {
    if (modelSpec[field] === undefined) throw new TypeError(`ModelSpec missing required field: ${field}`);
  }

  if (typeof modelSpec.model_id !== 'string' || !KEBAB_CASE.test(modelSpec.model_id)) {
    throw new TypeError('model_id must be kebab-case');
  }
  if (!MODEL_PROVIDERS.includes(modelSpec.provider)) throw new TypeError('provider is invalid');
  if (!MODEL_TIER_LABELS.includes(modelSpec.tier_label)) throw new TypeError('tier_label is invalid');
  assertIntegerMinimum(modelSpec.latency_p50_ms, 'latency_p50_ms', 0);
  assertIntegerMinimum(modelSpec.latency_p95_ms, 'latency_p95_ms', modelSpec.latency_p50_ms);
  assertNumberMinimum(modelSpec.cost_per_1k_input_tokens_usd, 'cost_per_1k_input_tokens_usd', 0);
  assertNumberMinimum(modelSpec.cost_per_1k_output_tokens_usd, 'cost_per_1k_output_tokens_usd', 0);
  assertIntegerMinimum(modelSpec.max_context_tokens, 'max_context_tokens', 0, true);
  assertIntegerMinimum(modelSpec.max_output_tokens, 'max_output_tokens', 0, true);
  if (!Array.isArray(modelSpec.capabilities) || modelSpec.capabilities.some((capability) => typeof capability !== 'string')) {
    throw new TypeError('capabilities must be an array of strings');
  }
  if (typeof modelSpec.clinical_appropriate !== 'boolean') throw new TypeError('clinical_appropriate must be a boolean');
  if (typeof modelSpec.registered_at !== 'string' || Number.isNaN(Date.parse(modelSpec.registered_at))) {
    throw new TypeError('registered_at must be a date-time string');
  }
  if (typeof modelSpec.audit_doc !== 'string' || modelSpec.audit_doc.length < 1) {
    throw new TypeError('audit_doc must be a non-empty string');
  }
  if (modelSpec.felicia_signoff_doc !== undefined && typeof modelSpec.felicia_signoff_doc !== 'string') {
    throw new TypeError('felicia_signoff_doc must be a string when provided');
  }
}

/**
 * Validate that a clinical model approval has an existing Dr. Felicia signoff document.
 *
 * @param {Object} modelSpec Candidate ModelSpec record.
 * @throws {Error} When clinical_appropriate=true lacks a real signoff path.
 * @returns {void}
 */
function enforceFeliciaClinicalSignoff(modelSpec) {
  if (modelSpec.clinical_appropriate !== true) return;
  if (typeof modelSpec.felicia_signoff_doc !== 'string' || modelSpec.felicia_signoff_doc.length < 1) {
    throw new Error('Felicia signoff doc required before clinical_appropriate model registration');
  }
  if (!fs.existsSync(modelSpec.felicia_signoff_doc)) {
    throw new Error('Felicia signoff doc must reference a real signoff doc path');
  }
}

/**
 * Create an empty, dormant Model Registry for future model registration audit PRs.
 *
 * @returns {{register: Function, get: Function, list: Function, count: Function}} Empty frozen registry facade.
 */
function createModelRegistry() {
  const registrations = new Map();

  return Object.freeze({
    /**
     * Validate and insert a ModelSpec into this in-memory registry.
     *
     * @param {Object} modelSpec ModelSpec record.
     * @throws {TypeError} When shape validation fails.
     * @throws {Error} When clinical_appropriate=true lacks a real Felicia signoff doc.
     * @returns {Object} Frozen registered model specification.
     */
    register(modelSpec) {
      validateModelSpec(modelSpec);
      enforceFeliciaClinicalSignoff(modelSpec);
      const frozenSpec = deepFreeze(structuredClone(modelSpec));
      registrations.set(frozenSpec.model_id, frozenSpec);
      return frozenSpec;
    },

    /**
     * Return one frozen ModelSpec by id.
     *
     * @param {string} modelId Kebab-case model id.
     * @returns {Object|undefined} Frozen ModelSpec, or undefined when absent.
     */
    get(modelId) {
      return registrations.get(modelId);
    },

    /**
     * List registered models, optionally filtered by tier, provider, or capability tag.
     *
     * @param {{tier_label?: string, provider?: string, capability?: string}} [filter={}] Optional list filter.
     * @returns {Array<Object>} Frozen ModelSpec records matching the filter.
     */
    list(filter = {}) {
      const criteria = filter && typeof filter === 'object' && !Array.isArray(filter) ? filter : {};
      return Array.from(registrations.values()).filter((spec) => {
        if (criteria.tier_label !== undefined && spec.tier_label !== criteria.tier_label) return false;
        if (criteria.provider !== undefined && spec.provider !== criteria.provider) return false;
        if (criteria.capability !== undefined && !spec.capabilities.includes(criteria.capability)) return false;
        return true;
      });
    },

    /**
     * Return the number of registered models.
     *
     * @returns {number} Registry size.
     */
    count() {
      return registrations.size;
    },
  });
}

module.exports = { createModelRegistry };
