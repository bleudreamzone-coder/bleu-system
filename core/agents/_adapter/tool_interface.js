// STATUS: DORMANT — SDK adapter scaffold only; not imported by server.js.
'use strict';

const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

/**
 * @typedef {Object} ToolDefinition
 * @property {string} id Kebab-case stable tool id used by agents and registries.
 * @property {string} name Human-readable tool name for audits and operator review.
 * @property {string} version Semver version for the tool contract.
 * @property {string} description Human-readable tool scope and boundary description.
 * @property {Object} parameters JSON Schema describing the tool input payload.
 * @property {Object} returns JSON Schema describing the tool output payload.
 * @property {Function|null} implementation Function reference for live adapters; null in scaffold-only mode.
 * @property {{requests_per_minute:number, burst:number}} rate_limit Tool rate policy for future runners.
 * @property {boolean} felicia_signoff_required True when the tool has clinical safety surface area.
 */

/**
 * Validate and freeze a scaffold-only Tool definition.
 * This factory registers no actual tools and invokes no external services.
 *
 * @param {ToolDefinition} spec Candidate tool definition.
 * @returns {Readonly<ToolDefinition>} Frozen tool definition.
 */
function defineTool(spec) {
  assertObject(spec, 'Tool spec');

  const required = [
    'id',
    'name',
    'version',
    'description',
    'parameters',
    'returns',
    'implementation',
    'rate_limit',
    'felicia_signoff_required',
  ];
  for (const field of required) {
    if (spec[field] === undefined) throw new TypeError(`Tool spec missing required field: ${field}`);
  }

  if (typeof spec.id !== 'string' || !KEBAB_CASE.test(spec.id)) throw new TypeError('id must be kebab-case');
  if (typeof spec.name !== 'string') throw new TypeError('name must be a string');
  if (typeof spec.version !== 'string' || !SEMVER.test(spec.version)) throw new TypeError('version must be semver');
  if (typeof spec.description !== 'string') throw new TypeError('description must be a string');
  assertObject(spec.parameters, 'parameters');
  assertObject(spec.returns, 'returns');
  if (spec.implementation !== null && typeof spec.implementation !== 'function') {
    throw new TypeError('implementation must be null or a function');
  }
  assertObject(spec.rate_limit, 'rate_limit');
  if (!Number.isInteger(spec.rate_limit.requests_per_minute) || spec.rate_limit.requests_per_minute < 0) {
    throw new TypeError('rate_limit.requests_per_minute must be a non-negative integer');
  }
  if (!Number.isInteger(spec.rate_limit.burst) || spec.rate_limit.burst < 0) {
    throw new TypeError('rate_limit.burst must be a non-negative integer');
  }
  if (typeof spec.felicia_signoff_required !== 'boolean') {
    throw new TypeError('felicia_signoff_required must be a boolean');
  }

  return Object.freeze({
    id: spec.id,
    name: spec.name,
    version: spec.version,
    description: spec.description,
    parameters: deepFreeze(structuredClone(spec.parameters)),
    returns: deepFreeze(structuredClone(spec.returns)),
    implementation: spec.implementation,
    rate_limit: Object.freeze({ ...spec.rate_limit }),
    felicia_signoff_required: spec.felicia_signoff_required,
  });
}

/**
 * @param {unknown} value Candidate value.
 * @returns {value is ToolDefinition} True when the value matches the scaffold Tool shape.
 */
function isTool(value) {
  try {
    defineTool(value);
    return true;
  } catch (_error) {
    return false;
  }
}

module.exports = { defineTool, isTool };
