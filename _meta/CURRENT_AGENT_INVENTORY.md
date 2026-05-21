# CURRENT AGENT INVENTORY — survey 2026-05-21

Stop-and-scan. Terse. File paths + line numbers.

---

## 1. AGENTS

### Where "agents" actually live in this repo

| Source | Path | Status |
|---|---|---|
| **v5 edge fn (catalog + impls)** | `supabase/functions/alvai/index.ts` (2,363 L) | **AMBIGUOUS-DEAD** — no in-repo caller per `docs/edge-function-investigation.md` |
| **v3 edge fn** | `alvai-v3.ts` (794 L) | **DEAD** — superseded by v5 |
| **Live runtime "agents"** (mode prompts + helpers in server.js) | `server.js` | LIVE |
| **`core/*.js` "agents"** (clean modules) | `core/{ci,isi,state,trajectory,alvai}.js` | STAGED — never `require`d |
| **`bleu-core/core/*.js`** (parallel impl + tests) | `bleu-core/core/*.js` | STAGED — sibling project |
| **`autonomous-engine.js`** | root | DEAD — never `require`d |
| Filenames containing "agent" | grep `find -iname '*agent*'` | **0 files** (zero matches outside .git/node_modules) |

### Bleu's "29 agents" claim

`index.html:12519` footer: `"… · 533 commits · 29 agents · Dr. Felicia Stoler …"`
`index.html:1878`: `"17-Agent Agentic System"`
`index.html:239` (og:description): `"Powered by 12 agents, 120 intelligence layers"`

Three different counts in shipped marketing copy. None of them match a code-resident inventory.

---

### Agent catalog — v5 edge function (`supabase/functions/alvai/index.ts`)

Header at lines 6–39. Function impls grep'd below.

