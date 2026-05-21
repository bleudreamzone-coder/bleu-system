# 10 — Tech Debt Register

**Audit date:** 2026-05-21
**Format:** ID · Title · Description · Layer · Severity · Effort · Blocks
**Severity scale:** CRITICAL (revenue or safety) · HIGH (governance, security, or correctness) · MEDIUM (maintainability, drift risk) · LOW (cleanup, ergonomics)
**Effort:** S = < 1 day · M = 1–3 days · L = 1–2 weeks · XL = > 2 weeks

---

| ID | Title | Description | Layer | Severity | Effort | Blocks |
|---|---|---|---|---|---|---|
| TD-001 | Stripe Longevity Core price ID typo | `server.js:1805` maps `price_1TEKSWKcATmIFbojDTEJng9` (missing `4`). Frontend sends `price_1TEKSWK4cATmIFbojDTEJng9`. Webhook falls back to `'pro'` instead of `'longevity_core'`. Every $69/mo Longevity subscriber is misclassified. | Application | **CRITICAL** | S | accurate per-protocol revenue reporting |
| TD-002 | Stripe webhook signature verification fail-open | `server.js:1718` skips signature check when `STRIPE_SECRET || STRIPE_WEBHOOK_SECRET` is missing. Any POST to `/stripe-webhook` is then accepted. Should fail closed. | Application | **CRITICAL** | S | webhook integrity |
| TD-003 | RLS policies not in repo | The only access-control rule committed is `match_conversation_history` RPC (in comment). All other tables — `profiles`, `conversation_history`, `user_coherence`, `marketplace_practitioners`, etc. — have policies only in the Supabase dashboard. No source of truth, no CI verification. | Infrastructure | **CRITICAL** | M | every privacy / security claim |
| TD-004 | Wall violation in schema.org publisher | `index.html:1079` and 1,810+ pages in `dist/*` list "Jazz Bird 501(c)(3)" as publisher of bleu.live. Google indexes bleu.live as a Jazz Bird property. Per audit prompt: HIGH-severity entity-wall violation. | Presentation + Domain | **CRITICAL** | M | grant submissions, state procurement |
| TD-005 | `core/*.js` domain modules never wired | 5 clean isolated modules (`ci.js`, `isi.js`, `state.js`, `trajectory.js`, `alvai.js`) implementing the actual domain math — never `require`d by `server.js`. `server.js:1233` uses a parallel keyword heuristic instead. Two formulas for the same concept. | Domain | HIGH | M | true clean-architecture pattern |
| TD-006 | `.gitignore` is 36 bytes, ignores nothing standard | No `.env`, `node_modules`, `*.swp`, `.DS_Store`, etc. excluded. Any future `.env` commit is the next time `git add` is run. Currently lucky — no `.env` ever committed per history. | Infrastructure | HIGH | S | secret hygiene |
| TD-007 | No subscription lifecycle handlers | Stripe webhook handles only `checkout.session.completed`. No `customer.subscription.deleted` (cancellations leave `active_protocol` set forever), no `customer.subscription.updated` (upgrades miss), no `invoice.payment_failed` (silent churn). | Application | HIGH | M | revenue accuracy |
| TD-008 | No Stripe webhook idempotency | Stripe retries on 5xx; nothing dedupes by `event.id`. Double-grants of citizenship / protocol activation possible. | Application | HIGH | S | webhook correctness |
| TD-009 | Pioneer 12-month aging not implemented | Marketing copy promises "Founding Citizen — 12 months free." No code clears `fee_waived` or reverts `citizen_tier` after 12 months. Lifetime free for everyone who claimed it. | Application | HIGH | M | marketing-claim accuracy |
| TD-010 | Email logged in plaintext to stdout | `server.js:1849` `console.log("Payment complete: ${protocol} | user: ${userId} | email: ${email}")`. PHI-adjacent. Render's log retention spans 14+ days. | Infrastructure | HIGH | S | privacy posture |
| TD-011 | No CSRF / state-mutating endpoint origin check | CORS is `*`; `/api/memory/merge-anon`, `/api/reorder-reminder`, `/api/personalize` accept POST from any origin. | Application | HIGH | S | security baseline |
| TD-012 | No OWASP basic headers | No HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, Permissions-Policy on any response. | Infrastructure | HIGH | S | security baseline |
| TD-013 | Twilio inbound webhook missing signature verification | `/twilio-reply` accepts any POST and replies with TwiML. Forge-able. Low blast radius (TwiML goes to forged caller) but easy to fix. | Application | MEDIUM | S | security cleanliness |
| TD-014 | Conversation memory has no consent or TTL | Care Twin shipped 2026-04-22. Privacy page not updated. No retention TTL. No conversation-deletion endpoint. Raw text + 1536-dim embeddings stored indefinitely for every authenticated chat turn. | Domain + Infrastructure | HIGH | M | privacy posture, eventual GDPR/CCPA stance |
| TD-015 | Crisis hotline surfacing is prompt-only | 988 / 741741 / SAMHSA are *instructed* to the model, not enforced. A prompt-injection or model regression could route a crisis user away from hotlines. No post-response validator. No test corpus. | Domain | **CRITICAL** | M | clinical safety claim |
| TD-016 | No tests in production code path | Zero tests on `server.js`, `index.html`, `seo-engine.js`, `engine.py`. The only test file (`bleu-core/test/loop.test.js`) tests unwired modules. CI has no test step. | Cross-cutting | HIGH | L | safe refactor of TANGLED files |
| TD-017 | `server.js` is 1,898 L tangled monolith | Application + Domain (5 KB prompt + 14 mode prompts) + Infrastructure (Supabase, Stripe, Twilio, OpenAI, FDA, RxNorm, DailyMed, PubMed, USDA, ClinicalTrials, Open-Meteo, Spotify, Eventbrite, Meetup, Yelp). #2 refactor target. | Cross-cutting | HIGH | L | clean architecture |
| TD-018 | `index.html` is 13,992 L tangled monolith | Markup + 14 tabs + dimension engine (Domain) + Supabase direct writes (Infrastructure) + FHIR export + Stripe handoff + cart + ISI + Plausible + service worker + 12 Jazz Bird mentions. #1 refactor target. | Cross-cutting | HIGH | XL | clean architecture |
| TD-019 | Edge function ambiguous-dead | `supabase/functions/alvai/index.ts` (2,363 L) writes 8 tables that `server.js` never reads. No in-repo caller. May be receiving external traffic. Cannot resolve without Supabase Edge → Invocations dashboard check. | Domain + Infrastructure | HIGH | S to verify · M to delete · L to promote | architectural clarity |
| TD-020 | Two Amazon affiliate tags in active use | Frontend uses `bleulive20-20`, `engine.py:39` writes `bleu-live-20` into `products.affiliate_tag`. Two accounts could be splitting commissions or one tag is dead. | Domain | MEDIUM | S | revenue accuracy |
| TD-021 | USDA running on `DEMO_KEY` | `server.js:804 nutritionLookup` uses USDA's `DEMO_KEY` — rate-limited to ~30 req/hour. Real traffic spikes will silently start returning empty enrichment. | Infrastructure | MEDIUM | S | reliability under load |
| TD-022 | No caching of clinical-API calls | Every chat that triggers `enrichWithData` fires fresh OpenFDA / RxNorm / DailyMed / PubMed / USDA / ClinicalTrials calls. No request collapsing. No TTL. Quota burn + latency. | Infrastructure | MEDIUM | M | scale, latency, cost |
| TD-023 | `/api/send-reorder-reminders` never fires | Endpoint exists at `server.js:1613`. No cron, no GitHub Actions trigger, no Render schedule. SMS reorder reminders never sent. | Application | HIGH | S | revenue path (reorder revenue) |
| TD-024 | `autonomous-engine.js` (752 L) is orphan | Never required by any production file. Either content factory is delivered by `engine.py` (then delete autonomous-engine) or it should be wired. | Cross-cutting | MEDIUM | S–L | clarity, future content velocity |
| TD-025 | `bleu-core/` mini-project status unclear | Self-contained sub-tree with own `package.json`, the only test file in the repo, and a wired `core/*.js`. Either intended replacement or sandbox. Undocumented. | Cross-cutting | MEDIUM | S | refactor direction |
| TD-026 | ~60 DEAD files at repo root | `index (7-13).html`, `index.html.backup*`, `bleu-fix.py` … `bleu-win.py` (~17), `home*.py`, `master.py`, `ocean-*.py`, `tank-filler.py`, `server-old-claude.js`, `server-v4.js`, `server.js.backup`, plus `BLEU_*.zip` / `files (*).zip` (~80 MB) | Cross-cutting | MEDIUM | S | onboarding friction, repo size |
| TD-027 | 3 wall-violation files at repo root | `cannaiq-new.html`, `ciq.py`, `inject-cannaiq.py` — name CannaIQ, a separate entity per audit prompt. | Domain | MEDIUM | S | entity wall |
| TD-028 | No `.env.example` | Onboarding requires reading `server.js` + `engine.py` to discover ~20 required env vars. | Infrastructure | MEDIUM | S | onboarding |
| TD-029 | `SUPABASE_SERVICE_ROLE_KEY` stale in CLAUDE.md | Code uses `SUPABASE_SERVICE_KEY`; CLAUDE.md lists the longer name. Docs do not match. | Cross-cutting | LOW | S | doc accuracy |
| TD-030 | CLAUDE.md model-routing claim wrong | "5% → Claude Opus" is not implemented at runtime (Claude only in `engine.py`). | Domain | LOW | S | doc accuracy |
| TD-031 | CLAUDE.md pipeline claim overstated | "10 sources" is in reality 6 scheduled + 3 implemented-but-orphaned + 1 dead. | Domain | LOW | S | doc accuracy |
| TD-032 | iHerb scraper is unreachable | `engine.py:650 scrape_iherb` exists but not in `--source` dispatch dict; `python engine.py --source iherb` would error. Workflow step already removed (`ad1b6ab`). | Infrastructure | LOW | S | dead code removal |
| TD-033 | Reddit / Open Food Facts / Yelp scrapers not scheduled | Functions exist; not in `beast.yml`. Either wire them or remove the marketing claim they exist. | Infrastructure | LOW | S | pipeline truth |
| TD-034 | `conversations` table read but never written in repo | `index.html:7887` SELECTs from `conversations` for session-history list. Nothing in this repo writes the table. Either edge function writes externally or the list is permanently empty. | Domain | MEDIUM | S to verify | session history feature reality |
| TD-035 | `pubmed_studies`, `protocols`, `reddit_mentions`, `scrape_log`, `daily_reports`, `environmental_data` are write-only | Pipeline writes; nothing reads. Either populate readers or stop writing. | Infrastructure | LOW | S–M | data discipline |
| TD-036 | `EMOTIONAL_SESSIONS` is in-process Set | `server.js:230` stores commerce-suppression state in module-scope memory. Won't survive Render restart or scale-out to multiple instances. | Application | MEDIUM | S | scalability |
| TD-037 | No idempotency on `/api/memory/merge-anon` | Wire 1 endpoint at `server.js:1455`. Double-firing on retry could duplicate-merge. | Application | MEDIUM | S | data integrity |
| TD-038 | `_passport` vs `bleu_health` state duplication | `loadPassport` (`index.html:6885`) sets `window._passport` from `/api/personalize`; dimension engine reads from `localStorage['bleu_health']`. Two state caches for overlapping data, no sync. | Presentation | MEDIUM | M | render correctness |
| TD-039 | Schema.org `dateModified` per page is stale | Inspected `dist/anxiety/anxiety-atlanta-ga.html` has `"dateModified":"2026-03-25"` — does not reflect any subsequent changes (e.g., the BHI v1 ship). For SEO freshness and clinical-review integrity. | Domain + Presentation | LOW | S | SEO + governance |
| TD-040 | No clinical signoff log | No `docs/clinical-signoff-log.md`. No commit-message convention for "clinical-reviewed-by". Audit trail for clinical changes is implicit. | Domain | MEDIUM | S | governance documentation |
| TD-041 | No banned-claims list | No `docs/banned-claims.md` listing claims the platform will not make (cures, treats, FDA-approved). Prompt has implicit rules. | Domain | MEDIUM | S | clinical safety |
| TD-042 | Per-protocol clinical documentation missing | Sleep Reset / Stress / Longevity / Gut have Stripe SKUs; no in-repo `docs/protocols/<name>.md` with inclusion/exclusion criteria, contraindications, evidence per ingredient, review date. | Domain | HIGH | M | clinical governance, grant-readiness |
| TD-043 | No evidence-tier column on content tables | Tier 1–4 framework exists in strategy. No `evidence_tier` on `products`, `protocols`, or `seo_pages`. Cannot surface tier in UI. | Domain | HIGH | M | clinical-governance claim |
| TD-044 | No pregnancy / pediatric / geriatric red-flag detection | Zero code. No keyword match, no routing change. | Domain | HIGH | M | clinical safety |
| TD-045 | No Five Gates implementation | The audit-prompt-mentioned "Five Gates" exist only as concept. No `gates.js`. No deterministic refusal path before OpenAI call. | Domain | HIGH | M | clinical governance |
| TD-046 | Sitemap.xml conflict | Static `/workspaces/bleu-system/sitemap.xml` has 3 URLs; dynamic `seo-engine.generateSitemap` produces hundreds. Static file is stale and misleading. | Presentation | LOW | S | SEO |
| TD-047 | No `llms.txt` | No `/llms.txt` route, no file. LLM crawlers cannot find canonical structured data quickly. | Presentation | LOW | S | discoverability by LLM citation |
| TD-048 | `cities/` (154 files) parallel to `dist/cities/` (4,214) | Two parallel city-page systems. Neither served. Both stale. | Presentation | LOW | S | clarity |
| TD-049 | `dist/` content (6,025 pages) not served | High-quality pre-rendered SEO pages on disk, never served by the live server. Either migrate to dynamic engine or push to CDN or delete. | Presentation | MEDIUM | M | SEO traffic capture |
| TD-050 | No rate limiting on `/api/chat` | Direct OpenAI bill exposure to any caller. | Application | HIGH | S | cost control |
| TD-051 | No message length cap on `/api/chat` | A 10MB message would be sent to OpenAI, fail after burning tokens. | Application | MEDIUM | S | cost control |
| TD-052 | Open-redirect risk on `/api/track` | `url` parameter redirected without allowlist verification (not exhaustively verified). | Application | MEDIUM | S | security |
| TD-053 | Two parallel server files (`server-old-claude.js`, `server-v4.js`) | Predecessor implementations. Dead. | Cross-cutting | LOW | S | cleanup |
| TD-054 | Migrations applied manually in Supabase dashboard | No CI step to apply. Drift between repo migrations and dashboard schema. | Infrastructure | HIGH | M | dev/prod parity |
| TD-055 | No staging environment | Production-only. Migrations land in production directly. | Infrastructure | HIGH | L | safe-deploy practice |
| TD-056 | No `package-lock.json` | `npm audit` cannot run. Dependency pinning absent (though `package.json` declares zero deps, this still blocks audit tooling). | Infrastructure | MEDIUM | S | dependency hygiene |
| TD-057 | BHI v1 formula not clinically reviewed | Marked `v1-heuristic-pending-clinical-review`. The right discipline; review still owed. | Domain | HIGH | S (Dr. Stoler review hours) | clinical-governance claim |
| TD-058 | Per-claim citations not enforced | Prompt instructs cite-the-source; not validated. Some chat responses will pass; some will not. No measurement. | Domain | MEDIUM | M | clinical credibility |
| TD-059 | No incident response runbook | Render down, OpenAI down, Stripe webhook outage, Supabase down — no playbook. | Infrastructure | MEDIUM | M | operational maturity |
| TD-060 | `wellness_focuses` chips localStorage-only | `index.html:7393 toggleFocus` writes only to localStorage. Doesn't sync to `profiles` — survives device but doesn't survive device change. | Application | MEDIUM | S | data continuity |

---

## Severity rollup

| Severity | Count |
|---|---|
| CRITICAL | 5 (TD-001, TD-002, TD-003, TD-004, TD-015) |
| HIGH | 22 |
| MEDIUM | 21 |
| LOW | 12 |
| **Total** | **60** |

---

## Priority lenses

### Revenue-blocking
TD-001, TD-007, TD-008, TD-009, TD-020, TD-023, TD-049

### Clinical-governance blocking (next grant submission)
TD-004, TD-015, TD-040, TD-041, TD-042, TD-043, TD-044, TD-045, TD-057, TD-058

### Security baseline (before scaling traffic)
TD-002, TD-003, TD-006, TD-010, TD-011, TD-012, TD-013, TD-050, TD-051, TD-052

### Refactor enablers (before larger changes)
TD-005, TD-016, TD-017, TD-018, TD-025, TD-054, TD-055
