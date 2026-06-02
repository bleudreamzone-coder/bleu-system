const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');
const schemaPath = path.join(__dirname, '../../core/schemas/trust_packet_v1.1.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const { hashResponse, countWords, hashAndCount } = require('../../core/agents/trust/response_hasher');
const { createTrustPacket } = require('../../core/agents/trust/trust_packet_factory');
const { createTrustPacketLogger } = require('../../core/agents/trust/trust_packet_logger');

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackTrustPacketValidator(packet) {
  const errors = [];
  const classes = schema.properties.counterfactual.properties.class.enum;
  if (!packet || typeof packet !== 'object') errors.push('packet object required');
  for (const field of schema.required) {
    if (!packet || packet[field] === undefined) errors.push(`missing required property ${field}`);
  }
  if (packet && packet.response) {
    if (typeof packet.response.hash !== 'string' || packet.response.hash.length < 1) errors.push('response hash required');
    if (typeof packet.response.model !== 'string' || packet.response.model.length < 1) errors.push('response model required');
    if (!Number.isInteger(packet.response.word_count) || packet.response.word_count < 0) errors.push('response word_count invalid');
    if (typeof packet.response.evaluator_passed !== 'boolean') errors.push('response evaluator_passed invalid');
    if (Object.prototype.hasOwnProperty.call(packet.response, 'text')) errors.push('raw response text must not be persisted');
  }
  if (packet && packet.counterfactual) {
    if (!classes.includes(packet.counterfactual.class)) errors.push('invalid counterfactual class');
    if (typeof packet.counterfactual.prevented_wrong_answer !== 'string' || packet.counterfactual.prevented_wrong_answer.length < 1) errors.push('prevented_wrong_answer required');
    if (typeof packet.counterfactual.bleu_difference !== 'string' || packet.counterfactual.bleu_difference.length < 1) errors.push('bleu_difference required');
    if (typeof packet.counterfactual.confidence !== 'number' || packet.counterfactual.confidence < 0 || packet.counterfactual.confidence > 1) errors.push('confidence invalid');
  }
  if (packet && packet.outcome_plan) {
    for (const key of ['day_3', 'day_7', 'day_30']) {
      if (!packet.outcome_plan[key]) errors.push(`${key} required`);
    }
  }
  if (packet && packet.audit) {
    if (!Array.isArray(packet.audit.doctrine_refs) || packet.audit.doctrine_refs.length < 1) errors.push('doctrine_refs required');
    if (!packet.audit.td_010 || packet.audit.td_010.plaintext_email_stored !== false) errors.push('plaintext email blocked');
    if (!packet.audit.td_010 || packet.audit.td_010.plaintext_phone_stored !== false) errors.push('plaintext phone blocked');
  }
  fallbackTrustPacketValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(schema);
const validateTrustPacket = compiled ? compiled.validate : fallbackTrustPacketValidator;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : () => (fallbackTrustPacketValidator.errors || []).join(', ');

function outcome(rationale) {
  return { status: 'scheduled', rationale };
}

function validInputs(overrides = {}) {
  return {
    decisionId: '33333333-3333-4333-8333-333333333333',
    signalId: '22222222-2222-4222-8222-222222222222',
    response: { text: 'BLEU preserved restraint in the response.', model: 'schema-fixture-model', evaluator_passed: true },
    counterfactual: {
      class: 'premature_commerce',
      prevented_wrong_answer: 'Prevented generic checkout routing before the commerce gate verified safety and timing.',
      bleu_difference: 'BLEU preserved restraint by offering education and outcome follow-up before product movement.',
      confidence: 0.85,
    },
    outcomePlan: {
      day_3: outcome('Check whether the citizen felt supported and whether any safety signal emerged.'),
      day_7: outcome('Capture reported sleep or stress outcome without implying treatment efficacy.'),
      day_30: { status: 'deferred', rationale: 'Longer-term follow-up depends on the day-7 result and consent state.' },
    },
    auditContext: {
      code_version: 'schema-shadow-v1.1',
      doctrine_refs: ['_meta/THE_BLEU_BIBLE.md#counterfactual'],
      refusals_checked: Array.from({ length: 20 }, (_, index) => index + 1),
      pressures_countered: ['commerce', 'privacy'],
    },
    ...overrides,
  };
}

function validPacket(overrides = {}) {
  const packet = createTrustPacket(validInputs());
  return { ...packet, ...overrides };
}

async function assertDoesNotThrowAsync(fn, message) {
  try {
    return await fn();
  } catch (error) {
    assert.fail(`${message}: ${error && error.stack ? error.stack : error}`);
  }
}

async function run() {
  assert.equal(hashResponse('hello'), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  assert.equal(countWords('the quick brown fox'), 4);
  assert.equal(countWords('  multiple   spaces  '), 2);
  const hc = hashAndCount('test response');
  assert.match(hc.hash, /^[a-f0-9]{64}$/);
  assert.equal(hc.word_count, 2);

  const packet = createTrustPacket(validInputs());
  assert.equal(Object.isFrozen(packet), true);
  assert.equal(validateTrustPacket(packet), true, `factory packet should validate: ${errorsText(validateTrustPacket.errors)}`);

  assert.throws(() => createTrustPacket(validInputs({ counterfactual: null })), /counterfactual.*mandatory/i);
  assert.throws(() => createTrustPacket(validInputs({ counterfactual: { ...validInputs().counterfactual, prevented_wrong_answer: '' } })), /prevented_wrong_answer.*mandatory/i);

  const privatePacket = createTrustPacket(validInputs({ response: { text: 'raw private response text', model: 'schema-fixture-model', evaluator_passed: true } }));
  assert.notEqual(privatePacket.response.hash, 'raw private response text');
  assert.equal(Object.prototype.hasOwnProperty.call(privatePacket.response, 'text'), false);
  assert.equal(privatePacket.response.text, undefined);

  const logger = createTrustPacketLogger({});
  assert.deepEqual(await logger.emit(packet), { accepted: true, reason: null });

  const packetMissingCounterfactual = validPacket();
  delete packetMissingCounterfactual.counterfactual;
  const missingResult = await assertDoesNotThrowAsync(
    () => createTrustPacketLogger({}).emit(packetMissingCounterfactual),
    'logger must not throw on missing counterfactual',
  );
  assert.deepEqual(missingResult, { accepted: false, reason: 'counterfactual_missing_mandatory_field' });

  const packetWithPlaintextEmailFlag = validPacket({
    audit: {
      ...packet.audit,
      td_010: {
        ...packet.audit.td_010,
        plaintext_email_stored: true,
      },
    },
  });
  const td010Result = await createTrustPacketLogger({}).emit(packetWithPlaintextEmailFlag);
  assert.deepEqual(td010Result, { accepted: false, reason: 'td_010_violation' });

  await assert.rejects(() => createTrustPacketLogger({ sink: 'supabase' }).flush(), /supabase Trust Packet sink is not implemented/);
  assert.equal(createTrustPacketLogger({}).isEnabled(), false);
  assert.equal(createTrustPacketLogger({}).getSink(), 'buffer');

  const observableLogger = createTrustPacketLogger({});
  assert.equal(observableLogger.getBufferedCount(), 0);
  await observableLogger.emit(packet);
  assert.equal(observableLogger.getBufferedCount(), 1);

  console.log('trust-packet-logger fixtures passed (15/15)');
}

run();
