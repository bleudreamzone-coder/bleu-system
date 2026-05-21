// core/safety/crisis_keywords.js
//
// CLINICAL REVIEW REQUIRED: Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM
// Last reviewed: PENDING — see _meta/clinical/signoffs/crisis_validator-2026-05-21-stoler.md
//
// Add new keywords ONLY with a clinical signoff. Document the signoff
// in _meta/clinical/signoffs/. Never add keywords without one.
//
// Each phrase below is matched as a case-insensitive substring against
// the user's message. False positives are real — see the test corpus
// in tests/crisis_validator.test.js for the false-positive guards we
// have committed to.
//
// Audit reference: _meta/audit/2026-05-21/07_CLINICAL_GOVERNANCE_AUDIT.md
//                  _meta/audit/2026-05-21/03_DOMAIN_LAYER_AUDIT.md

const CRISIS_KEYWORDS = {
  suicide: [
    'want to die',
    'wanna die',
    'kill myself',
    'killing myself',
    'end my life',
    'ending my life',
    'end it all',
    'suicidal',
    'suicide',
    'no reason to live',
    "can't go on",
    'cant go on',
    'better off dead',
    "don't want to be here",
    'dont want to be here',
  ],
  self_harm: [
    'hurt myself',
    'hurting myself',
    'cut myself',
    'cutting myself',
    'self harm',
    'self-harm',
    'self injury',
    'burn myself',
  ],
  overdose: [
    'overdose',
    'od on',
    'take all my pills',
    'take all the pills',
    'take all of them',
    'too many pills',
    'whole bottle of',
  ],
  violence_to_others: [
    'going to hurt someone',
    'want to hurt someone',
    'going to kill them',
    'want to kill them',
    'shoot up',
    'shoot up the',
  ],
};

// The deterministic block we prepend to any response when crisis is
// detected. Hand-edited copy (not generated) so it survives any future
// prompt-injection regression. The 988 line is required for U.S.
// audiences; 911 covers immediate physical danger; SAMHSA is the
// referral line for substance use.
const CRISIS_BANNER = [
  '',
  '⚠️ IMPORTANT — SAFETY FIRST',
  '',
  'If you are in crisis, please call or text 988 — the Suicide and Crisis Lifeline. Available 24/7. Free, confidential.',
  'If you or someone else is in immediate danger, please call 911 now.',
  'SAMHSA National Helpline: 1-800-662-4357 (free, 24/7, confidential, English and Spanish).',
  'Crisis Text Line: text HOME to 741741.',
  '',
  '---',
  '',
].join('\n');

module.exports = { CRISIS_KEYWORDS, CRISIS_BANNER };
