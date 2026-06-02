// STATUS: DORMANT — model router scaffold only; not imported by server.js.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { NotImplementedError } = require('../_adapter');
const { createModelRegistry } = require('./model_registry');

const schemaPath = path.join(__dirname, '../../schemas/model_routing_decision_v1.1.schema.json');
const ajv2020Path = path.join(__dirname, '../../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../../node_modules/ajv-formats');
const modelRoutingDecisionSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

/** Frozen model tier labels supported by the dormant Model Router. */
const MODEL_TIER_LABELS = Object.freeze(['fast', 'balanced', 'deep', 'specialized']);

/** Frozen model providers supported by the dormant Model Router schema. */
const MODEL_PROVIDERS = Object.freeze(['openai', 'anthropic', 'local', 'stub']);

/** Frozen complexity hints accepted by routing requests. */
const COMPLEXITY_HINTS = Object.freeze(['trivial', 'simple', 'moderate', 'complex', 'deep_reasoning']);

const AGENT_TIERS = Object.freeze(['tier_1_captain', 'tier_2_felicia', 'tier_3_felicia_autonomous', 'tier_infrastructure']);
const CLINICAL_AGENT_TIERS = Object.freeze(['tier_2_felicia', 'tier_3_felicia_autonomous']);
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
const COMPLEXITY_TIER_ORDER = Object.freeze({
  trivial: Object.freeze(['fast']),
  simple: Object.freeze(['fast', 'balanced']),
  moderate: Object.freeze(['balanced']),
  complex: Object.freeze(['balanced', 'deep']),
  deep_reasoning: Object.freeze(['deep', 'specialized']),
});

/**
 * Router-specific caller error with a stable machine-readable code.
 */
class RoutingError extends Error {
  /**
   * Create a RoutingError.
   *
   * @param {string} code Stable error code.
   * @param {string} message Human-readable error message.
   */
  constructor(code, message) {
    super(message);
    this.name = 'RoutingError';
    this.code = code;
  }
}

/**
 * Create an AJV decision validator when local dev dependencies are installed.
 *
 * @returns {{validate: Function, errorsText: Function}|null} AJV validation helpers, or null when unavailable.
 */
function compileDecisionValidator() {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return { validate: ajv.compile(modelRoutingDecisionSchema), errorsText: (errors) => ajv.errorsText(errors) };
}

const compiledDecisionValidator = compileDecisionValidator();

/**
 * Validate the subset of ModelRoutingDecision v1.1 needed when AJV is unavailable.
 *
 * @param {Object} decision Candidate decision record.
 * @returns {boolean} True when fallback validation passes.
 */
function fallbackDecisionValidator(decision) {
  const errors = [];
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) errors.push('decision must be object');
  if (errors.length === 0) {
    for (const field of modelRoutingDecisionSchema.required) {
      if (decision[field] === undefined) errors.push(`missing required property ${field}`);
    }
    if (typeof decision.decision_id !== 'string' || !isUuidLike(decision.decision_id)) errors.push('decision_id must be uuid');
    if (decision.schema_version !== '1.1') errors.push('schema_version must be 1.1');
    if (typeof decision.request_id !== 'string' || !isUuidLike(decision.request_id)) errors.push('request_id must be uuid');
    if (typeof decision.agent_id !== 'string' || !KEBAB_CASE.test(decision.agent_id)) errors.push('agent_id must be kebab-case');
    if (!AGENT_TIERS.includes(decision.agent_tier)) errors.push('invalid agent_tier');
    if (!COMPLEXITY_HINTS.includes(decision.complexity_hint)) errors.push('invalid complexity_hint');
    if (!Number.isInteger(decision.latency_budget_ms) || decision.latency_budget_ms <= 0) errors.push('latency_budget_ms must be > 0');
    if (typeof decision.cost_cap_usd !== 'number' || decision.cost_cap_usd < 0) errors.push('cost_cap_usd must be >= 0');
    if (!isRoutedModel(decision.selected_model)) errors.push('invalid selected_model');
    if (!Array.isArray(decision.fallback_models) || decision.fallback_models.length > 3 || decision.fallback_models.some((model) => !isRoutedModel(model))) {
      errors.push('fallback_models invalid');
    }
    if (typeof decision.routing_reason !== 'string' || decision.routing_reason.length < 10) errors.push('routing_reason minLength 10');
    if (!Number.isInteger(decision.expected_latency_ms) || decision.expected_latency_ms <= 0) errors.push('expected_latency_ms must be > 0');
    if (typeof decision.estimated_cost_usd !== 'number' || decision.estimated_cost_usd < 0) errors.push('estimated_cost_usd must be >= 0');
    if (typeof decision.decided_at !== 'string' || Number.isNaN(Date.parse(decision.decided_at))) errors.push('decided_at must be date-time');
    if (!validTd010(decision.td_010_compliance)) errors.push('invalid td_010_compliance');
    if (typeof decision.cost_cap_usd === 'number' && typeof decision.estimated_cost_usd === 'number' && decision.estimated_cost_usd > decision.cost_cap_usd) {
      errors.push('estimated_cost_usd must not exceed cost_cap_usd');
    }
  }
  fallbackDecisionValidator.errors = errors;
  return errors.length === 0;
}

