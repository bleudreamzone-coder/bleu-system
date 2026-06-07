# BLEU Codex Ship Queue

**Last updated:** 2026-06-07  
**Mode:** proof mode / no expansion  
**Current priority:** Natchitoches Rural Health Transformation Summit demo, June 9–12, 2026.  
**Grounding sources:** `AGENTS.md`, `_meta/doctrine/felicia_standards_v1.md`, `_meta/audits/2026-06-07-total-system-diagnostic-audit.md`.

This queue exists so Bleu can hand Codex one ordered sequence when he is home. It does **not** authorize architecture expansion, dormant-agent wiring, Trust Packet persistence, schema changes, or new clinical language. Every task below must preserve the live path unless the task explicitly says otherwise, and all clinical / medication / mental-health wording remains **REQUIRES DR. STOLER SIGNOFF**.

## Operating guardrails for every queued task

- Read `AGENTS.md` before starting.
- Treat `server.js`, `/api/chat`, and `/api/chat/stream` as the protected live path.
- Do not wire `core/agents/*` or `core/schemas/*` into live behavior.
- Do not persist Trust Packet v1.1.
- Do not author medication, mental-health, evidence, credential, or professional-standard copy; use placeholders marked `REQUIRES DR. STOLER SIGNOFF` when needed.
- Report VERIFIED / PARTIALLY VERIFIED / UNKNOWN / BLOCKED labels with file:line evidence.
- Prefer read-only audits and runtime proof over expansion.

## Current ordered sequence

### Task 1 — Crisis false-positive repair

**Status:** queued P0  
**Source finding:** crisis validator false-positives on “My phone is going to die soon, need to find a charger.”  
**Allowed scope:** crisis pattern/test repair only.  
**Guardrail:** do not weaken true self-harm / crisis detection; clinical review required for boundary changes.

**Handoff:** tighten the canonical `going to die` pattern so non-human/device contexts do not trip while true suicidal ideation still does. Verify with `node tests/crisis_validator.test.js` and report any remaining clinical ambiguity.

### Task 2 — ALVAI lineage-claim removal

**Status:** queued P0  
**Source finding:** live `ALVAI_CORE` includes the signed-standards violation “127 years of healing lineage.”  
**Allowed scope:** prompt compliance patch in `server.js` only.  
**Guardrail:** do not replace it with a new credential, licensure, or authority claim.

**Handoff:** patch `ALVAI_CORE` to remove lineage-as-authority wording and verify prompt scans plus live-path smoke behavior.

### Task 3 — ALVAI therapist / implied-licensure repair

**Status:** queued P0  
**Source finding:** live prompt identifies ALVAI as a therapist / carries scope-risk language.  
**Allowed scope:** bounded role-language patch in `server.js` only.  
**Guardrail:** clinical / mental-health wording requires Dr. Stoler review; use “REQUIRES DR. STOLER SIGNOFF” for any unapproved replacement.

**Handoff:** replace therapist / implied-licensure wording with bounded AI wellness-guide framing while preserving crisis escalation and referral boundaries.

### Task 4 — Core prompt commerce-pressure cleanup

**Status:** queued P0  
**Source finding:** core prompt contains sales-first supplement / product-specific price and purchase examples.  
**Allowed scope:** remove product-specific sales pressure from core prompt.  
**Guardrail:** do not create new commerce logic, catalogs, or product claims.

**Handoff:** remove product-specific price / purchase examples from `ALVAI_CORE`; preserve existing commerce gate and Commerce Steward behavior.

### Task 5 — SMS / Twilio PII persistence repair

**Status:** queued P0  
**Source finding:** Twilio replies persist plaintext phone and message body in `outcome_events`.  
**Allowed scope:** redaction / hashing / intent-classification repair on the SMS persistence path.  
**Guardrail:** do not apply production DB migrations or change retention policy without human ops approval.

**Handoff:** hash or redact phone identifiers and store intent classification rather than raw SMS body; document what remains UNKNOWN without production Supabase access.

### Task 6 — Deterministic Lexapro counterfactual demo proof

**Status:** queued P0 after Tasks 1–4  
**Source finding:** no deterministic live Lexapro demo path exists that emits real Signal → Decision → Governed Response → Trust Packet through governed logic without a live model call or hand-written output.  
**Allowed scope:** only an approved fixed-stub proof path if it preserves real governance logic and does not wire dormant modules.  
**Guardrail:** all medication / Lexapro wording requires Dr. Stoler signoff; never fake the output shape.

**Handoff:** after prompt compliance is repaired, create or verify a deterministic demo path using fixed input + real governance logic + fixed model stub. The Signal, Decision, governed response, and Trust Packet must be emitted by live code, not hand-written.

## Audit extension after the six P0 tasks

These two audits map what is still not grounded in code or deployed reality. They should run after the immediate P0 repair sequence unless Bleu explicitly prioritizes read-only visibility first.

