# 11 — Next 30 Days

**Audit date:** 2026-05-21 → target completion 2026-06-20
**Sequencing principle:** ship the irreversible safety / revenue / governance fixes in week 1. Use weeks 2–4 to build the foundation that lets every subsequent change be safer.

Each task carries: **effort** (S/M/L), **owner**, **blocked by**, **acceptance criteria**. Owners are Bleu (CTO), Felicia (CCO), TBD (needs decision), or named external (e.g., legal).

---

## Week 1 — emergency fixes (security, revenue, governance)

### W1.1 Fix Stripe Longevity Core price ID typo
- **TD:** TD-001
- **Effort:** S (15 minutes for the fix; 1–2 hours for back-fill)
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** `server.js:1805` → change `price_1TEKSWKcATmIFbojDTEJng9` to `price_1TEKSWK4cATmIFbojDTEJng9`. Deploy. Query Stripe customers with the Longevity price and join to `profiles` to find any rows where `active_protocol` is incorrectly `'pro'`; PATCH them to `'longevity_core'`.
- **Acceptance:** every existing and future Longevity customer has `active_protocol = 'longevity_core'` in `profiles`. Add a one-line test in CI (when CI exists) that asserts every key in `PROTOCOL_MAP` matches a regex `/^price_1[A-Za-z0-9]{24}$/`.

### W1.2 Stripe webhook fail-closed signature verification
- **TD:** TD-002
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** at `server.js:1716`, if either env var is missing, return 500 — do not silently skip the check.
- **Acceptance:** `curl -X POST https://bleu.live/stripe-webhook -d '{"type":"checkout.session.completed",...}'` without a valid `Stripe-Signature` returns 400. Verify in Render staging-equivalent first.

### W1.3 Stripe webhook idempotency + subscription lifecycle
- **TD:** TD-007, TD-008
- **Effort:** M
- **Owner:** Bleu
- **Blocked by:** W1.2 (touches same handler)
- **What:**
  - New `stripe_events` table with `id PRIMARY KEY` to dedupe by `event.id`.
  - Handlers for `customer.subscription.deleted` (clear `active_protocol`), `customer.subscription.updated` (update `active_protocol`), `invoice.payment_failed` (write to a `payment_failures` table or log + optional SMS to user).
- **Acceptance:** replay a recorded webhook event twice — second insertion idempotent. Cancel a test subscription in Stripe — `profiles.active_protocol` clears within 5 seconds.

### W1.4 Rewrite `.gitignore`
- **TD:** TD-006
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** replace 36-byte file with comprehensive Node + Python `.gitignore` (excludes `.env*`, `node_modules/`, `*.swp`, `.DS_Store`, `__pycache__/`, `*.pyc`, IDE files, lock files NOT excluded but listed for awareness).
- **Acceptance:** `git status --ignored` shows `.env` (created as a test) is correctly ignored. Audit `git log -p --all -- '*.env*'` confirms no `.env` ever committed (already true per discovery).

### W1.5 Dump and commit RLS policies
- **TD:** TD-003
- **Effort:** M
- **Owner:** Bleu + Supabase admin
- **Blocked by:** Supabase dashboard access
- **What:** export every RLS policy from `sqyzboesdpdussiwqpzk` via `pg_dump --schema-only --role-only` or SQL editor query against `pg_policies`. Commit to `supabase/migrations/2026-05-22_0001_existing_rls.sql`. Add a `docs/security/rls-matrix.md` listing each table → who can SELECT/INSERT/UPDATE/DELETE.
- **Acceptance:** the file exists, was generated from live DB, the matrix in the doc matches.

### W1.6 Fix Jazz Bird schema.org publisher wall violation
- **TD:** TD-004
- **Effort:** M
- **Owner:** Bleu (with Felicia for copy review)
- **Blocked by:** nothing
- **What:** in `index.html`, replace the schema.org `publisher` block (line ~1079) to `Fleur De BleuDream LLC`. Update Dr. Stoler's `jobTitle` from "Principal Investigator, Jazz Bird 501(c)(3)" to "Chief Clinical Officer, bleu.live." Keep partnership references where accurate ("Jazz Bird® NOLA, community partner"). Audit all 12+ Jazz Bird mentions: line 912, 1079, 1683, 1689, 3630, 4155, 4842, 5216, 5225, 7220, 11728, 12480, 12519, 13599. Then: regenerate (or hand-fix) `dist/anxiety|sleep|gut/*.html` if any are intended to be served — or move them out of repo.
- **Acceptance:** the JSON-LD Validator (validator.schema.org) confirms `publisher` is `Fleur De BleuDream LLC`. Footer reads "bleu.live · operated by Fleur De BleuDream LLC · community partner Jazz Bird® NOLA."

