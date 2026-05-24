# Clinical Signoff — Canonical Crisis Patterns

**Cleared by:** Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM — Chief Clinical Officer
**Date:** 2026-05-24
**Mission:** 6.1 (audit/proposal) → 6.1.5 (merge/deployment)
**Tier:** 2/3 per `_meta/doctrine/decision_matrix.md` (crisis routing modification)

## What was cleared
A single canonical crisis-phrase matcher (`core/safety/canonical_crisis_patterns.js`,
`isCrisisPhrase`) now backs BOTH:
- `detectCrisis()` — the 988 crisis banner trigger (`core/safety/crisis_validator.js`)
- `scoreStability()` — the commerce-suppression gate (`server.js`, Open Window Layer 29)

Single source of truth: the visible 988 banner and the silent commerce
suppression can no longer diverge.

## Why it was needed
The prior `detectCrisis()` keyword list caught only 2 of 9 tested ideation
phrases — it missed passive suicidal ideation ("I cannot keep living like this",
"what is the point of going on", "I am tired of living"). The Mission 4.2 gate
caught 6 of 9. After the merge: 9/9 ideation phrases trigger both, 0/2 false
positives on the controls ("I hate myself" = shame; "I cannot keep doing this
job" = work fatigue).

## Verification (11-phrase matrix)
`BLEU_TEST_CRISIS=1 node server.js` → 11/11, banner == gate on every phrase.
Phrases a–i (crisis) all true on both validators; j–k (safe) false on both.

## Files affected
- `core/safety/canonical_crisis_patterns.js` (new, now called)
- `core/safety/crisis_validator.js` (`detectCrisis` delegates to canonical)
- `server.js` (`scoreStability` delegates to canonical; `BLEU_TEST_CRISIS` harness)

## Open items for follow-up (logged in finishing_queue.md)
Possible additional phrasings for a future review: gender-specific framings,
cultural/idiomatic variants, drug/alcohol-context statements, and indirect
statements ("you won't have to worry about me much longer"). False-positive
tolerance on "ending it" (relationship vs life) accepted as fail-safe toward
the banner.
