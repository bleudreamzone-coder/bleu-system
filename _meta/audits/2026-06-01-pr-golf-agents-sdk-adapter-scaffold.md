# PR Golf — Agents SDK Adapter Scaffold

**Date:** 2026-06-01  
**Status:** Scaffold-only infrastructure. No production behavior changed.

## Rationale

PR Golf lays down the adapter rails for the future BLEU agent migration without activating any agent behavior. The scaffold follows `_meta/THE_BLEU_BIBLE.md`, which places Agents SDK migration in Phase 10 and names specialized future agents such as Sleep, Stress, Energy, Gut, Crisis, Commerce Gate, and Orchestrator.

The design also follows `_meta/doctrine/lens_architecture_doctrine_v1.md`: BLEU is the lens between raw model light and the person, and that lens is built from the five machines in sequence: Signal, Safety, Route, Outcome, and Memory. The adapter leaves those machines intact by defining interfaces for agent definitions, tool contracts, handoff boundaries, and the future runner rather than changing the live chat handler.

The blueprint file `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` requires crisis safety, medication safety, evidence rules, claim boundaries, clinical review, commerce rails, outcome loops, and observability to remain governable. I did not find a Section 10 agent roster in that blueprint file; Section 10 is the claim-boundary section. The future agent roster is present in `_meta/THE_BLEU_BIBLE.md` Phase 10 and `_meta/doctrine/openai_agents_sdk_migration_v1.md`. The adapter therefore points future agents to Signal Object, Decision Object, and Trust Packet schemas through explicit `schema_refs`.

## How a future Crisis Safety Agent plugs in

A future Crisis Safety Agent would be defined with `defineAgent()` using a stable kebab-case id, a semver contract version, an empty-until-signed `instructions` field, a Tier 2 authority marker, `felicia_signoff_required: true`, and schema references to the Signal Object, Decision Object, and Trust Packet schemas. It would receive tool ids only after those tools are separately registered and clinically reviewed.

A handoff edge from an Orchestrator-shaped agent to that Crisis Safety Agent would be described with `defineHandoff()`. The handoff can record whether it emits a Decision Object entry. The live predicate remains `null` in this scaffold until a runner PR defines the shadow or production execution path.

A future runner implementation would call the agent through OpenAI Agents SDK or another provider-compatible agentic pattern, then return the RunResult contract: agent id, decision id, trust packet id, handoff chain, latency, and errors.

## Why scaffold-only

This PR intentionally refuses to outrun functioning reality. Refusal 18 applies: doctrine cannot become live behavior just because the shape is compelling. Clinical instructions, crisis language, medication boundaries, and live routing require Dr. Felicia signoff before activation.

The `instructions` field ships as an empty placeholder in examples. Tool implementations ship as `null`. `createRunner()` throws `NotImplementedError('Runner not yet wired')`. No route handler, `/api/chat` behavior, `server.js` path, Supabase function, crisis pattern file, or existing schema is modified.

## Forward path

1. PR Hotel: shadow runner infrastructure for parallel logging without production traffic changes.
2. PR India: durable memory architecture schema to replace process-local memory assumptions.
3. PR Juliet: tool registry schema for OpenFDA, RxNorm, CYP450, DailyMed, and related adapters.
4. Felicia signoff sprint: clinical boundaries and first signed instructions unlock the first real agent build PRs.

Until that sequence completes, the adapter remains infrastructure only.
