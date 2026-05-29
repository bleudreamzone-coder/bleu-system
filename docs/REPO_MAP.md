# REPO_MAP.md — bleu-system

**Audit type:** read-only · **Audit date:** 2026-05-29 · **Branch:** `main` · **Commit:** `bd9ee4c`
**Author:** Claude Code (CC) · **Status:** no code/schema/deploy touched producing this document

This map is a foundation document. It exists so future decisions about migration, refactor, and feature work can be made from a complete picture of the system rather than from conversation memory.

Verification basis: live file reads (`wc -l`, `ls`, `grep`) on commit `bd9ee4c`; corroborated against the 15 prior audit documents in `_meta/audits/` (May 2026), which themselves grepped the same code. Anything I could not verify from inside this codebase is marked **🔍 unverified**.

Legend: ✅ live · ⚠️ partial / known issue · ❌ broken or missing · 🔒 built-but-off (deferred by design) · 🔍 unverified · 💀 dead/orphaned

---

## 1. Folder structure (top 3 levels)

```
bleu-system/
├── _meta/                          ← audit + governance artifacts (NOT shipped)
│   ├── audit/2026-05-21/           ← 11-doc full audit (May 21)
│   ├── audits/                     ← 15 follow-on audits (May 25–26)
│   ├── clinical/                   ← email_templates, sms_templates, signoffs
│   ├── doctrine/                   ← 17 doctrine docs (voice, refusal, lens, cron, etc.)
│   ├── followups/, schemas/        ← trust_packet schema, dated followups
│   ├── CURRENT_AGENT_INVENTORY.md, pre-merge-checklist.md
│   └── rls-audit-*.txt, wall-violations-*.txt
├── .github/workflows/              ← beast.yml (data pipeline), sms-reorder-cron.yml
├── bleu-core/                      ← 💀 parallel/orphaned standalone engine (see §14)
│   ├── core/                       ← alvai.js, ci.js, isi.js, state.js, trajectory.js, eventLogger.js
│   ├── public/index.html, server.js (176 LOC), package.json, test/loop.test.js
├── cities/                         ← static city HTMLs + 01-supabase-tables.sql (misfiled)
├── core/safety/                    ← crisis_validator.js + crisis_keywords.js + canonical_crisis_patterns.js
├── dist/                           ← ~335 pre-rendered SEO city × condition pages
├── docs/                           ← bleu-system-state.md, passport-*, wire-3-* + this file
├── js/bleu-prod-hooks.js           ← 841 LOC shared frontend module (nav, auth, stripe)
├── migrations/                     ← ⚠️ legacy SQL (3 files, ~May 2026, see §13)
├── node_modules/                   ← gitignored
├── supabase/
│   ├── functions/
│   │   ├── alvai/index.ts          ← 2,363 LOC edge fn (NOT the active chat path, see §10)
│   │   └── stripe-checkout/index.ts ← 61 LOC
│   ├── migrations/                 ← 17 SQL migrations (active source of truth)
│   ├── policies/                   ← policies-2026-05-21.sql + PROCEDURE.md + README.md
│   └── .temp/                      ← gitignored (CLI cache)
├── test-results/                   ← Playwright output (gitignored)
├── tests/
│   ├── browser/                    ← 3 Playwright specs (rail_a, rail_c, crisis)
│   ├── integration/                ← 4 .smoke.js + README (post-Day-80 promotion)
│   ├── crisis_validator.test.js, stripe-webhook.test.js
└── (root level — see §14 for 40 root-level .py files, most dead)
```

Heaviest files (LOC):
| File | LOC | Role |
|---|---|---|
| server.js | 4,162 | the production Node HTTP server (single-file monolith) |
| supabase/functions/alvai/index.ts | 2,363 | edge fn — NOT the active chat path |
| local.html | 1,733 | Local sea page |
| supply.html | 1,409 | Supply sea page |
| learn.html | 1,408 | Learn sea page |
| support.html | 1,384 | Support sea page |
| index.html | 1,309 | root / home sea |
| engine.py | 1,172 | data pipeline (10 sources, runs 4×/day via GHA) |
| js/bleu-prod-hooks.js | 841 | shared prod frontend wiring |
| seo-engine.js | 767 | static SEO page generator |

---

## 2. Purpose of each major folder and file

| Path | Purpose | Status |
|---|---|---|
| `server.js` | The production server — every API route, ALVAI prompts, BUD intercept, helpers (querySupabase, sendEmail, sendSMS, magic-link auth, Five Brains). | ✅ active |
| `index.html` + 4 sea HTMLs | The "Seven Seas" UI surfaces (root, /local, /supply, /learn, /support). Inline styles, inline IIFEs, all delegate to `window.*` exported by `js/bleu-prod-hooks.js`. | ✅ active |
| `js/bleu-prod-hooks.js` | Shared frontend: `sendPrompt`, `routeTo` (including `/signin` modal intercept), `startStripeCheckout`, `requestMagicLink`, verify-on-load, cart drawer. | ✅ active |
| `core/safety/` | Crisis detection — `detectCrisis`, `isCrisisPhrase`, canonical patterns. Shared with `server.js`. Has signoff in `_meta/clinical/signoffs/`. | ✅ active, governed |
| `engine.py` | Python data pipeline: NPI, FDA, Google Places, YouTube, Reddit, Amazon, PubMed, OFF, Yelp, iHerb. Runs 4×/day via `.github/workflows/beast.yml`. | ✅ active |
| `seo-engine.js` | Generates the ~335 city × condition pages in `dist/`. | ✅ active (build-time) |
| `supabase/migrations/` | **17 SQL migrations** — the source of truth for the DB schema. Applied via Supabase Management API (see memory: `apply-migrations-via-mgmt-api`). | ✅ active |
| `supabase/policies/` | RLS policy snapshots + procedure docs (one-time audit-driven). | ✅ reference |
| `supabase/functions/alvai/` | Edge function (Deno, ~2.3k LOC) — the **older** ALVAI implementation. The active chat path is `server.js` `/api/chat` + `/api/chat/stream`. Not invoked by the live frontend. | 💀 orphaned (see §10) |
| `supabase/functions/stripe-checkout/` | 61-LOC edge fn for Stripe checkout. Live frontend calls `server.js` `/api/stripe/create-session` instead. | 🔍 likely orphaned |
| `_meta/` | Internal audits + doctrine. **Not shipped to prod**. Last 3 weeks have been heavily audited (15 files in `_meta/audits/`). | ✅ reference |
| `_meta/doctrine/` | 17 doctrine docs — voice, refusal, lens, cron schedule, OpenAI Agents SDK migration (DRAFT v0.1, filed `bd9ee4c`). | ✅ reference, ⚠️ doctrine drift (see §13) |
| `_meta/clinical/signoffs/` | Dr. Stoler signoffs on crisis logic + canonical patterns. Governance paper trail. | ✅ governed |
| `bleu-core/` | A **standalone** 6-module engine (CI/ISI/trajectory/state/ALVAI loop) with its own server.js, package.json, and tests. Single commit (`5946650`). Not deployed; not wired to anything. | 💀 orphaned (see §14) |
| `dist/` | ~335 generated static SEO pages (city × condition). Served as static. Intentionally checked in (per `.gitignore`). | ✅ active |
| `cities/` | Static city HTML pages + one misfiled `01-supabase-tables.sql` (legacy schema dump). | ⚠️ misfile |
| `migrations/` | **Legacy** SQL dir (3 files). Superseded by `supabase/migrations/`. Last touched May 2026 (pre-Mission-6). | 💀 superseded (see §13) |
| `tests/` | Mixed: 2 unit/integration tests at root, 3 Playwright browser specs, 4 newly-promoted integration smoke tests (`tests/integration/`). | ⚠️ thin (see §15) |
| `node_modules/`, `test-results/`, `supabase/.temp/` | gitignored | — |
| **Root-level 40 .py files** (bleu-*, fix-*, home*, ocean-*, master.py, mp2.py, etc.) | 💀 **almost all dead** — historical patch scripts from initial repo import (April 23, 2026). Only `engine.py` is used. See §14. | 💀 dead |
| `BLEU_LIVE_MASTER_AUDIT_PROMPT.md` | 19-page audit prompt from May 23. Reference / spec, not code. | ✅ reference |
| `CLAUDE.md` | Project guidance for Claude Code. **⚠️ Stale on key numbers** — claims server.js is ~1,000 LOC (actual: 4,162) and index.html is ~12,500 LOC (actual: 1,309). Needs refresh. | ⚠️ stale |
| `railway.json` + `nixpacks.toml` | Railway deploy config. | ⚠️ **NOT the active deploy** — see §15 |
| `render.yaml` | Render deploy config (1 web + 2 cron services). | ✅ **active deploy target** |
| `playwright.config.js` | Browser test config (`baseURL: https://bleu.live`). | ✅ active |
| `package.json` | Single runtime dep: `resend`. Dev: `@playwright/test`. Node ≥ 18. | ✅ active |
| `requirements.txt` | Python deps: `requests`, `python-dotenv`, `youtube-transcript-api`. | ✅ active |
| `sw.js` | 6-LOC service worker. May serve stale assets after deploy. | 🔍 verify |
| `.env.secrets-to-paste`, `.env.smoke.template` | Local-only env scaffolding. Not committed values. | ✅ |

