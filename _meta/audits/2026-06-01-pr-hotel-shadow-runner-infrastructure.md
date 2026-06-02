# PR Hotel — Shadow Runner Infrastructure Audit

**Date:** 2026-06-01
**Status:** Infrastructure-only; dormant by default
**Scope:** `core/agents/shadow/`, shadow observation schema, Supabase migration file, schema fixtures, and package script inclusion

## Rationale

PR Hotel lays the parallel-observation infrastructure required before any BLEU agent can be considered for production traffic. The repository blueprint frames production promotion as a governed release discipline and places clinical review before promotion for sensitive artifacts. The Hotel prompt identifies this as the shadow-first migration path; the checked-in blueprint's Section 11 currently names the clinical review boundary, which is preserved here by requiring Dr. Felicia signoff before any agent is shadowed or promoted.

The BLEU Bible requires every interaction record to include Counterfactual proof, making the shadow runner a future capture point for what a candidate agent would have done differently from the live path. Shadow observations are not themselves the final Trust Packet; they are the dormant infrastructure that will let future candidate Decision Objects and Trust Packets be compared against live responses.

The lens architecture doctrine defines the compounding machine as Signal → Safety → Route → Outcome → Memory and separately requires hashing/auditing under TD-010. Shadow observations therefore store only hashed session identifiers and enforce `td_010_compliance` constants so implementation logs do not become plaintext PII storage.

## What Shipped

- `core/agents/shadow/shadow_runner.js` exports `createShadowRunner(config)` with `observe()`, `flush()`, and `isEnabled()`.
- `core/agents/shadow/shadow_config.js` reads safe env defaults for enablement, sink, and sample rate.
- `core/agents/shadow/shadow_observation_schema.json` defines the ShadowObservation JSON Schema 2020-12 contract.
- `supabase/migrations/2026-06-01-shadow-observations-table.sql` documents the future table and RLS policies as a file only. It was not executed.
- `core/agents/shadow/README.md` documents the dormant architecture, future registration shape, and activation sequence.
- `tests/agents/shadow/shadow-runner-shape.test.js` adds five shape fixtures.

## Dormant-by-default Activation Sequence

The shadow runner remains inactive unless every step below is completed manually:

1. **Felicia signoff:** Dr. Felicia signs off on the specific Tier 2 agent boundary being shadowed.
2. **Render env vars:** Captain manually sets `SHADOW_RUNNER_ENABLED`, `SHADOW_RUNNER_SINK`, and `SHADOW_RUNNER_SAMPLE_RATE` in the Render dashboard.
3. **Supabase migration:** Captain manually applies `supabase/migrations/2026-06-01-shadow-observations-table.sql` in the Supabase dashboard SQL editor.
4. **Sample-rate ramp:** Captain manually increments `SHADOW_RUNNER_SAMPLE_RATE` from `0.0` upward after reviewing initial observations.

The runner will never auto-enable. PR Hotel does not import the runner into `server.js`, `/api/chat`, Supabase functions, or any route handler.

## Safety Notes

- Refusal 18 is implemented as an operational constraint: shadow errors are swallowed and logged with `[SHADOW]`.
- `observe()` returns an empty array when disabled, sampled out, or no agents are registered.
- No actual agents are registered.
- The SQL migration is committed only as source documentation and was not applied.
- `anon` and `authenticated` roles receive no RLS policy on `shadow_observations`; only `service_role` policies are documented.

## Forward Path

- **PR India:** Memory schema, so captured observations can map into durable institutional memory without widening PII exposure.
- **PR Juliet:** Tool registry, so future candidate agents can declare tool boundaries before any runtime tool access is considered.

## Source References

- `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` — Section 11 clinical review boundary, release discipline, RLS/security, and observability expectations.
- `_meta/THE_BLEU_BIBLE.md` — Memory Machine and Counterfactual capture as institutional proof.
- `_meta/doctrine/lens_architecture_doctrine_v1.md` — five-machine lens and TD-010 hashing/audit infrastructure.
