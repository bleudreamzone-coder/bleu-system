// STATUS: DORMANT — counterfactual review scaffold only; not imported by server.js.
'use strict';

const crypto = require('node:crypto');
const { requiresClinicalReview } = require('./counterfactual_reviewer');

/**
 * Build a CounterfactualReview v1.1 record with generated review identity, timestamp, and TD-010 defaults.
 *
 * @param {Object} input Review creation input.
 * @param {string} input.trustPacketId Trust Packet UUID being reviewed.
 * @param {string} input.reviewerId Reviewer identifier; "stoler-f" is reserved for Dr. Felicia Stoler.
 * @param {string} input.reviewerTier Reviewer authority tier.
 * @param {string} input.verdict Review verdict.
 * @param {string} input.verdictReason Required human-authored reason for the verdict.
 * @param {string|null|undefined} input.suggestedRevision Required non-empty string only when verdict is requires_revision.
 * @param {number} input.confidence Reviewer confidence in the verdict, 0 through 1 inclusive.
 * @param {string} input.counterfactualClassReviewed Denormalized Trust Packet counterfactual.class value.
 * @returns {Object} CounterfactualReview v1.1 record candidate.
 */
function createCounterfactualReview({
  trustPacketId,
  reviewerId,
  reviewerTier,
  verdict,
  verdictReason,
  suggestedRevision,
  confidence,
  counterfactualClassReviewed,
}) {
  return {
    review_id: crypto.randomUUID(),
    trust_packet_id: trustPacketId,
    reviewer_id: reviewerId,
    reviewer_tier: reviewerTier,
    schema_version: '1.1',
    reviewed_at: new Date().toISOString(),
    verdict,
    verdict_reason: verdictReason,
    suggested_revision: suggestedRevision === undefined ? null : suggestedRevision,
    confidence,
    counterfactual_class_reviewed: counterfactualClassReviewed,
    clinical_review_required: requiresClinicalReview(counterfactualClassReviewed),
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
    },
  };
}

module.exports = { createCounterfactualReview };
