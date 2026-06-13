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
const expectedV1Select = grabConst('COMMAND_VIEW_EVENT_SELECT').match(/'([^']+)'/)[1];
const expectedV2Select = grabConst('COMMAND_VIEW_V2_EVENT_SELECT').match(/'([^']+)'/)[1];
const expectedOriginDefaultSelect = grabConst('COMMAND_VIEW_ORIGIN_DEFAULT_SELECT').match(/'([^']+)'/)[1];
const REORDER_CRON_SECRET = 'command-v2-smoke-secret';

eval([
  grabFunction('commandViewEnabled'),
  grabFunction('commandViewV2Enabled'),
  grabConst('COMMAND_VIEW_EVENT_SELECT'),
  grabConst('COMMAND_VIEW_V2_EVENT_SELECT'),
  grabConst('COMMAND_VIEW_ORIGIN_DEFAULT_SELECT'),
  grabConst('COMMAND_VIEW_NON_ORGANIC_ORIGINS'),
  grabConst('COMMAND_VIEW_SMALL_COHORT_THRESHOLD'),
  grabFunction('normalizedMetricKey'),
  grabFunction('incrementMetric'),
  grabFunction('coarseRouteCategory'),
  grabFunction('sortedMetricObject'),
  grabFunction('eventOriginKey'),
  grabFunction('consentStatusKey'),
  grabFunction('isOrganicCommandEvent'),
  grabFunction('originValues'),
  grabFunction('countByField'),
  grabFunction('suppressedAggregate'),
  grabFunction('medianClosureMinutes'),
  grabFunction('buildCommandOverview'),
  grabFunction('buildCommandOverviewV2'),
  grabFunction('commandOverviewPayloadIsSafe'),
  grabFunction('fetchCommandOverview'),
  grabFunction('readCommandEventOriginDefault'),
  grabFunction('fetchCommandOverviewV2'),
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

const now = new Date('2026-06-13T16:00:00.000Z');
const rowsWithBarriers = [
  {
    event_id: '11111111-1111-4111-8111-111111111111',
    catalyst_type: 'medication_change',
    siren_level: 'amber',
    workflow_rail: 'care_transition',
    route_id: 'radius_71457_25mi_providers_found',
    status: 'open',
    outcome: null,
    staff_action_required: false,
    follow_up_due_at: '2026-06-13T15:30:00.000Z',
    created_at: '2026-06-13T14:00:00.000Z',
    resolved_at: null,
    event_origin: 'organic',
    consent_status: 'granted',
    barrier_type: 'confusion',
    barrier_confidence: 0.84,
    user_confirmed: true,
    barrier_resolved_status: 'open',
    aggregate_allowed: false,
    rationale: 'raw clinical narrative must never leave command view v2',
    phone: '318-555-0100',
    subject_id: 'subject-command-v2-secret',
  },
  {
    event_id: '22222222-2222-4222-8222-222222222222',
    catalyst_type: 'medication_change',
    siren_level: 'amber',
    workflow_rail: 'care_transition',
    route_id: 'phase1_record_gate_zip_71457',
    status: 'resolved',
    outcome: 'reached_support',
    staff_action_required: false,
    follow_up_due_at: '2026-06-13T15:30:00.000Z',
    created_at: '2026-06-13T14:00:00.000Z',
    resolved_at: '2026-06-13T14:45:00.000Z',
    event_origin: 'organic',
    consent_status: 'granted',
    barrier_type: 'confusion',
    barrier_resolved_status: 'resolved',
    aggregate_allowed: false,
  },
  {
    event_id: '33333333-3333-4333-8333-333333333333',
    catalyst_type: 'serious_illness',
    siren_level: 'amber',
    workflow_rail: 'serious_illness_support',
    route_id: 'serious_illness_staff_action_required',
    status: 'open',
    outcome: 'still_needs_help',
    staff_action_required: true,
    follow_up_due_at: '2026-06-13T15:00:00.000Z',
    created_at: '2026-06-13T13:00:00.000Z',
    resolved_at: null,
    event_origin: 'organic',
    consent_status: 'unknown',
    barrier_type: 'fear',
    barrier_resolved_status: 'still_blocked',
    aggregate_allowed: true,
  },
  {
    event_id: '44444444-4444-4444-8444-444444444444',
    catalyst_type: 'crisis_signal',
    siren_level: 'red',
    workflow_rail: 'crisis_response',
    route_id: 'crisis_banner_api_chat',
    status: 'open',
    outcome: null,
    staff_action_required: true,
    follow_up_due_at: null,
    created_at: '2026-06-13T13:30:00.000Z',
    resolved_at: null,
    event_origin: 'organic',
    consent_status: 'unknown',
    aggregate_allowed: false,
  },
  {
    event_id: '55555555-5555-4555-8555-555555555555',
    catalyst_type: 'benefits_navigation',
    siren_level: 'yellow',
    workflow_rail: 'community_support',
    route_id: 'radius_99999_100mi_honest_desert',
    status: 'resolved',
    outcome: 'reached_support',
    staff_action_required: false,
    follow_up_due_at: null,
    created_at: '2026-06-13T12:00:00.000Z',
    resolved_at: '2026-06-13T13:00:00.000Z',
    event_origin: 'organic',
    consent_status: 'granted',
    aggregate_allowed: true,
  },
  {
    event_id: '66666666-6666-4666-8666-666666666666',
    catalyst_type: 'medication_change',
    siren_level: 'amber',
    workflow_rail: 'care_transition',
    route_id: 'radius_test_25mi_providers_found',
    status: 'open',
    outcome: null,
    staff_action_required: true,
    follow_up_due_at: '2026-06-13T15:30:00.000Z',
    created_at: '2026-06-13T14:00:00.000Z',
    resolved_at: null,
    event_origin: 'test',
    consent_status: 'unknown',
    barrier_type: 'transportation',
    aggregate_allowed: true,
  },
  {
    event_id: '77777777-7777-4777-8777-777777777777',
    catalyst_type: 'medication_change',
    siren_level: 'amber',
    workflow_rail: 'care_transition',
    route_id: 'phase3_return_proof_71457',
    status: 'resolved',
    outcome: 'reached_support',
    staff_action_required: false,
    follow_up_due_at: null,
    created_at: '2026-06-13T12:00:00.000Z',
    resolved_at: '2026-06-13T12:30:00.000Z',
    event_origin: 'seeded',
    consent_status: 'granted',
    aggregate_allowed: true,
  },
  {
    event_id: '88888888-8888-4888-8888-888888888888',
    catalyst_type: 'transportation',
    siren_level: 'green',
    workflow_rail: 'community_support',
    route_id: 'demo_route',
    status: 'open',
    outcome: null,
    staff_action_required: false,
    follow_up_due_at: null,
    created_at: '2026-06-13T12:00:00.000Z',
    resolved_at: null,
    event_origin: 'demo',
    consent_status: 'granted',
    aggregate_allowed: true,
  },
];

function queryForV2(rows, calls, opts = {}) {
  return async (table, query, limit, method) => {
    calls.push({ table, query, limit, method: method || 'GET' });
    assert.equal(method, undefined);
    if (table === 'catalyst_event') {
      assert.equal(limit, 5000);
      if (query === expectedV2Select) {
        if (opts.missingBarrierColumns) return null;
        return rows;
      }
      if (query === expectedV1Select) return rows.map((row) => {
        const {
          barrier_type,
          barrier_confidence,
          user_confirmed,
          barrier_resolved_status,
          aggregate_allowed,
          ...withoutBarriers
        } = row;
        return withoutBarriers;
      });
    }
    if (table === 'information_schema.columns') {
      assert.equal(query, expectedOriginDefaultSelect);
      return [{ column_default: "'organic'::text" }];
    }
    throw new Error(`unexpected query ${table} ${query}`);
  };
}

(async () => {
  console.log('TEST: command view v2');

  process.env.COMMAND_VIEW_ENABLED = 'true';
  process.env.COMMAND_VIEW_V2_ENABLED = '';
  assert.equal(commandViewV2Enabled(), false);
  let calls = [];
  let res = makeRes();
  await handleCommandOverview(makeReq(REORDER_CRON_SECRET), res, { queryImpl: queryForV2(rowsWithBarriers, calls), now });
  assert.equal(res.statusCode, 200);
  assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'version'), false, 'flag-off command view remains v1');
  assert.equal(calls[0].query, expectedV1Select);

  process.env.COMMAND_VIEW_V2_ENABLED = 'true';
  assert.equal(commandViewV2Enabled(), true);
  calls = [];
  res = makeRes();
  await handleCommandOverview(makeReq(REORDER_CRON_SECRET), res, { queryImpl: queryForV2(rowsWithBarriers, calls), now });
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].table, 'catalyst_event');
  assert.equal(calls[0].query, expectedV2Select);
  assert.equal(calls[1].table, 'information_schema.columns');
  assert.equal(res.body.version, 'v2');
  assert.equal(res.body.source.barrier_columns_available, true);
  assert.deepEqual(res.body.source.event_origin_values, ['demo', 'organic', 'seeded', 'test']);
  assert.equal(res.body.source.event_origin_default, "'organic'::text");
  assert.deepEqual(res.body.source.excluded_origins, ['test', 'seed', 'seeded', 'demo']);
  assert.match(res.body.source.primary_scope, /event_origin=organic/);

  const metrics = res.body.metrics;
  assert.equal(metrics.total_organic_events, 5, 'test/seeded/demo rows must not count as organic');
  assert.equal(metrics.open_loops, 3);
  assert.equal(metrics.resolved_loops, 2);
  assert.equal(metrics.reopened_loops, 1);
  assert.equal(metrics.follow_ups_due_now, 2);
  assert.equal(metrics.staff_action_required, 2);
  assert.equal(metrics.amber_safety_count, 3);
  assert.equal(metrics.red_safety_count, 1);
  assert.equal(metrics.serious_illness_count, 1);
  assert.equal(metrics.med_change_count, 2);
  assert.equal(metrics.consented_closed_loops, 2);
  assert.equal(metrics.consented_open_loops, 1);
  assert.equal(metrics.median_time_to_closure_minutes, 'insufficient_data');
  assert.equal(res.body.next_step_completion_rate.state, 'denominator_forming');
  assert.equal(res.body.next_step_completion_rate.numerator, 2);
  assert.equal(res.body.next_step_completion_rate.denominator, 3);
  assert.equal(res.body.next_step_completion_rate.value, null);

  assert.equal(res.body.sections.citizen_outcomes.consented_closed_loops, 2);
  assert.equal(res.body.sections.care_desk_queue.navigator_queue_link, '/api/navigator/queue');
  assert.equal(res.body.sections.worksite_barriers.aggregate.status, 'suppressed');
  assert.equal(res.body.sections.worksite_barriers.aggregate.label, 'suppressed for privacy');
  assert.deepEqual(res.body.sections.worksite_barriers.counts, {});
  assert.equal(res.body.sections.worksite_barriers.aggregate_allowed_rows, 2);
  assert.equal(res.body.sections.worksite_barriers.aggregate_blocked_rows, 2);
  assert.equal(res.body.sections.city_barriers.place_placeholder, 'suppressed for privacy');
  assert.equal(res.body.sections.proof_export_readiness.status, 'denominator_forming');
  assert.equal(res.body.sections.proof_export_readiness.buyer_packets.city.status, 'suppressed');
  assert.equal(res.body.privacy.no_individual_rows, true);
  assert.equal(res.body.privacy.aggregate_allowed_respected, true);

  const payloadText = JSON.stringify(res.body);
  assert.equal(commandOverviewPayloadIsSafe(res.body, rowsWithBarriers), true);
  assert.doesNotMatch(payloadText, /sms_log\.body|["']body["']/i);
  assert.doesNotMatch(payloadText, /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  assert.doesNotMatch(payloadText, /raw clinical narrative/i);
  assert.doesNotMatch(payloadText, /subject-command-v2-secret|subject_id/i);
  assert.doesNotMatch(payloadText, /radius_71457_25mi_providers_found|phase3_return_proof_71457|crisis_banner_api_chat/i);

  calls = [];
  res = makeRes();
  await handleCommandOverview(makeReq(REORDER_CRON_SECRET), res, {
    queryImpl: queryForV2(rowsWithBarriers, calls, { missingBarrierColumns: true }),
    now,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].query, expectedV2Select);
  assert.equal(calls[1].query, expectedV1Select);
  assert.equal(res.body.source.barrier_columns_available, false);
  assert.equal(res.body.sections.worksite_barriers.aggregate.status, 'unavailable');
  assert.equal(res.body.sections.worksite_barriers.aggregate.label, 'barrier columns not present yet');
  assert.deepEqual(res.body.sections.worksite_barriers.counts, {});

  assert.doesNotMatch(commandRouteBlock, /\b(POST|PATCH|PUT|DELETE|INSERT|UPDATE|UPSERT)\b|sendSMS|twilio/i);
  assert.match(commandRouteBlock, /handleCommandOverview/);

  process.env.COMMAND_VIEW_V2_ENABLED = '';
  console.log('  passed command view v2 smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
