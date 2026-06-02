'use strict';

const fs = require('node:fs');
const path = require('node:path');
const counterfactualReviewSchema = require('../../schemas/counterfactual_review_v1.1.schema.json');
const { NotImplementedError } = require('../_adapter');

const ajv2020Path = path.join(__dirname, '../../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../../node_modules/ajv-formats');

const REVIEWER_TIERS = Object.freeze(['tier_1_captain', 'tier_2_felicia', 'tier_3_felicia_autonomous']);
const REVIEW_VERDICTS = Object.freeze(['confirmed', 'disputed', 'requires_revision', 'insufficient_evidence']);
const COUNTERFACTUAL_CLASSES = Object.freeze([
  'crisis_missed',
  'unsafe_supplement',
  'overclaim',
  'premature_commerce',
  'wrong_dose',
  'missed_referral',
  'privacy_leak',
  'voice_drift',
  'none',
]);
const CLINICAL_COUNTERFACTUAL_CLASSES = Object.freeze(['crisis_missed', 'unsafe_supplement', 'missed_referral', 'wrong_dose']);

/**
 * Return whether a Trust Packet counterfactual class is in the clinical review subset.
 *
 * @param {string} counterfactualClass Trust Packet counterfactual.class value.
 * @returns {boolean} True for crisis_missed, unsafe_supplement, missed_referral, and wrong_dose.
 */
function requiresClinicalReview(counterfactualClass) {
  return CLINICAL_COUNTERFACTUAL_CLASSES.includes(counterfactualClass);
}

/**
 * Validate whether a reviewer tier may review a counterfactual class under the Felicia authority chain.
 *
 * @param {string} reviewerTier Proposed reviewer authority tier.
 * @param {string} counterfactualClass Trust Packet counterfactual.class value.
 * @returns {{valid: boolean, reason: string|null}} Validation result. Clinical tier violations return reason clinical_class_requires_felicia_tier.
 */
function validateAuthorityChain(reviewerTier, counterfactualClass) {
  if (requiresClinicalReview(counterfactualClass) && reviewerTier === 'tier_1_captain') {
    return { valid: false, reason: 'clinical_class_requires_felicia_tier' };
  }

  return { valid: true, reason: null };
}

/**
 * Build an AJV validator when local dependencies are available, otherwise use the built-in fallback validator.
 *
 * @returns {{validate: Function, errorsText: Function}} CounterfactualReview validator bundle.
 */
function createValidator() {
  if (fs.existsSync(`${ajv2020Path}.js`) && fs.existsSync(ajvFormatsPath)) {
    const Ajv2020 = require(ajv2020Path);
    const addFormats = require(ajvFormatsPath);
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    return {
      validate: ajv.compile(counterfactualReviewSchema),
      errorsText: (errors) => ajv.errorsText(errors),
    };
  }

  return {
    validate: fallbackCounterfactualReviewValidator,
    errorsText: () => (fallbackCounterfactualReviewValidator.errors || []).join(', '),
  };
}

/**
 * Validate a CounterfactualReview using a local subset of the v1.1 schema when AJV is unavailable.
 *
 * @param {Object} review Review candidate.
 * @returns {boolean} True when the candidate satisfies the fallback validation rules.
 */
