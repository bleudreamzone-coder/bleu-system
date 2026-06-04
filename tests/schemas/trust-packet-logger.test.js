'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const trustPacketSchema = require('../../core/schemas/trust_packet_v1.1.schema.json');
const { hashResponse, countWords, hashAndCount } = require('../../core/agents/trust/response_hasher');
const { createTrustPacket } = require('../../core/agents/trust/trust_packet_factory');
const { TRUST_PACKET_SINKS, createTrustPacketLogger } = require('../../core/agents/trust/trust_packet_logger');

const ajvPath = require.resolve('ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(ajvPath) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajvPath);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackTrustPacketValidator(packet) {
  const errors = [];
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) errors.push('packet must be object');
  for (const field of trustPacketSchema.required) {
    if (packet && packet[field] === undefined) errors.push(`missing ${field}`);
  }
  const counterfactual = packet && packet.counterfactual;
  if (!counterfactual || !counterfactual.prevented_wrong_answer) errors.push('counterfactual missing prevented wrong answer');
  if (counterfactual && !trustPacketSchema.properties.counterfactual.properties.class.enum.includes(counterfactual.class)) {
    errors.push('invalid counterfactual class');
  }
  const td010 = packet && packet.audit && packet.audit.td_010;
  if (!td010 || td010.plaintext_email_stored !== false || td010.plaintext_phone_stored !== false) {
    errors.push('td_010 plaintext flags must be false');
  }
  fallbackTrustPacketValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(trustPacketSchema);
const validateTrustPacket = compiled ? compiled.validate : fallbackTrustPacketValidator;
const trustPacketErrorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : () => (fallbackTrustPacketValidator.errors || []).join(', ');

function outcome(status, rationale) {
  return { status, rationale };
}

function packetInput(overrides = {}) {
  return {
    decisionId: '33333333-3333-4333-8333-333333333333',
    signalId: '22222222-2222-4222-8222-222222222222',
    response: {
      text: 'BLEU restrained the answer and routed medication safety to the prescriber.',
      model: 'schema-fixture-model',
      evaluator_passed: true,
    },
    counterfactual: {
      class: 'unsafe_supplement',
      prevented_wrong_answer: 'Prevented serotonergic supplement recommendation alongside SSRI context.',
      bleu_difference: 'BLEU asked for prescriber review instead of recommending a supplement.',
      confidence: 0.91,
    },
    outcomePlan: {
      day_3: outcome('scheduled', 'Check whether the citizen found safe next-step routing useful.'),
      day_7: outcome('scheduled', 'Capture sleep support outcome without treatment claims.'),
      day_30: outcome('deferred', 'Only continue if consent and earlier outcome data support it.'),
    },
    auditContext: {
      code_version: 'trust-packet-logger-test',
      doctrine_refs: ['_meta/THE_BLEU_BIBLE.md:490-498'],
      refusals_checked: [4, 5, 9, 13, 18],
      pressures_countered: ['commerce_before_safety'],
    },
    ...overrides,
  };
}

function createFixturePacket(overrides = {}) {
  return createTrustPacket(packetInput(overrides));
}

function assertValidPacket(name, packet) {
  assert.equal(validateTrustPacket(packet), true, `${name} should validate: ${trustPacketErrorsText(validateTrustPacket.errors)}`);
}

async function run() {
  let fixtures = 0;

  assert.equal(hashResponse('hello world'), 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'); fixtures += 1;
  assert.equal(countWords('  one\n two\tthree  '), 3); fixtures += 1;
  assert.deepEqual(hashAndCount('two words'), { hash: hashResponse('two words'), word_count: 2 }); fixtures += 1;

  const packet = createFixturePacket();
  assertValidPacket('factory packet', packet); fixtures += 1;
  assert.equal(packet.schema_version, '1.1');
  assert.equal(Object.prototype.propertyIsEnumerable.call(packet, 'schema_version'), false);
  assert.equal(packet.response.text, undefined);
  assert.equal(packet.response.word_count, 11); fixtures += 1;
  assert.equal(packet.audit.td_010.pii_hashed, true);
  assert.equal(packet.audit.td_010.plaintext_email_stored, false);
  assert.equal(packet.audit.td_010.plaintext_phone_stored, false); fixtures += 1;
  assert.throws(() => createTrustPacket(packetInput({ counterfactual: null })), /counterfactual must be an object/); fixtures += 1;
  assert.throws(
    () => createTrustPacket(packetInput({ counterfactual: { ...packetInput().counterfactual, prevented_wrong_answer: '   ' } })),
    /counterfactual\.prevented_wrong_answer/,
  ); fixtures += 1;

  assert.deepEqual(TRUST_PACKET_SINKS, Object.freeze(['buffer', 'stdout', 'supabase'])); fixtures += 1;
  const dormantLogger = createTrustPacketLogger();
  assert.equal(dormantLogger.isEnabled(), false);
  assert.equal(dormantLogger.getSink(), 'buffer');
  assert.equal(dormantLogger.getBufferedCount(), 0); fixtures += 1;

  const disabledResult = await dormantLogger.emit(packet);
  assert.deepEqual(disabledResult, { accepted: true, reason: 'logger_disabled' });
  assert.equal(dormantLogger.getBufferedCount(), 0); fixtures += 1;

  const bufferLogger = createTrustPacketLogger({ enabled: true, sink: 'buffer' });
  assert.deepEqual(await bufferLogger.emit(packet), { accepted: true });
  assert.equal(bufferLogger.getBufferedCount(), 1);
  assert.deepEqual(await bufferLogger.flush(), {
    emitted_count: 1,
    dropped_count: 0,
    sink_state: { sink: 'buffer', buffered_count: 1 },
  }); fixtures += 1;

  assert.deepEqual(await bufferLogger.emit({ ...packet, counterfactual: undefined }), {
    accepted: false,
    reason: 'counterfactual_missing_mandatory_field',
  }); fixtures += 1;

  const td010Packet = createFixturePacket();
  const td010Violation = {
    ...td010Packet,
    audit: {
      ...td010Packet.audit,
      td_010: { ...td010Packet.audit.td_010, plaintext_email_stored: true },
    },
  };
  assert.deepEqual(await bufferLogger.emit(td010Violation), { accepted: false, reason: 'td_010_violation' }); fixtures += 1;

  const supabaseLogger = createTrustPacketLogger({ enabled: true, sink: 'supabase' });
  await assert.rejects(() => supabaseLogger.flush(), { name: 'NotImplementedError' }); fixtures += 1;

  assert.equal(fixtures, 15);
  console.log('trust-packet-logger schema fixtures passed (15)');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
