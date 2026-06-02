// STATUS: DORMANT — outcome checkpoint scaffold only; not imported by server.js.
'use strict';

const { NotImplementedError } = require('../_adapter');

const CHECKPOINT_DAYS = Object.freeze([3, 7, 30]);
const CHECKPOINT_STATUSES = Object.freeze(['scheduled', 'captured', 'missed', 'declined', 'expired']);
const DELIVERY_CHANNELS = Object.freeze(['sms', 'email', 'in_app']);
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const UUID_NIL = '00000000-0000-0000-0000-000000000000';

/**
 * Detect and redact plaintext email and common US phone formats in caller-provided text.
 *
 * @param {unknown} text Candidate free-text content.
 * @returns {{contains_email: boolean, contains_phone: boolean, redacted_text: string}} PII detection flags and redacted text.
 */
function detectPlaintextPII(text) {
  const source = String(text || '');
  const contains_email = new RegExp(EMAIL_RE.source, 'g').test(source);
  const contains_phone = new RegExp(PHONE_RE.source, 'g').test(source);
  const redacted_text = source.replace(EMAIL_RE, '[REDACTED-EMAIL]').replace(PHONE_RE, '[REDACTED-PHONE]');
  return { contains_email, contains_phone, redacted_text };
}

/**
 * Validate an OutcomeCheckpoint status transition and state-shape requirements.
 *
 * @param {string} currentStatus Current checkpoint status.
 * @param {string} newStatus Requested checkpoint status.
 * @param {boolean} hasCapturedAt Whether the resulting checkpoint has a captured_at timestamp.
 * @param {boolean} hasSelfReport Whether the resulting checkpoint has a self_report object.
 * @param {boolean} [hasDeclineReason=false] Whether the resulting checkpoint has a decline_reason string.
 * @returns {{valid: boolean, reason: string|null}} Validation result and nullable failure reason.
 */
function validateCheckpointTransition(currentStatus, newStatus, hasCapturedAt, hasSelfReport, hasDeclineReason = false) {
  if (!CHECKPOINT_STATUSES.includes(currentStatus)) return { valid: false, reason: `invalid current status: ${currentStatus}` };
  if (!CHECKPOINT_STATUSES.includes(newStatus)) return { valid: false, reason: `invalid new status: ${newStatus}` };

  const allowed = {
    scheduled: ['captured', 'missed', 'declined', 'expired', 'scheduled'],
    missed: ['captured', 'expired', 'declined', 'missed'],
    captured: ['captured'],
    declined: ['declined'],
    expired: ['expired'],
  };
  if (!allowed[currentStatus].includes(newStatus)) return { valid: false, reason: `${currentStatus} cannot transition to ${newStatus}` };

  if (newStatus === 'captured' && !hasCapturedAt) return { valid: false, reason: 'captured transition requires captured_at' };
  if (newStatus === 'captured' && !hasSelfReport) return { valid: false, reason: 'captured transition requires self_report' };
  if (['scheduled', 'missed', 'expired'].includes(newStatus) && hasCapturedAt) return { valid: false, reason: `${newStatus} transition requires captured_at null` };
  if (['scheduled', 'missed', 'expired'].includes(newStatus) && hasSelfReport) return { valid: false, reason: `${newStatus} transition requires self_report null` };
  if (newStatus === 'declined' && !hasDeclineReason) return { valid: false, reason: 'declined transition requires decline_reason' };
  if (newStatus === 'declined' && hasSelfReport) return { valid: false, reason: 'declined transition requires self_report null' };

  return { valid: true, reason: null };
}

/**
 * Swallow infrastructure errors under Refusal 18 while preserving caller-visible validation errors.
 *
 * @param {unknown} error Infrastructure error candidate.
 * @param {unknown} fallback Value to return when swallowing the error.
 * @returns {unknown} Provided fallback.
 */
function swallowInfrastructureError(error, fallback) {
  console.error(`[OUTCOMES] ${error && error.message ? error.message : String(error)}`);
  return fallback;
}

/**
 * Return a date-time string dayOffset days after the provided base time.
 *
 * @param {Date} baseDate Date basis.
 * @param {number} dayOffset Number of days to add.
 * @returns {string} ISO date-time.
 */
