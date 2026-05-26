# Day 80 activation (Path A, Waves 9–11) — 2026-05-26

## Shipped to main + deployed
- **Wave 9** (`45c9899` lineage): `checkout.session.completed` resolves/creates
  `bleu_citizens` (by `email_hash`) and fires `order_confirmation_v1` via `sendEmail`,
  fire-and-forget. With `RESEND_API_KEY` set in Render, real purchases now send a real
  order email. Smoke: signed webhook 200, bad sig 400, sendEmail fires, no throw.
- **Wave 10**: `bleu-day7-outcomes` cron in `render.yaml` (`0 15 * * *` UTC ≈ 10:00 CDT),
  Bearer `REORDER_CRON_SECRET`; `cron_schedule_v1.md` doc.
- **Wave 11**: magic-link wired into `js/bleu-prod-hooks.js` (canonical) — sign-in modal
  + `?verify` on-load handler — **guarded `AUTH_LIVE=false` (inert)**. Removed the
  duplicate Wave-5 inline block from `index.html` (only one verify-on-load may run).

## Post-deploy prod health
ping 200 · stripe-webhook bad-sig 400 · auth verify(bad) 401.

## NOT yet live (by design)
- `AUTH_LIVE=false` — the front-end magic-link UI is present but does nothing until flipped.
- Day-7 SMS send still needs Twilio creds (`TWILIO_*`) in Render; handler returns
  `{error:'Twilio not configured'}` otherwise.

## Wave 12 ordering note
Testing the magic-link UI click-through REQUIRES `AUTH_LIVE=true` (the modal +
verify handler are gated). Backend is already proven (Day-80 endpoint smoke 25/25 +
prod checks). Options: (a) validate email delivery via a direct `/api/auth/magic-link`
call first, then flip; or (b) flip now (low risk, reversible) and click-through live.

## Outstanding
- **Rotate the exposed Supabase service_role key** (still pending).
- Twilio creds for day-7 sends. Stripe webhook live-send observed only via test event so far.