function fallbackCounterfactualReviewValidator(review) {
  const errors = [];
  if (!review || typeof review !== 'object' || Array.isArray(review)) errors.push('review must be object');
  const candidate = review || {};
  const required = [
    'review_id',
    'trust_packet_id',
    'reviewer_id',
    'reviewer_tier',
    'schema_version',
    'reviewed_at',
    'verdict',
    'verdict_reason',
    'suggested_revision',
    'confidence',
    'counterfactual_class_reviewed',
    'clinical_review_required',
    'td_010_compliance',
  ];

  for (const field of required) {
    if (candidate[field] === undefined) errors.push(`missing required property ${field}`);
  }

  for (const field of Object.keys(candidate)) {
    if (!required.includes(field)) errors.push(`additional property ${field}`);
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (candidate.review_id !== undefined && !uuidPattern.test(candidate.review_id)) errors.push('review_id must be uuid');
  if (candidate.trust_packet_id !== undefined && !uuidPattern.test(candidate.trust_packet_id)) errors.push('trust_packet_id must be uuid');
  if (candidate.reviewer_id !== undefined && (typeof candidate.reviewer_id !== 'string' || candidate.reviewer_id.length < 1)) errors.push('reviewer_id must be non-empty string');
  if (candidate.reviewer_tier !== undefined && !REVIEWER_TIERS.includes(candidate.reviewer_tier)) errors.push('invalid reviewer_tier');
  if (candidate.schema_version !== undefined && candidate.schema_version !== '1.1') errors.push('schema_version must be 1.1');
  if (candidate.reviewed_at !== undefined && Number.isNaN(Date.parse(candidate.reviewed_at))) errors.push('reviewed_at must be date-time');
  if (candidate.verdict !== undefined && !REVIEW_VERDICTS.includes(candidate.verdict)) errors.push('invalid verdict');
  if (candidate.verdict_reason !== undefined && (typeof candidate.verdict_reason !== 'string' || candidate.verdict_reason.length < 1)) errors.push('verdict_reason must be non-empty string');
  if (candidate.confidence !== undefined && (typeof candidate.confidence !== 'number' || candidate.confidence < 0 || candidate.confidence > 1)) errors.push('confidence must be between 0 and 1');
  if (candidate.counterfactual_class_reviewed !== undefined && !COUNTERFACTUAL_CLASSES.includes(candidate.counterfactual_class_reviewed)) errors.push('invalid counterfactual_class_reviewed');

  if (candidate.verdict === 'requires_revision') {
    if (typeof candidate.suggested_revision !== 'string' || candidate.suggested_revision.length < 1) errors.push('requires_revision needs suggested_revision');
  } else if (candidate.suggested_revision !== null) {
    errors.push('non-revision verdict requires null suggested_revision');
  }

  const expectedClinical = requiresClinicalReview(candidate.counterfactual_class_reviewed);
  if (candidate.clinical_review_required !== undefined && candidate.clinical_review_required !== expectedClinical) errors.push('clinical_review_required does not match class');
  const authority = validateAuthorityChain(candidate.reviewer_tier, candidate.counterfactual_class_reviewed);
  if (!authority.valid) errors.push(authority.reason);

  const td010 = candidate.td_010_compliance || {};
  if (!td010 || typeof td010 !== 'object' || Array.isArray(td010)) errors.push('td_010_compliance must be object');
  for (const field of ['pii_hashed', 'plaintext_email_stored', 'plaintext_phone_stored']) {
    if (td010[field] === undefined) errors.push(`td_010_compliance missing ${field}`);
  }
  for (const field of Object.keys(td010)) {
    if (!['pii_hashed', 'plaintext_email_stored', 'plaintext_phone_stored'].includes(field)) errors.push(`td_010_compliance additional property ${field}`);
  }
  if (td010.pii_hashed !== undefined && typeof td010.pii_hashed !== 'boolean') errors.push('pii_hashed must be boolean');
  if (td010.plaintext_email_stored !== undefined && td010.plaintext_email_stored !== false) errors.push('plaintext_email_stored must be false');
  if (td010.plaintext_phone_stored !== undefined && td010.plaintext_phone_stored !== false) errors.push('plaintext_phone_stored must be false');

  fallbackCounterfactualReviewValidator.errors = errors;
  return errors.length === 0;
}

fallbackCounterfactualReviewValidator.errors = [];

/**
 * Create a dormant-by-default CounterfactualReview adapter.
 *
 * @param {Object} config Future reviewer adapter configuration placeholder.
 * @returns {{submitReview: Function, getPending: Function, getByVerdict: Function, getByReviewer: Function, getByTrustPacket: Function, isEnabled: Function, getSink: Function}} Reviewer API.
 */
function createReviewer(config = {}) {
  const validator = createValidator();

  /**
   * Return whether CounterfactualReview submission has been explicitly enabled.
   *
   * @returns {boolean} True only when COUNTERFACTUAL_REVIEWER_ENABLED is exactly "true".
   */
  function isEnabled() {
    return process.env.COUNTERFACTUAL_REVIEWER_ENABLED === 'true';
  }

  /**
   * Return the configured reviewer sink.
   *
   * @returns {'stub'|'supabase'} Sink name, defaulting to stub for no-persistence shadow mode.
   */
  function getSink() {
    const sink = process.env.COUNTERFACTUAL_REVIEWER_SINK || config.sink || 'stub';
    return ['stub', 'supabase'].includes(sink) ? sink : 'stub';
  }

  /**
   * Build, validate, and submit a CounterfactualReview record to the dormant sink.
   *
   * @param {Object} input Review submission input.
   * @returns {Promise<Object>} Resolves with the constructed CounterfactualReview record when valid.
   */
  async function submitReview(input) {
    const authority = validateAuthorityChain(input && input.reviewerTier, input && input.counterfactualClassReviewed);
    if (!authority.valid) {
      throw new Error(`CounterfactualReview authority violation: ${authority.reason}`);
    }

    try {
      const { createCounterfactualReview } = require('./review_factory');
      const record = createCounterfactualReview(input || {});
      if (!validator.validate(record)) {
        throw new Error(`CounterfactualReview schema validation failed: ${validator.errorsText(validator.validate.errors)}`);
      }

      if (getSink() === 'supabase') {
        throw new NotImplementedError('CounterfactualReview Supabase sink not yet wired');
      }

      return record;
    } catch (error) {
      if (error instanceof NotImplementedError || /CounterfactualReview schema validation failed/.test(error.message || '')) {
        throw error;
      }
      console.error(`[REVIEWER] submitReview failed: ${error && error.message ? error.message : error}`);
      throw error;
    }
  }

  /**
   * Return pending reviews from the dormant stub queue.
   *
   * @returns {Promise<Object[]>} Empty array until a future persistence PR wires the adapter.
   */
  async function getPending() {
    return [];
  }

  /**
   * Return reviews matching a verdict from the dormant stub queue.
   *
   * @param {string} verdict Verdict filter.
   * @returns {Promise<Object[]>} Empty array until a future persistence PR wires the adapter.
   */
  async function getByVerdict(verdict) {
    if (!REVIEW_VERDICTS.includes(verdict)) throw new Error(`Invalid CounterfactualReview verdict: ${verdict}`);
    return [];
  }

  /**
   * Return reviews submitted by a reviewer from the dormant stub queue.
   *
   * @param {string} reviewerId Reviewer identifier.
   * @returns {Promise<Object[]>} Empty array until a future persistence PR wires the adapter.
   */
  async function getByReviewer(reviewerId) {
    void reviewerId;
    return [];
  }

  /**
   * Return all reviews tied to a Trust Packet from the dormant stub queue.
   *
   * @param {string} trustPacketId Trust Packet UUID.
   * @returns {Promise<Object[]>} Empty array until a future persistence PR wires the adapter.
   */
  async function getByTrustPacket(trustPacketId) {
    void trustPacketId;
    return [];
  }

  return Object.freeze({ submitReview, getPending, getByVerdict, getByReviewer, getByTrustPacket, isEnabled, getSink });
}

module.exports = {
  REVIEWER_TIERS,
  CLINICAL_COUNTERFACTUAL_CLASSES,
  createReviewer,
  requiresClinicalReview,
  validateAuthorityChain,
};
