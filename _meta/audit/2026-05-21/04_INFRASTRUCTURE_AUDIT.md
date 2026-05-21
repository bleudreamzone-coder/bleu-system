# 04 — Infrastructure Audit

**Audit date:** 2026-05-21
**Scope:** every external integration and deployment surface, grounded in code.

---

## Supabase

| Item | Value / Status | Source |
|---|---|---|
| Project ID | `sqyzboesdpdussiwqpzk` (Bleu-Live) | `docs/bleu-system-state.md` + `index.html:795` (anon key issuer payload) + migrations header |
| Region | UNKNOWN — not in repo | Check dashboard |
| Plan | UNKNOWN — not in repo | Likely Free or Pro; pgvector + edge functions require Pro |
| Public URL | `https://sqyzboesdpdussiwqpzk.supabase.co` | `index.html:795` |

### Tables (inventoried in repo, 28 total — table list from `docs/bleu-system-state.md` §2)
| Table | Writer | Reader | RLS |
|---|---|---|---|
| `practitioners` | engine.py | server.js, edge fn | UNKNOWN |
| `locations` | engine.py | server.js | UNKNOWN |
| `products` | engine.py | edge fn | UNKNOWN |
| `conversation_history` (Care Twin) | server.js | server.js (+ RPC `match_conversation_history`) | service_role-only on RPC; table RLS UNKNOWN |
| `conversation_memory` (legacy) | server.js | nothing in repo | UNKNOWN — TODO at server.js:1263 to remove |
| `user_coherence` | server.js (CI scoring, reorder reminders) | server.js (SMS batch) | UNKNOWN |
| `user_arcs` | edge fn (alvai/index.ts:263) | edge fn | UNKNOWN |
| `session_embeddings` | edge fn | edge fn | UNKNOWN |
| `commitments` | edge fn | edge fn | UNKNOWN |
| `emotional_signals` | edge fn | edge fn | UNKNOWN |
| `predictive_signals` | edge fn | nothing in repo | UNKNOWN |
| `care_twin_state` | edge fn | edge fn | UNKNOWN |
| `care_twin_embeddings` | edge fn | nothing | UNKNOWN |
| `agent11_syntheses` | edge fn | edge fn (cache lookup) | UNKNOWN |
| `marketplace_practitioners` | manual (dashboard) | edge fn | UNKNOWN |
| `clicks` | server.js (/api/track) | nothing | UNKNOWN |
| `pageviews` | server.js (/api/ping) | nothing | UNKNOWN |
| `sessions` | server.js (/api/session) | server.js | UNKNOWN |
| `profiles` | server.js (Stripe wh + reorder), index.html (auth + Passport) | server.js (/api/personalize), index.html (loadPassport, dashboard) | **MUST EXIST** — frontend uses anon key. Policies not in repo. |
| `conversations` | nothing in repo | index.html (session history list) | UNKNOWN — likely written by edge fn |
| `product_feedback` | index.html | nothing | UNKNOWN |
| `session_feedback` | index.html | nothing | UNKNOWN |
| `user_signals` | index.html | nothing | UNKNOWN |
| `youtube_videos` | engine.py | index.html | UNKNOWN |
| `protocols` | engine.py | nothing | UNKNOWN |
| `pubmed_studies` | engine.py | nothing | UNKNOWN |
| `reddit_mentions` | engine.py (orphan — not scheduled) | nothing | UNKNOWN |
| `scrape_log`, `daily_reports`, `environmental_data` | engine.py | nothing | UNKNOWN |

### RLS — the biggest single gap in this layer
- **No RLS policies are committed to this repo.** The only migrations are: `add_coherence_index.sql` (DDL on `user_coherence` + `profiles`), `20260422_add_passport_health_columns.sql` (10 columns on `profiles`), `20260422_add_bhi_columns.sql` (2 columns on `profiles`). **Zero policies.**
- The server uses the `SUPABASE_SERVICE_KEY` (service role) for every call (`server.js:14`) — this **bypasses RLS regardless of policies**.
- The frontend writes to `profiles`, `conversations`, `product_feedback`, `session_feedback`, `user_signals` via the anon key (`sbClient`). So whatever RLS exists on those tables must allow `authenticated` users to write their own rows — but the policies are not in the repo.
- The `match_conversation_history` RPC is the one piece of access control documented in the repo: `REVOKE` from `public/anon/authenticated`, `GRANT` to `service_role`, with `SECURITY DEFINER`. That's the right pattern. It just isn't applied to anything else.
- **Action:** dump all live RLS policies from the Supabase dashboard via `pg_dump` / `supabase db dump --role-only` and commit them to `supabase/migrations/`. Without this, the platform cannot answer "who has access to user X's health data?"

