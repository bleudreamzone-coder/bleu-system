const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020');

const {
  defineAgent,
  defineTool,
  defineHandoff,
  createRunner,
  freezeRegistry,
  NotImplementedError,
} = require('../../../core/agents/_adapter');

const repoRoot = path.join(__dirname, '../../..');
const adapterShape = {
  type: 'object',
  required: ['id', 'name', 'version', 'description', 'instructions', 'tools', 'handoffs', 'tier', 'felicia_signoff_required', 'schema_refs'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', pattern: '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$' },
    name: { type: 'string' },
    version: { type: 'string', pattern: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)' },
    description: { type: 'string' },
    instructions: { type: 'string' },
    tools: { type: 'array', items: { type: 'string' } },
    handoffs: { type: 'array', items: { type: 'string' } },
    tier: { enum: [1, 2, 3] },
    felicia_signoff_required: { type: 'boolean' },
    schema_refs: { type: 'array', items: { type: 'string' } },
  },
};

function compileWithAjv(schemaDocument) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function fallbackAgentValidator(fixture) {
  const errors = [];
  for (const field of adapterShape.required) {
    if (fixture[field] === undefined) errors.push(`missing required property ${field}`);
  }
  const kebabCase = new RegExp(adapterShape.properties.id.pattern);
  if (fixture.id !== undefined && !kebabCase.test(fixture.id)) {
    errors.push(`invalid id ${fixture.id}`);
  }
  if (fixture.tier !== undefined && ![1, 2, 3].includes(fixture.tier)) {
    errors.push(`invalid tier ${fixture.tier}`);
  }
  if (fixture.felicia_signoff_required !== undefined && typeof fixture.felicia_signoff_required !== 'boolean') {
    errors.push('felicia_signoff_required must be boolean');
  }
  fallbackAgentValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(adapterShape);
const validateAgentShape = compiled ? compiled.validate : fallbackAgentValidator;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || fallbackAgentValidator.errors || []).join(', ');

function validAgentSpec(overrides = {}) {
  return {
    id: 'scaffold-agent',
    name: 'Scaffold Agent',
    version: '0.1.0',
    description: 'Infrastructure-only fixture agent for adapter shape validation.',
    instructions: '',
    tools: [],
    handoffs: [],
    tier: 1,
    felicia_signoff_required: false,
    schema_refs: [
      'core/schemas/signal_object_v1.1.schema.json',
      'core/schemas/decision_object_v1.1.schema.json',
      'core/schemas/trust_packet_v1.1.schema.json',
    ],
    ...overrides,
  };
}

function validToolSpec(overrides = {}) {
  return {
    id: 'scaffold-tool',
    name: 'Scaffold Tool',
    version: '0.1.0',
    description: 'Infrastructure-only fixture tool for adapter shape validation.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    returns: { type: 'object', additionalProperties: false, properties: {} },
    implementation: null,
    rate_limit: { requests_per_minute: 0, burst: 0 },
    felicia_signoff_required: false,
    ...overrides,
  };
}

function validHandoffSpec(overrides = {}) {
  return {
    from_agent_id: 'scaffold-agent',
    to_agent_id: 'review-agent',
    condition: null,
    reason: 'Fixture-only handoff boundary for adapter shape validation.',
    records_decision: true,
    ...overrides,
  };
}

async function assertRejectsRunnerRun() {
  const runner = createRunner({});
  assert.equal(typeof runner.run, 'function');
  await assert.rejects(() => runner.run({}), NotImplementedError);
}

async function run() {
  assert.throws(() => defineAgent({}), /missing required field/i);

  const agent = defineAgent(validAgentSpec());
  assert.equal(validateAgentShape(agent), true, `agent shape should validate: ${errorsText(validateAgentShape.errors)}`);
  assert.equal(Object.isFrozen(agent), true, 'agent definition should be frozen');
  for (const field of adapterShape.required) assert.ok(Object.hasOwn(agent, field), `agent should include ${field}`);
  for (const schemaRef of agent.schema_refs) {
    assert.equal(schemaRef.startsWith('core/schemas/'), true, `${schemaRef} should live under core/schemas/`);
    assert.equal(fs.existsSync(path.join(repoRoot, schemaRef)), true, `${schemaRef} should exist`);
  }

  const tool = defineTool(validToolSpec());
  assert.equal(Object.isFrozen(tool), true, 'tool definition should be frozen');
  assert.equal(Object.isFrozen(tool.parameters), true, 'tool parameter schema should be frozen');

  const handoff = defineHandoff(validHandoffSpec());
  assert.equal(Object.isFrozen(handoff), true, 'handoff definition should be frozen');

  await assertRejectsRunnerRun();

  const registry = freezeRegistry();
  assert.equal(Object.isFrozen(registry), true, 'registry object should be frozen');
  assert.equal(Object.isFrozen(registry.agents), true, 'agents map should be frozen');
  assert.equal(Object.isFrozen(registry.tools), true, 'tools map should be frozen');
  assert.equal(Object.isFrozen(registry.handoffs), true, 'handoffs map should be frozen');
  assert.throws(() => registry.agents.set('x', {}), /frozen/i);

  console.log('Agent Adapter scaffold fixtures: 6/6 passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