### W1.7 Crisis hotline post-response validator
- **TD:** TD-015
- **Effort:** M
- **Owner:** Bleu (with Felicia for the corpus)
- **Blocked by:** nothing
- **What:** after the OpenAI response and before sending to the client, if the user message matched the crisis regex (`/\b(suicid|self[\s-]?harm|overdose|kill myself|end it)\b/i`), check if the assistant message contains `988`, `741741`, or `1-800-273-8255`. If not, **prepend** a deterministic crisis banner: `"If you are in immediate danger, please call 988 (Suicide and Crisis Lifeline) or text HOME to 741741. I am here too. Tell me what is going on."` Then continue with the model's response. Build a small test corpus (`tests/crisis-corpus.json`) of 30 messages that must trigger hotline appearance.
- **Acceptance:** every test message in the corpus produces a response containing `988`. CI passes the test (once CI exists).

### W1.8 Stop logging email in plaintext
- **TD:** TD-010
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** `server.js:1849` — replace `email` in the log line with `userId` only, or a hash. Audit other `console.log` for PII; none observed but verify.
- **Acceptance:** Render production logs contain no email addresses.

### W1.9 Tighten CORS + add OWASP headers
- **TD:** TD-011, TD-012
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** restrict CORS to `https://bleu.live` for state-mutating endpoints. Add `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self),microphone=(),camera=()` to all responses. Add a starter `Content-Security-Policy`.
- **Acceptance:** Mozilla Observatory grade B+ or better.

### W1.10 Schedule `/api/send-reorder-reminders`
- **TD:** TD-023
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** GitHub Actions cron job (daily at 9am ET) hitting `https://bleu.live/api/send-reorder-reminders` with a bearer token. Or, equivalently, a Render Cron Job.
- **Acceptance:** first scheduled run completes, SMS reorder reminders fire to test phone numbers.

---

## Week 2 — domain layer foundations

### W2.1 Wire `core/` into the live `server.js`
- **TD:** TD-005
- **Effort:** M
- **Owner:** Bleu (with Felicia for the CI/ISI scoring sanity check)
- **Blocked by:** nothing
- **What:** replace the regex CI keyword scoring at `server.js:1233` with `core/ci.js`'s `computeCI`. Replace the implicit ISI handling with `core/isi.js`. Add `const { buildSystemPrompt } = require('./core/alvai')` and use it for one mode as a pilot (e.g., `vessel`), then expand.
- **Acceptance:** one mode runs end-to-end via `core/` modules. CI scores written to `user_coherence` use the formula in `core/ci.js`, not the ad-hoc keyword count. `bleu-core/test/loop.test.js` is run as a manual `npm test` from `core/`-path-adjusted location.

### W2.2 Extract dimension engine to module + add tests
- **TD:** TD-016, TD-018 (partial)
- **Effort:** M
- **Owner:** Bleu
- **Blocked by:** W2.1 (decide where `core/` vs `bleu-core/` lives)
- **What:** lift `computeDimensionScores`, `computeBHI`, `TIER_BANDS`, and the 9 score functions from `index.html:8034–8377` into a single module (`core/dimensions.js` or equivalent). Add unit tests for each scorer with known inputs. Import the module from `index.html` via a `<script type="module">` or build step.
- **Acceptance:** the module exists; the tests pass; `index.html` still renders BHI correctly.

### W2.3 Decide `bleu-core/` status
- **TD:** TD-025
- **Effort:** S (1 hour with original author)
- **Owner:** Bleu + author of `bleu-core/`
- **Blocked by:** nothing
- **What:** declare whether `bleu-core/` is (a) the eventual replacement to be promoted, (b) a sandbox to be archived, or (c) a parallel exploration. Write a `bleu-core/README.md` with the decision.
- **Acceptance:** the README exists. If decision is (a), W3 includes the promotion plan.

