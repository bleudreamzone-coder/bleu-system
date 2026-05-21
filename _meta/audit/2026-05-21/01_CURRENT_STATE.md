# 01 — Current State

**Audit date:** 2026-05-21 · **Git tip:** `f70426a`
**Verification basis:** code-grep against shipped `index.html`, `server.js`, `seo-engine.js`, `engine.py`, `supabase/migrations/*` plus existing `docs/bleu-system-state.md` (2026-04-22) and its follow-ups. Where this audit could not verify a claim from outside the repo (Supabase dashboard, Render dashboard, Stripe dashboard, Plausible), it says so.

Status labels used: **LIVE** (in production, reachable, working) · **STAGED** (built but not yet user-facing) · **HALF-BUILT** (started, incomplete, buggy) · **DOCUMENTED-ONLY** (in markdown only) · **IDEA-ONLY** (strategy only).

---

## ALVAI engine

| Component | Status | Where | Verification |
|---|---|---|---|
| `/api/chat` (single-turn) and `/api/chat/stream` (SSE) | LIVE | `server.js:1079`, `1267` | Frontend hits `https://bleu-system.onrender.com/api/chat` (`index.html:7245, 13384, 13663, 13697`). No frontend caller of `/api/chat/stream` — endpoint is reachable but unreached. |
| Mode routing (14 tab modes) | LIVE | `server.js:242` (`MODE_PROMPTS`) | 14 modes resolved from request body `{mode}`. Frontend `_modeMap` (`index.html:9788`) routes tab → mode. |
| Therapy sub-modes (12) | LIVE | `server.js:479` (`THERAPY_MODES`) | Wired through `tm` query param; UI selectors at `index.html:5293–5524`. |
| Recovery sub-modes (7) | LIVE | `server.js:493` (`RECOVERY_MODES`) | Wired through `rm` query param. |
| Model router GPT-4o-mini / GPT-4o | LIVE | `server.js:706–714` | Crisis keywords → 4o; light modes → 4o-mini; default 4o. |
| Claude Opus fallback for clinical (CLAUDE.md claim) | **IDEA-ONLY** | — | No call to Anthropic anywhere in `server.js`. Claude is only invoked inside `engine.py` for YouTube transcript extraction. **CLAUDE.md claim of "5% → Claude Opus" is not implemented.** |
| Care Twin memory (pgvector semantic recall) | LIVE | `server.js:534–648, 1164–1175, 1248–1252` | `conversation_history` table + `match_conversation_history` RPC + 1536-dim OpenAI embeddings. Shipped 2026-04-22 (`999330f`). |
| Anonymous → authenticated memory merge | LIVE (just shipped) | `server.js:1455` `/api/memory/merge-anon`, `index.html:7704` | Wire 1 (`f70426a`, 2026-05). |
| Legacy `conversation_memory` dual-write | LIVE-but-deprecated | `server.js:1259–1260` | TODO at `server.js:1263` to remove after readers audited. |
| Emotional intent → commerce suppression | LIVE | `server.js:227, 1092, 1116, 1205, 1314` | Regex on session; SSE message `suppressCommerce:true` toggles UI cards. |
| Real-time clinical enrichment (FDA, RxNorm, DailyMed, PubMed, USDA, ClinicalTrials, Open-Meteo) | LIVE | `server.js:730–841` | All free APIs; fired in parallel per `detectIntent()`; 12 KB ceiling on prompt enrichment. |
| Verified-practitioner injection on clinical/crisis | LIVE | `server.js:937–977` | Pulls from `practitioners` table by ZIP/specialty. |
| Diamond framework (SEE / NAME / SHIFT / RELEASE) | LIVE-as-prompt | `server.js:46-228` (`ALVAI_CORE`) | Encoded in system prompt only. Not validated in code. |
| IRI (Impulse Regulation Index, GLP-1 routing) | **PROMPT-ONLY** | `server.js:176–194` | Pure prompt instructions. No structured intake, no enforced 4-question flow, no code branches. |
| ISI (Identity Stability Index) modal | LIVE-as-input, **HALF-BUILT** as data | `index.html:1119–1230` | Modal works, scoring works, prompt injection works. **Never written to Supabase** despite `user_coherence.isi_fusion_score` column existing. |
| Dimension engine (sleep/mind/movement/nutrition/social/finance/spirit/recovery/ecs) | LIVE | `index.html:8034–8377` | `computeDimensionScores()` + 9 pure scorers + `computeBHI()` + `renderDashboardBHI()` + `renderDimensionTiles()`. Persists `profiles.bhi_score`. Shipped in wire 4–6 (last 30 days). **v1 heuristic — not yet clinically reviewed.** |

---

## Vessel (home/landing)

