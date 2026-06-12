const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');
const returnStart = src.indexOf('// ═══ RETURN LOOP (Phase 3');
const returnEnd = src.indexOf('\nfunction writeRecordGateFallbackSSE', returnStart);
if (returnStart < 0 || returnEnd < 0) throw new Error('could not extract return loop block');
const returnBlock = src.slice(returnStart, returnEnd);

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
    if (parenDepth === 0) { argsEnd = i; break; }
  }
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

var querySupabase = async () => { throw new Error('querySupabase stub not configured'); };
var detectCrisis = () => ({ detected: false });
var isCrisisPhrase = () => false;
const CRISIS_BANNER = '988 crisis banner';
const REORDER_CRON_SECRET = 'return-smoke-secret';

eval([
  grabFunction('returnLoopEnabled'),
  grabFunction('smsEnabled'),
  returnBlock
].join('\n'));

const now = new Date('2026-06-12T19:00:00.000Z');
const duePast = '2026-06-12T18:59:00.000Z';
const grantedEventId = '11111111-1111-4111-8111-111111111111';
const unknownEventId = '22222222-2222-4222-8222-222222222222';
const helpEventId = '33333333-3333-4333-8333-333333333333';
const crisisEventId = '44444444-4444-4444-8444-444444444444';

function makeState() {
  return {
    events: [
      { event_id: grantedEventId, status: 'open', consent_status: 'granted', follow_up_due_at: duePast, staff_action_required: false, outcome: null },
      { event_id: unknownEventId, status: 'open', consent_status: 'unknown', follow_up_due_at: duePast, staff_action_required: false, outcome: null },
      { event_id: helpEventId, status: 'open', consent_status: 'granted', follow_up_due_at: duePast, staff_action_required: false, outcome: null },
      { event_id: crisisEventId, status: 'open', consent_status: 'granted', follow_up_due_at: duePast, staff_action_required: false, outcome: null },
    ],
    smsLogs: [],
    patches: [],
  };
}

function queryFor(state) {
  return async (table, query, limit, method, body) => {
    if (table === 'catalyst_event' && !method) {
      assert.match(query, /status=eq\.open/);
      assert.match(query, /follow_up_due_at=lte\./);
      return state.events.filter((event) => event.status === 'open' && event.follow_up_due_at <= now.toISOString());
    }
    if (table === 'sms_log' && !method) {
      const m = query.match(/event_id=eq\.([^&]+)/);
      const id = m ? decodeURIComponent(m[1]) : '';
      return state.smsLogs.filter((row) => row.event_id === id && row.direction === 'outbound');
    }
    if (table === 'sms_log' && method === 'POST') {
      state.smsLogs.push(body);
      return true;
    }
    if (table === 'catalyst_event' && method === 'PATCH') {
      const m = query.match(/event_id=eq\.([^&]+)/);
      const id = m ? decodeURIComponent(m[1]) : '';
      const event = state.events.find((row) => row.event_id === id);
      if (event) Object.assign(event, body);
      state.patches.push({ id, body });
      return event ? [event] : [];
    }
    throw new Error(`unexpected query ${table} ${method || 'GET'} ${query}`);
  };
}

function assertNoPhi(body) {
  assert.equal(returnSmsBodyHasPhi(body), false, `PHI token leaked into sms_log body: ${body}`);
}

