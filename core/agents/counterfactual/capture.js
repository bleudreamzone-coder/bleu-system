'use strict';

const { NotImplementedError } = require('../_adapter');
const { REVIEW_PRIORITIES, classifyPriority, isClinicalPriority } = require('./priority_engine');
const { getStalenessThresholdHours } = require('./staleness_thresholds');
const { createReviewQueue } = require('./review_queue');

function priorityRank(priority) {
  const index = REVIEW_PRIORITIES.indexOf(priority);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function readTrustPacketId(trustPacket) {
  return trustPacket.trust_packet_id || trustPacket.packet_id || trustPacket.id || null;
}

function readCounterfactualClass(trustPacket) {
  return trustPacket && trustPacket.counterfactual && trustPacket.counterfactual.class;
}

function applyFilters(templates, filters = {}) {
  let filtered = templates;
  if (Array.isArray(filters.priorityFilter)) {
    filtered = filtered.filter((template) => filters.priorityFilter.includes(template.priority));
  }
  if (Array.isArray(filters.counterfactualClassFilter)) {
    filtered = filtered.filter((template) => filters.counterfactualClassFilter.includes(template.counterfactual_class_reviewed));
  }
  if (Number.isInteger(filters.maxBatchSize) && filters.maxBatchSize >= 0) {
    filtered = filtered.slice(0, filters.maxBatchSize);
  }
  return filtered;
}

/**
 * Extract a partial CounterfactualReview template from a Trust Packet record for human assignment.
 * This is not a complete CounterfactualReview; reviewer_id, reviewer_tier, verdict, and rationale
 * fields are populated only after dequeue and submission.
 *
 * @param {Object} trustPacket Trust Packet containing a mandatory counterfactual field.
 * @returns {{trust_packet_id: string, counterfactual_class_reviewed: string, clinical_review_required: boolean, priority: string, staleness_threshold_hours: number, queued_at: string, reviewer_id: null, reviewer_tier: null, verdict: null, schema_version: '1.1', td_010_compliance: {pii_hashed: boolean, plaintext_email_stored: false, plaintext_phone_stored: false}}} Partial review template.
 * @throws {Error} When the Trust Packet counterfactual class is absent or unrecognized.
 */
function extractReviewTemplate(trustPacket) {
  const counterfactualClass = readCounterfactualClass(trustPacket || {});
  const priority = classifyPriority(counterfactualClass);
  return Object.freeze({
    trust_packet_id: readTrustPacketId(trustPacket || {}),
    counterfactual_class_reviewed: counterfactualClass,
    clinical_review_required: isClinicalPriority(priority),
    priority,
    staleness_threshold_hours: getStalenessThresholdHours(priority),
    queued_at: new Date().toISOString(),
    reviewer_id: null,
    reviewer_tier: null,
    verdict: null,
    schema_version: '1.1',
    td_010_compliance: Object.freeze({
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
    }),
  });
}

/**
 * Convert Trust Packets into review templates and sort them by clinical urgency and queued_at age.
 * Optional filters can limit priorities, counterfactual classes, and final batch size.
 *
 * @param {Object[]} trustPackets Trust Packet records.
 * @param {{maxBatchSize?: number, priorityFilter?: string[], counterfactualClassFilter?: string[]}} [filters={}] Optional batch filters.
 * @returns {Object[]} Sorted partial review templates.
 */
function prepareReviewBatch(trustPackets, filters = {}) {
  const templates = (Array.isArray(trustPackets) ? trustPackets : [])
    .map((trustPacket) => extractReviewTemplate(trustPacket))
    .sort((a, b) => {
      const priorityDelta = priorityRank(a.priority) - priorityRank(b.priority);
      if (priorityDelta !== 0) return priorityDelta;
      return new Date(a.queued_at).getTime() - new Date(b.queued_at).getTime();
    });
  return applyFilters(templates, filters);
}

/**
 * Create the dormant Counterfactual capture bridge between Trust Packet emission and review queueing.
 * Capture remains disabled unless COUNTERFACTUAL_CAPTURE_ENABLED is exactly "true" and never throws
 * infrastructure failures per Refusal 18.
 *
 * @param {{sink?: 'stub'|'supabase', queue?: Object}} [config={}] Capture configuration.
 * @returns {{capture: Function, getQueueDepth: Function, getNextBatch: Function, markStale: Function, isEnabled: Function, getSink: Function}} Capture API.
 */
function createCounterfactualCapture(config = {}) {
  const queue = config.queue || createReviewQueue(config);

  /**
   * Return whether capture activation has been explicitly enabled.
   *
   * @returns {boolean} True only when COUNTERFACTUAL_CAPTURE_ENABLED is exactly "true".
   */
  function isEnabled() {
    return process.env.COUNTERFACTUAL_CAPTURE_ENABLED === 'true';
  }

  /**
   * Return the configured dormant capture sink.
   *
   * @returns {'stub'|'supabase'} Sink name, defaulting to stub.
   */
  function getSink() {
    const sink = process.env.COUNTERFACTUAL_CAPTURE_SINK || config.sink || 'stub';
    return ['stub', 'supabase'].includes(sink) ? sink : 'stub';
  }

  /**
   * Capture a Trust Packet counterfactual into a partial review template for the dormant queue.
   * Schema validation failures resolve accepted=false; infrastructure failures are swallowed.
   *
   * @param {Object} trustPacket Trust Packet record.
   * @returns {Promise<{accepted: boolean, review_template: Object|null, reason: string|null}>} Capture result.
   */
  async function capture(trustPacket) {
    try {
      if (!trustPacket || !trustPacket.counterfactual) {
        return { accepted: false, review_template: null, reason: 'trust_packet_missing_counterfactual' };
      }
      if (!readCounterfactualClass(trustPacket)) {
        return { accepted: false, review_template: null, reason: 'trust_packet_missing_counterfactual_class' };
      }
      if (getSink() === 'supabase') {
        throw new NotImplementedError('Counterfactual capture Supabase sink not yet wired');
      }
      const reviewTemplate = extractReviewTemplate(trustPacket);
      if (isEnabled() && queue && typeof queue.enqueue === 'function') {
        await queue.enqueue(reviewTemplate);
      }
      return { accepted: true, review_template: reviewTemplate, reason: null };
    } catch (error) {
      console.error(`[CF_CAPTURE] capture failed: ${error && error.message ? error.message : error}`);
      return { accepted: false, review_template: null, reason: 'infrastructure_error' };
    }
  }

  /**
   * Return dormant capture queue depth. Stub capture returns zero until live queue wiring is enabled.
   *
   * @returns {Promise<{total: number, by_priority: Record<string, number>}>} Queue depth counts.
   */
  async function getQueueDepth() {
    return { total: 0, by_priority: Object.fromEntries(REVIEW_PRIORITIES.map((priority) => [priority, 0])) };
  }

  /**
   * Return the next review batch. Stub capture does not dequeue live items in this PR.
   *
   * @param {string} reviewerId Reviewer identifier placeholder.
   * @param {number} batchSize Requested batch size placeholder.
   * @returns {Promise<Object[]>} Empty batch until future queue-dequeue wiring.
   */
  async function getNextBatch(reviewerId, batchSize) {
    void reviewerId;
    void batchSize;
    return [];
  }

  /**
   * Mark stale entries. Stub capture returns zero until future stale-scan wiring.
   *
   * @returns {Promise<{marked_stale_count: number}>} Stale marker count.
   */
  async function markStale() {
    return { marked_stale_count: 0 };
  }

  return { capture, getQueueDepth, getNextBatch, markStale, isEnabled, getSink };
}

module.exports = {
  createCounterfactualCapture,
  extractReviewTemplate,
  prepareReviewBatch,
};
