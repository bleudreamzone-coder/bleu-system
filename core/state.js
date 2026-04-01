// State — computes UserState from message + passport
// This is the single object that drives every ALVAI decision

const { computeCI, detectFusion, scoreI } = require('./ci');
const { computeISI } = require('./isi');
const { computeTrajectory } = require('./trajectory');

function computeState(message, passport) {
  const m = (message || '').toLowerCase();
  const p = passport || {};

  // Intent detection
  const intents = [];
  if (/sleep|insomnia|can't sleep|tired|exhausted|restless|wake up/i.test(m)) intents.push('sleep');
  if (/anxious|anxiety|panic|stress|overwhelm|worry|racing/i.test(m)) intents.push('stress');
  if (/energy|fatigue|motivation|drained|exhausted|lethargic/i.test(m)) intents.push('energy');
  if (/focus|concentrate|scattered|adhd|distracted|brain fog/i.test(m)) intents.push('focus');
  if (/pain|hurt|chronic|inflammation|ache|sore|injury/i.test(m)) intents.push('pain');
  if (/sad|depressed|empty|numb|hopeless|crying|grief/i.test(m)) intents.push('mood');
  if (/recovery|sober|relapse|drinking|addiction|drugs/i.test(m)) intents.push('recovery');
  if (/supplement|magnesium|vitamin|omega|ashwagandha|protocol/i.test(m)) intents.push('supplement');
  if (/therapist|doctor|counselor|provider|find.*help/i.test(m)) intents.push('practitioner');
  if (/money|finances|debt|afford|insurance|cost/i.test(m)) intents.push('finance');
  if (/cannabis|cbd|thc|strain|terpene|dispensary/i.test(m)) intents.push('cannabis');

  // Primary intent — first match wins
  const intent = intents[0] || 'general';

  // Moment type — what kind of interaction is this
  const crisisWords = /suicide|kill myself|end it|self.harm|crisis|emergency|overdose|dying|want to die/i;
  const isCrisis = crisisWords.test(m);
  const isVenting = m.length > 200 && intents.length <= 1;
  const isAsking = /\?|how do|what should|can you|tell me|help me|where/i.test(m);
  const isBuilding = /protocol|plan|stack|routine|schedule|build me/i.test(m);
  const moment = isCrisis ? 'crisis' : isVenting ? 'venting' : isBuilding ? 'building' : isAsking ? 'asking' : 'sharing';

  // User type from passport
  const sessions = p.isi_sessions || p.conversations_count || 0;
  const user_type = sessions === 0 ? 'new' : sessions < 5 ? 'returning' : sessions < 20 ? 'regular' : 'deep';

  // Dimension scores from message
  const sleep = /sleep|insomnia|tired|exhausted|rest/i.test(m) ? 30 : 70;
  const stress = /anxious|stress|panic|overwhelm|worry/i.test(m) ? 30 : 65;
  const energy = /fatigue|drained|exhausted|no energy|lethargic/i.test(m) ? 25 : 65;
  const focus = /scatter|distract|can't concentrate|brain fog|adhd/i.test(m) ? 30 : 65;
  const pain = /pain|hurt|chronic|inflammation|ache/i.test(m) ? 25 : 70;

  // Fusion and identity coherence
  const fusion = detectFusion(message);
  const iScore = scoreI(message);

  // CI from current message signals
  const pScore = ((sleep + energy) / 2);
  const bScore = 50; // behavioral needs session history — default
  const nScore = isAsking || isBuilding ? 70 : moment === 'venting' ? 35 : 50;
  const ci = computeCI(pScore, bScore, iScore, nScore);

  // ISI from passport history or estimate from current message
  const isi = p.isi || computeISI(
    100 - fusion,           // observer = inverse of fusion
    user_type === 'new' ? 50 : 60,  // returnVelocity
    50,                     // selfRef default
    50,                     // roleContinuity default
    nScore > 50 ? 60 : 40, // valuesClarity
    isBuilding ? 70 : isAsking ? 60 : 40  // futureOrientation
  );

  // Trajectory from passport CI history
  const trajectory = computeTrajectory(
    p.ci_history || [],
    p.ci_volatility,
    p.engagement || (sessions > 0 ? Math.min(100, sessions * 8) : 0)
  );

  // Confidence tier — how much should ALVAI assert vs ask
  let confidence_tier;
  if (isCrisis) confidence_tier = 'hold'; // hold space, no assertions
  else if (fusion > 70) confidence_tier = 'gentle'; // high fragility, ask more
  else if (user_type === 'new') confidence_tier = 'warm'; // build trust
  else if (trajectory.label === 'BREAKTHROUGH_WINDOW') confidence_tier = 'direct'; // they're ready
  else if (moment === 'building') confidence_tier = 'direct';
  else confidence_tier = 'balanced';

  return {
    sleep,
    stress,
    energy,
    focus,
    pain,
    intent,
    intents,
    moment,
    trajectory: trajectory.label,
    trajectory_detail: trajectory.detail,
    user_type,
    fusion,
    ci,
    isi,
    confidence_tier,
    is_crisis: isCrisis
  };
}

module.exports = { computeState };