(async () => {
  console.log('TEST: simulated return loop');

  process.env.RETURN_LOOP_ENABLED = 'true';
  process.env.SMS_ENABLED = '';
  let sendSmsCalls = 0;
  const sendSMS = () => { sendSmsCalls++; throw new Error('sendSMS must not be called by Phase 3'); };
  assert.equal(typeof sendSMS, 'function');

  let state = makeState();
  let result = await processDueReturnFollowUps({ now, queryImpl: queryFor(state) });
  assert.equal(result.processed, 4);
  assert.equal(result.simulated_sent, 3);
  assert.equal(result.skipped_no_consent, 1);
  assert.equal(state.smsLogs.filter((row) => row.direction === 'outbound').length, 3);
  assert.equal(state.smsLogs.some((row) => row.event_id === unknownEventId), false, 'unknown consent must be skipped');
  for (const row of state.smsLogs) {
    assert.equal(row.status, 'simulated');
    assert.equal(row.direction, 'outbound');
    assertNoPhi(row.body);
    assert.doesNotMatch(row.body, /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
  }
  assert.equal(sendSmsCalls, 0, 'Phase 3 must not invoke sendSMS');

  result = await processDueReturnFollowUps({ now, queryImpl: queryFor(state) });
  assert.equal(result.simulated_sent, 0, 'dedupe should prevent duplicate outbound rows');
  assert.equal(result.skipped_duplicate, 3);
  assert.equal(state.smsLogs.filter((row) => row.direction === 'outbound').length, 3);

  state = makeState();
  let inbound = await handleSimulatedReturnInbound({ event_id: grantedEventId, reply: 'REACHED', now, queryImpl: queryFor(state) });
  assert.equal(inbound.action, 'closed');
  assert.equal(state.events.find((row) => row.event_id === grantedEventId).status, 'resolved');
  assert.equal(state.events.find((row) => row.event_id === grantedEventId).outcome, 'reached_support');
  assert.equal(state.smsLogs.at(-1).direction, 'inbound');
  assert.equal(state.smsLogs.at(-1).body, 'REACHED');
  assertNoPhi(state.smsLogs.at(-1).body);

  inbound = await handleSimulatedReturnInbound({ event_id: helpEventId, reply: "HELP I can't reach anyone", now, queryImpl: queryFor(state) });
  assert.equal(inbound.action, 'reopened');
  const helped = state.events.find((row) => row.event_id === helpEventId);
  assert.equal(helped.status, 'open');
  assert.equal(helped.staff_action_required, true);
  assert.equal(helped.outcome, 'still_needs_help');
  assert.equal(helped.follow_up_due_at, '2026-06-13T19:00:00.000Z');
  assert.equal(state.smsLogs.at(-1).body, 'HELP');
  assertNoPhi(state.smsLogs.at(-1).body);

  inbound = await handleSimulatedReturnInbound({ event_id: grantedEventId, reply: 'maybe later', now, queryImpl: queryFor(state) });
  assert.equal(inbound.action, 'unclear');
  assert.match(inbound.message, /REACHED or HELP/);
  assert.equal(state.smsLogs.at(-1).body, 'UNCLEAR_REPLY');
  assertNoPhi(state.smsLogs.at(-1).body);

  let writesBefore = state.smsLogs.length;
  inbound = await handleSimulatedReturnInbound({
    event_id: crisisEventId,
    reply: 'I want to kill myself',
    now,
    queryImpl: async () => { throw new Error('crisis path must not depend on DB writes'); },
    detectCrisisImpl: () => ({ detected: true, category: 'self_harm' }),
    isCrisisPhraseImpl: () => true,
  });
  assert.equal(inbound.action, 'crisis');
  assert.equal(inbound.crisis, true);
  assert.equal(inbound.text, CRISIS_BANNER);
  assert.equal(state.smsLogs.length, writesBefore, 'crisis path should not write sms_log before responding');

  inbound = await handleSimulatedReturnInbound({
    event_id: 'not-a-valid-event-id',
    reply: 'I want to kill myself',
    now,
    queryImpl: async () => { throw new Error('crisis path must not depend on DB writes'); },
    detectCrisisImpl: () => ({ detected: true, category: 'self_harm' }),
    isCrisisPhraseImpl: () => true,
  });
  assert.equal(inbound.action, 'crisis', 'crisis must be checked before event_id validation');
  assert.equal(inbound.event_id, '');
  assert.equal(inbound.text, CRISIS_BANNER);

  process.env.RETURN_LOOP_ENABLED = '';
  state = makeState();
  result = await processDueReturnFollowUps({ queryImpl: queryFor(state) });
  assert.equal(result.enabled, false);
  assert.equal(state.smsLogs.length, 0);
  inbound = await handleSimulatedReturnInbound({ event_id: grantedEventId, reply: 'REACHED', queryImpl: queryFor(state) });
  assert.equal(inbound.action, 'disabled');
  assert.equal(state.smsLogs.length, 0);

  assert.equal(returnSmsBodyHasPhi('Lexapro and diabetes'), true, 'PHI guard should catch med/condition tokens');
  assert.doesNotMatch(returnBlock, /sendSMS\s*\(/, 'return loop block must not call live Twilio sender');
  assert.match(src, /if \(pn === '\/api\/sms\/inbound' && req\.method === 'POST'\)/, 'existing day-7 inbound endpoint must remain present');
  assert.match(src, /if \(pn === '\/twilio-reply' && req\.method === 'POST'\)/, 'existing reorder reply endpoint must remain present');

  console.log('  passed simulated return loop smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