| # | Name | Header L | Impl L | Status |
|---|---|---|---|---|
| 01 | Safety Shield (crisis classifier, 988/naloxone) | 7 | 129–180 (`runSafetyClassifier:151`) | implemented |
| 02 | Identity + State (Passport, FHIR, mode select) | 8 | — no discrete fn; threaded through `serve()` body | implicit |
| 03 | Memory (pgvector + commitments) | 9 | 182–270 (`retrieveMemory:184`, `retrieveCommitments:208`, `writeSessionMemory:222`) | implemented |
| 04 | Knowledge (PubMed/FDA/RxNorm) | 23 | 272–313 (`fetchPubMed:274`, `fetchFDAAlert:291`, `fetchRxNorm:302`) | implemented |
| 05 | Local Discovery (NPI search) | 24 | 315–345 (`searchPractitioners:317`, `searchProducts:335`) | implemented |
| 05b | Marketplace Practitioners (Felicia-vetted) | — body only | 347–393 (`searchMarketplacePractitioners:350`) | implemented |
| 06 | Transformation (Arc state, Tonight's Next Step) | 14 | 637–800 (`getArcContext:639`) | implemented |
| 07 | Orchestrator (Armstrong voice, constitutional) | 29 | inline in `serve()` 1995+ | implemented |
| 08 | Publisher (BEAST SEO, 222 cities) | 34 | **external** — runs in `engine.py` + `.github/workflows/beast.yml` | external |
| 09 | Predictive (CSD vigil, 72hr forecast) | 18 | 449–479 (`runPredictiveAnalysis:451`) | implemented |
| 10 | Emotional Resonance (linguistic biomarkers) | 13 | 394–447 (`writeEmotionalSignal:419`, `getEmotionalTrend:424`) | implemented |
| 11 | Causal Research (evidence A–D grading) | 25 | 481–636 (`runCausalResearch:596`, cache `checkSynthesisCache:581`) | implemented |
| 12 | Ecosystem Intelligence (federated learning, Ceiling Fn) | 35 | catalog-only; no impl | **stub** |
| 13 | Vision Intelligence (GPT-4o Vision) | 30 | 1660–1688 (`analyzeBLEUImage:1660`) | implemented |
| 14 | Sub-Agent Orchestrator (parallel, <600 ms) | 19 | catalog-only as agent 14; impl name reused for **Voice Output** at 1689 (`synthesizeAlvaiVoice:1695`) | **rename collision** |
| 14b | Voice Output (TTS-1-HD nova/onyx) | 37 | 1689–1729 | implemented |
| 15 | City Integration (MCP, Care Index upstream) | 31 | catalog-only; no impl | **stub** |
| 15b | Image Generation (DALL-E 3) | 38 | 1730–1787 (`generateBLEUImage:1764`) | implemented |
| 16 | Financial Navigation (insurance, FQHC $0) | 26 | catalog-only; no impl | **stub** |
| 16b | Care Twin Writer (JSON → care_twin_state) | 39 | 1788–1846 (`writeCareTwinState:1793`) | implemented |
| 17 | Semantic Search (embedding-first) | 36 | 1847–1989 (`runSemanticSearch:1920`, `generateEmbedding:1855`, `storeCareEmbedding:1890`) | implemented |
| 18 | Simulation Engine (behavioral likelihood) | 17 | 1563–1600 (`runSimulation:1569`) | implemented |
| 19 | Model Router (70/25/5 tier) | 20, 66 | 66–128 (routing block 101–128) | implemented |
| 20 | Trust Engine (trust arc per user) | 10 | 1507–1562 (`getTrustScore:1514`, `updateTrustScore:1531`) | implemented |
| — | Moderation (OpenAI moderation API) | — | 1601–1623 (`runModeration:1601`) | implemented, unnamed |
| — | Audio Transcription (Whisper) | — | 1624–1659 (`transcribeAudio:1624`) | implemented, unnamed |

**Catalog total: 23 numbered agents (01–20 + 14b/15b/16b) + 05b in body = 24.**
**Code impls: 18 implemented + 3 stubs (12, 15, 16) + 2 unnamed helpers + 2 implicit + 1 external = 26 functional positions.**
**Bleu's "29" appears nowhere in code as a count.** Closest reconciliation: 24 v5 catalog + 5 mode-prompt "agents" in `server.js MODE_PROMPTS` (general/dashboard/therapy/recovery/vessel) = 29. Speculative.

### Agent catalog — v3 edge function (`alvai-v3.ts`, DEAD)

| # | Name | Header L | Impl L |
|---|---|---|---|
| 01 | Safety Shield | 5 | 47 |
| 02 | Identity & State | 6 | — |
| 03 | Memory | 7 | 86 |
| 04 | Knowledge | 8 | 176 |
| 05 | Local Discovery | 9 | 219 |
| 06 | Transformation | 10 | 273 |
| 07 | Orchestrator | 11 | — |
| 08 | Publisher (external) | 12 | — |
| 09 | Predictive (Phase 2) | 13 | — |
| 10 | Emotional Resonance (Phase 2) | 14 | — |
| 11 | Causal Research (Phase 3) | 15 | — |
| 12 | Ecosystem Intel (Phase 3) | 16 | — |

**12 catalog, 6 partial impls, file is DEAD (no caller).**

### "Agents" that live in the actual runtime (`server.js`)

These are not labelled `AGENT NN` but they fill agent roles. The 5 KB `ALVAI_CORE` prompt is what the live system runs.

| Functional role | Path | Line | Status |
|---|---|---|---|
| ALVAI_CORE system prompt (Armstrong voice + Diamond Framework + IRI + ISI + commerce-follows-care) | `server.js` | 46–228 | LIVE |
| Mode prompts ×14 (general, dashboard, directory, vessel, protocols, learn, community, therapy, recovery, finance, cannaiq, map, passport, alvai) | `server.js` | 242–477 | LIVE |
| Therapy sub-mode prompts ×12 | `server.js` | 479–491 | LIVE |
| Recovery sub-mode prompts ×7 | `server.js` | 493–495 | LIVE |
| Crisis/therapy/search practitioner injector | `server.js` `getClinicalPractitioners` | 942–977 | LIVE |
| Drug-interaction enrichment (FDA/RxNorm/DailyMed/PubMed/USDA/CT.gov/Open-Meteo) | `server.js` `enrichWithData` | 879–935 | LIVE |
| Model router (gpt-4o-mini vs gpt-4o; crisis override) | `server.js` `pickModel` | 711–717 | LIVE |
| Emotional intent → commerce suppression | `server.js` `checkEmotionalIntent` | 232 | LIVE |
| CI scoring (keyword heuristic, NOT `core/ci.js`) | `server.js` | 1233 | LIVE |
| Care Twin memory (embed, store, recall) | `server.js` `embedText:559, storeConversationTurn:596, loadShortTermHistory:615, loadSemanticRecall:629, buildRecallBlock:639` | LIVE |
| Anon→auth memory merge | `server.js` `/api/memory/merge-anon` | 1455 | LIVE (shipped 2026-05) |
| Safety check (drug interactions) | `server.js` `/api/safety-check` | 1338 | LIVE — uses GPT-4o, not Claude |
| Directory lookup (live verified rows) | `server.js:1153` inside `/api/chat` | LIVE |
| Identity Stability Index modal | `index.html:1119–1230` | LIVE-as-input, no persistence |
| Dimension engine (9 scorers + computeBHI) | `index.html:8034–8377` | LIVE — v1 pending clinical review |
| `core/ci.js`, `core/isi.js`, `core/state.js`, `core/trajectory.js`, `core/alvai.js` | `core/*.js` | **STAGED — NEVER WIRED** |

---

## 2. ORCHESTRATION — `POST /api/chat` trace

Entry: `server.js:1079` (`if (pn === '/api/chat' && req.method === 'POST')`).

Sequential pipeline (per request):

1. **Parse body** `server.js:1083` → `{message, mode, session, user_id, passport_context, history, therapy_mode, recovery_mode, conversation_id}`.
2. **Emotional intent check** → `checkEmotionalIntent(session, message)` `server.js:1092`. Sets `EMOTIONAL_SESSIONS` in-memory Set; returns `suppressCommerce` boolean.
3. **Greeting cache short-circuit** `server.js:1095–1124`. If `message` in `GREET_CACHE` and mode is general/alvai/home, return SSE-streamed cached reply. **No OpenAI call.** End.
4. **Opening-line detection** `detectOpening(message)` `server.js:1127`. Returns a Diamond-Framework SEE line if intent regex matches sleep/anxiety/pain/sad/focus/energy/finance/recovery.
5. **Token cap** by mode `server.js:1138` (general 600, therapy/recovery 1000, vessel/protocols/cannaiq/finance 800).
6. **Model pick** `pickModel(message, mode)` `server.js:711`. Crisis regex → `gpt-4o`; light modes (community/map/missions/dashboard/learn/passport) → `gpt-4o-mini`; default `gpt-4o`. **Claude never picked despite CLAUDE.md claim.**
7. **Build system prompt** `buildPrompt(message, mode, tm, rm)` `server.js:985`. Composes in parallel via `Promise.all`:
   - `getClinicalPractitioners(message)` `server.js:942` — crisis/therapy/search keywords → SELECT verified rows from `practitioners` by ZIP/city/specialty
   - `enrichWithData(message, mode)` `server.js:879` → fires `detectIntent` (`server.js:844`) → parallel calls to FDA / RxNorm / DailyMed / PubMed / USDA / ClinicalTrials / Open-Meteo (4s timeout each)
   - `getPractitioners(message)` if therapist/doctor/practitioner regex matches
   - `getLocations(message)` if mode ∈ {community, map}
   - Concatenated, capped at 12,000 chars
8. **Prepend Passport context** if `p.passport_context` `server.js:1144`. Prepend opening line as FIRST LINE LOCKED.
9. **Directory lookup short-circuit** `server.js:1151–1166`. If message contains "therapist/doctor/practitioner/find me/near me/<ZIP>", run `querySupabase('practitioners', ...)` (3 rows) → inject as verified rows OR fallback to BetterHelp.
10. **Care Twin memory** `server.js:1168–1180`:
    - `resolveIdentity(p)` `server.js:587` → `{userId, convId, source}` (supabase_auth | anonymous_session)
    - If authenticated: `embedText(message)` `server.js:559` → text-embedding-3-small 1536-dim vector
    - `Promise.all([loadShortTermHistory(convId, 12), loadSemanticRecall(identity, embedding, 0.75, 5)])`
    - `loadShortTermHistory` `server.js:615` → `SELECT … FROM conversation_history WHERE session_id=convId ORDER BY created_at LIMIT 24`
    - `loadSemanticRecall` `server.js:629` → RPC `match_conversation_history` (service-role) with min_similarity 0.75, top 5
    - `buildRecallBlock(recall)` `server.js:639` → formats top matches under 6000 chars; prepended to system prompt
11. **Compose messages** `server.js:1184–1192` — `[{role:'system',content:sys}, ...shortTerm, {role:'user',content:message}]`.
12. **OpenAI streaming call** `server.js:1196–1201` — `fetch('https://api.openai.com/v1/chat/completions', {stream:true})`. 30s AbortController timeout.
13. **SSE response open** `server.js:1207`. Write `{suppressCommerce:true}` if applicable.
14. **Stream loop** `server.js:1210–1219` — parse `data:` chunks, write `{text}` per delta.
15. **Empty-stream fallback** `server.js:1221–1226` — if `full === ''`, write `getFallback(message)`.
16. **Persist (fire-and-forget after response ends)** `server.js:1232–1265`:
    - CI scoring (keyword heuristic) → `user_coherence`
    - `storeConversationTurn(user, message, embedding)` + `storeConversationTurn(assistant, full, embedding)` → `conversation_history`
    - Legacy dual-write → `conversation_memory` (TODO at `server.js:1263` to remove)

### Super-Field architecture in `alvai-v3.ts` / `supabase/functions/alvai/index.ts`

**Not reached at runtime.** The shipped frontend hits Render directly (`index.html:795` `ALVAI_URL = "https://bleu-system.onrender.com/api/chat"`). The 6-Super-Field structure in the v5 header (Field I Input → II Intent → III Simulation → IV Reality → V Control → VI Output) is design doctrine, not invoked code path. Per `docs/edge-function-investigation.md`: zero in-repo callers. Single resolution: Supabase dashboard → Edge Functions → alvai → Invocations tab.

Entry point if it WERE invoked: `supabase/functions/alvai/index.ts:1995` `serve(async (req) => { … })`. Inside that handler:
- Parses POST body
- Routes via Agent 19 model-router (lines 66–128)
- Fan-out across Field-grouped agents via inline awaits (no parallel `Promise.all` for cross-field; sequential)
- Streams response
- Tail: `storeCareEmbedding` + `writeCareTwinState` fire-and-forget

---

## 3. CURRENT WORK

### Last 30 commits (newest first)

```
f70426a wire 1: anon→auth conversation memory merge
789c86b wire 1a: define showCartToast (fixes 8 silent UX regressions)
69f09de wire 6: Dashboard stat boxes bound to dimension engine
b24c96c wire 5 Phase B: engine-driven Dashboard BHI with persistence
a518215 migration: add bhi columns to profiles
127a485 wire: dimension scoring engine v1 (heuristic, Stoler review pending)
06c7347 wire: hydrate health data from /api/personalize into localStorage
9644640 wire: /api/personalize always returns consistent health object
1d716f9 docs: pre-Block-1 investigation (edge function + Passport inventory)
be13999 migration: add passport health columns to profiles
688a7e6 docs: add BLEU system state audit (2026-04-22 snapshot at 999330f)
999330f Care Twin memory: cross-session conversation history with pgvector recall
2e77f0f Fullscript: add Daily Foundation Protocol, dedupe cards, standardize URLs
caf9a21 Alvai clinical: switch to zip-prefix lookup for practitioners
e1df1f2 Alvai: prepend verified practitioners on clinical thresholds
27bb588 Fullscript: ask for reorder phone once, then open in new tab
ad1b6ab CI: drop iherb step from BEAST workflow
02ae294 SEO: add Google Search Console site verification meta tag
3f5442e Analytics: add 8 Plausible event tracking points
b00cece BEAST: dedup city+state in get_cities() after flattening zones
e1d4bf7 BEAST: scrape every zone every run + add Zone 6 (63 cities)
bca616d BEAST: add Zone 5 (25 metro cities) to scrape rotation
363f907 SEO: add 94 new cities to CITY_META and SEO_CITY_SLUGS
338762c Cart: add CLEAR/CAUTION/FLAG safety intercept before Amazon checkout
8e097a9 Alvai IRI: swap ECS Support path for Regulation path
13e2ae9 Alvai: add IRI (Impulse Regulation Index) GLP-1 routing block
b8e6467 ISI: add Identity Stability Index entry modal
27b6936 SEO: warm city-hub cache on server boot
6581c1a SEO: add Featured Practitioners + Recent Research sections
e766bf9 SEO: add 9 cities, point DOMAIN at live render host
```

### Active workstream theme

**"Block 1" / "Wire 1–6"** — the post-April-22 push to close the Passport silent-400 bugs and make the Dashboard show real per-user numbers. Sequence:
- `be13999` migration: add 10 health columns to `profiles`
- `a518215` migration: add bhi_score + bhi_updated_at columns
- `127a485` wire 4: 9 dimension scorers + `computeDimensionScores`
- `9644640` `/api/personalize` consistency
- `06c7347` server→localStorage hydration
- `b24c96c` wire 5B: `renderDashboardBHI` + persistence
- `69f09de` wire 6: 5 Dashboard stat boxes bound to engine
- `789c86b` wire 1a: `showCartToast` fix (8 silent UX regressions)
- `f70426a` wire 1: anon→auth memory merge endpoint

### TODO / FIXME / HACK markers in active code

Only **1 load-bearing TODO** in production:

| File:line | Marker | Text |
|---|---|---|
| `server.js:1263` | TODO | `// TODO: remove after conversation_memory migration — audit readers first.` |

Other matches are non-actionable (SQL comments, section markers, the audit prompt itself).

### Roadmap / sprint / backlog files

None named that. The closest the repo has to a roadmap:
- `docs/bleu-system-state.md` (Apr 22 audit, with "Known gaps" sections)
- `docs/edge-function-investigation.md` (open question: is v5 alive externally?)
- `docs/passport-function-inventory.md` ("Smallest set of changes to make Passport feel real" — 6-step list at lines 177–188; #1, #2 done; #3, #4, #5, #6 partly done in wires 4–6)
- `docs/bhi-migration-20260422.md` ("Phase B" of wire 5 — done)
- `docs/passport-migration-20260422.md` (prereq doc — done)
- `_meta/audit/2026-05-21/11_NEXT_30_DAYS.md` (from this morning's audit — Bleu-week plan)

### In progress right now (inferred from commit cadence)

The wire sequence appears **complete through wire 6**. No commits ahead of `f70426a` on `main`. No open branches surveyed (would need `git branch -a` — `main` is current).

---

## 4. SHIP NEXT — 3 most ship-ready features

### #1 — Stripe Longevity Core protocol fix + back-fill
- **State:** typo at `server.js:1805` maps `price_1TEKSWKcATmIFbojDTEJng9` (missing `4`). Frontend (`index.html:12785, 13757`) sends correct `price_1TEKSWK4cATmIFbojDTEJng9`. Every paying Longevity customer is misclassified.
- **Files:** `server.js:1805` (1-char edit); back-fill SQL against `profiles` joining Stripe `stripe_customer_id`.
- **Blocked by:** nothing. Stripe Dashboard access to identify affected customers.
- **Effort:** S — < 1 hour code + ~1 hour back-fill.

### #2 — Schedule `/api/send-reorder-reminders`
- **State:** endpoint fully built at `server.js:1613`. Reads `user_coherence WHERE reorder_target_date=today AND phone IS NOT NULL`, sends SMS via Twilio. **Never fires** — no cron in repo.
- **Files:** new `.github/workflows/reorder-sms.yml` (daily cron) OR Render Cron Job. Bearer token gate on the endpoint.
- **Blocked by:** decide auth posture for the cron caller (bearer token, IP allowlist, or Stripe-style signature).
- **Effort:** S — 2 hours.

### #3 — Wire `core/` modules into live `server.js`
- **State:** 5 clean domain modules (`core/{ci,isi,state,trajectory,alvai}.js`, ~350 lines total) implementing CI formula `(p·.30)+(b·.25)+(i·.25)+(n·.20)`, ISI 6-dim with smoothing, trajectory linear-regression with labels (STABILIZING/LOOPING/DECLINING/BREAKTHROUGH_WINDOW), confidence-tier-driven prompt assembly. Tests exist at `bleu-core/test/loop.test.js`.
- **Replace:** the keyword heuristic CI scoring at `server.js:1233` (10 lines) with `computeCI` import. First pilot mode: vessel.
- **Files:** `server.js:1` add `const { computeCI } = require('./core/ci'); const { computeState } = require('./core/state'); const { buildSystemPrompt } = require('./core/alvai');`. Then replace `server.js:1233–1248` CI block.
- **Blocked by:** decide `core/` vs `bleu-core/core/` source of truth (currently duplicated — `bleu-core/core/` has the extra `eventLogger.js`).
- **Effort:** S–M — 1 day with the existing test as smoke check.

### Honorable mentions (close but not quite)

- **Stripe webhook fail-closed signature verification** (`server.js:1718`) — also S, also unblocked. Pair with #1 in one PR.
- **Crisis-hotline post-response validator** — designed in audit but no test corpus exists yet. Blocked on Felicia drafting 30–50 crisis messages.
- **Dimension engine extraction** — pure functions at `index.html:8034–8377` move cleanly to `core/dimensions.js`. Blocked on `bleu-core/` decision (issue above).