### Migrations as source of truth
**NO.** Migrations are partial. The repo has 3 migration files. The live database has 28+ tables, ~150 columns, and RLS policies, plus the `match_conversation_history` SQL function and `jazz_bird_ci_research` view — none of which appear in any migration in this repo except `add_coherence_index.sql` (which itself was applied manually per its comment header).

Migrations are applied manually in the SQL editor. Process per `docs/passport-migration-20260422.md`: "Navigate to SQL Editor → New query → Paste → Run." This is reasonable for an early-stage project but is the single largest source of dev/prod drift risk.

### Backup policy
UNKNOWN — not in repo. Supabase Pro includes daily backups by default but retention varies by plan.

### Auth config
- Provider: Email + password (`sbClient.auth.signUp`, `signInWithPassword`)
- Magic-link, OAuth, MFA: UNKNOWN — none referenced in repo
- Session policy: Supabase default
- Anon key embedded in shipped HTML (`index.html:795`) — this is correct usage (anon key is public by design) but should be reviewed periodically for scope

### Edge functions
| Function | Status | Notes |
|---|---|---|
| `alvai/` (v5.0 20-agent, 2,363 L) | AMBIGUOUS-DEAD | No in-repo caller. May have external traffic from CannaIQ frontend or city deployments. Single resolution check: Supabase dashboard → Edge Functions → `alvai` → Invocations tab. |
| `alvai/index.ts.backup`, `.backup2` | DEAD | Should be deleted |
| `stripe-checkout/` | LIVE | Creates Stripe Checkout sessions for the frontend |

---

## Stripe

| Item | Value / Status | Source |
|---|---|---|
| Mode | UNKNOWN whether keys in prod are live or test | Code reads from `STRIPE_SECRET_KEY` env |
| Sleep Reset $49/mo | `price_1TEKQmK4cATmIFbokmkYg47S` | server.js:1803, index.html:12783 ✓ matches |
| Stress Protocol $45/mo | `price_1TEKS6K4cATmIFbo1OW7BeCW` | server.js:1804, index.html:12784 ✓ matches |
| **Longevity Core $69/mo** | server.js: `price_1TEKSWKcATmIFbojDTEJng9` (**missing the `4`**), index.html: `price_1TEKSWK4cATmIFbojDTEJng9` | server.js:1805 ✗ MISMATCH → webhook activation fails |
| Gut Reset $55/mo | `price_1TEKSsK4cATmIFbouxOBHtwQ` | server.js:1806, index.html:12786 ✓ matches |
| PRO $9.99/mo | `price_1TBPtAK4cATmIFboFVb9m0QN` | server.js:1807, index.html:12780 ✓ matches |
| Webhook endpoint | `/stripe-webhook` | server.js:1656 → `handleStripeWebhook` at 1810 |
| Signature verification | **CONDITIONAL** — only runs if `STRIPE_SECRET && STRIPE_WEBHOOK_SECRET` are both set | server.js:1718. If either is missing, signature check is skipped and any POST is accepted. |
| Idempotency | **NO** — handler does not check `event.id` against a processed-events table; a Stripe retry could double-grant |
| Active live transactions to date | UNKNOWN — check Stripe dashboard |
| Subscription cancellation handler | **NONE** — no `customer.subscription.deleted` branch; `active_protocol` is never cleared |
| Renewal / Pioneer 12-month expiry | **NONE** — no aging-out logic for `citizen_since` |
| Tax / VAT | **NONE** — no Stripe Tax usage |
| Refund handling | **NONE** — no refund webhook branch |

