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
const { isCrisisPhrase } = require('./canonical_crisis_patterns');

// detectCrisis(userMessage: string) → { detected: bool, category?: string, matched?: string }
//
// Canonical merge (Mission 6.1.5, Dr. Felicia cleared 2026-05-24): detection
// is delegated to canonical_crisis_patterns.isCrisisPhrase so the 988 banner
// trigger and the commerce gate (scoreStability) share ONE source of truth and
// can never diverge. The legacy CRISIS_KEYWORDS list is retained only to
// enrich {category, matched} for the [CRISIS] audit log; if the canonical
// matcher fires on a phrase not in that list (e.g. passive ideation), we
// default category to 'suicide'.
function detectCrisis(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return { detected: false };
  }
  if (!isCrisisPhrase(userMessage)) {
    return { detected: false };
  }
  const lower = userMessage.toLowerCase();
  for (const category of Object.keys(CRISIS_KEYWORDS)) {
    for (const keyword of CRISIS_KEYWORDS[category]) {
      if (lower.includes(keyword)) {
        return { detected: true, category, matched: keyword };
      }
    }
  }
  return { detected: true, category: 'suicide', matched: 'canonical_pattern' };
}

// For non-streaming consumers: prepend the banner to a complete response.
// The streaming path in server.js writes the banner as a separate SSE
// chunk before the model stream begins; this helper is for any future
// non-streaming endpoint.
function injectCrisisBanner(response) {
  return CRISIS_BANNER + (response || '');
}

module.exports = { detectCrisis, injectCrisisBanner, CRISIS_BANNER };
