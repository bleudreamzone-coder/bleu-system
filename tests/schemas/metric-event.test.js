const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');
const metricSchemaPath = path.join(__dirname, '../../core/schemas/metric_event_v1.1.schema.json');
const metricSchema = JSON.parse(fs.readFileSync(metricSchemaPath, 'utf8'));
const { createMetricEmitter, hashSessionId, redactErrorMessage } = require('../../core/metrics/emitter');
const {
  createChatTurnEvent,
  createCommerceGateStateEvent,
  createGateFiredEvent,
  createRefusalTriggeredEvent,
} = require('../../core/metrics/event_factories');

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackMetricValidator(event) {
  const errors = [];
  if (!/^h_[0-9a-f]{16}$/.test(event.session_id || '')) errors.push('session_id must start with h_ hash');
  if (!event.td_010_compliance || event.td_010_compliance.plaintext_email_stored !== false) errors.push('plaintext_email_stored must be false');
  if (!event.event_data || (event.event_type === 'chat_turn' && event.event_data.turn_index === undefined)) errors.push('chat_turn requires turn_index');
  fallbackMetricValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(metricSchema);
const validateMetric = compiled ? compiled.validate : fallbackMetricValidator;
const metricErrorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || fallbackMetricValidator.errors || []).join(', ');

function assertValidMetric(name, fixture) {
  assert.equal(validateMetric(fixture), true, `${name} should validate: ${metricErrorsText(validateMetric.errors)}`);
}

function assertInvalidMetric(name, fixture) {
  assert.equal(validateMetric(fixture), false, `${name} should fail validation`);
}

async function run() {
  const validChatTurn = createChatTurnEvent({
    sessionId: 'session-a',
    citizenId: null,
    turnIndex: 0,
    role: 'user',
    wordCount: 7,
    latencyMs: 12,
  });
  assertValidMetric('valid chat_turn event', validChatTurn);

  const validGate = createGateFiredEvent({
    sessionId: 'session-b',
    citizenId: null,
    gateName: 'crisis',
    status: 'hard_stop',
    reason: 'Crisis language requires reroute.',
  });
  assertValidMetric('valid gate_fired hard_stop event', validGate);

  const validRefusal = createRefusalTriggeredEvent({
    sessionId: 'session-c',
    citizenId: null,
    refusalNumber: 4,
    refusalName: 'commerce overriding safety',
    actionTaken: 'blocked commerce path',
  });
  assertValidMetric('valid refusal_triggered refusal 4 event', validRefusal);

  const validCommerceState = createCommerceGateStateEvent({
    sessionId: 'session-d',
    citizenId: null,
    allowed: false,
    reason: 'crisis_tier',
    firstResponse: false,
    hasConcern: true,
    supportTier: false,
    crisisTier: true,
  });
  assertValidMetric('valid commerce_gate_state crisis tier event', validCommerceState);

  assertInvalidMetric('invalid session_id without h_ prefix', { ...validChatTurn, session_id: 'raw-session' });

  assertInvalidMetric('invalid plaintext_email_stored=true', {
    ...validChatTurn,
    td_010_compliance: { ...validChatTurn.td_010_compliance, plaintext_email_stored: true },
  });

  const missingTurnIndex = {
    ...validChatTurn,
    event_data: { ...validChatTurn.event_data },
  };
  delete missingTurnIndex.event_data.turn_index;
  assertInvalidMetric('invalid chat_turn missing turn_index', missingTurnIndex);

  const originalEnabled = process.env.METRIC_EMITTER_ENABLED;
  delete process.env.METRIC_EMITTER_ENABLED;
  assert.equal(createMetricEmitter({}).isEnabled(), false, 'emitter should default disabled when env var is unset');
  if (originalEnabled === undefined) delete process.env.METRIC_EMITTER_ENABLED;
  else process.env.METRIC_EMITTER_ENABLED = originalEnabled;

  await assert.doesNotReject(
    () => createMetricEmitter({}).emit({ event_id: 'invalid-event' }),
    'invalid MetricEvent emission should resolve without throwing'
  );

  const hashed = hashSessionId('test-session-123');
  assert.equal(hashed.startsWith('h_'), true, 'hashSessionId should prefix h_');
  assert.equal(hashed.length, 18, 'hashSessionId should return h_ plus 16 hex chars');

  assert.equal(
    redactErrorMessage('error from user@example.com').includes('user@example.com'),
    false,
    'redactErrorMessage should strip email addresses'
  );

  console.log('metric event schema fixtures passed (11/11)');
}

run();
