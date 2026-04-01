// Trajectory — where is this person heading?
// Computed from CI history, volatility, and engagement patterns

// ciHistory: array of {score, ts} objects (last 30 sessions)
// volatility: standard deviation of recent CI scores
// engagement: 0-100 based on session frequency and depth

function computeTrajectory(ciHistory, volatility, engagement) {
  if (!ciHistory || ciHistory.length < 3) {
    return { label: 'INSUFFICIENT_DATA', confidence: 0, detail: 'Need 3+ sessions' };
  }

  const recent = ciHistory.slice(-10);
  const scores = recent.map(h => h.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Compute trend — linear regression slope over recent sessions
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = scores.length;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Compute actual volatility if not provided
  if (typeof volatility !== 'number') {
    const mean = avg;
    volatility = Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n);
  }

  const eng = typeof engagement === 'number' ? engagement : 50;

  // Decision matrix
  // STABILIZING: positive slope, low volatility, decent engagement
  // LOOPING: flat slope, high volatility, repeated patterns
  // DECLINING: negative slope, any volatility
  // BREAKTHROUGH_WINDOW: positive slope, rising engagement, moderate-high CI

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
    confidence = Math.round(30 + Math.max(0, slope * 10));
    detail = 'Gradual movement — consistent engagement will clarify trajectory';
  }

  return {
    label,
    confidence: Math.max(0, Math.min(100, confidence)),
    detail,
    slope: Math.round(slope * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    sessions: ciHistory.length
  };
}

module.exports = { computeTrajectory };
