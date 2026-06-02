# Metrics Architecture — MetricEvent v1.1

MetricEvent v1.1 is the dormant measurement substrate for future BLEU agent migration work. It defines the schema and helper factories for quantifiable system events, but it does **not** wire those events into `server.js`, `/api/chat`, route handlers, or Supabase at runtime.

The 2026-05-29 blueprint's Section 14 is Authentication, not Metrics. The closest blueprint section for this PR is Section 17 — Observability, which names safety triggers and Decision Object rows as review signals. `_meta/THE_BLEU_BIBLE.md` Part VII defines the metrics BLEU must care about: restraint, right-question rate, counterfactual catch rate, safety, fit, friction, evidence, outcome, and trust. PR India also records that the Memory Machine is a Five Machines concept in `_meta/doctrine/lens_architecture_doctrine_v1.md`; metric events support that memory role by recording what happened so future scorecards and counterfactual reviews can learn from it.

## Event types

- `chat_turn` fires for future user or assistant chat turns, including role, turn index, word count, and optional latency.
- `gate_fired` fires whenever one of the seven Decision Object gates evaluates with a status and reason.
- `refusal_triggered` fires when one of the twenty refusal doctrine checks requires a concrete action.
- `commerce_gate_state` fires when the commerce gate allows or blocks commerce based on first response, concern, support tier, or crisis tier state.
- `agent_invoked` fires around future agent calls and captures agent tier, handoff source, and latency.
- `tool_invoked` fires around future tool calls and captures invocation id, result status, retries, latency, and cost.
- `decision_emitted` fires when a Decision Object is emitted and captures gate status counts, refusal count, authority, and final action.
- `trust_packet_emitted` fires when a Trust Packet is emitted and captures the counterfactual class plus evaluator result.
- `error_caught` fires when future metrics-aware surfaces capture recoverable or critical errors after redacting plaintext PII from messages.

No event types may be added beyond these nine without a v1.2 schema and a new Captain Soul-Gate audit PR.

## Dormant activation sequence

1. Dr. Felicia signs the retention policy prerequisite from the Tier 4 master list item 4.1.
2. Captain applies `supabase/migrations/2026-06-01-metric-events-table.sql` manually in the Supabase dashboard.
3. Captain sets `METRIC_EMITTER_ENABLED=true` in Render environment variables.
4. Captain sets `METRIC_EMITTER_SINK=supabase` in Render environment variables.
5. A future PR wires emitter calls into `server.js` gate evaluation, refusal checks, agent invocation, tool invocation, Decision Object emission, Trust Packet emission, and error capture.

Until those steps happen, this PR is schema-only shadow infrastructure.

## Refusal 18 enforcement

Refusal 18 says BLEU will not inflate doctrine faster than functioning reality. The emitter therefore never throws to callers. Invalid schema data, sink failures, and internal errors are swallowed and logged with a `[METRICS]` prefix. A Supabase sink selection currently raises `NotImplementedError` internally and is dropped by the emitter until retention policy and migration activation are complete.

## TD-010 enforcement

MetricEvent v1.1 enforces TD-010 in the schema and helpers:

- `session_id` must match the hashed `h_` prefix convention.
- `td_010_compliance.pii_hashed` is present on every factory-created event.
- `td_010_compliance.plaintext_email_stored` is `const false`.
- `td_010_compliance.plaintext_phone_stored` is `const false`.
- `td_010_compliance.plaintext_phone_in_payload` is `const false`.
- `createErrorCaughtEvent()` applies `redactErrorMessage()` before assigning `event_data.error_message`.

`hashSessionId(rawSessionId)` produces `h_` plus the first 16 hex characters of a SHA-256 digest. `redactErrorMessage(message)` strips email addresses, phone-like patterns, and common API-key prefixes before an error message enters a metric payload.

## Future usage example

```js
const { createMetricEmitter } = require('./core/metrics/emitter');
const { createGateFiredEvent } = require('./core/metrics/event_factories');

const emitter = createMetricEmitter({});
const event = createGateFiredEvent({
  sessionId: 'raw-session-id',
  citizenId: null,
  gateName: 'crisis',
  status: 'hard_stop',
  reason: 'Crisis language requires immediate reroute.',
});

await emitter.emit(event);
```

This example is for future wiring only; Kilo does not call it from production code.
