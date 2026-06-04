const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');
const schemaPath = path.join(__dirname, '../../core/schemas/outcome_checkpoint_v1.1.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const {
  createOutcomeCapture,
  detectPlaintextPII,
  validateCheckpointTransition,
} = require('../../core/agents/outcomes/outcome_capture');

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackOutcomeCheckpointValidator(checkpoint) {
  const errors = [];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const hashedSession = /^h_[0-9a-f]{16}$/;
  const statuses = ['scheduled', 'captured', 'missed', 'declined', 'expired'];

  if (!checkpoint || typeof checkpoint !== 'object' || Array.isArray(checkpoint)) errors.push('checkpoint must be object');
  if (checkpoint && !uuid.test(checkpoint.checkpoint_id || '')) errors.push('checkpoint_id must be uuid');
  if (checkpoint && !uuid.test(checkpoint.trust_packet_id || '')) errors.push('trust_packet_id must be uuid');
  if (checkpoint && !hashedSession.test(checkpoint.session_id || '')) errors.push('session_id must be h_ hash');
  if (checkpoint && !uuid.test(checkpoint.citizen_id || '')) errors.push('citizen_id must be uuid');
  if (checkpoint && checkpoint.schema_version !== '1.1') errors.push('schema_version must be 1.1');
  if (checkpoint && ![3, 7, 30].includes(checkpoint.checkpoint_day)) errors.push('invalid checkpoint_day');
  if (checkpoint && Number.isNaN(Date.parse(checkpoint.scheduled_at))) errors.push('scheduled_at must be date-time');
  if (checkpoint && !statuses.includes(checkpoint.status)) errors.push('invalid status');
  if (checkpoint && checkpoint.delivery_channel !== null && !['sms', 'email', 'in_app'].includes(checkpoint.delivery_channel)) errors.push('invalid delivery_channel');
  if (checkpoint && (!Number.isInteger(checkpoint.delivery_attempts) || checkpoint.delivery_attempts < 0)) errors.push('invalid delivery_attempts');

  if (checkpoint && checkpoint.status === 'captured') {
    if (checkpoint.captured_at === null || Number.isNaN(Date.parse(checkpoint.captured_at))) errors.push('captured requires captured_at');
    if (!checkpoint.self_report || typeof checkpoint.self_report !== 'object') errors.push('captured requires self_report');
  }
  if (checkpoint && ['scheduled', 'missed', 'expired'].includes(checkpoint.status)) {
    if (checkpoint.captured_at !== null) errors.push('open status requires captured_at null');
    if (checkpoint.self_report !== null) errors.push('open status requires self_report null');
  }
  if (checkpoint && checkpoint.status === 'declined') {
    if (typeof checkpoint.decline_reason !== 'string' || checkpoint.decline_reason.length < 1) errors.push('declined requires decline_reason');
    if (checkpoint.self_report !== null) errors.push('declined requires self_report null');
  }

  const report = checkpoint && checkpoint.self_report;
  if (report) {
    for (const key of ['adherence_score', 'perceived_benefit', 'perceived_harm']) {
      if (typeof report[key] !== 'number' || report[key] < 0 || report[key] > 1) errors.push(`${key} out of range`);
    }
    if (typeof report.free_text !== 'string' || report.free_text.length > 2000) errors.push('invalid free_text');
  }

  const td = checkpoint && checkpoint.td_010_compliance;
  if (!td || td.pii_hashed !== true) errors.push('pii_hashed required');
  if (!td || td.plaintext_email_stored !== false) errors.push('plaintext_email_stored must be false');
  if (!td || td.plaintext_phone_stored !== false) errors.push('plaintext_phone_stored must be false');
  if (!td || td.plaintext_in_free_text !== false) errors.push('plaintext_in_free_text must be false');

  fallbackOutcomeCheckpointValidator.errors = errors;
  return errors.length === 0;
}

fallbackOutcomeCheckpointValidator.errors = [];

const compiled = compileWithAjv(schema);
const validateCheckpoint = compiled ? compiled.validate : fallbackOutcomeCheckpointValidator;
const checkpointErrorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : () => (fallbackOutcomeCheckpointValidator.errors || []).join(', ');

function selfReport(overrides = {}) {
  return {
    adherence_score: 0.75,
    perceived_benefit: 0.8,
    perceived_harm: 0,
    free_text: 'I followed the plan and slept better.',
    would_recommend_to_friend: null,
    response_method: 'in_app_form',
    ...overrides,
  };
}

function measurementUpdate(overrides = {}) {
  return {
    biomarkers: { hba1c: null, vitamin_d: 36 },
    mood_score: 7,
    sleep_score: 8,
    energy_score: 6,
    pain_score: null,
    stress_score: 4,
    focus_score: 7,
    gut_score: 6,
    captured_via: 'citizen_self_report',
    ...overrides,
  };
}

