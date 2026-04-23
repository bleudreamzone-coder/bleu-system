# BLEU.LIVE — System State Audit

**Generated:** 2026-04-22
**Git tip at audit time:** `999330f` (Care Twin memory: cross-session conversation history with pgvector recall)
**Scope:** Read-only audit across `bleu-system` repo, with best-effort notes on `bleu-core-loop`, `bleu-research-console`, and the Supabase edge function.

This document is a snapshot. If code changes, it goes stale. Every claim cites a file path and line number so a reader can verify. Anything the audit could not verify is labelled **UNKNOWN**.

---

## 1. Repository overview

### 1.1 `bleu-system` (this Codespace, at `/workspaces/bleu-system`)

**Top-level structure** (most relevant files; the repo root also contains many historical backup scripts and zip files that are not part of the live product):

| Path | Role |
|---|---|
| `server.js` (1790 lines) | Node.js HTTP server. Every `/api/...` route, every Supabase call, Stripe webhook, Twilio SMS, SEO sitemap. The heart of the runtime. |
| `index.html` (13,378 lines) | Single-page vanilla-JS app. All 15+ tabs, all UI, frontend Supabase auth, all fetches to the backend. |
| `engine.py` (1172 lines) | Python data pipeline. Pulls NPI, FDA, Google Places, YouTube, PubMed, Amazon, etc. into Supabase tables. Run by GitHub Actions. |
| `seo-engine.js` | SEO route handler — city pages, practitioner profiles, sitemap. Called from `server.js`. |
| `autonomous-engine.js` | Referenced but not yet investigated in depth — treat as UNKNOWN contribution to runtime until verified. |
| `manifest.json`, `sw.js`, `robots.txt`, `sitemap.xml` | PWA / SEO assets. |
| `package.json`, `railway.json`, `nixpacks.toml` | Node deploy config (Render + Railway). |
| `requirements.txt` | Python deps for `engine.py`. |
| `supabase/` | Subfolder: `functions/alvai/index.ts` (2363-line Deno edge function — 20-agent architecture), `functions/stripe-checkout/index.ts`, `migrations/add_coherence_index.sql`. |
| `.github/workflows/beast.yml` | Cron schedule for the data pipeline (4x daily). |
| `CLAUDE.md` | Project-level instructions for Claude Code. |
| `privacy.html`, `terms.html`, `CNAME` | Legal + custom-domain files. |
| `bleu-*.py`, `bleu-*.sh`, `index (7).html` … `index (13).html`, `nola-*.txt` | Historical one-shot scripts and backup snapshots. Not part of runtime. |
| `BLEU_*.zip`, `files (*).zip` | Archived asset bundles. Not part of runtime. |
| `cities/`, `core/`, `dist/`, `main/`, `bleu-core/` | Static content folders used by SEO pages. |

### 1.2 `bleu-core-loop`

**UNKNOWN — not in this Codespace filesystem.** `/workspaces/` contains only `bleu-system`. Nothing in the audit below can speak to `bleu-core-loop`.

### 1.3 `bleu-research-console`

**UNKNOWN — not in this Codespace filesystem.** Same as above.

### 1.4 Supabase edge function (`supabase/functions/alvai/index.ts`)

Single Deno TypeScript file, 2363 lines. CLAUDE.md describes it as a "20-agent architecture (v5.0) with 6 Super-Fields." Touched many tables that the Node server does not (`session_embeddings`, `commitments`, `emotional_signals`, `predictive_signals`, `agent11_syntheses`, `care_twin_state`, `care_twin_embeddings`, `user_arcs`, `marketplace_practitioners`). **It is not clear from the code whether this edge function is currently invoked from the frontend or the Node server** — neither calls it by name during audit. It may be deployed but unreached, or called from a code path not examined. Flagging as a major open question.

---

## 2. Supabase tables inventory

**Total tables found across the codebase: 28.** Each entry below names the table, the columns that are visible in code (inferred from INSERT bodies or SELECT query strings), which file:line lines write it, which read it, and whether RLS is determinable.

RLS status is almost uniformly **"cannot determine from code"** — the service-role key is used everywhere from the server and pipeline, which bypasses RLS regardless of what policies exist in the database. Frontend writes go through `sbClient` (anon key) and would hit RLS, but the policies themselves aren't in the migrations folder, so nothing in the repo shows what they are.

### practitioners
Columns: npi, first_name, last_name, full_name, credential, gender, specialty, taxonomy_code, taxonomy_description, practice_name, address_line1, city, state, zip, county, phone, lat, lng, source, source_id, source_url, trust_score, credentials_verified, license_verified, validation_status.
Writers: `engine.py:261`, `engine.py:965`, `engine.py:1005`.
Readers: `server.js:680`, `server.js:967`, `server.js:1158`, `supabase/functions/alvai/index.ts:319`, `supabase/functions/alvai/index.ts:1932`, `alvai-v3.ts:223`.
RLS: cannot determine.

### locations
Columns: name, type, address, address_line1, city, state, zip, phone, website, latitude, longitude, avg_rating, review_count, price_level, source, source_id, source_url, trust_score, validation_status.
Writers: `engine.py:336`, `engine.py:796`.
Readers: `server.js:700`.
RLS: cannot determine.

### products
Columns: name, brand, category, subcategory, description, ingredients, trust_score, fda_recall, fda_recall_reason, dosage, price, affiliate_tag, url_amazon, source, source_id, source_url, validation_status.
Writers: `engine.py:287`, `engine.py:298`, `engine.py:542`, `engine.py:643`, `engine.py:670`, `engine.py:758`, `engine.py:1124`.
Readers: `supabase/functions/alvai/index.ts:337`, `alvai-v3.ts:237`.
RLS: cannot determine.