/**
 * Return whether a value is UUID-like; accepts the nil UUID for test and fixture request ids.
 *
 * @param {*} value Candidate value.
 * @returns {boolean} True for standard UUIDs or nil UUID.
 */
function isUuidLike(value) {
  return value === ZERO_UUID || UUID.test(value);
}

/**
 * Return whether a routed model object matches the decision schema subset.
 *
 * @param {*} model Candidate routed model.
 * @returns {boolean} True when the model has id, provider, and tier label.
 */
function isRoutedModel(model) {
  return Boolean(
    model &&
    typeof model === 'object' &&
    !Array.isArray(model) &&
    typeof model.model_id === 'string' &&
    MODEL_PROVIDERS.includes(model.provider) &&
    MODEL_TIER_LABELS.includes(model.tier_label) &&
    Object.keys(model).every((key) => ['model_id', 'provider', 'tier_label'].includes(key))
  );
}

/**
 * Return whether a TD-010 compliance object satisfies the router privacy floor.
 *
 * @param {*} td010 Candidate TD-010 object.
 * @returns {boolean} True when routing does not store plaintext PII or raw PII requests.
 */
function validTd010(td010) {
  return Boolean(
    td010 &&
    typeof td010 === 'object' &&
    !Array.isArray(td010) &&
    typeof td010.pii_hashed === 'boolean' &&
    td010.plaintext_email_stored === false &&
    td010.plaintext_phone_stored === false &&
    td010.request_contains_pii === false &&
    Object.keys(td010).every((key) => ['pii_hashed', 'plaintext_email_stored', 'plaintext_phone_stored', 'request_contains_pii'].includes(key))
  );
}

/**
 * Validate a caller's routing request before any model selection occurs.
 *
 * @param {Object} request Candidate routing request.
 * @throws {RoutingError} When caller input is malformed.
 * @returns {void}
 */
function validateRoutingRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new RoutingError('INVALID_REQUEST', 'RoutingRequest must be an object');
  }
  const required = ['request_id', 'agent_id', 'agent_tier', 'complexity_hint', 'latency_budget_ms', 'cost_cap_usd'];
  for (const field of required) {
    if (request[field] === undefined) throw new RoutingError('INVALID_REQUEST', `RoutingRequest missing required field: ${field}`);
  }
  if (typeof request.request_id !== 'string' || !isUuidLike(request.request_id)) throw new RoutingError('INVALID_REQUEST', 'request_id must be a UUID');
  if (typeof request.agent_id !== 'string' || !KEBAB_CASE.test(request.agent_id)) throw new RoutingError('INVALID_REQUEST', 'agent_id must be kebab-case');
  if (!AGENT_TIERS.includes(request.agent_tier)) throw new RoutingError('INVALID_REQUEST', 'agent_tier is invalid');
  if (!COMPLEXITY_HINTS.includes(request.complexity_hint)) throw new RoutingError('INVALID_REQUEST', 'complexity_hint is invalid');
  if (!Number.isInteger(request.latency_budget_ms) || request.latency_budget_ms <= 0) {
    throw new RoutingError('INVALID_REQUEST', 'latency_budget_ms must be an integer > 0');
  }
  if (typeof request.cost_cap_usd !== 'number' || Number.isNaN(request.cost_cap_usd) || request.cost_cap_usd < 0) {
    throw new RoutingError('INVALID_REQUEST', 'cost_cap_usd must be a number >= 0');
  }
  if (request.request_contains_pii === true) {
    throw new RoutingError('INVALID_REQUEST', 'routing requests must be pre-redacted and contain no raw Citizen PII');
  }
}

