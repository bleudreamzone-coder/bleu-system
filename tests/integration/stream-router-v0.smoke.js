const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  STREAM_ROUTER_V0_ENDPOINT,
  FALLBACK_MATRIX,
  streamRouterV0Enabled,
  buildOutcomeDecisionRecord,
  handleStreamRouterV0Endpoint,
  routePacketIsComplete,
} = require('../../core/stream-router-v0/router');
const { STREAM_ROUTER_V0_CORPUS } = require('../../core/stream-router-v0/eval-corpus');
const { evaluateCorpus } = require('../../core/stream-router-v0/scorecard');

function makeRes() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    setHeader(k, v) { this.headers[k] = v; },
    end(chunk) { this.body += chunk || ''; },
  };
}

(async () => {
  console.log('TEST: stream router v0');

  assert.equal(STREAM_ROUTER_V0_ENDPOINT, '/api/chat/stream-router-v0');
  assert.equal(streamRouterV0Enabled({}), false, 'flag defaults off');
  assert.equal(streamRouterV0Enabled({ STREAM_ROUTER_V0_ENABLED: 'false' }), false, 'false is off');
  assert.equal(streamRouterV0Enabled({ STREAM_ROUTER_V0_ENABLED: 'true' }), true, 'literal true enables');

  const flagOffRes = makeRes();
  await handleStreamRouterV0Endpoint({}, flagOffRes, {
    env: {},
    body: { message: 'I was discharged and they changed my medicine.' },
  });
  assert.equal(flagOffRes.statusCode, 404, 'test-only endpoint is unavailable with flag off');

  const flagOnRes = makeRes();
  await handleStreamRouterV0Endpoint({}, flagOnRes, {
    env: { STREAM_ROUTER_V0_ENABLED: 'true' },
    body: { message: 'I was just discharged and they changed my blood pressure medicine. I do not understand the new dose.' },
  });
  assert.equal(flagOnRes.statusCode, 200, 'flag on test harness returns an ODR');
  const payload = JSON.parse(flagOnRes.body);
  assert.equal(payload.endpoint, STREAM_ROUTER_V0_ENDPOINT);
  assert.equal(payload.outcome_decision_record.route.rail, 'care_transition');
  assert.equal(payload.outcome_decision_record.route.primary_surface, 'pharmacist_first_handoff');
  assert.equal(payload.outcome_decision_record.return.live_write_allowed, false);
  assert.equal(payload.outcome_decision_record.signal.raw_text_stored, false);
  assert.ok(routePacketIsComplete(payload.outcome_decision_record));

  assert.equal(STREAM_ROUTER_V0_CORPUS.length, 60, 'eval corpus must contain 60 cases');
  const result = evaluateCorpus(STREAM_ROUTER_V0_CORPUS);
  assert.equal(result.pass, true, 'scorecard must pass thresholds');
  assert.equal(result.scorecard.hard_fails.crisis_false_negatives, 0, 'crisis false-negatives must be zero');
  assert.equal(result.scorecard.hard_fails.fabrication, 0, 'fabrication hard-fails must be zero');
  assert.equal(result.scorecard.metrics.route_packet_completeness_pct, 100);
  assert.ok(result.scorecard.metrics.free_lane_accuracy_pct >= 95);
  assert.ok(result.scorecard.metrics.evidence_card_accuracy_pct >= 90);
  assert.equal(result.scorecard.failed_cases, 0, 'all expected eval checks must pass');

  const crisisCases = STREAM_ROUTER_V0_CORPUS.filter((c) => c.expect.crisis);
  const serializedScorecard = JSON.stringify(result);
  for (const testCase of crisisCases) {
    assert.equal(
      serializedScorecard.includes(testCase.text),
      false,
      `eval output must not store raw crisis text for ${testCase.id}`,
    );
    const record = buildOutcomeDecisionRecord({ message: testCase.text });
    const serializedRecord = JSON.stringify(record);
    assert.equal(serializedRecord.includes(testCase.text), false, `ODR must not store raw crisis text for ${testCase.id}`);
    assert.equal(record.safety.risk, 'red');
    assert.equal(record.route.primary_surface, 'crisis_takeover');
    assert.equal(record.commerce_verdict.allowed, false);
  }

  for (const [surface, fallback] of Object.entries(FALLBACK_MATRIX)) {
    assert.ok(fallback.fallback_line, `${surface} must have a fallback line`);
    assert.doesNotMatch(fallback.fallback_line, /Alva got quiet/i, `${surface} fallback must not go quiet`);
  }

  const serverSrc = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');
  assert.equal(serverSrc.includes('/api/chat/stream-router-v0'), false, 'server.js must not wire the test endpoint into live traffic');
  assert.equal(serverSrc.includes('STREAM_ROUTER_V0_ENABLED'), false, 'server.js must not read the stream-router flag');

  console.log('  scorecard:', JSON.stringify(result.scorecard));
  console.log('  passed stream router v0 smoke tests');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
