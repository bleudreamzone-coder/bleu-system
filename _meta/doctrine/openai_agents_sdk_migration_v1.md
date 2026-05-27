# CONFIDENTIAL — FLEUR DE BLEUDREAM LLC TRADE SECRET

**OpenAI Agents SDK Migration Doctrine v1 — The Prism Bridge**
**Do not distribute. Inherits from [[source_document_v1]], [[lens_architecture_doctrine_v1]], [[refusal_doctrine_v1]], [[coca_cola_recipe_v1]].**
**Status:** DRAFT v0.1 — filed Day 80
**Review gate:** Captain + Dr. Felicia Friday (Day 82) review required for v1.0
**Last reviewed:** 2026-05-27

---

## Strategic decision (LOCKED Day 80)

BLEU.live migrates ALVAI's chat handler from the OpenAI Chat Completions API (hand-coded loops in `server.js`) to the **OpenAI Agents SDK + Responses API**.

Same vendor. Same `OPENAI_API_KEY`. Same models. Better framework.

> **Doctrine: GPT thinks. BLEU judges. ALVAI speaks.**

The Prism is BLEU's recipe and stays owned. The LLM is rented industrial intelligence. The migration relocates the recipe onto framework primitives without surrendering ownership of it:

| BLEU concept (owned) | SDK primitive (rented framework) |
| --- | --- |
| Prism Pre-Layer | `InputGuardrail` |
| Prism Post-Layer | `OutputGuardrail` |
| ALVAI's voice | `Agent` instructions |
| Conversation persistence | `Sessions` |
| Multi-state routing | `Handoffs` |
| Tool calls | function tools |
| Dr. Felicia clinical review | human-in-the-loop |
| Trust Packet logging | tracing hooks |

---

## Platform scope

This migration covers **BLEU.live ONLY**.

CannaIQ.net is a separate platform with separate codebase, separate deployment, separate doctrine. CannaIQ migration is a future decision (**Day 111+ target**) made by Captain solo, applying patterns proven in BLEU's migration.

---

## Four-phase plan

### Phase 1 — Day 81 (tomorrow): Proof-of-Concept
- Build `POST /alvai-agent-test` endpoint.
- **Production ALVAI completely untouched.**
- 4 new files: `prismRead.js`, `prismGate.js`, `routePacket.js`, `alvaiAgentTest.js`.
- 2 file edits: `package.json` (add `@openai/agents` + `zod`), `server.js` (1 line to register route).
- Test with 3 inputs: *"I can't sleep"* / *"I'm exhausted and need energy"* / *"I'm stressed and overwhelmed."*
- Side-by-side comparison vs production ALVAI.
- Audit at `_meta/audits/2026-05-27-prism-bridge-proof.md`.

### Phase 2 — Day 82–88: Expand flows
- Sleep, stress, energy, gut, weight.
- BLEU-specific state taxonomy refined per flow.
- Captain Soul-Gate at week boundary.

### Phase 3 — Day 89–95: Voice doctrine with Dr. Felicia
- 20–50 example ALVAI responses across states.
- Dr. Felicia clinical signoff on each.
- Refusal doctrine encoded as formal `OutputGuardrail` tripwires (see [[refusal_doctrine_v1]]).
- Crisis preservation as `Handoff` to crisis agent.

### Phase 4 — Day 96–110: Production cutover
- Internal traffic only (Day 96–100).
- 10% real traffic (Day 101–105).
- 50% real traffic (Day 106–108).
- 100% real traffic (Day 109–110).
- Old hand-coded ALVAI handler retired.

---

## What does NOT change

All 7 doctrine files in `_meta/doctrine/`. Trust Packet schema (BLEU-owned). Passport schema (BLEU-owned, lives in Supabase). Refusal doctrine (becomes formal guardrail definitions). Evidence ladder, Receptivity-Stability gate, Five Brains, Five Machines, three-voice stack, Coca-Cola recipe, seven seas, crisis preservation panel.

Dr. Felicia clinical authority + signoff process. All 62 Supabase tables (and 11 RLS-locked tables shipped Day 80). Stripe live mode + 4 protocol price IDs. Magic-link auth + order email + day-7 cron (shipped Day 80). `bleu_citizens`, `magic_links`, `bleu_comms`, `bleu_events`. Audit trail in `_meta/clinical/`.

CannaIQ federal protection (separate platform). Hospitality channel + Hotel Monteleone wedge. Founder narrative (3e + 28-year operator). Grant pipeline (RHTP submitted, MAHA ELEVATE submitted, RWJF HERA staged). Centurion parallel firm. Tulane partnership relationships. `bleu.live` domain. GitHub repo `bleudreamzone-coder/bleu-system`. Supabase project `sqyzboesdpdussiwqpzk`. Deployment platform (**verify Railway per [[../../CLAUDE.md]] before any deploy-dependent code**).

---

## What changes

Approximately **1,000–1,500 LOC of plumbing** in `server.js` relocated from hand-coded loops to SDK-configured patterns.

The conceptual architecture stays. The mechanical implementation moves from custom code to framework primitives.

---

## Economic justification

- **Cheap-then-expensive guardrail pattern:** cheap classifier (`gpt-4o-mini`) runs first, frontier model (`gpt-4o` or `gpt-5.5`) runs only on validated input. Expected **60–80% token cost reduction** at scale (500+ Citizens).
- GPT-5 reasoning trace continuity is available only on the Responses API. Currently lost on Chat Completions.
- Production-grade tracing/observability via OpenAI dashboard.
- `gpt-realtime` voice path opened for hospitality B2B demos.
- Provider-agnostic escape hatch preserved (SDK supports any OpenAI-compatible endpoint).

---

## Authority structure

- **Captain Bleu Garner** — strategic Soul-Gate authority.
- **Dr. Felicia Stoler** — clinical Soul-Gate authority (Friday deep-dive).
- **CC (Claude Code)** — senior engineer, executes the build.
- **Architect partner (Claude in chat)** — doctrine, pattern recognition, translation between layers.

---

## Status

DRAFT v0.1 filed Day 80. Friday Day 82 review with Dr. Felicia required for v1.0 expansion.
