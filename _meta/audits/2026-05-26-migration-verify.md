# Migration apply + verify — 2026-05-26 (Day 80, Wave 7.1)

Applied to live Supabase (project `sqyzboesdpdussiwqpzk`) via Management API
`/database/query` (token from `~/.supabase/access-token`, never printed).

## Migrations applied

| File | Pre-check | Apply | Result |
|---|---|---|---|
| `2026-05-26-p7-3a-comms.sql` | `bleu_comms` = null (absent) | HTTP 201 | created |
| `2026-05-26-p7-4a-magic-links.sql` | `magic_links` = null (absent) | HTTP 201 | created |

## Post-apply verification

```
[{"tbl":"bleu_comms","rls_enabled":true,"risky_grants":"NONE"},
 {"tbl":"magic_links","rls_enabled":true,"risky_grants":"NONE"}]
```

- Both tables exist.
- RLS **enabled** on both.
- Zero `anon` / `authenticated` grants on either (server-mediated only, as designed).

## DB-level behavior tests (seeded marked rows, cleaned up after)

- Atomic single-use consume: first consume updates **1** row; replay updates **0** → single-use holds at the DB.
- Expired token: WHERE `expires_at > now()` updates **0** rows.
- `bleu_comms` CHECK constraints: valid `(sms, deferred)` accepted; `comm_type='fax'` rejected (400); `status='exploded'` rejected (400).
- Cleanup verified: 0 `SMOKE_%` leftovers in `magic_links`; 0 in `bleu_comms`.
