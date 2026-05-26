# Day 80 smoke report — 2026-05-26 (Wave 7)

## Environment reality (important)

This dev container has **no runtime secrets** — `SUPABASE_SERVICE_KEY`, `SESSION_SECRET`,
`REORDER_CRON_SECRET`, `TWILIO_*`, `RESEND_API_KEY` are all unset (they live only in Render).
The only credential present is the Supabase **Management API** token (`~/.supabase/access-token`),
which talks to the DB control plane, **not** the PostgREST data API that `server.js` uses.

**Consequence:** `server.js` cannot be booted against prod from here, so the full HTTP
endpoint round-trips (POST /api/auth/magic-link → row, POST /api/auth/verify → cookie,
/api/send-day7-outcomes, /api/sms/inbound) were **NOT** exercisable in this session.
They are listed below as **DEFERRED — needs runtime creds or Render**.

## ✅ Verified (real tests run this session)

**Schema / DB (Management API):**
- `bleu_comms`, `magic_links` created; RLS on; anon/authenticated revoked.
- Atomic single-use consume holds (1 then 0 rows); expired token → 0 rows.
- `bleu_comms` CHECK constraints reject bad `comm_type` / `status`.
- Test rows cleaned up (0 leftovers).

**Pure logic (real functions extracted from server.js — 16/16):**
- `buildTrustPacket`: valid → 10-key packet w/ default `safety_flags` + `timestamp`; bad enum, missing field, non-array `safety_flags`, empty `reviewer_version` all throw.
- Session cookie HMAC: sign→verify round-trips; tampered cookie rejected; expired session rejected.
- Twilio signature: valid sig accepted; tampered params rejected; **unset token → deferred** (confirmed in isolated eval).
- Inbound SMS classifier: 9/9 cases (BETTER/SAME/WORSE/STOP family/unparseable, case + prefix).
- `hashPhone`: format variants collide; distinct numbers differ; empty/null → null.
- Day-7 SMS body = 158 chars ≤ 160 (single segment).

**Static:** `node --check server.js` passes (all waves).

## ⏸️ DEFERRED — needs runtime creds or Render deploy

| Flow | Why deferred | How to verify |
|---|---|---|
| magic-link request → `magic_links` + `bleu_comms(deferred)` + `bleu_events` rows | no SERVICE_KEY to boot server | run server with Render env, POST endpoint, inspect rows |
| verify → Set-Cookie + `bleu_citizens` create + atomic 401 replay | needs SERVICE_KEY + SESSION_SECRET | same |
| day-7 cron (auth, cohort select, dedupe, opt-out skip) | needs SERVICE_KEY + REORDER_CRON_SECRET | seed citizen+user_coherence, Bearer POST |
| inbound SMS end-to-end (sig + event writes + TwiML) | needs SERVICE_KEY + TWILIO_AUTH | signed POST to /api/sms/inbound |

## Recommendation

**Do NOT merge to main yet.** Logic + DB + syntax are green, but the endpoint
**integration layer** (route dispatch, body parsing, `Set-Cookie`, `querySupabase` writes)
has not been exercised against a live runtime. Close that gap first by either:
1. providing the Render env values in a shell here for one real round-trip, or
2. merging to a **preview/staging** deploy (not main) and running the endpoint checks there.

Merging auth + SMS handlers straight to production on green-logic-only is the one risk
worth not taking.
