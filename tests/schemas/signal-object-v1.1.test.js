const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ajvPath = require.resolve('ajv/dist/2020');
const ajvFormatsPath = path.join(__dirname, '../../node_modules/ajv-formats');

const schemaPath = path.join(__dirname, '../../core/schemas/signal_object_v1.1.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));


function compileWithAjv(schemaDocument) {
  if (!fs.existsSync(ajvPath) || !fs.existsSync(ajvFormatsPath)) return null;
  const Ajv2020 = require(ajvPath);
  const addFormats = require(ajvFormatsPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return { validate: ajv.compile(schemaDocument), errorsText: (errors) => ajv.errorsText(errors) };
}

function simpleFixtureValidator(fixture) {
  const errors = [];
  const required = schema.required;
  for (const field of required) {
    if (fixture[field] === undefined) errors.push(`missing required property ${field}`);
  }

  const primaryIntentValues = schema.properties.primary_intent.enum;
  if (fixture.primary_intent !== undefined && !primaryIntentValues.includes(fixture.primary_intent)) {
    errors.push(`invalid primary_intent ${fixture.primary_intent}`);
  }

  const riskLevelValues = schema.properties.risk_level.enum;
  if (fixture.risk_level !== undefined && !riskLevelValues.includes(fixture.risk_level)) {
    errors.push(`invalid risk_level ${fixture.risk_level}`);
  }

  const lifeStageValues = schema.$defs.life_stage_band.allOf[1].properties.value.enum;
  const lifeStage = fixture.six_bands && fixture.six_bands.life_stage && fixture.six_bands.life_stage.value;
  if (lifeStage !== undefined && !lifeStageValues.includes(lifeStage)) {
    errors.push(`invalid life_stage ${lifeStage}`);
  }

  if (Array.isArray(fixture.variant_blend)) {
    for (const variant of fixture.variant_blend) {
      if (typeof variant.probability !== 'number' || variant.probability < 0 || variant.probability > 1) {
        errors.push(`invalid variant probability ${variant.probability}`);
      }
    }
  }

  simpleFixtureValidator.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv(schema);
const validate = compiled ? compiled.validate : simpleFixtureValidator;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || simpleFixtureValidator.errors || []).join(', ');


function band(value, confidence = 0.8, rationale = 'Fixture classification signal.') {
  return { value, confidence, rationale };
}

function voice(rationale) {
  return { status: 'present', rationale };
}

function pressure(status, discipline) {
  return { status, discipline };
}

function baseSignal(overrides = {}) {
  const signal = {
    signal_id: 'sig_fixture_001',
    created_at: '2026-05-29T12:00:00.000Z',
    source: 'schema_fixture',
    primary_intent: 'sleep',
    sub_intents: ['ssri_safety', 'stress_context'],
    six_bands: {
      life_stage: band('L1_emerging_adult', 0.9, 'Young adult signal present.'),
      clinical_complexity: band('C2_single_stable_condition', 0.8, 'Stable SSRI medication context requires interaction caution.'),
      financial_capacity: band('F2_practical', 0.6, 'Accessible routing preferred.'),
      readiness: band('R3_preparing', 0.75, 'Asking for a concrete sleep next step.'),
      trust: band('T1_cautious', 0.7, 'New AI wellness user with medication safety concern.'),
      dose_tolerance: band('D2_low', 0.8, 'Anxiety-forward scenario needs low dose.'),
    },
    variant_blend: [
      {
        variant_id: 'V1.4_anxiety_forward_young_adult',
        label: 'V1.4 Anxiety-forward Young Adult',
        probability: 0.55,
        rationale: 'Sleep request includes anxiety and SSRI safety context.',
      },
      {
        variant_id: 'V1.1_sleep_compromised_professional',
        label: 'V1.1 Sleep-Compromised Professional',
        probability: 0.3,
        rationale: 'Sleep support is the primary expressed need.',
      },
      {
        variant_id: 'unknown_or_needs_info',
        label: 'Unknown / needs info',
        probability: 0.15,
        rationale: 'Needs medication names, dose, and duration before supplement routing.',
      },
    ],
    risk_level: 'yellow',
    risk_flags: ['ssri_supplement_interaction_screen_needed'],
    needed_info: ['current_medications', 'duration_of_sleep_issue'],
    commerce_intent: 'blocked',
    evidence_need: 'clinical_review_required',
    three_voices: {
      user_voice: voice('Warmth requires validating anxious sleep before any plan.'),
      clinical_voice: voice('Restraint requires no serotonergic supplement recommendation with SSRI context.'),
      infrastructure_voice: voice('Audit fields preserve the decision context for future runtime wiring.'),
    },
    six_pressures: {
      information: pressure('watch', 'Do not answer beyond known medication context.'),
      nervous_system: pressure('active', 'No urgency or fear-based commerce for anxious sleep.'),
      time: pressure('clear', 'Schema remains shadow-only until Soul-Gated wiring.'),
      competitive: pressure('clear', 'No engagement mechanics in the Signal Object.'),
      legal: pressure('active', 'Education and safety-routing only; no diagnosis.'),
      philosophical: pressure('clear', 'No cosmic certainty or unsupported claims.'),
    },
    confidence: 0.72,
  };

  return Object.assign(signal, overrides);
}

function assertValid(name, fixture) {
  assert.equal(validate(fixture), true, `${name} should validate: ${errorsText(validate.errors)}`);
}

function assertInvalid(name, fixture) {
  assert.equal(validate(fixture), false, `${name} should fail validation`);
}

function run() {
  assertValid('sleep + SSRI Signal Object', baseSignal());

  assertValid('crisis Signal Object', baseSignal({
    signal_id: 'sig_fixture_crisis_001',
    primary_intent: 'crisis',
    sub_intents: ['self_harm_language', 'human_handoff'],
    six_bands: {
      life_stage: band('L2_establishing_adult', 0.5, 'Adult context known; bands are suspended by crisis override.'),
      clinical_complexity: band('C4_acute_unstable', 1, 'Active crisis signal routes to acute/unstable posture.'),
      financial_capacity: band('unknown', 0, 'Financial classification is irrelevant during crisis routing.'),
      readiness: band('R1_exploring', 0.1, 'Readiness is suspended by crisis routing.'),
      trust: band('T1_cautious', 0.5, 'Trust posture remains conservative.'),
      dose_tolerance: band('D1_micro', 1, 'Crisis response must be minimal and direct.'),
    },
    variant_blend: [
      {
        variant_id: 'crisis_active',
        label: 'Active crisis routing',
        probability: 1.0,
        rationale: 'Crisis trumps all bands and commerce.',
      },
    ],
    risk_level: 'crisis',
    risk_flags: ['self_harm_language'],
    needed_info: ['immediate_safety_status', 'local_emergency_support'],
    commerce_intent: 'blocked',
    evidence_need: 'clinical_review_required',
    confidence: 0.95,
  }));

  const missingRequired = baseSignal();
  delete missingRequired.signal_id;
  assertInvalid('missing signal_id', missingRequired);

  const probabilityTooHigh = baseSignal({
    variant_blend: [
      {
        variant_id: 'V1.4_anxiety_forward_young_adult',
        label: 'V1.4 Anxiety-forward Young Adult',
        probability: 1.01,
        rationale: 'Invalid fixture: probability must not exceed 1.0.',
      },
    ],
  });
  assertInvalid('variant probability > 1.0', probabilityTooHigh);

  const unknownLifeStage = baseSignal();
  unknownLifeStage.six_bands.life_stage.value = 'L9_unknown_life_stage';
  assertInvalid('unknown life_stage band value', unknownLifeStage);

  console.log('Signal Object v1.1 schema fixtures: 5/5 passed');
}

run();
