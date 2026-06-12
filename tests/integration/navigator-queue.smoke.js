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

const routeStart = src.indexOf("if (pn === '/api/navigator/queue' && req.method === 'GET')");
const routeEnd = src.indexOf("\n\n  if (pn === '/geo'", routeStart);
if (routeStart < 0 || routeEnd < 0) throw new Error('could not extract navigator queue route block');
const navigatorRouteBlock = src.slice(routeStart, routeEnd);
const expectedNavigatorSelect = grabConst('NAVIGATOR_QUEUE_EVENT_SELECT').match(/'([^']+)'/)[1];

const REORDER_CRON_SECRET = 'navigator-smoke-secret';

eval([
  grabFunction('navigatorQueueEnabled'),
  grabConst('NAVIGATOR_QUEUE_EVENT_SELECT'),
  grabFunction('normalizedMetricKey'),
  grabFunction('coarseRouteCategory'),
  grabFunction('buildNavigatorQueue'),
  grabFunction('navigatorQueuePayloadIsSafe'),
  grabFunction('fetchNavigatorQueue'),
  grabFunction('returnBearerAuth'),
  grabFunction('json'),
  grabFunction('handleNavigatorQueue'),
].join('\n'));

function makeReq(secret) {
  return {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
    socket: { remoteAddress: '127.0.0.1' },
  };
}

function makeRes() {
  return {
    statusCode: null,
    headers: null,
    rawBody: '',
    body: null,
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = headers || {};
    },
    end(raw) {
      this.rawBody = raw || '';
      this.body = this.rawBody ? JSON.parse(this.rawBody) : null;
    },
  };
}

const now = new Date('2026-06-12T20:00:00.000Z');
const sampleRows = [
  {
    event_id: '11111111-1111-4111-8111-111111111111',
    catalyst_type: 'medication_change',
    siren_level: 'amber',
    workflow_rail: 'care_transition',
    route_id: 'radius_71457_25mi_providers_found',
    status: 'open',
    outcome: 'still_needs_help',
    staff_action_required: true,
    follow_up_due_at: '2026-06-12T19:30:00.000Z',
    created_at: '2026-06-12T18:00:00.000Z',
    rationale: 'raw handoff story must not appear in navigator queue',
    phone: '318-555-0100',
  },
  {
    event_id: '22222222-2222-4222-8222-222222222222',
    catalyst_type: 'medication_change',
    siren_level: 'amber',
    workflow_rail: 'care_transition',
    route_id: 'phase3_return_proof_71457',
    status: 'resolved',
    outcome: 'reached_support',
    staff_action_required: true,
    follow_up_due_at: '2026-06-12T19:30:00.000Z',
    created_at: '2026-06-12T18:15:00.000Z',
  },
  {
    event_id: '33333333-3333-4333-8333-333333333333',
    catalyst_type: 'benefits_navigation',
    siren_level: 'yellow',
    workflow_rail: 'community_support',
    route_id: 'radius_99999_100mi_honest_desert',
    status: 'open',
    outcome: null,
    staff_action_required: true,
    follow_up_due_at: '2026-06-13T19:30:00.000Z',
    created_at: '2026-06-12T18:30:00.000Z',
  },
  {
    event_id: '44444444-4444-4444-8444-444444444444',
    catalyst_type: 'housing_support',
    siren_level: 'orange',
    workflow_rail: 'community_support',
    route_id: 'phase1_record_gate_zip_71457',
    status: 'open',
    outcome: null,
    staff_action_required: false,
    follow_up_due_at: '2026-06-12T18:30:00.000Z',
    created_at: '2026-06-12T18:45:00.000Z',
  },
];

function directFilteredRows() {
  return sampleRows.filter((row) => row.staff_action_required === true && row.status === 'open');
}

function queryFor(rows, calls) {
  return async (table, query, limit, method) => {
    calls.push({ table, query, limit, method: method || 'GET' });
    assert.equal(table, 'catalyst_event');
    assert.equal(method, undefined);
    assert.equal(query, expectedNavigatorSelect);
    assert.match(query, /staff_action_required=eq\.true/);
    assert.match(query, /status=eq\.open/);
    assert.equal(limit, 500);
    return rows.filter((row) => row.staff_action_required === true && row.status === 'open');
  };
}

