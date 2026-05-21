# 09 — Security and Privacy Audit

**Audit date:** 2026-05-21
**Scope:** the production code path of bleu.live (Render-hosted `server.js` + shipped `index.html` + Supabase + BEAST pipeline). Out of scope: third-party SOC 2 (Render, Supabase, Stripe, Twilio, OpenAI), pen-test, OS hardening on Render.

---

## TL;DR

**No high-severity secret leaks found in code.** The Supabase anon key is embedded in `index.html` (correct usage — anon keys are public by design and gated by RLS). No `sk_live_`, `sk_test_`, `whsec_`, `AKIA*` (AWS), or service-role JWT was found in code.

**The biggest privacy/security risk is structural, not key-based:**
1. The **service-role Supabase key is used for every server-side query**, bypassing RLS regardless of policy state.
2. **RLS policies are not in the repo.** No source of truth for who can read/write each table.
3. **Stripe webhook signature verification is conditional** — if env vars are missing, signature check is skipped silently.
4. **Conversation embeddings + raw text** are stored without explicit user consent, no retention TTL, no deletion endpoint.
5. **No `.env.example`**, `.gitignore` is 36 bytes (does not even ignore `.env`).
6. **No CSRF protection, no rate limiting, no HSTS.**

---

## Secret scan — repo

### Search method
- `grep -rIn` across `*.js`, `*.ts`, `*.html`, `*.py`, `*.md` for patterns: `sk_live_`, `sk_test_`, `whsec_`, `eyJhbGc` (JWT prefix), `AKIA*` (AWS), `password\s*=`, `secret\s*=`, `api[_-]?key\s*=`.
- `git log --all -S "<pattern>"` across history.
- `git log --diff-filter=A -- '*.env*'` for ever-committed `.env` files.

### Findings
| Token | Locations | Severity | Notes |
|---|---|---|---|
| Supabase **anon JWT** (`eyJhbGc…role=anon…`) | `index.html:795`, plus copies in DEAD backups (`index (7-13).html`, `index.html.backup*`, `nola-index*.txt`) | **NO LEAK** | Anon keys are public by design. JWT decodes to `role: anon`, `iat: 1770045441 (2026-01-XX)`, `exp: 2085621441 (2036-01-XX)`. Embedded correctly. |
| Supabase **service-role JWT** | NOT FOUND in any committed file | OK | Service-role key remains in Render env only (assumed). |
| Stripe live/test keys (`sk_live_*`, `sk_test_*`) | NOT FOUND | OK | Loaded from `STRIPE_SECRET_KEY` env. |
| Stripe webhook secrets (`whsec_*`) | NOT FOUND | OK | Loaded from `STRIPE_WEBHOOK_SECRET` env. |
| Twilio auth token | NOT FOUND | OK | Loaded from env. |
| AWS keys (`AKIA*`) | NOT FOUND | OK | No AWS usage. |
| OpenAI / Anthropic keys | NOT FOUND | OK | Loaded from env. |
| Database passwords | NOT FOUND | OK | Supabase auth via service-role JWT only. |

### Ever-committed `.env`
`git log --all --full-history --diff-filter=A -- '*.env*'` returns empty. **No `.env` file has ever been committed.** This is the right outcome — but **luck, not policy.** The `.gitignore` does not list `.env`, so any future developer creating one would commit it on the next `git add .`

---

## `.gitignore`

```
$
.github/workflows/deploy-alvai.yml$
```

Total 36 bytes. Ignores one workflow file that does not exist in the repo.

**Does NOT ignore:**
- `.env`, `.env.local`, `.env.production`, `.env.*`
- `node_modules/`
- `*.swp`, `.DS_Store`, `Thumbs.db`
- IDE files (`.idea/`, `.vscode/`)
- Build outputs (`dist/` is checked in — that may be intentional)
- Lock files (no lockfile exists)

**Recommendation (P0):** replace `.gitignore` with a comprehensive Node + Python ignore list now, before anyone creates a `.env`.

---

## RLS (Row Level Security) — the largest single risk

