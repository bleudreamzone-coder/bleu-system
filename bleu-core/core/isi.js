// ISI — Identity Stability Index
// 6 dimensions, locked weights, smoothed updates

const clamp = v => Math.max(0, Math.min(100, v || 0));

function computeISI(observer, returnVelocity, selfRef, roleContinuity, valuesClarity, futureOrientation) {
  const raw = (clamp(observer) * 0.25) +
              (clamp(returnVelocity) * 0.20) +
              (clamp(selfRef) * 0.15) +
              (clamp(roleContinuity) * 0.15) +
              (clamp(valuesClarity) * 0.15) +
              (clamp(futureOrientation) * 0.10);
  return Math.round(raw * 100) / 100;
}

function returnVelocityFromHistory(history) {
  if (!history || history.length < 2) return 50;
  const recent = history.slice(-6);
  let drops = 0, recoveries = 0;
  for (let i = 1; i < recent.length; i++) {
    const delta = recent[i].score - recent[i - 1].score;
    if (delta < -5) drops++;
    if (delta > 5 && i > 1 && recent[i - 1].score < recent[i - 2].score) recoveries++;
  }
  if (drops === 0) return 70;
  return clamp(50 + (recoveries / drops) * 30);
}

function updateISI(passport, newScore) {
  const history = (passport.isi_history || []).slice();
  history.push({ score: newScore, ts: Date.now() });
  while (history.length > 30) history.shift();

  const sessions = history.length;
  const current = passport.isi || 50;

  // Smoothing alpha — minimum 3 sessions before strong shift
  let alpha;
  if (sessions <= 3) alpha = 0.20;
  else if (sessions <= 10) alpha = 0.40;
  else alpha = 0.60;

  const smoothed = Math.round(((alpha * newScore) + ((1 - alpha) * current)) * 100) / 100;

  // Velocity over last 5
  let velocity = 0;
  if (history.length >= 2) {
    const r = history.slice(-5);
    velocity = Math.round(((r[r.length - 1].score - r[0].score) / r.length) * 100) / 100;
  }

  return {
    isi: smoothed,
    isi_history: history,
    isi_velocity: velocity,
    isi_sessions: sessions,
    isi_trend: velocity > 2 ? 'rising' : velocity < -2 ? 'falling' : 'stable'
  };
}

module.exports = { computeISI, updateISI, returnVelocityFromHistory };
