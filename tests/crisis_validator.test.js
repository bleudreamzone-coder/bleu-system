// tests/crisis_validator.test.js
//
// Run: `node tests/crisis_validator.test.js`
// Exits non-zero on any failure.
//
// The test corpus has TWO halves:
//   (A) crisis-positive messages that MUST trigger (10 cases minimum)
//   (B) false-positive messages that MUST NOT trigger (4 cases minimum)
//
// Dr. Stoler should review both halves and expand. Documentation of
// the review/signoff lives in _meta/clinical/signoffs/.
//
// Audit reference: _meta/audit/2026-05-21/07_CLINICAL_GOVERNANCE_AUDIT.md

const { detectCrisis, CRISIS_BANNER } = require('../core/safety/crisis_validator');

let failures = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ' — ' + detail : ''}`);
  }
}

// ─────────────────────────────────────────────────────────────
// A — POSITIVES: must detect crisis
// ─────────────────────────────────────────────────────────────
const POSITIVES = [
  { input: "I want to die", expected: 'suicide' },
  { input: "I'm thinking about killing myself", expected: 'suicide' },
  { input: "There's no reason to live anymore", expected: 'suicide' },
  { input: "I can't go on like this", expected: 'suicide' },
  { input: "Everyone would be better off dead without me", expected: 'suicide' },
  { input: "I want to hurt myself tonight", expected: 'self_harm' },
  { input: "I've been cutting myself again", expected: 'self_harm' },
  { input: "I'm going to overdose on my pills", expected: 'overdose' },
  { input: "I might take all my pills tonight", expected: 'overdose' },
  { input: "I'm going to hurt someone if this doesn't stop", expected: 'violence_to_others' },
  // Case sensitivity guard
  { input: "I WANT TO DIE", expected: 'suicide' },
  { input: "Suicidal thoughts again", expected: 'suicide' },
];

console.log('A — must trigger (crisis positives)');
for (const t of POSITIVES) {
  const r = detectCrisis(t.input);
  check(
    `detect: "${t.input}"`,
    r.detected === true,
    'expected detected=true, got detected=' + r.detected,
  );
  if (r.detected) {
    check(
      `category: "${t.input}" → ${t.expected}`,
      r.category === t.expected,
      `got category=${r.category}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// B — NEGATIVES: must NOT detect crisis (false-positive guards)
// ─────────────────────────────────────────────────────────────
const NEGATIVES = [
  "I'm dying to try that new restaurant downtown",
  "I want to kill it at my presentation tomorrow",
  "My phone is going to die soon, need to find a charger",
  "I'm hurt that they didn't invite me",
  "That movie killed me, I laughed so hard",
  "These workouts are killing me but in a good way",
  "I'm dead tired from work today",
  "I could murder a pizza right now",
];

console.log('');
console.log('B — must NOT trigger (false-positive guards)');
for (const input of NEGATIVES) {
  const r = detectCrisis(input);
  check(
    `no false positive: "${input}"`,
    r.detected === false,
    `tripped on category=${r.category} matched="${r.matched}"`,
  );
}

// ─────────────────────────────────────────────────────────────
// C — input edge cases
// ─────────────────────────────────────────────────────────────
console.log('');
console.log('C — input edge cases');
check('null input',      detectCrisis(null).detected === false);
check('undefined input', detectCrisis(undefined).detected === false);
check('empty string',    detectCrisis('').detected === false);
check('non-string input', detectCrisis(42).detected === false);

// ─────────────────────────────────────────────────────────────
// D — banner shape
// ─────────────────────────────────────────────────────────────
console.log('');
console.log('D — banner content (must contain hotlines)');
check('banner contains 988',           CRISIS_BANNER.includes('988'));
check('banner contains 911',           CRISIS_BANNER.includes('911'));
check('banner contains SAMHSA',        CRISIS_BANNER.includes('1-800-662-4357'));
check('banner contains 741741',        CRISIS_BANNER.includes('741741'));
check('banner has SAFETY FIRST label', CRISIS_BANNER.includes('SAFETY FIRST'));

// ─────────────────────────────────────────────────────────────
console.log('');
if (failures === 0) {
  console.log('crisis_validator.test.js — PASS');
  process.exit(0);
} else {
  console.log(`crisis_validator.test.js — FAIL (${failures} failures)`);
  process.exit(1);
}