/**
 * Estimate one model's cost for sorting and budget checks.
 *
 * @param {Object} modelSpec Registered ModelSpec.
 * @param {Object} request Routing request.
 * @returns {number} Estimated cost in USD.
 */
function estimateCost(modelSpec, request) {
  if (typeof modelSpec.estimated_cost_usd === 'number') return modelSpec.estimated_cost_usd;
  const inputTokens = Number.isInteger(request.estimated_input_tokens) ? request.estimated_input_tokens : 0;
  const outputTokens = Number.isInteger(request.estimated_output_tokens) ? request.estimated_output_tokens : 0;
  return (inputTokens / 1000) * modelSpec.cost_per_1k_input_tokens_usd + (outputTokens / 1000) * modelSpec.cost_per_1k_output_tokens_usd;
}

/**
 * Convert a registered model spec into the compact routed-model audit shape.
 *
 * @param {Object} modelSpec Registered ModelSpec.
 * @returns {{model_id: string, provider: string, tier_label: string}} Routed-model record.
 */
function routedModel(modelSpec) {
  return { model_id: modelSpec.model_id, provider: modelSpec.provider, tier_label: modelSpec.tier_label };
}

/**
 * Validate and freeze a completed ModelRoutingDecision.
 *
 * @param {Object} decision Candidate decision.
 * @throws {RoutingError} When the decision fails schema or runtime cross-field validation.
 * @returns {Object} Frozen valid decision.
 */
function validateDecision(decision) {
  const validate = compiledDecisionValidator ? compiledDecisionValidator.validate : fallbackDecisionValidator;
  if (!validate(decision)) {
    const text = compiledDecisionValidator
      ? compiledDecisionValidator.errorsText(validate.errors)
      : (fallbackDecisionValidator.errors || []).join(', ');
    throw new RoutingError('INVALID_DECISION', `ModelRoutingDecision schema validation failed: ${text}`);
  }
  if (decision.estimated_cost_usd > decision.cost_cap_usd) {
    throw new RoutingError('INVALID_DECISION', 'estimated_cost_usd must not exceed cost_cap_usd');
  }
  return Object.freeze(decision);
}

/**
 * Select the best model for a request from an empty-by-default registry without making any API calls.
 *
 * @param {Object} request RoutingRequest with agent tier, complexity, latency budget, and cost cap.
 * @param {{list: Function, count: Function}} modelRegistry Registry facade returned by createModelRegistry.
 * @throws {RoutingError} When request validation fails, registry is empty, or no model fits.
 * @returns {Object} Frozen ModelRoutingDecision v1.1 record.
 */
