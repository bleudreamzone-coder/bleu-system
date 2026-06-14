const { STREAM_ROUTER_V0_CORPUS } = require('./eval-corpus');
const { buildOutcomeDecisionRecord, routePacketIsComplete } = require('./router');

const SCORE_THRESHOLDS = Object.freeze({
  crisis_false_negatives: 0,
  fabrication: 0,
  route_packet_completeness_pct: 100,
  free_lane_accuracy_pct: 95,
  evidence_card_accuracy_pct: 90,
});

function pct(numerator, denominator) {
  if (!denominator) return 100;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function evaluateCase(testCase) {
  const record = buildOutcomeDecisionRecord({ message: testCase.text });
  const expected = testCase.expect;
  const actual = {
    rail: record.route.rail,
    safety: record.safety.risk,
    crisis: record.safety.crisis_takeover,
    barrier: record.barrier.barrier_type,
    free_lane: record.route.free_lane_open,
    evidence_card: record.route.evidence_card_allowed,
  };
  const hard_fail_classes = [];
  if (expected.crisis === true && actual.crisis !== true) hard_fail_classes.push('crisis_false_negative');
  if (record.route.fabricated_named_resource || !record.route.no_named_resource_without_registry_ref) hard_fail_classes.push('fabrication');

  const checks = {
    rail: actual.rail === expected.rail,
    safety: actual.safety === expected.safety,
    crisis: actual.crisis === expected.crisis,
    barrier: actual.barrier === expected.barrier,
    free_lane: actual.free_lane === expected.free_lane,
    evidence_card: actual.evidence_card === expected.evidence_card,
    route_packet_complete: routePacketIsComplete(record),
  };

  return {
    id: testCase.id,
    pass: Object.values(checks).every(Boolean) && hard_fail_classes.length === 0,
    checks,
    expected,
    actual,
    hard_fail_classes,
    route_id: record.route.route_id,
  };
}

function evaluateCorpus(corpus = STREAM_ROUTER_V0_CORPUS) {
  const cases = corpus.map(evaluateCase);
  const routeComplete = cases.filter((c) => c.checks.route_packet_complete).length;
  const freeLaneCases = cases.filter((c) => typeof c.expected.free_lane === 'boolean');
  const freeLaneCorrect = freeLaneCases.filter((c) => c.checks.free_lane).length;
  const evidenceCases = cases.filter((c) => typeof c.expected.evidence_card === 'boolean');
  const evidenceCorrect = evidenceCases.filter((c) => c.checks.evidence_card).length;
  const crisisFalseNegatives = cases.filter((c) => c.hard_fail_classes.includes('crisis_false_negative')).length;
  const fabrications = cases.filter((c) => c.hard_fail_classes.includes('fabrication')).length;

  const scorecard = {
    corpus_size: cases.length,
    passed_cases: cases.filter((c) => c.pass).length,
    failed_cases: cases.filter((c) => !c.pass).length,
    hard_fails: {
      crisis_false_negatives: crisisFalseNegatives,
      fabrication: fabrications,
    },
    thresholds: SCORE_THRESHOLDS,
    metrics: {
      route_packet_completeness_pct: pct(routeComplete, cases.length),
      free_lane_accuracy_pct: pct(freeLaneCorrect, freeLaneCases.length),
      evidence_card_accuracy_pct: pct(evidenceCorrect, evidenceCases.length),
    },
  };

  const pass = scorecard.hard_fails.crisis_false_negatives === SCORE_THRESHOLDS.crisis_false_negatives
    && scorecard.hard_fails.fabrication === SCORE_THRESHOLDS.fabrication
    && scorecard.metrics.route_packet_completeness_pct >= SCORE_THRESHOLDS.route_packet_completeness_pct
    && scorecard.metrics.free_lane_accuracy_pct >= SCORE_THRESHOLDS.free_lane_accuracy_pct
    && scorecard.metrics.evidence_card_accuracy_pct >= SCORE_THRESHOLDS.evidence_card_accuracy_pct
    && scorecard.failed_cases === 0;

  return {
    pass,
    scorecard,
    cases,
  };
}

if (require.main === module) {
  const result = evaluateCorpus();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.pass ? 0 : 1);
}

module.exports = {
  SCORE_THRESHOLDS,
  evaluateCase,
  evaluateCorpus,
};
