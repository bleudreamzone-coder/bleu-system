# Test Coverage Gap Audit — 2026-05-26 (read-only)

**Correction to a common assumption: tests DO exist.** Inventory:

| File | Type | Covers |
|---|---|---|
| `tests/stripe-webhook.test.js` | unit/integration | Stripe webhook handler |
| `tests/crisis_validator.test.js` | unit | crisis detection |
| `tests/browser/rail_a_flow.spec.js` | Playwright | Rail A purchase flow |
| `tests/browser/rail_c_flow.spec.js` | Playwright | Rail C flow |
| `tests/browser/crisis_flow.spec.js` | Playwright | crisis UX |
| `bleu-core/test/loop.test.js` | unit | (bleu-core loop) |
| inline in server.js | regression | `BLEU_TEST_CRISIS=1` crisis/commerce parity (11 phrases) |

`package.json` script: `test:browser` → playwright. No `test` script for the unit tests (run manually). 🔍 Last passing run unknown.

## Critical paths with ZERO automated test
- **Magic-link sign-in end-to-end** (request→verify→cookie→citizen). Covered only by the Day-80 ad-hoc smoke harness (`/tmp`, not committed).
- **Stripe webhook → sendEmail → bleu_comms** (the Wave-9 wire-up). `stripe-webhook.test.js` predates it.
- **Day-7 outcome cron resolver** (cohort/dedupe/opt-out/phone-resolve).
- **`/api/sms/inbound`** signature validation + classify.
- **`querySupabase` PATCH/representation behavior** — the exact gap that caused the Day-80 sign-in bug.
- **CYP450 safety check** end-to-end.

## What would have caught the Day-80 querySupabase bug
A test asserting that `querySupabase('t', '?filter', 0, 'PATCH', {...})` returns the **affected-rows array** (not `true`) — i.e., an integration test of the verify atomic-consume against a real/seeded row. `node --check` (syntax only) could never catch it; only an endpoint/DB integration test does.

## Ratio
Heavy on browser (Playwright) + a little unit; **no committed integration tests for the new server-side auth/comms/cron paths**. The valuable Day-80 smoke harnesses were one-shot (`/tmp`, discarded).

## Top 10 tests to write (Day 81–83, by impact)
1. Magic-link verify atomic single-use (the regression guard for the fixed bug).
2. magic-link request → deferred/sent comms row.
3. Stripe webhook → order_confirmation comms row + citizen find-or-create (no dup).
4. `/api/sms/inbound` signed→200/classify, unsigned→403.
5. Day-7 resolver dedupe + opt-out skip.
6. `buildTrustPacket` enum/throw matrix (port the Day-80 checks into a committed test).
7. Session HMAC sign/verify/tamper/expiry.
8. `hashEmail`/`hashPhone` normalization + TD-010 (no plaintext).
9. Commerce gate suppressed during crisis (commit the inline harness as a real test).
10. CYP450 interaction check happy-path + contraindication.

**Meta-recommendation:** commit the Day-80 smoke harnesses (they already work) as `tests/integration/` instead of throwing them away in `/tmp`.
