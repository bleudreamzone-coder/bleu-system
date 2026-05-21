# Execution Report — 2026-05-21 Critical Fixes (v2, post-rebase)

**Branch:** `fix/2026-05-21-criticals`
**Branched from:** `main @ 36ee305` (audit checkpoint replayed on top of upstream `8f9a6d0`)
**Audit reference:** `_meta/audit/2026-05-21/00_EXECUTIVE_SUMMARY.md`
**Execution prompt:** the 5-fix execution prompt pasted into Claude Code

---

## Background — why this is v2

The audit was performed at `f70426a`. By the time the v1 fix branch was ready to push, `origin/main` had moved 67 commits ahead via the team's phase-1 through phase-10 reorg + Felicia-cleared improvements. Two of the audit's critical findings were already resolved upstream:

- **Fix #1 (Stripe Longevity Core typo)** — resolved by upstream commit `07636da`, which also upgraded `PROTOCOL_MAP` values from string `'longevity_core'` to `{ name: 'longevity_core', mode: 'subscription' }`. The upstream fix is better than the v1 fix.
- **Fix #3a (Jazz Bird in `index.html`)** — resolved by the phase-4 site-wide find-and-replace cleanup (`e8c96a2`). `grep -c "Jazz Bird" index.html` now returns 0.

The v1 branch was archived locally as `fix/2026-05-21-criticals-v1-stale` (it is preserved for history). This v2 branch was built fresh from current `main` and contains only the still-needed work. The audit deliverables and the back-fill SQL from v1 came along on the audit checkpoint commit.

---

## What was fixed on v2

| Fix | Commit SHA | Status |
|---|---|---|
| #1 — Stripe Longevity Core typo | — | **ALREADY DONE upstream** (`07636da`); v2 branch does not re-fix; back-fill SQL preserved at `_meta/migrations/2026-05-21-longevity-backfill.sql` for the historical-data cleanup |
| #2 — Stripe webhook fail-closed signature verification | `ffcca81` | DEPLOYED ON BRANCH |
| #3a — Jazz Bird publisher in `index.html` | — | **ALREADY DONE upstream** (`e8c96a2`) |
| #3b — Jazz Bird publisher in `dist/anxiety|sleep|gut` schema | `460b068` | DEPLOYED ON BRANCH |
| #4 — Post-response crisis validator | `842045d` | DEPLOYED ON BRANCH, signoff PENDING |
| #5 — Supabase RLS source-of-truth structure in repo | `5035b6a` | SCAFFOLDED, credentialed pull PENDING |

Five commits total on this branch (4 fixes + 1 audit checkpoint at the base), each one referencing the relevant audit deliverable.

## Tests

```
$ node tests/stripe-webhook.test.js
stripe-webhook.test.js — PASS   (33 assertions)

$ node tests/crisis_validator.test.js
crisis_validator.test.js — PASS (35 assertions)

$ node --check server.js
ok
```

Test suites assert:
- **stripe-webhook**: PROTOCOL_MAP integrity (all 5 price IDs, the new `{ name, mode }` shape from `07636da`, format regex, no typo regression); **`supply.html` ↔ PROTOCOL_MAP alignment** (frontend price IDs moved from `index.html` PRICE_* constants to `supply.html` `data-stripe-price` attributes in the phase-9 supply-tab restructure); HMAC signing primitive sanity; fail-closed posture (no historical `&&` guard, missing-secret → 500 + CRITICAL log, missing/malformed signature → 400, constant-time comparison); boot-time CRITICAL warning.
- **crisis_validator**: 12 positive cases that MUST trigger (suicide / self_harm / overdose / violence_to_others including case-insensitive); 8 false-positive guards ("dying to try that restaurant", "killing it at my presentation", "phone is going to die", etc.); 4 input edge cases (null, undefined, empty, non-string); 5 banner-shape assertions (988, 911, SAMHSA, 741741, SAFETY FIRST label present).

## What's still outstanding from the 60-item tech debt register

