// tests/schemas/signal_object_v1_1.test.js
// Run: `node tests/schemas/signal_object_v1_1.test.js`

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.join(__dirname, '..', '..');
const schemaPath = path.join(repoRoot, 'core', 'schemas', 'signal_object_v1.1.schema.json');
const fixtureDir = path.join(repoRoot, 'tests', 'fixtures', 'signal_object');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const hasAjv = spawnSync(process.execPath, ['-e', "require('ajv/dist/2020')"], {
  cwd: repoRoot,
  stdio: 'ignore',
}).status === 0;

const validate = hasAjv
  ? buildAjvValidator(schema)
  : buildFallbackValidator(schema);

const cases = [
  ['valid_sleep_help.json', true, 'canonical sleep-help signal validates'],
  ['valid_crisis_blocked.json', true, 'acute/unstable crisis signal validates with commerce blocked'],
  ['invalid_missing_confidence.json', false, 'missing required confidence is rejected'],
  ['invalid_variant_probability.json', false, 'variant probability above 1 is rejected'],
];

let failures = 0;

function buildAjvValidator(schemaDocument) {
  const Ajv2020 = require('ajv/dist/2020');
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validator = ajv.compile(schemaDocument);

  return (data) => {
    const valid = validator(data) && variantBlendSumsToOne(data);
    return {
      valid,
      errors: valid ? [] : validator.errors || ['variant_blend values do not sum to 1'],
      engine: 'ajv',
    };
  };
}

function buildFallbackValidator(schemaDocument) {
  return (data) => {
    const errors = [];
    const allowedKeys = new Set(Object.keys(schemaDocument.properties));

    for (const key of schemaDocument.required) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) errors.push(`missing required ${key}`);
    }

    for (const key of Object.keys(data)) {
      if (!allowedKeys.has(key)) errors.push(`additional property ${key}`);
    }

    checkConst(data, schemaDocument, 'schema_version', errors);
    checkPatternString(data, 'intent', /^[a-z][a-z0-9_]*$/, errors);
    checkStringArray(data, 'sub_intents', /^[a-z][a-z0-9_]*$/, errors);
    checkEnum(data, schemaDocument, 'life_stage', errors);
    checkEnum(data, schemaDocument, 'clinical_complexity', errors);
    checkEnum(data, schemaDocument, 'readiness', errors);
    checkEnum(data, schemaDocument, 'trust', errors);
    checkEnum(data, schemaDocument, 'dose_tolerance', errors);
    checkEnum(data, schemaDocument, 'financial_signal', errors);
    checkStringArray(data, 'risk_flags', /^[a-z][a-z0-9_]*$/, errors);
    checkStringArray(data, 'needed_info', /^[a-z][a-z0-9_]*$/, errors);
    checkEnum(data, schemaDocument, 'commerce_intent', errors);
    checkEnum(data, schemaDocument, 'evidence_need', errors);
    checkNumberRange(data, 'confidence', 0, 1, errors);
    checkVariantBlend(data, errors);
    checkSafetyOverrides(data, errors);

    return { valid: errors.length === 0, errors, engine: 'fallback' };
  };
}

function checkConst(data, schemaDocument, key, errors) {
  if (data[key] !== undefined && data[key] !== schemaDocument.properties[key].const) {
    errors.push(`${key} must equal ${schemaDocument.properties[key].const}`);
  }
}

function checkEnum(data, schemaDocument, key, errors) {
  if (data[key] !== undefined && !schemaDocument.properties[key].enum.includes(data[key])) {
    errors.push(`${key} has invalid enum value ${data[key]}`);
  }
}

function checkNumberRange(data, key, min, max, errors) {
  if (data[key] === undefined) return;
  if (typeof data[key] !== 'number' || data[key] < min || data[key] > max) {
    errors.push(`${key} must be a number between ${min} and ${max}`);
  }
}

function checkPatternString(data, key, pattern, errors) {
  if (data[key] === undefined) return;
  if (typeof data[key] !== 'string' || !pattern.test(data[key])) {
    errors.push(`${key} must match ${pattern}`);
  }
}

function checkStringArray(data, key, pattern, errors) {
  if (data[key] === undefined) return;
  if (!Array.isArray(data[key])) {
    errors.push(`${key} must be an array`);
    return;
  }
  const seen = new Set();
  for (const value of data[key]) {
    if (typeof value !== 'string' || !pattern.test(value)) errors.push(`${key} item must match ${pattern}`);
    if (seen.has(value)) errors.push(`${key} must contain unique items`);
    seen.add(value);
  }
}

function checkVariantBlend(data, errors) {
  const blend = data.variant_blend;
  if (!blend || typeof blend !== 'object' || Array.isArray(blend)) {
    errors.push('variant_blend must be an object');
    return;
  }

  const keys = Object.keys(blend);
  if (keys.length < 1 || keys.length > 35) errors.push('variant_blend must have 1-35 entries');

  for (const [key, value] of Object.entries(blend)) {
    if (key !== 'unknown_or_needs_info' && !/^V[0-9]+\.[0-9]+_[a-z0-9_]+$/.test(key)) {
      errors.push(`variant_blend key ${key} has invalid shape`);
    }
    if (typeof value !== 'number' || value < 0 || value > 1) {
      errors.push(`variant_blend value for ${key} must be between 0 and 1`);
    }
  }

  if (!variantBlendSumsToOne(data)) errors.push('variant_blend values must sum to 1');
}

function checkSafetyOverrides(data, errors) {
  if (data.clinical_complexity === 'C4_acute_unstable') {
    if (data.commerce_intent !== 'blocked') errors.push('C4 signals must block commerce');
    if (!['high', 'urgent'].includes(data.evidence_need)) errors.push('C4 signals require high or urgent evidence need');
    if (!['D1_micro', 'D2_low', 'unknown_or_needs_info'].includes(data.dose_tolerance)) {
      errors.push('C4 signals must keep dose tolerance at D1/D2/unknown');
    }
  }

  if (data.life_stage === 'L5_late_aging' && !['D1_micro', 'D2_low', 'unknown_or_needs_info'].includes(data.dose_tolerance)) {
    errors.push('L5 signals must keep dose tolerance at D1/D2/unknown');
  }
}

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, name), 'utf8'));
}

function variantBlendSumsToOne(signalObject) {
  const values = Object.values(signalObject.variant_blend || {});
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.abs(sum - 1) < 0.000001;
}

for (const [fixture, expectedValid, label] of cases) {
  const data = readFixture(fixture);
  const result = validate(data);

  if (result.valid === expectedValid) {
    console.log(`  ok   ${label} (${result.engine})`);
  } else {
    failures++;
    console.log(`  FAIL ${label} — ${JSON.stringify(result.errors, null, 2)}`);
  }
}

if (failures === 0) {
  console.log('signal_object_v1_1.test.js — PASS');
  process.exit(0);
}

console.log(`signal_object_v1_1.test.js — FAIL (${failures} failures)`);
process.exit(1);
