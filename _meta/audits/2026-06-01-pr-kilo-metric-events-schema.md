# PR Kilo — Metric Events Schema (Shadow Mode)

**Status:** Schema-only shadow artifact. No runtime wiring. No SQL migration applied.
**Authorization:** Captain Soul-Gate, 2026-06-01.
**Clinical activation:** Dr. Felicia signoff is not required for this schema-only PR; live metric storage requires retention policy signoff first.

## Rationale

PR Kilo adds `metric_events` as the future time-series substrate for weekly scorecards, outcome checkpoints, and counterfactual reviews. Every future chat turn, gate result, refusal, commerce state transition, agent invocation, tool invocation, Decision Object, Trust Packet, and captured error can be represented as a MetricEvent v1.1 record.

Blueprint ambiguity note: `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` Section 14 is **Authentication**, not Metrics. This audit therefore does not fabricate a Metrics section citation. The closest blueprint basis is Section 17 — Observability, which names health checks, operational errors, messaging errors, and safety triggers/Decision Object rows as review signals.

Bible basis: `_meta/THE_BLEU_BIBLE.md` Part VII defines the metrics that matter for BLEU, including restraint, right-question rate, counterfactual catch rate, safety, fit, friction, evidence, outcome, and trust. PR India also records the Memory Machine as one of the Five Machines in `_meta/doctrine/lens_architecture_doctrine_v1.md`; Kilo supports that memory role by preserving measurable facts for later review.

Refusal doctrine basis: `_meta/doctrine/refusal_doctrine_v1.md` Refusal 18 says BLEU will not inflate doctrine faster than functioning reality. Kilo honors that by shipping only a dormant emitter and migration file.

## Nine event types

1. `chat_turn` records future user/assistant turns with role, turn index, word count, and optional latency.
2. `gate_fired` records future safety/commerce/outcome gate evaluations with gate name, status, and reason.
3. `refusal_triggered` records future refusal doctrine activations with refusal number, refusal name, and action taken.
4. `commerce_gate_state` records future commerce allow/block state with the tier flags that explain why commerce was allowed or denied.
5. `agent_invoked` records future agent calls with agent id, Decision Matrix tier, optional handoff source, and latency.
6. `tool_invoked` records future tool calls with invocation id, result status, latency, retries, and cost.
7. `decision_emitted` records future Decision Object emission with gate-status summary, refusal count, authority, and final action.
8. `trust_packet_emitted` records future Trust Packet emission with packet id, decision id, counterfactual class, and evaluator result.
9. `error_caught` records future captured errors with severity, recoverability, stack excerpt, and redacted message.

## TD-010 enforcement

TD-010 is enforced at schema and helper level:

- `session_id` must match `^h_[0-9a-f]{16}$`.
- `hashSessionId()` hashes raw session ids before factory-created events write them.
- `td_010_compliance.plaintext_email_stored` is `const false`.
- `td_010_compliance.plaintext_phone_stored` is `const false`.
- `td_010_compliance.plaintext_phone_in_payload` is `const false`.
- `createErrorCaughtEvent()` redacts email, phone-like values, and common secret prefixes before writing `event_data.error_message`.

## Dormant-by-default design

The emitter exposes `isEnabled()`, which returns true only when `METRIC_EMITTER_ENABLED === "true"`, and `getSink()`, which defaults to `buffer`. The default mode performs no live I/O. The Supabase sink is deliberately `NotImplementedError` and is swallowed by the emitter until retention policy signoff and manual migration application are complete.

This preserves Refusal 18 and prevents metrics infrastructure from breaking production. Every emission path catches schema errors, sink errors, and runtime errors, logs them with `[METRICS]`, increments dropped counters, and resolves without throwing.

## Files shipped

- `core/schemas/metric_event_v1.1.schema.json` — MetricEvent v1.1 schema with nine event types and oneOf-discriminated payloads.
- `core/metrics/emitter.js` — dormant stub emitter, hashed session helper, redactor, and event type constant.
- `core/metrics/event_factories.js` — one factory per event type.
- `supabase/migrations/2026-06-01-metric-events-table.sql` — migration file only, not applied.
- `core/metrics/README.md` — architecture, activation sequence, TD-010, and Refusal 18 documentation.
- `tests/schemas/metric-event.test.js` — eleven schema and emitter behavior fixtures.

## Forward path

PR Lima can build `weekly_scorecards` on this substrate. PR Mike can build `outcome_checkpoints`. PR November can build `counterfactual_reviews`. None of those should activate live retention or production emission until Dr. Felicia retention policy signoff and Captain migration/env-var activation occur.
