# 08 — Tangled Files Report

**Audit date:** 2026-05-21
**Criteria:** any file that mixes Presentation (P) + Application (A) + Domain (D) + Infrastructure (I) layers in a way that prevents isolated change.

Ordered by **value of decoupling × risk of leaving tangled.**

---

## 1. `index.html` — 13,992 lines · TANGLED · **#1 refactor target**

### What it does
The entire single-page application. **All 14+ tabs**, all UI, all client-side state, all Supabase fetches (auth + table reads + table writes), all chat fetches, the dimension scoring engine (9 scorers + BHI), the FHIR R4 export, the Stripe checkout handoff, the cart, the ISI modal, the Plausible event firing, the cookie consent, the service-worker registration, the manifest references, the schema.org markup blocks, all CSS, all SVG icons.

### Layers mixed
| Layer | Examples |
|---|---|
| **Presentation** | All HTML markup. All inline `<style>`. ~13K lines of UI. |
| **Application** | `_modeMap`, `_knownModes`, every fetch to `/api/...`, tab switching (`goTab`), cart flow, FHIR export. |
| **Domain** | Dimension scorers (`scoreSleep`, `scoreMind`, ... `scoreEcs`), `computeDimensionScores`, `computeBHI`, tier banding logic, ISI scoring + categorization (`Stable/Drifting/Fragmented`). |
| **Infrastructure** | Supabase JS client init, anon key embedded at `index.html:795`, direct PATCH/UPDATE to `profiles`, direct SELECT from `conversations`, `youtube_videos`, etc. Fullscript / Amazon / BetterHelp URL hardcoding. Stripe.js initialization and `redirectToCheckout` calls. |

### Concrete tangles surfaced in audit
- The `_passport` object is set on line 6885 by an Application fetch to `/api/personalize`, then the dimension engine in lines 8242 ff. reads from a *different* localStorage cache (`bleu_health`) that is populated by either manual entry (Domain-shaped) or file import (Infrastructure-shaped). Two parallel state paths for the same data.
- `syncHealthToSupabase` (line 7499) writes 10 columns to `profiles` via the anon key — Infrastructure code in a Presentation file.
- `startStripeCheckout` (line 12241) is named like it calls Stripe but actually does a direct `profiles` PATCH for a free Pioneer grant — naming is misleading and the side effect crosses layers.
- 12+ Jazz Bird mentions and schema.org publisher entity mixed throughout — see 06_CONTENT_ENGINE_AUDIT.md.
- 1+ Supabase RPC and direct PostgREST calls scattered across handlers (e.g., `index.html:3671` for Pioneer count).

### Proposed split (when ready)
1. **`public/index.html`** — markup only, no inline JS. Imports `<script>` modules.
2. **`public/app/state.js`** — single source of `_passport`, `bleu_health`, `bleu_cart` (Application).
3. **`public/app/api.js`** — every `fetch` to `/api/*` (Infrastructure adapter).
4. **`public/app/auth.js`** — Supabase auth wrapper.
5. **`public/app/dimension-engine.js`** — extract from lines 8034–8377. Move the pure functions to `core/dimensions.js` (Domain). Render bindings stay in the app module.
6. **`public/app/fhir-export.js`** — extract `exportFHIR` (line 9972).
7. **`public/tabs/*.js`** — one file per tab (home, dashboard, directory, vessel, passport, etc.). Tabs read from `state.js` and call into `api.js`.

### Effort, risk
- **L** (effort) · **HIGH** (risk of breaking production)
- The right migration is gradual: start by extracting the dimension engine (pure functions, easy tests) into `core/dimensions.js` and *importing* it from `index.html`. Then peel off one tab at a time. Do NOT do a big-bang rewrite.

### Blocking dependencies
- Domain layer in `core/` should be the destination of the pure logic — wire it first (server-side).
- `bleu-core/` may already contain the spine of this refactor — clarify its role before duplicating work.

---

## 2. `server.js` — 1,898 lines · TANGLED · **#2 refactor target**

### What it does
Node HTTP server. Every API endpoint. Every external integration. The entire `ALVAI_CORE` system prompt (~5 KB inline string). The 14 mode prompts (`MODE_PROMPTS`) plus 12 therapy + 7 recovery sub-mode prompts. The Stripe webhook with signature verification. The Twilio SMS sender + inbound webhook. Every external data API client (FDA, RxNorm, DailyMed, PubMed, USDA, ClinicalTrials, Open-Meteo, Spotify, Eventbrite, Meetup, Yelp). The Care Twin memory wiring. The SEO route handler delegation.

