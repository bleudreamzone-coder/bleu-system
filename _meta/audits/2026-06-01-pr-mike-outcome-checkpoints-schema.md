# PR Mike — Outcome Checkpoints Schema Audit

**Date:** 2026-06-01  
**Scope:** Schema-only + dormant stub capture adapter for OutcomeCheckpoint v1.1. No live SMS, email, cron, SQL application, or route wiring.

## Rationale

The Bible describes BLEU as a governed wellness interface with audit trails and outcome proof, and BLEUBox as the decision layer that turns every interaction into structured signal, safety, fit, evidence, decision, restraint, and outcome data over time. `_meta/THE_BLEU_BIBLE.md`.

The Lens Architecture doctrine is the clearest Memory Machine source for this PR: it defines Signal → Safety → Route → Outcome → Memory, says Outcome schedules and captures day-3 / day-7 / day-30 follow-up, and says Memory records what happened so the next Signal→Route is sharper. `_meta/doctrine/lens_architecture_doctrine_v1.md`.

The Trust Packet v1.1 schema already requires `outcome_plan.day_3`, `outcome_plan.day_7`, and `outcome_plan.day_30`, each shaped as a status/rationale checkpoint commitment. `core/schemas/trust_packet_v1.1.schema.json`.

The 2026-05-29 total system blueprint includes a follow-up phase and an outcome-loop section, but its explicit table is Day 7-centric. This PR is therefore honest: the blueprint supports outcome follow-up generally, while the full `[3, 7, 30]` interval set comes most directly from Lens Architecture doctrine and Trust Packet's three required outcome plan fields. `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md`.

## Status values and valid transitions

OutcomeCheckpoint v1.1 has five statuses:

1. `scheduled` — created and waiting for due delivery/capture.
2. `captured` — Citizen responded with a `self_report`.
3. `missed` — scheduled window passed with no response.
4. `declined` — Citizen explicitly declined to respond.
5. `expired` — checkpoint aged beyond the late-response window.

Valid transitions enforced by adapter helper:

| From | To | Requirement |
|---|---|---|
| `scheduled` | `captured` | `captured_at` present and `self_report` present |
| `scheduled` | `missed` | `captured_at=null`, `self_report=null` |
| `scheduled` | `declined` | non-empty `decline_reason`, `self_report=null` |
| `scheduled` | `expired` | `captured_at=null`, `self_report=null` |
| `missed` | `captured` | late response allowed with `captured_at` and `self_report` |
| `missed` | `expired` | future cron closes the stale checkpoint |
| `captured` | `captured` | idempotent captured update only |
| `declined` | `declined` | idempotent declined update only |
| `expired` | `expired` | idempotent expired update only |

## Checkpoint intervals and clinical rationale

Only integer checkpoint days `[3, 7, 30]` are valid in v1.1:

- **Day 3:** early adherence and initial side-effect/safety signal detection.
- **Day 7:** weekly cycle complete; sleep, mood, energy, stress, gut, and behavior patterns are more visible.
- **Day 30:** monthly cycle complete; longer trajectory and durability are more visible.

Any future 60- or 90-day intervals require OutcomeCheckpoint v1.2 rather than widening v1.1 silently.

## Triple PII protection pattern

Outcome capture includes three independent defenses:

1. **Schema const false:** `td_010_compliance.plaintext_email_stored`, `plaintext_phone_stored`, and `plaintext_in_free_text` are schema-enforced false values.
2. **Adapter redaction:** `detectPlaintextPII()` detects emails and common US phone formats, then replaces them with `[REDACTED-EMAIL]` and `[REDACTED-PHONE]`.
3. **Factory auto-redact:** `createCapturedCheckpoint()` applies adapter redaction before a captured record is constructed.

The design chooses automatic redaction over recording any flag that would violate the schema-level `plaintext_in_free_text=false` invariant.

## Cross-field if/then enforcement

JSON Schema and SQL table-level checks mirror the state shape:

- `captured` requires non-null `captured_at` and non-null `self_report`.
- `scheduled`, `missed`, and `expired` require `captured_at=null` and `self_report=null`.
- `declined` requires a non-empty `decline_reason` and `self_report=null`; `captured_at` may be present when the decline is received.

The requested datetime comparison (`captured_at >= scheduled_at - 24 hours`) is not natively expressible in JSON Schema 2020-12, so `createCapturedCheckpoint()` enforces it at adapter/factory runtime while SQL persistence remains future work.

## Dormant-by-default activation sequence

1. Dr. Felicia signs outcome capture protocols at Tier 3, including clinically appropriate self-report questions, valid measurement fields, decline categories, and retention policy.
2. Captain applies the SQL migration manually via the Supabase dashboard.
3. Captain sets `OUTCOME_CAPTURE_ENABLED=true` in Render.
4. Future PR wires Twilio SMS and Resend email scheduling adapters.
5. Future PR ships a daily cron that calls `getDue()` and triggers delivery attempts.

## Forward path

This schema becomes live only after Felicia protocol signoff, manual migration application, and delivery adapter wiring. It is intended to support PR Lexapro killer demo, PR Model Router scaffold, PR Trust Packet logging plumbing, Counterfactual capture infrastructure, and future Memory Machine/trajectory work.

## Honest ambiguity note

The Bible strongly supports outcome proof and structured outcome data. The Lens Architecture doctrine explicitly states day-3 / 7 / 30 Outcome follow-up and Memory compounding. The 2026-05-29 blueprint supports follow-up and Day-7 outcome capture, but does not clearly specify Day 3 and Day 30 in the sections found. This PR cites that ambiguity rather than overstating the blueprint.
