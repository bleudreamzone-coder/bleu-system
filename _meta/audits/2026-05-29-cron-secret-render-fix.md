# Render Env Var Paste Checklist — Day 81 (2026-05-29)

**Auditor:** Claude Code (CC) · **Trigger:** Day-81 DNS/SMS verification confirmed `REORDER_CRON_SECRET` is NOT set in Render's production web service. Both daily SMS crons have been silently fail-closing since deploy. Also setting `SESSION_SECRET` for cookie durability across redeploys.

**Captain time required:** ~5–10 minutes in Render dashboard.

---

## Two secrets to paste, three services to paste into

| Secret | Value (copy verbatim) | Goes on |
|---|---|---|
| `REORDER_CRON_SECRET` | `9540b8f827c3aed0647cc8b3d75e19404a54fd6d8fad8894c2bcc60549e27b18` | All **3** services (web + 2 crons) |
| `SESSION_SECRET` | `0fb1dcd9d7ac0c7b33b9f6fea524e8e3a61165558b7be5af259419ebffd0a64d` | **1** service (web only) |

Both values came from `/workspaces/bleu-system/.env.secrets-to-paste` (generated Day 80; gitignored; same source the audits have been citing). Same values both times — do not regenerate; existing sessions and the cron Bearer header logic don't depend on stability across these env writes (no in-flight cookies need preservation), but using the already-generated values keeps the audit trail clean.

---

## The 3 Render services that need `REORDER_CRON_SECRET`

Per `render.yaml`:

| Service name in Render dashboard | Type | Why it needs the secret |
|---|---|---|
| `bleu-system` | web | The handler reads `process.env.REORDER_CRON_SECRET` and rejects requests without a matching Bearer (`server.js:3443`, `:3488`). Without it set: 500 `"REORDER_CRON_SECRET not configured"`. |
| `bleu-reorder-reminders` | cron (daily 14:00 UTC) | The cron's `startCommand` sends `Authorization: Bearer $REORDER_CRON_SECRET`. Without it set: sends `Bearer ` (empty) → 401 even if the web service has the secret. |
| `bleu-day7-outcomes` | cron (daily 15:00 UTC) | Same — sends Bearer with the env value. |

**All 3 must have the same value.** `render.yaml` declares them with `sync: false`, which means Render does NOT auto-propagate from one to the others — each is set per-service in the dashboard.

---

## Step-by-step (Captain phone or laptop)

### Part A — Web service (gets BOTH secrets)

1. Open **https://dashboard.render.com**.
2. Click the **`bleu-system`** service (the web one — the entry whose URL is `bleu-system.onrender.com`).
3. Left sidebar → **Environment**.
4. Click **Add Environment Variable**.
5. Key: `REORDER_CRON_SECRET` · Value: `9540b8f827c3aed0647cc8b3d75e19404a54fd6d8fad8894c2bcc60549e27b18`
6. Click **Add Environment Variable** again.
7. Key: `SESSION_SECRET` · Value: `0fb1dcd9d7ac0c7b33b9f6fea524e8e3a61165558b7be5af259419ebffd0a64d`
8. Click **Save Changes** at the top.
9. Render will trigger a **redeploy automatically** (yellow "Deploying" badge in the top bar). Wait ~60–90 seconds for it to flip back to "Live" / green.

### Part B — `bleu-reorder-reminders` cron service (gets ONLY the cron secret)

1. From the Render dashboard, click the **`bleu-reorder-reminders`** service.
2. Left sidebar → **Environment**.
3. Click **Add Environment Variable**.
4. Key: `REORDER_CRON_SECRET` · Value: `9540b8f827c3aed0647cc8b3d75e19404a54fd6d8fad8894c2bcc60549e27b18`
5. Click **Save Changes**. Cron services don't deploy on env change the same way — Render saves immediately; the next scheduled tick will use the new value. (Optional: click **Trigger Run** to run it now and verify.)

### Part C — `bleu-day7-outcomes` cron service (same — ONLY the cron secret)

1. From the Render dashboard, click the **`bleu-day7-outcomes`** service.
2. Left sidebar → **Environment**.
3. Click **Add Environment Variable**.
4. Key: `REORDER_CRON_SECRET` · Value: `9540b8f827c3aed0647cc8b3d75e19404a54fd6d8fad8894c2bcc60549e27b18`
5. Click **Save Changes**. Same notes as Part B.

**Total clicks: ~12. Total time: 5–10 minutes.**

---

## Verification after the redeploy lands (CC can run; Captain doesn't have to)

### Probe 1 — reorder cron now reaches the Twilio check