### Layers mixed
| Layer | Examples |
|---|---|
| **Application** | All 25 HTTP route handlers, SSE streaming, CORS, JSON helpers. |
| **Domain** | `ALVAI_CORE` system prompt (lines 46–228), 14 mode-prompt extensions, IRI 4-question intake instructions, Diamond Framework rules, banned-phrases list, emotional-intent detection regex, CI keyword scoring (line 1233), `PROTOCOL_MAP`, `EMOTIONAL_SESSIONS` in-memory state. |
| **Infrastructure** | OpenAI client, Supabase REST + RPC wrappers, Stripe webhook signature verification, Twilio SMS, every external HTTP fetch, embeddings via OpenAI, SSE write. |

### Concrete tangles
- The system prompt is a 5 KB string literal in `server.js`. Any clinical edit is a code edit. Versioning is git log.
- `pickModel` (line 706) embeds the Claude routing claim from CLAUDE.md but never picks Claude — domain logic disagrees with documentation.
- `checkEmotionalIntent` stores session state in module-scope `EMOTIONAL_SESSIONS` Set — works on a single instance, breaks on scale-out.
- Stripe price ID typo at line 1805 is a domain-level bug hidden in infrastructure code.
- `getClinicalPractitioners` mixes domain-routing (crisis/therapy regex) with infrastructure-fetch (Supabase REST) in one function.

### Proposed split
1. **`src/domain/alvai-core.js`** — the system prompt (eventually parsable so individual blocks can be tested).
2. **`src/domain/mode-prompts/<mode>.js`** — one file per mode + sub-mode.
3. **`src/domain/gates.js`** — the (currently non-existent) Five Gates implementation.
4. **`src/domain/intent.js`** — emotional intent detection, IRI detection, crisis detection (called by the gates).
5. **`src/domain/ci.js`** — replace the regex CI scoring with `core/ci.js` (already exists, unwired).
6. **`src/app/routes/chat.js`** — `/api/chat`, `/api/chat/stream`.
7. **`src/app/routes/practitioners.js`** — `/api/practitioners`, `/api/safety-check`.
8. **`src/app/routes/commerce.js`** — `/stripe-webhook`, `/api/reorder-reminder`, `/api/send-reorder-reminders`.
9. **`src/app/routes/seo.js`** — delegates to `seo-engine.js`.
10. **`src/infra/supabase.js`** — `querySupabase`, `callSupabaseRPC`, `embedText` (already isolated).
11. **`src/infra/openai.js`** — chat completions + embeddings.
12. **`src/infra/stripe.js`** — signature verification, webhook event parsing.
13. **`src/infra/twilio.js`** — `sendSMS`, inbound webhook handler.
14. **`src/infra/external-apis/<source>.js`** — one file each for FDA, RxNorm, DailyMed, PubMed, USDA, ClinicalTrials.

### Effort, risk
- **L** (effort) · **MEDIUM-HIGH** (risk)
- Server.js is easier to refactor than index.html because the boundaries between handlers are cleaner. Test the dimension/CI/ISI extraction first (it has the existing `bleu-core/test/loop.test.js` to lean on), then peel off the Stripe and Twilio modules (clean external boundaries), then peel off the external APIs.

### Blocking dependencies
- Should follow `core/` wiring decision so the new domain code lands in the chosen location.

---

## 3. `engine.py` — 1,172 lines · TANGLED · **#3 refactor target**

### What it does
The BEAST data pipeline. 10 source-scraper functions (NPI, FDA, Google Places, YouTube, Reddit, Amazon, PubMed, Open Food Facts, Yelp, iHerb), each making its own HTTP calls and writing directly to Supabase. Plus `--status`, `--source` dispatch, and a master cycle runner.

### Layers mixed
| Layer | Examples |
|---|---|
| **Application** | `--source` argparse dispatch, master scheduler shape, scrape_log writes. |
| **Domain** | Intent detection inside YouTube transcript parser; "biohacking + quantified self" tagging at line 464; product-category classification embedded in scrapers; `scrape_iherb` orphan (dead). |
| **Infrastructure** | Direct `requests.post(supabase + '/rest/v1/...')` everywhere. Hard-coded API endpoints. Claude API call. |