### Bug: Longevity Core protocol not granted to paying customers
- Frontend (`index.html:12785, 13757`) sends `price_1TEKSWK4cATmIFbojDTEJng9` to Stripe.
- Stripe webhook (`server.js:1805`) maps `price_1TEKSWKcATmIFbojDTEJng9` (no `4`) to `longevity_core`.
- For any Longevity Core payment, `PROTOCOL_MAP[priceId]` returns `undefined`, the `|| 'pro'` fallback fires, and the user's `active_protocol` is set to `'pro'` instead of `'longevity_core'`.
- Fix: one character. server.js:1805 → `price_1TEKSWK4cATmIFbojDTEJng9`.
- Back-fill: any rows in `profiles` where `active_protocol = 'pro'` was set by a Longevity Core checkout (queryable by joining to Stripe via `stripe_customer_id`) needs to be corrected.

---

## Twilio

| Item | Value / Status |
|---|---|
| Phone number | `TWILIO_PHONE_NUMBER` env var; actual number UNKNOWN |
| Account SID / Auth Token | env vars set; values UNKNOWN |
| `sendSMS()` function | LIVE at `server.js:24` |
| Batch reorder reminder sender | LIVE at `server.js:1613` `/api/send-reorder-reminders` |
| Inbound reply webhook | LIVE at `server.js:1637` `/twilio-reply` |
| Scheduled trigger for `/api/send-reorder-reminders` | **NOT IN REPO** — no GitHub Actions cron, no Render cron job. Endpoint exists but nothing fires it. |
| STOP / HELP keyword compliance | **NOT IMPLEMENTED** — inbound webhook handles "YES" / else only |
| TCPA consent capture | **PARTIAL** — phone collected via Fullscript modal (`792e88f`) but no explicit consent text in code |
| Opt-out tracking | **NOT IMPLEMENTED** |
| SMS templates versioned | NO — inline string in `server.js:1623` |

---

## Fullscript

| Item | Value / Status |
|---|---|
| Practitioner ID | `fstoler` (per Fullscript URLs in `index.html`) |
| API integration | **NONE** — link-out only |
| Published protocols | Daily Foundation Protocol shipped (commit `2e77f0f`); 4 protocol bundles per Stripe prices |
| Commission flow | UNKNOWN — handled by Fullscript dashboard |
| Attribution from ALVAI conversation → Fullscript click → purchase | **NOT TRACKED** — `clicks` table writes the click but Fullscript does not post back conversions to bleu.live |
| Plausible `fullscript_click` event | LIVE | `index.html:12912` |

---

## Amazon Associates

| Item | Value / Status |
|---|---|
| Tag | `bleulive20-20` (canonical, frontend) and `bleu-live-20` (engine.py default) — **TWO DIFFERENT TAGS** |
| Active | LIVE (links generated in frontend product cards + prompt copy) |
| Disclosure compliance | UNKNOWN — Amazon Associates ToS requires explicit affiliate disclosure on any page with affiliate links. Privacy page does not appear to mention it (not fully verified in this audit). |
| Product allowlist | NO — `engine.py` curated lists per category; runtime prompt allows the model to recommend Amazon products freely |
| Tag mismatch impact | If `engine.py` writes products with `bleu-live-20` and frontend renders with `bleulive20-20`, commissions could be attributed to the wrong tag account — or both could be valid. **Verify in Amazon Associates dashboard.** |

---

## Deployment

| Item | Value / Status |
|---|---|
| Frontend | Served by Node (`server.js`) on the same Render instance as backend |
| Backend host | **Render** (`https://bleu-system.onrender.com` per `index.html:795`) |
| Domain | `bleu.live` (CNAME at repo root) |
| SSL / TLS | LIVE (Render default) — assumed since calls succeed |
| HSTS | UNKNOWN — no `Strict-Transport-Security` header set in `server.js` |
| CDN | UNKNOWN — Render's edge caching only |
| Railway config (`railway.json` + `nixpacks.toml`) | Present in repo; **deployment target is Render per shipped frontend URL.** Railway config is either historical or for a parallel/staging target. |
| CI/CD pipeline | NONE — Render auto-deploys on git push to main; no test gate, no lint gate, no migration apply step |
| Monitoring / alerting | UNKNOWN — no in-repo config |
| Logs | Render console (default); no centralization, no retention policy in repo |
| Incident response runbook | NONE in repo |
| Environment | Single environment (production) — no staging |

