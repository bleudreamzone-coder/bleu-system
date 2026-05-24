# Crisis Word List Audit — detectCrisis (988 banner) vs scoreStability (commerce gate)

**STATUS: SHIPPED 2026-05-24 — Cleared by Dr. Felicia Stoler.**
Merged in Mission 6.1.5 (commit recorded in git). Both `detectCrisis()` (988
banner) and `scoreStability()` (commerce gate) now call
`core/safety/canonical_crisis_patterns.isCrisisPhrase` — single source of truth,
banner + gate cannot diverge. Regression guard: `BLEU_TEST_CRISIS=1 node server.js`
(11/11, banner == gate on every phrase). Signoff: `_meta/clinical/signoffs/2026-05-24-canonical-crisis-patterns-stoler.md`.

## Why this exists
Mission 4.2 discovered `detectCrisis()` — the validator that fires the **988
crisis banner** — does NOT catch passive suicidal ideation like "I cannot keep
living like this." Mission 4.2 added a suicidality regex inside `scoreStability`
to close the **commerce gate** (no product cards for those phrases). But the
**988 banner still does not fire** for passive ideation, and — newly found here —
even the commerce gate misses some phrasings.

---

## Section 1 — Current `detectCrisis()` word list (verbatim)
Source: `core/safety/crisis_keywords.js` (substring match, case-insensitive).
```
suicide: want to die, wanna die, kill myself, killing myself, end my life,
  ending my life, end it all, suicidal, suicide, no reason to live,
  can't go on, cant go on, better off dead, don't want to be here,
  dont want to be here
self_harm: hurt myself, hurting myself, cut myself, cutting myself, self harm,
  self-harm, self injury, burn myself
overdose: overdose, od on, take all my pills, take all the pills,
  take all of them, too many pills, whole bottle of
violence_to_others: going to hurt someone, want to hurt someone,
  going to kill them, want to kill them, shoot up, shoot up the
```

## Section 2 — Current `scoreStability` suicidality regex (verbatim)
Source: `server.js` (Mission 4.2, near `openWindowGate`).
```
/kill myself|kill me\b|want to die|end it all|end my life|not worth living|
cannot keep living|can'?t keep living|cannot go on|can'?t go on|
do(?:n'?t| not) want to (?:be here|live)|no reason to live|
better off (?:dead|without me)|cannot do this anymore|can'?t do this anymore/
```

## Section 3 — Test matrix, CURRENT state (empirically run)
9 true-crisis phrases (a–i), 2 not-crisis controls (j–k).

| id | phrase | detectCrisis (988) | scoreStability (gate) | expected |
|----|--------|:--:|:--:|:--:|
| a | I want to kill myself | ✅ | ✅ | crisis |
| b | I cannot keep living like this | ❌ | ✅ | crisis |
| c | I cannot do this anymore | ❌ | ✅ | crisis |
| d | I want to die | ✅ | ✅ | crisis |
| e | I am thinking about ending it | ❌ | ❌ | crisis |
| f | I do not want to be here anymore | ❌ | ✅ | crisis |
| g | what is the point of going on | ❌ | ❌ | crisis |
| h | everyone would be better off without me | ❌ | ✅ | crisis |
| i | I am tired of living | ❌ | ❌ | crisis |
| j | I hate myself (shame, not ideation) | ❌ | ❌ | safe ✓ |
| k | I cannot keep doing this job (work fatigue) | ❌ | ❌ | safe ✓ |

**Findings:**
- `detectCrisis` (988 banner) catches **2 of 9** (a, d). It misses ALL passive
  ideation — the banner does not fire for b, c, e, f, g, h, i.
- `scoreStability` (commerce gate) catches **6 of 9** — but misses **e, g, i**.
  That means those three phrases **currently render commerce cards** (a finding
  beyond Mission 4.2: the gate is not yet complete either).
- Both correctly leave j and k alone (no false positives).

## Section 4 — Proposed merged canonical list
`core/safety/canonical_crisis_patterns.js` → `isCrisisPhrase(message)`. Merges
both lists + the gaps (passive ideation, "point of going on", "tired of
living", "thinking about ending it"), tuned to keep j/k safe. See file for the
full pattern array.

## Section 5 — Test matrix, PROPOSED state (empirically run)
| metric | result |
|--------|--------|
| true-crisis a–i caught | **9 / 9** ✅ |
| not-crisis j–k correctly safe | **2 / 2** ✅ |
| total | **11 / 11 correct** |

## Section 6 — Migration plan — COMPLETED in Mission 6.1.5 (2026-05-24)
1. ✅ `detectCrisis()` → calls `canonical_crisis_patterns.isCrisisPhrase` (banner now fires on all 9; legacy CRISIS_KEYWORDS retained only to enrich {category, matched} for the audit log).
2. ✅ `scoreStability` → calls the same function (gate + banner cannot diverge).
3. ✅ 11-phrase regression test wired as `BLEU_TEST_CRISIS=1` — fails on any drift.
4. ✅ Signoff filed: `_meta/clinical/signoffs/2026-05-24-canonical-crisis-patterns-stoler.md`.

## Open questions for Dr. Felicia (Monday)
- Does the 11-phrase set cover enough ground, or should we add: gender-specific
  framings, cultural/idiomatic variants, drug/alcohol-context phrasings
  ("I'll just take the whole bottle tonight"), or indirect statements
  ("you won't have to worry about me much longer")?
- Is "I am tired of living" / "tired of being alive" a confirmed banner-trigger,
  or monitor-only? (Borderline between passive ideation and exhaustion.)
- False-positive tolerance: "thinking about ending it" could match a relationship
  ("ending it" with a partner). Acceptable to over-trigger the banner here?
