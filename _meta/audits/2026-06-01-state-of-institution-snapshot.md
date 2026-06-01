# State of Institution Snapshot — 2026-06-01

**Audit scope:** Read-only institutional state check plus this audit document. No production code, schema, database, or commerce behavior was modified.

**Working branch:** `codex/state-of-institution-snapshot-2026-06-01`.

**Repository basis:** Local checkout at `e75f194e554562bdcf80478b396e5cf03b394bff`, plus unauthenticated GitHub public pages for open PR inventory where local clone had no usable remote fetch.

**Important limitation:** The local Git clone is shallow and only had a `work` branch at task start. GitHub public HTML showed the default branch as `main` and the repository history as 882 commits, but `git fetch origin main` could not run from this container because the CONNECT tunnel returned HTTP 403. Therefore: commit-list details below come from the local checkout that matches the latest visible merge commit; open-PR details come from public GitHub HTML; mergeability/updated-at fields that GitHub did not expose without API access are marked unknown rather than inferred.

---

## Q1 — What is in `main` right now?

### Branch / latest commit

- **Default branch on GitHub:** `main`. The GitHub repository page identifies `main` as the selected/default branch and shows `882 Commits` for the repository history.
- **Local checkout branch before audit branch creation:** `work`, at `e75f194e554562bdcf80478b396e5cf03b394bff`. This commit is a merge into `main`: `Merge pull request #7 from bleudreamzone-coder/codex/fix-hardcoded-ci-test-paths`.
- **Latest local commit date:** `2026-05-31T23:03:22-05:00`.
- **Latest local commit author:** `bleudreamzone-coder <bleudreamzone@gmail.com>`.
- **Total commits:** GitHub public page reports **882 commits** on the repository. The local shallow clone reports **115** reachable commits, so the 115 count is not the institutional total.

### Last 10 reachable commits, newest first

| # | SHA | Date | Author | Message | Codex vs human |
|---:|---|---|---|---|---|
| 1 | `e75f194e554562bdcf80478b396e5cf03b394bff` | 2026-05-31 23:03:22 -05:00 | `bleudreamzone-coder` | `Merge pull request #7 from bleudreamzone-coder/codex/fix-hardcoded-ci-test-paths` | Human GitHub account merge of a `codex/...` branch. |
| 2 | `63348c1094bbd1b2758a248e9c727fe4134c8229` | 2026-05-31 22:56:59 -05:00 | `bleudreamzone-coder` | `Fix CI smoke test repo paths` | Human Git author; branch context suggests Codex-generated work. |
| 3 | `196b334ccc63843c2a547411fdf9ab743860aab3` | 2026-05-31 22:40:45 -05:00 | `bleudreamzone-coder` | `Update bleu_care_commerce_policy_v1.md` | Human-authored/unknown automation; not bot-authored in git metadata. |
| 4 | `53f6a579d3c56895063f2073afd54e0dce504f47` | 2026-05-31 22:28:38 -05:00 | `bleudreamzone-coder` | `Update last reviewed date in README` | Human-authored/unknown automation; not bot-authored in git metadata. |
| 5 | `fb48dd32b70aa7f2a35d6a7a065569f6f212b342` | 2026-05-31 22:21:51 -05:00 | `bleudreamzone-coder` | `Add files via upload` | Human GitHub upload; not bot-authored in git metadata. |
| 6 | `79e0fa6874bc63e349efef9884577bdde39230b5` | 2026-05-31 19:59:37 -05:00 | `bleudreamzone-coder` | `Merge pull request #5 from bleudreamzone-coder/codex/create-signal-object-v1.1-schema-files` | Human GitHub account merge of a `codex/...` branch. |
| 7 | `1a447b1d1e4f36fcfa28723daa4b58a5dc37ef60` | 2026-05-31 19:30:16 -05:00 | `bleudreamzone-coder` | `feat(schemas): add Signal Object v1.1 schema in shadow mode` | Human Git author; branch context/commit style indicate Codex-generated PR work. |
| 8 | `55f621b7974d59f7573b45f9d5d45d264fff1496` | 2026-05-29 19:10:59 -05:00 | `bleudreamzone-coder` | `Merge pull request #4 from bleudreamzone-coder/codex/amend-pr-#3-for-schema-bug-fixes` | Human GitHub account merge of a `codex/...` branch. |
| 9 | `5489b563568cd5f35130586fa936e6920ab2632a` | 2026-05-29 18:16:23 -05:00 | `bleudreamzone-coder` | `Add total system blueprint schema fixes` | Human Git author; Codex branch context from merge. |
| 10 | `d06cc6995fc1b926aac641e8e43209d3be312902` | 2026-05-29 17:17:04 -05:00 | `bleudreamzone-coder` | `Merge pull request #2 from bleudreamzone-coder/codex/review-codex-reconciliation-decisions` | Human GitHub account merge of a `codex/...` branch. |

