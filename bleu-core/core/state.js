// State — computes UserState from message + passport
// Runs before every ALVAI call. One object drives everything.

const { computeCIFromMessage, detectFusion } = require('./ci');
const { computeISI } = require('./isi');
const { computeTrajectory, detectBifurcation } = require('./trajectory');

function computeState(message, passport) {
  const m = (message || '').toLowerCase();
  const p = passport || {};

  // Intents
  const intentMap = {
    sleep: /sleep|insomnia|can't sleep|tired|exhausted|restless|wake up/i,
    stress: /anxious|anxiety|panic|stress|overwhelm|worry|racing/i,
    energy: /energy|fatigue|motivation|drained|lethargic/i,
    focus: /focus|concentrate|scattered|adhd|distracted|brain fog/i,
    pain: /pain|hurt|chronic|inflammation|ache|sore|injury/i,
    mood: /sad|depressed|empty|numb|hopeless|crying|grief/i,
    recovery: /recovery|sober|relapse|drinking|addiction|drugs/i,
    supplement: /supplement|magnesium|vitamin|omega|ashwagandha|protocol|stack/i,
    practitioner: /therapist|doctor|counselor|provider|find.*help|near me/i,
    finance: /money|finances|debt|afford|insurance|cost|bills/i,
    cannabis: /cannabis|cbd|thc|strain|terpene|dispensary/i
  };

  const intents = [];
  for (const [k, re] of Object.entries(intentMap)) { if (re.test(m)) intents.push(k); }
  const intent = intents[0] || 'general';

  // Moment
  const isCrisis = /suicide|kill myself|end it|self.harm|crisis|emergency|overdose|dying|want to die/i.test(m);
  const moment = isCrisis ? 'crisis' :
    m.length > 200 && intents.length <= 1 ? 'venting' :
    /protocol|plan|stack|routine|build me/i.test(m) ? 'building' :
    /\?|how do|what should|can you|tell me|help me/i.test(m) ? 'asking' : 'sharing';

  // User type
  const sessions = p.isi_sessions || p.conversations_count || 0;
  const user_type = sessions === 0 ? 'new' : sessions < 5 ? 'returning' : sessions < 20 ? 'regular' : 'deep';

  // Dimension scores
  const sleep = /sleep|insomnia|tired|exhausted/i.test(m) ? 30 : 70;
  const stress = /anxious|stress|panic|overwhelm/i.test(m) ? 30 : 65;
  const energy = /fatigue|drained|exhausted|no energy/i.test(m) ? 25 : 65;
  const focus = /scatter|distract|can't concentrate|brain fog/i.test(m) ? 30 : 65;
  const pain = /pain|hurt|chronic|inflammation/i.test(m) ? 25 : 70;

  // CI
  const ciResult = computeCIFromMessage(message, p);
  const fusion = ciResult.fusion;
  const ci = ciResult.ci;

  // ISI
  const isi = p.isi || computeISI(100 - fusion, user_type === 'new' ? 50 : 60, 50, 50, ciResult.n > 50 ? 60 : 40, moment === 'building' ? 70 : 40);

  // Trajectory
  const trajectory = computeTrajectory(p.ci_history || [], p.ci_volatility, p.engagement || (sessions > 0 ? Math.min(100, sessions * 8) : 0));

  // Bifurcation
  const bifurcation = detectBifurcation(p.ci_history || [], fusion, (message || '').length);

  // Confidence tier
  let confidence_tier;
  if (isCrisis) confidence_tier = 'hold';
  else if (bifurcation.active) confidence_tier = 'gentle';
  else if (fusion > 70) confidence_tier = 'gentle';
  else if (user_type === 'new') confidence_tier = 'warm';
  else if (trajectory.label === 'BREAKTHROUGH_WINDOW') confidence_tier = 'direct';
  else if (moment === 'building') confidence_tier = 'direct';
  else confidence_tier = 'balanced';

  return {
    sleep, stress, energy, focus, pain,
    intent, intents, moment,
    trajectory: trajectory.label,
    trajectory_detail: trajectory.detail,
    trajectory_confidence: trajectory.confidence,
    user_type, fusion, ci, isi,
    confidence_tier, is_crisis: isCrisis,
    bifurcation_active: bifurcation.active,
    bifurcation_probability: bifurcation.probability,
    ci_breakdown: { p: ciResult.p, b: ciResult.b, i: ciResult.i, n: ciResult.n }
  };
}

module.exports = { computeState };
