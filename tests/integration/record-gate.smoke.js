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

eval([
  "const PACKAGE_VERSION = '1.0.0';",
  grabConst('DISCHARGE_CONTEXT_RE'),
  grabConst('MEDICATION_CONTEXT_RE'),
  grabConst('BARRIER_RULES'),
  grabFunction('barrierLedgerEnabled'),
  grabFunction('classifyBarrierSignal'),
  grabFunction('barrierLedgerFields'),
  grabFunction('applyBarrierLedgerFields'),
  grabFunction('recordGateEnabled'),
  grabFunction('detectMedChangeSignal'),
  grabFunction('shouldAttemptMedChangeRecordGate'),
  grabFunction('buildMedChangeSafeFallback'),
  grabFunction('buildMedChangeCatalystEvent'),
  'async function insertCatalystEvent() { throw new Error("test stub should be supplied"); }',
  grabFunction('runMedChangeRecordGate'),
].join('\n'));

(async () => {
  console.log('TEST: med-change record gate');
  process.env.BARRIER_LEDGER_ENABLED = '';

  assert.equal(
    detectMedChangeSignal("I got discharged and don't understand my new medicine."),
    true,
    'discharge + medicine signal should be detected'
  );
  assert.equal(detectMedChangeSignal('I got discharged and need a ride.'), false, 'discharge alone is not enough');
  assert.equal(detectMedChangeSignal("I don't understand my new medicine."), false, 'medicine alone is not enough');
  assert.equal(detectMedChangeSignal('I got discharged from my job and tried meditation.'), false, 'near-word false positive should not match');
  assert.equal(
    shouldAttemptMedChangeRecordGate({ message: "I got discharged and don't understand my new medicine." }, { detected: true }, true),
    false,
    'crisis bypasses record gate attempt'
  );

  const location = { zip: '71457', confidence: 'high', source: 'entry' };
  const message = "I got discharged and don't understand my new medicine.";
  const writes = [];
  const recorded = await runMedChangeRecordGate({
    p: { message },
    crisis: { detected: false },
    location,
    routeDecision: { route_id: 'radius_71457_25mi_providers_found', status: 'providers_found', radius_miles: 25 },
    enabled: true,
    now: new Date('2026-06-12T17:00:00.000Z'),
    writeCatalystEvent: async (event) => {
      writes.push({ event, at: new Date().toISOString() });
      assert.ok(event.rationale && event.rationale.length > 20, 'rationale must be non-null');
      return { ok: true, row: { event_id: 'test-event' }, insertedAt: new Date().toISOString() };
    }
  });
  const governedResponseAt = new Date();
  assert.equal(recorded.status, 'recorded');
  assert.equal(recorded.shouldContinue, true);
  assert.equal(writes.length, 1, 'exactly one catalyst_event write expected');
  assert.equal(writes[0].event.window_type, 'discharge');
  assert.equal(writes[0].event.catalyst_type, 'medication_change');
  assert.equal(writes[0].event.siren_level, 'amber');
  assert.equal(writes[0].event.workflow_rail, 'care_transition');
  assert.equal(writes[0].event.commerce_allowed, false);
  assert.equal(writes[0].event.status, 'open');
  assert.equal(writes[0].event.route_id, 'radius_71457_25mi_providers_found');
  assert.equal(writes[0].event.event_origin, 'organic');
  assert.match(writes[0].event.rationale, /Route status=providers_found/);
  assert.doesNotMatch(writes[0].event.rationale, /med_change_bias=pharmacist_first/);
  assert.equal(writes[0].event.follow_up_due_at, '2026-06-14T17:00:00.000Z');
  assert.equal(Object.prototype.hasOwnProperty.call(writes[0].event, 'barrier_type'), false, 'flag-off path must not add barrier fields');
  assert.ok(Date.parse(recorded.insertCompletedAt) <= governedResponseAt.getTime(), 'insert completes before governed response timestamp');

  const biasedEvent = buildMedChangeCatalystEvent({
    p: { message },
    location,
    now: new Date('2026-06-12T17:00:00.000Z'),
    routeDecision: {
      route_id: 'radius_71457_25mi_providers_found',
      status: 'providers_found',
      radius_miles: 25,
      med_change_bias: 'med_change_bias=pharmacist_first',
    },
  });
  assert.match(biasedEvent.rationale, /med_change_bias=pharmacist_first/, 'biased route marker should be preserved in catalyst_event rationale');
  assert.equal(Object.prototype.hasOwnProperty.call(biasedEvent, 'barrier_type'), false, 'flag-off builder remains byte-identical for new columns');

  process.env.BARRIER_LEDGER_ENABLED = 'true';
  const barrierEvent = buildMedChangeCatalystEvent({
    p: { message },
    location,
    now: new Date('2026-06-12T17:00:00.000Z'),
    routeDecision: { route_id: 'radius_71457_25mi_providers_found', status: 'providers_found', radius_miles: 25 },
  });
  assert.equal(barrierEvent.barrier_type, 'confusion');
  assert.equal(barrierEvent.barrier_confidence, 0.84);
  assert.equal(barrierEvent.user_confirmed, true);
  assert.equal(barrierEvent.barrier_resolved_status, 'open');
  assert.equal(barrierEvent.aggregate_allowed, false);
  process.env.BARRIER_LEDGER_ENABLED = '';

  let failedWrites = 0;
  const originalConsoleError = console.error;
  let blocked;
  try {
    console.error = () => {};
    blocked = await runMedChangeRecordGate({
      p: { message },
      crisis: { detected: false },
      location,
      enabled: true,
      writeCatalystEvent: async () => {
        failedWrites++;
        throw new Error('simulated insert failure');
      }
    });
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(failedWrites, 1, 'failed insert is attempted once');
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.shouldContinue, false);
  assert.match(blocked.fallback, /5-digit ZIP|ZIP 71457|discharge/i, 'fallback should ask or confirm ZIP/general resources');
  assert.doesNotMatch(blocked.fallback, /\b(take|dose|dosage|mg|milligram|tablet every)\b/i, 'fallback must not give med guidance');

  let crisisWrites = 0;
  const crisis = await runMedChangeRecordGate({
    p: { message: `${message} I want to die.` },
    crisis: { detected: true },
    location,
    enabled: true,
    writeCatalystEvent: async () => {
      crisisWrites++;
      return { ok: true };
    }
  });
  assert.equal(crisis.status, 'crisis_bypass');
  assert.equal(crisis.shouldContinue, true);
  assert.equal(crisisWrites, 0, 'crisis path must not require catalyst_event write');

  let normalWrites = 0;
  const normal = await runMedChangeRecordGate({
    p: { message: 'hello from 71457' },
    crisis: { detected: false },
    location,
    enabled: true,
    writeCatalystEvent: async () => {
      normalWrites++;
      return { ok: true };
    }
  });
  assert.equal(normal.status, 'not_med_change');
  assert.equal(normal.shouldContinue, true);
  assert.equal(normalWrites, 0, 'normal messages should be unchanged');

  console.log('  passed record gate smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