---

## OpenAI

| Item | Value / Status |
|---|---|
| Models used at runtime | `gpt-4o-mini` (light modes), `gpt-4o` (default + crisis), `text-embedding-3-small` (1536-dim memory) |
| Models claimed by CLAUDE.md but not used at runtime | Claude Opus (only used in `engine.py` for YouTube transcripts) |
| Timeout | 30 s per call (`server.js:1024`) |
| Token cap | 4,000 (gpt-4o) / 2,000 (mini) |
| Fallback on failure | `getFallback()` returns "I'm here. Something slowed down on my side. Tell me what's going on right now." |
| Rate limiting | NONE in code — relies on OpenAI org-level limits |
| Cost monitoring | NONE in repo |
| BAA | NOT in evidence |

---

## External APIs (free / public)

| API | Used at runtime | Pipeline use | Cache | Rate limit | Fallback |
|---|---|---|---|---|---|
| OpenFDA | yes (`fdaDrugLookup`) | no | NO | upstream only | empty string |
| RxNorm/RxNav | yes (`rxNormInteraction`) | no | NO | upstream only | empty string |
| DailyMed | yes (`dailyMedLookup`) | no | NO | upstream only | empty string |
| PubMed eUtils | yes (`pubmedSearch`) | yes (`engine.py`) | partial via `agent11_syntheses` cache (edge fn only) | upstream only | empty string |
| USDA FDC | yes (`nutritionLookup`) — uses `DEMO_KEY` | no | NO | upstream only (DEMO_KEY is heavily rate-limited) | empty string |
| ClinicalTrials.gov | yes (`clinicalTrials`) | no | NO | upstream only | empty string |
| Open-Meteo | yes (frontend + `getWeather`) | no | NO | upstream | empty |
| Nominatim (OSM) | yes (frontend) | no | NO | OSM's 1-req/s policy | crash silently |
| SAMHSA Treatment Locator | yes (frontend, recovery tab) | no | NO | upstream | empty |
| AirNow | env var declared | unknown caller | n/a | n/a | n/a |
| NPI (NPPES) | no | yes — primary pipeline source | written to DB | nightly cron | nightly retry |
| Google Places | no | yes | written to DB | API key | nightly retry |
| YouTube Data API | yes (`/api/youtube`) | yes | partial (DB) | API key | hardcoded videos |
| Spotify | yes (`/api/spotify`) | no | NO | client-creds OAuth | hardcoded playlists |
| Eventbrite | yes (`/api/events`) | no | NO | API key | hardcoded events |
| Meetup GraphQL | yes (`/api/meetup-events`) | no | NO | API key | static events |
| Yelp Fusion | yes (`/api/yelp`) | env var only | NO | API key | crash silently |
| iHerb | NO | dead — not dispatched | n/a | n/a | n/a |
| Reddit, Open Food Facts | NO | functions exist, not scheduled | n/a | n/a | n/a |

**Observations:**
- **No caching for any clinical / safety lookup** — every `/api/safety-check` or chat enrichment hits FDA / RxNorm / DailyMed live. If OpenFDA goes down (it does, periodically), drug interaction warnings silently stop showing.
- **USDA on `DEMO_KEY` is a known quota landmine** — get a real key and rotate it through env.
- **Nominatim policy violation risk** — they ask for ≤1 req/s with descriptive User-Agent. The frontend hits them on tab activation. At any meaningful scale this gets the IP banned.

---

## CI/CD