**Bot-authorship finding:** The reachable git metadata does **not** show `chatgpt-codex-connector[bot]` or another bot as commit author in the last 10 commits. Several commits are merged from branches prefixed `codex/`, so they should be treated as Codex-produced work merged by the `bleudreamzone-coder` GitHub account, not as bot-authored commits in git metadata.

---

## Q2 — What foundation schemas are present?

### `core/schemas/` inventory

| File | Present? | Line count | Finding |
|---|---:|---:|---|
| `core/schemas/signal_object_v1.1.schema.json` | ✅ yes | 466 | Present as a shadow-mode Signal Object JSON Schema. Its title is `Signal Object v1.1`, and its description says it is not wired to production paths. |
| `core/schemas/decision_object_v1.1.schema.json` | ❌ no | n/a | Not present in `core/schemas/`. |
| `core/schemas/trust_packet_v1.1.schema.json` | ❌ no | n/a | Not present in `core/schemas/`. There is a separate markdown doctrine artifact at `_meta/schemas/trust_packet_v1.md`, but no core JSON Schema file. |
| `core/schemas/README.md` | ✅ yes | 15 | Present. |

### Other schema files

- The only JSON Schema file present under `core/schemas/` is `signal_object_v1.1.schema.json`.
- There are no Decision Object or Trust Packet JSON Schema files in `core/schemas/` as of this snapshot.

### What `core/schemas/README.md` lists

- The README states that `core/schemas/` stores production-ready JSON Schemas for future four-function runtime work and that the files are **shadow-mode artifacts** not wired into `server.js`, `/api/chat`, route handlers, Supabase migrations, or production paths.
- Its inventory table lists only `signal_object_v1.1.schema.json`, with purpose: validating Prism/`decompose()` Signal Object fields including primary intent, Six Bands, probabilistic variant blend, risk flags, evidence need, Three Voices, and Six Pressures.
- The README closes the scope boundary by saying schemas define validator form only and do not activate clinical claims, alter chat behavior, change commerce routing, or bypass future Captain Soul-Gate / Dr. Felicia review gates.

---

## Q3 — What open pull requests exist?

GitHub public HTML shows **2 open PRs** and **5 closed PRs** for `bleudreamzone-coder/bleu-system`.

### Open PR inventory

| PR | Title | Branch | Author | Created | Last updated | Files / diff | Touches `core/schemas/`? | Merge conflicts | Review bot comments |
|---:|---|---|---|---|---|---|---|---|---|
| #6 | `Constrain early ALVAI commerce surfaces` | `codex/restrict-premature-commerce-in-alvai-flow` → `main` | `bleudreamzone-coder` | Jun 1, 2026 | Unknown from unauthenticated HTML/API-limited view; page activity visible Jun 1, 2026. | 2 files: `server.js` and `supabase/functions/alvai/index.ts`; visible diff totals: 67 additions / 0 deletions in `server.js`, 35 additions / 7 deletions in `supabase/functions/alvai/index.ts`, total 102 additions / 7 deletions. | No. Visible files are `server.js` and `supabase/functions/alvai/index.ts`. | Unknown. Public HTML did not expose GitHub `mergeable` state, and API/fetch access was unavailable. | Yes. `chatgpt-codex-connector[bot]` reviewed commit `389f108a4b` and left P2 comments: remember commerce concern after first gated turn in `server.js`, and carry stated concern across follow-up replies in the Supabase edge function. |
| #3 | `docs: add total-system blueprint audit for Agents SDK migration` | `codex/paste-total-system-prompt-to-codex` → `main` | `bleudreamzone-coder` | May 29, 2026 | Unknown from unauthenticated HTML/API-limited view; page activity visible May 29, 2026. | 1 markdown file, `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md`; PR text says the audit is ~538 lines. | No runtime/schema file change visible. The PR text says it drafted production-spec schemas inside the audit document as proposals, not added schema fixtures. | Unknown. Public HTML did not expose GitHub `mergeable` state, and API/fetch access was unavailable. | No substantive bot review comments were visible in the unauthenticated PR page; only the Codex task link/error shell was visible. |

