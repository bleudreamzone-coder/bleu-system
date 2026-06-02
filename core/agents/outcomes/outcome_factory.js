// STATUS: DORMANT — outcome checkpoint scaffold only; not imported by server.js.
'use strict';

const crypto = require('node:crypto');
const { hashSessionId } = require('../../metrics/emitter');
const { detectPlaintextPII, CHECKPOINT_DAYS, DELIVERY_CHANNELS } = require('./outcome_capture');

/**
 * Return the TD-010 compliance object for OutcomeCheckpoint records.
 *
 * @returns {{pii_hashed: boolean, plaintext_email_stored: boolean, plaintext_phone_stored: boolean, plaintext_in_free_text: boolean}} Compliance flags.
 */
function td010Compliance() {
  return Object.freeze({
    pii_hashed: true,
    plaintext_email_stored: false,
    plaintext_phone_stored: false,
    plaintext_in_free_text: false,
  });
}

/**
 * Normalize and validate a checkpoint day.
 *
 * @param {number} checkpointDay Requested checkpoint day.
 * @returns {number} Valid checkpoint day.
 */
function assertCheckpointDay(checkpointDay) {
  if (!CHECKPOINT_DAYS.includes(checkpointDay)) throw new Error('checkpointDay must be one of 3, 7, or 30');
  return checkpointDay;
}

/**
 * Validate required identity and scheduling inputs shared by factories.
 *
 * @param {{trustPacketId: string, sessionId: string, citizenId: string, checkpointDay: number, scheduledAt: string}} input Shared checkpoint input.
 * @returns {void}
 */
function assertBaseInput({ trustPacketId, sessionId, citizenId, checkpointDay, scheduledAt }) {
  if (!trustPacketId) throw new Error('trustPacketId is required');
  if (!sessionId) throw new Error('sessionId is required');
  if (!citizenId) throw new Error('citizenId is required');
  assertCheckpointDay(checkpointDay);
  if (Number.isNaN(Date.parse(scheduledAt))) throw new Error('scheduledAt must be a date-time');
}

/**
 * Build a scheduled OutcomeCheckpoint v1.1 record.
 *
 * Session hashing intentionally reuses the PR #18 MetricEvent hashSessionId implementation from
 * core/metrics/emitter.js so OutcomeCheckpoint session identifiers follow the same TD-010 h_ prefix convention.
 *
 * @param {{trustPacketId: string, sessionId: string, citizenId: string, checkpointDay: number, scheduledAt: string}} input Scheduled checkpoint input.
 * @returns {Object} OutcomeCheckpoint with status "scheduled".
 */
function createScheduledCheckpoint({ trustPacketId, sessionId, citizenId, checkpointDay, scheduledAt }) {
  assertBaseInput({ trustPacketId, sessionId, citizenId, checkpointDay, scheduledAt });
  return {
    checkpoint_id: crypto.randomUUID(),
    trust_packet_id: trustPacketId,
    session_id: hashSessionId(sessionId),
    citizen_id: citizenId,
    schema_version: '1.1',
    checkpoint_day: checkpointDay,
    scheduled_at: scheduledAt,
    captured_at: null,
    status: 'scheduled',
    delivery_channel: null,
    delivery_attempts: 0,
    self_report: null,
    measurement_update: null,
    decline_reason: null,
    td_010_compliance: td010Compliance(),
  };
}

/**
 * Redact self_report.free_text using detectPlaintextPII before constructing captured records.
 *
 * @param {Object} selfReport Candidate self-report.
 * @returns {Object} Self-report with emails and phones redacted from free_text.
 */
function redactSelfReport(selfReport) {
  if (!selfReport || typeof selfReport !== 'object') throw new Error('selfReport is required');
  const redaction = detectPlaintextPII(selfReport.free_text || '');
  if ((redaction.contains_email || redaction.contains_phone) && (!redaction.redacted_text || redaction.redacted_text === selfReport.free_text)) {
    throw new Error('PII redaction failed for selfReport.free_text');
  }
  return { ...selfReport, free_text: redaction.redacted_text };
}

/**
 * Build a captured OutcomeCheckpoint v1.1 record with automatic PII redaction.
 *
 * @param {{trustPacketId: string, sessionId: string, citizenId: string, checkpointDay: number, scheduledAt: string, capturedAt: string, selfReport: Object, measurementUpdate?: Object|null, deliveryChannel?: 'sms'|'email'|'in_app'|null}} input Captured checkpoint input.
 * @returns {Object} OutcomeCheckpoint with status "captured".
 */
function createCapturedCheckpoint({
  trustPacketId,
  sessionId,
  citizenId,
  checkpointDay,
  scheduledAt,
  capturedAt,
  selfReport,
  measurementUpdate = null,
  deliveryChannel = null,
}) {
  assertBaseInput({ trustPacketId, sessionId, citizenId, checkpointDay, scheduledAt });
  if (Number.isNaN(Date.parse(capturedAt))) throw new Error('capturedAt must be a date-time');
  const earliestAllowedCapture = new Date(Date.parse(scheduledAt) - 24 * 60 * 60 * 1000);
  if (new Date(capturedAt).getTime() < earliestAllowedCapture.getTime()) {
    throw new Error('capturedAt must be no earlier than scheduledAt minus 24 hours');
  }
  if (deliveryChannel !== null && !DELIVERY_CHANNELS.includes(deliveryChannel)) throw new Error('invalid deliveryChannel');

  return {
    checkpoint_id: crypto.randomUUID(),
    trust_packet_id: trustPacketId,
    session_id: hashSessionId(sessionId),
    citizen_id: citizenId,
    schema_version: '1.1',
    checkpoint_day: checkpointDay,
    scheduled_at: scheduledAt,
    captured_at: capturedAt,
    status: 'captured',
    delivery_channel: deliveryChannel,
    delivery_attempts: deliveryChannel ? 1 : 0,
    self_report: redactSelfReport(selfReport),
    measurement_update: measurementUpdate,
    decline_reason: null,
    td_010_compliance: td010Compliance(),
  };
}

module.exports = { createScheduledCheckpoint, createCapturedCheckpoint };