### Concrete tangles
- Each scraper opens its own Supabase client logic. No `supabase_writer.py` helper module.
- Product de-duplication and trust scoring is embedded inside `scrape_amazon`.
- Three sources (Reddit, Open Food Facts, Yelp) exist but are not in `--source` dispatch's BEAST schedule, so they only run if someone manually invokes `python engine.py` without `--source` (full cycle).

### Proposed split
1. `engine/sources/<source>.py` — one file per scraper (pure: takes a target spec, returns rows).
2. `engine/writers/supabase.py` — the only place that writes to Supabase.
3. `engine/cli.py` — `--source` dispatch + status.
4. `engine/scheduler.py` (optional) — if local-run scheduling ever exits the GitHub Actions cron.

### Effort, risk
- **M** (effort) · **LOW** (risk — pipeline is offline; bugs cause stale data, not user-facing crashes)
- Lower priority than server.js / index.html.

---

## 4. `seo-engine.js` — 767 lines · MOSTLY-CLEAN with embedded data

### What it does
SEO route renderer. Reads from Supabase (`practitioners`, `locations`, `seo_pages`), renders city pages, condition pages, practitioner profiles, the sitemap, and robots.txt. Plugged into `server.js:1025` as a module.

### Layers
| Layer | Examples |
|---|---|
| **Application** | `handleRoute` dispatcher. |
| **Infrastructure** | `sb.query`, `fetchJSON` callbacks. |
| **Content** | `CITY_META` — embedded copy ("Jazz, gumbo, second lines — a city that heals through rhythm and community") |

### Verdict
**Not severely tangled.** The boundary between rendering and data access is reasonable. Refactor candidates:
- Move `CITY_META` to a JSON file or to Supabase. Today it's a JS literal — editing requires a code deploy.
- Move the HTML templates into `views/*.html` files.
- The embedded Jazz Bird publisher in schema (see 06) is content, not architecture — fix at the data source.

### Effort, risk
- **S–M** (effort) · **LOW** (risk).

---

## 5. `autonomous-engine.js` — 752 lines · ORPHAN · DEAD-OR-STAGED

### What it does
Per its header, "Content factory, Google indexing, event scraper, product pipeline, ZIP intelligence, media generator, research indexer, protocol writer — runs 24/7 alongside server.js — every cycle makes the moat deeper."

### Layers
| Layer | Examples |
|---|---|
| **Application** | A scheduler with cycle counters, every 30 min / 2 hours / 4 hours / etc. dispatching to subroutines. |
| **Domain** | Content writing for condition × city pages, protocol writers. |
| **Infrastructure** | Direct API references (Google Indexing API, PubMed, etc.). |

### Status
**Module is never `require`d** by `server.js`, `seo-engine.js`, or `engine.py`. It exists as code but has no entry point in production. Either:
- DELETE (if the work is now done by `engine.py` + BEAST workflow)
- WIRE (if the autonomous cycle is the intended future state and someone needs to plug it in)

### Effort, risk
- **S** to delete · **L** to wire
- Action: ask the original author. Until decided, document as STAGED-DEAD.

---

## 6. `supabase/functions/alvai/index.ts` — 2,363 lines · AMBIGUOUS-DEAD

### What it does
A 20-agent / 6-super-field architecture (v5.0). Writes to 8 tables that the live `server.js` does not touch (`session_embeddings`, `commitments`, `user_arcs`, `emotional_signals`, `predictive_signals`, `care_twin_state`, `care_twin_embeddings`, `agent11_syntheses`). Header claims it is deployed at `sqyzboesdpdussiwqpzk.supabase.co/functions/v1/alvai`.

### Status
Per `docs/edge-function-investigation.md`: no in-repo caller. The shipped frontend points at Render. The Node server does not call `/functions/v1`. No DB trigger, no Supabase cron, no workflow deploy. The function may be running and taking traffic from a property outside this repo (CannaIQ frontend, city deployments), but cannot be proven from the repo alone.