### PR state conclusion

- PR #5 (Signal Object) **did merge** into the current main-line history: merge commit `79e0fa6874bc63e349efef9884577bdde39230b5` says `Merge pull request #5 from bleudreamzone-coder/codex/create-signal-object-v1.1-schema-files`.
- PR #6 is **not Charlie / Decision Object**. It is an open commerce-restraint PR.
- Decision Object and Trust Packet schema PRs are not visible as open PRs in the public PR list.

---

## Q4 — What tests exist for the schemas?

### `tests/schemas/` inventory

| Test file | Present? | Fixture assertion count | What it covers |
|---|---:|---:|---|
| `tests/schemas/signal-object-v1.1.test.js` | ✅ yes | 5 fixture checks | Two valid fixtures (`sleep + SSRI Signal Object`, `crisis Signal Object`) and three invalid fixtures (`missing signal_id`, `variant probability > 1.0`, `unknown life_stage band value`). |

The test itself prints `Signal Object v1.1 schema fixtures: 5/5 passed` when successful.

### Package script

- `package.json` includes `"test:schemas": "node tests/schemas/signal-object-v1.1.test.js"`.
- `package.json` also maps `npm test` to `npm run test:schemas`.

### Smoke test existence and dry-run

- `tests/integration/per-mode-chat.smoke.js` exists.
- It is explicitly dry-run by default: comments state that live runs require `RUN_LIVE=1`, because live `/api/chat` calls cost OpenAI tokens and write rows to production tables.
- It checks 13 non-CannaIQ modes plus CannaIQ, with no-leak and response-shape assertions in live mode.
- Dry-run command result on 2026-06-01: `node tests/integration/per-mode-chat.smoke.js` exited 0 with `DRY RUN OK — re-run with RUN_LIVE=1 to execute live.`

---

## Q5 — What audit documents were filed in the last 7 days?

Date window requested: **2026-05-25 through 2026-06-01**. Files present under `_meta/audits/` in that window:

| File | Brief description | Merged PR reference or future work? |
|---|---|---|
| `_meta/audits/2026-05-26-day80-activation.md` | Day 80 activation summary for Waves 9–11: order email, reorder cron, and magic-link wiring state. | References shipped/deployed work; no explicit PR number. Names future/manual blockers around magic-link activation and DNS. |
| `_meta/audits/2026-05-26-day80-deep-audit-summary.md` | Summary of six read-only Day 80 audits and top institutional findings. | Proposes future work and names blockers; not tied to a single merged PR. |
| `_meta/audits/2026-05-26-day80-deploy.md` | Verifies merge/deploy of `day79-scaffold` into `main` at merge commit `e37a6e8`, plus production endpoint checks. | References a merged branch/commit, not an open PR. |
| `_meta/audits/2026-05-26-day80-grant-lockdown.md` | Documents RLS/grant lockdown applied through the Supabase Management API. | Describes applied operational/database security work; no future PR proposed in the opening section. |
| `_meta/audits/2026-05-26-day80-integration-smoke.md` | Endpoint integration smoke results and a bug found/fixed around magic-link verify token consumption. | References a fixed production bug; not a future proposal. |
| `_meta/audits/2026-05-26-day80-smoke-report.md` | Smoke report explaining what was verified locally and what was deferred due to missing runtime secrets. | Names deferred future checks requiring Render/runtime credentials. |
| `_meta/audits/2026-05-26-doctrine-consistency-audit.md` | Read-only audit of doctrine consistency and missing doctrine areas. | Proposes future doctrine work. |
| `_meta/audits/2026-05-26-frontend-inventory-audit.md` | Inventory of frontend surfaces and likely dead/legacy client code. | Proposes future cleanup/inventory work. |
| `_meta/audits/2026-05-26-migration-verify.md` | Verifies Day 80 migration artifacts and table creation results. | References applied migration work; no direct PR number. |
| `_meta/audits/2026-05-26-operational-readiness-audit.md` | Readiness audit of live operational dependencies and dashboard-only unknowns. | Proposes future/manual operational actions. |
| `_meta/audits/2026-05-26-server-architecture-audit.md` | Maps server.js architecture, extraction seams, and monolith risks. | Proposes future refactor work. |
| `_meta/audits/2026-05-26-supabase-schema-audit.md` | Reviews Supabase schema posture and access/RLS concerns. | Proposes future security/schema work. |
| `_meta/audits/2026-05-26-test-coverage-gap-audit.md` | Documents missing automated regression coverage. | Explicitly proposes future tests. |
| `_meta/audits/2026-05-26-total-system-audit.md` | Total system audit across env, schema, auth, routes, product, and launch blockers. | Proposes future work and blocker resolution. |
| `_meta/audits/2026-05-29-cannaiq-excision-plan.md` | Plans removal/excision boundaries for CannaIQ/Bud coupling. | Explicit future PR plan; not merged work itself. |
| `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` | Institutional blueprint for Agents SDK migration, Five Machines/Four Primitives, and schema roadmap. | Proposes future 40-PR migration roadmap; PR #3 is open, so not merged as of this snapshot. |
| `_meta/audits/2026-05-29-cron-secret-render-fix.md` | Render paste checklist for `REORDER_CRON_SECRET` and `SESSION_SECRET`. | Future/manual Captain dashboard action; not code. |
| `_meta/audits/2026-05-29-dns-sms-verification.md` | DNS/SMS verification audit proving missing cron secret and naming remaining dashboard checks. | Future/manual operational work; not a merged PR. |
| `_meta/audits/2026-05-29-pr-bravo-signal-object-schema.md` | Audit for PR Bravo / Signal Object v1.1 schema. | References the Signal Object schema PR, later visible as merged PR #5 in git history. Proposes PR Charlie and PR Delta as future work. |
| `_meta/audits/2026-05-29-resend-dns-diagnostic.md` | Diagnostic showing Resend DNS records for `bleu.live` were not published and giving manual fix path. | Future/manual DNS action; not code. |
| `_meta/audits/2026-06-01-state-of-institution-snapshot.md` | This audit: current institutional snapshot across commits, schemas, PRs, tests, audits, blockers, and commerce posture. | Audit-only document generated by this branch. |

