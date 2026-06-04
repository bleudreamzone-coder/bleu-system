const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createShadowRunner } = require('../../../core/agents/shadow/shadow_runner');

const repoRoot = path.join(__dirname, '../../..');
const schemaPath = path.join(repoRoot, 'core/agents/shadow/shadow_observation_schema.json');
const decisionSchemaPath = path.join(repoRoot, 'core/schemas/decision_object_v1.1.schema.json');
const trustPacketSchemaPath = path.join(repoRoot, 'core/schemas/trust_packet_v1.1.schema.json');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

function compileWithAjv(schemaDocument) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(JSON.parse(fs.readFileSync(decisionSchemaPath, 'utf8')));
  ajv.addSchema(JSON.parse(fs.readFileSync(trustPacketSchemaPath, 'utf8')));
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackShadowObservationValidator(fixture) {
  const errors = [];
  for (const field of schema.required) {
    if (fixture[field] === undefined) errors.push(`missing required property ${field}`);
  }

  if (fixture.observation_id !== undefined && typeof fixture.observation_id !== 'string') {
    errors.push('observation_id must be string');
  }
  if (fixture.session_id !== undefined && typeof fixture.session_id !== 'string') {
    errors.push('session_id must be string');
  }
  if (fixture.latency_ms !== undefined && (!Number.isInteger(fixture.latency_ms) || fixture.latency_ms < 0)) {
    errors.push('latency_ms must be non-negative integer');
  }
  if (fixture.parity_match !== undefined && fixture.parity_match !== null && typeof fixture.parity_match !== 'boolean') {
    errors.push('parity_match must be boolean or null');
  }
  if (fixture.td_010_compliance !== undefined) {
    if (fixture.td_010_compliance.pii_hashed !== true) errors.push('td_010_compliance.pii_hashed must be true');
    if (fixture.td_010_compliance.plaintext_email_stored !== false) errors.push('td_010_compliance.plaintext_email_stored must be false');
    if (fixture.td_010_compliance.plaintext_phone_stored !== false) errors.push('td_010_compliance.plaintext_phone_stored must be false');
  }

  fallbackShadowObservationValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(schema);
const validate = compiled ? compiled.validate : fallbackShadowObservationValidator;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || fallbackShadowObservationValidator.errors || []).join(', ');

function withEnv(overrides = {}) {
  return {
    SHADOW_RUNNER_ENABLED: undefined,
    SHADOW_RUNNER_SINK: undefined,
    SHADOW_RUNNER_SAMPLE_RATE: undefined,
    ...overrides,
  };
}

function sampleObservation(overrides = {}) {
  return {
    observation_id: '11111111-1111-4111-8111-111111111111',
    session_id: 'sha256:hashed-session-fixture',
    timestamp: '2026-06-01T12:00:00.000Z',
    candidate_agent_id: 'fixture-agent',
    candidate_decision: null,
    candidate_trust_packet: null,
    live_response_hash: 'sha256:live-fixture-hash',
    shadow_response_hash: null,
    parity_match: null,
    latency_ms: 0,
    errors: [],
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
    },
    ...overrides,
  };
}

async function run() {
  const runner = createShadowRunner({});
  assert.equal(typeof runner.observe, 'function', 'runner should expose observe');
  assert.equal(typeof runner.flush, 'function', 'runner should expose flush');
  assert.equal(typeof runner.isEnabled, 'function', 'runner should expose isEnabled');

  const disabledRunner = createShadowRunner({ env: withEnv() });
  assert.equal(disabledRunner.isEnabled(), false, 'shadow runner should default to disabled');

  const noAgentRunner = createShadowRunner({
    env: withEnv({ SHADOW_RUNNER_ENABLED: 'true', SHADOW_RUNNER_SAMPLE_RATE: '1' }),
    registry: { agents: new Map() },
  });
  assert.deepEqual(await noAgentRunner.observe({ sessionId: 'sha256:test' }), [], 'no registered agents should produce no observations');

  const badContextRunner = createShadowRunner({ env: withEnv() });
  await assert.doesNotReject(() => badContextRunner.observe(null), 'observe should swallow bad context errors');

  const validObservation = sampleObservation();
  assert.equal(validate(validObservation), true, `sample ShadowObservation should validate: ${errorsText(validate.errors)}`);

  const missingTd010 = sampleObservation({ observation_id: '22222222-2222-4222-8222-222222222222' });
  delete missingTd010.td_010_compliance;
  assert.equal(validate(missingTd010), false, 'ShadowObservation missing td_010_compliance should fail validation');

  console.log('shadow-runner shape fixtures passed (5/5)');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