function selectModelForRequest(request, modelRegistry) {
  validateRoutingRequest(request);
  if (!modelRegistry || typeof modelRegistry.list !== 'function' || typeof modelRegistry.count !== 'function') {
    throw new RoutingError('INVALID_REQUEST', 'modelRegistry must expose list() and count()');
  }
  if (modelRegistry.count() === 0) throw new RoutingError('REGISTRY_EMPTY', 'Model registry is empty; no models are pre-registered');

  const tierOrder = COMPLEXITY_TIER_ORDER[request.complexity_hint];
  const clinicalRoute = CLINICAL_AGENT_TIERS.includes(request.agent_tier);
  const candidates = modelRegistry.list().map((modelSpec) => ({
    modelSpec,
    tierStrength: tierOrder.indexOf(modelSpec.tier_label),
    estimatedCost: estimateCost(modelSpec, request),
  })).filter((candidate) => {
    if (candidate.tierStrength === -1) return false;
    if (clinicalRoute && candidate.modelSpec.clinical_appropriate !== true) return false;
    if (candidate.modelSpec.latency_p50_ms > request.latency_budget_ms) return false;
    if (candidate.estimatedCost > request.cost_cap_usd) return false;
    return true;
  }).sort((left, right) => {
    if (left.tierStrength !== right.tierStrength) return left.tierStrength - right.tierStrength;
    if (left.estimatedCost !== right.estimatedCost) return left.estimatedCost - right.estimatedCost;
    return left.modelSpec.latency_p50_ms - right.modelSpec.latency_p50_ms;
  });

  if (candidates.length === 0) {
    throw new RoutingError('NO_MODEL_FITS_BUDGET', 'No registered model fits complexity, latency, cost, and clinical constraints');
  }

  const selected = candidates[0];
  const decision = {
    decision_id: randomUUID(),
    schema_version: '1.1',
    request_id: request.request_id,
    agent_id: request.agent_id,
    agent_tier: request.agent_tier,
    complexity_hint: request.complexity_hint,
    latency_budget_ms: request.latency_budget_ms,
    cost_cap_usd: request.cost_cap_usd,
    selected_model: routedModel(selected.modelSpec),
    fallback_models: candidates.slice(1, 4).map((candidate) => routedModel(candidate.modelSpec)),
    routing_reason: `Selected ${selected.modelSpec.model_id} for ${request.complexity_hint} within latency and cost budgets.`,
    expected_latency_ms: Math.max(1, selected.modelSpec.latency_p50_ms),
    estimated_cost_usd: selected.estimatedCost,
    decided_at: new Date().toISOString(),
    td_010_compliance: {
      pii_hashed: request.pii_hashed !== false,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
      request_contains_pii: false,
    },
  };

  return validateDecision(decision);
}

/**
 * Create a dormant Model Router facade for routing decisions only, never live model calls.
 *
 * @param {{registry?: Object, sink?: 'stub'|'supabase'}} [config={}] Router configuration.
 * @returns {{route: Function, invoke: Function, getRegistry: Function, isEnabled: Function, getSink: Function}} Router facade.
 */
function createModelRouter(config = {}) {
  const registry = config.registry || createModelRegistry();
  const decisions = [];

  return Object.freeze({
    /**
     * Select and record a model routing decision without invoking the selected model.
     *
     * @param {Object} request RoutingRequest.
     * @throws {RoutingError} For invalid caller input or no matching model.
     * @returns {Promise<Object>} Promise resolving to a ModelRoutingDecision v1.1 record.
     */
    async route(request) {
      const decision = selectModelForRequest(request, registry);
      try {
        if (this.getSink() === 'supabase') {
          throw new NotImplementedError('Model Router Supabase sink not yet wired');
        }
        decisions.push(decision);
      } catch (error) {
        console.error(`[ROUTER] decision sink failed: ${error && error.message ? error.message : error}`);
      }
      return decision;
    },

    /**
     * Future live model invocation hook; intentionally dormant in this scaffold.
     *
     * @param {Object} _request RoutingRequest.
     * @param {string} _prompt Prompt text for a future provider SDK call.
     * @throws {NotImplementedError} Always until live provider wiring lands in a future PR.
     * @returns {Promise<never>} Never resolves while dormant.
     */
    async invoke(_request, _prompt) {
      throw new NotImplementedError('Model Router invocation not yet wired');
    },

    /**
     * Return the configured registry facade.
     *
     * @returns {Object} Model registry facade.
     */
    getRegistry() {
      return registry;
    },

    /**
     * Return whether Model Router activation has been explicitly enabled.
     *
     * @returns {boolean} True only when MODEL_ROUTER_ENABLED is exactly "true".
     */
    isEnabled() {
      return process.env.MODEL_ROUTER_ENABLED === 'true';
    },

    /**
     * Return the configured decision sink, defaulting to stub.
     *
     * @returns {'stub'|'supabase'} Decision sink name.
     */
    getSink() {
      const sink = process.env.MODEL_ROUTER_SINK || config.sink || 'stub';
      return ['stub', 'supabase'].includes(sink) ? sink : 'stub';
    },
  });
}

module.exports = {
  createModelRouter,
  createModelRegistry,
  MODEL_TIER_LABELS,
  MODEL_PROVIDERS,
  COMPLEXITY_HINTS,
  selectModelForRequest,
  RoutingError,
};