### Effort, risk
- **S** to delete (if confirmed dead per dashboard invocation count)
- **M-L** to promote to LIVE (would require routing live traffic to it, requires confirming its memory writes don't collide with `server.js` writes to overlapping tables)
- Decision is **gated on the single resolution check** in the investigation doc: Supabase dashboard → Edge Functions → alvai → Invocations tab.

---

## 7. The DEAD pile — ~60 files

| Pattern | Files | Status | Action |
|---|---|---|---|
| `index (7-13).html` | 7 | DEAD | delete |
| `index.html.backup*` | 5 | DEAD | delete |
| `BLEU_*Nuclear*.html`, `bleu-master.html`, `nola-enhanced.html`, `nola-index*.txt` | ~10 | DEAD or WALL VIOLATION (Jazz Bird) | archive then delete |
| `bleu-3fixes.py … bleu-win.py` one-shots | ~17 | DEAD | archive |
| `home.py, home2.py, home3.py, master.py, mp2.py, ocean-deploy.py, ocean-enhance.py, rebuild.py, patch.py, patch-bleu.py, stream-upgrade.py, tank-filler.py, tab-dashboard.py, tab-directory.py, upgrade.py, fix-*.py` | ~20 | DEAD | archive |
| `server-old-claude.js, server-v4.js, server.js.backup` | 3 | DEAD | delete |
| `alvai-v3.ts` | 1 | DEAD (v3 of edge fn; superseded by v5 which is itself ambiguous-dead) | delete or move into `supabase/functions/alvai/_history/` |
| `cannaiq-new.html, ciq.py, inject-cannaiq.py` | 3 | WALL VIOLATION | delete or move to CannaIQ repo |
| `BLEU_*.zip, files (*).zip` | 10 archives, ~80 MB | DEAD | move to external storage (S3, Drive) and delete from repo |
| `1000, main` | 2 | empty files | delete |
| `.server.js.swp` | 1 | stray vim swap | delete, add `*.swp` to `.gitignore` |

### Effort, risk
- **S** · **LOW** — these can be moved to `_archive/` and reviewed in a follow-up.
- Recommend `git rm` after one final confirmation; the files live in git history for retrieval.

---

## 8. `bleu-core/` — a STAGED parallel implementation

### What it is
A nested mini-project with:
- `bleu-core/core/{ci,isi,state,trajectory,alvai,eventLogger}.js` — domain modules wired via `require`
- `bleu-core/server.js` — a small HTTP server consuming the core modules
- `bleu-core/test/loop.test.js` — **the only test in the entire repo**
- `bleu-core/package.json` — `start`, `test`, `validate` scripts
- `bleu-core/public/index.html` — minimal SPA

### Status
**Unclear.** Either:
- The intended replacement for the current `server.js + index.html` (in which case it should be promoted to root)
- A sandbox / scratchpad for the unwired `core/` modules (in which case it should be archived or moved to `_meta/sandbox/`)
- The "v2" / "next" version that is still being built

### Effort to resolve
- **S** to make the call · **M** to actually promote it to the live system if that's the call.
- Recommend: confirm with the author, write a `bleu-core/README.md` documenting its status, decide direction.

---

## Refactor sequencing

Recommended order (cheapest → most expensive, each enabling the next):

1. **Delete the DEAD pile.** 1 day. Removes 60 files. Makes the working set obvious.
2. **Clarify `bleu-core/` status.** 1 hour with author. Either promote, archive, or merge.
3. **Wire `core/*.js` into the live `server.js`.** Replace the regex CI keyword scoring (line 1233) with `core/ci.js`'s `computeCI`. Replace the parallel ISI sessionStorage logic with a single source of truth. ~1 day.
4. **Extract dimension engine** from `index.html:8034–8377` to `core/dimensions.js`. Add unit tests. ~1 day.
5. **Extract Stripe webhook** from `server.js:1810` to `src/app/routes/stripe.js`. Fix the Longevity Core bug while there. Add idempotency, fail-closed signature check, lifecycle handlers. ~2 days.
6. **Extract Twilio SMS** from `server.js`. ~½ day.
7. **Extract external-API clients** (FDA, RxNorm, DailyMed, PubMed, USDA, ClinicalTrials) into `src/infra/external-apis/*`. ~2 days.
8. **Extract ALVAI_CORE** + mode prompts to `src/domain/prompts/`. ~2 days.
9. **Move embedded CSS / SVG out of `index.html`** into a `public/css/` and `public/svg/`. ~2 days.
10. **Begin tab-by-tab extraction** from `index.html` to per-tab JS modules. Months, not days. Risk-weighted last.

Each step keeps the system running. No big-bang rewrite.
