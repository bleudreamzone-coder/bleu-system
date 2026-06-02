'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { NotImplementedError } = require('../_adapter');

const schemaPath = path.join(__dirname, '../../schemas/tool_registration_v1.1.schema.json');
const ajv2020Path = path.join(__dirname, '../../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../../node_modules/ajv-formats');
const registrationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

/**
 * Create an AJV validator when local dev dependencies are installed.
 *
 * @returns {{validate: Function, errorsText: Function}|null} AJV validation helpers, or null when dependencies are unavailable.
 */
function compileWithAjv() {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return { validate: ajv.compile(registrationSchema), errorsText: (errors) => ajv.errorsText(errors) };
}

const compiled = compileWithAjv();

/**
 * Validate the minimal ToolRegistration contract when AJV is unavailable.
 *
 * @param {Object} spec Candidate tool registration record.
 * @returns {boolean} True when the fallback checks pass.
 */
function fallbackValidate(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) errors.push('ToolRegistration must be an object');

  if (errors.length === 0) {
    for (const field of registrationSchema.required) {
      if (spec[field] === undefined) errors.push(`missing required property ${field}`);
    }

    if (typeof spec.tool_id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.tool_id)) errors.push('tool_id must be kebab-case');
    if (!registrationSchema.properties.tool_class.enum.includes(spec.tool_class)) errors.push('tool_class is invalid');
    if (typeof spec.tool_version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(spec.tool_version)) errors.push('tool_version must be semver');
    if (spec.schema_version !== '1.1') errors.push('schema_version must be 1.1');
    if (!registrationSchema.properties.implementation_status.enum.includes(spec.implementation_status)) errors.push('implementation_status is invalid');
    if (spec.tool_class === 'clinical' && spec.felicia_signoff_required !== true) errors.push('clinical tools require Felicia signoff');
    if (spec.tool_class === 'commerce') {
      if (spec.felicia_signoff_required !== true || typeof spec.felicia_signoff_doc !== 'string' || spec.felicia_signoff_doc.length < 1) errors.push('commerce tools require Felicia signoff doc');
      if (spec.captain_signoff_required !== true || typeof spec.captain_signoff_doc !== 'string' || spec.captain_signoff_doc.length < 1) errors.push('commerce tools require Captain signoff doc');
    }
    if (!spec.td_010_compliance || spec.td_010_compliance.plaintext_email_stored !== false) errors.push('td_010_compliance.plaintext_email_stored must be false');
    if (!spec.td_010_compliance || spec.td_010_compliance.plaintext_phone_stored !== false) errors.push('td_010_compliance.plaintext_phone_stored must be false');
  }

  fallbackValidate.errors = errors;
  return errors.length === 0;
}

/**
 * Render validation errors from AJV or the fallback validator.
 *
 * @param {Array<Object>|undefined} errors Validator error list.
 * @returns {string} Human-readable error text.
 */
function errorsText(errors) {
  if (compiled) return compiled.errorsText(errors);
  return (errors || fallbackValidate.errors || []).join(', ');
}

/**
 * Validate a ToolRegistration record against v1.1 registry shape.
 *
 * @param {Object} spec Candidate tool registration record.
 * @throws {TypeError} When the record fails schema validation.
 * @returns {void}
 */
function validateToolSpec(spec) {
  const validate = compiled ? compiled.validate : fallbackValidate;
  if (!validate(spec)) {
    throw new TypeError(`Invalid ToolRegistration v1.1: ${errorsText(validate.errors)}`);
  }
}

/**
 * Recursively freeze a value so registrations cannot be mutated after insertion.
 *
 * @param {*} value Value to freeze.
 * @returns {*} The same frozen value.
 */
function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return value;
}

/**
 * Determine whether a registered tool needs Felicia approval before shadow registration.
 *
 * @param {Object} spec Valid ToolRegistration record.
 * @returns {boolean} True when the tool requires Felicia signoff but no signoff doc is populated.
 */
function missingRequiredFeliciaSignoff(spec) {
  return spec.felicia_signoff_required === true && (typeof spec.felicia_signoff_doc !== 'string' || spec.felicia_signoff_doc.length < 1);
}

/**
 * Create an empty, dormant Tool Registry for future BLEU agents.
 *
 * The registry validates ToolRegistration v1.1 records and enforces Felicia signoff
 * for clinical or otherwise Felicia-gated tools before registration. It does not
 * pre-register any tools and does not invoke live APIs.
 *
 * @returns {{register: Function, get: Function, list: Function, invoke: Function}} Empty frozen registry facade.
 */
function createToolRegistry() {
  const registrations = new Map();

  return Object.freeze({
    /**
     * Validate and insert a ToolRegistration record into this in-memory registry.
     *
     * @param {Object} toolSpec ToolRegistration v1.1 record.
     * @throws {TypeError} When the registration shape is invalid.
     * @throws {NotImplementedError} When Felicia signoff is required but missing.
     * @returns {Object} Frozen registered tool specification.
     */
    register(toolSpec) {
      validateToolSpec(toolSpec);
      if (missingRequiredFeliciaSignoff(toolSpec)) {
        throw new NotImplementedError('Felicia signoff doc required before tool registration');
      }

      const frozenSpec = deepFreeze(structuredClone(toolSpec));
      registrations.set(frozenSpec.tool_id, frozenSpec);
      return frozenSpec;
    },

    /**
     * Return one frozen ToolRegistration by id.
     *
     * @param {string} tool_id Kebab-case tool id.
     * @returns {Object|undefined} Frozen registration record, or undefined when absent.
     */
    get(tool_id) {
      return registrations.get(tool_id);
    },

    /**
     * List frozen ToolRegistration records, optionally filtered by class, status, or Felicia gate.
     *
     * @param {{tool_class?: string, status?: string, felicia_signoff_required?: boolean}} [filter={}] Optional list filter.
     * @returns {Array<Object>} Frozen registration records matching the filter.
     */
    list(filter = {}) {
      const criteria = filter && typeof filter === 'object' && !Array.isArray(filter) ? filter : {};
      return Array.from(registrations.values()).filter((spec) => {
        if (criteria.tool_class !== undefined && spec.tool_class !== criteria.tool_class) return false;
        if (criteria.status !== undefined && spec.implementation_status !== criteria.status) return false;
        if (criteria.felicia_signoff_required !== undefined && spec.felicia_signoff_required !== criteria.felicia_signoff_required) return false;
        return true;
      });
    },

    /**
     * Stub for future tool invocation with rate limit, retry, circuit breaker, and log emission.
     *
     * @param {string} _tool_id Tool id to invoke in a future PR.
     * @param {Object} _parameters Tool input parameters.
     * @param {Object} _agentContext Agent/session/decision context.
     * @throws {NotImplementedError} Always, until a future PR wires invocation behavior.
     * @returns {never} No return value while dormant.
     */
    invoke(_tool_id, _parameters, _agentContext) {
      throw new NotImplementedError('Tool invocation not yet wired');
    },
  });
}

module.exports = { createToolRegistry };
