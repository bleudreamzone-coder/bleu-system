# Outcome Checkpoints (Shadow Mode — Schema + Stub Capture)

OutcomeCheckpoint v1.1 records are the dormant follow-up artifacts that fulfill Trust Packet `outcome_plan.day_3`, `outcome_plan.day_7`, and `outcome_plan.day_30` commitments. They answer the audit question: after BLEU recommended a next step, did BLEU return to ask whether the Citizen followed it, benefited, experienced harm, or had updated measurements?

## Doctrine source

- The Bible positions BLEU as a governed wellness interface with audit trails and outcome proof, and says BLEUBox converts interactions into structured signal, safety, fit, evidence, decision, restraint, and outcome data over time. `_meta/THE_BLEU_BIBLE.md`.
- The Lens Architecture doctrine names five machines in series: Signal, Safety, Route, Outcome, and Memory. Outcome schedules/captures day-3 / day-7 / day-30 follow-up, while Memory records what happened so the next Signal→Route is sharper. `_meta/doctrine/lens_architecture_doctrine_v1.md`.
- The Trust Packet schema already requires `outcome_plan.day_3`, `day_7`, and `day_30`. `core/schemas/trust_packet_v1.1.schema.json`.
- The 2026-05-29 blueprint explicitly includes follow-up and an outcome loop, but its concrete loop centers on Day 7. This PR is therefore honest about extending the implementation shape to the doctrine-level `[3, 7, 30]` intervals rather than claiming the blueprint already fully specified all three checkpoints. `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md`.

## Files

- `core/schemas/outcome_checkpoint_v1.1.schema.json` — JSON Schema 2020-12 shape for the follow-up record.
- `core/agents/outcomes/outcome_capture.js` — dormant adapter with PII redaction and transition validation.
- `core/agents/outcomes/outcome_factory.js` — construction helpers that hash session ids and redact free text.
- `supabase/migrations/2026-06-01-outcome-checkpoints-table.sql` — SQL migration file only; not applied.

## Status values and transitions

- `scheduled` — initial state when the checkpoint is created.
- `captured` — Citizen responded with `self_report`; late capture from `missed` is allowed.
- `missed` — scheduled time passed without response; future cron sets this state.
- `declined` — Citizen explicitly declined to respond.
- `expired` — threshold after missed, typically 30 days past `scheduled_at`; future cron sets this state.

Valid transition discipline:

| From | To | Shape requirement |
|---|---|---|
| `scheduled` | `captured` | `captured_at` present and `self_report` present |
| `scheduled` | `missed` | `captured_at=null`, `self_report=null` |
| `scheduled` | `declined` | non-empty `decline_reason`, `self_report=null` |
| `scheduled` | `expired` | `captured_at=null`, `self_report=null` |
| `missed` | `captured` | late response allowed with `captured_at` and `self_report` |
| `missed` | `expired` | expired after threshold |
| `captured` | `captured` | idempotent captured update only |
| `declined` | `declined` | idempotent decline only |
| `expired` | `expired` | idempotent expiration only |

## Checkpoint days

Only `[3, 7, 30]` are valid in v1.1.

- **Day 3:** early adherence signal and initial side-effect detection.
- **Day 7:** weekly cycle complete; sleep, mood, energy, and early behavior patterns are more visible.
- **Day 30:** monthly cycle complete; longer trajectory, durability, and drop-off patterns are more visible.

If doctrine adds 60- or 90-day follow-ups, that requires a new schema version rather than silently expanding v1.1.

## Triple PII protection

1. **Schema:** `td_010_compliance.plaintext_in_free_text` is `const false`, alongside `plaintext_email_stored=false` and `plaintext_phone_stored=false`.
2. **Adapter:** `detectPlaintextPII()` redacts emails and common US phone formats before a captured checkpoint is returned for persistence.
3. **Factory:** `createCapturedCheckpoint()` automatically redacts `selfReport.free_text` before constructing the record.

This is intentionally redundant. Free-form follow-up channels are where Citizens are likely to paste phone numbers or emails. The schema, adapter, and factory each defend TD-010 from a different failure mode.

## Dormant-by-default activation sequence

1. Dr. Felicia signs outcome capture protocols at Tier 3, including clinically appropriate self-report questions, allowed measurement update fields, retention policy, and decline reason categories.
2. Captain applies the SQL migration manually through Supabase after that signoff.
3. Captain sets `OUTCOME_CAPTURE_ENABLED=true` in Render.
4. A future PR wires Twilio SMS and Resend email scheduling adapters for `delivery_channel="sms"` and `delivery_channel="email"`.
5. A future PR ships a cron job that calls `getDue()` daily and triggers delivery attempts through Twilio/Resend.

Until that sequence completes, this module is a shadow artifact only.

## Forward path

OutcomeCheckpoint history becomes the substrate for the Lexapro killer demo, Model Router scaffold, Trust Packet logging plumbing, Counterfactual capture infrastructure, and future Memory Machine activation. It does not modify `server.js`, `/api/chat`, Trust Packet schema, or any live delivery path in this PR.
