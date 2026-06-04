'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const trustPacketSchema = require('../../core/schemas/trust_packet_v1.1.schema.json');
const {
  REVIEW_PRIORITIES,
  classifyPriority,
  isClinicalPriority,
} = require('../../core/agents/counterfactual/priority_engine');
const {
  getStalenessThresholdHours,
  isStale,
} = require('../../core/agents/counterfactual/staleness_thresholds');
const {
  extractReviewTemplate,
  prepareReviewBatch,
  createCounterfactualCapture,
} = require('../../core/agents/counterfactual/capture');
const { createReviewQueue } = require('../../core/agents/counterfactual/review_queue');

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

function compileWithAjv(schemaDocument) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackTrustPacketValidator(packet) {
  const errors = [];
  const classes = trustPacketSchema.properties.counterfactual.properties.class.enum;
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) errors.push('packet must be object');
  if (!packet.counterfactual || typeof packet.counterfactual !== 'object') errors.push('counterfactual required');
  if (packet.counterfactual && !classes.includes(packet.counterfactual.class)) errors.push('invalid counterfactual class');
  fallbackTrustPacketValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(trustPacketSchema);
const validateTrustPacket = compiled ? compiled.validate : fallbackTrustPacketValidator;
const trustPacketErrorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : () => (fallbackTrustPacketValidator.errors || []).join(', ');

function validTrustPacket(overrides = {}) {
  return {
    packet_id: '11111111-1111-4111-8111-111111111111',
    schema_version: '1.1',
    created_at: '2026-06-02T00:00:00.000Z',
    request_id: '22222222-2222-4222-8222-222222222222',
    agent_id: 'counterfactual-capture-test',
    decision_ref: '33333333-3333-4333-8333-333333333333',
    counterfactual: {
      class: 'unsafe_supplement',
      prevented_wrong_answer: 'Generic AI would recommend an unsafe supplement combination.',
      bleu_difference: 'BLEU restrained the supplement recommendation and elevated safety context.',
      confidence: 0.87,
    },
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
    },
    ...overrides,
  };
}

function assertValidTrustPacket(name, packet) {
  assert.equal(validateTrustPacket(packet), true, `${name} should validate: ${trustPacketErrorsText(validateTrustPacket.errors)}`);
}

async function run() {
  assert.equal(classifyPriority('crisis_missed'), 'P0_clinical_urgent');
  assert.equal(classifyPriority('unsafe_supplement'), 'P1_clinical_routine');
  assert.equal(classifyPriority('overclaim'), 'P2_quality_review');
  assert.equal(classifyPriority('privacy_leak'), 'P3_documentation');
  assert.equal(classifyPriority('none'), 'P3_documentation');
  assert.throws(() => classifyPriority('unknown_class'), /unknown_class/);
  assert.equal(isClinicalPriority('P0_clinical_urgent'), true);
  assert.equal(isClinicalPriority('P2_quality_review'), false);

  assert.equal(getStalenessThresholdHours('P0_clinical_urgent'), 24);
  assert.equal(getStalenessThresholdHours('P3_documentation'), 2160);
  const now = new Date('2026-06-02T00:00:00.000Z');
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  assert.equal(isStale(twoDaysAgo, 'P0_clinical_urgent', now), true);
  assert.equal(isStale(twoDaysAgo, 'P1_clinical_routine', now), false);

  const packet = validTrustPacket();
  assertValidTrustPacket('valid unsafe_supplement Trust Packet', packet);
  const template = extractReviewTemplate(packet);
  assert.equal(template.trust_packet_id, packet.packet_id);
  assert.equal(template.counterfactual_class_reviewed, 'unsafe_supplement');
  assert.equal(template.priority, 'P1_clinical_routine');
  assert.equal(template.clinical_review_required, true);
  assert.equal(template.staleness_threshold_hours, 168);
  assert.equal(template.reviewer_id, null);
  assert.equal(template.reviewer_tier, null);
  assert.equal(template.verdict, null);
  assert.equal(template.schema_version, '1.1');
  assert.deepEqual(template.td_010_compliance, {
    pii_hashed: true,
    plaintext_email_stored: false,
    plaintext_phone_stored: false,
  });

  const capture = createCounterfactualCapture({});
  const missingCounterfactualResult = await capture.capture({ packet_id: '00000000-0000-4000-8000-000000000000' });
  assert.deepEqual(missingCounterfactualResult, {
    accepted: false,
    review_template: null,
    reason: 'trust_packet_missing_counterfactual',
  });

  const batch = prepareReviewBatch([
    validTrustPacket({ packet_id: '44444444-4444-4444-8444-444444444444', counterfactual: { ...packet.counterfactual, class: 'voice_drift' } }),
    validTrustPacket({ packet_id: '55555555-5555-4555-8555-555555555555', counterfactual: { ...packet.counterfactual, class: 'crisis_missed' } }),
    validTrustPacket({ packet_id: '66666666-6666-4666-8666-666666666666', counterfactual: { ...packet.counterfactual, class: 'unsafe_supplement' } }),
  ]);
  assert.deepEqual(batch.map((item) => item.priority), ['P0_clinical_urgent', 'P1_clinical_routine', 'P2_quality_review']);

  const captainQueue = createReviewQueue({});
  await captainQueue.enqueue(template);
  await assert.rejects(
    () => captainQueue.dequeue('captain', 'tier_1_captain', {}),
    /clinical_class_requires_felicia_tier/,
    'tier_1_captain cannot dequeue clinical review templates'
  );

  const feliciaQueue = createReviewQueue({});
  await feliciaQueue.enqueue(template);
  const feliciaItem = await feliciaQueue.dequeue('stoler-f', 'tier_2_felicia', {});
  assert.equal(feliciaItem.reviewer_id, 'stoler-f');
  assert.equal(feliciaItem.reviewer_tier, 'tier_2_felicia');
  assert.equal(feliciaItem.state, 'in_review');

  const nonClinicalQueue = createReviewQueue({});
  const nonClinicalTemplate = extractReviewTemplate(validTrustPacket({
    packet_id: '77777777-7777-4777-8777-777777777777',
    counterfactual: { ...packet.counterfactual, class: 'overclaim' },
  }));
  await nonClinicalQueue.enqueue(nonClinicalTemplate);
  const peekedByCaptain = await nonClinicalQueue.peek('tier_1_captain', 5);
  assert.equal(peekedByCaptain.length, 1);
  assert.equal(peekedByCaptain[0].priority, 'P2_quality_review');
  assert.equal(createReviewQueue({}).isEnabled(), false);
  assert.equal(REVIEW_PRIORITIES.length, 4);

  console.log('counterfactual capture fixtures passed (17/17)');
}

run();
