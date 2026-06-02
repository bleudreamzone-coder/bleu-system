# Shadow Agent Wiring

Status: DORMANT — shadow runner/wiring scaffold only; not imported by server.js.

This directory contains BLEU's dormant shadow infrastructure: the Shadow Runner observation source and the Shadow Agent Wiring subscription layer. The wiring scaffold lets future registered agents be observed beside production without changing a citizen-facing response.

## Source anchors

- `_meta/THE_BLEU_BIBLE.md` defines BLEU's mechanical primitives and the evidence discipline: classify the Signal, decide safely, record proof, then respond. Shadow comparison exists to support that proof layer before any candidate agent owns traffic.
- `core/agents/shadow/shadow_runner.js` is the PR #15 observation source. It creates `ShadowObservation` records while staying dormant-by-default and swallowing internal errors with the `[SHADOW]` prefix.
- `core/agents/_adapter/agent_interface.js` is the PR #14 adapter boundary for future agent implementations. Shadow wiring does not invoke real agents in this PR.
- `core/schemas/shadow_comparison_v1.0.schema.json` defines the hash-only `ShadowComparisonResult` record stored by `createShadowWiring()`.

## Architecture

Shadow Agent Wiring is the subscription layer between a future agent registry and Shadow Runner observations:

1. A future agent registers through `createShadowWiring(config).registerShadowAgent()` with an `agentId`, `agentTier`, and optional `observationFilter`.
2. Shadow Runner emits an observation window for the same Signal already handled by production.
3. A future integration supplies the production response and shadow response to `observeAndCompare()`.
4. Wiring hashes both responses, counts words, records whether the hashes match, and stores a schema-validated `ShadowComparisonResult`.
5. Production behavior remains unchanged. The record is only later parity evidence.

This PR does **not** register any actual agent, does **not** invoke a model, does **not** route through the dormant Model Router, and does **not** emit a real Trust Packet.

## Subscription model

`registerShadowAgent({ agentId, agentTier, observationFilter })` validates each subscription and returns a generated `subscription_id` on success. The subscription list ships empty by default. `getActiveSubscriptions()` and `getSubscriptionCount()` expose the in-memory subscription state for future audit wiring and tests.

The optional `observationFilter` is reserved for future Shadow Runner windows, such as `variant_tags`, `gates_required`, or other observation predicates. The current scaffold records the filter but does not use it to alter production behavior.

## Clinical agent gating

Clinical shadow agents are authority-gated at registration:

- `tier_2_felicia` requires `felicia_signoff_doc` in `createShadowWiring(config)`.
- `tier_3_felicia_autonomous` requires `felicia_signoff_doc` in `createShadowWiring(config)`.
- `tier_1_captain` and `tier_infrastructure` do not require clinical signoff for registration.

Registration without required Felicia signoff resolves with:

```js
{ registered: false, subscription_id: null, reason: 'clinical_agent_requires_felicia_signoff' }
```

The method resolves instead of throwing so shadow infrastructure cannot break production. This enforces Decision Matrix Tier 2/3 authority before any clinical agent can be attached to a shadow observation stream.

## Dormant-by-default activation sequence

Activation is intentionally manual and ordered:

1. Dr. Felicia signs clinical agent boundaries for the Tier 2/3 master list.
2. Captain enables Shadow Runner in Render with `SHADOW_RUNNER_ENABLED=true`.
3. Captain enables Shadow Wiring in Render with `SHADOW_WIRING_ENABLED=true`.
4. Captain registers agents through later per-agent audit PRs.
5. A future PR wires Trust Packet Logger consumption so shadow comparisons can become Counterfactual evidence.

Safe default: `createShadowWiring({}).isEnabled()` returns `false` unless `process.env.SHADOW_WIRING_ENABLED === 'true'`.

## Sinks

`SHADOW_WIRING_SINKS` is a frozen array:

```js
['buffer', 'stdout', 'supabase']
```

The default sink is `buffer`. `stdout` logs a hash-only comparison envelope. `supabase` is scaffolded but requires an injected client; no table write is attempted without it.

## TD-010 hash-only discipline

Shadow comparison records contain only:

- response hashes,
- response word counts,
- derived hash match status,
- derived word count delta,
- agent and observation identifiers,
- TD-010 compliance constants.

Raw production response text and raw shadow response text are never persisted in `shadow_comparison` records. `td_010_compliance.contains_raw_response_text` is schema-locked to `false`.

## Test discovery note

`tests/agents/shadow/wiring.test.js` ships with this PR but is **not** inserted into `package.json` `scripts.test:schemas` tonight. The future glob refactor PR will auto-discover it. Until that lands, verify this scaffold directly:

```bash
node tests/agents/shadow/wiring.test.js
```