| Component | Status | Where | Verification |
|---|---|---|---|
| Home tab (`#home`) | LIVE | `index.html:1254 ff.` | Hero, animated tagline, `_vp` static product master, Add-to-Cart. |
| Hero animation + product cards | LIVE | — | Static `_vp` array (Amazon affiliate tag `bleulive20-20`). |
| Supply (`#vessel`) supplement catalog | LIVE | `index.html:2448` | Static Gold/Silver/Bronze tiers, Amazon affiliate buttons, Add-to-Cart. |
| Cart drawer + floating pill | LIVE | `index.html` cart functions, recent commits `c2f5919`, `789c86b` | `showCartToast` added 2026-05 (wire 1a) to fix 8 silent regressions. |
| Cart safety intercept (CLEAR/CAUTION/FLAG before Amazon checkout) | LIVE | commit `338762c` | Per commit log. |

---

## Passport (auth + identity + health journey)

| Component | Status | Where | Verification |
|---|---|---|---|
| Email/password signup + sign-in | LIVE | `index.html:6889, 6908` (`doSignUp`, `doSignIn`) | Supabase Auth. |
| Auth-state observer + profile load | LIVE | `index.html:6883–6884`, `6935` (`showProfile`) | Hydrates from `profiles`, fills BHI ring + dashboard stats. |
| `/api/personalize` | LIVE-but-thin | `server.js:1566` | Returns only `{city, wellness_goals, medications, conditions}`. Does NOT return the 10 health columns the frontend writes. |
| Manual health data form (10 fields: weight/HR/HRV/sleep/steps/energy/anxiety/mood/meds/goal) | LIVE since 2026-04-22 migration | `index.html:7336, 7499` `syncHealthToSupabase` | Prior to 2026-04-22 migration, every write 400'd silently. After migration, writes persist. |
| File import (Apple Health XML, Oura JSON, wellness CSV) | LIVE | `index.html:7695` `handleHealthFileImport` | Persists same way as manual form. |
| FHIR R4 export (Patient + Observations + MedicationStatement + Goal) | LIVE | `index.html:9972` `exportFHIR` | Browser-side download only. No server upload. |
| Life-dimension tiles (9 in Passport, 5 on Dashboard) | LIVE since wire 4–6 | `index.html:8242, 8257` | Previously hardcoded `--`. Now derived from `computeDimensionScores`. |
| BHI ring (Dashboard) | LIVE since wire 5 (`b24c96c`) | `index.html:8277 renderDashboardBHI` | Previously hardcoded 466 ("Developing"). Now computed + persisted. |
| Session history list | LIVE | `index.html:6981 loadSessions` | Reads `conversations` table — but **nothing in this repo writes that table.** Either the edge function writes it externally, or the list is empty for every user. |
| Wellness focus chips (toggle 8 categories) | LIVE | `index.html:7393 toggleFocus` | localStorage only — does not sync to Supabase. |
| Pioneer / PRO upgrade buttons | LIVE | `index.html:12241 startStripeCheckout` (free Pioneer grant), `12280 startPaidCheckout` (paid Stripe) | **`startStripeCheckout` is misnamed — it does NOT call Stripe; it writes a free founding-citizen flag directly.** |
| Clear all + export full passport | LIVE | `index.html:7537, exportFullPassport` | Wipes localStorage + Supabase row. |
| Memory consent / retention policy | **DOCUMENTED-ONLY** in CLAUDE.md voice rules; not exposed to user | — | No UI control to opt out of conversation embedding. No retention TTL. |

---

## Products / Commerce

| Component | Status | Where | Verification |
|---|---|---|---|
| Stripe checkout for 4 protocols + PRO tier | LIVE | `index.html:12280 startPaidCheckout`, `supabase/functions/stripe-checkout/index.ts` | Uses `@stripe/stripe-js` redirectToCheckout. |
| Stripe webhook → activates protocol on `profiles` | LIVE-but-**BROKEN for Longevity Core** | `server.js:1701–1880`, `PROTOCOL_MAP` at `1803–1808` | **CRITICAL BUG**: `server.js:1805` maps `price_1TEKSWKcATmIFbojDTEJng9` (missing the `4`), but the frontend (`index.html:12785, 13757`) sends the correct `price_1TEKSWK4cATmIFbojDTEJng9`. Longevity Core payments succeed at Stripe but `active_protocol` is never set (falls back to `'pro'`). |
| Webhook signature verification | LIVE-but-gated by env | `server.js:1716` | If `STRIPE_WEBHOOK_SECRET` is missing the signature check is **skipped entirely**. Anyone can POST a fake checkout.session.completed event. |
| Subscription cancellation flow | **IDEA-ONLY** | — | No `customer.subscription.deleted` handling. No code path to clear `active_protocol`. |
| Renewal / downgrade / 12-month Pioneer expiry | **IDEA-ONLY** | — | No code that ages out the Pioneer founding tier. |
| Tax / VAT handling | **IDEA-ONLY** | — | No tax computation; Stripe Tax not configured per code. |
| Amazon Associates affiliate links (`bleulive20-20`) | LIVE | `index.html` (~30 references), `server.js` (in prompts), `engine.py:39` | Tag embedded in URLs. |
| Fullscript link-out (practitioner `fstoler`) | LIVE | `index.html` (30+ references), `server.js` prompts | No API integration — pure deep links. |
| Cart safety intercept | LIVE | per commit `338762c` | CLEAR/CAUTION/FLAG screen before checkout. |
| Affiliate click tracking | LIVE | `server.js:1391` `/api/track` writes `clicks` | Fire-and-forget; nothing in this repo reads `clicks` (analytics dashboard absent). |
| Plausible Analytics 8 event points | LIVE | `index.html:796` (script), 8 named events | `stack_add`, `ISI_complete`, `practitioner_click`, `IRI_trigger`, `safety_check_run`, `safety_check_result`, `cart_open`, `fullscript_click`. |

