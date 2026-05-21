# Crisis Validator — Clinical Signoff

**Status:** PENDING
**Subject:** `core/safety/crisis_validator.js` + `core/safety/crisis_keywords.js`
**Author of the rule (engineer):** Bleu Garner
**Clinical reviewer of record:** Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM
**Date drafted:** 2026-05-21
**Date approved:** PENDING
**Next review due:** PENDING (set on first approval; default 90 days)

---

## What was reviewed

### Files
- `core/safety/crisis_keywords.js` — keyword phrase lists across four categories (suicide, self_harm, overdose, violence_to_others) and the deterministic crisis banner.
- `core/safety/crisis_validator.js` — `detectCrisis(message)` substring-matching function.
- `tests/crisis_validator.test.js` — 12 positive cases, 8 false-positive guards, 4 input edge cases, 5 banner shape assertions.

### Wiring
The validator runs in `server.js`:
- `/api/chat` endpoint: detection right after session-intent check; banner emitted as a dedicated SSE chunk before any model output, in both the greeting-cache short-circuit and the main streaming response.
- `/api/chat/stream` endpoint: same pattern.

If `detectCrisis()` returns `{ detected: true, ... }`, the banner is force-prepended to the SSE stream regardless of what the model says next. A `[CRISIS]` line is written to stdout for clinical review with category, matched keyword, session, user, and endpoint.

### Banner content

```
⚠️ IMPORTANT — SAFETY FIRST

If you are in crisis, please call or text 988 — the Suicide and Crisis Lifeline. Available 24/7. Free, confidential.
If you or someone else is in immediate danger, please call 911 now.
SAMHSA National Helpline: 1-800-662-4357 (free, 24/7, confidential, English and Spanish).
Crisis Text Line: text HOME to 741741.
```

---

## Evidence reference

- **988 Suicide and Crisis Lifeline** (federal, SAMHSA-administered) — primary U.S. crisis intervention resource. <https://988lifeline.org/>
- **911** — appropriate for active physical danger to self or others.
- **SAMHSA National Helpline (1-800-662-4357)** — referral line for substance use and mental health crises, 24/7, free. <https://www.samhsa.gov/find-help/national-helpline>
- **Crisis Text Line (text HOME to 741741)** — text-first crisis support, validated and widely cited.

The four categories in `CRISIS_KEYWORDS` (suicide, self_harm, overdose, violence_to_others) align with standard suicide risk assessment categories (e.g., Columbia Protocol C-SSRS dimensions, SAMHSA suicide-prevention screening domains). They are intentionally a subset of full clinical screening — this is detection-and-escalation, not assessment.

---

## What Dr. Stoler should review before signoff

1. **Keyword coverage in `core/safety/crisis_keywords.js`.** The current list is a conservative seed (12 suicide phrases, 8 self-harm, 7 overdose, 6 violence). Specific items to confirm or expand:
   - Are there idiomatic phrasings clinically common in the bleu.live user base (New Orleans, hospitality workers, recovery community) that are missing?
   - Should violence_to_others trigger the same 988 banner, or a different routing (911-first)?
   - Should we add a `pregnancy_specific` category (e.g., severe postpartum ideation) with adjusted resources (Postpartum Support International 1-800-944-4773)?
2. **False-positive corpus.** The 8 guards in `tests/crisis_validator.test.js` are illustrative. The clinician's intuition for clinical false positives (e.g., "I'm dying for a coffee", "this workout is killing me") should be expanded.
3. **Banner copy.** Is the order correct? Is "SAFETY FIRST" the right framing or should it be "If you're in crisis"? Is the language warm enough for a user in distress?
4. **Logging surface.** The `[CRISIS]` log line includes `category`, `matched`, `session`, `user_id`, `endpoint`. Is that the right metadata, or should other context (recent CI/ISI score, mode, time-of-day) be captured? Note: any expansion of logged PHI raises HIPAA-adjacent considerations.
5. **Banner persistence.** The banner currently fires per turn. Should there be a session-level cooldown so a user discussing crisis context across many turns doesn't see the same banner ten times? Or is repetition clinically warranted?

---

## Decision

```
[ ] APPROVED
[ ] APPROVED WITH CHANGES (listed below)
[ ] REJECTED (reason listed below)
[X] PENDING — awaiting Dr. Stoler's review
```

### Changes requested (if any)



### Reason for rejection (if any)



---

## Signature line

_Signed_ ________________________________________________

Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM
Chief Clinical Officer, bleu.live
Date: __________________

---

## Audit context

This signoff was scaffolded as part of the 2026-05-21 critical-fixes execution. The validator is **shipping now** with PENDING status because the alternative — leaving crisis escalation prompt-only — is a greater clinical risk than shipping a code-enforced fallback with a deterministic banner. The `pending-clinical-review` posture is the same discipline used for the BHI v1 formula.

**Audit references:**
- `_meta/audit/2026-05-21/07_CLINICAL_GOVERNANCE_AUDIT.md`
- `_meta/audit/2026-05-21/03_DOMAIN_LAYER_AUDIT.md`
- `_meta/audit/2026-05-21/10_TECH_DEBT_REGISTER.md` (TD-015)
