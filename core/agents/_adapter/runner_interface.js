// STATUS: DORMANT — SDK adapter scaffold only; not imported by server.js.
'use strict';

class NotImplementedError extends Error {
  constructor(message = 'Not implemented') {
    super(message);
    this.name = 'NotImplementedError';
  }
}

/**
 * @typedef {Object} RunResult
 * @property {string|null} agent_id Agent id that produced the final result.
 * @property {string|null} decision_id Decision Object id emitted by the run, when available.
 * @property {string|null} trust_packet_id Trust Packet id emitted by the run, when available.
 * @property {string[]} handoff_chain Handoff ids invoked during the run.
 * @property {number} latency_ms End-to-end runner latency in milliseconds.
 * @property {Error[]} errors Errors captured during the run.
 */

/**
 * @typedef {Object} Runner
 * @property {(input: unknown, opts?: Object) => Promise<RunResult>} run Execute an agent run and return the audit contract.
 */

/**
 * Create the runner contract for the future orchestrator.
 *
 * Future PRs replace this stub with a real implementation routing to the OpenAI Agents SDK
 * or Anthropic agentic patterns. This PR ships only the contract and intentionally performs
 * no live routing, no model calls, and no production behavior changes.
 *
 * @param {Object} config Future runner configuration placeholder.
 * @returns {Runner} Runner contract whose run method throws until wired.
 */
function createRunner(config = {}) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('Runner config must be an object');
  }

  return Object.freeze({
    async run(_input, _opts = {}) {
      throw new NotImplementedError('Runner not yet wired');
    },
  });
}

module.exports = { NotImplementedError, createRunner };