function addDays(baseDate, dayOffset) {
  return new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Build a dormant-by-default OutcomeCheckpoint capture adapter.
 *
 * @param {{sink?: 'stub'|'supabase'}} [config={}] Future capture adapter configuration.
 * @returns {{schedule: Function, capture: Function, markMissed: Function, markExpired: Function, markDeclined: Function, getDue: Function, getByCitizen: Function, getByTrustPacket: Function, isEnabled: Function, getSink: Function}} Outcome capture API.
 */
function createOutcomeCapture(config = {}) {
  const checkpoints = new Map();

  /**
   * Return whether outcome capture is explicitly enabled.
   *
   * @returns {boolean} True only when OUTCOME_CAPTURE_ENABLED is exactly "true".
   */
  function isEnabled() {
    return process.env.OUTCOME_CAPTURE_ENABLED === 'true';
  }

  /**
   * Return the configured outcome sink.
   *
   * @returns {'stub'|'supabase'} Outcome sink, defaulting to stub.
   */
  function getSink() {
    const sink = process.env.OUTCOME_CAPTURE_SINK || config.sink || 'stub';
    return sink === 'supabase' ? 'supabase' : 'stub';
  }

  /**
   * Throw if this adapter is configured for a not-yet-implemented Supabase sink.
   *
   * @returns {void}
   */
  function assertStubSink() {
    if (getSink() === 'supabase') throw new NotImplementedError('OutcomeCheckpoint Supabase sink not yet wired');
  }

  /**
   * Schedule one OutcomeCheckpoint for each day_N key present in a Trust Packet outcome_plan.
   *
   * @param {{trustPacketId: string, sessionId: string, citizenId: string, outcomePlan: Object}} input Schedule input.
   * @returns {Promise<Object[]>} Constructed scheduled checkpoints; not persisted in shadow mode.
   */
  async function schedule({ trustPacketId, sessionId, citizenId, outcomePlan }) {
    if (!trustPacketId || !sessionId || !citizenId || !outcomePlan) throw new Error('schedule requires trustPacketId, sessionId, citizenId, and outcomePlan');
    try {
      assertStubSink();
      const { createScheduledCheckpoint } = require('./outcome_factory');
      const now = new Date();
      const records = CHECKPOINT_DAYS.filter((day) => Object.prototype.hasOwnProperty.call(outcomePlan, `day_${day}`)).map((day) => {
        const planned = outcomePlan[`day_${day}`] || {};
        const scheduledAt = planned.scheduled_at || planned.scheduledAt || addDays(now, day);
        const record = createScheduledCheckpoint({ trustPacketId, sessionId, citizenId, checkpointDay: day, scheduledAt });
        checkpoints.set(record.checkpoint_id, record);
        return record;
      });
      return records;
    } catch (error) {
      if (error instanceof NotImplementedError) return swallowInfrastructureError(error, []);
      throw error;
    }
  }

  /**
   * Capture a Citizen self-report and optional measurement update for a checkpoint.
   *
   * @param {{checkpointId: string, selfReport: Object, measurementUpdate?: Object|null}} input Capture input.
   * @returns {Promise<Object>} Captured checkpoint record.
   */
  async function capture({ checkpointId, selfReport, measurementUpdate = null }) {
    if (!checkpointId || !selfReport) throw new Error('capture requires checkpointId and selfReport');
    const current = checkpoints.get(checkpointId) || {
      trust_packet_id: UUID_NIL,
      session_id: 'h_shadow_capture',
      citizen_id: UUID_NIL,
      checkpoint_day: 3,
      scheduled_at: new Date().toISOString(),
      status: 'scheduled',
    };
    const capturedAt = new Date().toISOString();
    const transition = validateCheckpointTransition(current.status, 'captured', true, true);
    if (!transition.valid) throw new Error(transition.reason);

    try {
      assertStubSink();
      const { createCapturedCheckpoint } = require('./outcome_factory');
      const record = createCapturedCheckpoint({
        trustPacketId: current.trust_packet_id,
        sessionId: current.session_id,
        citizenId: current.citizen_id,
        checkpointDay: current.checkpoint_day,
        scheduledAt: current.scheduled_at,
        capturedAt,
        selfReport,
        measurementUpdate,
        deliveryChannel: current.delivery_channel,
      });
      record.checkpoint_id = checkpointId;
      checkpoints.set(checkpointId, record);
      return record;
    } catch (error) {
      if (error instanceof NotImplementedError) return swallowInfrastructureError(error, null);
      throw error;
    }
  }

  /**
   * Mark a checkpoint as missed in stub mode.
   *
   * @param {{checkpointId: string}} input Missed checkpoint input.
   * @returns {Promise<Object>} Missed checkpoint record.
   */
  async function markMissed({ checkpointId }) {
    if (!checkpointId) throw new Error('markMissed requires checkpointId');
    const current = checkpoints.get(checkpointId) || {};
    const transition = validateCheckpointTransition(current.status || 'scheduled', 'missed', false, false);
    if (!transition.valid) throw new Error(transition.reason);
    try {
      assertStubSink();
      const record = { ...current, checkpoint_id: checkpointId, status: 'missed', captured_at: null, self_report: null };
      checkpoints.set(checkpointId, record);
      return record;
    } catch (error) {
      if (error instanceof NotImplementedError) return swallowInfrastructureError(error, null);
      throw error;
    }
  }

  /**
   * Mark eligible checkpoints as expired in stub mode.
   *
   * @param {{checkpointIds: string[]}} input Expiration input.
   * @returns {Promise<{count: number}>} Stub expiration count.
   */
  async function markExpired({ checkpointIds }) {
    if (!Array.isArray(checkpointIds)) throw new Error('markExpired requires checkpointIds array');
    try {
      assertStubSink();
      return { count: 0 };
    } catch (error) {
      if (error instanceof NotImplementedError) return swallowInfrastructureError(error, { count: 0 });
      throw error;
    }
  }

  /**
   * Mark a checkpoint as explicitly declined by the Citizen.
   *
   * @param {{checkpointId: string, declineReason: string}} input Decline input.
   * @returns {Promise<Object>} Declined checkpoint record.
   */
  async function markDeclined({ checkpointId, declineReason }) {
    if (!checkpointId) throw new Error('markDeclined requires checkpointId');
    if (typeof declineReason !== 'string' || declineReason.trim().length === 0) throw new Error('declineReason must be non-empty');
    const current = checkpoints.get(checkpointId) || {};
    const transition = validateCheckpointTransition(current.status || 'scheduled', 'declined', true, false, true);
    if (!transition.valid) throw new Error(transition.reason);
    try {
      assertStubSink();
      const record = { ...current, checkpoint_id: checkpointId, status: 'declined', captured_at: new Date().toISOString(), self_report: null, decline_reason: declineReason };
      checkpoints.set(checkpointId, record);
      return record;
    } catch (error) {
      if (error instanceof NotImplementedError) return swallowInfrastructureError(error, null);
      throw error;
    }
  }

  /**
   * Return due checkpoints before a date; empty until SQL persistence is wired.
   *
   * @param {Date|string} beforeDate Upper bound for scheduled_at in future SQL query.
   * @returns {Promise<Object[]>} Empty stub array.
   */
  async function getDue(beforeDate) {
    if (!beforeDate) throw new Error('getDue requires beforeDate');
    try {
      assertStubSink();
      return [];
    } catch (error) {
      if (error instanceof NotImplementedError) return swallowInfrastructureError(error, []);
      throw error;
    }
  }

  /**
   * Return checkpoint history for a Citizen; empty until persistence is wired.
   *
   * @param {string} citizenId Citizen UUID.
   * @returns {Promise<Object[]>} Empty stub array.
   */
  async function getByCitizen(citizenId) {
    if (!citizenId) throw new Error('getByCitizen requires citizenId');
    try {
      assertStubSink();
      return [];
    } catch (error) {
      if (error instanceof NotImplementedError) return swallowInfrastructureError(error, []);
      throw error;
    }
  }

  /**
   * Return checkpoint history for a Trust Packet; empty until persistence is wired.
   *
   * @param {string} trustPacketId Trust Packet UUID.
   * @returns {Promise<Object[]>} Empty stub array.
   */
  async function getByTrustPacket(trustPacketId) {
    if (!trustPacketId) throw new Error('getByTrustPacket requires trustPacketId');
    try {
      assertStubSink();
      return [];
    } catch (error) {
      if (error instanceof NotImplementedError) return swallowInfrastructureError(error, []);
      throw error;
    }
  }

  return Object.freeze({ schedule, capture, markMissed, markExpired, markDeclined, getDue, getByCitizen, getByTrustPacket, isEnabled, getSink });
}

module.exports = {
  CHECKPOINT_DAYS,
  CHECKPOINT_STATUSES,
  DELIVERY_CHANNELS,
  createOutcomeCapture,
  detectPlaintextPII,
  validateCheckpointTransition,
};