---

## 3. Frontend entry points (what ships to the browser)

| File | LOC | Served at | Role |
|---|---|---|---|
| `index.html` | 1,309 | `/` | Home / root sea — main ALVAI entry; sign-in modal trigger |
| `local.html` | 1,733 | `/local` | Local sea — practitioner finder, events, classes |
| `supply.html` | 1,409 | `/supply` | Supply sea — supplements, vessel/cart, Stripe checkout |
| `learn.html` | 1,408 | `/learn` | Learn sea — protocols, content |
| `support.html` | 1,384 | `/support` | Support sea — therapy/recovery routing |
| `privacy.html` | 1 line (minified) | `/privacy` | 9-section privacy policy. ⚠️ needs accuracy + attorney review |
| `terms.html` | 1 line (minified) | `/terms` | 12-section terms. ⚠️ age clause inconsistency (18+ vs 13+ with parental consent), refund window |
| `js/bleu-prod-hooks.js` | 841 | `/js/bleu-prod-hooks.js` (`<script defer>` in each sea) | The single shared frontend module |
| `sw.js` | 6 | `/sw.js` | Minimal service worker (cache risk 🔍) |
| `manifest.json`, `robots.txt`, `sitemap.xml`, `favicon*`, `apple-touch-icon.png` | — | static assets |
| `dist/*.html` | ~335 files | `/<slug>.html` | Pre-rendered SEO pages (city × condition) |

**Frontend characteristics:**
- No framework, no build step. Vanilla JS.
- Styles **inline per page** (no shared CSS file → palette drift risk across seas).
- Each sea HTML has an inline IIFE that wires page-local UI and delegates to `window.*` exports from `bleu-prod-hooks.js`.
- Only 3 `@media` queries in `index.html` → **thin mobile responsiveness** (Card B traffic is phone-first).
- 0 `alt=` attributes in `index.html` → a11y gap.

**Source of truth:** `_meta/audits/2026-05-26-frontend-inventory-audit.md`.

---

## 4. Backend entry points

### Active runtime
- **`node server.js`** — single Node HTTP server, no Express, no framework. Started by `npm start` (Render web service). Port from `PORT` env (Render assigns).

### Sectional layout of `server.js` (4,162 LOC, banner comments)
| Lines | Section |
|---|---|
| 1–217 | env/config, `sendSMS`, `ALVAI_CORE` prompt |
| 218–784 | **BUD V5 / CannaIQ intercept** (~560 LOC subsystem — see §11) |
| 785–1130 | fallback + session-intent (commerce suppression during crisis) |
| 1131–1172 | `querySupabase` helper |
| 1173–1247 | audit helpers: `hashEmail`, `hashPhone`, `logEvent`, `logDecision` |
| 1248–1302 | Trust Packet: `buildTrustPacket`, `logTrustPacket` (🔒 not wired onto routes yet) |
| 1303–1380 | Comms: `sendEmail` (Resend) |
| 1381–1458 | Auth: magic-link — `sessionSecret`, `signSession`, `verifySession`, `parseCookies`, `getSessionCitizen`, rate limiter |
| 1459–1536 | Day-7 outcome capture + `twilioSignatureValid` |
| 1537–1660 | **Five Brains** (`intentBrain`, etc.) |
| 1662–2039 | Additional brains, memory helpers (`conversation_history` + pgvector) |
| 2040–2412 | Routing, intent detection, enrichment, SEO engine call |
| 2413–end | HTTP server + all route handlers + crisis regression harness |

**Source of truth:** `_meta/audits/2026-05-26-server-architecture-audit.md`.

### Edge functions (Supabase)
| Path | LOC | Status |
|---|---|---|
| `supabase/functions/alvai/index.ts` | 2,363 | 💀 not the active chat path; superseded by `server.js` `/api/chat[/stream]`. Last meaningful commit predates the Mission-6/7 work. Per `_meta/doctrine/openai_agents_sdk_migration_v1.md` (Day-80 DRAFT v0.1), the **future** ALVAI runtime is OpenAI Agents SDK — not this edge fn. |
| `supabase/functions/stripe-checkout/index.ts` | 61 | 🔍 likely orphaned; live frontend calls `server.js` `/api/stripe/create-session`. |

### GitHub Actions
| Workflow | Schedule | Purpose |
|---|---|---|
| `.github/workflows/beast.yml` | 4×/day | Runs `engine.py` data pipeline |
| `.github/workflows/sms-reorder-cron.yml` | — | SMS reorder cron via GHA (overlaps with Render cron — see §13) |

