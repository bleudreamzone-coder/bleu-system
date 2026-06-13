const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { classifyCrisisPhrase } = require('../../core/safety/canonical_crisis_patterns');
const src = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

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
  grabFunction('seriousIllnessLedgerEnabled'),
  grabFunction('seriousIllnessLedgerClassification'),
  grabFunction('shouldAttemptSeriousIllnessLedger'),
  grabFunction('buildSeriousIllnessCatalystEvent'),
  'async function insertCatalystEvent() { throw new Error("test stub should be supplied"); }',
  grabFunction('runSeriousIllnessLedgerGate'),
].join('\n'));

(async () => {
  console.log('TEST: serious-illness ledger gate');
  process.env.TERMINAL_ILLNESS_CRISIS_RULE_ENABLED = 'true';

  const message = "I have stage 4 cancer and I'm going to die — I need help planning";
  const classification = seriousIllnessLedgerClassification(message);
  assert.equal(classification.risk, 'amber');
  assert.equal(classification.classification, 'serious_illness');
  assert.equal(classification.crisis_takeover, false);
  assert.equal(classification.commerce_allowed, false);
  assert.equal(classification.staff_action_required, true);

  process.env.SERIOUS_ILLNESS_LEDGER_ENABLED = '';
  assert.equal(seriousIllnessLedgerEnabled(), false);
  let writes = 0;
  const disabled = await runSeriousIllnessLedgerGate({
    p: { message },
    crisis: { detected: false },
    classification,
    writeCatalystEvent: async () => {
      writes++;
      return { ok: true };
    },
  });
  assert.equal(disabled.status, 'disabled');
  assert.equal(disabled.shouldContinue, true);
  assert.equal(writes, 0, 'flag-off serious-illness ledger must not write');

  process.env.SERIOUS_ILLNESS_LEDGER_ENABLED = 'true';
  assert.equal(seriousIllnessLedgerEnabled(), true);
  const recordedWrites = [];
  const recorded = await runSeriousIllnessLedgerGate({
    p: { message },
    crisis: { detected: false },
    classification,
    enabled: true,
    now: new Date('2026-06-13T15:00:00.000Z'),
    writeCatalystEvent: async (event) => {
      recordedWrites.push({ event, at: new Date().toISOString() });
      assert.ok(event.rationale && event.rationale.length > 20, 'rationale must be non-null');
      return { ok: true, row: { event_id: 'serious-illness-test' }, insertedAt: new Date().toISOString() };
    },
  });
  const governedResponseAt = new Date();
  assert.equal(recorded.status, 'recorded');
  assert.equal(recorded.shouldContinue, true);
  assert.equal(recorded.gated, true);
  assert.equal(recordedWrites.length, 1, 'exactly one catalyst_event write expected');
  const event = recordedWrites[0].event;
  assert.equal(event.window_type, 'serious_illness');
  assert.equal(event.catalyst_type, 'serious_illness');
  assert.equal(event.siren_level, 'amber');
  assert.equal(event.workflow_rail, 'serious_illness_support');
  assert.equal(event.route_id, 'serious_illness_staff_action_required');
  assert.equal(event.staff_action_required, true);
  assert.equal(event.commerce_allowed, false);
  assert.equal(event.media_allowed, false);
  assert.equal(event.status, 'open');
  assert.equal(event.event_origin, 'organic');
  assert.equal(event.follow_up_due_at, '2026-06-14T15:00:00.000Z');
  assert.match(event.rationale, /Serious-illness determination classified amber/);
  assert.match(event.rationale, /commerce closed/);
  assert.ok(Date.parse(recorded.insertCompletedAt) <= governedResponseAt.getTime(), 'insert completes before governed response timestamp');

  const originalConsoleError = console.error;
  let failed;
  let failedWrites = 0;
  try {
    console.error = () => {};
    failed = await runSeriousIllnessLedgerGate({
      p: { message },
      crisis: { detected: false },
      classification,
      enabled: true,
      writeCatalystEvent: async () => {
        failedWrites++;
        throw new Error('simulated insert failure');
      },
    });
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(failedWrites, 1, 'failed insert is attempted once');
  assert.equal(failed.status, 'write_failed_fail_open');
  assert.equal(failed.shouldContinue, true, 'serious-illness support must remain fail-open');
  assert.equal(failed.gated, true);
  assert.ok(failed.event && failed.event.rationale, 'failed write should still expose intended event to logs/tests');

  let crisisWrites = 0;
  const crisis = await runSeriousIllnessLedgerGate({
    p: { message: "I'm terminal and I want to end it myself before it gets bad" },
    crisis: { detected: true },
    enabled: true,
    writeCatalystEvent: async () => {
      crisisWrites++;
      return { ok: true };
    },
  });
  assert.equal(crisis.status, 'crisis_bypass');
  assert.equal(crisis.shouldContinue, true);
  assert.equal(crisisWrites, 0, 'crisis path must not require catalyst_event write');

  let caregiverWrites = 0;
  const caregiver = await runSeriousIllnessLedgerGate({
    p: { message: "My mother is dying, I can't do this anymore" },
    crisis: { detected: false },
    enabled: true,
    writeCatalystEvent: async () => {
      caregiverWrites++;
      return { ok: true };
    },
  });
  assert.equal(caregiver.status, 'not_serious_illness');
  assert.equal(caregiver.shouldContinue, true);
  assert.equal(caregiverWrites, 0, 'caregiver overload remains outside this narrow PR');

  let normalWrites = 0;
  const normal = await runSeriousIllnessLedgerGate({
    p: { message: 'hello from 71457' },
    crisis: { detected: false },
    enabled: true,
    writeCatalystEvent: async () => {
      normalWrites++;
      return { ok: true };
    },
  });
  assert.equal(normal.status, 'not_serious_illness');
  assert.equal(normal.shouldContinue, true);
  assert.equal(normalWrites, 0, 'normal messages should be unchanged');

  console.log('  passed serious-illness ledger smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
