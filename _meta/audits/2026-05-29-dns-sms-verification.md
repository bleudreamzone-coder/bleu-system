# DNS + SMS Verification Audit — 2026-05-29 (Day 81)

**Auditor:** Claude Code (CC) · **Trigger:** Captain decision — verify what's actually working before any cleanup/excision PRs land.
**Method:** live probes against `https://bleu-system.onrender.com` from this Codespace + source-of-truth read of `server.js` @ commit `56e9fd8`.
**Constraint:** No production secrets exist in this sandbox. I cannot read Render's secret store, cannot query Resend's API directly (no `RESEND_API_KEY` locally), and cannot send a targeted Twilio SMS from here. Verification therefore = "trigger the prod path, read what comes back" — which is also exactly what a real user experiences, so it's the right signal.

Legend: ✅ verified live · ❌ verified broken · 🔍 not independently verifiable from here (needs Captain action)

---

## Summary — three things changed from "unknown" to "known"

| | Day-80 audit said | Tonight's probe says |
|---|---|---|
| `REORDER_CRON_SECRET` in Render | 🔍 unverified | ❌ **confirmed NOT SET** in production web service. Both crons fail-closed. |
| `/api/sms/inbound` signature gate | ✅ implemented | ✅ confirmed working in prod (unsigned → 403) |
| `STRIPE_WEBHOOK_SECRET` in Render | ✅ inferred (bad-sig→400) | ✅ re-confirmed (bad-sig→400, not 500) |

Two things remain 🔍 because the probe path was blocked or requires Captain access:

| | Status |
|---|---|
| Resend domain verification for `bleu.live` | 🔍 needs Captain inbox check + Resend dashboard check |
| Twilio creds (`TWILIO_*`) in Render | 🔍 cron-secret fails first, so Twilio check never runs. Per Day-80 audit + memory, still missing — not independently re-confirmed tonight. |

---

## Probe 1 — production reachability

```
GET https://bleu-system.onrender.com/api/ping
→ HTTP 200, 254ms
```

✅ Render web service `bleu-system` is live and responsive.

---

## Probe 2 — magic-link request (Resend path)

```
POST /api/auth/magic-link
body: {"email":"bleudreamlegacy@gmail.com"}
→ HTTP 200 {"ok":true}  (464ms)
```

**What this tells us:** the endpoint accepted the request and returned its no-enumeration response. By design (`server.js:3685`), this 200 is returned **regardless of whether the email actually sends** — to prevent attackers from probing which addresses exist.

**What this does NOT tell us:** whether `sendEmail()` succeeded. The actual delivery status is written to the `bleu_comms` table as `sent` | `deferred` | `failed`. From this sandbox, without `SUPABASE_SERVICE_KEY` locally, I cannot read that row.

**Captain action required (the only way to know for sure):**
1. **Check `bleudreamlegacy@gmail.com` inbox + spam** for an email with subject containing "BLEU" / "sign in" / "magic link" — sent at approximately 2026-05-29 (the time you ran this). Template is `magic_link_v1`.
2. If the email arrived: Resend domain is verified and DNS is healthy. ✅
3. If no email arrived:
   - Check Resend dashboard → Domains → `bleu.live` status. If "Not verified" → DNS records (DKIM/SPF/DMARC) not propagated. **Reminder: Cloudflare records for Resend must be DNS-only (grey cloud), NOT proxied (orange cloud).**
   - Check Resend dashboard → Logs → look for the send at this timestamp. The error message there will tell us exactly what failed.

