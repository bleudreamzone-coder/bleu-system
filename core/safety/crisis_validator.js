// core/safety/crisis_validator.js
//
// Deterministic crisis detection + non-overrideable response prefix.
// This is the "non-overrideable crisis escalation" called out in the
// pitch deck — implemented in code so it cannot be defeated by a
// prompt-injection or by a future regression in ALVAI_CORE.
//
// Wiring (see server.js):
//   const { detectCrisis, CRISIS_BANNER } = require('./core/safety/crisis_validator');
//   const crisis = detectCrisis(p.message);
//   if (crisis.detected) {
//     // SSE: write banner FIRST, before any model output
//     res.write('data: ' + JSON.stringify({ text: CRISIS_BANNER }) + '\n\n');
//     // Log for clinical review
//     console.log('[CRISIS]', JSON.stringify({ category: crisis.category, matched: crisis.matched, session: ..., user: ... }));
//   }
//
// Audit reference: _meta/audit/2026-05-21/07_CLINICAL_GOVERNANCE_AUDIT.md

const { CRISIS_KEYWORDS, CRISIS_BANNER } = require('./crisis_keywords');

// detectCrisis(userMessage: string) → { detected: bool, category?: string, matched?: string }
//
// Returns the FIRST matched category and the matched phrase. Single-match
// is sufficient — once a crisis is detected, the banner fires. We don't
// attempt to enumerate every category present.
function detectCrisis(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return { detected: false };
  }
  const lower = userMessage.toLowerCase();
  for (const category of Object.keys(CRISIS_KEYWORDS)) {
    const keywords = CRISIS_KEYWORDS[category];
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return { detected: true, category, matched: keyword };
      }
    }
  }
  return { detected: false };
}

// For non-streaming consumers: prepend the banner to a complete response.
// The streaming path in server.js writes the banner as a separate SSE
// chunk before the model stream begins; this helper is for any future
// non-streaming endpoint.
function injectCrisisBanner(response) {
  return CRISIS_BANNER + (response || '');
}

module.exports = { detectCrisis, injectCrisisBanner, CRISIS_BANNER };