---

## Learn / SEO / Content

| Component | Status | Where | Verification |
|---|---|---|---|
| `/api/youtube` runtime search + fallback | LIVE | `server.js:1452–1477` | Falls back to hardcoded video IDs if `YOUTUBE_API_KEY` missing. |
| Learn tab video grid | LIVE | `index.html:4434 initVideoLibrary` | Reads `youtube_videos` Supabase table (populated by `engine.py`); hardcoded fallback. |
| Per-city SEO landing pages | LIVE | `seo-engine.js handleRoute`, served by `server.js:1664` | `SEO_CITY_SLUGS` at `server.js:1027 ff.` lists ~165 city slugs (US + a few international). |
| Per-practitioner SEO profile | LIVE | `seo-engine.js`, route `/practitioner/<npi>` | Reads `practitioners` by NPI. |
| `/safety-check` SEO page | LIVE | `seo-engine.js` | Generates from FDA+RxNorm lookups. |
| `/cities` directory of city pages | LIVE | `seo-engine.js` | |
| `cities/` static HTML (154 files, US only) | STAGED-OR-DEAD | repo root `cities/` | **Not served by `server.js`.** Either pre-rendered alternates or legacy fallback. |
| `dist/cities/` (4,214 global cities), `dist/anxiety/` (603), `dist/sleep/` (604), `dist/gut/` (603) | DOCUMENTED-AS-LIVE, **not served by `server.js`** | repo `dist/` | The dynamic SEO engine generates pages on-the-fly; these pre-rendered files are not wired into a route. Origin: prior content-factory runs (`autonomous-engine.js`?). |
| `sitemap.xml` at repo root | HALF-BUILT | `/workspaces/bleu-system/sitemap.xml` | **Contains 3 URLs only** (root, terms, privacy). Does NOT enumerate cities, practitioners, conditions, learn articles. `seo-engine.js` *also* serves `/sitemap.xml` dynamically — unclear which one wins in production. |
| Warm-cache on boot for city pages | LIVE | `server.js:1049 warmCache()` | Per commit `27b6936` — improves first-hit latency. |
| Google Search Console verification meta tag | LIVE | per commit `02ae294` | |
| `llms.txt` at site root | **NOT FOUND** | — | No `llms.txt` in repo. Not served by `server.js` static routes. |
| Schema.org structured data | LIVE (partial) | `index.html` Open Graph + schema.org references at lines `239, 957, 968, 984` | Coverage uncertified. |
| Reddit, Open Food Facts, Yelp pipeline sources | **HALF-BUILT** | `engine.py` has the functions; **not in `beast.yml` schedule** | Per `docs/bleu-system-state.md` §6.26 + workflow inspection. |
| iHerb pipeline source | DEAD | `engine.py:650 scrape_iherb` exists but not in `--source` dispatch | Removed from BEAST workflow in `ad1b6ab`. |

---

## Near You / City Intelligence

| Component | Status | Where | Verification |
|---|---|---|---|
| Per-city SEO landing page (dynamic, ~165 slugs in `SEO_CITY_SLUGS`) | LIVE | `seo-engine.js`, `server.js:1027` | |
| City + specialty combo page | LIVE | `seo-engine.js` | |
| City Map tab (NOLA wellness map) | **HALF-BUILT** | `index.html:3208 #map` | `_bleuMapRestart()` referenced on activation, **not defined**. |
| Geocoding via Nominatim | LIVE | `index.html:2265, 4751, 5781` | Free, no auth. |
| Weather widget (Open-Meteo) | LIVE | `index.html:2268`, `server.js:828 getWeather` | Hardcoded city → lat/lon map server-side. |
| Air quality (AirNow) | DOCUMENTED-ONLY | `engine.py:1018` env var declared, no caller traced | |
| City wellness reports (per `autonomous-engine.js` comment) | IDEA-ONLY | — | Module never invoked. |