function baseCheckpoint(overrides = {}) {
  return {
    checkpoint_id: '11111111-1111-4111-8111-111111111111',
    trust_packet_id: '22222222-2222-4222-8222-222222222222',
    session_id: 'h_1234567890abcdef',
    citizen_id: '33333333-3333-4333-8333-333333333333',
    schema_version: '1.1',
    checkpoint_day: 7,
    scheduled_at: '2026-06-08T00:00:00.000Z',
    captured_at: null,
    status: 'scheduled',
    delivery_channel: null,
    delivery_attempts: 0,
    self_report: null,
    measurement_update: null,
    decline_reason: null,
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
      plaintext_in_free_text: false,
    },
    ...overrides,
  };
}

function assertValid(name, fixture) {
  assert.equal(validateCheckpoint(fixture), true, `${name} should validate: ${checkpointErrorsText(validateCheckpoint.errors)}`);
}

function assertInvalid(name, fixture) {
  assert.equal(validateCheckpoint(fixture), false, `${name} should fail validation`);
}

async function run() {
  assertValid('valid scheduled checkpoint', baseCheckpoint());
  assertValid('valid captured checkpoint with self_report and measurement_update', baseCheckpoint({
    captured_at: '2026-06-08T01:00:00.000Z',
    status: 'captured',
    delivery_channel: 'in_app',
    delivery_attempts: 1,
    self_report: selfReport(),
    measurement_update: measurementUpdate(),
  }));
  assertValid('valid captured checkpoint with self_report only', baseCheckpoint({
    captured_at: '2026-06-08T01:00:00.000Z',
    status: 'captured',
    self_report: selfReport(),
    measurement_update: null,
  }));
  assertValid('valid declined checkpoint with decline_reason', baseCheckpoint({
    captured_at: '2026-06-08T01:00:00.000Z',
    status: 'declined',
    decline_reason: 'Citizen declined optional follow-up.',
  }));
  assertValid('valid missed checkpoint', baseCheckpoint({ status: 'missed' }));
  assertValid('valid expired checkpoint', baseCheckpoint({ status: 'expired' }));
  assertValid('valid day=3 checkpoint', baseCheckpoint({ checkpoint_day: 3 }));
  assertValid('valid day=30 checkpoint', baseCheckpoint({ checkpoint_day: 30 }));

  assertInvalid('invalid captured with captured_at null', baseCheckpoint({ status: 'captured', captured_at: null, self_report: selfReport() }));
  assertInvalid('invalid captured with self_report null', baseCheckpoint({ status: 'captured', captured_at: '2026-06-08T01:00:00.000Z', self_report: null }));
  assertInvalid('invalid scheduled with captured_at set', baseCheckpoint({ captured_at: '2026-06-08T01:00:00.000Z' }));
  assertInvalid('invalid declined with decline_reason null', baseCheckpoint({ status: 'declined', decline_reason: null }));
  assertInvalid('invalid checkpoint_day=10', baseCheckpoint({ checkpoint_day: 10 }));
  assertInvalid('invalid adherence_score=2', baseCheckpoint({ status: 'captured', captured_at: '2026-06-08T01:00:00.000Z', self_report: selfReport({ adherence_score: 2 }) }));
  assertInvalid('invalid session_id without h_ prefix', baseCheckpoint({ session_id: 'plain-session' }));
  assertInvalid('invalid plaintext email storage true', baseCheckpoint({ td_010_compliance: { pii_hashed: true, plaintext_email_stored: true, plaintext_phone_stored: false, plaintext_in_free_text: false } }));

  const email = detectPlaintextPII('hi from user@test.com');
  assert.equal(email.contains_email, true, 'email should be detected');
  assert.equal(email.redacted_text.startsWith('hi from [REDACTED-EMAIL]'), true, 'email should be redacted');

  const phone = detectPlaintextPII('call 555-123-4567');
  assert.equal(phone.contains_phone, true, 'phone should be detected');
  assert.equal(phone.redacted_text.includes('[REDACTED-PHONE]'), true, 'phone should be redacted');

  assert.deepEqual(detectPlaintextPII('plain text'), { contains_email: false, contains_phone: false, redacted_text: 'plain text' });
  assert.deepEqual(validateCheckpointTransition('scheduled', 'captured', true, true), { valid: true, reason: null });
  assert.equal(validateCheckpointTransition('scheduled', 'captured', false, true).valid, false, 'missing captured_at should fail transition');
  assert.equal(createOutcomeCapture({}).isEnabled(), false, 'outcome capture should be disabled by default');

  const checkpoints = await createOutcomeCapture({}).schedule({
    trustPacketId: '22222222-2222-4222-8222-222222222222',
    sessionId: 'session-abc',
    citizenId: '33333333-3333-4333-8333-333333333333',
    outcomePlan: { day_3: {}, day_7: {}, day_30: {} },
  });
  assert.equal(checkpoints.length, 3, 'schedule should construct 3 checkpoints');
  assert.deepEqual(checkpoints.map((checkpoint) => checkpoint.checkpoint_day), [3, 7, 30]);

  console.log('outcome checkpoint schema fixtures passed (23/23)');
}

run();