(async () => {
  console.log('TEST: navigator queue');

  process.env.NAVIGATOR_QUEUE_ENABLED = '';
  assert.equal(navigatorQueueEnabled(), false);

  let calls = [];
  let res = makeRes();
  await handleNavigatorQueue(makeReq(), res, { queryImpl: queryFor(sampleRows, calls), now });
  assert.equal(res.statusCode, 404, 'disabled navigator queue should hide the route');
  assert.deepEqual(res.body, { error: 'Not found' });
  assert.equal(calls.length, 0, 'disabled navigator queue must not read data');

  process.env.NAVIGATOR_QUEUE_ENABLED = 'true';
  assert.equal(navigatorQueueEnabled(), true);

  calls = [];
  res = makeRes();
  const originalWarn = console.warn;
  try {
    console.warn = () => {};
    await handleNavigatorQueue(makeReq(), res, { queryImpl: queryFor(sampleRows, calls), now });
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(res.statusCode, 401, 'missing bearer auth should be rejected');
  assert.equal(calls.length, 0, 'unauthorized navigator queue must not read data');

  calls = [];
  res = makeRes();
  await handleNavigatorQueue(makeReq(REORDER_CRON_SECRET), res, { queryImpl: queryFor(sampleRows, calls), now });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 1, 'authorized navigator queue should read catalyst_event once');

  const directRows = directFilteredRows();
  assert.equal(res.body.count, directRows.length, 'queue count should match direct filtered count');
  assert.equal(res.body.items.length, directRows.length);

  const allowedItemKeys = [
    'catalyst_type',
    'created_at',
    'event_id',
    'follow_up_due_at',
    'overdue',
    'route_category',
    'siren_level',
    'status',
    'workflow_rail',
  ].sort();

  const directIds = new Set(directRows.map((row) => row.event_id));
  for (const item of res.body.items) {
    assert.deepEqual(Object.keys(item).sort(), allowedItemKeys);
    assert.equal(item.status, 'open');
    assert.equal(directIds.has(item.event_id), true, 'queue item must come from staff-action open source row');
    assert.equal(Object.prototype.hasOwnProperty.call(item, 'staff_action_required'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(item, 'consent_status'), false);
  }
  assert.equal(res.body.items[0].route_category, 'radius_providers_found');
  assert.equal(res.body.items[0].overdue, true);
  assert.equal(res.body.items[1].route_category, 'honest_desert');
  assert.equal(res.body.items[1].overdue, false);

  const payloadText = JSON.stringify(res.body);
  assert.equal(navigatorQueuePayloadIsSafe(res.body, sampleRows), true);
  assert.doesNotMatch(payloadText, /sms_log\.body|["']body["']/i);
  assert.doesNotMatch(payloadText, /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  assert.doesNotMatch(payloadText, /radius_71457_25mi_providers_found/);
  assert.doesNotMatch(payloadText, /radius_99999_100mi_honest_desert/);
  assert.doesNotMatch(payloadText, /raw handoff story/);
  assert.doesNotMatch(payloadText, /rationale/i);

  assert.equal(navigatorQueuePayloadIsSafe({ route: 'radius_71457_25mi_providers_found' }, sampleRows), false);
  assert.equal(navigatorQueuePayloadIsSafe({ text: 'raw handoff story must not appear in navigator queue' }, sampleRows), false);
  assert.equal(navigatorQueuePayloadIsSafe({ body: 'HELP' }, sampleRows), false);
  assert.equal(navigatorQueuePayloadIsSafe({ phone: '318-555-0100' }, sampleRows), false);

  assert.equal(coarseRouteCategory('radius_71457_25mi_providers_found'), 'radius_providers_found');
  assert.equal(coarseRouteCategory('radius_99999_100mi_honest_desert'), 'honest_desert');
  assert.equal(coarseRouteCategory('phase1_record_gate_zip_71457'), 'record_gate_default');

  assert.doesNotMatch(navigatorRouteBlock, /\b(POST|PATCH|PUT|DELETE|INSERT|UPDATE|UPSERT)\b|sendSMS|twilio/i);
  assert.match(navigatorRouteBlock, /handleNavigatorQueue/);

  console.log('  passed navigator queue smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