### conversation_history (the Care Twin table, added earlier in April)
Columns (authoritative from schema verified during tonight's build): `id uuid`, `user_id text NOT NULL`, `session_id text`, `role text`, `content text`, `embedding vector(1536)`, `created_at timestamptz`, `updated_at timestamptz`, `deleted_at timestamptz`. Note: the Supabase-tables research agent initially guessed `user_id` as `uuid?` — that is wrong. Verified column type is `text`.
Writers: `server.js:1253`, `server.js:1257` (chat), `server.js:1326`, `server.js:1330` (stream).
Readers: `server.js:619` (short-term history SELECT by session_id), `server.js:632` (RPC `match_conversation_history` for semantic recall across prior sessions).
RLS: service-role key writes/reads from server. RPC function itself is locked to service_role (verified in the SQL from tonight's work — REVOKE from public/anon/authenticated, GRANT to service_role).

### conversation_memory (legacy, being migrated away from)
Columns: user_id, session_id, role, content, mode, created_at.
Writers: `server.js:1264`, `server.js:1265` (in `/api/chat` only — asymmetric; `/api/chat/stream` does NOT dual-write to this table).
Readers: none found (confirmed April 23, 2026 — see `docs/wire-3-conversation-memory-audit-20260423.md` for the full grep-audit artifact across server.js, index.html, edge functions, SQL migrations, config files, and documentation).
RLS: cannot determine from repo. `server.js:1263` carries a TODO comment to remove this dual-write after reader audit and Supabase dashboard check (triggers, views, policies — see the audit doc's "Next Steps for Wire 4" section).

### user_coherence
Columns: id, user_id, recorded_at, pc_score, bc_score, ic_score, nc_score, sc_score, ci_raw, ci_adjusted, ci_display, ci_composite, velocity_3d, velocity_7d, velocity_class, al_proxy, al_ceiling, circadian_phase, isi_fusion_score, isi_language_sample, bifurcation_proximity, quantum_cognition_eligible, confidence, sessions_used, oura_connected, session_id, mode, tab_context, city, neighborhood. Also includes reorder fields: reorder_target_date, protocol_name, phone (used by SMS reorder flow).
Schema file: `supabase/migrations/add_coherence_index.sql`.
Writers: `server.js:1238` (CI scoring after every chat), `server.js:1791` (reorder-reminder upsert).
Readers: `server.js:1820` (SELECT phone, protocol_name WHERE reorder_target_date = today).
RLS: cannot determine. Only one migration file in the repo and it defines columns, not policies.

### user_arcs
Columns: user_id, arc_name, progress_score, stall_flag, arc_signals, last_updated.
Writers: `supabase/functions/alvai/index.ts:263` (UPSERT).
Readers: `supabase/functions/alvai/index.ts:642`, `alvai-v3.ts:278`.
RLS: cannot determine.

### session_embeddings
Columns: user_id, session_date, summary_text, topics, conditions_mentioned, medications_mentioned, commitments_made, emotional_tone, embedding, recorded_at.
Writers: `supabase/functions/alvai/index.ts:246`.
Readers: `supabase/functions/alvai/index.ts:2201`.
RLS: cannot determine.

### commitments
Columns: user_id, commitment_text, created_at, kept.
Writers: `supabase/functions/alvai/index.ts:258`.
Readers: `supabase/functions/alvai/index.ts:211`, `alvai-v3.ts:115`.
RLS: cannot determine.

### emotional_signals
Columns: user_id, session_id, hopelessness, manic_energy, dissociation, grief_intensity, anxiety_load, resilience, attachment_style, window_of_tolerance, raw_biomarkers, recorded_at.
Writers: `supabase/functions/alvai/index.ts:421`.
Readers: `supabase/functions/alvai/index.ts:427`, `supabase/functions/alvai/index.ts:454`.
RLS: cannot determine.

### predictive_signals
Columns: user_id, stall_detected, streak_break, escalation_score, csd_warning, recommended_intervention, signal_data, recorded_at.
Writers: `supabase/functions/alvai/index.ts:470`.
Readers: none found.
RLS: cannot determine.

### care_twin_state
Columns: user_id, trust_score, session_count, arc_position, committed_actions, created_at, updated_at.
Writers: `supabase/functions/alvai/index.ts:1539`, `supabase/functions/alvai/index.ts:1830`.
Readers: `supabase/functions/alvai/index.ts:1517`, `supabase/functions/alvai/index.ts:1534`.
RLS: cannot determine.

### care_twin_embeddings
Columns: user_id, session_id, context_embedding, recorded_at.
Writers: `supabase/functions/alvai/index.ts:1904`.
Readers: none found.
RLS: cannot determine.

### agent11_syntheses
Columns: query_hash, query_text, study_count, overall_grade, confidence_score, causal_chain, effect_direction, synthesis_text, pmids, created_at.
Writers: `supabase/functions/alvai/index.ts:586`.
Readers: `supabase/functions/alvai/index.ts:582` (cache lookup by hash).
RLS: cannot determine.

### marketplace_practitioners
Columns: practitioner_name, practitioner_email, practitioner_phone, primary_specialty, credentials_summary, experience_years, practice_description, pricing_structure, onboarding_status, marketplace_approved, dr_felicia_reviewed.
Writers: none found in code (manually curated).
Readers: `supabase/functions/alvai/index.ts:352`.
RLS: cannot determine. The `marketplace_approved` + `dr_felicia_reviewed` boolean pair implies admin write control.

### clicks
Columns: partner, source_tab, product_or_service, session_id, city, timestamp.
Writers: `server.js:1396`.
Readers: none found.
RLS: cannot determine. Fire-and-forget analytics.

### pageviews
Columns: path, session_id, timestamp.
Writers: `server.js:1419`.
Readers: none found.
RLS: cannot determine.

### sessions
Columns: session_id, city, conversation_count, created_at, last_active.
Writers: `server.js:1435`.
Readers: `server.js:1429`.
RLS: cannot determine.

### profiles
Columns: id, city, neighborhood, ci_current, ci_velocity, wellness_goals, medications, conditions, last_active, streak_days, updated_at, bleu_score, cellular_health_score, affiliate_transactions, identity_protocol, cart_items. Also: `citizenship_status`, `citizen_tier`, `citizen_since`, `active_protocol`, `protocol_started_at`, `stripe_customer_id`, `last_protocol`, `last_purchase_date` (from Stripe webhook and reorder flow).
Writers: `server.js:1801` (reorder upsert), `server.js:1960` (Stripe webhook grants citizenship), `index.html:7159` (wellness_goals), `7244` (bleu_score+conversations_count), `7584`/`7587` (upsertProfile update+insert), `7636` (streak_days), `7924` (identity_protocol), `13042` (citizenship upsert), `13078` (affiliate_transactions), `13335` (cart_items).
Readers: `server.js:1756`, `index.html:7019` (cellular_health_score), `7031` (full profile in showProfile), `7212` (getUserContext), `7244` (bleu_score before update), `7582` (existence check), `7627` (streak check), `12986` (bleu_score display), `13074` (affiliate_transactions read).
RLS: cannot determine. The frontend writes to `profiles` via the anon key — so profile RLS policies must exist in Supabase, but they aren't in this repo's migrations folder.

### conversations
Columns (verified from `saveConvo` at `index.html:7158`): `user_id`, `mode`, `title`, `messages`, `created_at`, `updated_at`. `id` auto-generated by Supabase.
Writers: `index.html:7158` (`saveConvo` — INSERT on new session, UPDATE on same-session refresh; called once per Alvai turn fire-and-forget).
Readers: `index.html:7212` (`getUserContext` — SELECT last 5 for prompt context + medication regex scan), `index.html:8601` (SELECT for return-user continuity signal).
Deletion: server-side only via `POST /api/memory/delete-all` (`server.js:1538`, wire 2's auth-verified endpoint). No client-side DELETE path exists.
RLS: cannot determine from repo. Frontend writes use the public anon key, which means either RLS policies permit anon INSERT on this table, or writes are failing silently and nobody has noticed. Should be verified against the Supabase dashboard (same check gate as wire 4's `conversation_memory` dashboard audit — coordinate the two checks into one session).

### product_feedback
Columns: UNKNOWN — only referenced in code, no INSERT shape visible.
Writers: `index.html:7048`.
Readers: none found.
RLS: cannot determine.

### session_feedback
Columns: UNKNOWN.
Writers: `index.html:7070`.
Readers: none found.
RLS: cannot determine.

### user_signals
Columns: UNKNOWN. Inferred to be biomarker-like.
Writers: `index.html:10663`.
Readers: none found.
RLS: cannot determine.

### youtube_videos
Columns: video_id, channel_name, channel_id, title, description, published_at, view_count, like_count, comment_count, tabs, thumbnail, embed_url, watch_url, transcript, products_mentioned, protocols_extracted.
Writers: `engine.py:557`.
Readers: `index.html:4404`.
RLS: cannot determine.

### protocols
Columns: name, creator, category, steps, source, source_url, trust_score.
Writers: `engine.py:549`.
Readers: none found.
RLS: cannot determine.
**Flag:** this table has a pipeline writer but no reader in any audited file. Either the data is unused or readers live in the edge function (not fully traced).

### pubmed_studies
Columns: UNKNOWN — writer INSERT shape not fully visible. Inferred: pmid, title, abstract, year, authors, journal, url, grade, effect_size, study_type, sample_size, confidence_score.
Writers: `engine.py:731`.
Readers: none found in this audit.
RLS: cannot determine.

### reddit_mentions
Columns: post_id, subreddit, title, body, author, score, num_comments, url, products_mentioned, sentiment, posted_at.
Writers: `engine.py:611`.
Readers: none found.
RLS: cannot determine.

### scrape_log
Columns: source, records_found, records_saved, duration_seconds, cities_scraped, notes.
Writers: `engine.py:204`.
Readers: none found.
RLS: cannot determine.

### daily_reports
Columns: UNKNOWN. Inferred: date, total_records_ingested, sources_run, duration, status, notes.
Writers: `engine.py:855`.
Readers: none found.
RLS: cannot determine.

### environmental_data
Columns: UNKNOWN.
Writers: `engine.py:1060`.
Readers: none found.
RLS: cannot determine.

**Cross-cutting observations:**

- **16 tables have writers but no readers in this repo** (clicks, pageviews, predictive_signals, care_twin_embeddings, product_feedback, session_feedback, user_signals, protocols, pubmed_studies, reddit_mentions, scrape_log, daily_reports, environmental_data, and others). Some are intentionally write-only (analytics, audit logs). Others may have readers in the edge function that wasn't fully traced, or may be dead data.
- **1 table has readers but no writers in this repo** (`conversations`). Either the edge function writes it, or it's a ghost table.
- **RLS policies are nowhere in this repo.** Only one migration file exists (`add_coherence_index.sql`) and it defines a table, not policies. Any RLS enforcement that exists lives only in the Supabase project dashboard.

---

## 3. Server.js endpoints

Every HTTP handler in `server.js`, in file order. 25 total — 19 API endpoints and 6 SEO/static routes.

### GET /health  (server.js:1082)
Health check. Returns `{status, hasKey, hasSupabase, engine, version, modes}`. No tables, no external APIs.

### POST /api/chat  (server.js:1084)
Primary chat endpoint. Returns Server-Sent Events stream.
- Tables: `conversation_history` (write user+assistant turns with embeddings, lines 1253/1257), `conversation_memory` (legacy dual-write, 1264/1265), `user_coherence` (CI scoring after each turn, 1238), `practitioners` (directory injection when message mentions local providers, 1158).
- External: OpenAI chat completions (line 1198), OpenAI embeddings (line 567 via `embedText`), FDA, RxNorm, DailyMed, PubMed, USDA, ClinicalTrials, Open-Meteo (all via `enrichWithData` around lines 735–846).
- Helpers: `checkEmotionalIntent`, `pickModel`, `buildPrompt`, `detectOpening`, `extractCity`, `querySupabase`, `resolveIdentity`, `embedText`, `loadShortTermHistory`, `loadSemanticRecall`, `buildRecallBlock`, `storeConversationTurn`.
- Body: `{message, mode?, session?, conversation_id?, user_id?, therapy_mode?, recovery_mode?, history?, passport_context?, user_context?, journey_context?}`.

### POST /api/chat/stream  (server.js:1272)
Streaming variant of `/api/chat`. Functionally similar — but memory wiring is NOT identical: this endpoint writes only to `conversation_history` via `storeConversationTurn` (lines 1326/1330), never to the legacy `conversation_memory` dual-write. The asymmetry was not documented until the wire 3 audit surfaced it; see `docs/wire-3-conversation-memory-audit-20260423.md` for the full finding. **Not called by the current frontend** (every browser fetch hits `/api/chat`) — this endpoint exists for future clients or external integrations.

### GET /api/safety-check  (server.js:1343)
Drug interaction and CYP450 analyzer. Calls GPT-4o with the substance list, returns structured JSON `{risk_level, interactions, summary, disclaimer}`. No tables.

### GET /api/practitioners  (server.js:1359)
Directory lookup. Reads `practitioners` table, filtered by zip/city/specialty. Returns `{count, practitioners:[]}`.

### GET /api/track  (server.js:1389)
Affiliate click logger + 302 redirect. Writes `clicks` table, then redirects to partner URL (BetterHelp, Amazon, Thorne, etc.).

### GET /api/ping  (server.js:1416)
Analytics ping. Writes `pageviews` table. Returns `{ok:true}`.

### POST /api/session  (server.js:1423)
Session upsert. Reads/writes `sessions` table.

### GET /api/debug/enrich  (server.js:1617)
Debug/monitoring endpoint. Runs `detectIntent` + `enrichWithData` on a test message and returns timing + preview. Used to verify external data freshness.

### GET /api/youtube  (server.js:1632)
Wellness video search. Calls YouTube Data API. Falls back to hardcoded video IDs if the key is missing.

### GET /api/spotify  (server.js:1661)
Wellness playlist search. Calls Spotify Search API with Client-Credentials OAuth. Falls back to hardcoded playlist IDs.

### GET /api/events  (server.js:1689)
Wellness events. Calls Eventbrite. Falls back to hardcoded NOLA events.

### GET /api/meetup-events  (server.js:1709)
Community events via Meetup GraphQL. Falls back to static events.

### GET /api/yelp  (server.js:1730)
Local business search. Calls Yelp Fusion.

### POST /api/personalize  (server.js:1745)
Loads user profile data (city, conditions, goals, medications) from `profiles`. Returns defaults if not found. **Called by the Passport tab on mount.**

### POST /api/reorder-reminder  (server.js:1784)
Stores a supplement reorder reminder. Writes `user_coherence` (line 1791) and upserts `profiles` via direct PATCH (line 1801).

### POST /api/send-reorder-reminders  (server.js:1814)
Batch SMS sender. Reads `user_coherence` WHERE `reorder_target_date = today AND phone IS NOT NULL`, calls `sendSMS` on each. Returns `{sent, errors?}`.
**Flag:** nothing in the repo triggers this endpoint on a schedule. It must be hit by an external cron (Render scheduled job, GitHub Actions, or manual). No scheduler found in-repo.

### POST /twilio-reply  (server.js:1838)
Inbound SMS webhook. Parses Twilio's form-encoded reply, responds with TwiML.

### POST /stripe-webhook  (server.js:1857)
Stripe payment webhook. Verifies signature, maps Stripe price ID to protocol name, writes `profiles` with `citizenship_status`, `active_protocol`, `protocol_started_at`, `stripe_customer_id`.

### GET /api/stats  (server.js:1859)
Metadata about the server (version, mode counts). No tables.

### SEO/static routes (server.js:1868 handles them all via `seoEngine.handleRoute`)
- `GET /sitemap.xml` — SEO sitemap.
- `GET /robots.txt` — SEO robots.
- `GET /<city-slug>` — one landing page per city (86 cities in SEO_CITY_SLUGS).
- `GET /safety-check` — SEO page for drug safety.
- `GET /cities` — directory of city pages.
- `GET /practitioner/<npi>` — per-practitioner SEO profile.

### GET / (root)  (server.js:1880) and static file fallback (server.js:1884)
Root serves `index.html`. Fallback serves static assets (CSS/JS/PNG/JPG/SVG/ICO/JSON) from disk.

---

## 4. Server.js helper functions

Every top-level function, in declaration order.

### sendSMS  (server.js:29)
Posts a Twilio SMS. Reads `TWILIO_SID`, `TWILIO_AUTH`, `TWILIO_FROM`. Throws if creds missing.

### querySupabase  (server.js:502)
Generic REST wrapper for Supabase tables. Handles GET with query string + POST with JSON body. Returns parsed JSON on GET, `true` on POST (fire-and-forget).

### callSupabaseRPC  (server.js:539)
Calls a Supabase stored function (`/rest/v1/rpc/<name>`) with service-role auth. Added tonight for `match_conversation_history`.

### embedText  (server.js:564)
text-embedding-3-small → 1536-dim vector via OpenAI embeddings API. Returns null on failure. Added tonight.

### resolveIdentity  (server.js:587)
Returns `{userId, convId, source}`. Source is `'supabase_auth'` when `p.user_id` is present, else `'anonymous_session'`. For anonymous users, `userId` falls back to `conversation_id`. Added tonight.

### storeConversationTurn  (server.js:596)
Fire-and-forget INSERT to `conversation_history` with `{user_id, session_id, role, content, embedding, created_at}`. Logs the identity source to stdout. Added tonight.

### loadShortTermHistory  (server.js:615)
SELECT role, content, created_at from `conversation_history` WHERE session_id = convId AND deleted_at IS NULL, ordered oldest→newest, capped at 24 rows. Added tonight.

### loadSemanticRecall  (server.js:629)
Calls RPC `match_conversation_history` with `{p_query_embedding, p_user_id, p_exclude_session, p_min_similarity:0.75, p_match_count:5}`. Short-circuits for anonymous sessions. Added tonight.

### buildRecallBlock  (server.js:644)
Formats recall rows into a text block, capped at 6000 chars (`RECALL_CHAR_BUDGET`). Top-ranked matches first; stops at budget. Added tonight.

### checkEmotionalIntent  (server.js:232)
Scans a message against `EMOTIONAL_INTENT_RE` (therapy, crisis, panic, etc.). Adds the session ID to an in-memory Set; subsequent chat turns in that session will get `suppressCommerce:true` prepended to the SSE stream so the frontend hides upsell cards.

### pickModel  (server.js:711)
Routes between `gpt-4o-mini` (light queries) and `gpt-4o` (depth, crisis, emotion, finance). No clinical pattern in this router invokes Claude despite CLAUDE.md's "5% → Claude Opus" claim — see section 6 item 9.

### extractCity  (server.js:655)
Parses free-text message against a hardcoded city list and specialty lookup, returns `{city, spec}`. Used by practitioner/location lookups.

### getPractitioners  (server.js:670)
Returns a formatted string block of verified NPI practitioners near the user's city + specialty. Broadens the specialty if fewer than 4 hits (chiropractor → physical therapy, etc.).

### getLocations  (server.js:697)
Returns a formatted block of locations (pharmacies, studios, dispensaries) for the city.

### fetchJSON  (server.js:724)
Generic GET with a 4-second timeout. Used by every external (non-OpenAI, non-Supabase) API call.

### fdaDrugLookup  (server.js:735)
OpenFDA — drug label, adverse events, recalls for a named drug.

### rxNormInteraction  (server.js:762)
RxNav — normalize two drugs, check pairwise interaction severity.

### dailyMedLookup  (server.js:784)
NLM DailyMed drug label fetch.

### pubmedSearch  (server.js:793)
NIH eUtils — esearch + esummary for research articles.

### nutritionLookup  (server.js:809)
USDA FoodData Central — macro/micro nutrients for a food name.

### clinicalTrials  (server.js:819)
ClinicalTrials.gov API — active trials for a condition.

### getWeather  (server.js:833)
Open-Meteo — current temperature, humidity, UV for a city. Hardcoded city→lat/lon map.

### detectIntent  (server.js:849)
Parses a message and returns `{drugs, supplements, conditions, foods, needsResearch, needsWeather}` — which external APIs to call.

### enrichWithData  (server.js:879)
Master orchestrator. Calls `detectIntent`, then fires FDA/RxNorm/DailyMed/PubMed/USDA/ClinicalTrials/Open-Meteo in parallel. Returns a concatenated string capped at 12,000 chars for prompt injection.

### getClinicalPractitioners  (server.js:942)
Crisis/therapy/search-triggered practitioner block injected into the system prompt.

### buildPrompt  (server.js:985)
Assembles the final system prompt: mode-specific base + therapy/recovery sub-mode + clinical practitioner block + data enrichment + location block. Capped at 12,000 chars.

### callAI  (server.js:1003)
Non-streaming wrapper around OpenAI chat completions. Used by older code paths; most endpoints now stream.

### warmCache  (server.js:1054)
On boot, calls `seoEngine.handleRoute` for every city slug (86 cities) with a 1.5-second delay between calls. Improves first-hit latency on SEO pages.

### json, cors  (server.js:1073-1074)
Tiny utilities for writing JSON responses and CORS headers.

### handleStripeWebhook  (server.js:1904)
Verifies Stripe signature, parses the event, maps price ID to protocol name, writes `profiles`.

**Total: 38 top-level helpers.**

---

## 5. Frontend tabs and modes

Full-text audit of `index.html` surfaced these tabs. Each entry is grounded in specific line references.

### Tab: home (index.html:1254)
- Hero + animated tagline (lines 1256 ff.) + product recommendation cards powered by `_vShow()` (lines 51-100) over a hardcoded `_vp` product master.
- No fetches on mount; product data is static.
- Affiliate links to Amazon (partner tag `bleu-live-20`).
- **State: SKELETON.** Product showcase, no user data.

### Tab: passport (index.html:4917)
See full deep-dive in section 8.

### Tab: dashboard / "Pulse" (index.html:2091)
- Hero + typewriter intro + animated BHI ring (0–1000 scale) + 7-dimension breakdown (Sleep, Community, Finance, Therapy, Nutrition, ECS, Recovery) + stat boxes (BLEU Score, Sleep, Movement, Nutrition, Mind) + metabolic intelligence card + live environmental widget.
- On mount: `loadEnvData()` (line 2227) geocodes via Nominatim (line 2232), fetches Open-Meteo (line 2235). A MutationObserver re-fires on panel activation (line 2259).
- Chat interface at line 2268.
- **State: WORKING.** BHI ring animates, environment widget pulls live data, chat is wired.

### Tab: directory / "Find Care" (index.html:2272)
- Hero with NPI stats (485K+ verified) + 3-step process + 6 practitioner type cards + quick-ask buttons ("My Anxiety Won't Stop" etc.) + search inputs for specialty + city.
- On mount: `initDirectory()` (line 8765) runs after 50ms delay.
- Search button calls `runDirSearch()`.
- "Featured providers" section shows "Loading featured providers…" placeholder (line 2389).
- **State: SKELETON.** UI is production-quality, but `runDirSearch()` implementation and "featured providers" data source were not located in the audit — treat as partially wired.

### Tab: vessel / "Supply" (index.html:2415)
- Sticky category filter + supplement catalog with Gold/Silver/Bronze tier products, Amazon affiliate buttons, Add-to-Cart.
- On mount: `showVesselCategory(currentVesselCategory||'foundation')` (line 9027).
- Quick-ask fetch to `/api/chat` at line 3152 with `conversation_id` (added during Care Twin wire, `999330f`).
- **State: FUNCTIONAL.** Cart works, product display works. No in-app checkout — carts route out to Amazon/Fullscript.

### Tab: map / "City" (index.html:3175)
- NOLA wellness map + Jazz Bird branding.
- On mount: `_bleuMapRestart()` called from the tab dispatcher at line 9297 — **function definition not found in the audit**. Unclear if defined in external library or stub.
- **State: STUB.** Infrastructure declared, implementation not visible.

### Tab: learn (index.html:3923)
- Video search + filter chips + trending/deep-dive grids + 16-topic research library + YouTube embed modal.
- On mount: `initVideoLibrary()` (line 4401) queries Supabase `youtube_videos` (line 4404, ordered by view_count DESC, limit 200). Falls back to hardcoded `CURATED_VIDEOS` array (line 4346 ff.).
- `loadLearnDefaults()` populates first-open content (line 4517).
- **State: FUNCTIONAL.** Video library shows real data or fallback, player works, filters work.

### Tab: community (index.html:4543)
- Hero (loneliness stats) + 4-stat grid + ripple visualization + live-events section + NOLA embedded cards + recovery/mental-health/fitness community links + crisis hotlines.
- Event fetches: `findCommunityEvents()` (line 4709), `loadLiveEvents()` (line 4686) → `/api/events`, Nominatim for geocoding (line 4718), deep links to Eventbrite/Meetup.
- **State: WORKING.** All external resource links are real and functional.

### Tab: therapy (index.html:5261)
- 12 sub-modes (talk, cbt, dbt, somatic, motivational, journal, crisis, couples, grief, trauma, eating).
- Mood check-in widget (7 moods). Therapist finder (city + specialty input). Affiliate cards (Brightside, Done, Cerebral, BetterHelp, Talkspace).
- Chat body adds `therapy_mode` (index.html:10513) sent to server for sub-mode prompt injection.
- **State: WORKING.** All 12 modes switch via `setMode()`. Therapist search UI is complete.

### Tab: recovery (index.html:5640)
- 7 sub-modes (sobriety, relapse, harm, 12step, family, mat, milestones).
- Sobriety day counter with localStorage persistence (`bleu_sober_date`). Meeting finder via SAMHSA (lines 5721-5786). GoodRx MAT cards (Suboxone, Naltrexone, Naloxone). Crisis banner with 988.
- Chat body adds `recovery_mode` (index.html:10514).
- **State: FULLY FUNCTIONAL.** Sobriety counter works, meeting finder hits real SAMHSA API.

### Tab: finance (index.html:5494)
- 8-stat financial-stress grid + 5-step "Financial Health Recipe" + quick-ask chips + external links (Cost Plus Drugs, GoodRx, YNAB).
- No calculator backend in-repo.
- **State: INFORMATIONAL.** Pure education UI; all "calculators" are conversational (send queries to Alvai).

### Tab: ecsiq (index.html:5896)
- Endocannabinoid system intelligence. Tabbed interface, strain/product cards, "Bud Says" callouts.
- **State: STUB.** CSS classes defined, content not populated or not visible in the audit.

### Tab: sleep (index.html:6497)
- Sleep quality calculator + score ring + sleep supplement tiers + greeting message on first open (index.html:9318).
- **State: PARTIAL.** UI complete; actual scoring logic not located.

### Tab: spirit (index.html:12625)
- Spiritual tradition finder + city input + category filter + results area ("Enter your city to discover local spiritual communities").
- `findSpiritCenters()` defined at line 12825 (inside the spirit panel's inline script; earlier audit missed it — function does exist).
- **State: WORKING.** (upgraded from STUB — the function is present, it delegates to `ask('spirit', …)` for a conversational answer rather than rendering a structured directory).

### Tab: why / "Why BLEU" (index.html:12450)
- Marketing/explainer page.
- **State: INFORMATIONAL.**

### Additional non-nav panels
- `protocols` (index.html:3740) — accessed from other tabs, not a nav button.
- `alvai` (index.html:1886) — legacy or internal panel.
- `terms` (index.html:6705), `privacy` (index.html:6725) — legal.
- `enterprise` (index.html:10792) — separate from main nav, referenced in mode map.

### Mode map and known modes (index.html:10504-10505)
```
_modeMap = {home:'alvai', ecsiq:'cannaiq', sleep:'vessel', spirit:'community', enterprise:'general'}
_knownModes = ['therapy','recovery','finance','cannaiq','directory','vessel','protocols',
               'learn','community','passport','map','missions','dashboard','alvai','general']
```
**Flag:** `missions` is in `_knownModes` but the audit found **no rendering code for a `missions` tab**. Either it was removed but the mode string remains, or its UI lives somewhere not surfaced by search.

---

## 6. Integrations inventory

26 external services referenced in code. Grouped by status.

### 6.1 Stripe  — LIVE
Env: `STRIPE_SECRET_KEY` (server.js:1892), `STRIPE_WEBHOOK_SECRET` (server.js:1893).
Files: `supabase/functions/stripe-checkout/index.ts` (creates checkout sessions), `server.js:1904-1979` (webhook).
Webhook verifies signature, maps price ID to protocol, writes `profiles`.

### 6.2 Fullscript  — LIVE (link-out, no API)
Env: none.
Files: `index.html` (30+ affiliate URL references), `server.js` prompts.
Real affiliate URLs (e.g. `https://us.fullscript.com/welcome/fstoler`). No API calls.

### 6.3 Amazon  — LIVE (pipeline + runtime, affiliate-only)
Env: `AMAZON_PARTNER_TAG` (engine.py:39, default `"bleu-live-20"`).
Files: `engine.py:631-645` (curated supplement searches with affiliate-tagged URLs into `products` table), `server.js` (embeds links in prompts), `index.html` (product cards + cart + Amazon "Buy" buttons).
Scheduled run via BEAST workflow.

### 6.4 Twilio  — LIVE (endpoint + webhook; no in-repo scheduler)
Env: `TWILIO_ACCOUNT_SID` (server.js:21), `TWILIO_AUTH_TOKEN` (server.js:22), `TWILIO_PHONE_NUMBER` (server.js:23).
Files: `server.js:29-44` (sendSMS), `server.js:1814-1836` (batch reminder sender), `server.js:1838-1855` (inbound reply webhook).
**Flag:** `/api/send-reorder-reminders` exists but nothing in the repo triggers it on a schedule. Must be externally cronned; no evidence in-repo that this is happening.

### 6.5 OpenAI  — LIVE
Env: `OPENAI_API_KEY` (server.js:12).
Files: `server.js` (chat completions, embeddings, safety-check).
Models: `gpt-4o-mini` (light), `gpt-4o` (depth/crisis/emotion/finance), `text-embedding-3-small` (memory embeddings). Max tokens 4000/2000.

### 6.6 Supabase  — LIVE
Env: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (server.js:13-14, engine.py:34-35). Frontend uses the anon key embedded in index.html.
Files: `server.js` (all REST/RPC), `engine.py` (pipeline writes), `index.html` (auth + reads + some writes), all edge functions.
Auth (`sbClient.auth.getSession`, `onAuthStateChange`), REST (`/rest/v1/<table>`), RPC (`/rest/v1/rpc/match_conversation_history` added tonight), edge functions in `supabase/functions/`.

### 6.7 Plausible  — LIVE
Env: none (client-side script).
Files: `index.html:796` (script tag), 8 event-tracking points: `stack_add` (146), `ISI_complete` (1195), `practitioner_click` (8733), `IRI_trigger` (10437), `safety_check_run` (13479), `safety_check_result` (13511), `cart_open` (13608), `fullscript_click` (13627).

### 6.8 Google Places  — PIPELINE-ONLY
Env: `GOOGLE_PLACES_KEY` (engine.py:36), wired in `.github/workflows/beast.yml:27-31` via `GOOGLE_API_KEY` secret.
Files: `engine.py:307-339`.
Not called at runtime. 4x daily scrape across 50+ cities and 18 wellness categories.

### 6.9 Claude API (Anthropic)  — PIPELINE-ONLY
Env: `CLAUDE_API_KEY` (engine.py:38).
Files: `engine.py:522-556` (YouTube transcript → products + protocols extraction via `claude-sonnet-4-20250514`).
**Flag vs. CLAUDE.md claim:** CLAUDE.md states "5% → Claude Opus (drug interactions, crisis, research)." The audit did not find any runtime call to Claude in `server.js` — the safety-check endpoint uses `gpt-4o`, not Claude. Claude runs only in the pipeline.

### 6.10 YouTube Data API  — LIVE (runtime) + PIPELINE
Env: `YOUTUBE_API_KEY` (server.js:1634, engine.py:37).
Files: `server.js:1632-1658` (`/api/youtube` with fallback), `engine.py:478-569`.

### 6.11 Spotify  — LIVE (with fallback)
Env: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` (server.js:1663).
Client-credentials OAuth. Falls back to hardcoded playlist IDs if creds missing.

### 6.12 Eventbrite  — LIVE (with fallback)
Env: `EVENTBRITE_API_KEY` (server.js:1691).
Static NOLA events if key missing.

### 6.13 Meetup  — LIVE (with fallback)
Env: `MEETUP_API_KEY` (server.js:1711). GraphQL.

### 6.14 Yelp  — LIVE (runtime only)
Env: `YELP_API_KEY` (server.js:1733, also referenced in engine.py:40 but no pipeline caller).

### 6.15 Open-Meteo  — LIVE (free, no auth)
Called from `index.html:2235` (dashboard) and referenced in `server.js`.

### 6.16 Nominatim (OpenStreetMap)  — LIVE (free, no auth)
Called from `index.html:2232`, `4718`, `5749`.

### 6.17 OpenFDA  — LIVE (free)
`server.js:735-760`.

### 6.18 RxNav/RxNorm  — LIVE (free)
`server.js:762-782`.

### 6.19 DailyMed  — LIVE (free)
`server.js:784`.

### 6.20 PubMed (NCBI eUtils)  — LIVE (free)
`server.js:793`.

### 6.21 USDA FDC  — LIVE (uses `DEMO_KEY`)
`server.js:809`.

### 6.22 ClinicalTrials.gov  — LIVE (free)
`server.js:819`.

### 6.23 SAMHSA Treatment Locator  — LIVE (free, client-side)
`index.html:5721-5786`.

### 6.24 GoodRx — LINK-OUT (no API)
`index.html` recovery tab MAT medication cards.

### 6.25 iHerb  — NOT FOUND (disabled)
Referenced in CLAUDE.md + engine.py comments. `scrape_iherb()` function exists but was never wired to the `--source` dispatch. Workflow step removed in commit `ad1b6ab`.

### 6.26 Reddit, Open Food Facts  — REFERENCED BUT ORPHAN
CLAUDE.md lists them as pipeline sources. `engine.py` has `scrape_reddit()` at line 611 and `scrape_food()`/`scrape_open_food_facts()` references, but **neither is in the BEAST workflow** (`.github/workflows/beast.yml` only dispatches npi/fda/google/youtube/amazon/pubmed/status). They run only if engine.py is invoked without `--source` (full-cycle manual invocation).

### 6.27 GitHub Pages webhook  — STUB
Env: `PAGE_BUILD_WEBHOOK` (engine.py:41).
Referenced but no caller in the code.

### 6.28 AirNow (air quality)  — UNKNOWN
Env: `AIRNOW_API_KEY` (engine.py:1018). Found but the audit did not trace its use. Flagging.

---

## 7. Citizenship / Pioneer status

Pioneer/citizenship is a tier concept: Explorer (free), Pioneer Citizen (founding — 12 months free), PRO ($9.99/mo).

### Reads
- `index.html:3638` — live count fetch: `fetch(SBU+"/rest/v1/profiles?citizenship_status=eq.citizen&select=count")` → displays "N Pioneer Citizens" in hero (line 3326).
- `index.html:13084-13090` — `checkCitizenshipStatus()` reads `citizenship_status === 'citizen'` from the user's profile row and shows/hides `pp-citizen-card`.

### Writes (enforcement points)
- `index.html:12956` — on free Pioneer claim, `startStripeCheckout()` sets `citizenship_status: 'citizen'`, `citizen_tier: 'pioneer_founding'`, `citizen_since: <now>`.
- `index.html:13066` — records affiliate transaction `recordAffiliateTransaction('pioneer', 'citizen_pioneer_free', 0)`.
- `server.js:1960` (inside `handleStripeWebhook`) — on successful Stripe payment, patches `profiles` with the active protocol, customer ID, protocol start time. Does not directly set `citizenship_status` — that happens on the frontend.

### Decorative / marketing references
- `index.html:239, 957, 968, 984` — Open Graph + schema.org descriptions mention "Free forever for Pioneer Citizens."
- `index.html:4970, 4974` — Passport hero messaging.
- `index.html:5067-5084` — Passport tier cards showing Explorer/Pioneer/PRO prices.

### Plain-English summary

Pioneer status is a **database flag with light UI gating**. Specifically:
- Read in **1 place** (live count for marketing display).
- Checked by the UI in **1 place** (Passport tab citizen card visibility).
- Decoratively surfaced in **5+ places** (marketing copy, tier cards, schema metadata).
- **Enforced on the backend: zero times.** No server.js endpoint checks `citizenship_status` before serving content. Pioneer tier is currently a frontend visibility flag + a payment-acknowledgement marker, not an access gate on any premium feature.

The Stripe webhook writes `active_protocol` fields but does not write `citizenship_status` itself — that's handled client-side at checkout time (`index.html:12956`), which means a user who never completes the in-app flow but paid via another channel would not get the flag set.

---

## 8. Passport tab deep dive

### 8.1 Location
Markup at `index.html:4917-5254`. Mount logic at `index.html:9299` (`if(tab==='passport'){setTimeout(initPassport,80)}`; `initPassport` defined at `index.html:8482`). Auth listeners at `index.html:6851-6852`.

### 8.2 Two screens

**Auth screen** (`index.html:4985-5024`): email + password signup, toggle to sign-in, "Create My Passport" button calling `doSignUp()`, "Explore without an account" fallback.

**Profile screen** (`index.html:5026-5252`), shown only once `sbClient.auth.getSession()` returns a user:
- Header card with animated BHI ring (SVG at 5030), user name (5032), tier badge (5033), session count (5036), streak counter (5037).
- Upgrade card (5043-5084): three-tier ladder Explorer / Pioneer (free 12mo) / PRO ($9.99/mo), with `startStripeCheckout()` (line 5071) and `startPaidCheckout('price_...QN')` (line 5079) buttons.
- Life dimensions grid (5118-5128): 9 clickable tiles — Sleep, Mind, Movement, Nutrition, Social, Finance, Spirit, Recovery, ECS — each displays "--" placeholder; clicking opens an Alvai query for that topic.
- Wellness focus chips (5130-5139): 8 toggles (sleep/anxiety/weight/energy/longevity/recovery/pain/financial), default-active is sleep.
- My Wellness Stack container (`pp-cart-container`, line 5155) — populated by cart JS.
- Saved Journeys container (`pp-paths-container`, line 5159) — populated dynamically.
- Health Data panel (5162-5214):
  - Manual entry form (5189-5204): weight, resting HR, HRV, sleep hours, steps/day, energy 1-10, anxiety 1-10, mood 1-10, current meds, primary goal → submit `saveManualHealthData()`.
  - File import (5206-5214): Apple Health, Oura Ring, Whoop/Garmin/Fitbit.
  - FHIR export button (5182): "↓ Export Health Record (FHIR R4)".
- Session history (5240-5241): refresh button + `session-list` container populated from Supabase.
- Settings (5244-5248): `clearAllPassportData()`, `confirmDeleteAllHistory()` (added in wire 2), `exportFullPassport()`.

### 8.3 Mount sequence

1. `sbClient.auth.getSession()` (line 6883) — if logged in, sets `currentUser`, calls `showProfile()`, calls `loadPassport()`.
2. `loadPassport()` (line 6885) — POSTs to `/api/personalize` with `{user_id}`, stashes result in `window._passport`.
3. `loadSessions()` (line 6981) — `sbClient.from('conversations').select('id,title,mode,created_at').eq('user_id', currentUser.id).order('updated_at', {ascending:false}).limit(10)`.
4. `initPassport()` (line 7771, fires on tab click) — populates UI from `window._passport`.
5. Auth state change listener (line 6884) — re-fires on login/logout.

### 8.4 What the user actually sees today

**Logged out:** functional signup/signin form. "Explore without an account" works.

**Logged in:**
- Header card shows name + tier + session count (auto-loaded). **BHI ring shows 0** because no scoring logic populates it (hardcoded `score=0` at line 5150).
- Tier card works: Pioneer/PRO buttons route to Stripe.
- Life dimensions all show "--" — the `/api/personalize` response is not wired to populate them.
- Wellness focus chips work.
- Wellness stack + saved journeys are empty by default (no in-tab creation mechanism — stack is populated via the Vessel cart flow).
- Health data form renders but **saveManualHealthData() is not defined in the audited code**. Data entry is visible but does not persist.
- File import picker opens but `handleHealthFileImport()` is not defined.
- FHIR export button is present but `exportFHIR()` is not defined.
- Session history loads real data from Supabase `conversations` table (this works).
- Clear data + export full passport buttons present but handlers not fully traced.

### 8.5 Missing functions (referenced but not located in audit)

`doSignUp`, `doSignIn`, `toggleAuth`, `showProfile`, `showAuth`, `saveManualHealthData`, `handleHealthFileImport`, `exportFHIR`, `startStripeCheckout`, `startPaidCheckout`, `toggleHealthPanel`, `showManualEntry`, `toggleFocus`, `initPassport`.

These may be defined further down in index.html (the file is 13,378 lines and the audit spot-checked key ranges) or may be legitimately absent. A follow-up targeted grep for each name is the next verification step.

### 8.6 State: **~35% functional**

- **Works:** auth, session history, tier tiles, quick-ask to Alvai from life-dimension tiles, Stripe routing.
- **Doesn't work or unverified:** BHI ring (always 0), life-dimension values (always "--"), manual health data persistence, file import parsing, FHIR export, wellness stack sync from Vessel cart, full-passport export.

In plain terms: the Passport is a **conversation-history viewer with a very handsome health passport skin on top**. The passport skin promises FHIR export, cross-device health-data merge, and per-dimension scoring. None of that is implemented today. What IS implemented is auth + a list of your past conversations.

---

## 9. Subsystem deep dives

### 9.1 ISI (Identity Stability Index) — **LIVE, input + routing, no persistence**

- Entry modal: `index.html:1119-1230`. Auto-opens 4 seconds into the session (line 1228). 4 Likert questions (groundedness, clarity, connection, body alignment).
- Scoring: sum 0-20, then categorized into Stable (≥16) → Vessel tab, Drifting (10-15) → Alvai, Fragmented (<10) → Alvai with deeper opening. Logic at lines 1180-1189.
- Persistence: **sessionStorage only** (`bleu_isi_score`, `bleu_isi_state`, `bleu_isi_done`) at lines 1191-1193. Lost on tab close.
- Prompt injection: on chat send, read sessionStorage and append "ISI reading this session: <state> (<score>/20). Walk with this." to system prompt (line 7219).
- Analytics: Plausible event `ISI_complete` (line 1195).
- Schema: `user_coherence` table has `isi_fusion_score`, `isi_language_sample` columns defined in `supabase/migrations/add_coherence_index.sql:21-22` — **nothing writes them**. ISI readings never reach the database.

**Gap:** the database columns exist but nothing writes them. The more sophisticated coherence metrics in that schema (`ci_composite`, `velocity_class`, `bifurcation_proximity`, `circadian_phase`) are **defined but never populated**. The CI scoring that IS happening (`server.js:1230-1240`, inside the `/api/chat` post-response fire-and-forget block) is a simple keyword heuristic on each message, not what the schema was designed for.

### 9.2 IRI (Impulse Regulation Index) — **PROMPT-ONLY, no code enforcement**

- Defined as prompt instructions in `server.js:181-196`: trigger keywords (weight loss, GLP-1, semaglutide, binge eating, etc.), 4-question behavioral intake, 3-path routing (Lifestyle / Regulation / Pharmacological Consideration).
- Language rules: "metabolic load" not "obese/overweight"; never recommend GLP-1 without intake; no shame framing.
- GLP-1 product stack in edge function: `supabase/functions/alvai/index.ts:1068, 1121` (magnesium glycinate, B12, berberine, protein calc; Hims Weight / Ro Body / Found telehealth links).
- Routing: `supabase/functions/alvai/index.ts:1291` pattern match on weight/GLP keywords adds "metabolic" to paths.

**State:** the IRI is a **prompt pattern**, not a coded state machine. The 4-question intake happens inside a conversation if the model follows the prompt, not as structured UI. The three paths don't correspond to code branches — they're guidance for the model's reasoning. There's no enforcement that prevents a user from getting GLP-1 links without the intake; the prompt simply tells the model not to. Commit `8e097a9` swapped the old "ECS Support" path for "Regulation" — a prompt change.

### 9.3 Care Twin — **NEWLY LIVE (commit 999330f, shipped tonight)**

- Server memory helpers: `server.js:536-649` (callSupabaseRPC, embedText, resolveIdentity, storeConversationTurn, loadShortTermHistory, loadSemanticRecall, buildRecallBlock).
- `/api/chat` and `/api/chat/stream` now load short-term history and semantic recall before building the prompt (server.js:1169-1180, 1282-1295) and write turns to `conversation_history` after response completes (1253-1259, 1326-1337).
- Client: `getConversationId()` function defined at `index.html:10628-10632`, backing sessionStorage key `bleu_conversation_id`. Sent as `conversation_id` on both the main `ask()` fetch (line 10506) and the Vessel quick-ask (line 3152).
- Table + RPC: `conversation_history` (user_id text, session_id text, role, content, embedding vector(1536), timestamps), RPC `match_conversation_history` locked to service_role with SECURITY DEFINER.

**What works now:**
- Authenticated users: semantic recall across their prior sessions, short-term history in current conversation.
- Anonymous users: within-session continuity only.
- Embeddings: stored for authenticated user turns + assistant turns.
- Stream-abort guard: `full.length >= 20` check prevents storing fragments.

**Known gaps:**
- Anonymous → authenticated memory merge: backlogged, not implemented.
- Dual-write to legacy `conversation_memory` still happening (`server.js:1263` TODO).
- No reader surface yet — recall is injected into the model prompt but never displayed to the user (no "remembering…" UI).
- Recall quality hasn't been validated against real traffic — we will see after Render redeploys.

### 9.4 BEAST (data pipeline) — **PARTIAL, documentation/reality drift**

`.github/workflows/beast.yml` runs 4x daily (cron `0 6/12/18/0 * * *`) and explicitly dispatches only **6 of 9 implemented sources**: NPI, FDA, Google Places, YouTube, PubMed, Amazon. Then a `--status` run.

| Source | In engine.py | In BEAST workflow | Status |
|---|---|---|---|
| NPI | yes (scrape_npi) | yes | working |
| FDA | yes (scrape_fda) | yes | working |
| Google Places | yes (scrape_google) | yes | working |
| YouTube | yes (scrape_youtube) | yes | working |
| PubMed | yes (scrape_pubmed) | yes | working |
| Amazon | yes (scrape_amazon) | yes | working |
| Reddit | yes (scrape_reddit, line 611) | **no** | implemented but never scheduled |
| Open Food Facts | yes (scrape_food, line 742) | **no** | implemented but never scheduled |
| Yelp | yes (scrape_yelp) | **no** | implemented but never scheduled |
| iHerb | yes (scrape_iherb, line 650) | removed in commit ad1b6ab | orphan — not in --source dispatch dict, never callable |

Engine's `--source` dispatch at `engine.py:1168-1171` supports: npi, fda, google, youtube, reddit, amazon, samhsa, hrsa, environmental, skus, pubmed, food, yelp. **iHerb is not in the dispatch**, so even a manual `python engine.py --source iherb` would error.

CLAUDE.md claims "10 sources" — reality is **6 scheduled, 3 implemented-but-orphaned, 1 dead**.

---

## 10. Environment variables

Every `process.env.X` and `os.getenv(X)` reference found in audited files.

### Backend Node (server.js)
| Variable | File:line | Purpose |
|---|---|---|
| OPENAI_API_KEY | server.js:12 | OpenAI chat + embeddings |
| SUPABASE_URL | server.js:13 | Supabase project URL |
| SUPABASE_SERVICE_KEY | server.js:14 | Service-role DB access |
| SUPABASE_ANON_KEY | server.js:19 | Auth-verification gateway apikey (least-privilege) |
| TWILIO_ACCOUNT_SID | server.js:21 | Twilio SMS |
| TWILIO_AUTH_TOKEN | server.js:22 | Twilio SMS |
| TWILIO_PHONE_NUMBER | server.js:23 | Twilio SMS sender |
| YOUTUBE_API_KEY | server.js:1634 | `/api/youtube` runtime |
| SPOTIFY_CLIENT_ID | server.js:1663 | `/api/spotify` |
| SPOTIFY_CLIENT_SECRET | server.js:1663 | `/api/spotify` |
| EVENTBRITE_API_KEY | server.js:1691 | `/api/events` |
| MEETUP_API_KEY | server.js:1711 | `/api/meetup-events` |
| YELP_API_KEY | server.js:1733 | `/api/yelp` |
| STRIPE_SECRET_KEY | server.js:1892 | Stripe webhook signing |
| STRIPE_WEBHOOK_SECRET | server.js:1893 | Stripe webhook verification |
| PORT | server.js:1981 | Server listen port (default 8080) |

### Data pipeline (engine.py)
| Variable | File:line | Purpose |
|---|---|---|
| SUPABASE_URL | engine.py:34 | Supabase REST target |
| SUPABASE_SERVICE_KEY | engine.py:35 | Supabase service-role writes |
| GOOGLE_PLACES_KEY | engine.py:36 | Google Places scraping |
| YOUTUBE_API_KEY | engine.py:37 | YouTube scraping |
| CLAUDE_API_KEY | engine.py:38 | YouTube transcript → products/protocols |
| AMAZON_PARTNER_TAG | engine.py:39 | Affiliate tag (default `bleu-live-20`) |
| YELP_API_KEY | engine.py:40 | (configured but no pipeline caller) |
| PAGE_BUILD_WEBHOOK | engine.py:41 | Orphan — no caller found |
| AIRNOW_API_KEY | engine.py:1018 | Air quality — usage not traced |

### CLAUDE.md says required
`OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, GOOGLE_PLACES_KEY, CLAUDE_API_KEY, AMAZON_PARTNER_TAG`.
- `SUPABASE_SERVICE_ROLE_KEY` — listed in CLAUDE.md but **no code reference found**. Either renamed to `SUPABASE_SERVICE_KEY` (which is what the code actually uses) or a stale entry.

---

## 11. TODO / FIXME / DEPRECATED / HACK comments

Searched every `.js`, `.ts`, `.py`, `.html`, `.sql` file in the repo for TODO/FIXME/XXX/HACK/DEPRECATED/NOTE markers.

**Total hits: 3** (and only one is load-bearing).

| File:line | Marker | Text |
|---|---|---|
| server.js:1263 | TODO | `// TODO: remove after conversation_memory migration — audit readers first.` (reader audit completed April 23, 2026 — see `docs/wire-3-conversation-memory-audit-20260423.md`; dual-write removal now gated only by Supabase dashboard check) |
| bleu-total-repair.py:256 | NOTE (SQL comment) | `-- Format phones to (XXX) XXX-XXXX` (inside a one-shot migration script; not runtime) |
| engine.py:464 | section marker | `# ── BIOHACKING + QUANTIFIED SELF (dashboard, vessel) ──` (code organization, not a todo) |

The codebase has **very few explicit TODO markers**. That is not the same as saying there is little outstanding work — the audit above surfaced many half-built features (Passport write paths, BHI scoring, map tab, spirit tab, ecsiq tab). They exist as silent gaps rather than marked ones. Future hygiene improvement: adopt explicit TODO markers at stub points so gaps are grep-able.

---

## 12. Honest gap summary

### 12.1 Live and working

- **Server core**: chat endpoints (`/api/chat`, `/api/chat/stream`), safety-check, directory, practitioner lookup, click tracking, pageviews, session upserts, reorder reminder endpoint, Stripe webhook, Twilio SMS send + inbound webhook — all wired, all reachable, all have Supabase and external-API paths traced.
- **Data pipeline**: 6 of 9 implemented sources run on a 4x-daily cron (NPI, FDA, Google Places, YouTube, PubMed, Amazon).
- **Frontend tabs that work end-to-end**: dashboard (BHI animation + Open-Meteo weather), learn (video library with Supabase + fallback), community (event APIs + resource links), therapy (12 modes + therapist finder UI), recovery (sobriety counter + SAMHSA meeting finder + GoodRx MAT cards), vessel (supplement catalog + Amazon affiliate).
- **Integrations**: Stripe, OpenAI, Supabase auth/REST/RPC, Twilio, Plausible, Fullscript link-outs, Amazon affiliates, every free public data API used (FDA, RxNav, DailyMed, PubMed, USDA, ClinicalTrials, Open-Meteo, Nominatim, SAMHSA).
- **Tonight's work (Care Twin)**: server-authoritative short-term history + pgvector semantic recall for authenticated users, just deployed via commit `999330f`. Anonymous within-session continuity works; cross-session recall works for authenticated users.
- **ISI modal**: 4-question intake, scoring, sessionStorage persistence, prompt injection.

### 12.2 In the code but unused, partial, or orphaned

- **Passport tab write paths**: `saveManualHealthData()`, `handleHealthFileImport()`, `exportFHIR()` referenced but not located in the audit. Health data form submits into the void. FHIR export is a button, not a feature.
- **BHI (BLEU Health Index) score**: animated ring renders, score is hardcoded to 0. No population logic found.
- **Life-dimension values in Passport**: all show "--". The `/api/personalize` response is not wired to populate them.
- **Map tab**: `_bleuMapRestart()` referenced on tab activation but not defined in audited code.
- **Spirit tab**: `findSpiritCenters()` referenced but not defined.
- **ecsiq tab**: CSS classes exist, content rendering logic not surfaced.
- **Missions tab**: listed in `_knownModes` but no rendering code found.
- **user_coherence schema vs. writes**: the table has 20+ columns for sophisticated coherence metrics (velocity classes, bifurcation proximity, quantum cognition eligibility, ISI fusion). Actual writes populate only a simple 4-score average from a keyword heuristic.
- **ISI persistence**: sessionStorage only — never reaches `user_coherence.isi_fusion_score` / `isi_language_sample` despite those columns existing.
- **IRI**: exists only as prompt text, not as code. No structured intake, no enforced routing.
- **conversations table**: read by the frontend (session history list in Passport), **never written by anything in this repo**. Either the edge function writes it, or it's a ghost table whose reads always return empty.
- **legacy `conversation_memory` dual-write**: TODO to remove.
- **Data pipeline sources not in BEAST workflow**: Reddit, Open Food Facts, Yelp implemented but never scheduled. iHerb implemented but not even dispatchable.
- **`/api/send-reorder-reminders`**: no in-repo cron triggers it. Needs an external Render job or GitHub Actions trigger or it never fires.
- **CLAUDE.md's "5% → Claude Opus"** clinical routing claim: not implemented. No `server.js` code path calls Anthropic. Safety-check uses `gpt-4o`. Claude only runs inside the pipeline for YouTube transcripts.
- **Citizenship enforcement**: zero backend gates. `citizenship_status` is a display flag, not an access control.
- **Edge function `supabase/functions/alvai/index.ts`**: 2363 lines, touches many tables (`session_embeddings`, `commitments`, `emotional_signals`, `predictive_signals`, `care_twin_state`, `agent11_syntheses`, `marketplace_practitioners`). **No code path in `server.js` or `index.html` calls it.** Whether it is invoked from outside this repo or is dead code is an open question and probably the single biggest unknown in this audit.
- **`autonomous-engine.js`, `server-v4.js`, `alvai-v3.ts`**: present at root but not traced by the audit. `server-v4.js` looks like an older server version; `alvai-v3.ts` is referenced by some SELECTs that mirror the edge function. Status: unclear.
- **`SUPABASE_SERVICE_ROLE_KEY`** in CLAUDE.md — not referenced anywhere in code. Likely a stale doc entry.
- **`PAGE_BUILD_WEBHOOK`, `AIRNOW_API_KEY`** — declared but no in-repo caller.

### 12.3 Referenced or expected but doesn't exist in this Codespace

- **`bleu-core-loop` repo** — UNKNOWN. Not in `/workspaces`.
- **`bleu-research-console` repo** — UNKNOWN. Not in `/workspaces`.
- **RLS policies** — Only one SQL migration in the repo (`add_coherence_index.sql`) and it defines a table, not policies. Any RLS rules that exist live only in the Supabase dashboard. There is no in-repo source of truth for access control.
- **Pioneer/PRO subscription logic** on the backend — Stripe writes `active_protocol` but the lifecycle (renewal, cancellation, downgrade, expiry of the 12-month Pioneer founding window) has no code in `server.js`.
- **FHIR R4 export** — a button exists, no function.
- **Dr. Felicia booking flow** — referenced in Passport upgrade copy, no UI or endpoint.
- **Practitioner booking** — referenced in Pioneer tier benefits, no endpoint.
- **Missions tab** — in mode map, no UI.
- **`sessionStorage.bleu_conversation_id` → Supabase memory migration on login** — Care Twin anon→auth merge is on the roadmap but not written.

---

## Appendix A — agents used for this audit

Five research agents ran in parallel: Supabase tables inventory, server.js endpoints/helpers, frontend tabs + Passport deep dive, integrations inventory, citizenship + ISI/IRI/Care Twin/BEAST. Each was prompted with a narrow scope, instructed to cite file:line for every claim, and told to prefer "UNKNOWN" over guessing. Their reports were integrated above; where an agent guessed a column type (e.g. `conversation_history.user_id` as uuid?) the audit overrode it with verified ground truth from the earlier SQL build session.

## Appendix B — things the audit did not verify

- **`supabase/functions/alvai/index.ts` actual runtime path**: whether it's invoked, where from, how often.
- **Specific line ranges in `index.html` past line ~13,000**: the file is 13,378 lines and the audit spot-checked key handlers. Functions referenced by name but not found may still exist.
- **RLS policies in Supabase dashboard**: not in this repo.
- **Render/Railway actual runtime config**: deploy target, env vars set, scheduled jobs. Not in this repo.
- **Any caller of `/api/send-reorder-reminders`**: not found; may be externally cronned.
- **What the edge function writes to tables like `session_embeddings`, `predictive_signals`, etc.** on what trigger: not traced.
- **`autonomous-engine.js` role in the runtime**: not read end-to-end.

These are the right places to dig next if you want a fuller picture.