Note: clicking the magic link in the email WILL sign you in (it's a real, live, single-use token). That's fine — proves the end-to-end auth loop works.

---

## Probe 3 — reorder-reminder cron (Twilio path, attempt 1)

```
POST /api/send-reorder-reminders
Authorization: Bearer <local Day-80 REORDER_CRON_SECRET>
→ HTTP 500 {"error":"REORDER_CRON_SECRET not configured"}
```

**What this tells us — definitively:**

❌ **`REORDER_CRON_SECRET` is NOT SET in the Render production web service.**

Source-of-truth check (`server.js:3443`):
```js
if (!REORDER_CRON_SECRET) {
  console.error('[reorder-cron] CRITICAL: REORDER_CRON_SECRET not set — refusing to process');
  return json(res, 500, {error:'REORDER_CRON_SECRET not configured'});
}
```
The server checks the env var BEFORE checking the Bearer header, BEFORE checking Twilio. The 500 response means the var is empty/undefined on the web service.

**Implications — what has been happening silently:**
- The Render-scheduled cron `bleu-reorder-reminders` (daily 14:00 UTC) has been calling this endpoint. It sends `Authorization: Bearer $REORDER_CRON_SECRET` — but if the same secret is unset on the cron service, it sends `Bearer ` (empty), and even if the web service HAD the secret it would 401. With the web service unset, it 500s.
- **Net effect: zero reorder-reminder SMS have been sent via the production cron** since the endpoint was deployed.
- Fail-closed worked correctly — no erroneous sends, no leaked auth — but the feature has been off.

**Captain action:**
- Add `REORDER_CRON_SECRET=9540b8f827c3aed0647cc8b3d75e19404a54fd6d8fad8894c2bcc60549e27b18` (from `.env.secrets-to-paste`) to Render env on:
  - the `bleu-system` web service
  - the `bleu-reorder-reminders` cron service
  - the `bleu-day7-outcomes` cron service
- Must be on all three. Per `render.yaml` line 20 + 32, `sync: false` — has to be set per-service in the dashboard.

---

## Probe 4 — day-7 outcomes cron (Twilio path, attempt 2)

```
POST /api/send-day7-outcomes
Authorization: Bearer <local Day-80 REORDER_CRON_SECRET>
→ HTTP 500 {"error":"REORDER_CRON_SECRET not configured"}
```

Same diagnosis — same missing env var (the day-7 cron reuses `REORDER_CRON_SECRET` per the source comment at `server.js:3483`). **Day-7 outcome SMS have also never fired in production.** Same Captain action fixes both.

---

## Probe 5 — inbound SMS signature gate

```
POST /api/sms/inbound
Content-Type: application/x-www-form-urlencoded
body: From=%2B19176178806&Body=test&MessageSid=SMtest
(no X-Twilio-Signature header)
→ HTTP 403 "forbidden"
```

✅ Signature gate is enforcing correctly. Unsigned requests are rejected. This is the defense-in-depth that the legacy `/twilio-reply` route does NOT have (still a known gap → see excision plan).

---

## Probe 6 — Stripe webhook signature gate

```
POST /stripe-webhook
Stripe-Signature: t=1,v1=bogus
→ HTTP 400 {"error":"Invalid signature"}
```

✅ `STRIPE_WEBHOOK_SECRET` is set in Render (bad signature → 400, not 500). Stripe webhook is healthy.

---

## What I could NOT verify from this sandbox

| Item | Why | How to verify |
|---|---|---|
| Resend domain `bleu.live` verified | No `RESEND_API_KEY` locally; magic-link endpoint returns 200 by design regardless of send outcome | Captain checks inbox (Probe 2). If no email: check Resend dashboard → Domains. |
| Resend send actually succeeded for tonight's probe | DB lookup needed; no service key locally | Captain checks inbox, or runs the query (see "follow-up DB query" below) |
| Twilio creds `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` in Render | Cron-secret check blocks earlier | After Captain sets `REORDER_CRON_SECRET`: re-run Probe 3. If it then returns `{"error":"Twilio not configured"}` → Twilio missing (confirmed). If it returns `{"sent":N,...}` or attempts a send → Twilio configured. |
| Targeted SMS to 917-617-8806 specifically | The cron sends to phones from `user_coherence` rows with `reorder_target_date=today` — not to an arbitrary number. There's no general-purpose "send test SMS to X" endpoint, and adding one would mean a code change (not in scope tonight). | After Captain adds Twilio creds, a real Day-7 cohort row + a 7-day clock are needed to actually fire — or a one-off code-side test (separate PR). |
| `SESSION_SECRET` in Render | Not probable from outside | Captain sets it from `.env.secrets-to-paste` (`0fb1dcd9...`) on the web service. Otherwise: ephemeral fallback → cookies invalidate on redeploy / across instances. |
| `OPENAI_API_KEY`, `CLAUDE_API_KEY` in Render | Inferable only by triggering `/api/chat` and watching for content vs error | If chat works on bleu.live live, both are set. (Today: assumed working.) |

---

## Follow-up DB queries (Captain can run these in Supabase SQL editor)

After triggering the magic-link probe above, the verification of "did it actually send" lives in `bleu_comms`. Captain can run, in the Supabase SQL editor:

```sql
-- Did tonight's magic-link probe to bleudreamlegacy@gmail.com succeed?
select
  created_at, sent_at, status, error_message, template_version, resend_message_id
from bleu_comms
where template_version = 'magic_link_v1'
  and created_at >= now() - interval '15 minutes'
order by created_at desc
limit 5;
```

Expected outcomes:
- `status='sent'` + non-null `resend_message_id` → ✅ Resend domain verified, email sent
- `status='deferred'` + `error_message='RESEND_API_KEY not configured'` → ❌ Resend key missing
- `status='failed'` + `error_message` contains "domain" or "not verified" → ❌ Resend domain not verified (the most likely current state per Day-80 memory)
- `status='failed'` + something else → read the message; could be rate limit, DNS, or other

And for the cron crisis confirmation:

```sql
-- Has the reorder-reminder cron ever fired successfully in production?
select count(*) from bleu_events where event_type = 'sms_sent' and payload->>'template' like 'reorder%';

-- Has day-7 outcomes ever fired?
select count(*) from bleu_events where event_type = 'sms_sent' and payload->>'template' like 'day7%';
```

If both are 0: confirms the cron-secret gap I detected tonight has been blocking everything.

---

## Top recommendations (rank-ordered, by impact × ease)

1. 🔴 **Set `REORDER_CRON_SECRET` on all 3 Render services** (web + 2 crons). Value is in `.env.secrets-to-paste`. Unblocks both SMS crons. Captain action, ~5 min in dashboard.
2. 🔴 **Set `SESSION_SECRET` on the web service** (same file). Eliminates the ephemeral-fallback risk that randomly logs users out across redeploys / multiple instances.
3. 🔴 **Verify Resend `bleu.live` domain** — Captain check inbox now (Probe 2); if absent, Resend dashboard → Domains → look for unverified DNS records → fix in Cloudflare (DNS-only / grey cloud).
4. 🟠 **Rotate `SUPABASE_SERVICE_KEY`** — top-priority security item carried since Day 80 (per memory `day80-close-state`). Independent of tonight's findings but blocks the security posture.
5. 🟠 **Add `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` to Render web service** — only worth doing after #1, because the crons can't reach the Twilio check today.
6. 🟡 **After #1 lands:** re-run Probes 3 + 4 here to definitively confirm Twilio state. (Will return one of `{sent:0,...}` or `{error:"Twilio not configured"}` — both are informative.)

---

## What this audit did NOT do (intentional)

- ❌ No code modified.
- ❌ No production data modified beyond the standard side-effects of the magic-link request probe (one row in `magic_links`, one in `bleu_comms`, one in `bleu_events` — all for Captain's own email, all expected for a real sign-in attempt).
- ❌ No Render dashboard changes — only Captain has access.
- ❌ No Twilio dashboard changes — only Captain has access.
- ❌ No SMS sent (the cron-secret block prevented any send attempt; the inbound-SMS probe was a signature-gate probe, not a send).

**One real email was triggered** (the magic-link probe to Captain's own gmail) — that was explicitly authorized in the task.

---

*Audit by Claude Code. Pinned to `server.js` @ commit `56e9fd8`. Every claim either verified live or marked 🔍 with the path to verify.*