### Prompt A — Current-state reality audit, round 2

**Status:** queued read-only audit  
**Target artifact:** `_meta/audits/2026-06-08-surface-and-prompt-reality-audit.md`  
**Access needed:** repo only  
**Behavior changes:** none; add only the audit file.

```text
Read _meta/doctrine/felicia_standards_v1.md, _meta/audits/2026-06-07-total-system-diagnostic-audit.md, and AGENTS.md first. Produce a NEW read-only audit at _meta/audits/2026-06-08-surface-and-prompt-reality-audit.md, code-source-of-truth, no behavior changes. Cover, with file:line evidence and VERIFIED / UNKNOWN labels:
1. PROMPT BRAINS — enumerate EVERY prompt-bearing constant in server.js (ALVAI_CORE, MODE_PROMPTS, THERAPY_MODES, RECOVERY_MODES, and any others) AND the Supabase edge function supabase/functions/alvai/index.ts. For each, check and report: commerce-forward/sales-first language, clinical overreach (diagnose/treat/cure/"therapist"/implied licensure), banned vocabulary per felicia_standards_v1.md Lock 4, approximate reading level, and whether the 16-voice roster is present. List per-mode violations. Note explicitly that the existing tests/prompt_compliance.test.js only covers ALVAI_CORE→THERAPY_MODES, so THERAPY_MODES/RECOVERY_MODES are currently unchecked.
2. SURFACE → BRAIN MAP — list every user-facing route/handler (web chat, /api/chat, /api/chat/stream, SMS inbound, any others) and which prompt brain governs each. State whether the Supabase edge function is reachable by users and from where. Flag any third/hidden brain.
3. COMMERCE CARD SOURCE — trace where product/protocol card data (e.g. "Stress Protocol") originates (table/query/file) and confirm whether getCommerceGate / the distress gate suppresses cards on EVERY path that can surface them, including any frontend-initiated fetch.
4. CRISIS PATH END-TO-END — for each user surface, trace input → crisis detection → 988/escalation + commerce suppression; note any surface where crisis handling is missing or non-deterministic.
5. DATA/PII MAP — what user data persists, in which tables, with what RLS, including conversation_history vs conversation_memory duplication and phone-hashing (TD-010) coverage.
6. CANNOT-VERIFY-WITHOUT-CREDENTIALS — list everything that needs production Supabase/Render access to confirm.
End with prioritized P0/P1/P2 findings and a short fix-task handoff. Guardrails: read-only audit; do NOT change prompts or logic; do NOT wire core/agents/* or persist Trust Packet v1.1; flag all clinical/medication items for Dr. Stoler sign-off. Branch; add only the audit file.
```

### Prompt B — Deployed + database reality check

**Status:** queued read-only live-state audit  
**Target artifact:** `_meta/audits/2026-06-08-deployed-reality-check.md`  
**Access needed:** Supabase + Render access  
**Behavior changes:** none; do not apply migrations, change env vars, or persist anything.

```text
This task verifies LIVE state, which the repo cannot show. With Supabase + Render access available, produce _meta/audits/2026-06-08-deployed-reality-check.md documenting: (1) the exact commit currently deployed on the Render bleu-system service and whether it matches main; (2) Render env vars / feature flags / kill-switch values that change ALVAI behavior (names and on/off only — do NOT print secret values); (3) which Supabase migrations are actually applied in production vs present in /supabase/migrations, especially the RLS/grant lockdowns (2026-05-21-p0-revoke-anon, trust-packets, grant-exposure); (4) which tables hold plaintext PII today. Use read-only checks. Do NOT apply migrations, change env vars, or persist anything. Flag every gap as P0/P1/P2 with the human action required.
```

## Deferred / legacy queue items

The items below are older open work from the May 24 finishing queue. They remain useful context, but they are secondary to the P0 proof-mode sequence above.

### Mission 2.4.5 — per-mode commerce discipline cleanup

- **Status:** superseded by Prompt A audit before patching.
- **Original note:** passport/map/recovery `MODE_PROMPTS` embedded affiliate URLs, tags, and prices; recovery mode had supplement-content concerns requiring Dr. Felicia review.
- **Current handling:** do not patch blindly; Prompt A must first enumerate every prompt brain and per-mode violation.

### detectCrisis() ↔ scoreStability suicidality-regex audit

- **Status:** partially overlaps Task 1 and Prompt A / crisis path tracing.
- **Current handling:** repair the verified false-positive first; keep any broader clinical word-list merge under Dr. Stoler review.

### scoreStability calibration for emotional overwhelm

- **Status:** deferred clinical threshold decision.
- **Current handling:** do not auto-tune; requires Dr. Stoler decision on overwhelm / acute-loss stability scoring.

### Kill switch fail-closed config option

- **Status:** future / deferred.
- **Current handling:** Prompt B should document current deployed flag / kill-switch values by name and on/off status only.
