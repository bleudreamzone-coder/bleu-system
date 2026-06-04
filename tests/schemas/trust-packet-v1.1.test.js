const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ajvPath = path.join(__dirname, '../../node_modules/ajv');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');

const schemaPath = path.join(__dirname, '../../core/schemas/trust_packet_v1.1.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(ajvPath) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv = require(ajvPath);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function simpleFixtureValidator(fixture) {
  const errors = [];

  for (const field of schema.required) {
    if (fixture[field] === undefined) errors.push(`missing required property ${field}`);
  }

  const counterfactual = fixture.counterfactual;
  if (counterfactual === undefined) {
    errors.push('missing required property counterfactual');
  } else {
    for (const field of schema.properties.counterfactual.required) {
      if (counterfactual[field] === undefined) errors.push(`counterfactual missing ${field}`);
    }

    const classes = schema.properties.counterfactual.properties.class.enum;
    if (counterfactual.class !== undefined && !classes.includes(counterfactual.class)) {
      errors.push(`invalid counterfactual class ${counterfactual.class}`);
    }

    if (counterfactual.prevented_wrong_answer !== undefined && counterfactual.prevented_wrong_answer.length < 1) {
      errors.push('counterfactual.prevented_wrong_answer must be non-empty');
    }

    if (counterfactual.bleu_difference !== undefined && counterfactual.bleu_difference.length < 1) {
      errors.push('counterfactual.bleu_difference must be non-empty');
    }

    if (
      counterfactual.confidence !== undefined
      && (typeof counterfactual.confidence !== 'number' || counterfactual.confidence < 0 || counterfactual.confidence > 1)
    ) {
      errors.push(`invalid counterfactual confidence ${counterfactual.confidence}`);
    }
  }

  const response = fixture.response;
  if (response !== undefined) {
    for (const field of schema.properties.response.required) {
      if (response[field] === undefined) errors.push(`response missing ${field}`);
    }
    if (response.evaluator_passed !== undefined && typeof response.evaluator_passed !== 'boolean') {
      errors.push('response.evaluator_passed must be boolean');
    }
  }

  const td010 = fixture.audit && fixture.audit.td_010;
  if (td010 !== undefined) {
    if (td010.plaintext_email_stored !== false) errors.push('td_010.plaintext_email_stored must be false');
    if (td010.plaintext_phone_stored !== false) errors.push('td_010.plaintext_phone_stored must be false');
  }

  simpleFixtureValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(schema);
const validate = compiled ? compiled.validate : simpleFixtureValidator;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || simpleFixtureValidator.errors || []).join(', ');

function outcome(status, rationale) {
  return { status, rationale };
}

function baseTrustPacket(overrides = {}) {
  const packet = {
    packet_id: '11111111-1111-4111-8111-111111111111',
    signal_id: '22222222-2222-4222-8222-222222222222',
    decision_id: '33333333-3333-4333-8333-333333333333',
    created_at: '2026-06-01T12:00:00.000Z',
    surface: 'schema_fixture',
    response: {
      hash: 'sha256:fixture-response-hash',
      model: 'schema-fixture-model',
      word_count: 92,
      evaluator_passed: true,
      voice_scores: {
        user: 0.92,
        clinical: 0.96,
        infrastructure: 0.91,
        restraint: 0.94,
      },
    },
    counterfactual: {
      class: 'premature_commerce',
      prevented_wrong_answer: 'Prevented generic checkout routing before the commerce gate verified safety and timing.',
      bleu_difference: 'BLEU preserved restraint by offering education and outcome follow-up before product movement.',
      confidence: 0.85,
    },
    outcome_plan: {
      day_3: outcome('scheduled', 'Check whether the citizen felt supported and whether any safety signal emerged.'),
      day_7: outcome('scheduled', 'Capture user-reported sleep or stress outcome without implying treatment efficacy.'),
      day_30: outcome('deferred', 'Longer-term follow-up depends on the day-7 result and consent state.'),
    },
    audit: {
      code_version: 'schema-shadow-v1.1',
      doctrine_refs: [
        '_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md#section-7',
        '_meta/THE_BLEU_BIBLE.md#counterfactual',
        '_meta/doctrine/lens_architecture_doctrine_v1.md#the-five-machines',
      ],
      refusals_checked: Array.from({ length: 20 }, (_, index) => index + 1),
      pressures_countered: ['commerce', 'legal', 'nervous_system'],
      td_010: {
        pii_hashed: true,
        plaintext_email_stored: false,
        plaintext_phone_stored: false,
      },
    },
  };

  return Object.assign(packet, overrides);
}

function assertValid(name, fixture) {
  assert.equal(validate(fixture), true, `${name} should validate: ${errorsText(validate.errors)}`);
}

function assertInvalid(name, fixture) {
  assert.equal(validate(fixture), false, `${name} should fail validation`);
}

function run() {
  assertValid('Trust Packet with full premature_commerce Counterfactual', baseTrustPacket());

  assertValid('Trust Packet with none Counterfactual class', baseTrustPacket({
    packet_id: '44444444-4444-4444-8444-444444444444',
    signal_id: '55555555-5555-4555-8555-555555555555',
    decision_id: '66666666-6666-4666-8666-666666666666',
    counterfactual: {
      class: 'none',
      prevented_wrong_answer: 'No meaningful generic-AI divergence was detected for this standard wellness inquiry.',
      bleu_difference: 'BLEU matched safe generic educational behavior while still preserving the audit trail.',
      confidence: 0.77,
    },
  }));

  const missingCounterfactual = baseTrustPacket({ packet_id: '77777777-7777-4777-8777-777777777777' });
  delete missingCounterfactual.counterfactual;
  assertInvalid('Trust Packet missing counterfactual', missingCounterfactual);

  assertInvalid('Trust Packet with empty prevented_wrong_answer', baseTrustPacket({
    packet_id: '88888888-8888-4888-8888-888888888888',
    counterfactual: {
      class: 'premature_commerce',
      prevented_wrong_answer: '',
      bleu_difference: 'BLEU preserved restraint by withholding product pressure.',
      confidence: 0.85,
    },
  }));

  assertInvalid('Trust Packet with plaintext email storage', baseTrustPacket({
    packet_id: '99999999-9999-4999-8999-999999999999',
    audit: {
      code_version: 'schema-shadow-v1.1',
      doctrine_refs: ['_meta/doctrine/lens_architecture_doctrine_v1.md#td-010'],
      refusals_checked: Array.from({ length: 20 }, (_, index) => index + 1),
      pressures_countered: ['privacy'],
      td_010: {
        pii_hashed: true,
        plaintext_email_stored: true,
        plaintext_phone_stored: false,
      },
    },
  }));

  console.log('trust-packet-v1.1 schema fixtures passed (5/5)');
}

run();
