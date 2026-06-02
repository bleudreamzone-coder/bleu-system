const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const schemaPath = path.join(__dirname, '../fixtures/golden/wal-fixture-schema-v1.0.schema.json');
const fixturePath = path.join(__dirname, '../fixtures/golden/wal-lexapro-killer-demo.json');
const taxonomyPath = path.join(__dirname, '../../core/config/variant_taxonomy_v1.json');
const decisionObjectSchemaPath = path.join(__dirname, '../../core/schemas/decision_object_v1.1.schema.json');

const walSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
const decisionObjectSchema = JSON.parse(fs.readFileSync(decisionObjectSchemaPath, 'utf8'));

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(ajv2020Path)) return null;
  const Ajv2020 = require(ajv2020Path);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return {
    ajv,
    validate: ajv.compile(schemaDocument),
    errorsText: (errors) => ajv.errorsText(errors),
  };
}

function fallbackFixtureValidator(document) {
  const errors = [];

  for (const field of walSchema.required) {
    if (document[field] === undefined) errors.push(`missing required property ${field}`);
  }

  if (!/^WAL-[A-Z0-9-]+$/.test(document.scenario_id || '')) errors.push('scenario_id pattern mismatch');
  if (document.schema_version !== '1.0') errors.push('schema_version must be 1.0');
  if (!Array.isArray(document.variant_tags) || document.variant_tags.length < 1) errors.push('variant_tags must be non-empty');
  for (const tag of document.variant_tags || []) {
    if (!/^V[1-5]\.[0-9]+$/.test(tag)) errors.push(`invalid variant tag ${tag}`);
  }

  if (!Array.isArray(document.refusals_tested) || document.refusals_tested.length < 1) errors.push('refusals_tested must be non-empty');
  const refusalSet = new Set(document.refusals_tested || []);
  if (refusalSet.size !== (document.refusals_tested || []).length) errors.push('refusals_tested must be unique');
  for (const refusal of document.refusals_tested || []) {
    if (!Number.isInteger(refusal) || refusal < 1 || refusal > 20) errors.push(`invalid refusal ${refusal}`);
  }

  const gateEnum = walSchema.properties.gates_exercised.items.properties.gate.enum;
  const statusEnum = walSchema.properties.gates_exercised.items.properties.expected_status.enum;
  if (!Array.isArray(document.gates_exercised) || document.gates_exercised.length !== 7) {
    errors.push('gates_exercised must contain exactly seven entries');
  }
  const gateCounts = new Map(gateEnum.map((gate) => [gate, 0]));
  for (const gate of document.gates_exercised || []) {
    if (!gateEnum.includes(gate.gate)) {
      errors.push(`invalid gate ${gate.gate}`);
    } else {
      gateCounts.set(gate.gate, gateCounts.get(gate.gate) + 1);
    }
    if (!statusEnum.includes(gate.expected_status)) errors.push(`invalid expected_status ${gate.expected_status}`);
    if (typeof gate.reason !== 'string' || gate.reason.length < 5) errors.push(`invalid gate reason for ${gate.gate}`);
  }
  for (const [gate, count] of gateCounts) {
    if (count !== 1) errors.push(`gate ${gate} must appear exactly once`);
  }

  if (document.signoff_status === 'pending' && document.bleu_correct_behavior_template !== 'PENDING_FELICIA_SIGNOFF') {
    errors.push('pending signoff requires PENDING_FELICIA_SIGNOFF sentinel');
  }
  if (['signed_by_felicia', 'signed_by_delegate'].includes(document.signoff_status)) {
    if (document.bleu_correct_behavior_template === 'PENDING_FELICIA_SIGNOFF') errors.push('signed fixture must not use sentinel');
    if (typeof document.bleu_correct_behavior_template !== 'string' || document.bleu_correct_behavior_template.length < 50) {
      errors.push('signed fixture requires clinical template minLength 50');
    }
  }

  if (document.td_010_compliance) {
    if (document.td_010_compliance.plaintext_email_stored !== false) errors.push('plaintext_email_stored must be false');
    if (document.td_010_compliance.plaintext_phone_stored !== false) errors.push('plaintext_phone_stored must be false');
    if (document.td_010_compliance.contains_real_citizen_data !== false) errors.push('contains_real_citizen_data must be false');
  }

  fallbackFixtureValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(walSchema);
const validateFixture = compiled ? compiled.validate : fallbackFixtureValidator;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || fallbackFixtureValidator.errors || []).join(', ');

function allVariants(document = taxonomy) {
  return document.icps.flatMap((icp) => icp.variants);
}

function decisionGateNames() {
  return decisionObjectSchema.properties.gates.prefixItems.map((item) => {
    const defName = item.$ref.replace('#/$defs/', '');
    return decisionObjectSchema.$defs[defName].allOf[1].properties.gate.const;
  });
}

function decisionStatusValues() {
  return decisionObjectSchema.$defs.gate_base.properties.status.enum;
}

function assertValidFixture(name, document) {
  assert.equal(validateFixture(document), true, `${name} should validate: ${errorsText(validateFixture.errors)}`);
}

function assertInvalidFixture(name, document) {
  assert.equal(validateFixture(document), false, `${name} should fail validation`);
}

function run() {
  if (compiled) {
    assert.equal(compiled.ajv.validateSchema(walSchema), true, `WAL schema should validate against JSON Schema meta-schema: ${compiled.ajv.errorsText(compiled.ajv.errors)}`);
  } else {
    assert.equal(walSchema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(walSchema.type, 'object');
    assert.ok(Array.isArray(walSchema.required));
  }

  assertValidFixture('Lexapro WAL killer demo fixture', fixture);

  const variantIds = new Set(allVariants().map((variant) => variant.variant_id));
  for (const variantTag of fixture.variant_tags) {
    assert.ok(variantIds.has(variantTag), `${variantTag} should exist in variant taxonomy`);
  }

  const gateNames = new Set(decisionGateNames());
  for (const gate of fixture.gates_exercised) {
    assert.ok(gateNames.has(gate.gate), `${gate.gate} should exist in Decision Object gate enum`);
  }

  const statusValues = decisionStatusValues();
  assert.deepEqual(statusValues, ['pass', 'passed', 'blocked', 'needs_review', 'hard_stop', 'reroute']);
  for (const gate of fixture.gates_exercised) {
    assert.ok(statusValues.includes(gate.expected_status), `${gate.expected_status} should exist in Decision Object gate_base.status enum`);
  }

  for (const refusal of fixture.refusals_tested) {
    assert.ok(refusal >= 1 && refusal <= 20, `Refusal ${refusal} should be in 1-20 range`);
  }

  assert.equal(fixture.signoff_status, 'pending');
  assert.equal(fixture.bleu_correct_behavior_template, 'PENDING_FELICIA_SIGNOFF');

  const invalidPending = structuredClone(fixture);
  invalidPending.bleu_correct_behavior_template = 'actual clinical text';
  assertInvalidFixture('pending fixture with non-sentinel clinical text', invalidPending);

  const invalidTd010 = structuredClone(fixture);
  invalidTd010.td_010_compliance.contains_real_citizen_data = true;
  assertInvalidFixture('fixture containing real citizen data', invalidTd010);

  assert.ok(Array.isArray(fixture.source_doctrine_refs) && fixture.source_doctrine_refs.length > 0);
  assert.ok(Array.isArray(fixture.why_wrong_doctrine_refs) && fixture.why_wrong_doctrine_refs.length > 0);

  console.log('WAL Lexapro killer demo fixtures: 10/10 passed');
}

run();
