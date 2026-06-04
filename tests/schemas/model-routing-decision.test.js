'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const schema = require('../../core/schemas/model_routing_decision_v1.1.schema.json');
const {
  createModelRouter,
  MODEL_TIER_LABELS,
  selectModelForRequest,
  RoutingError,
} = require('../../core/agents/router/model_router');
const { createModelRegistry } = require('../../core/agents/router/model_registry');
const { NotImplementedError } = require('../../core/agents/_adapter');

const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');

function compileWithAjv() {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return { validate: ajv.compile(schema), errorsText: (errors) => ajv.errorsText(errors) };
}

function isRoutedModel(model) {
  return Boolean(
    model &&
    typeof model === 'object' &&
    !Array.isArray(model) &&
    typeof model.model_id === 'string' &&
    ['openai', 'anthropic', 'local', 'stub'].includes(model.provider) &&
    ['fast', 'balanced', 'deep', 'specialized'].includes(model.tier_label) &&
    Object.keys(model).every((key) => ['model_id', 'provider', 'tier_label'].includes(key))
  );
}

function fallbackValidate(decision) {
  const errors = [];
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) errors.push('decision must be object');
  if (errors.length === 0) {
    for (const field of schema.required) {
      if (decision[field] === undefined) errors.push(`missing ${field}`);
    }
    if (!Number.isInteger(decision.latency_budget_ms) || decision.latency_budget_ms <= 0) errors.push('latency_budget_ms');
    if (typeof decision.cost_cap_usd !== 'number' || decision.cost_cap_usd < 0) errors.push('cost_cap_usd');
    if (!Array.isArray(decision.fallback_models) || decision.fallback_models.length > 3) errors.push('fallback_models');
    if (!isRoutedModel(decision.selected_model)) errors.push('selected_model');
    if (Array.isArray(decision.fallback_models) && decision.fallback_models.some((model) => !isRoutedModel(model))) errors.push('fallback_model item');
    if (typeof decision.routing_reason !== 'string' || decision.routing_reason.length < 10) errors.push('routing_reason');
    if (decision.td_010_compliance && decision.td_010_compliance.plaintext_email_stored !== false) errors.push('plaintext_email_stored');
    if (decision.td_010_compliance && decision.td_010_compliance.request_contains_pii !== false) errors.push('request_contains_pii');
    if (decision.estimated_cost_usd > decision.cost_cap_usd) errors.push('cost cross-field');
  }
  fallbackValidate.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv();
const validateSchemaOnly = compiled ? compiled.validate : fallbackValidate;
const validationErrorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : () => (fallbackValidate.errors || []).join(', ');

function validateDecision(decision) {
  const validSchema = validateSchemaOnly(decision);
  if (!validSchema) return false;
  return decision.estimated_cost_usd <= decision.cost_cap_usd;
}

function baseRoutedModel(overrides = {}) {
  return {
    model_id: 'stub-fast-a',
    provider: 'stub',
    tier_label: 'fast',
    ...overrides,
  };
}

function baseDecision(overrides = {}) {
  return {
    decision_id: '11111111-1111-4111-8111-111111111111',
    schema_version: '1.1',
    request_id: '22222222-2222-4222-8222-222222222222',
    agent_id: 'test-agent',
    agent_tier: 'tier_infrastructure',
    complexity_hint: 'simple',
    latency_budget_ms: 5000,
    cost_cap_usd: 0.1,
    selected_model: baseRoutedModel(),
    fallback_models: [],
    routing_reason: 'Selected stub fast model for schema testing.',
    expected_latency_ms: 100,
    estimated_cost_usd: 0.01,
    decided_at: '2026-06-02T00:00:00.000Z',
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
      request_contains_pii: false,
    },
    ...overrides,
  };
}

function validSpec(overrides = {}) {
  return {
    model_id: 'stub-fast-a',
    provider: 'stub',
    tier_label: 'fast',
    latency_p50_ms: 100,
    latency_p95_ms: 200,
    cost_per_1k_input_tokens_usd: 0,
    cost_per_1k_output_tokens_usd: 0,
    max_context_tokens: 1000,
    max_output_tokens: 500,
    capabilities: ['json_mode'],
    clinical_appropriate: false,
    registered_at: '2026-06-02T00:00:00.000Z',
    audit_doc: '_meta/audits/future-stub-model.md',
    ...overrides,
  };
}

