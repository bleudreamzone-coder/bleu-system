'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const schema = require('../../../core/schemas/shadow_comparison_v1.0.schema.json');
const { createShadowWiring, SHADOW_WIRING_SINKS } = require('../../../core/agents/shadow/wiring');

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_64 = /^[a-f0-9]{64}$/;
const AGENT_TIERS = ['tier_1_captain', 'tier_2_felicia', 'tier_3_felicia_autonomous', 'tier_infrastructure'];
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function compileWithAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return { ajv, validate: ajv.compile(schema), errorsText: (errors) => ajv.errorsText(errors) };
}

function validTd010(td010) {
  return Boolean(
    td010 &&
    typeof td010 === 'object' &&
    !Array.isArray(td010) &&
    td010.pii_hashed === true &&
    td010.plaintext_email_stored === false &&
    td010.plaintext_phone_stored === false &&
    td010.contains_raw_response_text === false &&
    Object.keys(td010).every((key) => ['pii_hashed', 'plaintext_email_stored', 'plaintext_phone_stored', 'contains_raw_response_text'].includes(key))
  );
}

function fallbackValidate(fixture) {
  const errors = [];
  if (!fixture || typeof fixture !== 'object' || Array.isArray(fixture)) errors.push('fixture must be object');
  if (errors.length === 0) {
    for (const field of schema.required) {
      if (fixture[field] === undefined) errors.push(`missing ${field}`);
    }
    if (typeof fixture.comparison_id !== 'string' || !UUID.test(fixture.comparison_id)) errors.push('comparison_id');
    if (fixture.schema_version !== '1.0') errors.push('schema_version');
    if (typeof fixture.signal_id !== 'string' || !UUID.test(fixture.signal_id)) errors.push('signal_id');
    if (typeof fixture.production_response_hash !== 'string' || !HEX_64.test(fixture.production_response_hash)) errors.push('production_response_hash');
    if (!Number.isInteger(fixture.production_word_count) || fixture.production_word_count < 0) errors.push('production_word_count');
    if (typeof fixture.shadow_response_hash !== 'string' || !HEX_64.test(fixture.shadow_response_hash)) errors.push('shadow_response_hash');
    if (!Number.isInteger(fixture.shadow_word_count) || fixture.shadow_word_count < 0) errors.push('shadow_word_count');
    if (typeof fixture.hashes_match !== 'boolean') errors.push('hashes_match');
    if (!Number.isInteger(fixture.word_count_delta)) errors.push('word_count_delta');
    if (fixture.hashes_match === true && fixture.word_count_delta !== 0) errors.push('hashes_match true requires zero delta');
    if (typeof fixture.agent_id !== 'string' || fixture.agent_id.length < 3 || !KEBAB_CASE.test(fixture.agent_id)) errors.push('agent_id');
    if (!AGENT_TIERS.includes(fixture.agent_tier)) errors.push('agent_tier');
    if (typeof fixture.observation_window_id !== 'string' || fixture.observation_window_id.length < 1) errors.push('observation_window_id');
    if (typeof fixture.observed_at !== 'string' || Number.isNaN(Date.parse(fixture.observed_at))) errors.push('observed_at');
    if (!validTd010(fixture.td_010_compliance)) errors.push('td_010_compliance');
    if (!Object.keys(fixture).every((key) => schema.required.includes(key))) errors.push('additionalProperties');
  }
  fallbackValidate.errors = errors;
  return errors.length === 0;
}

const compiled = compileWithAjv();
const validate = compiled ? compiled.validate : fallbackValidate;
const errorsText = compiled
  ? (errors) => compiled.errorsText(errors)
  : (errors) => (errors || fallbackValidate.errors || []).join(', ');

function baseComparison(overrides = {}) {
  return {
    comparison_id: '11111111-1111-4111-8111-111111111111',
    schema_version: '1.0',
    signal_id: '22222222-2222-4222-8222-222222222222',
    production_response_hash: 'a'.repeat(64),
    production_word_count: 4,
    shadow_response_hash: 'a'.repeat(64),
    shadow_word_count: 4,
    hashes_match: true,
    word_count_delta: 0,
    agent_id: 'fixture-agent',
    agent_tier: 'tier_infrastructure',
    observation_window_id: 'shadow-window-fixture',
    observed_at: '2026-06-02T00:00:00.000Z',
    td_010_compliance: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
      contains_raw_response_text: false,
    },
    ...overrides,
  };
}

function assertValid(name, fixture) {
  assert.equal(validate(fixture), true, `${name} should validate: ${errorsText(validate.errors)}`);
}

function assertInvalid(name, fixture) {
  assert.equal(validate(fixture), false, `${name} should fail validation`);
}