### Current state
- The Node server reads/writes Supabase using `SUPABASE_SERVICE_KEY` (the service-role JWT) — `server.js:14`. **The service role bypasses RLS by design.** Every read and write from `server.js` ignores whatever policies exist.
- The frontend (`index.html`) writes to `profiles`, `conversations`, `product_feedback`, `session_feedback`, `user_signals` via the **anon key**. **RLS policies MUST exist on these tables for the writes to be safe.** The policies are not committed to this repo.
- The only access-control SQL committed to the repo is in the comment header of `docs/bleu-system-state.md`: `match_conversation_history` RPC is `REVOKE`d from `public/anon/authenticated` and `GRANT`ed to `service_role` only. **That's the only documented access-control rule.**
- No policy migration file. No `supabase/migrations/*_rls.sql`.

### Consequence
The auditor cannot answer **"can user A read user B's `profiles` row?"** from this repo alone. The answer lives in the Supabase dashboard's RLS Policies panel, which is not in version control. If a policy is dropped (intentionally or by accident), nothing in CI catches it. If a policy never existed for a sensitive table, the audit cannot prove it never existed.

### Tables that demand RLS verification (health data + auth identity)
- `profiles` — contains email, weight, HR, HRV, sleep, mood, anxiety, conditions, medications, primary_goal, BHI score, citizenship status, Stripe customer ID
- `conversation_history` — every chat message + 1536-dim embedding tied to user_id
- `conversation_memory` — legacy duplicate; same data
- `user_coherence` — per-user CI / ISI / phone (for SMS reorder)
- `conversations` — session metadata
- `product_feedback`, `session_feedback`, `user_signals` — user feedback
- `marketplace_practitioners` — has `dr_felicia_reviewed` flag; admin-curated; should be read-only for non-service-role

### Recommendation
1. `supabase db dump --schema-only` or pull policies from dashboard, commit to `supabase/migrations/0000_rls_policies.sql`.
2. Add a CI step that pulls live policies daily and diffs against the committed file.
3. Document the RLS posture per table in `docs/security/rls-matrix.md`.

---

## Stripe webhook security

| Issue | Severity | Location |
|---|---|---|
| Signature verification skipped if env vars missing | **HIGH** | `server.js:1716` — only runs if `STRIPE_WEBHOOK_SECRET && STRIPE_SECRET`. If either is unset, every POST is accepted as valid. |
| No idempotency check | MEDIUM | No `event.id` dedupe table. Stripe retries on 5xx will re-process. |
| No replay-attack window check | MEDIUM | The `timestamp` extracted from the `Stripe-Signature` header is not validated against current time. An old captured event payload could be replayed. |
| No `checkout.session.completed` event-type allow-list before processing | LOW | Currently checks `event.type === 'checkout.session.completed'` — good. But other event types are silently ignored, including ones that would be useful (subscription.deleted, invoice.payment_failed). |
| Email-fallback lookup uses unsanitized email | LOW | `server.js:1864` — encodeURIComponent applied; not SQL-injectable through PostgREST. Safe but worth noting. |

### Fix
```js
// Fail closed
if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET) {
  return json(res, 500, { error: 'Webhook configuration missing' });
}
// Verify signature unconditionally
```

---

## Authentication and session management

| Item | Status |
|---|---|
| Auth provider | Supabase Auth (email + password) |
| MFA | Not enabled per repo (Supabase dashboard would confirm) |
| Magic-link | Not used |
| OAuth (Google, Apple) | Not used |
| Session expiration | Supabase default (1 hour access token, 7 day refresh) |
| CSRF protection | **NONE** — no CSRF token, no SameSite cookie configuration, no Origin header check. The `/api/*` endpoints accept JSON POST from any origin per CORS `*`. The Care Twin / health data writes happen from the frontend with the user's own JWT, so CSRF risk is moderated — but state-mutating endpoints like `/api/memory/merge-anon` accept POST without origin verification. |
| CORS | `Access-Control-Allow-Origin: *` (`server.js:1074`) | **OPEN** — any origin can call any endpoint. Combined with no CSRF, an attacker site can submit chat messages on behalf of an authenticated user's browser if they discover the structure. Mitigated only by Supabase JWT being required for `/api/memory/merge-anon` and similar — but `/api/chat` accepts unauthenticated requests. |
| Secure cookies | Not set by server (Supabase auth uses localStorage + httpOnly cookies in browser; review Supabase Auth settings) |
| Password complexity | Supabase Auth default |
| Account lockout | Supabase default |
| Email verification before sign-in | UNKNOWN — handled in `doSignUp` returning a confirm-email branch but the verification policy is set in Supabase dashboard |

