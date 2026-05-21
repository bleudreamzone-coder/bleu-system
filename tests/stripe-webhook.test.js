// tests/stripe-webhook.test.js
//
// Lightweight regression tests for the Stripe webhook in server.js.
// Run: `node tests/stripe-webhook.test.js`
// Exits non-zero on failure. No test framework required.
//
// Covers:
//   1) PROTOCOL_MAP integrity — every price ID maps to the protocol
//      name + checkout mode the frontend expects, format-valid, and
//      the historical 2026-05-21 Longevity Core typo cannot regress.
//   2) Frontend ↔ server alignment for every PRICE_* constant in
//      index.html.
//   3) Webhook signature verification — HMAC primitive sanity + the
//      fail-closed posture introduced 2026-05-21 (missing secret →
//      500, missing/malformed signature → 400, constant-time compare).
//
// Audit reference: _meta/audit/2026-05-21/05_REVENUE_AUDIT.md
//                  _meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let failures = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Section 1 — PROTOCOL_MAP integrity
// ─────────────────────────────────────────────────────────────
const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const protocolMapMatch = serverSrc.match(/const PROTOCOL_MAP = \{([\s\S]*?)\};/);
if (!protocolMapMatch) {
  console.error('FATAL: could not locate PROTOCOL_MAP in server.js');
  process.exit(2);
}
const protocolMapBlock = protocolMapMatch[1];

// `price_1` prefix + 23 base62 chars = 30 chars total.
const PRICE_ID_RE = /^price_1[A-Za-z0-9]{23}$/;

// Canonical mapping — drift between these and PROTOCOL_MAP is a revenue bug.
// Note: as of 2026-05 the PROTOCOL_MAP shape upgraded from string values to
// { name, mode } objects (commit 07636da). The test now asserts both fields.
const CANONICAL = {
  'price_1TEKQmK4cATmIFbokmkYg47S': { name: 'sleep_reset',    mode: 'subscription' },
  'price_1TEKS6K4cATmIFbo1OW7BeCW': { name: 'stress_reset',   mode: 'subscription' },
  'price_1TEKSWK4cATmIFbojDTEJng9': { name: 'longevity_core', mode: 'subscription' },
  'price_1TEKSsK4cATmIFbouxOBHtwQ': { name: 'gut_reset',      mode: 'subscription' },
  'price_1TBPtAK4cATmIFboFVb9m0QN': { name: 'pro',            mode: 'subscription' },
};

console.log('Section 1 — PROTOCOL_MAP');
for (const [priceId, expected] of Object.entries(CANONICAL)) {
  check(
    `price ID format: ${priceId}`,
    PRICE_ID_RE.test(priceId),
    'should match /^price_1[A-Za-z0-9]{23}$/',
  );
  // Match: 'price_id': { name: 'foo', mode: 'bar' }
  const lineRe = new RegExp(
    `'${priceId.replace(/\$/g, '\\$')}'\\s*:\\s*\\{\\s*name\\s*:\\s*'([^']+)'\\s*,\\s*mode\\s*:\\s*'([^']+)'\\s*\\}`,
  );
  const m = protocolMapBlock.match(lineRe);
  check(
    `PROTOCOL_MAP[${priceId}] is mapped`,
    !!m,
    'price ID not present or not in { name, mode } shape',
  );
  if (m) {
    check(`PROTOCOL_MAP[${priceId}].name = ${expected.name}`, m[1] === expected.name, `got '${m[1]}'`);
    check(`PROTOCOL_MAP[${priceId}].mode = ${expected.mode}`, m[2] === expected.mode, `got '${m[2]}'`);
  }
}

// Guard against re-introducing the historical Longevity-Core typo.
check(
  'no missing-4 typo in PROTOCOL_MAP',
  !protocolMapBlock.includes("'price_1TEKSWKcATmIFbojDTEJng9'"),
  'the 2026-05-21 typo has re-appeared',
);

// Section 1b — supply.html ↔ PROTOCOL_MAP alignment
//
// As of the 2026-05 phase-9 supply-tab restructure, frontend price IDs
// live on supply.html as `data-stripe-price` attributes on protocol cards
// (not as PRICE_* constants in index.html). Every price ID that supply.html
// references must be present in PROTOCOL_MAP, and vice-versa.
const supplyHtml = fs.readFileSync(path.join(__dirname, '..', 'supply.html'), 'utf8');
const FRONTEND_EXPECTED = [
  'price_1TEKQmK4cATmIFbokmkYg47S', // sleep
  'price_1TEKS6K4cATmIFbo1OW7BeCW', // stress
  'price_1TEKSWK4cATmIFbojDTEJng9', // longevity
  'price_1TEKSsK4cATmIFbouxOBHtwQ', // gut
];
console.log('Section 1b — supply.html ↔ PROTOCOL_MAP alignment');
for (const expectedId of FRONTEND_EXPECTED) {
  const re = new RegExp(`data-stripe-price\\s*=\\s*"${expectedId}"`);
  check(
    `supply.html data-stripe-price="${expectedId}"`,
    re.test(supplyHtml),
    'protocol card with this price ID is missing from supply.html',
  );
  check(
    `PROTOCOL_MAP['${expectedId}'] exists for supply.html card`,
    protocolMapBlock.includes(`'${expectedId}'`),
    'supply.html references a price ID not in PROTOCOL_MAP',
  );
}

