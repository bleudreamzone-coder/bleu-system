# PR Juliet — Tool Registry Schema (Shadow Mode)

**Date:** 2026-06-01  
**Status:** Registry shape, invocation-log schema, dormant registry adapter, migration file only. No tools registered. No live tool implementations wired.  
**Authorization:** Captain Soul-Gate. Dr. Felicia clinical signoff is not required for this registry-shape PR; it is required when future clinical tools are registered and wired.

## Rationale

Juliet lays the registration shape for the BLEU Tool primitive without activating the tool layer. The implementation is deliberately dormant: future agents can depend on a stable schema, but no RxNorm, OpenFDA, DailyMed, CYP450, PubMed, Twilio, Resend, Stripe, or Supabase tool is callable from this PR.

Doctrine references:

- `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` — the blueprint's operational rails identify commerce, messaging, database governance, observability, and outcome-loop dependencies that tools will eventually touch. Captain's prompt names Section 13 as Tool Layer Mapping; the checked-in document currently labels Section 13 as Outcome Loop, so Juliet cites the tool-relevant rails without rewriting the blueprint.
- `_meta/THE_BLEU_BIBLE.md` — the Bible defines the bounded mechanical primitive discipline: decompose, decide, record, respond. Tool use must remain subordinate to that ordered institutional flow.
- `_meta/doctrine/lens_architecture_doctrine_v1.md` — the lens doctrine requires safety, routing, outcome, memory, hashing, auditability, and human routing before raw automation can touch vulnerable citizen contexts. Juliet encodes retry, circuit-breaker, rate-limit, fallback, audit, and TD-010 constraints as registration fields.

## Anticipated tools and authority

| tool_id | tool_class | Authority / signoff need | PR Juliet status |
|---|---|---|---|
| `rxnorm-adapter` | `clinical` | Felicia signoff required before registration and invocation. | Not registered. |
| `openfda-adapter` | `clinical` | Felicia signoff required before registration and invocation. | Not registered. |
| `dailymed-adapter` | `clinical` | Felicia signoff required before registration and invocation. | Not registered. |
| `cyp450-engine` | `clinical` | Felicia signoff required before registration and invocation. | Not registered. |
| `pubmed-adapter` | `clinical` | Felicia signoff required before registration and invocation. | Not registered. |
| `twilio-sms` | `communications` | Captain signoff required because it touches paid external communications. | Not registered. |
| `resend-email` | `communications` | Captain signoff required because it touches paid external communications. | Not registered. |
| `stripe-commerce` | `commerce` | Captain and Felicia signoffs required because it touches paid commerce and clinical/revenue boundaries. | Not registered. |
| `supabase-data` | `data_layer` | Infrastructure/data-layer governance required; no live adapter in this PR. | Not registered. |

## Empty-registry-by-default discipline

The registry instance ships empty. `createToolRegistry().list({})` returns `[]`. This PR does not pre-register examples, fixtures, or dormant placeholder tools in runtime code.

`invoke()` always throws `NotImplementedError`. That preserves Refusal 18 discipline: the tool registry remains dormant after Juliet, and no future agent can accidentally call a live API through this surface.

## Signoff enforcement

`registry.register(toolSpec)` validates against `tool_registration_v1.1.schema.json`. If a tool is Felicia-gated and `felicia_signoff_doc` is absent or null, registration throws the Golf scaffold `NotImplementedError`.

The schema also makes `commerce` registrations require both Captain and Felicia signoff artifacts because Stripe-style paid commerce sits at the revenue/clinical boundary.

## TD-010 compliance

TD-010 is enforced at schema level:

- `td_010_compliance.plaintext_email_stored` is `const false`.
- `td_010_compliance.plaintext_phone_stored` is `const false`.
- `tool_invocation_log_v1.1` rejects top-level `parameters.plaintext_email` and `parameters.plaintext_phone` markers.
- The SQL migration adds corresponding `jsonb` key checks for the future audit table.

## Forward path

Each future tool receives its own bounded PR with:

1. Audit document.
2. Adapter implementation.
3. Felicia and/or Captain signoff docs as appropriate.
4. Registry registration.
5. Invocation path with retry, circuit-breaker, rate-limit, rollback fallback, and tool invocation log emission.

Only after those artifacts exist should `invoke()` stop throwing for that specific tool. Until then, Juliet is schema and shape only.
