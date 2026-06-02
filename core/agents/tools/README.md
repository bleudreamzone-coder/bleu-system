# Tool Registry Architecture — Shadow Mode

Status: DORMANT — tool registry scaffold only; not imported by server.js.

The Tool Registry is the dormant registration surface for future BLEU agent tools. It defines the shape a tool must satisfy before any agent may call it, but it does **not** register tools, invoke live APIs, or wire adapters in PR Juliet.

This PR translates the tool layer described in the institutional blueprint's Tool Layer Mapping / adjacent operational rails into an executable registration contract. The local blueprint currently labels Section 13 as the outcome loop, while Sections 12, 15, 16, and 17 identify Stripe, Twilio, Resend/email, Supabase governance, and observability rails that future tools must obey. The Bible still governs the discipline: BLEU engineering primitives stay bounded, auditable, and ordered before any citizen-facing action.

## Files

- `core/schemas/tool_registration_v1.1.schema.json` — one `ToolRegistration` record.
- `core/schemas/tool_invocation_log_v1.1.schema.json` — future audit row for every tool call.
- `core/agents/tools/tool_registry.js` — empty in-memory registry with validation and signoff enforcement.
- `supabase/migrations/2026-06-01-tool-invocation-log-table.sql` — migration file only; not applied.

## Anticipated tools

| tool_id | tool_class | Felicia signoff required | Captain signoff required | Notes |
|---|---|---:|---:|---|
| `rxnorm-adapter` | `clinical` | Yes | No | Medication terminology lookup; future adapter only. |
| `openfda-adapter` | `clinical` | Yes | No | Safety/event lookup; future adapter only. |
| `dailymed-adapter` | `clinical` | Yes | No | Label lookup; future adapter only. |
| `cyp450-engine` | `clinical` | Yes | No | Interaction reasoning engine; future adapter only. |
| `pubmed-adapter` | `clinical` | Yes | No | Evidence lookup; future adapter only. |
| `twilio-sms` | `communications` | No | Yes | Paid SMS service; future adapter only. |
| `resend-email` | `communications` | No | Yes | Paid email service; future adapter only. |
| `stripe-commerce` | `commerce` | Yes | Yes | Commerce and clinical/revenue boundary; future adapter only. |
| `supabase-data` | `data_layer` | No | No | Internal data layer/infrastructure; future adapter only. |

No row above is pre-registered in code. The registry instance ships empty by default.

## Empty-registry discipline

`createToolRegistry()` returns a fresh registry with zero tools. Future agent code must not assume any tool exists until a dedicated audit PR registers it.

```js
const { createToolRegistry } = require('./tool_registry');

const registry = createToolRegistry();
registry.list({}); // []
```

`invoke()` is intentionally dormant and throws `NotImplementedError`. A future PR must add the invocation path with retry, circuit-breaker, rate-limit, and log emission semantics before any tool can execute.

## Future Crisis Safety Agent pseudocode

The instructions field remains empty pending Dr. Felicia's signoff. This is pseudocode only; it is not a live tool adapter.

```js
const { createToolRegistry } = require('./tool_registry');

const registry = createToolRegistry();

registry.register({
  tool_id: 'rxnorm-adapter',
  tool_class: 'clinical',
  tool_version: '0.1.0',
  schema_version: '1.1',
  description: 'Medication terminology lookup for future crisis and medication-safety agents.',
  implementation_status: 'adapter_present',
  parameters_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  returns_schema: { type: 'object', properties: { matches: { type: 'array' } }, required: ['matches'] },
  rate_limit: { requests_per_minute: 30, burst: 5, throttle_strategy: 'reject' },
  felicia_signoff_required: true,
  felicia_signoff_doc: '_meta/signoffs/felicia/rxnorm-adapter.md',
  captain_signoff_required: false,
  captain_signoff_doc: null,
  data_classification: 'clinical_phi_avoid',
  td_010_compliance: { pii_hashed: true, plaintext_email_stored: false, plaintext_phone_stored: false },
  retry_policy: { max_retries: 2, backoff_strategy: 'exponential' },
  circuit_breaker: { failure_threshold: 3, reset_timeout_ms: 60000, half_open_max_calls: 1 },
  rollback_plan: 'Skip lookup, avoid medication-specific guidance, and route to human clinical review.',
  cost_class: 'free',
  audit_doc: '_meta/audits/future-rxnorm-adapter.md'
});

const crisisSafetyAgent = {
  agent_id: 'crisis-safety-agent',
  instructions: '', // pending Felicia signoff
  async run(signal, decision) {
    return registry.invoke('rxnorm-adapter', { query: signal.medication_text }, {
      agent_id: this.agent_id,
      session_id: signal.session_id,
      decision_id: decision.decision_id
    });
  }
};
```

## Activation sequence

Before `invoke()` may succeed for any real tool, that tool needs:

1. Its own bounded audit PR.
2. Adapter implementation in a clearly scoped module.
3. Felicia and/or Captain signoff docs, as required by tool class and authority.
4. A registry registration that passes `tool_registration_v1.1` validation.
5. Invocation wiring with retry, circuit-breaker, rate-limit, and `tool_invocation_log` emission.

The registry rejects registration for any Felicia-gated clinical tool missing `felicia_signoff_doc`. This is the moat: no clinical lookup becomes agent-callable without the human signoff artifact first.
