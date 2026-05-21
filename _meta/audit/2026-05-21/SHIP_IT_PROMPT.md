# SHIP-IT PROMPT — 2026-05-21 (Afternoon Session)

**Context for the agent:**
PR #1 (`fix/2026-05-21-criticals`) is open with 4 blockers. Felicia (clinical co-founder) is currently unavailable. Bleu (CTO) is back from a nap and ready to ship whatever can be shipped without Felicia in the loop.

**Audit references:**
- `_meta/audit/2026-05-21/00_EXECUTIVE_SUMMARY.md`
- `_meta/audit/2026-05-21/11_NEXT_30_DAYS.md`
- `_meta/audit/2026-05-21/EXECUTION_REPORT.md`
- `_meta/followups/2026-05-21-from-execution.md`

**Your job:** Close every item that does NOT require Felicia's clinical signoff. Maintain the same discipline as the previous execution session — audit references, scope guards, follow-ups logged, tests passing, commit-per-fix.

---

## ROLE

You are the same senior engineer who shipped the 5 critical fixes earlier today. PR #1 is open and gated by 4 blockers. Of those, 2 cannot move without Felicia (BLOCKER 1 back-fill review, BLOCKER 2 crisis signoff). The other 2 (BLOCKER 4 RLS pull, BLOCKER 3 webhook secret verification) can move now.

You ALSO have a Week-1-of-30 punch list from the audit. The S-effort items there are unblocked, valuable, and would strengthen PR #1 (or land as PR #2) without scope creep.

**Your discipline rules (unchanged from previous session):**

1. One fix per commit. Clean messages with audit references.
2. Scope check before every action: "Does this close a blocker or a Week 1 S-effort item from the 30-day plan?" If YES → execute. If NO → log to `_meta/followups/` and skip.
3. Do NOT refactor `index.html`, `server.js`, or anything bigger than surgical.
4. Do NOT add new features, modes, or agents.
5. Do NOT touch the 4-tier architecture migration.
6. Do NOT write doctrine, vision, or architecture proposals.
7. If something needs Felicia's signoff or judgment, log it and skip — don't fake it.

---

## EXECUTION ORDER

Work through these in order. Stop and ask the user (Bleu) at any decision point that isn't clearly resolved by the audit.

---

## TASK 1 — BLOCKER 4 prep (RLS pull setup)

**File reference:** `supabase/policies/PROCEDURE.md`

**What you can do automatically:**

1. Check if Supabase CLI is installed:
   ```bash
   which supabase || npm install -g supabase
   supabase --version
   ```

2. Check if there's an existing `.supabase/` directory (would indicate prior link):
   ```bash
   ls -la .supabase/ 2>/dev/null
   ```

3. Tell Bleu exactly what he needs to do for the manual auth step. Specifically:
   - "Run `supabase login` in your terminal — it will open a browser. Sign in with your Supabase account."
   - "Then come back and tell me when you're authenticated, OR paste me the output of `supabase projects list` so I can verify the link."

4. **STOP and wait for Bleu's confirmation.** Do not attempt to run `supabase link` without his auth.

**Once Bleu confirms he's authenticated:**

5. Run `supabase link --project-ref sqyzboesdpdussiwqpzk`
6. Execute Steps 3-6 of `supabase/policies/PROCEDURE.md`:
   - Step 3: schema dump → `supabase/schema-snapshot-2026-05-21.sql`
   - Step 4: per-table RLS audit query → populate `_meta/rls-audit-2026-05-21.txt`
   - Step 5: extract RLS-only → `supabase/policies/policies-2026-05-21.sql`
   - Step 6: commit

7. **Critical guard at Step 4:** If ANY user-data table (profiles, conversation_history, user_coherence, outcome_events, crisis_events if it exists, subscriptions, BHI tables, passport tables, etc.) shows `rls_enabled = false`, STOP. Report to Bleu. Do not commit. This becomes a separate P0 fix.

8. If all user-data tables have RLS enabled — commit with message:
   ```
   chore(governance): execute RLS credentialed pull, close FU-004

   Per supabase/policies/PROCEDURE.md, pulled current Supabase RLS posture into repo.

   - supabase/schema-snapshot-2026-05-21.sql: full schema dump
   - supabase/policies/policies-2026-05-21.sql: RLS-only extract
   - _meta/rls-audit-2026-05-21.txt: per-table audit, populated

   Result: ALL [N] user-data tables show rls_enabled = true with [M] policies.
   No P0 gaps surfaced. TD-003 status: CLOSED.

   Closes BLOCKER 4 of PR #1. FU-004 → done.

   Audit reference: _meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md
   ```

---

## TASK 2 — BLOCKER 3 verification (STRIPE_WEBHOOK_SECRET in production)

Bleu confirmed earlier today that `STRIPE_WEBHOOK_SECRET` is set in Render production. Re-verify before merge:

