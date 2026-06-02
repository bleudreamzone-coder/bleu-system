# Model Router Scaffold

Status: DORMANT — model router scaffold only; not imported by server.js.

## Architecture

The Model Router is the layer below BLEU agents. Agents define the work and the governed prompt envelope; the router decides which underlying model or inference service would execute that work after a future provider-wiring PR.

This PR treats routing as the Route primitive in the Bible's Five Machines and the Lens Architecture chain: Signal -> Safety -> Route -> Outcome -> Memory. In this scaffold, the router is limited to selecting and recording a `ModelRoutingDecision v1.1` audit record. It does not call OpenAI, Anthropic, local models, or any other provider.

The 2026-05-29 total system blueprint does not contain a dedicated model-router implementation section. The nearest blueprint references are application routes and public routing boundaries, not LLM provider routing. This scaffold therefore cites the Bible's Phase 7 Model Router Abstraction and this PR audit as the origin of the code-level interface.

## Complexity hint to tier-label mapping

| `complexity_hint` | Eligible tier labels | Rationale |
| --- | --- | --- |
| `trivial` | `fast` | Lowest-complexity calls should prefer the cheapest, lowest-latency tier. |
| `simple` | `fast`, `balanced` | Simple work can use fast models, with balanced as a fallback when budgets allow. |
| `moderate` | `balanced` | Moderate work should avoid both underpowered fast-only routing and unnecessary deep routing. |
| `complex` | `balanced`, `deep` | Complex work can start balanced but may need deeper reasoning capacity. |
| `deep_reasoning` | `deep`, `specialized` | Deep reasoning needs maximum reasoning capacity or a specialized model class. |

## Selection algorithm

`selectModelForRequest(request, modelRegistry)` is pure selection logic. It returns a `ModelRoutingDecision` or throws `RoutingError`.

1. Validate the routing request fields: `request_id`, `agent_id`, `agent_tier`, `complexity_hint`, `latency_budget_ms`, and `cost_cap_usd`.
2. Throw `REGISTRY_EMPTY` if no models have been registered. This PR registers none.
3. Build the allowed tier-label list from the complexity mapping above.
4. Filter registered models by allowed tier label.
5. For `tier_2_felicia` and `tier_3_felicia_autonomous`, filter out any model whose `clinical_appropriate` flag is not `true`.
6. Filter by `latency_p50_ms <= latency_budget_ms`.
7. Estimate cost from request token hints and ModelSpec per-token costs, then filter by `estimated_cost_usd <= cost_cap_usd`.
8. Sort by tier-match strength, then by estimated cost ascending, then by p50 latency ascending.
9. Select the top model and include up to three remaining filtered models as fallbacks.
10. Validate and return the `ModelRoutingDecision v1.1` record.

## Dormant activation sequence

1. Captain registers models via separate audit PR per provider. Example: `Add Anthropic Sonnet 4.7` would ship its own audit, ModelSpec, and Captain signoff.
2. For any model that will serve clinical-tier agent invocations, Dr. Felicia signs `clinical_appropriate=true` in a dedicated signoff doc at `_meta/clinical/signoffs/[date]-stoler-signoff-model-clinical-approval-[model-id].md`.
3. Captain configures provider API keys in Render environment variables, separate from the `MODEL_ROUTER_ENABLED` toggle.
4. Captain sets `MODEL_ROUTER_ENABLED=true` in Render.
5. A future PR wires `router.invoke()` to live LLM API calls using configured provider SDKs.

## Clinical safety floor

The router never auto-selects a model with `clinical_appropriate=false` for a `tier_2_felicia` or `tier_3_felicia_autonomous` agent. Enforcement happens at `selectModelForRequest` level, before decision creation.

The registry also rejects any ModelSpec with `clinical_appropriate=true` unless `felicia_signoff_doc` is present and references a real signoff document path. This mirrors the Tool Registry's Felicia signoff enforcement pattern.

## RoutingError codes

| Code | Meaning |
| --- | --- |
| `INVALID_REQUEST` | The caller provided a malformed routing request or registry facade. |
| `REGISTRY_EMPTY` | The registry contains zero models. This is the expected state for this scaffold. |
| `NO_MODEL_FITS_BUDGET` | Registered models exist, but none fit the complexity, latency, cost, and clinical constraints. |
| `INVALID_DECISION` | Internal decision construction failed the `ModelRoutingDecision v1.1` schema or cost cap cross-field check. |

## Explicit non-goals

- No models are pre-registered.
- No provider SDK packages are installed.
- No LLM API calls are made.
- `router.invoke()` always throws `NotImplementedError`.
- `server.js`, `/api/chat`, and Supabase Edge Functions are not wired to this router in this PR.
