const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ajv2020Path = path.join(__dirname, '../../node_modules/ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');

const schemaPath = path.join(__dirname, '../../core/schemas/decision_object_v1.1.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(`${ajv2020Path}.js`) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require('ajv/dist/2020');
  const addFormats = require('ajv-formats');
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function simpleFixtureValidator(fixture) {
  const errors = [];

  for (const field of schema.required) {
    if (fixture[field] === undefined) errors.push(`missing required property ${field}`);
  }

  const expectedGates = schema.properties.gates.prefixItems.map((item) => {
    const defName = item.$ref.replace('#/$defs/', '');
    return schema.$defs[defName].allOf[1].properties.gate.const;
  });

  if (!Array.isArray(fixture.gates) || fixture.gates.length !== expectedGates.length) {
    errors.push('gates must contain exactly seven entries');
  } else {
    fixture.gates.forEach((gate, index) => {
      if (!gate || gate.gate !== expectedGates[index]) errors.push(`gate ${index} must be ${expectedGates[index]}`);
      for (const field of schema.$defs.gate_base.required) {
        if (!gate || gate[field] === undefined) errors.push(`gate ${index} missing ${field}`);
      }
      const statuses = schema.$defs.gate_base.properties.status.enum;
      if (gate && gate.status !== undefined && !statuses.includes(gate.status)) errors.push(`gate ${index} invalid status ${gate.status}`);
    });
  }

  if (!Array.isArray(fixture.refusal_checks) || fixture.refusal_checks.length !== 20) {
    errors.push('refusal_checks must contain exactly twenty entries');
  } else {
    fixture.refusal_checks.forEach((refusal, index) => {
      const expectedNumber = index + 1;
      if (!refusal || refusal.refusal_number !== expectedNumber) errors.push(`refusal ${index} must be number ${expectedNumber}`);
      for (const field of schema.$defs.refusal_base.required) {
        if (!refusal || refusal[field] === undefined) errors.push(`refusal ${index} missing ${field}`);
      }
      const statuses = schema.$defs.refusal_base.properties.status.enum;
      if (refusal && refusal.status !== undefined && !statuses.includes(refusal.status)) {
        errors.push(`refusal ${index} invalid status ${refusal.status}`);
      }
    });
  }

  const expectedFormula = schema.properties.lras.properties.formula.const;
  if (!fixture.lras || fixture.lras.formula !== expectedFormula) errors.push('lras formula const mismatch');

  const finalActions = schema.properties.final_action.enum;
  if (fixture.final_action !== undefined && !finalActions.includes(fixture.final_action)) {
    errors.push(`invalid final_action ${fixture.final_action}`);
  }

  simpleFixtureValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(schema);
const validate = compiled ? compiled.validate : simpleFixtureValidator;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || simpleFixtureValidator.errors || []).join(', ');

function gate(gateName, status = 'passed', rationale = 'Fixture gate evaluated in locked order.') {
  return { gate: gateName, status, rationale };
}

function gates(overrides = {}) {
  const ordered = [
    gate('crisis'),
    gate('medication_safety'),
    gate('evidence'),
    gate('claim_boundary'),
    gate('clinical_review'),
    gate('commerce'),
    gate('outcome'),
  ];

  for (const [index, patch] of Object.entries(overrides)) {
    ordered[Number(index)] = Object.assign({}, ordered[Number(index)], patch);
  }

  return ordered;
}

function refusal(refusalNumber, status = 'passed', action = 'No refusal triggered; continue within doctrine.') {
  return { refusal_number: refusalNumber, status, action };
}

function refusals(triggered = {}) {
  return Array.from({ length: 20 }, (_, index) => {
    const refusalNumber = index + 1;
    const status = triggered[refusalNumber] ? 'triggered' : 'passed';
    const action = triggered[refusalNumber] || 'No refusal triggered; continue within doctrine.';
    return refusal(refusalNumber, status, action);
  });
}

function lras(overrides = {}) {
  return Object.assign({
    formula: 'benefit*evidence - (safety_cost + trust_cost)*(1 - reversibility) + followup_value',
    benefit: 0.4,
    evidence: 0.8,
    safety_cost: 0.2,
    trust_cost: 0.1,
    reversibility: 0.9,
    followup_value: 0.4,
    score: 0.69,
    rationale: 'Fixture preserves the locked LRAS expression and component audit trail.',
  }, overrides);
}

function baseDecision(overrides = {}) {
  const decision = {
    decision_id: 'dec_fixture_001',
    created_at: '2026-06-01T12:00:00.000Z',
    surface: 'schema_fixture',
    input_summary: 'Citizen asks for wellness support and a safe next step.',
    gates: gates(),
    refusal_checks: refusals(),
    lras: lras(),
    allowed_response: {
      response_class: 'wellness_support',
      allowed_actions: ['Provide educational, non-diagnostic next steps.'],
      prohibited_actions: ['Do not diagnose or imply guaranteed outcomes.'],
      rationale: 'Standard wellness inquiry stays inside education and support boundaries.',
    },
    commerce_permission: {
      status: 'allowed',
      rationale: 'All upstream gates passed and no safety blocker is present.',
      allowed_categories: ['budget', 'mid', 'premium'],
    },
    outcome_schedule: {
      status: 'scheduled',
      cadence: ['day_7'],
      rationale: 'Outcome gate records a follow-up so the route becomes learnable.',
    },
    authority: {
      tier: 'tier_1_bleu_decides',
      decision_owner: 'bleu',
      felicia_required: false,
      rationale: 'Fixture covers non-clinical architecture and schema validation only.',
    },
    arbiter_priority_stack: ['crisis', 'medication_safety', 'evidence', 'claim_boundary', 'clinical_review', 'commerce', 'outcome'],
    final_action: 'allow',
  };

  return Object.assign(decision, overrides);
}

function assertValid(name, fixture) {
  assert.equal(validate(fixture), true, `${name} should validate: ${errorsText(validate.errors)}`);
}

function assertInvalid(name, fixture) {
  assert.equal(validate(fixture), false, `${name} should fail validation`);
}

function run() {
  assertValid('crisis Decision Object', baseDecision({
    decision_id: 'dec_fixture_crisis_001',
    input_summary: 'Citizen uses self-harm language and needs immediate crisis routing.',
    gates: gates({
      0: { status: 'hard_stop', rationale: 'Crisis gate halts guidance and routes to immediate support.' },
      5: { status: 'blocked', rationale: 'Commerce is blocked during crisis.' },
      6: { status: 'needs_review', rationale: 'Outcome capture is deferred until safety is stabilized.' },
    }),
    refusal_checks: refusals({
      1: 'Will not sell during crisis; crisis routing supersedes every funnel.',
      4: 'Will not let commerce override safety; product routing is blocked.',
    }),
    lras: lras({ benefit: 0.9, evidence: 1, safety_cost: 1, trust_cost: 0.9, reversibility: 0.2, followup_value: 0.1, score: -0.52 }),
    allowed_response: {
      response_class: 'crisis_routing',
      allowed_actions: ['Present crisis resources and encourage immediate human support.'],
      prohibited_actions: ['Do not provide supplement, commerce, or extended wellness guidance.'],
      rationale: 'Crisis gate takes priority over every later gate.',
    },
    commerce_permission: {
      status: 'blocked',
      rationale: 'Refusals 1 and 4 block commerce during crisis.',
      allowed_categories: [],
    },
    outcome_schedule: {
      status: 'deferred',
      cadence: ['none'],
      rationale: 'Immediate safety routing precedes learnability capture.',
    },
    authority: {
      tier: 'tier_3_felicia_decides_system_performs',
      decision_owner: 'system',
      felicia_required: true,
      rationale: 'Crisis routing thresholds are Tier 3 governance.',
    },
    final_action: 'block',
  }));

  assertValid('SSRI medication interaction Decision Object', baseDecision({
    decision_id: 'dec_fixture_ssri_001',
    input_summary: 'Citizen asks about sleep support while taking an SSRI.',
    gates: gates({
      1: { status: 'reroute', rationale: 'Medication safety gate reroutes to clinician/pharmacist review before supplement guidance.' },
      4: { status: 'needs_review', rationale: 'Clinical review is required for interaction-sensitive supplement content.' },
      5: { status: 'blocked', rationale: 'Commerce is blocked until medication safety and clinical review clear.' },
    }),
    refusal_checks: refusals({
      4: 'Will not let commerce override medication safety.',
      5: 'Will not diagnose or prescribe around SSRI medication context.',
      9: 'Will not allow unsafe claims past clinical review.',
    }),
    allowed_response: {
      response_class: 'human_review',
      allowed_actions: ['Ask for medication details and route to clinician/pharmacist review.'],
      prohibited_actions: ['Do not recommend serotonergic supplements or checkout paths.'],
      rationale: 'Medication interaction context requires safety-first reroute.',
    },
    commerce_permission: {
      status: 'blocked',
      rationale: 'Gate 2 reroute and Gate 6 block prevent commerce.',
      allowed_categories: [],
    },
    authority: {
      tier: 'tier_2_felicia_decides_bleu_recommends',
      decision_owner: 'dr_felicia',
      felicia_required: true,
      rationale: 'Supplement protocol and dosing questions require clinical review.',
    },
    final_action: 'escalate',
  }));

  assertValid('standard wellness Decision Object', baseDecision());

  const missingCommerceGate = baseDecision();
  missingCommerceGate.gates = gates().filter((item) => item.gate !== 'commerce');
  assertInvalid('missing commerce gate', missingCommerceGate);

  const emptyRefusals = baseDecision({ refusal_checks: Array.from({ length: 20 }, () => ({})) });
  assertInvalid('empty refusal checks', emptyRefusals);

  const badRefusalStatus = baseDecision();
  badRefusalStatus.refusal_checks[6].status = 'blocked';
  assertInvalid('refusal 7 wrong status enum', badRefusalStatus);

  console.log('Decision Object v1.1 schema fixtures: 6/6 passed');
}

run();