```
curl -sS -X POST https://bleu-system.onrender.com/api/send-reorder-reminders \
  -H "Authorization: Bearer 9540b8f827c3aed0647cc8b3d75e19404a54fd6d8fad8894c2bcc60549e27b18" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected outcomes after the fix lands:

| Response | What it means |
|---|---|
| `{"sent":0,"message":"No reminders due today"}` (200) | ✅ Cron secret accepted; query for today's cohort returned zero rows. Auth + DB working. (Most likely today — no real cohort yet.) |
| `{"sent":N,"errors":[...]}` (200) | ✅ Cron secret accepted; tried to send N messages. If `errors` is non-empty, read it — most likely Twilio failures if creds aren't set. |
| `{"error":"Twilio not configured"}` (500) | ⚠️ Cron secret accepted; Twilio creds still missing. **Separate fix:** add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to the web service env (same Part-A flow). |
| `{"error":"Supabase not configured"}` (500) | ❌ Should not happen — Supabase env was confirmed working in the Day-81 audit. If you see this, something else changed. |
| `{"error":"Unauthorized"}` (401) | ❌ Bearer mismatch — re-check Part A. The value pasted into the web service must EXACTLY equal the Bearer in the curl. |
| `{"error":"REORDER_CRON_SECRET not configured"}` (500) | ❌ Save didn't take, or wrong service. Re-do Part A. |

### Probe 2 — day-7 cron also accepts

```
curl -sS -X POST https://bleu-system.onrender.com/api/send-day7-outcomes \
  -H "Authorization: Bearer 9540b8f827c3aed0647cc8b3d75e19404a54fd6d8fad8894c2bcc60549e27b18" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: 200 with a `scheduleDay7OutcomeChecks()` result object. The shape will tell us how many citizens hit the day-7 window today and what happened with each (sent / deferred-no-Twilio / no-phone / opt-out).

### Probe 3 — sessions persist across redeploys (Captain — gentle UX check)

After the web service redeploys (badge flips back to "Live"):

1. Open `https://bleu.live`.
2. Sign in via magic link (requires Resend DNS fix first — see `2026-05-29-resend-dns-diagnostic.md`).
3. Note: signed-in state should now persist across page reloads AND across future Render redeploys (no more random logouts).

Currently — before this fix — the server prints this warning on every restart (per `server.js:1395`):
```
[auth] SESSION_SECRET unset — using ephemeral secret. Sessions will reset on restart (deferred mode).
```

After this fix: that warning goes away; cookies signed with the real secret survive process restarts and (if Render ever runs multiple web instances) cross-instance verification works.

---

## Why these two secrets — not the others?

Day-81 verification probes confirmed several env states. Tonight's checklist only addresses the ones that are **confirmed missing AND blocking active features**:

| Env var | Status | This checklist? | Notes |
|---|---|---|---|
| `REORDER_CRON_SECRET` | ❌ confirmed missing | ✅ yes | Blocks both daily SMS crons (zero sends since deploy) |
| `SESSION_SECRET` | 🔍 unverified, defaults to ephemeral fallback | ✅ yes (cheap to fix) | Risk: random logouts on redeploy; multi-instance failure |
| `STRIPE_WEBHOOK_SECRET` | ✅ verified set (bad-sig → 400) | — | Working |
| `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | ✅ verified set | — | Working — but **`SUPABASE_SERVICE_KEY` rotation is still pending** per memory `day80-close-state` (separate top-priority security item) |
| `RESEND_API_KEY` | ✅ confirmed set (key present; domain not verified is the actual blocker — see DNS diagnostic) | — | DNS fix is separate |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | 🔍 likely missing (per Day-80 audit) | — | Won't matter until `REORDER_CRON_SECRET` lands; add after Probe 1 confirms which 500 message returns |

---

## What to do if Part A fails

- **Render UI doesn't show an "Environment" item in the sidebar:** you're probably on a free Web Service tier or a different account. Verify the URL says `dashboard.render.com/web/srv-...` for the web service (not `srv-cron-...`).
- **Save doesn't trigger a redeploy:** click the "Manual Deploy" → "Deploy latest commit" button at the top. Env-var changes should auto-deploy, but a manual deploy guarantees it.
- **Probe 1 still returns "REORDER_CRON_SECRET not configured" after redeploy completes:** the variable wasn't saved to the web service. Re-check Part A; the variable must show in the Environment list with key=`REORDER_CRON_SECRET` and a redacted value.

---

## Companion work tonight

- `_meta/audits/2026-05-29-resend-dns-diagnostic.md` — fixes the email side (Resend records missing in GoDaddy)
- `_meta/audits/2026-05-29-cannaiq-excision-plan.md` — Bud/CannaIQ excision plan (filed; awaiting Captain Soul-Gate)
- `tests/integration/per-mode-chat.smoke.js` — per-mode chat regression test (PR 0; filed same session)

After all four land + Captain executes the GoDaddy + Render pastes, the Day-81 ops surface is in known-good state, and the path to "Roy as Citizen #1" is open.

---

*Checklist by Claude Code, Day 81. No code changes; this is config-only Captain action.*
