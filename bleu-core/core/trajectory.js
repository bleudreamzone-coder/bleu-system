// Trajectory — STABILIZING | LOOPING | DECLINING | BREAKTHROUGH_WINDOW
// Plus bifurcation detection

function computeTrajectory(ciHistory, volatility, engagement) {
  if (!ciHistory || ciHistory.length < 3) {
    return { label: 'INSUFFICIENT_DATA', confidence: 0, detail: 'Need 3+ sessions', slope: 0, volatility: 0, avg: 0, sessions: ciHistory ? ciHistory.length : 0 };
  }

  const recent = ciHistory.slice(-10);
  const scores = recent.map(h => h.score);
  const n = scores.length;
  const avg = scores.reduce((a, b) => a + b, 0) / n;

  // Linear regression slope
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) { sumX += i; sumY += scores[i]; sumXY += i * scores[i]; sumX2 += i * i; }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Volatility
  if (typeof volatility !== 'number') {
    volatility = Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / n);
  }
  const eng = typeof engagement === 'number' ? engagement : 50;

  let label, confidence, detail;

  if (slope > 1.5 && eng > 60 && avg > 55) {
    label = 'BREAKTHROUGH_WINDOW';
    confidence = Math.min(95, Math.round(50 + slope * 10 + (eng - 50) * 0.3));
    detail = 'CI rising with strong engagement — amplify momentum';
  } else if (slope > 0.5 && volatility < 15) {
    label = 'STABILIZING';
    confidence = Math.min(90, Math.round(40 + slope * 15 + (100 - volatility) * 0.2));
    detail = 'Steady improvement with low volatility — maintain course';
  } else if (slope < -1.0) {
    label = 'DECLINING';
    confidence = Math.min(90, Math.round(50 + Math.abs(slope) * 12));
    detail = 'CI declining — check for external stressors or narrative regression';
  } else if (volatility > 20 && Math.abs(slope) < 1.0) {
    label = 'LOOPING';
    confidence = Math.min(85, Math.round(40 + volatility * 0.8));
    detail = 'High volatility with flat trend — defensive narrative may be active';
  } else {
    label = 'STABILIZING';
    confidence = Math.max(10, Math.round(30 + Math.max(0, slope * 10)));
    detail = 'Gradual movement — consistent engagement will clarify trajectory';
  }

  return {
    label, confidence: Math.max(0, Math.min(100, confidence)), detail,
    slope: Math.round(slope * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    sessions: ciHistory.length
  };
}

// Bifurcation detection — is this person at a tipping point?
// Signals: rising volatility + topic jumps + emotional intensity shift
function detectBifurcation(ciHistory, currentFusion, messageLength) {
  if (!ciHistory || ciHistory.length < 5) return { active: false, probability: 0 };

  const last5 = ciHistory.slice(-5).map(h => h.score);
  const vol = Math.sqrt(last5.reduce((s, v, _, a) => s + Math.pow(v - a.reduce((x, y) => x + y, 0) / a.length, 2), 0) / last5.length);
  const trend = last5[last5.length - 1] - last5[0];

  let prob = 0;
  if (vol > 15) prob += 25;
  if (vol > 25) prob += 15;
  if (currentFusion > 65) prob += 20;
  if (currentFusion > 80) prob += 10;
  if (Math.abs(trend) > 15) prob += 15;
  if (messageLength > 300) prob += 10;

  return {
    active: prob >= 40,
    probability: Math.min(100, prob),
    window_hours: prob >= 40 ? 72 : 0,
    signal: prob >= 60 ? 'HIGH — slow down, no commerce, hold space' :
            prob >= 40 ? 'MODERATE — ask more, recommend less' : 'LOW'
  };
}

module.exports = { computeTrajectory, detectBifurcation };