### Render services (from `render.yaml`)
| Service | Type | Wakes |
|---|---|---|
| `bleu-system` | web | `npm start` → `node server.js`, auto-deploys on push to `main` |
| `bleu-reorder-reminders` | cron `0 14 * * *` UTC | `curl POST /api/send-reorder-reminders` (Bearer `REORDER_CRON_SECRET`) |
| `bleu-day7-outcomes` | cron `0 15 * * *` UTC | `curl POST /api/send-day7-outcomes` (same Bearer) |

---

## 5. All API routes (from `server.js`, enumerated by `pn === '/path'` match)

| # | Path | Method | Auth | Purpose | Line |
|---|---|---|---|---|---|
| 1 | `/api/ping` | GET | none | health | 3035 |
| 2 | `/api/stats` | GET | none | mode counts | 3783 |
| 3 | `/api/chat` | POST | none (session if present) | ALVAI single-turn | 2463 |
| 4 | `/api/chat/stream` | POST | none (session if present) | ALVAI streaming (SSE) | 2697 |
| 5 | `/api/plan/add` | POST | session | cart add | 2842 |
| 6 | `/api/plan/get` | GET | session | cart fetch | 2891 |
| 7 | `/api/plan/remove` | POST | session | cart remove | 2906 |
| 8 | `/api/plan/continue` | POST | session | cart resume | 2932 |
| 9 | `/api/safety-check` | GET | none | FDA + RxNorm drug interactions | 2962 |
| 10 | `/api/practitioners` | GET | none | 855K+ NPI directory lookup | 2978 |
| 11 | `/api/track` | GET | none | affiliate click tracking + redirect | 3008 |
| 12 | `/api/session` | POST | none | mint session row | 3042 |
| 13 | `/api/memory/merge-anon` | POST | session | merge anon → citizen | 3080 |
| 14 | `/api/memory/delete-all` | POST | session | citizen data deletion | 3163 |
| 15 | `/api/debug/enrich` | GET | none | enrichment diagnostics | 3242 |
| 16 | `/api/youtube` | GET | none | YouTube proxy | 3257 |
| 17 | `/api/spotify` | GET | none | Spotify proxy | 3286 |
| 18 | `/api/events` | GET | none | events lookup | 3314 |
| 19 | `/api/meetup-events` | GET | none | Meetup proxy | 3334 |
| 20 | `/api/yelp` | GET | none | Yelp proxy | 3355 |
| 21 | `/api/personalize` | POST | session | personalization | 3370 |
| 22 | `/api/reorder-reminder` | POST | session | schedule reorder | 3409 |
| 23 | `/api/send-reorder-reminders` | POST | Bearer cron | cron handler — sends SMS reorder reminders | 3439 |
| 24 | `/api/send-day7-outcomes` | POST | Bearer cron | cron handler — sends day-7 outcome SMS | 3485 |
| 25 | `/api/sms/inbound` | POST | Twilio sig | inbound SMS (signed; day-7 + opt-out) | 3516 |
| 26 | `/twilio-reply` | POST | ⚠️ **none + no sig check** | legacy inbound (reorder YES/no); overlaps #25 | 3577 |
| 27 | `/stripe-webhook` | POST | Stripe sig + idempotency | activates protocol, fires order-confirmation email | 3644 |
| 28 | `/api/stripe/create-session` | POST | none | Stripe Checkout session | 3646 |
| 29 | `/api/auth/magic-link` | POST | none (no-enum) | magic-link request → writes `magic_links`, `bleu_comms`, `bleu_events` | 3685 |
| 30 | `/api/auth/verify` | POST | one-time token | atomic single-use consume; mints `bleu_session`; find-or-create `bleu_citizens` | 3736 |
| 31–33 | `/health`, route fallbacks, static file serving | mixed | | served by tail of the handler | — |

