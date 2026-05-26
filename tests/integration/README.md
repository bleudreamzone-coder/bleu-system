# Integration smoke harnesses

Promoted from one-shot Day-80 `/tmp` scripts into committed regression tools.
These caught the `querySupabase` PATCH bug that would have 401'd every magic-link
sign-in (see `_meta/audits/2026-05-26-day80-integration-smoke.md`).

| File | Network | Writes to DB | Safe to run anytime? |
|---|---|---|---|
| `server-logic.smoke.js` | none (reads server.js, evals pure fns) | no | ✅ yes — fully offline |
| `stripe-webhook.smoke.js` | boots local server on :8080 | no (no Supabase configured) | ✅ yes — local only |
| `magic-link-integration.smoke.js` | hits Supabase + the prod URL | **YES — writes & deletes rows** | ⚠️ NO — see warning |
| `db-constraints.smoke.js` | hits Supabase Management API | **YES — seeds & deletes rows** | ⚠️ NO — see warning |

## ⚠️ Production hazard
`magic-link-integration.smoke.js` and `db-constraints.smoke.js` currently target
the project referenced by `~/.supabase/access-token` and `.env.smoke` — **which
today is PRODUCTION** (`sqyzboesdpdussiwqpzk`). They create sentinel rows
(`smoke+*@bleu.live`, `SMOKE_*`) and delete them afterward, but **do not run them
against prod casually.** Point `.env.smoke` / the access token at a **staging
Supabase project** before using these as part of CI.

## Known limitations
- Hardcode `/workspaces/bleu-system` paths and the prod project ref / URL — not
  yet parameterized. Fine for this dev container; parameterize before CI.
- Require `.env.smoke` (gitignored) with `SUPABASE_SERVICE_KEY` for the two DB ones.

## Run the safe ones
```
npm run test:logic          # offline pure-logic checks (Trust Packet, session HMAC, Twilio sig, hashPhone)
npm run test:webhook-smoke  # boots local server, signed Stripe event -> sendEmail fires, bad sig -> 400
```

## Day-81 TODO
Parameterize paths/URLs via env, stand up a staging Supabase, wire `test:integration`
into CI so the magic-link atomic-consume regression is guarded automatically.
