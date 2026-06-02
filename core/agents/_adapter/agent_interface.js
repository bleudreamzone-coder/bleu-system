'use strict';

const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function assertString(value, field) {
  if (typeof value !== 'string') throw new TypeError(`${field} must be a string`);
}

function assertStringArray(value, field) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new TypeError(`${field} must be an array of strings`);
  }
}

function freezeArrayCopy(values) {
  return Object.freeze([...values]);
}

/**
 * @typedef {Object} AgentDefinition
 * @property {string} id Kebab-case stable agent id used by registries and handoffs.
 * @property {string} name Human-readable agent name for audits and operator review.
 * @property {string} version Semver version for the interface contract implemented by this agent.
 * @property {string} description Human-readable scope summary; not a runtime prompt.
 * @property {string} instructions Agent system prompt text. Ships as an empty placeholder until signed language lands.
 * @property {string[]} tools Tool ids available to this agent. Ships empty for scaffold-only definitions.
 * @property {string[]} handoffs Agent ids this agent may hand off to in future runner implementations.
 * @property {1|2|3} tier Decision Matrix authority tier for review and runtime gating.
 * @property {boolean} felicia_signoff_required True for clinical agents; false for infrastructure-only agents.
 * @property {string[]} schema_refs Paths to Signal, Decision, Trust Packet, or other schemas the agent emits or consumes.
 */

/**
 * Validate and freeze a scaffold-only Agent definition.
 * This factory performs no model calls, creates no live agents, and wires no runtime behavior.
 *
 * @param {AgentDefinition} spec Candidate agent definition.
 * @returns {Readonly<AgentDefinition>} Frozen agent definition.
 */
function defineAgent(spec) {
  assertObject(spec, 'Agent spec');

  const required = [
    'id',
    'name',
    'version',
    'description',
    'instructions',
    'tools',
    'handoffs',
    'tier',
    'felicia_signoff_required',
    'schema_refs',
  ];
  for (const field of required) {
    if (spec[field] === undefined) throw new TypeError(`Agent spec missing required field: ${field}`);
  }

  assertString(spec.id, 'id');
  if (!KEBAB_CASE.test(spec.id)) throw new TypeError('id must be kebab-case');
  assertString(spec.name, 'name');
  assertString(spec.version, 'version');
  if (!SEMVER.test(spec.version)) throw new TypeError('version must be semver');
  assertString(spec.description, 'description');
  assertString(spec.instructions, 'instructions');
  assertStringArray(spec.tools, 'tools');
  assertStringArray(spec.handoffs, 'handoffs');
  if (![1, 2, 3].includes(spec.tier)) throw new TypeError('tier must be 1, 2, or 3');
  if (typeof spec.felicia_signoff_required !== 'boolean') {
    throw new TypeError('felicia_signoff_required must be a boolean');
  }
  assertStringArray(spec.schema_refs, 'schema_refs');

  const agent = {
    id: spec.id,
    name: spec.name,
    version: spec.version,
    description: spec.description,
    instructions: spec.instructions,
    tools: freezeArrayCopy(spec.tools),
    handoffs: freezeArrayCopy(spec.handoffs),
    tier: spec.tier,
    felicia_signoff_required: spec.felicia_signoff_required,
    schema_refs: freezeArrayCopy(spec.schema_refs),
  };

  return Object.freeze(agent);
}

/**
 * @param {unknown} value Candidate value.
 * @returns {value is AgentDefinition} True when the value matches the scaffold Agent shape.
 */
function isAgent(value) {
  try {
    defineAgent(value);
    return true;
  } catch (_error) {
    return false;
  }
}

module.exports = { defineAgent, isAgent };
