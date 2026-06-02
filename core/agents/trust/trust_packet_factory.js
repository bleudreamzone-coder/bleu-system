// STATUS: DORMANT — Trust Packet v1.1 logging factory only; live Trust Packet v0 bridge is in server.js.
'use strict';

const crypto = require('node:crypto');
const { hashAndCount } = require('./response_hasher');

function requireObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
}

function requireNonEmptyString(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

/**
 * Create an immutable Trust Packet v1.1 envelope without storing raw response text.
 * Caller input errors throw synchronously; infrastructure concerns are left to logger sinks.
 * @param {object} input Packet construction input.
 * @param {string} input.decisionId Decision Object UUID.
 * @param {string} input.signalId Signal Object UUID.
 * @param {{text: string, model: string, evaluator_passed: boolean}} input.response Raw response text and metadata.
 * @param {{class: string, prevented_wrong_answer: string, bleu_difference: string, confidence: number}} input.counterfactual Mandatory counterfactual proof.
 * @param {{day_3: object, day_7: object, day_30: object}} input.outcomePlan Outcome checkpoint plan.
 * @param {{code_version: string, doctrine_refs: string[], refusals_checked: number[], pressures_countered: string[]}} input.auditContext Audit metadata.
 * @returns {Readonly<object>} Frozen Trust Packet object.
 */
function createTrustPacket({ decisionId, signalId, response, counterfactual, outcomePlan, auditContext }) {
  requireNonEmptyString(decisionId, 'decisionId');
  requireNonEmptyString(signalId, 'signalId');
  requireObject(response, 'response');
  requireObject(counterfactual, 'counterfactual');
  requireObject(outcomePlan, 'outcomePlan');
  requireObject(auditContext, 'auditContext');
  requireNonEmptyString(counterfactual.prevented_wrong_answer, 'counterfactual.prevented_wrong_answer');
  requireNonEmptyString(response.text, 'response.text');
  requireNonEmptyString(response.model, 'response.model');

  const responseProof = hashAndCount(response.text);
  const packet = {
    packet_id: crypto.randomUUID(),
    signal_id: signalId,
    decision_id: decisionId,
    created_at: new Date().toISOString(),
    response: Object.freeze({
      hash: responseProof.hash,
      model: response.model,
      word_count: responseProof.word_count,
      evaluator_passed: Boolean(response.evaluator_passed),
    }),
    counterfactual: Object.freeze({
      class: counterfactual.class,
      prevented_wrong_answer: counterfactual.prevented_wrong_answer,
      bleu_difference: counterfactual.bleu_difference,
      confidence: counterfactual.confidence,
    }),
    outcome_plan: Object.freeze({
      day_3: Object.freeze({ ...outcomePlan.day_3 }),
      day_7: Object.freeze({ ...outcomePlan.day_7 }),
      day_30: Object.freeze({ ...outcomePlan.day_30 }),
    }),
    audit: Object.freeze({
      code_version: auditContext.code_version,
      doctrine_refs: Object.freeze([...(auditContext.doctrine_refs || [])]),
      refusals_checked: Object.freeze([...(auditContext.refusals_checked || [])]),
      pressures_countered: Object.freeze([...(auditContext.pressures_countered || [])]),
      td_010: Object.freeze({
        pii_hashed: true,
        plaintext_email_stored: false,
        plaintext_phone_stored: false,
      }),
    }),
  };

  Object.defineProperty(packet, 'schema_version', {
    value: '1.1',
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return Object.freeze(packet);
}

module.exports = {
  createTrustPacket,
};
