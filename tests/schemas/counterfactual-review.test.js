const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');
const schemaPath = path.join(__dirname, '../../core/schemas/counterfactual_review_v1.1.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const {
  createReviewer,
  requiresClinicalReview,
  validateAuthorityChain,
} = require('../../core/agents/review/counterfactual_reviewer');

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackReviewValidator(review) {
  const errors = [];
  const clinicalClasses = ['crisis_missed', 'unsafe_supplement', 'missed_referral', 'wrong_dose'];
  const nonClinicalClasses = ['overclaim', 'premature_commerce', 'privacy_leak', 'voice_drift', 'none'];
  const classes = [...clinicalClasses, ...nonClinicalClasses];
  const tiers = ['tier_1_captain', 'tier_2_felicia', 'tier_3_felicia_autonomous'];
  const verdicts = ['confirmed', 'disputed', 'requires_revision', 'insufficient_evidence'];

  if (!review || typeof review !== 'object') errors.push('review object required');
  if (!tiers.includes(review.reviewer_tier)) errors.push('invalid reviewer_tier');
  if (!verdicts.includes(review.verdict)) errors.push('invalid verdict');
  if (!classes.includes(review.counterfactual_class_reviewed)) errors.push('invalid class');
  if (typeof review.verdict_reason !== 'string' || review.verdict_reason.length < 1) errors.push('verdict_reason required');
  if (typeof review.confidence !== 'number' || review.confidence < 0 || review.confidence > 1) errors.push('invalid confidence');
  if (review.verdict === 'requires_revision') {
    if (typeof review.suggested_revision !== 'string' || review.suggested_revision.length < 1) errors.push('suggested_revision required');
  } else if (review.suggested_revision !== null) {
    errors.push('suggested_revision must be null');
  }
  const isClinical = clinicalClasses.includes(review.counterfactual_class_reviewed);
  if (review.clinical_review_required !== isClinical) errors.push('clinical flag mismatch');
  if (isClinical && review.reviewer_tier === 'tier_1_captain') errors.push('clinical requires Felicia tier');
  if (!review.td_010_compliance || review.td_010_compliance.plaintext_email_stored !== false) errors.push('email plaintext blocked');
  if (!review.td_010_compliance || review.td_010_compliance.plaintext_phone_stored !== false) errors.push('phone plaintext blocked');

  fallbackReviewValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(schema);
const validateReview = compiled ? compiled.validate : fallbackReviewValidator;
const reviewErrorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : () => (fallbackReviewValidator.errors || []).join(', ');

function baseReview(overrides = {}) {
  return {
    review_id: '11111111-1111-4111-8111-111111111111',
    trust_packet_id: '22222222-2222-4222-8222-222222222222',
    reviewer_id: 'captain-soul-gate',
    reviewer_tier: 'tier_1_captain',
    schema_version: '1.1',
    reviewed_at: '2026-06-01T00:00:00.000Z',
    verdict: 'confirmed',
    verdict_reason: 'Counterfactual claim is consistent with recorded restraint evidence.',
    suggested_revision: null,
    confidence: 0.89,
    counterfactual_class_reviewed: 'overclaim',
    clinical_review_required: false,
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
    },
    ...overrides,
  };
}

function assertValidReview(name, fixture) {
  assert.equal(validateReview(fixture), true, `${name} should validate: ${reviewErrorsText(validateReview.errors)}`);
}

function assertInvalidReview(name, fixture) {
  assert.equal(validateReview(fixture), false, `${name} should fail validation`);
}

async function run() {
  assertValidReview('valid confirmed non-clinical review with tier_1_captain', baseReview());

  assertValidReview('valid disputed clinical review with tier_2_felicia', baseReview({
    reviewer_id: 'stoler-f',
    reviewer_tier: 'tier_2_felicia',
    verdict: 'disputed',
    verdict_reason: 'The evidence does not establish the claimed crisis miss.',
    counterfactual_class_reviewed: 'crisis_missed',
    clinical_review_required: true,
  }));

  assertValidReview('valid requires_revision review with suggested_revision', baseReview({
    verdict: 'requires_revision',
    verdict_reason: 'The prevented wrong answer needs narrower language.',
    suggested_revision: 'Revise to specify the actual overclaim prevented.',
  }));

  assertValidReview('valid insufficient_evidence review', baseReview({
    verdict: 'insufficient_evidence',
    verdict_reason: 'Trust Packet evidence is not complete enough for confirmation.',
  }));

  assertValidReview('valid none class documentation review', baseReview({
    counterfactual_class_reviewed: 'none',
    clinical_review_required: false,
    verdict_reason: 'Documentation review for a no-difference counterfactual class.',
  }));

  assertInvalidReview('invalid requires_revision with null suggested_revision', baseReview({
    verdict: 'requires_revision',
    suggested_revision: null,
  }));

  assertInvalidReview('invalid confirmed with non-null suggested_revision', baseReview({
    verdict: 'confirmed',
    suggested_revision: 'Confirmed reviews must not carry revisions.',
  }));

  assertInvalidReview('invalid clinical crisis_missed review with tier_1_captain', baseReview({
    counterfactual_class_reviewed: 'crisis_missed',
    clinical_review_required: true,
  }));

  assertInvalidReview('invalid confidence greater than one', baseReview({ confidence: 1.5 }));

  assertInvalidReview('invalid plaintext_email_stored true', baseReview({
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: true,
      plaintext_phone_stored: false,
    },
  }));

  await assert.rejects(
    () => createReviewer({}).submitReview({
      trustPacketId: '33333333-3333-4333-8333-333333333333',
      reviewerId: 'captain-soul-gate',
      reviewerTier: 'tier_1_captain',
      verdict: 'confirmed',
      verdictReason: 'Captain cannot clinically confirm crisis miss.',
      suggestedRevision: null,
      confidence: 0.8,
      counterfactualClassReviewed: 'crisis_missed',
    }),
    /clinical_class_requires_felicia_tier/,
    'clinical Captain-tier submission should reject with explicit authority violation'
  );

  await assert.doesNotReject(async () => {
    const record = await createReviewer({}).submitReview({
      trustPacketId: '44444444-4444-4444-8444-444444444444',
      reviewerId: 'captain-soul-gate',
      reviewerTier: 'tier_1_captain',
      verdict: 'confirmed',
      verdictReason: 'Non-clinical overclaim review is supported by the Trust Packet.',
      suggestedRevision: null,
      confidence: 0.93,
      counterfactualClassReviewed: 'overclaim',
    });
    assert.equal(record.counterfactual_class_reviewed, 'overclaim');
    assert.equal(record.clinical_review_required, false);
  }, 'valid non-clinical submitReview should resolve with a constructed record');

  assert.equal(requiresClinicalReview('crisis_missed'), true, 'crisis_missed should require clinical review');
  assert.equal(requiresClinicalReview('voice_drift'), false, 'voice_drift should not require clinical review');
  assert.deepEqual(
    validateAuthorityChain('tier_1_captain', 'crisis_missed'),
    { valid: false, reason: 'clinical_class_requires_felicia_tier' },
    'tier_1_captain should be blocked from clinical counterfactual review'
  );
  assert.deepEqual(
    validateAuthorityChain('tier_2_felicia', 'crisis_missed'),
    { valid: true, reason: null },
    'tier_2_felicia should be allowed for clinical counterfactual review'
  );

  console.log('counterfactual review schema fixtures passed (16/16)');
}

run();
