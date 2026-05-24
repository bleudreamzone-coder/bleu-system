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
  /\b(want|wanna|going) to die\b/,
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

exports.isCrisisPhrase = function (message) {
  if (!message || typeof message !== 'string') return false;
  const m = message.toLowerCase();
  return PATTERNS.some((re) => re.test(m));
};

exports._PATTERNS = PATTERNS; // exposed for the audit test harness only
