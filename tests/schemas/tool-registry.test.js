const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');
const registrationSchemaPath = path.join(__dirname, '../../core/schemas/tool_registration_v1.1.schema.json');
const registrationSchema = JSON.parse(fs.readFileSync(registrationSchemaPath, 'utf8'));
const { createToolRegistry } = require('../../core/agents/tools/tool_registry');
const { NotImplementedError } = require('../../core/agents/_adapter');

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajv2020Path);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackRegistrationValidator(spec) {
  const errors = [];
  for (const field of registrationSchema.required) {
    if (spec[field] === undefined) errors.push(`missing required property ${field}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.tool_id || '')) errors.push('tool_id must be kebab-case');
  if (!registrationSchema.properties.tool_class.enum.includes(spec.tool_class)) errors.push('invalid tool_class');
  if (spec.schema_version !== '1.1') errors.push('schema_version must be 1.1');
  if (spec.tool_class === 'clinical' && spec.felicia_signoff_required !== true) errors.push('clinical tools require Felicia signoff');
  if (spec.tool_class === 'commerce') {
    if (spec.felicia_signoff_required !== true || !spec.felicia_signoff_doc) errors.push('commerce tools require Felicia doc');
    if (spec.captain_signoff_required !== true || !spec.captain_signoff_doc) errors.push('commerce tools require Captain doc');
  }
  if (!spec.td_010_compliance || spec.td_010_compliance.plaintext_email_stored !== false) errors.push('plaintext email storage rejected');
  if (!spec.td_010_compliance || spec.td_010_compliance.plaintext_phone_stored !== false) errors.push('plaintext phone storage rejected');
  fallbackRegistrationValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(registrationSchema);
const validateRegistration = compiled ? compiled.validate : fallbackRegistrationValidator;
const registrationErrorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || fallbackRegistrationValidator.errors || []).join(', ');

function baseTool(overrides = {}) {
  const spec = {
    tool_id: 'rxnorm-adapter',
    tool_class: 'clinical',
    tool_version: '0.1.0',
    schema_version: '1.1',
    description: 'Medication terminology lookup for future BLEU agents.',
    implementation_status: 'stub',
    parameters_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['query'],
      properties: { query: { type: 'string', minLength: 1 } }
    },
    returns_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['matches'],
      properties: { matches: { type: 'array' } }
    },
    rate_limit: { requests_per_minute: 30, burst: 5, throttle_strategy: 'reject' },
    felicia_signoff_required: true,
    felicia_signoff_doc: '_meta/signoffs/felicia/rxnorm-adapter.md',
    captain_signoff_required: false,
    captain_signoff_doc: null,
    data_classification: 'clinical_phi_avoid',
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false
    },
    retry_policy: { max_retries: 2, backoff_strategy: 'exponential' },
    circuit_breaker: { failure_threshold: 3, reset_timeout_ms: 60000, half_open_max_calls: 1 },
    rollback_plan: 'Do not provide medication-specific guidance; route to clinical review.',
    cost_class: 'free',
    audit_doc: '_meta/audits/future-rxnorm-adapter.md'
  };

  return { ...spec, ...overrides };
}

function assertValidRegistration(name, fixture) {
  assert.equal(validateRegistration(fixture), true, `${name} should validate: ${registrationErrorsText(validateRegistration.errors)}`);
}

function assertInvalidRegistration(name, fixture) {
  assert.equal(validateRegistration(fixture), false, `${name} should fail validation`);
}

function run() {
  const clinicalTool = baseTool();
  assertValidRegistration('valid clinical rxnorm-style tool registration', clinicalTool);
  const clinicalRegistry = createToolRegistry();
  clinicalRegistry.register(clinicalTool);
  assert.equal(clinicalRegistry.get('rxnorm-adapter').tool_id, 'rxnorm-adapter');

  const infrastructureTool = baseTool({
    tool_id: 'tool-healthcheck',
    tool_class: 'infrastructure',
    description: 'Internal infrastructure healthcheck contract for future agents.',
    felicia_signoff_required: false,
    felicia_signoff_doc: null,
    captain_signoff_required: false,
    captain_signoff_doc: null,
    data_classification: 'public_only',
    cost_class: 'low',
    audit_doc: '_meta/audits/future-tool-healthcheck.md'
  });
  assertValidRegistration('valid infrastructure tool registration', infrastructureTool);
  const infrastructureRegistry = createToolRegistry();
  infrastructureRegistry.register(infrastructureTool);
  assert.equal(infrastructureRegistry.get('tool-healthcheck').tool_class, 'infrastructure');

  const commerceTool = baseTool({
    tool_id: 'stripe-commerce',
    tool_class: 'commerce',
    description: 'Commerce adapter contract requiring Captain and Felicia signoff.',
    felicia_signoff_required: true,
    felicia_signoff_doc: '_meta/signoffs/felicia/stripe-commerce.md',
    captain_signoff_required: true,
    captain_signoff_doc: '_meta/signoffs/captain/stripe-commerce.md',
    data_classification: 'citizen_session',
    cost_class: 'medium',
    audit_doc: '_meta/audits/future-stripe-commerce.md'
  });
  assertValidRegistration('valid commerce tool registration with both signoffs', commerceTool);
  const commerceRegistry = createToolRegistry();
  commerceRegistry.register(commerceTool);
  assert.equal(commerceRegistry.get('stripe-commerce').captain_signoff_required, true);

  const unsignedClinicalTool = baseTool({ felicia_signoff_doc: null });
  assertValidRegistration('unsigned clinical tool remains a valid schema shape', unsignedClinicalTool);
  const unsignedRegistry = createToolRegistry();
  assert.throws(
    () => unsignedRegistry.register(unsignedClinicalTool),
    NotImplementedError,
    'registry.register should reject clinical tools missing Felicia signoff docs'
  );

  assertInvalidRegistration(
    'invalid TD-010 plaintext_email_stored=true tool registration',
    baseTool({
      td_010_compliance: {
        pii_hashed: true,
        plaintext_email_stored: true,
        plaintext_phone_stored: false
      }
    })
  );

  assert.throws(
    () => createToolRegistry().invoke('nonexistent', {}, {}),
    NotImplementedError,
    'registry.invoke should remain dormant and throw'
  );

  assert.deepEqual(
    createToolRegistry().list({ tool_class: 'clinical' }),
    [],
    'fresh registry should have no pre-registered clinical tools'
  );

  console.log('tool registry schema fixtures passed (7/7)');
}

run();
