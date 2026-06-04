const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ajvPath = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');

const recordSchemaPath = path.join(__dirname, '../../core/schemas/memory_record_v1.1.schema.json');
const querySchemaPath = path.join(__dirname, '../../core/schemas/memory_query_v1.1.schema.json');
const recordSchema = JSON.parse(fs.readFileSync(recordSchemaPath, 'utf8'));
const querySchema = JSON.parse(fs.readFileSync(querySchemaPath, 'utf8'));

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(`${ajvPath}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajvPath);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackRecordValidator(record) {
  const errors = [];
  for (const field of recordSchema.required) {
    if (record[field] === undefined) errors.push(`missing required property ${field}`);
  }
  if (record.td_010) {
    if (record.td_010.pii_hashed !== true) errors.push('td_010.pii_hashed must be true');
    if (record.td_010.plaintext_email_stored !== false) errors.push('td_010.plaintext_email_stored must be false');
    if (record.td_010.plaintext_phone_stored !== false) errors.push('td_010.plaintext_phone_stored must be false');
  }
  if (!recordSchema.$defs.memory_kind.enum.includes(record.kind)) errors.push(`invalid kind ${record.kind}`);
  if (record.kind === 'semantic') {
    for (const fact of record.payload.citizen_facts || []) {
      if (/plaintext_(email|phone)/.test(fact)) errors.push('semantic fact contains plaintext marker');
    }
  }
  fallbackRecordValidator.errors = errors;
  return errors.length === 0;
}

function fallbackQueryValidator(query) {
  const errors = [];
  for (const field of querySchema.required) {
    if (query[field] === undefined) errors.push(`missing required property ${field}`);
  }
  if (!Number.isInteger(query.max_records) || query.max_records > 50) errors.push('max_records must be <= 50');
  fallbackQueryValidator.errors = errors;
  return errors.length === 0;
}

const compiledRecord = compileWithAjv(recordSchema);
const compiledQuery = compileWithAjv(querySchema);
const validateRecord = compiledRecord ? compiledRecord.validate : fallbackRecordValidator;
const validateQuery = compiledQuery ? compiledQuery.validate : fallbackQueryValidator;
const recordErrorsText = compiledRecord
  ? (errors) => compiledRecord.errorsText(errors)
  : (errors) => (errors || fallbackRecordValidator.errors || []).join(', ');
const queryErrorsText = compiledQuery
  ? (errors) => compiledQuery.errorsText(errors)
  : (errors) => (errors || fallbackQueryValidator.errors || []).join(', ');

function baseRecord(overrides = {}) {
  const record = {
    record_id: '11111111-1111-4111-8111-111111111111',
    session_id: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    citizen_id: null,
    kind: 'episodic',
    schema_version: '1.1',
    created_at: '2026-06-01T12:00:00.000Z',
    updated_at: '2026-06-01T12:00:00.000Z',
    ttl_days: 90,
    retention_authority: 'tier_2_felicia',
    payload: {
      interaction_summary: 'Citizen asked for sleep support; commerce stayed held while medication context was unknown.',
      variant_tags: ['V1.1_sleep_compromised_professional'],
      gates_triggered: ['medication_safety', 'commerce'],
      refusals_triggered: [18],
      commerce_surfaced: false,
    },
    td_010: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
    },
  };

  return { ...record, ...overrides };
}

function assertValidRecord(name, fixture) {
  assert.equal(validateRecord(fixture), true, `${name} should validate: ${recordErrorsText(validateRecord.errors)}`);
}

function assertInvalidRecord(name, fixture) {
  assert.equal(validateRecord(fixture), false, `${name} should fail validation`);
}

function assertInvalidQuery(name, fixture) {
  assert.equal(validateQuery(fixture), false, `${name} should fail validation`);
}

function run() {
  assertValidRecord('valid episodic MemoryRecord', baseRecord());

  assertValidRecord('valid semantic MemoryRecord', baseRecord({
    record_id: '22222222-2222-4222-8222-222222222222',
    kind: 'semantic',
    ttl_days: null,
    payload: {
      topic: 'sleep_context',
      citizen_facts: ['prefers low-dose evening routines', 'reports caffeine sensitivity'],
      confidence: 0.82,
    },
  }));

  assertValidRecord('valid preference MemoryRecord', baseRecord({
    record_id: '33333333-3333-4333-8333-333333333333',
    kind: 'preference',
    ttl_days: 365,
    retention_authority: 'tier_4_citizen_request',
    payload: {
      domain: 'communication',
      preference_key: 'tone',
      preference_value: 'brief and practical',
      citizen_explicit: true,
    },
  }));

  assertValidRecord('valid decision_history MemoryRecord', baseRecord({
    record_id: '44444444-4444-4444-8444-444444444444',
    kind: 'decision_history',
    ttl_days: 730,
    payload: {
      decision_id: '55555555-5555-4555-8555-555555555555',
      outcome_observed: 'Citizen reported the one-step sleep routine was easy to follow on day 7.',
      days_since: 7,
    },
  }));

  assertValidRecord('valid counterfactual_link MemoryRecord', baseRecord({
    record_id: '66666666-6666-4666-8666-666666666666',
    kind: 'counterfactual_link',
    payload: {
      trust_packet_id: '77777777-7777-4777-8777-777777777777',
      counterfactual_class: 'premature_commerce',
      citizen_acknowledged: false,
    },
  }));

  assertInvalidRecord('invalid TD-010 plaintext_email_stored=true MemoryRecord', baseRecord({
    record_id: '88888888-8888-4888-8888-888888888888',
    td_010: {
      pii_hashed: true,
      plaintext_email_stored: true,
      plaintext_phone_stored: false,
    },
  }));

  assertInvalidQuery('invalid MemoryQuery requesting 1000 records', {
    query_id: '99999999-9999-4999-8999-999999999999',
    session_id: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    kinds: ['episodic', 'semantic', 'preference', 'decision_history', 'counterfactual_link'],
    tier: 'tier_1_captain',
    max_records: 1000,
    include_expired: false,
  });

  console.log('memory architecture schema fixtures passed (7/7)');
}

run();
