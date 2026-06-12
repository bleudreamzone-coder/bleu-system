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

const routeStart = src.indexOf("if (pn === '/api/command/overview' && req.method === 'GET')");
const routeEnd = src.indexOf("\n\n  if (pn === '/api/navigator/queue'", routeStart);
if (routeStart < 0 || routeEnd < 0) throw new Error('could not extract command overview route block');
const commandRouteBlock = src.slice(routeStart, routeEnd);
const expectedCommandViewSelect = grabConst('COMMAND_VIEW_EVENT_SELECT').match(/'([^']+)'/)[1];

const REORDER_CRON_SECRET = 'command-smoke-secret';

eval([
  grabFunction('commandViewEnabled'),
  grabConst('COMMAND_VIEW_EVENT_SELECT'),
  grabFunction('normalizedMetricKey'),
  grabFunction('incrementMetric'),
  grabFunction('coarseRouteCategory'),
  grabFunction('sortedMetricObject'),
  grabFunction('buildCommandOverview'),
  grabFunction('commandOverviewPayloadIsSafe'),
  grabFunction('fetchCommandOverview'),
  grabFunction('returnBearerAuth'),
  grabFunction('json'),
  grabFunction('handleCommandOverview'),
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
    outcome: null,
    staff_action_required: false,
    follow_up_due_at: '2026-06-12T19:30:00.000Z',
    created_at: '2026-06-12T19:00:00.000Z',
    rationale: 'raw clinical narrative must never leave the command view',
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
    staff_action_required: false,
    follow_up_due_at: '2026-06-12T19:30:00.000Z',
    created_at: '2026-06-12T19:00:00.000Z',
  },
  {
    event_id: '33333333-3333-4333-8333-333333333333',
    catalyst_type: 'benefits_navigation',
    siren_level: 'yellow',
    workflow_rail: 'community_support',
    route_id: 'radius_99999_100mi_honest_desert',
    status: 'open',
    outcome: 'still_needs_help',
    staff_action_required: true,
    follow_up_due_at: '2026-06-13T19:30:00.000Z',
    created_at: '2026-06-12T19:00:00.000Z',
  },
  {
    event_id: '44444444-4444-4444-8444-444444444444',
    catalyst_type: '',
    siren_level: '',
    workflow_rail: '',
    route_id: 'phase1_record_gate_zip_71457',
    status: 'open',
    outcome: null,
    staff_action_required: false,
    follow_up_due_at: null,
    created_at: '2026-06-12T19:00:00.000Z',
  },
];

function queryFor(rows, calls) {
  return async (table, query, limit, method) => {
    calls.push({ table, query, limit, method: method || 'GET' });
    assert.equal(table, 'catalyst_event');
    assert.equal(method, undefined);
    assert.equal(query, expectedCommandViewSelect);
    assert.equal(limit, 5000);
    return rows;
  };
}

(async () => {
  console.log('TEST: aggregate command view');

  process.env.COMMAND_VIEW_ENABLED = '';
  assert.equal(commandViewEnabled(), false);

  let calls = [];
  let res = makeRes();
  await handleCommandOverview(makeReq(), res, { queryImpl: queryFor(sampleRows, calls), now });
  assert.equal(res.statusCode, 404, 'disabled command view should hide the route');
  assert.deepEqual(res.body, { error: 'Not found' });
  assert.equal(calls.length, 0, 'disabled command view must not read data');

  process.env.COMMAND_VIEW_ENABLED = 'true';
  assert.equal(commandViewEnabled(), true);

  calls = [];
  res = makeRes();
  const originalWarn = console.warn;
  try {
    console.warn = () => {};
    await handleCommandOverview(makeReq(), res, { queryImpl: queryFor(sampleRows, calls), now });
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(res.statusCode, 401, 'missing bearer auth should be rejected');
  assert.equal(calls.length, 0, 'unauthorized command view must not read data');

  calls = [];
  res = makeRes();
  await handleCommandOverview(makeReq(REORDER_CRON_SECRET), res, { queryImpl: queryFor(sampleRows, calls), now });
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 1, 'authorized command view should read catalyst_event once');

  const metrics = res.body.metrics;
  assert.equal(metrics.total_events, 4);
  assert.equal(metrics.open_loops, 3);
  assert.equal(metrics.resolved_loops, 1);
  assert.equal(metrics.needs_action, 1);
  assert.equal(metrics.follow_ups_due_now, 1);
  assert.equal(metrics.reached_support_outcomes, 1);
  assert.equal(metrics.honest_desert_count, 1);
  assert.deepEqual(metrics.by_catalyst_type, { benefits_navigation: 1, medication_change: 2, unknown: 1 });
  assert.deepEqual(metrics.by_siren_level, { amber: 2, unknown: 1, yellow: 1 });
  assert.deepEqual(metrics.by_workflow_rail, { care_transition: 2, community_support: 1, unknown: 1 });
  assert.deepEqual(metrics.by_route_category, {
    honest_desert: 1,
    phase3_proof: 1,
    radius_providers_found: 1,
    record_gate_default: 1,
  });

  const payloadText = JSON.stringify(res.body);
  assert.equal(commandOverviewPayloadIsSafe(res.body, sampleRows), true);
  assert.doesNotMatch(payloadText, /sms_log\.body|["']body["']/i);
  assert.doesNotMatch(payloadText, /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  assert.doesNotMatch(payloadText, /radius_71457_25mi_providers_found/);
  assert.doesNotMatch(payloadText, /phase3_return_proof_71457/);
  assert.doesNotMatch(payloadText, /raw clinical narrative/);
  assert.doesNotMatch(payloadText, /rationale/i);

  assert.equal(commandOverviewPayloadIsSafe({ route: 'radius_71457_25mi_providers_found' }, sampleRows), false);
  assert.equal(commandOverviewPayloadIsSafe({ text: 'raw clinical narrative must never leave the command view' }, sampleRows), false);
  assert.equal(commandOverviewPayloadIsSafe({ body: 'REACHED' }, sampleRows), false);
  assert.equal(commandOverviewPayloadIsSafe({ phone: '318-555-0100' }, sampleRows), false);

  assert.equal(coarseRouteCategory('radius_71457_25mi_providers_found'), 'radius_providers_found');
  assert.equal(coarseRouteCategory('radius_99999_100mi_honest_desert'), 'honest_desert');
  assert.equal(coarseRouteCategory('phase1_record_gate_zip_71457'), 'record_gate_default');
  assert.equal(coarseRouteCategory('phase3_return_proof_71457'), 'phase3_proof');
  assert.equal(coarseRouteCategory(''), 'none');

  assert.doesNotMatch(commandRouteBlock, /\b(POST|PATCH|PUT|DELETE|INSERT|UPDATE|UPSERT)\b|sendSMS|twilio/i);
  assert.match(commandRouteBlock, /handleCommandOverview/);

  console.log('  passed aggregate command view smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
