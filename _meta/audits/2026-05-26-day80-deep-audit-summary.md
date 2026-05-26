# Day-80 Deep Audit — Summary — 2026-05-26

Six read-only audits (no code/schema/deploy touched):
1. [server-architecture](2026-05-26-server-architecture-audit.md)
2. [supabase-schema](2026-05-26-supabase-schema-audit.md)
3. [doctrine-consistency](2026-05-26-doctrine-consistency-audit.md)
4. [test-coverage-gap](2026-05-26-test-coverage-gap-audit.md)
5. [frontend-inventory](2026-05-26-frontend-inventory-audit.md)
6. [operational-readiness](2026-05-26-operational-readiness-audit.md)

## Top 10 findings by severity
1. 🔴 **Resend domain `bleu.live` unverified** → all email fails → Citizen #1 blocked. (Captain fixing.)
2. 🟡 **~~`terms.html` + `privacy.html` empty stubs~~ — CORRECTED: both are full minified legal pages, NOT empty.** They need an accuracy review (age "13+ with parental consent" vs 18+, stale dates, refund window) + ideally an attorney pass — but no legal *void*.
3. 🔴 **Exposed `service_role` key not rotated** — bypasses all the RLS work; top security item (carried).
4. 🟠 **No SMS** — Twilio creds missing + two competing inbound webhooks (`/twilio-reply` vs `/api/sms/inbound`).
5. 🟠 **No committed integration tests** for the new auth/comms/cron paths; the Day-80 smoke harnesses were one-shot in `/tmp`. The querySupabase bug had no regression guard.
6. 🟠 **`SESSION_SECRET`/`REORDER_CRON_SECRET` unconfirmed in Render** — sessions reset on redeploy / crons may 401.
7. 🟡 **Doctrine drift** — two refusal docs + two vocabularies ("Layers" vs "five machines/three voices"); `logTrustPacket` built but unwired (gates are doctrine-only, not recorded).
8. 🟡 **Thin mobile responsiveness** (index: 3 media queries) — Card B traffic is phone-first.
9. 🟡 **Tables never ANALYZEd** (`reltuples=-1`) → planner blind; risk as data grows.
10. 🟡 **server.js 4,162 LOC monolith** — refactor helpers→`lib/`, route table; fine for now, debt later.

## Top 10 Day 81–83 work items by impact
1. Verify Resend domain (DNS) → unblock Citizen #1. *(in progress)*
2. Rotate `service_role` key + confirm `SESSION_SECRET`/`REORDER_CRON_SECRET` in Render.
3. Review existing Terms + Privacy for accuracy (age 18+, dates, refund window) + attorney pass — they already exist with real content.
4. Commit the Day-80 smoke harnesses as `tests/integration/` (magic-link, webhook→email, sms/inbound) — regression guard.
5. Wire `getSessionCitizen` into routes + `logTrustPacket` onto guidance routes — *with* the new tests.
6. Twilio: add creds + consolidate to one signed webhook; fix `/twilio-reply` plaintext phone.
7. Mobile pass on the 5 seas before Card B.
8. Phone capture on `bleu_citizens` (Day-7 SMS reach).
9. Doctrine reconciliation (one refusal canon, unified vocabulary, identity + comms-governance pages).
10. `ANALYZE` the DB; verify/drop the 3 custom RPCs; consider RLS-on for service-only tables.

## Shippable today vs needs-work-first
- **Working & verified:** magic-link auth (end-to-end smoked 25/25), Stripe webhook + order-email wire-up, grant lockdown (11 tables), day-7 cron registered, total system audit.
- **Blocked on Captain (dashboards):** email send (Resend domain), key rotation, Render env confirmation, Twilio creds.
- **Needs work before real users:** Terms/Privacy, mobile, integration tests, the two SMS webhooks.

## Before walking into French Quarter visits
- The **magic-link email will not arrive** until Resend's `bleu.live` is verified — do not demo sign-up until that's green (test with `delivered@resend.dev` or your own inbox first).
- **Don't hand out Card B / `/welcome` yet** — that route isn't built and mobile is thin. (Terms/Privacy DO exist — earlier "empty" claim was wrong; they just want an accuracy review.) Partner conversations: fine. Live guest sign-ups at scale: not yet.
- What IS demo-safe today: the seas (Local/Support/Learn/Supply), ALVAI chat, Stripe checkout. The auth + email loop is one DNS verification away from real.