// ─────────────────────────────────────────────────────────────
// Section 2 — Webhook signature verification (fail-closed)
// ─────────────────────────────────────────────────────────────
console.log('Section 2 — Webhook signature verification (fail-closed)');

function signStripePayload(secret, body, timestampSec) {
  const ts = timestampSec || Math.floor(Date.now() / 1000);
  const sig = crypto
    .createHmac('sha256', secret)
    .update(ts + '.' + body)
    .digest('hex');
  return { ts, header: `t=${ts},v1=${sig}` };
}

const FAKE_SECRET = 'whsec_test_2026_05_21';
const FAKE_BODY = JSON.stringify({
  type: 'checkout.session.completed',
  data: { object: { client_reference_id: 'u_test', metadata: { price_id: 'price_1TEKSWK4cATmIFbojDTEJng9' }, customer: 'cus_test' } },
});

const goodSig = signStripePayload(FAKE_SECRET, FAKE_BODY);
const expectedV1 = goodSig.header.split(',').find((s) => s.startsWith('v1=')).split('=')[1];
const recomputed = crypto.createHmac('sha256', FAKE_SECRET).update(goodSig.ts + '.' + FAKE_BODY).digest('hex');
check('signing primitive is deterministic', expectedV1 === recomputed);

const wrongSig = crypto.createHmac('sha256', 'whsec_wrong').update(goodSig.ts + '.' + FAKE_BODY).digest('hex');
check('signature changes with secret', expectedV1 !== wrongSig);

const tamperedSig = crypto.createHmac('sha256', FAKE_SECRET).update(goodSig.ts + '.' + FAKE_BODY.replace('u_test', 'u_attacker')).digest('hex');
check('signature changes with body', expectedV1 !== tamperedSig);

// Fail-closed posture assertions
const webhookFnMatch = serverSrc.match(/function handleStripeWebhook[\s\S]+?\n\}\n/);
check('handleStripeWebhook function located', !!webhookFnMatch);
if (webhookFnMatch) {
  const fnBody = webhookFnMatch[0];
  check(
    'fail-open conditional removed',
    !/if\s*\(\s*STRIPE_WEBHOOK_SECRET\s*&&\s*STRIPE_SECRET\s*\)/.test(fnBody),
    'still has `if (STRIPE_WEBHOOK_SECRET && STRIPE_SECRET) { ... }` guard',
  );
  check(
    'refuses when STRIPE_WEBHOOK_SECRET missing',
    /!STRIPE_WEBHOOK_SECRET[\s\S]*?json\(res,\s*500/.test(fnBody),
    'missing-secret branch should respond 500',
  );
  check(
    'logs CRITICAL when STRIPE_WEBHOOK_SECRET missing',
    /CRITICAL[\s\S]*?STRIPE_WEBHOOK_SECRET|STRIPE_WEBHOOK_SECRET[\s\S]*?CRITICAL/.test(fnBody),
    'missing-secret branch should log CRITICAL',
  );
  check(
    'refuses when stripe-signature header missing',
    /!sig[\s\S]*?json\(res,\s*400/.test(fnBody),
    'missing-signature branch should respond 400',
  );
  check(
    'guards malformed stripe-signature header',
    /Malformed stripe-signature/.test(fnBody),
    'should explicitly detect malformed header',
  );
  check(
    'uses constant-time comparison (timingSafeEqual)',
    /timingSafeEqual/.test(fnBody),
    'plain `!==` comparison leaks timing',
  );
}

check(
  'server boot warns CRITICAL on missing STRIPE_WEBHOOK_SECRET',
  /CRITICAL: STRIPE_WEBHOOK_SECRET is not set/.test(serverSrc),
  'startup banner should surface the misconfiguration',
);

// ─────────────────────────────────────────────────────────────
console.log('');
if (failures === 0) {
  console.log('stripe-webhook.test.js — PASS');
  process.exit(0);
} else {
  console.log(`stripe-webhook.test.js — FAIL (${failures} failures)`);
  process.exit(1);
}
