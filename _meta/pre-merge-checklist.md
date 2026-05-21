# PR #1 — Pre-Merge Checklist

Generated 2026-05-21 by the afternoon ship-it execution session.
Updates: replace this file (or check it off as items resolve), then re-push.

> **TOP-LINE:** Of the 4 blockers, 1 is green, 1 is verification-pending,
> 2 require Felicia. **Plus a P0 RLS exposure was discovered during the
> BLOCKER 4 pull** — it must be remediated before merge regardless of
> the other blockers. See banner at the top of the PR description.

---

## BLOCKER status

### 🔴 BLOCKER 1 — Longevity Core back-fill SQL

- [ ] Felicia reviews [`_meta/migrations/2026-05-21-longevity-backfill.sql`](_meta/migrations/2026-05-21-longevity-backfill.sql)
- [ ] Bleu cross-checks the candidate user list against Stripe customers
- [ ] Step 1 (SELECT candidates) run, output preserved
- [ ] Step 2 (targeted UPDATE) run on only the cross-checked rows
- [ ] No blanket-update of `active_protocol = 'pro'` rows (PRO subscribers protected)

**Owner:** Bleu + Felicia. **Status:** ⬜ PENDING

---

### 🔴 BLOCKER 2 — Crisis validator clinical signoff

- [ ] Felicia reads [`_meta/clinical/signoffs/crisis_validator-2026-05-21-stoler.md`](_meta/clinical/signoffs/crisis_validator-2026-05-21-stoler.md)
- [ ] Felicia reviews keyword coverage in `core/safety/crisis_keywords.js`
- [ ] Felicia reviews 8 false-positive guards in `tests/crisis_validator.test.js`
- [ ] Felicia confirms banner copy (988, 911, SAMHSA, 741741)
- [ ] Signoff status flips from PENDING to APPROVED

**Owner:** Dr. Felicia Stoler. **Status:** ⬜ PENDING

---

### 🟢 BLOCKER 3 — STRIPE_WEBHOOK_SECRET set in Render production

Earlier confirmed by Bleu. Re-verify before merge — fail-closed posture
from commit `ffcca81` means a missing env triggers HTTP 500 on every
webhook + a CRITICAL log line on every request.

Manual verification path (Render CLI not available from this Codespace):

- [ ] Open https://dashboard.render.com → bleu-system service
- [ ] Environment tab
- [ ] Confirm `STRIPE_WEBHOOK_SECRET` is present
- [ ] Confirm the value starts with `whsec_`
- [ ] Note the last 4 chars (for cross-reference against Stripe dashboard
      → Developers → Webhooks → endpoint signing secret)

After verification, mark the box below and update the PR description:

- [ ] ✅ CONFIRMED 2026-05-21 by Bleu — value ends in `_xxxx`

**Owner:** Bleu. **Status:** ✅ CONFIRMED SET per Bleu (re-verify above).

---

### 🔴 BLOCKER 4 — RLS credentialed pull → **P0 EXPOSURE FOUND**

The pull executed (commit `8fc5149`). 7 user-data tables have RLS disabled
AND `GRANT ALL TO anon`. **The pull found a real exposure.** The fix
candidate is at commit `41dc9b9`.

**Pull executed**

- [x] `supabase login` (Bleu, 2026-05-21)
- [x] `supabase link --project-ref sqyzboesdpdussiwqpzk` (pre-linked)
- [x] `supabase db dump --linked --schema public` → `supabase/schema-snapshot-2026-05-21.sql`
- [x] RLS-only extract → `supabase/policies/policies-2026-05-21.sql`
- [x] Per-table RLS audit populated → `_meta/rls-audit-2026-05-21.txt`

**P0 remediation required (the migration is written, NOT applied)**

- [ ] Bleu reads `supabase/migrations/2026-05-21-p0-revoke-anon.sql`
- [ ] Decision: apply REVOKE-only (Option C in audit), or append the
      defense-in-depth `ENABLE RLS` block from the migration's comments
- [ ] Apply via Supabase Dashboard SQL Editor OR `supabase db push`
- [ ] Re-run `supabase/policies/PROCEDURE.md` to confirm post-application state
- [ ] All 7 P0 tables show only `service_role` in `information_schema.role_table_grants`
- [ ] Updated `_meta/rls-audit-2026-05-21.txt` committed (post-fix snapshot)
- [ ] FU-004 status flips to RESOLVED

**Owner:** Bleu. **Status:** ⬜ PENDING — pull done, P0 surfaced, fix written, application manual.

---

## Tests still pass

All four Week-1 commits on this afternoon session keep the existing test
suites green:

- [x] `node tests/stripe-webhook.test.js` → PASS (33 assertions)
- [x] `node tests/crisis_validator.test.js` → PASS (35 assertions)
- [x] `node --check server.js` → ok
- [x] `PORT=18080 node server.js` → boots clean
- [x] OWASP headers verified via curl in all paths
- [x] CORS allowlist verified to echo allowed + fall back on disallowed
- [x] `/api/send-reorder-reminders` auth verified in unset/wrong/correct states

---

## Post-merge action items (after all 4 blockers clear and PR merges)

1. **Run the Longevity Core back-fill SQL** (manual) per BLOCKER 1 procedure.
2. **Verify the crisis validator** banner appears for a test crisis input in production.
3. **Configure REORDER_CRON_SECRET** in both:
   - GitHub Actions Secrets (Repo Settings → Secrets → Actions)
   - Render production env vars (Render Dashboard → Environment)
   - Same value in both. Generate with `openssl rand -hex 32`.
4. **Smoke-test the SMS cron** with `gh workflow run sms-reorder-cron.yml`. Check Twilio's outbound report.
5. **Monitor CSP-Report-Only** for a week in browser devtools. If clean, drop `-Report-Only` from the header name in `securityHeaders()` to enforce. If anything legitimate is being blocked, add the source to the appropriate CSP directive.
6. **Schedule the next audit re-run** for **2026-08-21** (90 days from this audit).
7. **Untrack legacy `supabase/.temp/*` files** with `git rm --cached` in a separate cleanup commit (noted in `.gitignore` from commit `6f1d9ab`).

---

## Confidence check

- All tests pass: ✅
- No new secrets in repo: ✅ (post-`.gitignore` rewrite at `6f1d9ab`)
- PII in logs: ✅ closed (`7d414be` — email masked at Payment complete)
- Audit follow-ups logged: ✅ (`_meta/followups/`)
- Felicia briefed: ⏳ pending (BLOCKER 1 and 2)
- P0 RLS exposure: ⏳ documented + fix candidate written, application pending Bleu
