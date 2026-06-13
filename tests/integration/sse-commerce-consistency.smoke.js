const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

function grabConst(name) {
  const re = new RegExp(`const ${name} = [^;]+;`);
  const m = src.match(re);
  if (!m) throw new Error(`could not extract const ${name}`);
  return m[0];
}

function grabFunction(name) {
  const rawStart = src.indexOf(`function ${name}`);
  const start = rawStart >= 6 && src.slice(rawStart - 6, rawStart) === 'async ' ? rawStart - 6 : rawStart;
  if (start < 0) throw new Error(`could not extract function ${name}`);
  const argsOpen = src.indexOf('(', start);
  let parenDepth = 0;
  let argsEnd = -1;
  for (let i = argsOpen; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
    if (parenDepth === 0) {
      argsEnd = i;
      break;
    }
  }
  if (argsEnd < 0) throw new Error(`unterminated function args ${name}`);
  const open = src.indexOf('{', argsEnd);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const chatStart = src.indexOf("if (pn === '/api/chat' && req.method === 'POST')");
const streamStart = src.indexOf("if (pn === '/api/chat/stream' && req.method === 'POST')");
if (chatStart < 0 || streamStart < 0) throw new Error('could not find chat route blocks');
const chatBlock = src.slice(chatStart, streamStart);
const streamBlock = src.slice(streamStart, src.indexOf("\n\n  // server-mediated", streamStart));

const state = {
  catalog: [],
  catalogFail: false,
  events: [],
  decisions: [],
  classification: { risk: 'none', classification: 'none', crisis_takeover: false, commerce_allowed: true },
};
const EXPECTED_FALLBACK_LINE = "I couldn't load that surface right now. I can still give you the safe path, try again, or route this to a human or practitioner.";

function logEvent(evt) { state.events.push(evt); }
function logDecision(evt) { state.decisions.push(evt); }
function detectCrisis(message) {
  return /kill myself|suicide|want to die/i.test(String(message || ''))
    ? { detected: true, category: 'suicide', matched: 'test' }
    : { detected: false };
}
function isCrisisPhrase(message) { return detectCrisis(message).detected; }
function seriousIllnessLedgerClassification() { return state.classification; }
async function querySupabase(table, query) {
  if (table !== 'bleu_catalog') return [];
  if (state.catalogFail) return null;
  assert.equal(query, '?active=eq.true&select=*');
  return state.catalog;
}

eval([
  'const EMOTIONAL_SESSIONS = new Set();',
  grabConst('EMOTIONAL_INTENT_RE'),
  grabConst('COMMERCE_CONCERN_RE'),
  grabConst('EXPLICIT_PRODUCT_INTENT'),
  grabConst('CARE_FIRST_MIN_ASSISTANT_TURNS'),
  grabFunction('countPriorAssistantTurns'),
  grabFunction('checkEmotionalIntent'),
  grabFunction('getCommerceGate'),
  grabConst('SSE_COMMERCE_SURFACE_FALLBACK_LINE'),
  grabConst('PRACTITIONER_MEDICATION_RE'),
  grabConst('PRODUCT_OR_SUPPLEMENT_RE'),
  grabFunction('sseCommerceConsistencyEnabled'),
  grabFunction('practitionerReviewRequired'),
  grabFunction('commerceSafetyRisk'),
  grabFunction('buildSseCommerceGate'),
  grabFunction('writeSseCommerceGate'),
  grabFunction('writeCommerceSurfaceFallbackSSE'),
  grabFunction('affiliateDisclosureForCard'),
  grabFunction('intentBrain'),
  grabConst('_RAIL_C_MATCHERS'),
  grabConst('_RAIL_A_MATCHERS'),
  grabFunction('productBrain'),
  grabFunction('safetyBrain'),
  grabFunction('cartBrain'),
  grabFunction('memoryBrain'),
  grabFunction('scoreReceptivity'),
  grabFunction('scoreStability'),
  grabFunction('openWindowGate'),
  grabFunction('ecsiqMode'),
  grabFunction('runCommerceSteward'),
].join('\n'));

function makeRes() {
  return {
    chunks: [],
    write(chunk) {
      this.chunks.push(JSON.parse(String(chunk).replace(/^data:\s*/, '').trim()));
    },
  };
}

function reset() {
  state.catalog = [
    {
      sku: 'magnesium_glycinate',
      rail: 'C',
      active: true,
      name: 'Magnesium Glycinate',
      description: 'Low-risk magnesium support',
      price_cents: 1800,
      amazon_url: 'https://amazon.example/magnesium',
      felicia_signoff: true,
    },
    {
      sku: 'omega3_epadha_2g',
      rail: 'C',
      active: true,
      name: 'Omega-3 EPA/DHA',
      description: 'Omega-3 support',
      price_cents: 2400,
      amazon_url: 'https://amazon.example/omega',
      felicia_signoff: true,
    },
  ];
  state.catalogFail = false;
  state.events = [];
  state.decisions = [];
  state.classification = { risk: 'none', classification: 'none', crisis_takeover: false, commerce_allowed: true };
}

(async () => {
  console.log('TEST: SSE commerce consistency');

  reset();
  process.env.SSE_COMMERCE_CONSISTENCY_ENABLED = '';
  let res = makeRes();
  await runCommerceSteward(res, { message: 'where can I buy magnesium', mode: 'general', session: 's1' }, { detected: false });
  assert.equal(sseCommerceConsistencyEnabled(), false);
  assert.equal(res.chunks.some((chunk) => Object.prototype.hasOwnProperty.call(chunk, 'commerce_gate')), false, 'flag off must not emit new gate control chunks');
  assert.equal(res.chunks.some((chunk) => Array.isArray(chunk.cards) && chunk.cards.length === 1), true, 'flag off existing card path still works');

  reset();
  process.env.SSE_COMMERCE_CONSISTENCY_ENABLED = 'true';
  res = makeRes();
  await runCommerceSteward(res, { message: 'where can I buy omega-3', mode: 'general', session: 's2' }, { detected: false });
  assert.equal(res.chunks[0].commerce_gate.allowed, true, 'allowed product request emits a gate first');
  assert.equal(res.chunks[0].commerce_gate.affiliate_disclosure_required, true);
  assert.equal(res.chunks[1].cards[0].sku, 'omega3_epadha_2g');
  assert.match(res.chunks[1].cards[0].affiliate_disclosure, /Amazon affiliate link disclosure/);

  reset();
  res = makeRes();
  await runCommerceSteward(res, { message: 'I take a heart medication and want magnesium', mode: 'general', session: 's3' }, { detected: false });
  assert.equal(res.chunks[0].commerce_gate.allowed, false);
  assert.equal(res.chunks[0].commerce_gate.reason, 'practitioner_required');
  assert.equal(res.chunks[0].commerce_gate.suppressCommerce, true);
  assert.equal(res.chunks.some((chunk) => chunk.cards), false, 'practitioner-required turns must not render supplement cards');

  reset();
  res = makeRes();
  await runCommerceSteward(res, { message: 'where can I buy magnesium I want to kill myself', mode: 'general', session: 's4' }, { detected: true, category: 'suicide' });
  assert.equal(res.chunks[0].commerce_gate.allowed, false);
  assert.equal(res.chunks[0].commerce_gate.reason, 'red_safety');
  assert.equal(res.chunks.some((chunk) => chunk.cards), false, 'crisis must block all commerce cards');

  reset();
  state.classification = { risk: 'amber', classification: 'serious_illness', crisis_takeover: false, commerce_allowed: false };
  res = makeRes();
  await runCommerceSteward(res, { message: 'I have stage 4 cancer and need help planning and want magnesium', mode: 'general', session: 's5' }, { detected: false });
  assert.equal(res.chunks[0].commerce_gate.allowed, false);
  assert.equal(res.chunks[0].commerce_gate.reason, 'amber_safety');
  assert.equal(res.chunks.some((chunk) => chunk.cards), false, 'amber safety turns must block product/protocol cards');

  reset();
  state.catalogFail = true;
  res = makeRes();
  await runCommerceSteward(res, { message: 'where can I buy magnesium', mode: 'general', session: 's6' }, { detected: false });
  assert.equal(res.chunks[0].commerce_gate.allowed, true);
  assert.equal(res.chunks[1].commerce_surface_fallback, true);
  assert.equal(res.chunks[1].text, EXPECTED_FALLBACK_LINE);
  assert.equal(res.chunks.some((chunk) => chunk.cards), false, 'surface failure must not emit partial cards');

  assert.match(chatBlock, /buildSseCommerceGate/);
  assert.match(chatBlock, /appendCommerceGatePrompt\(sys, p\._commerceGate\)/);
  assert.match(streamBlock, /buildSseCommerceGate/);
  assert.match(streamBlock, /appendCommerceGatePrompt\(sys, p\._commerceGate\)/);

  process.env.SSE_COMMERCE_CONSISTENCY_ENABLED = '';
  console.log('  passed SSE commerce consistency smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
