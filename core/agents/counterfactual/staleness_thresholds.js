// STATUS: DORMANT — counterfactual capture scaffold only; not imported by server.js.
'use strict';

/**
 * Institutional default staleness thresholds in hours by priority. Dr. Felicia may override these
 * defaults per clinical class in a future doctrine document.
 *
 * @type {Readonly<Record<string, number>>}
 */
const STALENESS_THRESHOLDS_HOURS = Object.freeze({
  P0_clinical_urgent: 24,
  P1_clinical_routine: 168,
  P2_quality_review: 720,
  P3_documentation: 2160,
});

/**
 * Return the institutional default staleness threshold for a review priority.
 * Dr. Felicia may override this default per clinical class in future doctrine.
 *
 * @param {string} priority Counterfactual review queue priority.
 * @returns {number} Threshold in integer hours.
 * @throws {Error} When the priority is not recognized.
 */
function getStalenessThresholdHours(priority) {
  const threshold = STALENESS_THRESHOLDS_HOURS[priority];
  if (!threshold) {
    throw new Error(`Unrecognized counterfactual review priority: ${priority}`);
  }
  return threshold;
}

/**
 * Return staleness metrics for a queued review item using institutional default thresholds.
 * Dr. Felicia may override these defaults per clinical class in future doctrine.
 *
 * @param {string|Date} reviewQueuedAt Queue insertion time.
 * @param {string} priority Counterfactual review queue priority.
 * @param {string|Date} [currentTime=new Date()] Comparison time; defaults to now.
 * @returns {{hoursElapsed: number, thresholdHours: number, isStale: boolean, staleness_ratio: number}} Staleness metrics.
 */
function getStaleness(reviewQueuedAt, priority, currentTime = new Date()) {
  const thresholdHours = getStalenessThresholdHours(priority);
  const queuedAt = new Date(reviewQueuedAt);
  const now = new Date(currentTime);
  const hoursElapsed = Math.max(0, (now.getTime() - queuedAt.getTime()) / (60 * 60 * 1000));
  const stalenessRatio = hoursElapsed / thresholdHours;

  return {
    hoursElapsed,
    thresholdHours,
    isStale: stalenessRatio > 1,
    staleness_ratio: stalenessRatio,
  };
}

/**
 * Return whether a queued review item is past its institutional default staleness threshold.
 * Dr. Felicia may override these defaults per clinical class in future doctrine.
 *
 * @param {string|Date} reviewQueuedAt Queue insertion time.
 * @param {string} priority Counterfactual review queue priority.
 * @param {string|Date} [currentTime=new Date()] Comparison time; defaults to now.
 * @returns {boolean} True when hoursElapsed / thresholdHours is greater than 1.0.
 */
function isStale(reviewQueuedAt, priority, currentTime = new Date()) {
  return getStaleness(reviewQueuedAt, priority, currentTime).isStale;
}

module.exports = {
  STALENESS_THRESHOLDS_HOURS,
  getStalenessThresholdHours,
  isStale,
  getStaleness,
};