(Total **30 explicit `/api/*` + 3 ancillary** = 33 per server-architecture-audit's count.)

**Active session helper:** `getSessionCitizen` (line 1435) is built but **not yet consumed by any route** — sessions mint but aren't read (#15 in §15).

---

## 6. Supabase usage

**62 public base tables** (Day-80 inventory via Management API). 9 FK relationships exist (Mission-6/7 graph properly related; ~50 pipeline tables intentionally denormalized scraper sinks).

Helper: `querySupabase(table, query, limit, method, body)` at `server.js:1132` — REST API via service-role key.

### Tables touched by `server.js` (from grep)
| Table | Routes / callers | Notes |
|---|---|---|
| `bleu_events` | logEvent, chat, magic-link, verify, plan, sms inbound, more | audit table |
| `bleu_decisions` | logDecision | audit table |
| `bleu_comms` | magic-link request, sms cron, sms inbound, stripe webhook | comms ledger (hashed recipient) |
| `bleu_citizens` | magic-link, verify, stripe webhook | citizen find-or-create |
| `bleu_plan` / `bleu_plan_events` | `/api/plan/*` | cart + plan events |
| `bleu_catalog` | plan/add, cart UI | product catalog (incl. Fullscript Rail B seeded) |
| `bleu_commerce_settings` | commerce gates | kill-switch + settings |
| `bleu_open_windows` | open-window logic | commerce timing |
| `magic_links` | verify, magic-link request | atomic single-use token |
| `stripe_processed_events` | stripe webhook | replay-window idempotency |
| `conversation_history` | chat, memory | message persistence (also pgvector) |
| `conversation_memory` | memory delete-all | citizen-level memory |
| `user_coherence` | personalize, reorder, sms cron | resolves phone for day-7 |
| `practitioners` | `/api/practitioners`, chat enrichment | ~434k rows |
| `locations` | `/api/practitioners` | ~23k rows |
| `profiles` | `/api/personalize` | Stripe-integrated profile |
| `affiliate_clicks` | `/api/track` | click logging (renamed from `clicks`) |
| `pageviews` | `/api/ping` (page log) | telemetry |
| `sessions` | `/api/session` | session creation/lookup |

### RLS posture (Day-80 close)
- **All Mission-6/7 + audit tables:** RLS on, no anon/auth grants. ✅
- **Sensitive tables locked Day-80** (p0 + p8 + p8b, 11+ tables): RLS on, no grants. ✅
- **Public reference tables** (anon read by design): cities, classes, conditions, food_sources, protocols, pubmed_studies, reviews, seo_pages, symptom_specialist_map, youtube_videos.
- **~25 tables RLS off but no anon/auth grants** (service-role only): acceptable; belt-and-suspenders would be RLS-on.
- **🔍 11 tables RLS off AND anon/auth granted** (carried from Day-80 audit, needs review): `dr_felicia_reviews`, `practitioner_bookings`, `care_twin_patterns`, `marketplace_practitioners`, `safety_checks`, `symptom_specialist_map`, `product_practitioner_links`, `workforce_signals`, `validation_log`, `daily_reports`, `reddit_mentions`. If any hold PII, anon can read.

### Custom RPCs
`calculate_practitioner_trust`, `calculate_product_trust`, `calculate_user_lss` — exist; **🔍 not traced to current callers** (may be dead — audit candidate).

**Sources of truth:** `_meta/audits/2026-05-26-supabase-schema-audit.md`, `_meta/audits/2026-05-26-total-system-audit.md` §SECTION 2.

---

## 7. Stripe usage

| Surface | Where | Status |
|---|---|---|
| Checkout session creation | `server.js:3646` `/api/stripe/create-session` | ✅ kill-switch aware |
| Webhook handler | `server.js:3644` `/stripe-webhook` → `handleStripeWebhook` | ✅ signature + 300s replay window + idempotency via `stripe_processed_events` |
| Webhook side-effects | `bleu_events` purchase row · profile/protocol activation · `bleu_citizens` find-or-create · **Wave-9 order-confirmation email** via Resend | ✅ |
| Price IDs (from `bleu-prod-hooks.js` CONFIG) | sleep `price_1TEKQmK4cATmIFbokmkYg47S` · stress `price_1TEKS6...BeCW` · longevity `price_1TEKSW...Jng9` · gut `price_1TEKSs...HtwQ` | 🔍 not verified against Stripe dashboard |
| Customer portal | not implemented | ❌ |
| Edge fn `supabase/functions/stripe-checkout/index.ts` | 61 LOC, not called by live frontend | 💀 likely orphaned |
| Tests | `tests/stripe-webhook.test.js` + `tests/integration/stripe-webhook.smoke.js` | ✅ webhook-shape; ⚠️ predates Wave-9 email wiring |

Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (both confirmed set — webhook returns 400 on bad sig in prod, not 500).

---

## 8. Twilio usage

| Surface | Where | Status |
|---|---|---|
| `sendSMS` helper | `server.js:42` | ✅ defined; ❌ creds missing in prod ("Twilio not configured") |
| Day-7 outcome SMS | `server.js:1485` (`scheduleDay7OutcomeChecks`) + `/api/send-day7-outcomes` | 🔒 wired; deferred until creds set |
| Reorder reminder SMS | `/api/send-reorder-reminders` | 🔒 wired; deferred until creds set |
| Inbound (signed) | `/api/sms/inbound` (line 3516) — `twilioSignatureValid` (line 1526) | ✅ signature-validated |
| Inbound (legacy, unauth) | `/twilio-reply` (line 3577) — **no signature check, plaintext phone stored in `outcome_events`** | ⚠️ **TD-010 inconsistency — must consolidate** |
| Render cron auth | Bearer `REORDER_CRON_SECRET` (timing-safe) | 🔍 `REORDER_CRON_SECRET` not confirmed in Render dashboard |
| Tests | none committed for SMS paths | ❌ |

Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — **all missing in Render** as of Day 80.

**Two inbound webhooks coexist.** Only one can be the Twilio number's configured webhook URL. Recommend consolidation onto `/api/sms/inbound` and removal of `/twilio-reply`.

---

## 9. Fullscript / Amazon / iHerb / other affiliate integrations

| Integration | Where | Mode | Status |
|---|---|---|---|
| **Fullscript** (slug `fstoler`) | `supabase/migrations/2026-05-24-fullscript-rail-b-seed.sql` — 10 Rail B plans seeded into `bleu_catalog` · `server.js:1823` references `fullscript_template_id` · `_meta/doctrine/decision_matrix.md` | "Rail B" — practitioner-dispensed | ✅ catalog seeded; 🔍 Stoler Rail-B signoff file NOT present in `_meta/clinical/signoffs/` |
| **Amazon Associates** (tag `bleulive20-20`) | `server.js:3019` `/api/track` redirect target · `engine.py:39` (`AMAZON_PARTNER_TAG`, default `bleu-live-20` — ⚠️ mismatch with prod tag) · `engine.py:631` `scrape_amazon` · catalog field `amazon_url` | "Rail C" — consumer self-purchase | ✅ tracking + scraping; ⚠️ tag mismatch between engine.py default and prod |
| **iHerb** | `engine.py:664` `scrape_iherb` — affiliate links via category landing pages (no public API) | — | 🔍 active in pipeline; not verified against current commission terms |
| **Google Places** | `engine.py` (`GOOGLE_PLACES_KEY`) | data ingest | ✅ |
| **Yelp** | `server.js:3355` `/api/yelp` · `engine.py` (`YELP_API_KEY`) | proxy + ingest | ✅ |
| **YouTube** | `server.js:3257` `/api/youtube` · `engine.py` (`YOUTUBE_API_KEY`) + `youtube-transcript-api` | proxy + ingest | ✅ |
| **Spotify** | `server.js:3286` `/api/spotify` (`SPOTIFY_CLIENT_ID/SECRET`) | proxy | ✅ |
| **Eventbrite, Meetup** | `server.js:3334` `/api/meetup-events` · env keys defined | proxy | 🔍 |
| **NPI / FDA / RxNorm / PubMed / SAMHSA / HRSA / OFF / AirNow / Reddit** | `engine.py` scrapers (10 sources total) | data ingest only | ✅ |

---

## 10. ALVAI-related logic

### The active runtime path (today)
1. **Browser** → `sendPrompt(...)` in `js/bleu-prod-hooks.js` → POST to `/api/chat` or `/api/chat/stream`.
2. **`server.js:2463` `/api/chat`** (and `:2697` streaming variant) — single handler that:
   - runs the **BUD intercept first** if `mode === 'cannaiq' && assistant === 'Bud'` (see §11);
   - otherwise picks a prompt from `MODE_PROMPTS` (server.js:803) by mode (general, dashboard, directory, vessel, map, protocols, learn, community, passport, therapy, recovery, cannaiq, missions, finance) plus `THERAPY_MODES` (line 1109) and `RECOVERY_MODES` (line 1123) sub-modes;
   - runs **Five Brains** (`intentBrain` etc., line 1545) for intent detection;
   - **routes by model:** GPT-4o-mini for navigation, GPT-4o for synthesis/emotion/finance, Claude Opus for clinical (CYP450, meta-analysis, crisis). (Per CLAUDE.md: 70/25/5 split.)
   - persists turns to `conversation_history` (with pgvector embeddings).
3. **Crisis check** runs first inside `/api/chat` via `core/safety/crisis_validator.js`. Crisis suppresses commerce surfaces (`canonical_crisis_patterns.js`). Inline regression harness gated by `BLEU_TEST_CRISIS=1` (committed in server.js + `tests/crisis_validator.test.js`).
4. **Trust Packet:** `buildTrustPacket` + `logTrustPacket` exist (line 1248) but **🔒 not yet wired** onto guidance routes (per doctrine consistency audit — gates currently doctrine-only, not recorded per-decision).

### The edge function (NOT the active path)
- `supabase/functions/alvai/index.ts` (2,363 LOC) — Deno; older 20-agent / 6-Super-Field architecture (per CLAUDE.md narrative). Frontend does not call it. **Source of truth for current chat:** `server.js`.

### The future (per filed doctrine)
- `_meta/doctrine/openai_agents_sdk_migration_v1.md` — DRAFT v0.1, filed `bd9ee4c` (Day 80). Direction: ALVAI moves to OpenAI Agents SDK. PoC route `/alvai-agent-test` staged for Day 81 (per memory). The edge function is **not** the migration target.

### Other ALVAI-adjacent code
- `bleu-core/core/alvai.js` — part of the **orphaned** standalone engine (see §14). Not loaded by the active server.

---

## 11. CannaIQ / Bud-related logic in THIS repo

CannaIQ logic is **partially co-resident** with BLEU in `server.js`. The cleanest separation already documented:

| Surface | Where in this repo | Owner |
|---|---|---|
| **BUD V5 prompt** (cultivator-surfer-recovered-man voice) | `server.js:218-784` — `BUD_V5_SYSTEM_PROMPT` constant (~560 LOC) | Used **only** when `mode === 'cannaiq' && assistant === 'Bud'` (i.e. requests coming from cannaiq.net). Source of truth (per comment on line 224): `/workspaces/cannaiq/app/api/chat/route.ts BUD_SYSTEM_PROMPT` — **lives in a separate `cannaiq` repo**. |
| **bleu.live's own cannaiq tab** | `server.js:1063` (`MODE_PROMPTS.cannaiq`) — the "28 years of cannabis medicine intelligence" prompt | Used when `mode === 'cannaiq'` and **no** `assistant: 'Bud'` flag |
| **ECSIQ classifier** | `server.js:1736` `ecsiqMode` — classifies cannabis-sea messages as `reset` (reducing/quitting) vs `use` | BLEU-side |
| **Deep mode triggers including cannabis terms** | `server.js:2041` `DEEP_MODES` includes `cannaiq`; `DEEP_TRIGGERS` includes `cbd`, `thc`, `cannabis`, `strain`, `terpene` | BLEU routing |
| **Static reference to CannaIQ in `index.html`** | nav label "CannaIQ" | UI link |
| Historical: `inject-cannaiq.py`, `ciq.py` | root-level Python (April 23, 2026) | 💀 dead (see §14) |
| `cities/01-supabase-tables.sql` last-commit mentions "CANNAIQ MASTERPIECE: BEMS, 5-layer safety, 302K interactions, strains, terpenes, ECS quiz, PMIDs" | one-time schema dump | 💀 reference only |

**Important:** the Bud system prompt comment on `server.js:224` says the canonical source lives at `/workspaces/cannaiq/app/api/chat/route.ts` — that file is in a **different repository**. So the BUD V5 constant in *this* repo is effectively a **duplicate** maintained for the intercept use-case. Risk: BUD voice drift between the two repos. (See §13.)

**Conclusion:** CannaIQ logic IS mixed into BLEU's server.js, but the mixing is bounded (one named section, one named constant, one mode key) and is documented inline. It is the cleanest mixing point you have today and could be extracted to a module without rewriting the chat handler. The cleaner architecture would have the BUD intercept be a single import from a `lib/cannaiq-bud.js` (or fetched from the `cannaiq` repo as a published artifact).

---

## 12. Environment variables referenced

All env vars found by grep across `*.js`, `*.ts`, `*.py`, `*.yml`, `*.yaml`, `*.json`, `*.toml` (excluding `node_modules`, `.git`, `dist`, `test-results`).

### Node side (`server.js` + workflows)
| Var | Where | Status (per ops audit) |
|---|---|---|
| `OPENAI_API_KEY` | server.js | 🔍 set assumed (chat works) |
| `STRIPE_SECRET_KEY` | server.js | ✅ |
| `STRIPE_WEBHOOK_SECRET` | server.js | ✅ |
| `SUPABASE_URL` | server.js, engine.py | ✅ |
| `SUPABASE_SERVICE_KEY` | server.js, engine.py | ✅ working — but **⚠️ exposed Day-80, NOT confirmed rotated** (see §15) |
| `SUPABASE_ANON_KEY` | server.js | 🔍 |
| `RESEND_API_KEY` | server.js | ✅ key set; ❌ **domain `bleu.live` not verified in Resend** (per memory `day80-close-state`) |
| `SESSION_SECRET` | server.js | 🔍 not confirmed in Render — multi-instance risk |
| `REORDER_CRON_SECRET` | server.js, render.yaml | 🔍 not confirmed in Render — crons may 401 |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | server.js | ❌ missing in Render |
| `ALLOWED_ORIGINS` | server.js | 🔍 |
| `EVENTBRITE_API_KEY` | server.js | 🔍 |
| `MEETUP_API_KEY` | server.js | 🔍 |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | server.js | 🔍 |
| `YELP_API_KEY` | server.js, engine.py | 🔍 |
| `YOUTUBE_API_KEY` | server.js, engine.py | 🔍 |
| `BLEU_TEST_BRAINS`, `BLEU_TEST_CRISIS`, `BLEU_TEST_OW` | server.js (regression harness flags) | dev/test flags |
| `PORT` | server.js | ✅ Render-assigned |

### Python side (`engine.py` + scrapers)
| Var | Where | Status |
|---|---|---|
| `CLAUDE_API_KEY` | engine.py | 🔍 (GHA `beast.yml` should provide) |
| `GOOGLE_PLACES_KEY` | engine.py | 🔍 |
| `AMAZON_PARTNER_TAG` | engine.py (default `bleu-live-20` — ⚠️ doesn't match prod `bleulive20-20`) | 🔍 |
| `PAGE_BUILD_WEBHOOK` | engine.py | 🔍 |
| `AIRNOW_API_KEY` | engine.py | 🔍 |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | engine.py / older Python | ⚠️ env naming inconsistency — Node uses `SUPABASE_SERVICE_KEY`, some Python uses `SUPABASE_SERVICE_ROLE_KEY` |

**Naming drift to clean up:** `SUPABASE_SERVICE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY` (both referenced); `AMAZON_PARTNER_TAG` default in engine.py is wrong.

---

## 13. Duplicated logic

| What | Where | Why it's a duplicate | Risk |
|---|---|---|---|
| **Two SMS inbound webhooks** | `/api/sms/inbound` (signed) + `/twilio-reply` (unauth, plaintext phone in `outcome_events`) | Both handle YES/no replies | Plaintext phone violates TD-010 hash policy; only one can be Twilio's configured URL; the other is shadow code |
| **Two migrations directories** | `migrations/` (3 files, May; legacy) + `supabase/migrations/` (17 files; active) | Schema state lives in two places | Future migrations may be applied in one and forgotten in the other |
| **Two `package.json`** | root (`bleu-alvai`) + `bleu-core/` (`bleu-core`) | bleu-core/ is the orphaned standalone engine | Confuses tooling that walks for nearest package.json |
| **Two ALVAI implementations** | `server.js` (active) + `supabase/functions/alvai/index.ts` (orphaned, 2.3k LOC Deno) | The edge fn is the older 20-agent architecture; live frontend doesn't call it | High — anyone reading the repo to "understand ALVAI" will get the wrong file |
| **Two Stripe checkout paths** | `server.js` `/api/stripe/create-session` (active) + `supabase/functions/stripe-checkout/` (61 LOC edge fn) | Same fork — frontend uses server.js | Edge fn is dead but present |
| **Two cron systems** | Render crons (active per render.yaml) + `.github/workflows/sms-reorder-cron.yml` (GHA cron) | Same payload | Pick one; running both fires twice |
| **Two deploy configs** | `render.yaml` (active) + `railway.json` + `nixpacks.toml` (Railway, not active per ops audit) | History of platform migration | Misleads readers about where prod runs |
| **Two refusal doctrines** | `_meta/doctrine/refusal_list.md` (pre-existing "Layer 4") + `refusal_doctrine_v1.md` (Day-80, 20-item canon) | Overlapping intent, different lists | Doctrine drift (see `_meta/audits/2026-05-26-doctrine-consistency-audit.md`) |
| **Two doctrinal vocabularies** | "Layers 1–4" (pre-existing) vs "three voices / five machines / seven gates" (Day-79/80) | Same system framed two ways | Reader confusion |
| **BUD V5 system prompt** | `server.js:218-784` in THIS repo + `/workspaces/cannaiq/app/api/chat/route.ts` in cannaiq repo | One copy is the "source of truth" comment, but both are editable copies | Voice drift between BLEU and CannaIQ products |
| **Three crisis pattern files** | `core/safety/canonical_crisis_patterns.js` + `crisis_keywords.js` + `crisis_validator.js` | Intentional layering, but worth a single source-of-truth README | Low — already governed by Stoler signoff |
| **40 root-level Python "fix" scripts** | (see §14) | Each is a one-off patch from the initial repo import (April 23, 2026) | Dead weight, confuses any audit |

---

## 14. Dead or questionable code

### 💀 Definitely dead — root-level Python patch scripts (39 of 40)
All dated **April 23, 2026** (initial repo import) and never re-touched. Each was a one-off codemod against `index.html` / config that's long since been superseded. Only `engine.py` is referenced (by `.github/workflows/beast.yml`).

```
batch1.py, bleu-3fixes.py, bleu-beta-deploy.py, bleu-card-fix.py, bleu-final-upgrades.py,
bleu-fix.py, bleu-grid-fix.py, bleu-home-wow.py, bleu-masterpiece.py, bleu-masterpiece-v2.py,
bleu-simple-fix.py, bleu-total-repair.py, bleu-update-v2.py, bleu-win.py, ciq.py,
enhance-all-tabs.py, fix-bio.py, fix-credentials.py, fix-enterprise.py, fix-ent-final.py,
fix-home-wow.py, fix.py, home.py, home2.py, home3.py, inject-cannaiq.py, master.py, mp2.py,
nola-soul.py, ocean-deploy.py, ocean-enhance.py, patch-bleu.py, patch.py, rebuild.py,
stream-upgrade.py, tab-dashboard.py, tab-directory.py, tank-filler.py, upgrade.py,
bleu-total-repair-v4.sh, deploy.sh
```

Recommend: move to `_archive/legacy-codemods/` (preserves history) or delete outright (history is in git).

### 💀 Almost certainly orphaned — `bleu-core/`
Single commit (`5946650`: "bleu-core: standalone engine"). Own `server.js` (176 LOC, port 3001), own `package.json`, own tests. No deploy target references it. Never re-touched. Either an early prototype or a clean-architecture target that was abandoned.

### 💀 Edge functions (likely orphaned)
- `supabase/functions/alvai/index.ts` — 2,363 LOC, last meaningful commit predates the Mission-6/7 work. Live frontend does not call it. Migration plan is OpenAI Agents SDK, not back to this fn.
- `supabase/functions/stripe-checkout/index.ts` — 61 LOC; live frontend calls `server.js` instead.

### 💀 Misfiled files
- `cities/01-supabase-tables.sql` — an SQL schema dump inside an HTML directory; one-time CannaIQ snapshot from a previous era.

### ⚠️ Questionable / partial
- `migrations/` (root) — 3 files, May 2026; superseded by `supabase/migrations/`.
- `railway.json` + `nixpacks.toml` — present but Render is the active deploy.
- `/twilio-reply` route — superseded by `/api/sms/inbound`.
- `bleu-prod-hooks.js` "create account" modal — submits password to a passwordless flow; double-modal opens on top (per total-system-audit).
- `getSessionCitizen` — built but no route consumes it.
- `logTrustPacket` — built but not wired onto guidance routes.
- `calculate_practitioner_trust`, `calculate_product_trust`, `calculate_user_lss` (Supabase RPCs) — exist; callers not traced.
- `sw.js` — 6 lines; could serve stale assets after deploys.
- `tests/stripe-webhook.test.js` — predates the Wave-9 order-email wiring.
- `CLAUDE.md` — stale on LOC numbers (says server.js ~1,000, actual 4,162; index.html ~12,500, actual 1,309). Has likely been outpaced by other facts too.

### 🔍 Suspicious / 5-layer-deep audit candidates
- The 11 RLS-off + anon-granted tables (see §6) — possibly dead, possibly live PII.
- `sessions`, `pageviews` — telemetry tables; check retention policy.
- `conversation_memory` deletion path — verify it actually cascades (citizen RTBF).

---

## 15. Risky production areas

| Area | Where | Risk class | Notes |
|---|---|---|---|
| **Magic-link auth + session signing** | `server.js:1381-1458` | 🔴 auth | HMAC sessions, atomic single-use consume, no-enum copy; `SESSION_SECRET` ephemeral fallback ⚠️ (multi-instance logs users out if env unset) |
| **Stripe webhook** | `server.js:3644` `handleStripeWebhook` | 🔴 payment | sig + 300s replay + `stripe_processed_events` idempotency + Wave-9 email |
| **`/api/stripe/create-session`** | `server.js:3646` | 🔴 payment | kill-switch aware; no auth on create-session |
| **Crisis detection** | `core/safety/*` + `server.js` inline regression | 🔴 clinical | Stoler signoff exists (`_meta/clinical/signoffs/`); commerce gate ✅ |
| **Drug-interaction `/api/safety-check`** | `server.js:2962` | 🔴 clinical | FDA + RxNorm + CYP450 — `_meta/doctrine/cyp450_wiring_audit.md` exists; **🔍 end-to-end verification has NOT been done** |
| **`querySupabase` PATCH `return=representation`** | `server.js:1132` | 🟠 data | Fixed Day-80 (commit `42de24a`); no regression test (see §19 PR #1) |
| **`/twilio-reply` unauth + plaintext phone in `outcome_events`** | `server.js:3577` | 🟠 privacy | TD-010 violation; must consolidate to `/api/sms/inbound` |
| **`SUPABASE_SERVICE_KEY` exposure** | the key itself | 🔴 security | Exposed in chat Day 80 per memory; **not confirmed rotated** — bypasses all RLS work |
| **11 RLS-off + anon/auth granted tables** | Supabase | 🟠 security | needs content review for PII |
| **Resend `bleu.live` domain unverified** | Resend dashboard | 🔴 deliverability | All emails fail until verified; Citizen #1 blocker |
| **Twilio creds missing** | Render env | 🟠 ops | All SMS deferred; fail-closed |
| **`SESSION_SECRET` / `REORDER_CRON_SECRET` unconfirmed in Render** | Render env | 🟠 ops | sessions reset on redeploy; crons may 401 |
| **In-memory magic-link rate limiter** | `server.js:1381+` `_magicLinkRate` Map | 🟡 abuse | resets on restart, per-instance — useless if Render scales >1 |
| **No connection pooling / rate limiting on HTTP server** | global | 🟡 scale | 10× traffic could exhaust sockets |
| **`/api/chat` enrichment** | line ~2040+ | 🟡 scale + cost | fires many external APIs in parallel per request |

---

## 16. Files that should NOT be touched without explicit review

**Tier 1 — clinical / safety / auth / payment (Captain + domain expert review required):**
- `core/safety/canonical_crisis_patterns.js`, `crisis_keywords.js`, `crisis_validator.js` (Stoler signoff)
- `server.js:218-784` — BUD V5 system prompt (canonical source in cannaiq repo)
- `server.js:803-1108` — `MODE_PROMPTS` (voice surface area)
- `server.js:1109-1130` — `THERAPY_MODES` / `RECOVERY_MODES`
- `server.js:1381-1458` — magic-link auth + session
- `server.js:3644-3700` — Stripe webhook
- `server.js:2962-3007` — `/api/safety-check` (drug interactions)
- All files under `_meta/clinical/signoffs/`
- `supabase/migrations/*` — never edit applied migrations; always add a new one
- `supabase/policies/policies-2026-05-21.sql` — RLS canonical snapshot

**Tier 2 — doctrine / governance (Captain review):**
- `_meta/doctrine/source_document_v1.md`
- `_meta/doctrine/coca_cola_recipe_v1.md`
- `_meta/doctrine/refusal_doctrine_v1.md`
- `_meta/doctrine/pressure_architecture_v1.md`
- `_meta/doctrine/lens_architecture_doctrine_v1.md`
- `_meta/doctrine/openai_agents_sdk_migration_v1.md`

**Tier 3 — legal:**
- `privacy.html`, `terms.html` — attorney + Captain review (existing accuracy issues already flagged in `_meta/audits/2026-05-26-frontend-inventory-audit.md`)

---

## 17. Places where BLEU and CannaIQ logic are mixed

| Location | Mixing degree | Recommendation |
|---|---|---|
| `server.js:218-784` — BUD V5 prompt constant | 🔴 high — 560 LOC of CannaIQ voice physically in BLEU's server | Extract to `lib/cannaiq-bud.js`; ideally fetch from cannaiq repo as a versioned artifact |
| `server.js:1063-1107` — `MODE_PROMPTS.cannaiq` (BLEU's own cannaiq tab) | 🟠 medium — different from BUD, BLEU-owned | Keep in BLEU; rename to `MODE_PROMPTS.cannabis_education` to disambiguate from "Bud-as-product" |
| `server.js:1736` — `ecsiqMode` classifier | 🟡 low — pure logic | Keep |
| `server.js:2041` — `DEEP_TRIGGERS` array (cbd/thc/cannabis/strain/terpene) | 🟡 low — routing words | Keep |
| `index.html` nav label "CannaIQ" | 🟡 low — link only | Keep |
| `inject-cannaiq.py`, `ciq.py`, `cities/01-supabase-tables.sql` (CannaIQ MASTERPIECE schema) | 💀 dead artifacts from earlier era | Archive |

The cleanest extraction would be a `lib/cannaiq-bud.js` module imported into `server.js` so the only thing in `server.js` is `const { BUD_V5_SYSTEM_PROMPT } = require('./lib/cannaiq-bud')`. That makes the cross-repo sync explicit (you can publish/ship the module from the cannaiq repo and version it).

---

## 18. Recommended clean architecture (proposed — NOT executed)

The current monolith works. Refactor only when you're willing to pay the cost (re-testing, deploy risk, doctrine drift). When you are, the natural decomposition is:

```
bleu-system/
├── server.js                       ← stays as the entry; ~500 LOC of route table + bootstrap
├── lib/
│   ├── supabase.js                 ← querySupabase
│   ├── auth.js                     ← magic-link, session HMAC, getSessionCitizen
│   ├── comms.js                    ← sendEmail (Resend), sendSMS (Twilio), twilioSignatureValid
│   ├── audit.js                    ← logEvent, logDecision, buildTrustPacket, logTrustPacket
│   ├── brains.js                   ← intentBrain + Five Brains
│   ├── enrichment.js               ← external API fan-out for /api/chat
│   ├── crisis.js                   ← re-exports core/safety/* with one clean surface
│   ├── stripe.js                   ← create-session + webhook handler + idempotency
│   ├── cannaiq-bud.js              ← BUD V5 prompt (cross-repo synced; see §17)
│   └── prompts/
│       ├── alvai-core.js
│       ├── mode-prompts.js         ← MODE_PROMPTS, THERAPY_MODES, RECOVERY_MODES
│       └── voice.js
├── routes/                         ← one file per logical group
│   ├── chat.js                     ← /api/chat, /api/chat/stream
│   ├── auth.js                     ← /api/auth/magic-link, /api/auth/verify
│   ├── stripe.js                   ← /stripe-webhook, /api/stripe/create-session
│   ├── plan.js                     ← /api/plan/*
│   ├── sms.js                      ← /api/sms/inbound (and ONLY this — delete /twilio-reply)
│   ├── cron.js                     ← /api/send-reorder-reminders, /api/send-day7-outcomes
│   ├── memory.js                   ← /api/memory/*
│   ├── enrichment.js               ← /api/youtube, /api/spotify, /api/yelp, /api/events, /api/meetup-events
│   ├── lookup.js                   ← /api/practitioners, /api/safety-check, /api/track
│   └── meta.js                     ← /api/ping, /api/stats, /api/session, /api/personalize, /api/debug/*
├── frontend/                       ← rename of root htmls
│   ├── shared/
│   │   ├── styles.css              ← extract from inline → one shared file (fix palette drift)
│   │   └── bleu-prod-hooks.js      ← unchanged, move under frontend/
│   └── seas/
│       ├── index.html, local.html, supply.html, learn.html, support.html
│       ├── privacy.html, terms.html
├── pipeline/
│   ├── engine.py                   ← unchanged role; just lives here
│   └── seo-engine.js
├── supabase/                       ← unchanged
├── tests/                          ← grow to cover the migration; see §19
├── docs/                           ← REPO_MAP.md + ARCHITECTURE.md + ADRs
├── _archive/                       ← every root-level .py historical script lands here (or delete)
├── _meta/                          ← unchanged
└── package.json, render.yaml, .gitignore, etc.
```

**Hard constraints on any refactor:**
1. Never refactor in the same PR as a behavior change.
2. Move modules behind a re-export shim first so the diff is trivial; delete the shim only after a quiet week.
3. Every extracted module gets a test before the extraction merges.
4. Migrations are append-only; never edit a migration file that's already applied.
5. The active deploy is **Render**. Any refactor must keep `npm start` → `node server.js` working.

---

## 19. First 5 safest pull requests after this map

Ranked by (low risk × high signal). Each is small, behavior-preserving (or behavior-correcting in a tightly-scoped way), and would ship without touching production behavior surface.

| # | PR | Why it's safe | Risk |
|---|---|---|---|
| **1** | **Commit the Day-80 smoke harnesses as committed integration tests** — promote `/tmp/*-smoke.js` to `tests/integration/` (mostly already done per commit `f9590a3`); add the specific test that would have caught the `querySupabase` PATCH bug (assert `representation` array, not `true`). | Pure test addition; no prod code change. Catches the exact bug class that bit Day 80. | 🟢 |
| **2** | **Archive root-level dead Python scripts** — `git mv` 39 of 40 root `.py` files (everything except `engine.py`) into `_archive/legacy-codemods/`. Leave a one-line `README.md` explaining why. | History preserved in git; nothing imports these; CI doesn't reference them. | 🟢 |
| **3** | **Stale `CLAUDE.md` refresh** — fix the LOC numbers (server.js: 4,162; index.html: 1,309; 5 sea HTMLs not just one); add the magic-link/comms/cron paths; cite this REPO_MAP.md. | Docs-only. | 🟢 |
| **4** | **Consolidate Twilio inbound** — delete `/twilio-reply`, leave only `/api/sms/inbound` (signed). Migrate any DB rows that referenced `source: 'twilio_reply'` to the signed source label in a follow-up. Update the Twilio number's webhook URL in the Twilio dashboard (Captain action). | Removes the unauth + plaintext-phone code path. Today Twilio isn't sending or receiving anyway (no creds), so blast radius is zero. | 🟢 (code) / 🟡 (Captain dashboard step) |
| **5** | **Move `migrations/` (root) under `supabase/migrations/` or delete** — three already-applied legacy files. If contents are still relevant, rename with the Day-80 datestamp convention; otherwise `git rm`. Add a `MIGRATIONS_README.md` in `supabase/migrations/` pointing here as the source of truth. | Removes a confusable duplicate directory. | 🟢 |

**Notable PRs deferred — NOT in this top-5 because each carries meaningful risk:**
- Refactor `server.js` into `lib/` + `routes/` — high signal, but a multi-day change; do it only when the test suite from PR #1 is robust.
- Wire `getSessionCitizen` + `logTrustPacket` onto routes — both add observable behavior and need their own test coverage.
- Rotate `SUPABASE_SERVICE_KEY` — security-critical (top item per memory `day80-close-state`) but a Captain ops action, not a PR.
- Verify Resend `bleu.live` domain — Captain DNS action, not a PR.

---

## 20. Open questions / unclear ownership

### Needs Captain input
1. **Is `bleu-core/` an abandoned prototype, or a target to grow into?** If abandoned → archive. If aspirational → it conflicts with the OpenAI Agents SDK doctrine; reconcile.
2. **Is `supabase/functions/alvai/index.ts` (2,363 LOC edge fn) preserved on purpose?** Or can it be archived? It conflicts with the doctrine that ALVAI moves to OpenAI Agents SDK; keeping it suggests a 3-way fork (server.js current / edge fn old / Agents SDK future).
3. **Is `railway.json` + `nixpacks.toml` kept for fallback, or is it dead weight?** Render is active. Pick one and remove the other.
4. **`AMAZON_PARTNER_TAG`: prod uses `bleulive20-20`, `engine.py` default is `bleu-live-20`.** Which is canonical?
5. **`SUPABASE_SERVICE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY` — naming.** Different files use different names. Pick one and rename everywhere.
6. **`/twilio-reply` plaintext-phone history in `outcome_events`** — is there a backfill obligation to hash existing rows (TD-010)?
7. **GHA `sms-reorder-cron.yml` vs Render `bleu-reorder-reminders` cron — is one fallback for the other, or accidental duplication?**

### Needs Dr. Felicia / clinical input
8. **CYP450 end-to-end verification.** Audit exists (`_meta/doctrine/cyp450_wiring_audit.md`); engine wiring is referenced in prompts; behavior never verified end-to-end.
9. **The 11 RLS-off + anon-granted tables** — `dr_felicia_reviews`, `practitioner_bookings`, `care_twin_patterns`, `marketplace_practitioners`, `safety_checks`, `symptom_specialist_map`, `product_practitioner_links`, `workforce_signals`, `validation_log`, `daily_reports`, `reddit_mentions`. For each: PII content review + decision to lock or keep public.
10. **Rail B (Fullscript) signoff file** — referenced in commits; not present in `_meta/clinical/signoffs/`. Add it for paper trail.

### Needs cross-repo coordination (BLEU ↔ CannaIQ)
11. **BUD V5 prompt sync mechanism.** Today it's two manually-maintained copies (`server.js:218-784` here + `app/api/chat/route.ts` in cannaiq repo). Either: (a) extract to a shared module/package; (b) make one the canonical source and have the other import/fetch at deploy time.
12. **CannaIQ → BLEU integration contract.** What headers, what `mode`/`assistant` values, what version pinning? Today this is an inline comment in `server.js:222`.

### Needs research / verification (not Captain-blocking)
13. Whether the 3 custom Supabase RPCs (`calculate_practitioner_trust`, `calculate_product_trust`, `calculate_user_lss`) are still called by any live code, or candidates for removal.
14. Whether `sw.js` (6-line service worker) is caching stale `bleu-prod-hooks.js` after deploys — could mask the Day-80 auth fix on returning users.
15. Whether large legacy tables (`practitioners` ~434k, `locations` ~23k, `products` ~9.5k) have indexes on hot query columns — `EXPLAIN` the current practitioner search before traffic grows.
16. Whether all 4 Stripe price IDs in `bleu-prod-hooks.js` CONFIG are still live in Stripe dashboard.

---

## Audit hygiene

- This document is one read. It will go stale. The right cadence: re-run this map (or a delta of it) at the close of each major milestone (Day 85, Day 90, post-Card-B launch).
- Numbered facts and line numbers in this doc are pinned to commit `bd9ee4c`. Anything that says 🔍 is honest about not having been verified from inside the repo.
- For the deepest cross-references on any single area, the May-26 audit set under `_meta/audits/` is more thorough on its subject than the corresponding section here:
  - Server architecture: `2026-05-26-server-architecture-audit.md`
  - Supabase schema: `2026-05-26-supabase-schema-audit.md`
  - Frontend inventory: `2026-05-26-frontend-inventory-audit.md`
  - Operational readiness: `2026-05-26-operational-readiness-audit.md`
  - Test coverage gaps: `2026-05-26-test-coverage-gap-audit.md`
  - Doctrine consistency: `2026-05-26-doctrine-consistency-audit.md`
  - Total system: `2026-05-26-total-system-audit.md`
  - Day-80 summary: `2026-05-26-day80-deep-audit-summary.md`

*End — read-only audit, no code/schema/deploy modified to produce this document.*
