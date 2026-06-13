// core/safety/canonical_crisis_patterns.js
//
// STATUS: PROPOSED — Dr. Felicia Stoler clinical authority required before
// either call site uses this. Tier 2/3 per _meta/doctrine/decision_matrix.md
// (crisis routing modifications). NOT wired into production yet:
// detectCrisis() and scoreStability() keep their current implementations
// until this is approved. See _meta/doctrine/crisis_word_list_audit.md.
//
// Purpose: a single canonical crisis-phrase matcher merging the gaps between
// detectCrisis() (the 988 banner trigger) and the scoreStability suicidality
// regex (the commerce gate). Mission 4.2 closed the commerce gate for
// "I cannot keep living like this"; the 988 banner still misses it. This
// proposal would make both call sites share one source of truth so the
// banner and the gate can never diverge again.

// Case-insensitive. Returns true on active suicidal / self-harm / overdose /
// violence-to-others ideation. Tuned to AVOID known false positives:
//   "I hate myself" (shame, not ideation) and
//   "I cannot keep doing this job" (work fatigue) → both return false.
const PATTERNS = [
  // active suicidal statements
  /\bkill (myself|me)\b/,
  /\bkilling myself\b/,
  /\bwant to die\b/,
  /\bwanna die\b/,
  /\bi(?:'m|m| am)?\s*(?:going to|gonna)\s+die\b/,
  /\bwant to be dead\b/,
  /\bend (my life|it all)\b/,
  /\bending (my life|it all|it)\b/,
  /\bthinking (about|of) ending it\b/,
  /\bsuicid(e|al)\b/,
  /\bno reason to live\b/,
  /\bnot worth living\b/,
  /\bcan'?t go on\b|\bcannot go on\b/,
  /\b(point|reason) (of|in|to) (going on|living|carrying on)\b/,
  /\bwhat'?s the point of (going on|living)\b/,
  /\bbetter off (dead|without me)\b/,
  /\b(do not|don'?t) want to (be here|live)\b/,
  /\bcannot keep living\b|\bcan'?t keep living\b/,
  /\bcannot keep going\b|\bcan'?t keep going\b/,
  /\bcannot do this anymore\b|\bcan'?t do this anymore\b/,
  /\btired of (living|being alive|life)\b/,
  // self-harm
  /\b(hurt|hurting|cut|cutting|burn) myself\b/,
  /\bself[- ]?(harm|injury)\b/,
  // overdose
  /\boverdose\b|\bod on\b|\btake (all|too many) [a-z ]*pills\b|\bwhole bottle of\b/,
  // violence to others
  /\b(want|going) to (hurt|kill) (someone|them)\b/,
  /\bshoot up the\b/,
];

const ACTIVE_INTENT_PATTERNS = [
  /\b(want|wanna) to die\b/,
  /\b(?:i(?:'m|m| am)\s+)?(?:going to|gonna)\s+kill myself\b/,
  /\b(?:want|wanna|going|gonna|planning|plan|intend|intending) to end it(?: myself)?\b/,
  /\bend my life\b/,
  /\b(?:do not|don'?t) want to live\b/,
  /\bno reason to (live|keep going)\b/,
  /\bcan'?t stay safe\b|\bcannot stay safe\b/,
  /\bsuicid(e|al)\b/,
  /\b(hurt|hurting|cut|cutting|burn) myself\b/,
  /\bself[- ]?(harm|injury)\b/,
  /\boverdose\b|\bod on\b|\btake (all|too many) [a-z ]*pills\b|\bwhole bottle of\b/,
  /\b(want|going) to (hurt|kill) (someone|them)\b/,
  /\bshoot up the\b/,
];

const SERIOUS_ILLNESS_CONTEXT_RE = /\b(terminal|terminally ill|serious illness|cancer|hospice|stage\s*(?:4|iv)|dying of|months to live|palliative|my diagnosis)\b/;
const FIRST_PERSON_DYING_RE = /\bi(?:'m|m| am)\s+dying\b/;
const CAREGIVER_ILLNESS_CONTEXT_RE = /\b(my|our)\s+(mother|mom|father|dad|parent|wife|husband|spouse|partner|child|son|daughter|sister|brother|friend)\s+(is|was|are|were)?\s*(dying|terminal|terminally ill|in hospice|has cancer)\b/;
const GOING_TO_DIE_RE = /\bi(?:'m|m| am)?\s*(?:going to|gonna)\s+die\b/;
const PASSIVE_DISTRESS_RE = /\b(want it to be over|wish it was over|can'?t do this anymore|cannot do this anymore|can'?t go on|cannot go on|hopeless|despair|overwhelmed|can'?t cope|cannot cope)\b/;

function terminalIllnessCrisisRuleEnabled(opts = {}) {
  if (typeof opts.terminalIllnessRuleEnabled === 'boolean') return opts.terminalIllnessRuleEnabled;
  return process.env.TERMINAL_ILLNESS_CRISIS_RULE_ENABLED === 'true';
}

function redResult(matched) {
  return {
    is_red: true,
    risk: 'red',
    classification: 'crisis',
    matched,
    crisis_takeover: true,
    soft_safety_question_required: false,
    commerce_allowed: false,
    staff_action_required: true,
  };
}

function amberResult(classification, matched) {
  return {
    is_red: false,
    risk: 'amber',
    classification,
    matched,
    crisis_takeover: false,
    soft_safety_question_required: true,
    commerce_allowed: false,
    staff_action_required: true,
  };
}

function noneResult() {
  return {
    is_red: false,
    risk: 'none',
    classification: 'none',
    matched: null,
    crisis_takeover: false,
    soft_safety_question_required: false,
    commerce_allowed: true,
    staff_action_required: false,
  };
}

function firstMatchingPattern(patterns, message) {
  return patterns.find((re) => re.test(message)) || null;
}

function seriousIllnessContext(message) {
  return SERIOUS_ILLNESS_CONTEXT_RE.test(message) || FIRST_PERSON_DYING_RE.test(message) || CAREGIVER_ILLNESS_CONTEXT_RE.test(message);
}

function strongSeriousIllnessContext(message) {
  return SERIOUS_ILLNESS_CONTEXT_RE.test(message) || CAREGIVER_ILLNESS_CONTEXT_RE.test(message);
}

function classifyCrisisPhrase(message, opts = {}) {
  if (!message || typeof message !== 'string') return noneResult();
  const m = message.toLowerCase();
  const legacyMatch = firstMatchingPattern(PATTERNS, m);
  if (!terminalIllnessCrisisRuleEnabled(opts)) {
    return legacyMatch ? redResult('legacy_canonical_pattern') : noneResult();
  }

  const activeIntentMatch = firstMatchingPattern(ACTIVE_INTENT_PATTERNS, m);
  if (activeIntentMatch) return redResult('active_intent_pattern');

  if (seriousIllnessContext(m)) {
    if (GOING_TO_DIE_RE.test(m) || PASSIVE_DISTRESS_RE.test(m)) {
      return amberResult(
        CAREGIVER_ILLNESS_CONTEXT_RE.test(m) ? 'caregiver_overload' : 'serious_illness',
        'terminal_illness_determination_rule',
      );
    }
  }

  if (strongSeriousIllnessContext(m)) {
    return amberResult(
      CAREGIVER_ILLNESS_CONTEXT_RE.test(m) ? 'caregiver_overload' : 'serious_illness',
      'terminal_illness_context',
    );
  }

  return legacyMatch ? redResult('legacy_canonical_pattern') : noneResult();
}

exports.isCrisisPhrase = function (message) {
  return classifyCrisisPhrase(message).is_red;
};

exports.classifyCrisisPhrase = classifyCrisisPhrase;
exports.terminalIllnessCrisisRuleEnabled = terminalIllnessCrisisRuleEnabled;
exports._PATTERNS = PATTERNS; // exposed for the audit test harness only
