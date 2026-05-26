# Operational Readiness Audit — 2026-05-26 (read-only)

## Render services (from render.yaml + deploy history)
| Service | Type | Status |
|---|---|---|
| bleu-system | web | ✅ live (`bleu-system.onrender.com`), auto-deploys on push to main |
| bleu-reorder-reminders | cron `0 14 * * *` UTC | ✅ defined; curls `/api/send-reorder-reminders` w/ Bearer |
| bleu-day7-outcomes | cron `0 15 * * *` UTC | ✅ defined Day-80; 🔍 confirm registered in dashboard |

## Env vars (evidence-based; dashboard not directly readable)
- ✅ confirmed working: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `STRIPE_WEBHOOK_SECRET` (bad-sig→400), `RESEND_API_KEY` (now active — sends fail on domain, not on missing key)
- 🔍 unverified set: `SESSION_SECRET`, `REORDER_CRON_SECRET` (generated Day-80 into `.env.secrets-to-paste`; **Captain has NOT confirmed they're in Render**), `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `CLAUDE_API_KEY`/`ANTHROPIC_API_KEY`
- ❌ missing: `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` (SMS paths return "Twilio not configured")

## Cron auth posture
Both crons send `Authorization: Bearer $REORDER_CRON_SECRET`. The secret must be set on the web service AND each cron (`sync:false`). If `REORDER_CRON_SECRET` isn't set, crons get 401/500 — fail-closed (no erroneous sends). ⚠️ Pending the unconfirmed env above.

## Stripe
- 4 price IDs in prod-hooks CONFIG (sleep/stress/longevity/gut). 🔍 live-status per Stripe dashboard not readable.
- Webhook `/stripe-webhook`: signature + 300s replay window + idempotency (`stripe_processed_events`) + Wave-9 order email. Healthy (bad-sig→400 in prod).
- Recent real webhook activity: `bleu_events` had ~436 rows incl. purchase_completed history. 🔍 not broken down this pass.

## Resend — KNOWN BLOCKER
`bleu.live` domain **not verified** in Resend → all sends fail ("domain is not verified"). This is THE blocker for Citizen #1 (Roy got no email; comms row `failed`). Captain verifying DNS now. Until verified: no magic-link or order emails send.

## Twilio
**Two inbound webhooks exist** — `/twilio-reply` (legacy, unauthenticated, plaintext phone) and `/api/sms/inbound` (signed). Only one can be the Twilio number's webhook. Plus no Twilio creds in Render. Needs consolidation + creds before any SMS goes live.

## Cloudflare
🔍 DNS/proxy config not readable from here. Reminder for Captain: Resend's DKIM/SPF/DMARC records must be **DNS-only (grey cloud)**, not proxied.

## Top 5 ops gaps for Citizens #2–10
1. **Email deliverability** (Resend domain) — blocks everything; verify + warm up.
2. **No SMS** (Twilio creds + webhook consolidation) — day-7 outcome loop can't run.
3. **Legal pages empty** (terms/privacy stubs) — exposure as real users + payments flow in.
4. **Session durability** — confirm `SESSION_SECRET` set, else multi-instance/redeploy logs users out.
5. **No monitoring/alerting** — failures (like the deferred/failed emails) are only visible by querying `bleu_comms`; no alert surface. Consider a daily `bleu_comms status=failed` check.