### Recommendation
1. Tighten CORS for state-mutating endpoints to `https://bleu.live` only.
2. Add an Origin check on `/api/memory/merge-anon`, `/api/reorder-reminder`, `/api/personalize`, `/stripe-webhook`, `/api/send-reorder-reminders`.
3. Document the chosen CSRF posture in `docs/security/auth.md`.

---

## Conversation memory privacy

### What gets stored
- `conversation_history.content` — **the raw text of every chat turn**, both user and assistant
- `conversation_history.embedding` — 1536-dim OpenAI vector of every authenticated user turn + assistant turn
- `conversation_memory` — legacy duplicate, dual-write per `server.js:1259` (scheduled for removal)
- `user_coherence` — CI / ISI scores per turn, including `phone` if user opted into reorder SMS
- `session_embeddings`, `commitments`, `emotional_signals` — written by the edge function (status ambiguous; if it's running, these write happen)

### Consent posture
- No consent dialog at signup or at first chat.
- The Care Twin memory shipped on `999330f` without a corresponding privacy update (per audit cross-check).
- Anonymous users → no embeddings stored (`server.js:582 resolveIdentity` short-circuits).
- Authenticated users → all messages stored with embeddings indefinitely.

### Retention
- **No TTL.** Embeddings persist forever.
- No deletion endpoint on the chat history (`exportFullPassport` and `Clear all` exist but the audit did not verify they purge `conversation_history`).

### PII / PHI in logs
- `server.js:1849` logs `"Payment complete: ${protocol} | user: ${userId} | email: ${email}"` to stdout — **email appears in production logs.** Render's default log retention is 14 days; depending on the plan, longer.
- `server.js:945` logs `"Clinical threshold: routing to verified practitioners"` — no PII.
- Several `console.log` statements throughout — none observed logging the raw chat message content.

### Recommendations
1. **Consent at signup.** A clear "Alvai remembers your conversations to help you, with one-tap deletion" toggle, with the default explicit.
2. **Retention TTL.** Define one (e.g., 24 months for embeddings, lifetime for explicit `profiles` data).
3. **Conversation deletion endpoint.** `DELETE /api/conversations/<id>` that purges `conversation_history` + `conversation_memory`.
4. **PHI-aware logging policy.** Stop logging email in plaintext. Log a hashed user identifier instead.
5. **Privacy page update.** Reflect Care Twin storage explicitly.

---

## HTTPS, headers, and transport

| Header | Set by `server.js`? | Recommended |
|---|---|---|
| `Strict-Transport-Security` | **NO** | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | **NO** | `nosniff` |
| `Referrer-Policy` | **NO** | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | **NO** | `DENY` (or use CSP `frame-ancestors`) |
| `Content-Security-Policy` | **NO** | A starter policy: `default-src 'self'; script-src 'self' https://*.supabase.co https://js.stripe.com https://plausible.io 'unsafe-inline'; …` |
| `Permissions-Policy` | **NO** | `geolocation=(self), microphone=(), camera=()` |
| `Cache-Control` on `/api/*` | **NO** | `no-store, no-cache` to prevent caching of user-specific responses |
| CORS | `*` | tighten — see Auth section |

The only headers `server.js` sets are:
- `Content-Type` (per response)
- `Cache-Control: public, max-age=3600` on SEO routes
- `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` on `/` (index.html)
- CORS `*`

**Render terminates TLS by default**, so HTTPS itself is fine. The missing headers are an OWASP basic-hardening checklist that takes ~30 minutes to add.

---

## Rate limiting

**NONE in code.** No rate-limit middleware, no token bucket, no IP throttle. Render's free/starter tier has no built-in rate limit either.

This means:
- `/api/chat` can be hit at any rate — direct OpenAI bill exposure.
- `/api/safety-check` can be hit at any rate — same.
- `/stripe-webhook` accepts unlimited POSTs (though Stripe itself rate-limits outbound).
- `/twilio-reply` accepts unlimited POSTs.

**Recommendation:** add a simple in-process rate limiter (e.g., 30 req/min per IP for `/api/chat`, 10/min for `/api/safety-check`) before exposing the platform to ad spend / SEO traffic.

---

## Input validation

| Endpoint | Validation |
|---|---|
| `/api/chat` body | Parses JSON, reads `message` etc. No length cap on `message` — a 10 MB message would consume tokens and may exceed OpenAI request limits, returning an error after burning compute. |
| `/api/personalize` | Validates `user_id` present? UNKNOWN — relies on Supabase to 400 a query for non-existent UUID. |
| `/api/track` | Reads `partner`, `url`, redirects 302. **Open redirect risk** if `url` is attacker-controlled — the auditor did not fully verify whether the URL is validated against an allowlist. Verify. |
| `/api/reorder-reminder` | Requires 3 fields; otherwise 400. Phone field stored as-is. |
| `/stripe-webhook` | Validates signature (conditionally) and event type. |
| `/twilio-reply` | Reads `Body` from form. Responds with TwiML. No origin check. |

### Recommendations
1. Cap message length at 4,000 characters before calling OpenAI.
2. Allowlist redirect targets in `/api/track`.
3. Validate Twilio signature (Twilio sends `X-Twilio-Signature`; current handler does not check it).

---

## Dependency vulnerability audit

`npm audit` cannot run — **no `package-lock.json` or `yarn.lock`**. `package.json` declares zero dependencies (the server uses Node built-ins + global `fetch` only).

`engine.py` requirements (`requirements.txt`):
- `requests>=2.31.0`
- `python-dotenv>=1.0.0`
- `youtube-transcript-api>=0.6.0`

None pinned. None scanned by CI. Three packages is small enough that hand-review is feasible.

### Recommendation
- `npm i --package-lock-only` to generate a lockfile (even though there are no deps), then add `npm audit` to CI.
- Pin Python deps with hashes or pip-tools.

---

## Twilio inbound webhook

`server.js:1637 /twilio-reply` does **not validate the Twilio signature** (`X-Twilio-Signature` header). Any actor who knows the URL can POST a forged inbound SMS and trigger TwiML responses (which go nowhere meaningful — no SMS is sent back to a forged user). Low impact, easy fix.

---

## Privacy policy and terms

- `/privacy.html` (2,453 bytes) and `/terms.html` (2,919 bytes) — present.
- **Probably predate the Care Twin shipping (2026-04-22).** Need legal review for:
  - Conversation embedding storage
  - 1536-dim vector representation of health-related conversations
  - Affiliate commission disclosure (Amazon Associates ToS requires this)
  - HIPAA: do not claim it
  - GDPR/CCPA: data subject rights, retention, deletion
  - Stripe billing disclosure (per Stripe's merchant policies)

---

## Backups and disaster recovery

| Item | Status |
|---|---|
| Supabase backups | UNKNOWN — dashboard plan-dependent |
| Render deployment rollback | Render UI provides one-click rollback |
| Code backup | `main` branch on GitHub (single-point-of-failure if account compromised) |
| Secrets backup | UNKNOWN — Render env vars are not in repo (correctly); no documented secrets-manager backup |
| RTO / RPO targets | Not defined |
| Tested restore | Not in evidence |

---

## Security priority list

1. **P0 — Rewrite `.gitignore`.** Before a developer commits `.env`.
2. **P0 — Stripe webhook fail-closed signature verification.** One env-var check change.
3. **P0 — Dump and commit RLS policies to repo.** The single largest unknown.
4. **P1 — Add OWASP basic headers** (HSTS, X-Content-Type-Options, X-Frame-Options, CSP starter, Referrer-Policy).
5. **P1 — Tighten CORS** to `https://bleu.live` for state-mutating endpoints.
6. **P1 — Add rate limiting** on `/api/chat`, `/api/safety-check`, `/twilio-reply`.
7. **P1 — Twilio inbound signature verification.**
8. **P1 — Stop logging email in plaintext** at `server.js:1849`.
9. **P2 — Privacy + Terms refresh** to reflect Care Twin + Amazon affiliate disclosure.
10. **P2 — Conversation deletion endpoint** + retention TTL.
11. **P2 — Open-redirect verification** on `/api/track`.
12. **P2 — Generate lockfile + add `npm audit` to CI.**