---

## Practitioner Directory

| Component | Status | Where | Verification |
|---|---|---|---|
| NPI database in Supabase (`practitioners`, claim of 855K+) | LIVE | `engine.py:261, 965, 1005` writes; `server.js:937, 1153` reads | Row count not verifiable from this repo. |
| `/api/practitioners` search by ZIP / specialty | LIVE | `server.js:1354` | Per commit `2a48599`. |
| Featured providers / verified directory | LIVE | `marketplace_practitioners` table read by edge function only | Edge function = ambiguous-dead. Frontend "Featured providers" section in Directory tab (`index.html:2422`) shows "Loading…" — handler not located. |
| Clinical-threshold inject on crisis/therapy | LIVE | `server.js:937–977 getClinicalPractitioners` | Falls back to New Orleans if no city detected. |
| Per-practitioner SEO profile `/practitioner/<npi>` | LIVE | `seo-engine.js` | |
| Spotlight / governance review fields (`marketplace_approved`, `dr_felicia_reviewed`) | DOCUMENTED-AS-SCHEMA, **process unclear** | columns exist in `marketplace_practitioners` per edge function selects | No in-repo write path. Implies manual dashboard curation. |

---

## Worksite Wellness / Hospitality / Employer pilots

| Component | Status | Where | Verification |
|---|---|---|---|
| Worksite module | **IDEA-ONLY** | — | No tab, no endpoint, no UI in `index.html`. CLAUDE.md mentions it; code does not. |
| Hospitality mode prompt | **IDEA-ONLY** | — | No `hospitality` mode in `MODE_PROMPTS`. |

---

## City-level deployment (municipal / public health partnerships)

| Component | Status | Where | Verification |
|---|---|---|---|
| `enterprise` panel | HALF-BUILT | `index.html:10077` | Markup exists; mode is in `_modeMap` but routes to `general`. |
| Care Index push to municipalities (per edge function v5.0 doc) | IDEA-ONLY | — | Documented in `supabase/functions/alvai/index.ts` header only. |
| City-Care MCP integration (per edge function v5.0 doc) | IDEA-ONLY | — | Same. |

---

## Admin / Internal tools

| Component | Status | Where | Verification |
|---|---|---|---|
| `/api/debug/enrich` | LIVE | `server.js:1438` | Probes `detectIntent` + `enrichWithData` for testing. |
| `/api/stats` | LIVE | `server.js:1658` | Returns `{version, modes, therapy, recovery}`. No metrics. |
| `/health` | LIVE | `server.js:1077` | Returns env presence + engine string. |
| Operations dashboard / metrics view | **IDEA-ONLY** | — | No admin UI. `clicks`, `pageviews`, `sessions`, `scrape_log`, `daily_reports` are written but never read in-repo. |
| Logs centralization, alerting, incident runbook | UNKNOWN | — | Not in repo. Render gives default logs. |

---

## Critical cross-cutting gaps

1. **Stripe webhook bug — paid Longevity Core users do not get their protocol activated** (server.js:1805 typo). Detected in this audit; needs immediate one-character fix and a back-fill SQL for any affected customer rows.
2. **Webhook signature verification is conditional** on both `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET` being set. If either is missing in env, every POST to `/stripe-webhook` is accepted as valid. Should fail closed.
3. **The Supabase edge function `alvai/` (2,363 L) is not invoked from this repo.** Per `docs/edge-function-investigation.md`: shipped frontend calls Render directly. The edge function writes 8 tables that nothing in this repo reads — meaning those tables either receive traffic from a property outside this repo, or are dead. **This is the single biggest unknown in the system.**
4. **The `conversations` table is read by the Passport UI but never written by anything in this repo.** Session history list either displays edge-function writes or is permanently empty for every user.
5. **RLS policies are not in the repo.** Only one of three migrations even ships policies (none do). The Supabase dashboard is the only source of truth for access control on every user data table.
6. **`autonomous-engine.js` (752 L "content factory / 24/7 brain") is never required.** Either delete or wire it.
7. **`bleu-core/` is a parallel mini-implementation** with real domain code and the only test in the repo. Its status (replacement target? sandbox?) is not declared anywhere.
8. **No `llms.txt`, no enumerated XML sitemap.** The `sitemap.xml` at root has 3 URLs.
9. **CLAUDE.md's "10 sources" pipeline claim is overstated** — 6 scheduled, 3 implemented-but-orphaned, 1 dead.
10. **CLAUDE.md's "5% → Claude Opus" routing claim is not implemented at runtime** — Claude only runs in `engine.py` for YouTube transcripts.