1. Check if Render CLI is available, OR
2. Read the `Render dashboard` access via env, OR
3. If neither is possible from this environment, write a verification checklist to `_meta/pre-merge-checklist.md` for Bleu to do manually:
   - Open Render dashboard
   - Navigate to bleu-system service
   - Check Environment tab
   - Confirm `STRIPE_WEBHOOK_SECRET` is set and starts with `whsec_`
   - Take a screenshot or note the truncated value to `_meta/pre-merge-checklist.md`

4. Mark BLOCKER 3 as ✅ CONFIRMED in the checklist once verified.

---

## TASK 3 — Week 1 S-effort items from the 30-day plan

Read `_meta/audit/2026-05-21/11_NEXT_30_DAYS.md` Week 1 section. Identify items with **effort = S** (less than 1 day) and **no dependency on Felicia**. From earlier execution report, these include at least:

### W1.4 — Full `.gitignore` rewrite (FU-005)

The current `.gitignore` is minimal. Risk: anyone running `git add .` next could commit a `.env` file.

**Action:**

1. Read current `.gitignore`
2. Replace with a comprehensive Node + Python `.gitignore`:
   - `.env`, `.env.*` (all variants)
   - `node_modules/`
   - `__pycache__/`, `*.pyc`, `*.pyo`
   - `.DS_Store`, `Thumbs.db`, `*.swp`, `.vscode/`, `.idea/`
   - `npm-debug.log`, `yarn-error.log`, `*.log` (consider scope — may need to keep some)
   - `dist/` (DON'T add this — these files are deployed as static SEO assets)
   - `.next/`, `.cache/`, `.parcel-cache/`
   - `coverage/`, `*.lcov`
   - Preserve existing entries (`.github/workflows/deploy-alvai.yml`, `docs/cleanup-may-2026/`, `.supabase/`)
3. Run `git status` after — confirm no important files now appear ignored
4. Commit:
   ```
   chore: comprehensive .gitignore rewrite (closes FU-005, TD-006)

   Previous .gitignore was 36 bytes (3 entries). Anyone running
   `git add .` could commit a .env file, node_modules, or IDE state.

   This rewrite covers:
   - Environment files (.env, .env.*, secrets)
   - Node ecosystem (node_modules, npm/yarn logs, .next, .cache)
   - Python ecosystem (__pycache__, *.pyc, *.pyo, .pytest_cache)
   - OS junk (.DS_Store, Thumbs.db)
   - Editor state (.vscode, .idea, *.swp)
   - Build artifacts (coverage, *.lcov) — but NOT dist/ which holds
     deployed SEO assets

   Preserves all prior entries.

   Audit reference: _meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md
   ```

### W1.8 — Stop logging email plaintext

Search `server.js` and any related files for `console.log` calls that include email addresses in plaintext. The audit specifically called out the "Payment complete" log line.

**Action:**

1. `grep -n "console.log" server.js | grep -i "email\|payment\|stripe"`
2. For every line that logs raw email: replace with a hashed or masked version:
   ```js
   const maskEmail = (e) => e ? `${e[0]}***@${e.split('@')[1]}` : '(none)';
   ```
3. Or remove the email from the log entirely if not needed for ops.
4. Run the existing test suite to confirm nothing breaks.
5. Commit:
   ```
   fix(privacy): stop logging email plaintext at Payment complete

   Per _meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md,
   the Payment complete log line emitted raw email addresses to
   stdout. This is PII leakage to Render's log retention and any
   log aggregator downstream.

   Replaced raw email with masked form: f***@example.com.

   Audit reference: _meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md
   ```

### W1.9 — OWASP basic headers (HSTS, X-Frame-Options, CSP starter) + tighter CORS

The audit identified missing security headers.

**Action:**

1. In `server.js`, find where responses are written. Add a helper that sets:
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `X-Frame-Options: DENY` (or `SAMEORIGIN` if iframes are needed)
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy: default-src 'self'; ...` (start permissive — log violations before enforcing)
2. Apply to all HTML responses (probably the `res.writeHead` calls that serve `index.html`).
3. Review the current CORS settings. The crisis validator uses `Access-Control-Allow-Origin: *` — that's fine for SSE because it's a streaming endpoint, but the rest of the API may not need that wide-open posture.
4. Test that the site still works (load index.html in a browser if possible, check console for blocked resources).
5. Commit:
   ```
   feat(security): add OWASP basic headers, tighten CORS surface

   Per _meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md.

   Added to all HTML responses:
   - Strict-Transport-Security (HSTS, 1-year)
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy
   - Content-Security-Policy (starter, permissive, log-only first)

   CORS narrowed where wildcard wasn't required by SSE streaming.

   Audit reference: _meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md
   ```

### W1.10 — Schedule the SMS reorder cron

The audit found `/api/send-reorder-reminders` endpoint exists but no scheduler triggers it.

**Action:**

1. Read the existing `.github/workflows/beast.yml` to see how cron is set up for the data engine.
2. Create a new workflow `.github/workflows/sms-reorder-cron.yml`:
   ```yaml
   name: SMS Reorder Reminders
   on:
     schedule:
       - cron: '0 17 * * *'  # 5pm UTC daily — adjust to user's preferred timezone
     workflow_dispatch:
   jobs:
     send-reminders:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger reorder endpoint
           run: |
             curl -X POST \
               -H "Authorization: Bearer ${{ secrets.REORDER_CRON_SECRET }}" \
               https://bleu.live/api/send-reorder-reminders
   ```
3. Check `server.js`'s `/api/send-reorder-reminders` handler — confirm it has auth (it should require the `REORDER_CRON_SECRET` Authorization header). If it doesn't, add it.
4. Document in commit message that Bleu needs to set `REORDER_CRON_SECRET` in both:
   - GitHub Actions Secrets (so the workflow can read it)
   - Render production env vars (so the endpoint validates against it)
5. Commit:
   ```
   feat(ops): schedule SMS reorder reminders via GitHub Actions cron

   Per _meta/audit/2026-05-21/11_NEXT_30_DAYS.md W1.10.

   The /api/send-reorder-reminders endpoint at server.js:[LINE]
   has been fully built since [DATE] but had no scheduler. Adding
   a daily 5pm UTC cron via GitHub Actions.

   POST-MERGE STEPS REQUIRED:
   1. Generate a strong shared secret
   2. Set REORDER_CRON_SECRET in GitHub Actions Secrets
   3. Set REORDER_CRON_SECRET in Render production env
   4. Test with `gh workflow run sms-reorder-cron.yml` after first deploy

   Audit reference: _meta/audit/2026-05-21/11_NEXT_30_DAYS.md (W1.10)
   ```

---

## TASK 4 — Pre-merge checklist for Bleu

Write `_meta/pre-merge-checklist.md`:

```markdown
# PR #1 Pre-Merge Checklist

Generated 2026-05-21 by ship-it execution session.

## BLOCKER status (must all be ✅ before merge)

- [ ] BLOCKER 1 — Longevity Core back-fill SQL reviewed by Felicia + Stripe cross-checked by Bleu
- [ ] BLOCKER 2 — Crisis validator clinical signoff (Felicia signs `_meta/clinical/signoffs/crisis_validator-2026-05-21-stoler.md`)
- [x] BLOCKER 3 — STRIPE_WEBHOOK_SECRET confirmed in Render production env
- [ ] BLOCKER 4 — RLS credentialed pull executed and committed

## Post-merge action items

After merging this PR:
1. Run the Longevity Core back-fill SQL (manual)
2. Verify crisis validator banner appears for test crisis input in production
3. Set REORDER_CRON_SECRET in GitHub Actions Secrets AND Render env
4. Manually trigger `sms-reorder-cron.yml` for first run
5. Schedule the next audit re-run for 2026-08-21 (90 days)

## Confidence check

- All tests pass: ✅ (stripe-webhook 33 + crisis_validator 35)
- No new secrets in repo: ✅ (post-.gitignore rewrite)
- Audit follow-ups logged: ✅ (_meta/followups/)
- Felicia briefed: ⏳ (pending afternoon conversation)
```

---

## TASK 5 — Update execution report

Append a new section to `_meta/audit/2026-05-21/EXECUTION_REPORT.md`:

```markdown
## Afternoon Ship Session (2026-05-21 16:12-XX:XX)

After morning execution session and a brief recovery break, additional unblocked items shipped:

- [ ] RLS credentialed pull (TASK 1) — [LINK to commit]
- [ ] .gitignore comprehensive rewrite (TASK 3.1) — [LINK to commit]
- [ ] Email plaintext logging fix (TASK 3.2) — [LINK to commit]
- [ ] OWASP headers + CORS tightening (TASK 3.3) — [LINK to commit]
- [ ] SMS reorder cron schedule (TASK 3.4) — [LINK to commit]
- [ ] Pre-merge checklist created (TASK 4) — _meta/pre-merge-checklist.md

PR #1 status: 3 of 4 blockers green. Awaiting Felicia for BLOCKERS 1 and 2.

Adaptations from this prompt to actual codebase: [list any]
```

---

## STOP RULES

Stop and ask Bleu if you encounter:

- Any user-data table with `rls_enabled = false` (Task 1)
- An unfamiliar Stripe env var or secret name (Task 2)
- Any test failure on existing test suites after a change
- A change that would touch more than 5 unrelated files
- Any clinical or safety logic — those need Felicia, not you

**You are NOT making the merge call.** That's Bleu's decision once all 4 blockers are green and Felicia has signed off.

---

## SIGN-OFF CRITERIA

This session is complete when:

- [ ] BLOCKER 4 either closed (RLS pull committed) OR Bleu manually unblocks the Supabase auth step
- [ ] At minimum 2 of 4 Week 1 S-effort items shipped on the `fix/2026-05-21-criticals` branch
- [ ] All tests still pass
- [ ] Pre-merge checklist exists at `_meta/pre-merge-checklist.md`
- [ ] Execution report updated with afternoon session
- [ ] Branch pushed to origin
- [ ] PR description updated (or PR comment added) noting what's new

Then hand back to Bleu with a clear summary of:
- What shipped this session
- What's still blocked on Felicia
- What needs manual action from Bleu (passwords, env vars, etc.)

Now ship.
