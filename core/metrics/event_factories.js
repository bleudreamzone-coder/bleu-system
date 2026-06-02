'use strict';

const crypto = require('node:crypto');
const { hashSessionId, redactErrorMessage } = require('./emitter');

function baseEvent({ sessionId, citizenId, eventType, eventSubtype, eventData }) {
  return {
    event_id: crypto.randomUUID(),
    event_type: eventType,
    event_subtype: eventSubtype,
    session_id: hashSessionId(sessionId),
    citizen_id: citizenId === undefined ? null : citizenId,
    schema_version: '1.1',
    occurred_at: new Date().toISOString(),
    event_data: eventData,
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
      plaintext_phone_in_payload: false,
    },
  };
}

/**
 * Create a chat_turn MetricEvent.
 *
 * @param {Object} input Chat turn event inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createChatTurnEvent({ sessionId, citizenId, turnIndex, role, wordCount, latencyMs }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'chat_turn',
    eventSubtype: `chat-turn-${role}`,
    eventData: { turn_index: turnIndex, role, word_count: wordCount, latency_ms: latencyMs === undefined ? null : latencyMs },
  });
}

/**
 * Create a gate_fired MetricEvent.
 *
 * @param {Object} input Gate event inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createGateFiredEvent({ sessionId, citizenId, gateName, status, reason }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'gate_fired',
    eventSubtype: `gate-${gateName.replace(/_/g, '-')}`,
    eventData: { gate_name: gateName, status, reason },
  });
}

/**
 * Create a refusal_triggered MetricEvent.
 *
 * @param {Object} input Refusal event inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createRefusalTriggeredEvent({ sessionId, citizenId, refusalNumber, refusalName, actionTaken }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'refusal_triggered',
    eventSubtype: `refusal-${refusalNumber}-${String(refusalName || 'triggered').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    eventData: { refusal_number: refusalNumber, refusal_name: refusalName, action_taken: actionTaken },
  });
}

/**
 * Create a commerce_gate_state MetricEvent.
 *
 * @param {Object} input Commerce gate state inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createCommerceGateStateEvent({ sessionId, citizenId, allowed, reason, firstResponse, hasConcern, supportTier, crisisTier }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'commerce_gate_state',
    eventSubtype: allowed ? 'commerce-allowed' : 'commerce-blocked',
    eventData: {
      allowed,
      reason: reason === undefined ? null : reason,
      first_response: firstResponse,
      has_concern: hasConcern,
      support_tier: supportTier,
      crisis_tier: crisisTier,
    },
  });
}

/**
 * Create an agent_invoked MetricEvent.
 *
 * @param {Object} input Agent invocation inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createAgentInvokedEvent({ sessionId, citizenId, agentId, agentTier, handoffFromAgentId, latencyMs }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'agent_invoked',
    eventSubtype: `agent-${agentId}`,
    eventData: { agent_id: agentId, agent_tier: agentTier, handoff_from_agent_id: handoffFromAgentId === undefined ? null : handoffFromAgentId, latency_ms: latencyMs },
  });
}

/**
 * Create a tool_invoked MetricEvent.
 *
 * @param {Object} input Tool invocation inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createToolInvokedEvent({ sessionId, citizenId, toolId, invocationId, resultStatus, latencyMs, retriesAttempted, costUsd }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'tool_invoked',
    eventSubtype: `tool-${toolId}`,
    eventData: {
      tool_id: toolId,
      invocation_id: invocationId,
      result_status: resultStatus,
      latency_ms: latencyMs,
      retries_attempted: retriesAttempted,
      cost_usd: costUsd === undefined ? 0 : costUsd,
    },
  });
}

/**
 * Create a decision_emitted MetricEvent.
 *
 * @param {Object} input Decision emission inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createDecisionEmittedEvent({ sessionId, citizenId, decisionId, signalId, gatesSummary, refusalsTriggeredCount, authority, finalAction }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'decision_emitted',
    eventSubtype: 'decision-emitted',
    eventData: {
      decision_id: decisionId,
      signal_id: signalId,
      gates_summary: gatesSummary,
      refusals_triggered_count: refusalsTriggeredCount,
      authority,
      final_action: finalAction,
    },
  });
}

/**
 * Create a trust_packet_emitted MetricEvent.
 *
 * @param {Object} input Trust Packet emission inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createTrustPacketEmittedEvent({ sessionId, citizenId, packetId, decisionId, counterfactualClass, evaluatorPassed }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'trust_packet_emitted',
    eventSubtype: 'trust-packet-emitted',
    eventData: {
      packet_id: packetId,
      decision_id: decisionId,
      counterfactual_class: counterfactualClass,
      evaluator_passed: evaluatorPassed,
    },
  });
}

/**
 * Create an error_caught MetricEvent after redacting the error message.
 *
 * @param {Object} input Error capture inputs.
 * @returns {Object} MetricEvent v1.1 record.
 */
function createErrorCaughtEvent({ sessionId, citizenId, errorClass, errorMessage, stackExcerpt, severity, recoverable }) {
  return baseEvent({
    sessionId,
    citizenId,
    eventType: 'error_caught',
    eventSubtype: `error-${severity}`,
    eventData: {
      error_class: errorClass,
      error_message: redactErrorMessage(errorMessage),
      stack_excerpt: String(stackExcerpt || '').slice(0, 500),
      severity,
      recoverable,
    },
  });
}

module.exports = {
  createAgentInvokedEvent,
  createChatTurnEvent,
  createCommerceGateStateEvent,
  createDecisionEmittedEvent,
  createErrorCaughtEvent,
  createGateFiredEvent,
  createRefusalTriggeredEvent,
  createToolInvokedEvent,
  createTrustPacketEmittedEvent,
};