| Workflow | Trigger | Action | Status |
|---|---|---|---|
| `.github/workflows/beast.yml` | 4× daily cron + manual dispatch | `pip install -r requirements.txt` then `python engine.py --source npi/fda/google/youtube/pubmed/amazon` then `--status` | LIVE |
| Test suite on push | — | none | **MISSING** |
| Lint on push | — | none | **MISSING** |
| Deploy gate (typecheck/test pass before Render auto-deploy) | — | none | **MISSING** |
| Migration apply on deploy | — | none — applied manually in dashboard | **MISSING** |
| Secret scan (TruffleHog / gitleaks) | — | none | **MISSING** |
| Dependency vulnerability scan | — | none (`npm audit` can't run — no lockfile) | **MISSING** |

`.github/workflows/deploy-alvai.yml` is **listed in `.gitignore`** but does not exist as a file. Either it was deleted and `.gitignore` was left dangling, or it lives only on a developer's machine.

---

## Environment variables

| Var | Used by | Required for | Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | server.js | every chat | If missing, OpenAI calls fail → fallback string |
| `SUPABASE_URL` | server.js, engine.py | every DB op | |
| `SUPABASE_SERVICE_KEY` | server.js, engine.py | every DB op (bypasses RLS) | **Code uses `SUPABASE_SERVICE_KEY`. CLAUDE.md lists `SUPABASE_SERVICE_ROLE_KEY` — stale.** |
| `SUPABASE_ANON_KEY` | server.js (only used in `SUPABASE_ANON_KEY` constant; the value also embedded in `index.html:795`) | Auth gateway | Public by design |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | server.js | SMS | |
| `STRIPE_SECRET_KEY` | server.js | webhook | |
| `STRIPE_WEBHOOK_SECRET` | server.js | webhook signature verification | **If missing, signature check is bypassed silently** |
| `GOOGLE_PLACES_KEY` | engine.py | Google Places scrape | |
| `YOUTUBE_API_KEY` | server.js, engine.py | YouTube | |
| `CLAUDE_API_KEY` | engine.py | YouTube transcript → product/protocol extraction | Only place Claude is used |
| `AMAZON_PARTNER_TAG` | engine.py | affiliate links written to products | Default `bleu-live-20`; frontend uses `bleulive20-20` — **mismatch** |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | server.js | /api/spotify | falls back to static |
| `EVENTBRITE_API_KEY` | server.js | /api/events | |
| `MEETUP_API_KEY` | server.js | /api/meetup-events | |
| `YELP_API_KEY` | server.js, engine.py | /api/yelp | |
| `AIRNOW_API_KEY` | engine.py | unclear — not traced to a caller | orphan |
| `PAGE_BUILD_WEBHOOK` | engine.py | unclear — no caller traced | orphan |
| `PORT` | server.js | Listen port | default 8080 |

**No `.env.example` in repo.** A new developer must read the source to discover these.

---

## Domain ownership and DNS

| Item | Value / Status |
|---|---|
| Apex domain | `bleu.live` (CNAME file) |
| Registered to | Fleur De BleuDream LLC (per audit prompt context) |
| Render custom domain | `bleu.live` → CNAME / ALIAS to `bleu-system.onrender.com` (assumed; not in repo) |
| Email | UNKNOWN — no MX records in repo |
| SSL renewal | Automatic via Render |
| WHOIS privacy | UNKNOWN |

---

## Infrastructure gaps — ordered

1. **RLS policies not in repo.** Dump them, commit them, treat them as the source of truth.
2. **Stripe Longevity Core webhook bug** — one character fix, plus back-fill of affected `profiles`.
3. **Stripe webhook signature verification can be bypassed** if env vars missing — change to fail closed.
4. **No idempotency on Stripe webhook** — add an `event_id` dedupe table.
5. **No subscription lifecycle handling** — cancellation, renewal failure, refund, Pioneer expiry all unhandled.
6. **No CI tests, no deploy gate, no migration step** — every push to main auto-deploys with zero safety net.
7. **`/api/send-reorder-reminders` has no scheduler** — endpoint never fires.
8. **No environment separation** — production-only. Migrations applied manually in dashboard. No staging.
9. **No `.env.example`** — onboarding friction.
10. **Two Amazon affiliate tags in active use** (`bleulive20-20` vs `bleu-live-20`) — pick one and unify.
11. **No caching on FDA/RxNorm/DailyMed/USDA lookups** — every chat that fires enrichment makes 4–6 outbound calls.
12. **The edge function may be running on Supabase but is unreached from this repo** — confirm or delete.