function validRequest(overrides = {}) {
  return {
    request_id: '33333333-3333-4333-8333-333333333333',
    agent_id: 'test-agent',
    agent_tier: 'tier_infrastructure',
    complexity_hint: 'simple',
    latency_budget_ms: 5000,
    cost_cap_usd: 0.1,
    ...overrides,
  };
}

function assertValidDecision(name, fixture) {
  assert.equal(validateDecision(fixture), true, `${name} should validate: ${validationErrorsText(validateSchemaOnly.errors)}`);
}

function assertInvalidDecision(name, fixture) {
  assert.equal(validateDecision(fixture), false, `${name} should fail validation`);
}

async function run() {
  assertValidDecision('valid selected model and no fallbacks', baseDecision());

  assertValidDecision('valid selected model and 3 fallbacks', baseDecision({
    fallback_models: [
      baseRoutedModel({ model_id: 'stub-balanced-a', tier_label: 'balanced' }),
      baseRoutedModel({ model_id: 'stub-fast-b' }),
      baseRoutedModel({ model_id: 'stub-balanced-b', tier_label: 'balanced' }),
    ],
  }));

  assertValidDecision('valid provider stub routing decision', baseDecision({
    selected_model: baseRoutedModel({ provider: 'stub' }),
  }));

  assertInvalidDecision('invalid latency_budget_ms=0 rejected', baseDecision({ latency_budget_ms: 0 }));
  assertInvalidDecision('invalid cost_cap_usd=-1 rejected', baseDecision({ cost_cap_usd: -1 }));
  assertInvalidDecision('invalid estimated_cost_usd over cap rejected', baseDecision({ cost_cap_usd: 0.1, estimated_cost_usd: 0.2 }));
  assertInvalidDecision('invalid fallback_models length 4 rejected', baseDecision({
    fallback_models: [
      baseRoutedModel({ model_id: 'stub-fast-b' }),
      baseRoutedModel({ model_id: 'stub-fast-c' }),
      baseRoutedModel({ model_id: 'stub-fast-d' }),
      baseRoutedModel({ model_id: 'stub-fast-e' }),
    ],
  }));
  assertInvalidDecision('invalid plaintext_email_stored=true rejected', baseDecision({
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: true,
      plaintext_phone_stored: false,
      request_contains_pii: false,
    },
  }));
  assertInvalidDecision('invalid request_contains_pii=true rejected', baseDecision({
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
      request_contains_pii: true,
    },
  }));
  assertInvalidDecision('invalid routing_reason length 5 rejected', baseDecision({ routing_reason: 'short' }));

  await assert.rejects(
    () => createModelRouter({ registry: createModelRegistry() }).route(validRequest()),
    (error) => error instanceof RoutingError && ['REGISTRY_EMPTY', 'NO_MODEL_FITS_BUDGET'].includes(error.code),
    'empty registry route should reject with RoutingError'
  );

  await assert.rejects(
    () => createModelRouter({}).invoke(validRequest(), 'prompt'),
    NotImplementedError,
    'router.invoke should remain dormant and throw NotImplementedError'
  );

  assert.throws(
    () => createModelRegistry().register(validSpec({ clinical_appropriate: true })),
    /Felicia signoff doc required/,
    'clinical_appropriate=true should require Felicia signoff doc'
  );

  assert.equal(createModelRegistry().count(), 0, 'fresh registry should be empty');
  assert.deepEqual(MODEL_TIER_LABELS, Object.freeze(['fast', 'balanced', 'deep', 'specialized']), 'MODEL_TIER_LABELS should contain exactly four entries');

  const originalEnabled = process.env.MODEL_ROUTER_ENABLED;
  delete process.env.MODEL_ROUTER_ENABLED;
  assert.equal(createModelRouter({}).isEnabled(), false, 'router should default disabled');
  if (originalEnabled === undefined) delete process.env.MODEL_ROUTER_ENABLED;
  else process.env.MODEL_ROUTER_ENABLED = originalEnabled;

  const registry = createModelRegistry();
  registry.register(validSpec());
  const decision = selectModelForRequest(validRequest(), registry);
  assert.equal(decision.selected_model.model_id, 'stub-fast-a', 'router should select registered stub model within budget');

  console.log('model routing decision schema fixtures passed (17/17)');
}

run();