This session closed (or upstream closed):
- TD-001 (Stripe Longevity typo) — CLOSED **upstream**
- TD-002 (Stripe webhook fail-open) — CLOSED on this branch
- TD-004 (Jazz Bird wall violation — schema layer) — CLOSED (live surface upstream; dist on this branch; body prose logged as follow-up)
- TD-015 (crisis hotline prompt-only) — CLOSED on this branch (signoff pending)
- TD-003 (RLS not in repo) — STRUCTURE CLOSED on this branch, credentialed pull pending (FU-004)

Still outstanding (the audit's other 55 items). Highest-priority remaining items per `11_NEXT_30_DAYS.md`:

| Week | Item | TD | Effort |
|---|---|---|---|
| 1 | Rewrite `.gitignore` (FU-005) | TD-006 | S |
| 1 | Schedule `/api/send-reorder-reminders` | TD-023 | S |
| 1 | Stop logging email plaintext | TD-010 | S |
| 1 | Stripe subscription lifecycle handlers | TD-007, TD-008 | M |
| 2 | Wire `core/*.js` into live `server.js` | TD-005 | M |
| 2 | Extract dimension engine to module + tests | TD-018 (partial) | M |
| 2 | Per-protocol clinical documentation (`docs/protocols/*.md`) | TD-042 | M (Felicia) |
| 2 | Pregnancy / pediatric / geriatric red-flag detection | TD-044 | M |
| 3 | Continue cleanup of DEAD pile (partly done upstream) | TD-026 | S |
| 3 | Resolve `autonomous-engine.js` (wire or delete) | TD-024 | S–L |
| 3 | Resolve the Supabase edge function | TD-019 | S verify |
| 3 | Build `revenue_daily` aggregator | (revenue lens) | M |

## New follow-ups discovered during execution

Logged in full at `_meta/followups/2026-05-21-from-execution.md`:

| ID | Title | Severity | From fix |
|---|---|---|---|
| FU-001 | Jazz Bird prose claims in `dist/anxiety|sleep|gut` (1,810 pages, body prose, needs content regeneration) | MEDIUM (bounded — pages unserved) | Fix #3b |
| FU-002 | Jazz Bird prose claims in `dist/cities` (4,214 pages, same posture) | MEDIUM (same) | Fix #3b |
| FU-003 | Dead-file Jazz Bird mentions (partly cleaned upstream; ~17 one-shot scripts + a few HTML backups remain) | LOW | Fix #3b |
| FU-004 | RLS snapshot credentialed pull (PROCEDURE.md execution) | CRITICAL until executed | Fix #5 |
| FU-005 | Full `.gitignore` rewrite (only `.supabase/` added in this session) | HIGH | Fix #5 |
| FU-006 | v1 branch was rebuilt against current main | INFO | meta |

## Manual follow-up required after merge

Documented for the PR description:

1. **Run the Longevity Core back-fill SQL** at `_meta/migrations/2026-05-21-longevity-backfill.sql` after Felicia review. The script is a two-step audit-then-targeted-UPDATE; do not blanket-update every `active_protocol = 'pro'` row (real PRO subscribers must not be touched). Note: the bug itself was fixed upstream by `07636da`; the back-fill is for any rows that were misclassified between the audit (2026-05-21) and the upstream fix landing.
2. **Have Dr. Stoler review and sign off** on `_meta/clinical/signoffs/crisis_validator-2026-05-21-stoler.md`. The validator is shipping with PENDING status — the alternative (leaving crisis escalation prompt-only) is a greater clinical risk than a code-enforced fallback awaiting review. Same discipline as BHI v1.
3. **Confirm `STRIPE_WEBHOOK_SECRET` is set in production** Render env. ✓ The user has confirmed this is set; after Fix #2, missing env triggers HTTP 500 on every webhook + a CRITICAL log line.
4. **Execute the RLS pull** per `supabase/policies/PROCEDURE.md`. Until done, TD-003 remains CRITICAL.

## Sign-off criteria check

- [x] Critical bugs fixed on branch `fix/2026-05-21-criticals`
- [x] One commit per still-needed fix (4 commits; Fix #1 and Fix #3a already done upstream)
- [x] All new tests pass (`stripe-webhook.test.js` PASS, `crisis_validator.test.js` PASS)
- [x] `_meta/audit/2026-05-21/EXECUTION_REPORT.md` exists (this file)
- [x] Branch pushed to `origin/fix/2026-05-21-criticals`
- [x] PR opened to `main`
- [x] Manual follow-up steps documented above

## Notes on the execution prompt

Adaptations from the prompt as written, made to match the actual codebase:

- **Crisis validator**: prompt sketched ES-modules. Codebase is CommonJS — used `require`/`module.exports`. Prompt's pseudocode was single-shot; actual endpoints stream via SSE — adapted to write the banner as a dedicated SSE chunk before any model output begins, in all three SSE write points (greeting-cache short-circuit, `/api/chat` main stream, `/api/chat/stream`).
- **`crisis_events` table**: not created; validator logs to stdout with `[CRISIS]` prefix and structured JSON. Per scope discipline (no new features, no new schema).
- **Stripe back-fill**: written against `profiles` (real schema), not the prompt's `subscriptions` table.
- **Fix #5 RLS pull**: requires Supabase admin credentials not available in the Claude Code execution environment. Scaffolded structure, README, PROCEDURE, audit template; logged the credentialed pull as FU-004.
- **`dist/cities`**: prompt's sed would have touched all 6,025 pages. The condition pages (1,810) have schema-shaped Jazz Bird claims that fit a clean sed. The city pages (4,214) have prose-shaped claims that need content regeneration. Logged as FU-002.
- **The v2 reconciliation itself**: not in the original prompt. The phase reorg upstream resolved Fix #1 and Fix #3a before the branch was ready to push. The v1 branch was archived; v2 ships only the still-needed work.

## Closing note

The diagnosis was the audit. The treatment is on this branch. The branch is pushed, the PR is open, manual blockers are explicit. Once Felicia signs off the crisis validator, Bleu runs the RLS pull, and the Longevity back-fill SQL is applied, the platform meaningfully closes the deck's "clinically governed digital care delivery" gap.

---

## Afternoon Ship Session (2026-05-21)

After morning execution session and a brief recovery break, Bleu (CTO)
ran a follow-up session against `_meta/audit/2026-05-21/SHIP_IT_PROMPT.md`
to close every Week-1 item that did not require Felicia's signoff.

### The unplanned finding

The session opened with TASK 1 — execute the RLS credentialed pull
(BLOCKER 4). Bleu authed (`supabase login`) and the linked project's
`public` schema was dumped via `supabase db dump --linked`. The dump
itself succeeded.

**Then the audit paid for itself.** Cross-referencing the dump against
the README's "user-data tables that MUST have rls_enabled = true" list
surfaced 7 tables with **RLS off AND `GRANT ALL TO anon`**:

`user_coherence` (per-user phone numbers + CI/ISI), `commitments`,
`emotional_signals`, `predictive_signals`, `session_embeddings`,
`user_arcs`, `agent11_syntheses`.

The public anon JWT is embedded in `index.html:795` (correct usage,
anon keys are public by design). With `GRANT ALL TO anon` and no RLS,
anyone with that key — meaning anyone — can SELECT/INSERT/UPDATE/DELETE
every row of these tables via a one-line curl against the Supabase REST
API. Most damaging: `user_coherence.phone`, the SMS-reorder phone
column.

Root cause is one level deeper: `ALTER DEFAULT PRIVILEGES ... GRANT ALL
ON TABLES TO "anon"` is set at the public-schema level, so every new
table created by the postgres role inherits anon-GRANT-ALL by default.
28 of 48 public tables sit in that default-anon-grant posture.

### What shipped

Three commits resolve the finding (without applying the fix to live db),
and four ship the Week-1 S-effort items.

| Commit | Title | Files |
|---|---|---|
| `8fc5149` | chore(governance): RLS pull — P0 EXPOSURE FOUND | schema-snapshot, policies extract, audit text (populated), this prompt |
| `41dc9b9` | fix(rls): TD-003-P0 fix candidate — REVOKE anon on 7 tables | `supabase/migrations/2026-05-21-p0-revoke-anon.sql` |
| `6f1d9ab` | chore: comprehensive .gitignore rewrite | `.gitignore` |
| `7d414be` | fix(privacy): stop logging email plaintext | `server.js` (maskEmail helper) |
| `20cb7e6` | feat(security): OWASP headers + CORS allowlist | `server.js` |
| `e34643d` | feat(ops): SMS reorder cron + endpoint auth | `server.js`, `.github/workflows/sms-reorder-cron.yml` |

(One more commit to add the pre-merge checklist and this execution-report
update lands alongside this commit.)

### Decision audit trail (Bleu's, taken with Claude paused on STOP rule)

1. **Commit posture for the audit artifacts:** option (b) — commit
   with an honest "P0 EXPOSURE FOUND" title. "Don't bury this. The
   audit's value IS the honesty. The artifact is evidence that you
   found the problem yourself."
2. **Fix path for the 7 tables:** option (C) — REVOKE ALL FROM anon,
   authenticated. Justified by the verification grep showing all
   legitimate access goes through server.js's `SUPABASE_SERVICE_KEY`
   or the edge function's `SUPABASE_SERVICE_ROLE_KEY`. No frontend
   anon-key code touches any of the 7 tables.
3. **Defense-in-depth ENABLE RLS:** noted in the migration's comments
   as an optional append, Bleu's call to make before applying.
4. **Continue parallel work:** yes — the 4 Week-1 S-effort items don't
   touch RLS, so they shipped while the P0 finding stays gated on a
   manual SQL-editor step.

### Tests at end of afternoon session

```
$ node tests/stripe-webhook.test.js       → PASS (33 assertions)
$ node tests/crisis_validator.test.js     → PASS (35 assertions)
$ node --check server.js                  → ok
$ PORT=18080 node server.js               → boots clean
$ curl headers smoke test                 → OWASP + CORS verified
$ /api/send-reorder-reminders auth        → fail-closed unset, 401 wrong, pass correct
```

### Status of PR #1 blockers after this session

| Blocker | Morning status | Afternoon status |
|---|---|---|
| 1 — Longevity back-fill | ⬜ PENDING (Felicia) | ⬜ PENDING (no change — Felicia not in this session) |
| 2 — Crisis signoff | ⬜ PENDING (Felicia) | ⬜ PENDING (no change — Felicia not in this session) |
| 3 — Stripe webhook secret | ✅ CONFIRMED | ✅ CONFIRMED (re-verify step queued in checklist) |
| 4 — RLS pull | ⬜ PENDING | 🔴 **PULL DONE, P0 FOUND** — fix candidate written, application manual |

### Adaptations from the afternoon prompt

- **PROCEDURE.md Step 4 (per-table RLS audit query in SQL Editor):**
  derived the same answer directly from the schema dump instead, which
  faithfully captures every `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  and `GRANT/REVOKE`. Saves a dashboard round-trip without losing
  fidelity.
- **CORS narrowing:** the prompt suggested "narrow wildcard where SSE
  doesn't need it." Implementation went further — explicit ALLOWED_ORIGINS
  allowlist (env-overridable) with reflected-Origin behavior, falling
  back to the canonical first entry for disallowed origins. SSE
  endpoints still emit wildcard directly in their writeHead calls (so
  no behavior change there).
- **CSP starter:** shipped as `Content-Security-Policy-Report-Only`
  rather than enforcing immediately, so a missed directive doesn't
  break the live site. After a week of clean violation reports in
  devtools, Bleu drops `-Report-Only` from the header name to enforce.
- **SMS reorder endpoint:** the prompt's W1.10 said "confirm it has
  auth; add it if it doesn't." It didn't. Auth added via
  `REORDER_CRON_SECRET` with `crypto.timingSafeEqual` comparison.
- **Defense-in-depth on the RLS fix:** the migration ships REVOKE-only
  per Bleu's Option C, with the `ENABLE ROW LEVEL SECURITY` block as
  commented-out append. Bleu's call before applying.

