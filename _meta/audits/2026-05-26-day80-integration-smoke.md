# Day 80 endpoint integration smoke — 2026-05-26

Booted: yes
Result: **25 passed, 0 failed** of 25 (clean run, after fix below).

## 🐛 Bug caught by this smoke (run 1: 21/25)

Scenario B (verify) failed 4 assertions: returned `401` **even though it consumed
the token** (`consumed_at` was set). Root cause in `querySupabase`: `PATCH` was
sent with **no `Prefer` header**, so PostgREST replied `204 No Content` and the
helper returned `true` (boolean) instead of the affected-rows array. The verify
endpoint detects a successful atomic consume via `Array.isArray(rows) && rows.length`
— which was always `true` → **always 401**. In production this would 401 every
magic-link sign-in on first valid click AND burn the token. Invisible to unit/DB
tests; only an end-to-end boot surfaced it.

**Fix:** `querySupabase` now sends `Prefer: return=representation` for
PATCH/PUT/DELETE so filtered writes return their affected rows. Re-run → 25/25.

Server ran against live Supabase (prod) with service key from .env.smoke; local
throwaway SESSION_SECRET / REORDER_CRON_SECRET / TWILIO_AUTH_TOKEN; RESEND + full
Twilio creds intentionally unset (email defers, no live SMS). All sentinel rows
(smoke+*@bleu.live, +15045550100, SMOKE_SM* message_sids) deleted after.

## Scenarios
- ✅ 200 {ok:true}
- ✅ magic_links row created
- ✅ bleu_comms deferred (no RESEND key)
- ✅ bleu_events magic_link_requested written
- ✅ garbage email → 200 {ok:true}
- ✅ garbage email → no magic_links row
- ✅ valid-form unknown email → identical 200
- ✅ 4 requests → only 3 rows (got 3)
- ✅ magic_link_rate_limited event written
- ✅ 200 {ok:true, citizen.id}
- ✅ Set-Cookie httpOnly+SameSite=Lax
- ✅ bleu_citizens row created
- ✅ magic_links.consumed_at set
- ✅ bleu_events magic_link_verified written
- ✅ replay → 401 (atomic consume holds live)
- ✅ wrong Bearer → 401
- ✅ correct Bearer → 200 (Twilio not configured; live-send path skipped, no Twilio creds)
- ✅ signed BETTER → 200 + recorded TwiML
- ✅ signed STOP → 200 + opt-out TwiML
- ✅ signed asdf → 200 + unparseable TwiML
- ✅ unsigned → 403
- ✅ day7_outcome_response events written: [{"result":"better","n":1},{"result":"opt_out","n":1},{"result":"unparseable","n":1}]
- ✅ sms_opted_out event written
- ✅ logTrustPacket(valid) builds + writes bleu_events
- ✅ logTrustPacket(bad) → null, no write, no throw

## Cleanup leftovers (must be all 0)
```
{"ml":0,"cz":0,"cm":0,"ev":0}
```

## Note
Day-7 cohort SEND path not exercised (would emit live SMS) — only Bearer auth +
the "Twilio not configured" guard. logTrustPacket DB write covered transitively
by A/B bleu_events writes; validator + never-throws unit-checked here.