---

## Q6 — What blockers are named in recent audits?

Scope searched: audits filed in the last 14 days that are present locally (`2026-05-26*`, `2026-05-29*`, and this audit once created). This section reports only the audit trail. It does **not** verify Render, Resend, Supabase, GoDaddy, Twilio, or live operational dashboards.

### Resend DNS

- `2026-05-26-day80-deep-audit-summary.md` names `Resend domain bleu.live unverified` as the top severity item and says Citizen #1 is blocked.
- `2026-05-29-resend-dns-diagnostic.md` says the Day-81 magic-link probe did not arrive and concludes: `None of Resend's required DNS records are published for bleu.live`.
- The same diagnostic says the fix is in Captain's hands: copy Resend DNS records into GoDaddy.
- Current state per audit trail: **blocked / manual DNS action required**, unless Captain completed it outside the repo after the audit. No repo evidence proves it was resolved.

### `REORDER_CRON_SECRET`

- `2026-05-29-dns-sms-verification.md` says the production web service returned HTTP 500 with `REORDER_CRON_SECRET not configured`.
- It explicitly concludes: `REORDER_CRON_SECRET is NOT SET in the Render production web service`.
- It says both the reorder-reminder cron and the day-7 outcome SMS cron are blocked by the same missing secret.
- `2026-05-29-cron-secret-render-fix.md` says both daily SMS crons have been silently fail-closing since deploy and gives a Render paste checklist.
- Current state per audit trail: **blocked / manual Render env-var action required**, unless Captain completed it outside the repo after the audit. No repo evidence proves it was resolved.

### `SESSION_SECRET`

- `2026-05-26-server-architecture-audit.md` flags an ephemeral `SESSION_SECRET` fallback: if unset and Render runs multiple instances, cookies signed by one instance can fail on another.
- `2026-05-29-dns-sms-verification.md` says `SESSION_SECRET` cannot be verified externally and recommends Captain set it on the web service; otherwise sessions can invalidate on redeploy or across instances.
- `2026-05-29-cron-secret-render-fix.md` includes `SESSION_SECRET` in the same manual Render paste checklist.
- Current state per audit trail: **unknown but risky / manual Render action recommended**. No repo evidence proves it was set.

### `SUPABASE_SERVICE_KEY` rotation

- `2026-05-29-dns-sms-verification.md` carries `Rotate SUPABASE_SERVICE_KEY` as a top-priority security item from Day 80.
- `2026-05-29-cron-secret-render-fix.md` says `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` were verified set, but `SUPABASE_SERVICE_KEY rotation is still pending`.
- Current state per audit trail: **pending security rotation**. No repo evidence proves rotation occurred.