### W2.4 Write per-protocol clinical documentation
- **TD:** TD-042
- **Effort:** M (most time is Felicia's drafting)
- **Owner:** Felicia (draft) + Bleu (commit)
- **Blocked by:** nothing
- **What:** `docs/protocols/sleep-reset.md`, `stress.md`, `longevity-core.md`, `gut-reset.md`, `daily-foundation.md`. Each lists: inclusion criteria, exclusion criteria (pregnancy, age, kidney/liver, medications), evidence per ingredient with PubMed/Cochrane links, expected timeline of effect, side-effect profile, contraindicated drug interactions, clinical reviewer + signoff date.
- **Acceptance:** 5 markdown files exist. Each is linked from the Stripe product description.

### W2.5 Specify Five Gates (markdown), then implement
- **TD:** TD-045
- **Effort:** M
- **Owner:** Bleu + Felicia
- **Blocked by:** W2.4 framing
- **What:** `docs/clinical/five-gates.md` defines: Gate 1 Crisis, Gate 2 Drug Interaction, Gate 3 Pregnancy/Pediatric/Geriatric, Gate 4 Allergy/Contraindication, Gate 5 Scope. Each gate has trigger, action (allow / warn / refuse / escalate), and test cases. Then implement `src/domain/gates.js` (or `core/gates.js`) that takes `(message, user, intent) → {decision, reason, banner?}`. Call it before the OpenAI call.
- **Acceptance:** spec doc + module + unit tests for each gate. The crisis gate replaces the prompt-only approach from W1.7.

### W2.6 Evidence-tier column on protocols + products
- **TD:** TD-043
- **Effort:** M
- **Owner:** Bleu + Felicia
- **Blocked by:** W2.4 (need protocol docs first)
- **What:** migration adding `evidence_tier SMALLINT CHECK (evidence_tier BETWEEN 1 AND 4)` and `evidence_sources TEXT[]` to `protocols` and `products`. Backfill for the top 30 products + 5 protocols. Surface as a small badge in Vessel UI.
- **Acceptance:** columns exist, top 30 products populated, badge visible.

### W2.7 Pregnancy / pediatric / geriatric detection
- **TD:** TD-044
- **Effort:** S
- **Owner:** Bleu + Felicia for copy
- **Blocked by:** W2.5 (Gate 3 design)
- **What:** keyword detection (`pregnant`, `nursing`, `breastfeeding`, `child`, `kid`, `teenager`, `my (mother|father|grandmother) (is|just turned) (7\d|8\d|9\d)`, etc.). When matched, inject a safety-aware preamble into the system prompt.
- **Acceptance:** test corpus of 10 messages triggers preamble; manual verification of response tone.

---

## Week 3 — infrastructure cleanup + revenue

### W3.1 Add CI test step
- **TD:** TD-016, TD-054
- **Effort:** M
- **Owner:** Bleu
- **Blocked by:** W2.2 (need some tests to run)
- **What:** new `.github/workflows/test.yml` running on push. Steps: lint (eslint init), test (node `bleu-core/test/loop.test.js` + new `core/dimensions.test.js` + new crisis-corpus test), and a smoke test (boot `server.js` on a port, hit `/health`).
- **Acceptance:** workflow runs on the next push; passes; the badge is added to repo README (if it exists).

### W3.2 Generate package-lock.json + add npm audit
- **TD:** TD-056
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** `npm i --package-lock-only` to generate the lockfile (the project has zero deps but the file is still required for `npm audit`). Add `npm audit --audit-level=high` to the CI workflow.
- **Acceptance:** workflow includes audit step; passes with zero high-severity findings.

### W3.3 Delete the DEAD pile
- **TD:** TD-026
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** W2.3 (need `bleu-core/` decision in case it consumes anything)
- **What:** `git rm` the ~60 dead files listed in 08_TANGLED_FILES_REPORT §7. Move `BLEU_*.zip` and `files (*).zip` to an external bucket (or to a `_archive/` branch). Delete `server-old-claude.js`, `server-v4.js`, `server.js.backup`, all `index (*).html`, all `index.html.backup*`, all `bleu-*.py` (~17), all `home*.py`, `master.py`, `mp2.py`, `ocean-*.py`, `tank-filler.py`, `tab-*.py`, `nola-*.txt`, `nola-soul.py`, `cannaiq-new.html`, `ciq.py`, `inject-cannaiq.py`, `1000`, `main`, `.server.js.swp`, `alvai-v3.ts`, `autonomous-engine.js` (or wire it — see W3.4).
- **Acceptance:** repo file count drops from ~115 to ~30 at root. README updated with the inventory.

### W3.4 Resolve `autonomous-engine.js`
- **TD:** TD-024
- **Effort:** S (decision); M-L if wiring
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** if the content factory cycle should run, wire it into `server.js` boot (or into a separate Render worker). If not, delete it.
- **Acceptance:** the file is either wired (with logs proving it cycles) or removed.

### W3.5 Resolve the Supabase edge function
- **TD:** TD-019
- **Effort:** S (verification); decision-dependent
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** Supabase dashboard → Edge Functions → `alvai` → Invocations tab. If 7-day count is 0: delete the function in dashboard + delete the source in this repo. If 7-day count is nontrivial: identify the external caller (CannaIQ / city deployment), document it in `docs/edge-function-ownership.md`, and add the function source files back to a sane location (`platforms/<caller>/alvai-edge.ts`).
- **Acceptance:** the ambiguity is resolved either way.

### W3.6 Build the `revenue_daily` aggregator
- **Effort:** M
- **Owner:** Bleu
- **Blocked by:** W1.1, W1.3 (so Stripe data is correct)
- **What:** GitHub Actions cron (daily) pulling Stripe `Subscriptions` API, aggregating by `price.id` into `revenue_daily` Supabase table. Simple admin page at `/admin/revenue` (gated by service-role check) showing the table.
- **Acceptance:** table populates daily; admin page renders.

### W3.7 Unify Amazon affiliate tag
- **TD:** TD-020
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** confirmation from Amazon Associates dashboard that both tags belong to the same account
- **What:** pick canonical (`bleulive20-20` is in frontend; `bleu-live-20` in engine.py default). Update `engine.py:39`. Backfill `products.affiliate_tag` if persistence matters (does not affect runtime links since prompts and UI use canonical).
- **Acceptance:** `grep -r "bleu-live-20\|bleulive20-20" .` returns one tag.

### W3.8 Add rate limiting + message length cap
- **TD:** TD-050, TD-051
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** 30 req/min per IP on `/api/chat`; 10/min on `/api/safety-check`; cap message at 4,000 chars. In-process token bucket is sufficient for one Render instance.
- **Acceptance:** loadtest with `vegeta` confirms rate-limit behavior.

### W3.9 `.env.example` + ops README
- **TD:** TD-028, TD-029, TD-059
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** `.env.example` with every variable, commented. `docs/ops/runbook.md` with: how to deploy, how to roll back, how to check Stripe webhook health, how to verify the BEAST workflow ran, what to do when OpenAI is down. Update CLAUDE.md `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_KEY`.
- **Acceptance:** new engineer can read both files and bring up a dev environment in 30 minutes.

### W3.10 Privacy + Terms refresh
- **TD:** TD-014
- **Effort:** M (most time is legal review)
- **Owner:** Bleu (engineering) + external counsel (drafting / review)
- **Blocked by:** nothing
- **What:** update `/privacy.html` to disclose Care Twin embeddings, Amazon affiliate participation, Plausible analytics, Stripe billing posture, GDPR / CCPA rights (delete, export). Document the planned conversation deletion endpoint as forthcoming.
- **Acceptance:** updated page lives; copy initialed by counsel.

---

## Week 4 — refactor of tangled files, one file at a time

### W4.1 Extract Stripe handler from `server.js`
- **TD:** TD-017 (partial)
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** W3.1 (CI tests in place)
- **What:** move `handleStripeWebhook` + `PROTOCOL_MAP` + signature logic from `server.js:1810` to `src/infra/stripe.js`. Server requires the module.
- **Acceptance:** `server.js` is ~80 lines shorter; tests pass.

### W4.2 Extract Twilio module
- **TD:** TD-017 (partial)
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** W4.1
- **What:** move `sendSMS`, the batch-reminder endpoint, the inbound webhook into `src/infra/twilio.js`. **While there, add Twilio signature verification** (TD-013) and STOP/HELP keyword compliance.
- **Acceptance:** `server.js` is ~100 lines shorter; reminder send works; STOP keyword acknowledged.

### W4.3 Extract external-API clients
- **TD:** TD-017 (partial)
- **Effort:** M
- **Owner:** Bleu
- **Blocked by:** W4.1
- **What:** one file each — `src/infra/external/fda.js`, `rxnorm.js`, `dailymed.js`, `pubmed.js`, `usda.js`, `clinicaltrials.js`, `openmeteo.js`. Add a simple in-process LRU cache with 1-hour TTL (TD-022). Replace `DEMO_KEY` for USDA (TD-021) with a real key — register at api.data.gov.
- **Acceptance:** `server.js` is ~200 lines shorter; chat enrichment still works.

### W4.4 Extract ALVAI_CORE + mode prompts
- **TD:** TD-017 (partial)
- **Effort:** M
- **Owner:** Bleu + Felicia (for the clinical voice)
- **Blocked by:** W4.1
- **What:** `src/domain/prompts/alvai-core.md` (the 5 KB prompt, now editable in markdown), `src/domain/prompts/<mode>.md` per mode, `src/domain/prompts/index.js` that loads + assembles. Add a tiny `prompt-version` header to each so we know which version produced each response. Start a `docs/clinical-signoff-log.md` (TD-040).
- **Acceptance:** `server.js` is ~400 lines shorter; chat responses unchanged; clinical edits go through reviewing markdown not code.

### W4.5 Pioneer 12-month aging
- **TD:** TD-009
- **Effort:** M
- **Owner:** Bleu
- **Blocked by:** W3.6 (revenue aggregator gives the cohort)
- **What:** nightly cron job: for any `profiles` row where `citizen_tier = 'pioneer_founding'` and `citizen_since` is more than 12 months ago, change to `citizen_tier = 'pioneer_expired'`, set `fee_waived = false`, optionally Twilio-notify if phone present.
- **Acceptance:** test row with `citizen_since` set 13 months ago is correctly aged after one cron tick.

### W4.6 Conversation deletion endpoint + retention TTL
- **TD:** TD-014 (partial)
- **Effort:** M
- **Owner:** Bleu + Felicia
- **Blocked by:** W3.10 (legal language)
- **What:** `DELETE /api/conversations/<session_id>` that purges `conversation_history` and `conversation_memory` rows for the calling user. New nightly cron purges `conversation_history` rows older than the retention TTL (e.g., 24 months) for users who haven't opted into long-term memory.
- **Acceptance:** UI control in Passport ("Delete this conversation"); deletion verified by test.

### W4.7 Open-redirect verification on `/api/track`
- **TD:** TD-052
- **Effort:** S
- **Owner:** Bleu
- **Blocked by:** nothing
- **What:** add an allowlist of partner hostnames; reject anything not in the list.
- **Acceptance:** request with `url=https://attacker.example` returns 400.

### W4.8 BHI v1 clinical review
- **TD:** TD-057
- **Effort:** S (engineering); ~4-8 hours (Felicia)
- **Owner:** Felicia (review), Bleu (commit changes)
- **Blocked by:** W2.2 (dimensions in a testable module)
- **What:** Dr. Stoler reviews each of the 9 scorers in `core/dimensions.js` (formula, weights, range assumptions). Tier banding labels confirmed. `DIMENSION_SCORING_VERSION` updated to `v2-clinically-reviewed-2026-06`.
- **Acceptance:** signoff entry in `docs/clinical-signoff-log.md`; version string updated; tier UI text matches the signoff.

---

## Out of 30 days, on the roadmap

These are HIGH/MEDIUM items that don't fit in 30 days but should be visible on the runway. Each maps back to TDs and to deliverables this audit produced.

- **Index.html tab-by-tab extraction** (TD-018) — months of work, start with the lowest-traffic tab to learn the pattern.
- **Staging environment** (TD-055) — requires deciding Render's preview-deploy posture, second Supabase project, second Stripe in test mode.
- **Edge function decision aftermath** — if confirmed live, document ownership; if dead, archive properly.
- **`dist/` content migration** (TD-049) — 6,025 pages of high-quality SEO content currently unreachable. Decide migration target: into the dynamic engine via `seo_pages` table (preferred), or to a CDN like Vercel that fronts `bleu.live/<condition>/<city>`.
- **Multi-touch attribution** (TD-058 spirit) — from organic search → ALVAI conversation → cart → Stripe purchase.
- **Worksite Wellness module** — currently IDEA-ONLY. Needs scoping if hospitality/employer pilots are revenue priorities.
- **MFA + OAuth** (Supabase Auth) — for any HIPAA-adjacent posture.

---

## Effort and ownership totals

| Week | Effort buckets | Bleu hours (est.) | Felicia hours (est.) | External hours (est.) |
|---|---|---|---|---|
| Week 1 | 9 × S + 3 × M | ~50 | ~6 (W1.6 copy review, W1.7 corpus) | 0 |
| Week 2 | 4 × S + 5 × M | ~60 | ~12 (W2.4 drafting, W2.5/W2.7 review) | 0 |
| Week 3 | 5 × S + 5 × M | ~60 | ~2 | ~8 (legal, W3.10) |
| Week 4 | 4 × S + 4 × M | ~60 | ~6 (W4.4 prompt review, W4.8 BHI signoff) | 0 |
| **Total 30 days** | | **~230 engineer hours** | **~26 clinical hours** | **~8 legal hours** |

For one full-time engineer the load is 6 weeks of work in 4 weeks — possible only if the dead-pile cleanup (W3.3) and the docs (W2.4) are batched in single sittings, and if the Stripe / security work in week 1 is mainline-only with no scope creep. If Bleu is also driving fundraising and clinical conversations, expect 50% capacity, in which case Week 4 slips. Plan for slippage of W4.5, W4.6, W4.8 explicitly.
