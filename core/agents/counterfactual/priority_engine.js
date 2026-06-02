'use strict';

/**
 * Institutional CounterfactualReview queue priority levels in dequeue order.
 *
 * @type {ReadonlyArray<string>}
 */
const REVIEW_PRIORITIES = Object.freeze([
  'P0_clinical_urgent',
  'P1_clinical_routine',
  'P2_quality_review',
  'P3_documentation',
]);

const PRIORITY_BY_COUNTERFACTUAL_CLASS = Object.freeze({
  crisis_missed: 'P0_clinical_urgent',
  unsafe_supplement: 'P1_clinical_routine',
  missed_referral: 'P1_clinical_routine',
  wrong_dose: 'P1_clinical_routine',
  overclaim: 'P2_quality_review',
  premature_commerce: 'P2_quality_review',
  voice_drift: 'P2_quality_review',
  privacy_leak: 'P3_documentation',
  none: 'P3_documentation',
});

const CLINICAL_PRIORITIES = Object.freeze(['P0_clinical_urgent', 'P1_clinical_routine']);

/**
 * Classify a Trust Packet counterfactual.class into the starting institutional review priority.
 * Dr. Felicia's clinical authority may override or refine this default in future doctrine.
 *
 * @param {string} counterfactualClass Trust Packet counterfactual.class value.
 * @returns {string} One REVIEW_PRIORITIES value.
 * @throws {Error} When the counterfactual class is not recognized by the v1.1 Trust Packet enum.
 */
function classifyPriority(counterfactualClass) {
  const priority = PRIORITY_BY_COUNTERFACTUAL_CLASS[counterfactualClass];
  if (!priority) {
    throw new Error(`Unrecognized counterfactual class: ${counterfactualClass}`);
  }
  return priority;
}

/**
 * Return priority levels that require tier_2_felicia or tier_3_felicia_autonomous review authority.
 *
 * @returns {ReadonlyArray<string>} Frozen clinical priority list.
 */
function getClinicalPriorities() {
  return CLINICAL_PRIORITIES;
}

/**
 * Return whether a review priority is clinical and therefore unavailable to tier_1_captain reviewers.
 *
 * @param {string} priority Candidate priority level.
 * @returns {boolean} True for P0_clinical_urgent and P1_clinical_routine.
 */
function isClinicalPriority(priority) {
  return CLINICAL_PRIORITIES.includes(priority);
}

module.exports = {
  REVIEW_PRIORITIES,
  classifyPriority,
  getClinicalPriorities,
  isClinicalPriority,
};