### Roy / Citizen #1

- `2026-05-26-day80-deep-audit-summary.md` says Resend DNS blocks Citizen #1.
- `2026-05-29-cron-secret-render-fix.md` says that after four actions plus Captain's GoDaddy and Render pastes, the path to `Roy as Citizen #1` is open.
- `2026-05-29-resend-dns-diagnostic.md` says magic-link email arrival would make auth end-to-end operational and unblock Citizen #1.
- Current state per audit trail: **Citizen #1 remains gated by manual DNS/Render verification until proven otherwise**.

### `magic-link`

- `2026-05-26-day80-integration-smoke.md` caught a magic-link verify bug where a valid token could be consumed and still return 401; the audit says the integration smoke surfaced it and later recorded a clean run.
- `2026-05-26-day80-activation.md` says magic-link wiring exists in `js/bleu-prod-hooks.js` but was guarded `AUTH_LIVE=false` at that time.
- `2026-05-29-dns-sms-verification.md` says the magic-link endpoint returns 200 by design regardless of send outcome, and that delivery proof lives in `bleu_comms`/inbox checks not available from the sandbox.
- `2026-05-29-resend-dns-diagnostic.md` ties magic-link success to Resend DNS publication and inbox verification.
- Current state per audit trail: **code path exists and had smoke coverage, but end-to-end live email delivery remains dependent on Resend DNS/dashboard state**.

---

## Q7 — What is the commerce restraint posture?

This read is against the current checked-out `server.js` after PR Bravo is merged and before open PR #6 is merged.

### Current `server.js` facts

- **Approximate line count:** `server.js` is **4,162 lines**.
- **`runCommerceSteward()` exists:** yes, defined at `server.js:1749`.
- **`MODE_PROMPTS` catalog exists:** yes, starts at `server.js:803`.
- **Inline product/commerce language in prompts:** yes. The general/home prompt says product categories can be relevant and that cards below the response carry the action; it also tells the model cards appear below with Add to Cart buttons and instructs wording like `Take a look at what's below`.
- **`scoreReceptivity()` exists:** yes, `server.js:1665`.
- **`scoreStability()` exists:** yes, `server.js:1699`.
- **`openWindowGate()` exists:** yes, `server.js:1726`.

### Commerce path as currently shipped

- `/api/chat` computes `suppressCommerce` from emotional intent and writes a `suppressCommerce` SSE flag when true, but still calls `runCommerceSteward(res, p, crisis)` after streaming the model response.
- `/api/chat/stream` similarly writes a suppression flag in distress/crisis cases and also calls `runCommerceSteward(res, p, crisis)` after streaming.
- `runCommerceSteward()` runs `openWindowGate()` first; it suppresses cards for crisis and open-unstable states by returning early or capping `max_cards` to zero.
- If not crisis/open-unstable/CannaIQ, `runCommerceSteward()` queries `bleu_catalog`, runs `productBrain()`, runs `safetyBrain()` and `cartBrain()`, maps matching catalog entries into `cards`, and writes them to the SSE stream whenever `cards.length` is nonzero.
- The card payload includes `price_cents`, `monthly`, `stripe_price_id`, `amazon_url`, and `fullscript_template_id`, so the cards are real commerce surfaces, not merely educational placeholders.

### Estimated turns to first commerce surface

**Honest estimate: 1 turn for a product-matching, non-crisis, stable query.**

Reasoning:

1. A normal non-greeting `/api/chat` request proceeds through OpenAI streaming and then calls `runCommerceSteward()` before `[DONE]`.
2. `runCommerceSteward()` does not require a prior assistant turn in the currently merged code.
3. If `productBrain()` matches catalog entries and `openWindowGate()` does not block, cards can be emitted in the same response.
4. Greeting-cache messages (`hello`, `hi`, `help`, etc.) return from cache and do not call the commerce steward, so greetings are not commerce surfaces. But a first substantive prompt such as `I cannot sleep` can reach the commerce steward on turn 1.

### Is Dr. Felicia's concern real and urgent?

**Yes, the concern is real in current `main`.** The merged code already has safety gates for crisis/open-unstable states and commerce language discipline in prompts, but it does **not** yet contain PR #6's proposed first-response/no-stated-concern commerce gate. Current main can surface commerce cards on the first substantive stable product-matching turn. Open PR #6 appears to be a direct mitigation attempt, but it remains unmerged and has Codex P2 review comments about follow-up concern persistence.
