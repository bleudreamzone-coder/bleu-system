// STATUS: DORMANT — SDK adapter scaffold only; not imported by server.js.
'use strict';

const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

/**
 * @typedef {Object} HandoffDefinition
 * @property {string} from_agent_id Source agent id for the handoff edge.
 * @property {string} to_agent_id Destination agent id for the handoff edge.
 * @property {Function|null} condition Predicate reference for future runners; null in scaffold-only mode.
 * @property {string} reason Human-readable trigger description for audit and review.
 * @property {boolean} records_decision Whether the handoff emits a Decision Object entry.
 */

/**
 * Validate and freeze a scaffold-only Handoff definition.
 * This factory creates no live routes and invokes no condition functions.
 *
 * @param {HandoffDefinition} spec Candidate handoff definition.
 * @returns {Readonly<HandoffDefinition>} Frozen handoff definition.
 */
function defineHandoff(spec) {
  assertObject(spec, 'Handoff spec');

  const required = ['from_agent_id', 'to_agent_id', 'condition', 'reason', 'records_decision'];
  for (const field of required) {
    if (spec[field] === undefined) throw new TypeError(`Handoff spec missing required field: ${field}`);
  }

  if (typeof spec.from_agent_id !== 'string' || !KEBAB_CASE.test(spec.from_agent_id)) {
    throw new TypeError('from_agent_id must be kebab-case');
  }
  if (typeof spec.to_agent_id !== 'string' || !KEBAB_CASE.test(spec.to_agent_id)) {
    throw new TypeError('to_agent_id must be kebab-case');
  }
  if (spec.condition !== null && typeof spec.condition !== 'function') {
    throw new TypeError('condition must be null or a function');
  }
  if (typeof spec.reason !== 'string') throw new TypeError('reason must be a string');
  if (typeof spec.records_decision !== 'boolean') throw new TypeError('records_decision must be a boolean');

  return Object.freeze({
    from_agent_id: spec.from_agent_id,
    to_agent_id: spec.to_agent_id,
    condition: spec.condition,
    reason: spec.reason,
    records_decision: spec.records_decision,
  });
}

module.exports = { defineHandoff };
