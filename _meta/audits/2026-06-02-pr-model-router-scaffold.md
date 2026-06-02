# PR Model Router Scaffold Audit — 2026-06-02

**Status:** Scaffold-only audit for Captain Soul-Gate review. No runtime activation, no provider SDKs, no registered models, no production API calls.

## Rationale

The Model Router creates the code-level routing layer below agents. It selects which underlying LLM or inference service would execute a future agent invocation based on agent tier, complexity hint, latency budget, and cost cap.

This audit cites:

- `_meta/THE_BLEU_BIBLE.md`, especially Phase 7 Model Router Abstraction: all AI calls route through one function, current/provider routing is abstracted, and the design layer lands before quantized or alternate model activation.
- `_meta/doctrine/lens_architecture_doctrine_v1.md`, which defines the lens as five machines in series: Signal, Safety, Route, Outcome, Memory. The Model Router is an infrastructure routing primitive inside the Route machine, not a replacement for clinical or safety routing.
- `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md`. I found no dedicated model-router implementation section in this blueprint. It mentions public application routes and DNS/public routing boundaries, but not LLM provider routing. This PR therefore surfaces that ambiguity honestly and treats the Bible Phase 7 plus this audit as the interface origin.
- `core/agents/_adapter/agent_interface.js`, which defines scaffold agents and their schema references. The router is the layer below future agent invocation, not a live agent implementation.
- `core/agents/tools/tool_registry.js`, which enforces Felicia signoff before clinical/Felicia-gated tool registration. The Model Registry mirrors that institutional safety floor for `clinical_appropriate=true` model registration.

## Complexity hint to tier-label mapping

| `complexity_hint` | Eligible tier labels | Rationale |
| --- | --- | --- |
| `trivial` | `fast` | Minimal work should use the lowest-latency tier. |
| `simple` | `fast`, `balanced` | Simple work can use fast models, with balanced as controlled fallback. |
| `moderate` | `balanced` | Moderate work needs stable quality without defaulting to deep reasoning. |
| `complex` | `balanced`, `deep` | Complex work can require deeper reasoning while retaining balanced options. |
| `deep_reasoning` | `deep`, `specialized` | Deep reasoning needs maximum reasoning or a specialized model class. |

The router filters by this tier mapping first, then applies latency, cost, and clinical eligibility constraints.

## Dormant-by-default activation sequence

1. Captain registers models via separate audit PR per provider. Each provider/model PR must include its own ModelSpec, audit trail, and Captain signoff.
2. For any model that may serve clinical-tier agent invocations, Dr. Felicia signs a dedicated clinical approval document at `_meta/clinical/signoffs/[date]-stoler-signoff-model-clinical-approval-[model-id].md`.
3. Captain configures provider API keys in Render environment variables. API keys remain separate from router activation.
4. Captain sets `MODEL_ROUTER_ENABLED=true` in Render.
5. A future PR wires `router.invoke()` to live LLM API calls using configured provider SDKs.

## Clinical safety floor

`clinical_appropriate=true` requires a Felicia signoff document at registration time. `createModelRegistry().register()` rejects clinical-flagged models unless `felicia_signoff_doc` is provided and references a real path.

`selectModelForRequest()` also enforces the runtime floor: `tier_2_felicia` and `tier_3_felicia_autonomous` routes never auto-select a model with `clinical_appropriate=false`.

## Forward path

Future per-provider PRs may register specific models such as Anthropic Sonnet 4.7, GPT-4o, local models, or other providers. Each must ship independently with audit documentation and Captain approval. Any model that can serve clinical-tier invocations requires a dedicated Dr. Felicia clinical signoff doc before `clinical_appropriate=true` can be registered.

## Scope controls

- Empty registry by default.
- No actual model registrations.
- No LLM SDK packages.
- No live OpenAI, Anthropic, local, or other provider calls.
- No `server.js` or `/api/chat` wiring.
- `router.invoke()` throws `NotImplementedError` until a future provider-wiring PR.
