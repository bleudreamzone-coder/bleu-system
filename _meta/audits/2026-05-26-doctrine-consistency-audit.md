# Doctrine Consistency Audit — 2026-05-26 (read-only)

Files in `_meta/doctrine/`: 7 new (Day-79/80) + 8 pre-existing + cron_schedule_v1.

## Two doctrine "layers" coexist — vocabulary drift
- **Pre-existing set** frames governance as numbered **Layers**: `decision_matrix.md` = "Layer 3 — Governance", `refusal_list.md` = "Layer 4 — Drift Firewall".
- **Day-79/80 set** (`source_document_v1`, `lens_architecture_doctrine_v1`, etc.) frames the same system as the **three-voice stack** + **five machines** (Signal→Safety→Route→Outcome→Memory) + **seven gates**.
- These don't *contradict*, but they're **two parallel vocabularies** for one system. A reader gets "Layers 1–4" in one place and "five machines / three voices / seven gates" in another.

## Duplication: two refusal documents
- `refusal_list.md` (pre-existing, "Layer 4 drift firewall")
- `refusal_doctrine_v1.md` (Day-80, 20 numbered refusals)
- **Overlapping intent, different lists.** Risk: they drift apart. Recommend designating one canonical (suggest `refusal_doctrine_v1` as the 20-item canon, and `refusal_list` either merges in or links to it).

## Cross-references
- New set cross-links well (`source_document_v1` ↔ refusal/pressure/coca_cola/lens/future_self via `[[ ]]`).
- **Pre-existing files are NOT linked** from the new `_README.md` index except as a flat "related" list → they read as orphaned relative to the new thesis.

## Mission alignment (doctrine ↔ shipped code) — strong
- "Crisis overrides commerce" → `detectCrisis`/`isCrisisPhrase` + commerce gate (verified inline regression harness exists). ✅
- "Never store plaintext email/phone" (TD-010) → `hashEmail`/`hashPhone`, `recipient_hash`, `email_hash`. ✅ (one exception: legacy `/twilio-reply` stores plaintext phone in `outcome_events`.)
- Seven gates / LRAS (coca_cola_recipe) → **conceptual only; `logTrustPacket` exists but is not yet called by any route**, so the gates aren't yet recorded per-decision. Doctrine is ahead of code here (acknowledged in the doctrine itself, refusal 18).

## Gaps (code implies, doctrine silent)
- No doctrine on **auth/session/identity** (magic-link, citizenship) though it's now core.
- No doctrine on **email/SMS comms governance** (deliverability, opt-out, TCPA) though templates + day-7 shipped.

## Top 5 for Captain Soul-Gate refresh
1. Pick ONE canonical refusal doc; reconcile the other.
2. Unify the "Layers" vs "five machines/three voices" vocabulary (or explicitly map them).
3. Add an identity/citizenship doctrine page.
4. Add a comms-governance doctrine page (opt-out, TCPA, deliverability).
5. When `logTrustPacket` is wired, mark the seven-gates doctrine "live" not "conceptual".
