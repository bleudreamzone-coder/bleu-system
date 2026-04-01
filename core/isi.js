// ISI — Identity Stability Index
// Measures how stable a person's sense of self is across sessions
// Locked formula with 6 dimensions

// observer: 0-100 — ability to observe own thoughts without fusing
// returnVelocity: 0-100 — how fast they recover from destabilizing events
// selfRef: 0-100 — consistency of self-referencing language across sessions
// roleContinuity: 0-100 — stability of social roles (parent, worker, friend)
// valuesClarity: 0-100 — how clear and consistent their stated values are
// futureOrientation: 0-100 — ability to project self into future states

function computeISI(observer, returnVelocity, selfRef, roleContinuity, valuesClarity, futureOrientation) {
  // Locked weights — do not change without clinical review
  const w = {
    observer: 0.25,
    returnVelocity: 0.20,
    selfRef: 0.15,
    roleContinuity: 0.15,
    valuesClarity: 0.15,
    futureOrientation: 0.10
  };

  const clamp = v => Math.max(0, Math.min(100, v || 0));

  const raw = (clamp(observer) * w.observer) +
              (clamp(returnVelocity) * w.returnVelocity) +
              (clamp(selfRef) * w.selfRef) +
              (clamp(roleContinuity) * w.roleContinuity) +
              (clamp(valuesClarity) * w.valuesClarity) +
              (clamp(futureOrientation) * w.futureOrientation);

  return Math.round(raw * 100) / 100;
}

// Update ISI with smoothing — minimum 3 sessions before strong shift
// Prevents a single bad message from crashing the score
function updateISI(passport, newScore) {
  const history = passport.isi_history || [];
  history.push({ score: newScore, ts: Date.now() });

  // Keep last 30 sessions
  while (history.length > 30) history.shift();

  const sessionCount = history.length;

  // Smoothing: weighted moving average
  // First 3 sessions: heavy smoothing (new data = 20% weight)
  // Sessions 4-10: moderate smoothing (new data = 40% weight)
  // Sessions 10+: light smoothing (new data = 60% weight)
  const currentISI = passport.isi || 50;
  let alpha;
  if (sessionCount <= 3) alpha = 0.20;
  else if (sessionCount <= 10) alpha = 0.40;
  else alpha = 0.60;

  const smoothed = (alpha * newScore) + ((1 - alpha) * currentISI);
  const final = Math.round(smoothed * 100) / 100;

  // Compute velocity — rate of change over last 5 sessions
  let velocity = 0;
  if (history.length >= 2) {
    const recent = history.slice(-5);
    const first = recent[0].score;
    const last = recent[recent.length - 1].score;
    velocity = Math.round(((last - first) / recent.length) * 100) / 100;
  }

  return {
    isi: final,
    isi_history: history,
    isi_velocity: velocity,
    isi_sessions: sessionCount,
    isi_trend: velocity > 2 ? 'rising' : velocity < -2 ? 'falling' : 'stable'
  };
}

module.exports = { computeISI, updateISI };
