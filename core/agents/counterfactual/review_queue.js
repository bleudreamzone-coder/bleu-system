'use strict';

const { randomUUID } = require('node:crypto');
const { NotImplementedError } = require('../_adapter');
const { REVIEW_PRIORITIES, isClinicalPriority } = require('./priority_engine');
const { isStale } = require('./staleness_thresholds');

/**
 * Review queue item lifecycle states for dormant counterfactual review infrastructure.
 *
 * @type {ReadonlyArray<string>}
 */
const QUEUE_ITEM_STATES = Object.freeze(['queued', 'in_review', 'completed', 'stale_escalated', 'deferred']);

function priorityRank(priority) {
  const index = REVIEW_PRIORITIES.indexOf(priority);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function sortQueueItems(a, b) {
  const rankDelta = priorityRank(a.priority) - priorityRank(b.priority);
  if (rankDelta !== 0) return rankDelta;
  return new Date(a.queued_at).getTime() - new Date(b.queued_at).getTime();
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function validTemplate(reviewTemplate) {
  return Boolean(
    reviewTemplate &&
    typeof reviewTemplate === 'object' &&
    typeof reviewTemplate.trust_packet_id === 'string' &&
    typeof reviewTemplate.counterfactual_class_reviewed === 'string' &&
    REVIEW_PRIORITIES.includes(reviewTemplate.priority) &&
    typeof reviewTemplate.clinical_review_required === 'boolean' &&
    typeof reviewTemplate.staleness_threshold_hours === 'number' &&
    typeof reviewTemplate.queued_at === 'string'
  );
}

function applyFilters(items, filterOptions = {}) {
  return items.filter((item) => {
    if (Array.isArray(filterOptions.priorityFilter) && !filterOptions.priorityFilter.includes(item.priority)) return false;
    if (Array.isArray(filterOptions.counterfactualClassFilter) && !filterOptions.counterfactualClassFilter.includes(item.counterfactual_class_reviewed)) return false;
    return true;
  });
}

function eligibleForReviewer(item, reviewerTier) {
  return !(item.clinical_review_required === true && reviewerTier === 'tier_1_captain');
}

/**
 * Create an in-memory dormant CounterfactualReview queue scaffold.
 *
 * @param {{sink?: 'stub'|'supabase'}} [config={}] Queue configuration. Supabase remains scaffold-only.
 * @returns {{enqueue: Function, dequeue: Function, peek: Function, getStaleEntries: Function, getStats: Function, clear: Function, isEnabled: Function, getSink: Function}} Queue API.
 */
function createReviewQueue(config = {}) {
  const queue = [];

  /**
   * Return whether queue activation has been explicitly enabled.
   *
   * @returns {boolean} True only when COUNTERFACTUAL_CAPTURE_ENABLED is exactly "true".
   */
  function isEnabled() {
    return process.env.COUNTERFACTUAL_CAPTURE_ENABLED === 'true';
  }

  /**
   * Return the configured queue sink.
   *
   * @returns {'stub'|'supabase'} Queue sink, defaulting to stub.
   */
  function getSink() {
    const sink = process.env.COUNTERFACTUAL_CAPTURE_SINK || config.sink || 'stub';
    return ['stub', 'supabase'].includes(sink) ? sink : 'stub';
  }

  /**
   * Enqueue a partial CounterfactualReview template into the dormant in-memory ordering structure.
   *
   * @param {Object} reviewTemplate Partial CounterfactualReview template.
   * @returns {Promise<{enqueued: boolean, queue_position: number|null, reason: string|null}>} Enqueue result.
   */
  async function enqueue(reviewTemplate) {
    try {
      if (!validTemplate(reviewTemplate)) {
        return { enqueued: false, queue_position: null, reason: 'invalid_review_template' };
      }
      if (getSink() === 'supabase') {
        throw new NotImplementedError('CounterfactualReview queue Supabase sink not yet wired');
      }

      const entry = Object.freeze({
        queue_entry_id: reviewTemplate.queue_entry_id || randomUUID(),
        state: 'queued',
        ...reviewTemplate,
      });
      queue.push(entry);
      queue.sort(sortQueueItems);
      return { enqueued: true, queue_position: queue.findIndex((item) => item.queue_entry_id === entry.queue_entry_id) + 1, reason: null };
    } catch (error) {
      console.error(`[CF_QUEUE] enqueue failed: ${error && error.message ? error.message : error}`);
      return { enqueued: false, queue_position: null, reason: 'infrastructure_error' };
    }
  }

  /**
   * Dequeue the next eligible template and enforce the Felicia clinical authority chain.
   *
   * @param {string} reviewerId Reviewer identifier assigned at dequeue.
   * @param {'tier_1_captain'|'tier_2_felicia'|'tier_3_felicia_autonomous'} reviewerTier Reviewer authority tier.
   * @param {{priorityFilter?: string[], counterfactualClassFilter?: string[]}} [filterOptions={}] Optional filters.
   * @returns {Promise<Object|null>} Dequeued review template or null when none are queued.
   * @throws {Error} Authority violations are caller errors and are intentionally not swallowed.
   */
  async function dequeue(reviewerId, reviewerTier, filterOptions = {}) {
    const candidates = applyFilters(queue, filterOptions).filter((item) => item.state === 'queued');
    if (candidates.length === 0) return null;

    const next = candidates[0];
    if (!eligibleForReviewer(next, reviewerTier)) {
      throw new Error('CounterfactualReview queue authority violation: clinical_class_requires_felicia_tier');
    }

    try {
      const index = queue.findIndex((item) => item.queue_entry_id === next.queue_entry_id);
      if (index === -1) return null;
      queue.splice(index, 1);
      return Object.freeze({
        ...next,
        state: 'in_review',
        reviewer_id: reviewerId,
        reviewer_tier: reviewerTier,
        dequeued_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`[CF_QUEUE] dequeue failed: ${error && error.message ? error.message : error}`);
      return null;
    }
  }

  /**
   * Return next eligible templates without removing them from the dormant queue.
   *
   * @param {'tier_1_captain'|'tier_2_felicia'|'tier_3_felicia_autonomous'} reviewerTier Reviewer authority tier.
   * @param {number} [batchSize=10] Maximum number of templates to return.
   * @returns {Promise<Object[]>} Eligible templates ordered by priority and queued_at.
   */
  async function peek(reviewerTier, batchSize = 10) {
    try {
      return queue
        .filter((item) => item.state === 'queued')
        .filter((item) => eligibleForReviewer(item, reviewerTier))
        .slice(0, batchSize);
    } catch (error) {
      console.error(`[CF_QUEUE] peek failed: ${error && error.message ? error.message : error}`);
      return [];
    }
  }

  /**
   * Return queued entries that have exceeded their priority staleness threshold.
   *
   * @returns {Promise<Object[]>} Stale queued templates.
   */
  async function getStaleEntries() {
    try {
      return queue.filter((item) => item.state === 'queued' && isStale(item.queued_at, item.priority));
    } catch (error) {
      console.error(`[CF_QUEUE] getStaleEntries failed: ${error && error.message ? error.message : error}`);
      return [];
    }
  }

  /**
   * Return queue depth, priority counts, oldest queued timestamp, and stale count.
   *
   * @returns {Promise<{total: number, by_priority: Record<string, number>, oldest_queued_at: string|null, stale_count: number}>} Queue stats.
   */
  async function getStats() {
    try {
      const byPriority = Object.fromEntries(REVIEW_PRIORITIES.map((priority) => [priority, 0]));
      for (const item of queue.filter((entry) => entry.state === 'queued')) {
        byPriority[item.priority] += 1;
      }
      const queued = queue.filter((entry) => entry.state === 'queued');
      const staleEntries = queued.filter((entry) => isStale(entry.queued_at, entry.priority));
      return {
        total: queued.length,
        by_priority: byPriority,
        oldest_queued_at: queued.length > 0 ? queued[0].queued_at : null,
        stale_count: staleEntries.length,
      };
    } catch (error) {
      console.error(`[CF_QUEUE] getStats failed: ${error && error.message ? error.message : error}`);
      return { total: 0, by_priority: Object.fromEntries(REVIEW_PRIORITIES.map((priority) => [priority, 0])), oldest_queued_at: null, stale_count: 0 };
    }
  }

  /**
   * Clear the in-memory queue for tests only; Supabase production clear is forbidden.
   *
   * @returns {Promise<{cleared_count: number}>} Number of entries removed.
   * @throws {Error} When called against the Supabase sink in production.
   */
  async function clear() {
    if (getSink() === 'supabase' && isProduction()) {
      throw new Error('counterfactual_review_queue_clear_forbidden_in_production');
    }
    try {
      const clearedCount = queue.length;
      queue.splice(0, queue.length);
      return { cleared_count: clearedCount };
    } catch (error) {
      console.error(`[CF_QUEUE] clear failed: ${error && error.message ? error.message : error}`);
      return { cleared_count: 0 };
    }
  }

  return { enqueue, dequeue, peek, getStaleEntries, getStats, clear, isEnabled, getSink };
}

module.exports = {
  QUEUE_ITEM_STATES,
  createReviewQueue,
};