async function run() {
  let passed = 0;
  const test = async (name, fn) => {
    await fn();
    passed += 1;
    console.log(`ok ${passed} - ${name}`);
  };

  await test('shadow_comparison_v1.0.schema.json is a valid JSON Schema', async () => {
    if (compiled) assert.equal(compiled.ajv.validateSchema(schema), true, compiled.ajv.errorsText(compiled.ajv.errors));
    else assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  });

  await test('valid ShadowComparisonResult with hashes_match=true and word_count_delta=0 validates', async () => {
    assertValid('matching comparison', baseComparison());
  });

  await test('valid ShadowComparisonResult with hashes_match=false and word_count_delta=5 validates', async () => {
    assertValid('divergent comparison', baseComparison({
      comparison_id: '33333333-3333-4333-8333-333333333333',
      shadow_response_hash: 'b'.repeat(64),
      shadow_word_count: 9,
      hashes_match: false,
      word_count_delta: 5,
    }));
  });

  await test('invalid hashes_match=true with word_count_delta=3 is rejected', async () => {
    assertInvalid('bad matching delta', baseComparison({ word_count_delta: 3 }));
  });

  await test('invalid production_response_hash with non-hex characters is rejected', async () => {
    assertInvalid('bad production hash', baseComparison({ production_response_hash: `${'g'.repeat(63)}z` }));
  });

  await test('invalid contains_raw_response_text=true is rejected', async () => {
    assertInvalid('raw text flag true', baseComparison({
      td_010_compliance: {
        pii_hashed: true,
        plaintext_email_stored: false,
        plaintext_phone_stored: false,
        contains_raw_response_text: true,
      },
    }));
  });

  await test('invalid agent_tier tier_1_god is rejected', async () => {
    assertInvalid('bad agent tier', baseComparison({ agent_tier: 'tier_1_god' }));
  });

  await test('isEnabled returns false by default', async () => {
    const previous = process.env.SHADOW_WIRING_ENABLED;
    delete process.env.SHADOW_WIRING_ENABLED;
    assert.equal(createShadowWiring({}).isEnabled(), false);
    if (previous !== undefined) process.env.SHADOW_WIRING_ENABLED = previous;
  });

  await test('getSink returns buffer by default', async () => {
    const previous = process.env.SHADOW_WIRING_SINK;
    delete process.env.SHADOW_WIRING_SINK;
    assert.equal(createShadowWiring({}).getSink(), 'buffer');
    if (previous !== undefined) process.env.SHADOW_WIRING_SINK = previous;
  });

  await test('getSubscriptionCount returns 0 before registrations', async () => {
    assert.equal(createShadowWiring({}).getSubscriptionCount(), 0);
  });

  await test('tier_2 clinical registration rejects without Felicia signoff', async () => {
    const result = await createShadowWiring({}).registerShadowAgent({
      agentId: 'crisis-safety-agent',
      agentTier: 'tier_2_felicia',
      observationFilter: {},
    });
    assert.equal(result.registered, false);
    assert.equal(result.reason, 'clinical_agent_requires_felicia_signoff');
  });

  await test('tier_infrastructure registration succeeds without signoff', async () => {
    const wiring = createShadowWiring({});
    const result = await wiring.registerShadowAgent({
      agentId: 'infrastructure-monitor',
      agentTier: 'tier_infrastructure',
      observationFilter: {},
    });
    assert.equal(result.registered, true);
    assert.match(result.subscription_id, UUID);
    assert.equal(wiring.getSubscriptionCount(), 1);
  });

  await test('observeAndCompare identical responses records hashes_match=true and word_count_delta=0', async () => {
    const wiring = createShadowWiring({});
    const responseText = 'Same safe next step.';
    const result = await wiring.observeAndCompare({
      signal: { signal_id: '44444444-4444-4444-8444-444444444444' },
      productionResponse: responseText,
      shadowResponse: responseText,
      observationWindowId: 'window-identical',
      agentId: 'infrastructure-monitor',
      agentTier: 'tier_infrastructure',
    });
    assert.equal(result.recorded, true);
    const [comparison] = wiring.getComparisons();
    assert.equal(comparison.hashes_match, true);
    assert.equal(comparison.word_count_delta, 0);
    assert.equal(comparison.production_response_hash, comparison.shadow_response_hash);
  });

  await test('observeAndCompare different responses records hashes_match=false and non-zero word_count_delta', async () => {
    const wiring = createShadowWiring({});
    const result = await wiring.observeAndCompare({
      signal: { signal_id: '55555555-5555-4555-8555-555555555555' },
      productionResponse: 'One two.',
      shadowResponse: 'One two three four.',
      observationWindowId: 'window-different',
      agentId: 'infrastructure-monitor',
      agentTier: 'tier_infrastructure',
    });
    assert.equal(result.recorded, true);
    const [comparison] = wiring.getComparisons();
    assert.equal(comparison.hashes_match, false);
    assert.notEqual(comparison.word_count_delta, 0);
    assert.equal(wiring.getDivergenceCount(), 1);
  });

  await test('recorded comparisons contain no raw response text anywhere in the object', async () => {
    const wiring = createShadowWiring({});
    const productionPlaintext = 'PLAINTEXT_PRODUCTION_SECRET';
    const shadowPlaintext = 'PLAINTEXT_SHADOW_SECRET more words';
    const result = await wiring.observeAndCompare({
      signal: { signal_id: '66666666-6666-4666-8666-666666666666' },
      productionResponse: productionPlaintext,
      shadowResponse: shadowPlaintext,
      observationWindowId: 'window-privacy',
      agentId: 'infrastructure-monitor',
      agentTier: 'tier_infrastructure',
    });
    assert.equal(result.recorded, true);
    const serialized = JSON.stringify(wiring.getComparisons());
    assert.equal(serialized.includes(productionPlaintext), false);
    assert.equal(serialized.includes(shadowPlaintext), false);
  });

  assert.ok(Object.isFrozen(SHADOW_WIRING_SINKS), 'SHADOW_WIRING_SINKS should be frozen');
  console.log(`shadow wiring fixtures passed (${passed}/${passed})`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
