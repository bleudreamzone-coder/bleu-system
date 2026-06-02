const crypto = require('node:crypto');
const { hashAndCount } = require('./response_hasher');

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

function assertMandatoryCounterfactual(counterfactual) {
  if (!counterfactual || typeof counterfactual !== 'object') {
    throw new Error('counterfactual is mandatory for Trust Packet creation');
  }
  if (typeof counterfactual.prevented_wrong_answer !== 'string' || counterfactual.prevented_wrong_answer.trim().length === 0) {
    throw new Error('counterfactual.prevented_wrong_answer is mandatory for Trust Packet creation');
  }
}

/**
 * Create a Trust Packet v1.1 record from Decision/Signal references and response metadata.
 *
 * The factory enforces the mandatory Counterfactual proof field, hashes response
 * text with SHA-256, stores only hash plus word count, and never persists raw
 * response text in the returned packet. The returned object follows
 * core/schemas/trust_packet_v1.1.schema.json; that schema does not currently
 * include a schema_version field, so the factory omits it to remain schema-valid.
 *
 * @param {object} args - Trust Packet construction arguments.
 * @param {string} args.decisionId - Decision Object UUID reference.
 * @param {string} args.signalId - Signal Object UUID reference.
 * @param {{text: string, model: string, evaluator_passed: boolean}} args.response - Raw response text and response metadata.
 * @param {{class: string, prevented_wrong_answer: string, bleu_difference: string, confidence: number}} args.counterfactual - Mandatory Counterfactual proof object.
 * @param {{day_3: object, day_7: object, day_30: object}} args.outcomePlan - Outcome checkpoints to embed.
 * @param {{code_version: string, doctrine_refs: string[], refusals_checked: number[], pressures_countered: string[]}} args.auditContext - Audit context to embed.
 * @returns {Readonly<object>} Frozen Trust Packet v1.1 object.
 */
function createTrustPacket({ decisionId, signalId, response, counterfactual, outcomePlan, auditContext }) {
  assertMandatoryCounterfactual(counterfactual);

  const responseMeta = hashAndCount(response && response.text);
  const packet = {
    packet_id: crypto.randomUUID(),
    signal_id: signalId,
    decision_id: decisionId,
    created_at: new Date().toISOString(),
    response: {
      hash: responseMeta.hash,
      model: response && response.model,
      word_count: responseMeta.word_count,
      evaluator_passed: Boolean(response && response.evaluator_passed),
    },
    counterfactual: {
      class: counterfactual.class,
      prevented_wrong_answer: counterfactual.prevented_wrong_answer,
      bleu_difference: counterfactual.bleu_difference,
      confidence: counterfactual.confidence,
    },
    outcome_plan: outcomePlan,
    audit: {
      code_version: auditContext && auditContext.code_version,
      doctrine_refs: auditContext && auditContext.doctrine_refs,
      refusals_checked: auditContext && auditContext.refusals_checked,
      pressures_countered: auditContext && auditContext.pressures_countered,
      td_010: {
        pii_hashed: true,
        plaintext_email_stored: false,
        plaintext_phone_stored: false,
      },
    },
  };

  return deepFreeze(packet);
}

module.exports = {
  createTrustPacket,
};
