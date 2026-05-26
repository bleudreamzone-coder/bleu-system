# Total System Audit — bleu.live — 2026-05-26 (Day 80 close-out)

Status legend: ✅ live · ⚠️ partial · ❌ broken · 🔒 deferred (built, intentionally off) · 🔍 uncertain (can't verify from here)

**Verification basis:** routes/helpers/line numbers grepped from `server.js` @ commit `42de24a`; table inventory queried live via Supabase Management API; prod endpoint behavior probed against `https://bleu-system.onrender.com`. Render dashboard, Cloudflare, and the Stripe dashboard are NOT readable from this environment — those are marked 🔍 with the evidence used to infer state.

**Correction to the relayed brief:** the sign-in bug is **already fixed and deployed** (`42de24a`, live ~90s after push). It was also mischaracterized: the magic-link modal always POSTed to the correct `/api/auth/magic-link`. The actual defect was the **"sign in" button** (`index.html:1237`) calling `routeTo('/signin')` → `/auth/signin` (a server route that doesn't exist → `{"error":"Not found"}`). Fixed by intercepting `/signin` in `routeTo` to open the modal. **Pending: Captain Wave-12 re-test.**

---

## SECTION 1 — INFRASTRUCTURE

| Component | Status | Note |
|---|---|---|
| Render web `bleu-system` | ✅ | `https://bleu-system.onrender.com`, Node, `npm start`; prod ping 200 |
| Render cron `bleu-reorder-reminders` | ✅ | `0 14 * * *` UTC → `/api/send-reorder-reminders` |
| Render cron `bleu-day7-outcomes` | ✅ in yaml / 🔍 dashboard | added `render.yaml` this session; confirm it registered in dashboard |
| Supabase `sqyzboesdpdussiwqpzk` | ✅ | 62 public tables; Management API reachable |
| Cloudflare DNS / apex 301 | 🔍 | can't read DNS from here; `bleu.live` vs `.onrender.com` mapping unverified |
| GitHub repo | ✅ | `bleudreamzone-coder/bleu-system`; branches: main, day79-scaffold, day80-activate, + 3 older |
| Domain `bleu.live` | 🔍 | prod verified via `.onrender.com`; custom-domain binding not checked |
| Env — confirmed SET (evidence) | ✅ | `SUPABASE_URL`,`SUPABASE_SERVICE_KEY` (prod reads/writes work); `STRIPE_WEBHOOK_SECRET` (bad-sig→400 not 500); `RESEND_API_KEY` (Captain set Day 80) |
| Env — 🔍 unknown in Render | 🔍 | `SESSION_SECRET` (verify mints cookie via ephemeral if unset), `REORDER_CRON_SECRET`, `OPENAI_API_KEY`, `CLAUDE_API_KEY` |
| Env — likely MISSING | ❌ | `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` (day-7 + reorder SMS return "Twilio not configured") |

---

## SECTION 2 — DATABASE (live, via Management API)

62 public base tables. `approx_rows` = `pg_class.reltuples` (`-1`/unknown = never ANALYZEd, not necessarily empty).

**Day-79/80 + core audit tables — all RLS on, no anon/auth grants ✅**
| Table | rows | RLS | anon/auth grants |
|---|---|---|---|
| bleu_citizens | unknown | ✅ | none |
| bleu_comms | unknown | ✅ | none |
| magic_links | unknown | ✅ | none |
| bleu_events | ~436 | ✅ | none |
| bleu_decisions | ~54 | ✅ | none |
| stripe_processed_events | unknown | ✅ | none |
| bleu_catalog / bleu_plan / bleu_plan_events / bleu_open_windows / bleu_commerce_settings | — | ✅ | none |
| user_coherence | unknown | ⚠️ RLS off | none (revoked; service-mediated) |

**Reference/data tables (anon read likely intended):** practitioners (~434k), locations (~23k), products (~9.5k), clinical_trials (~7.1k), pubmed_studies (~5.4k), youtube_videos, events, conditions, cities, classes, food_sources, protocols, seo_pages — RLS varies, anon/auth grants present.

**🔍 SECURITY REVIEW — RLS OFF *and* anon/authenticated granted (verify intent/contents):**
`dr_felicia_reviews`, `practitioner_bookings`, `care_twin_patterns`, `marketplace_practitioners`, `safety_checks`, `symptom_specialist_map`, `product_practitioner_links`, `workforce_signals`, `validation_log`, `daily_reports`, `reddit_mentions`. If any hold PII or non-public data, anon can read it. (Note: the 7 sensitive tables from the 2026-05-21 p0-revoke — user_coherence, commitments, emotional_signals, predictive_signals, session_embeddings, user_arcs, agent11_syntheses — correctly show **no** anon/auth grants.)

---

## SECTION 3 — SERVER.JS ROUTES (33 found)

| Route | Status | Auth | Notes |
|---|---|---|---|
| `GET /api/ping`, `/health` | ✅ | none | health |
| `POST /api/auth/magic-link` | ✅ | none (no-enum) | writes magic_links, bleu_comms, bleu_events |
| `POST /api/auth/verify` | ✅ | token | atomic consume; mints `bleu_session`; find-or-create bleu_citizens |
| `POST /api/sms/inbound` | ✅ | Twilio sig | day-7 replies + opt-out; unsigned→403 |
| `POST /api/send-day7-outcomes` | ✅ wired / 🔒 sends | Bearer cron | returns "Twilio not configured" until creds set |
| `POST /api/send-reorder-reminders` | ✅ wired / 🔒 sends | Bearer cron | same Twilio dependency |
| `POST /twilio-reply` | ⚠️ legacy | **none + no sig check** | reorder YES/no; overlaps `/api/sms/inbound`; stores plaintext phone in outcome_events |
| `POST /stripe-webhook` | ✅ | Stripe sig + idempotency | activates protocol, audits, **fires order email (Wave 9)** |
| `POST /api/stripe/create-session` | ✅ | none | checkout session; kill-switch aware |
| `POST /api/chat`, `/api/chat/stream` | ✅ | none | ALVAI |
| `/api/plan/*` (add/remove/get/continue) | ✅ | session | cart/plan |
| `/api/practitioners`, `/api/safety-check`, `/api/track`, `/api/session`, `/api/stats`, `/api/personalize`, `/api/memory/*`, `/api/youtube`,`/api/spotify`,`/api/yelp`,`/api/events`,`/api/meetup-events`,`/api/reorder-reminder`,`/api/debug/enrich` | ✅/⚠️ | mixed | not re-verified individually this pass 🔍 |

---

## SECTION 4 — HELPERS (server.js)

| Helper | Line | Tested |
|---|---|---|
| `sendSMS` | 42 | ⚠️ not live-sent (no Twilio) |
| `querySupabase` | 1132 | ✅ + **bugfix this session** (return=representation on PATCH/PUT/DELETE) |
| `hashEmail` | 1182 | ✅ smoke |
| `hashPhone` | 1194 | ✅ smoke (normalization) |
| `logEvent` | 1201 | ✅ (live writes observed) |
| `logDecision` | 1233 | ⚠️ exists, not exercised this pass |
| `buildTrustPacket` | 1263 | ✅ valid + 4 throw cases |
| `logTrustPacket` | 1286 | ✅ writes + never-throws; 🔒 not retrofitted onto routes |
| `sendEmail` | 1318 | ✅ deferred + live-send path (wired into webhook) |
| `signSession`/`verifySession` | 1402/1408 | ✅ round-trip/tamper/expiry |
| `getSessionCitizen` | 1435 | ⚠️ built, not yet called by any route |
| `resolveCitizenPhone` | 1466 | ⚠️ logic only (no Twilio path run) |
| `scheduleDay7OutcomeChecks` | 1482 | ✅ auth + guard; cohort-send not run |
| `twilioSignatureValid` | 1526 | ✅ valid/tampered/deferred |
| `intentBrain` (Five Brains) | 1545 | 🔍 not audited this pass |
| `detectCrisis`/`isCrisisPhrase` | `core/safety/*` (req. 15-16) | ✅ inline regression harness exists (BLEU_TEST_CRISIS) |

---

## SECTION 5 — FRONT-END

| Surface | Status | Note |
|---|---|---|
| `index.html` root | ✅ | 1307 lines; inline IIFE wires nav + auth delegates to `window.*` |
| Sign-in button (`#signin`) | ✅ FIXED | now opens magic-link modal via routeTo('/signin') intercept (`42de24a`) |
| Magic-link modal (`requestMagicLink`) | ✅ live | `prod-hooks.js`; POSTs `/api/auth/magic-link`, no-enum copy |
| Verify-on-load (`?verify=`) | ✅ live | `prod-hooks.js`; POSTs `/api/auth/verify`; `AUTH_LIVE=true` |
| `js/bleu-prod-hooks.js` | ✅ | 785→~840 lines; routeTo/stripe/auth |
| Create-account modal | ⚠️ | submits `authProvider('email',{email,password})`; password ignored (passwordless) + opens modal on top — double-modal wart |
| Seven seas tabs | 🔍 | data-route nav present; per-tab content not audited this pass |
| Stripe checkout | ✅ | `startStripeCheckout` → `/api/stripe/create-session` |
| Crisis panel | 🔍 | crisis logic server-side ✅; front-end panel not audited this pass |

---

## SECTION 6 — CLINICAL & GOVERNANCE (`_meta/`)

- **signoffs/**: `crisis_validator-2026-05-21-stoler.md`, `2026-05-24-canonical-crisis-patterns-stoler.md`, `README.md`. ✅ exist. 🔍 Rail B signoff file NOT present in `signoffs/` (Fullscript Rail B referenced in commits; no dedicated signoff file found).
- **email_templates/**: `order_confirmation_v1.md`, `magic_link_v1.md` ✅
- **sms_templates/**: `day7_outcome_v1.md` ✅
- **doctrine/**: all 7 new (source/refusal/pressure/coca_cola/future_self/lens/_README) + cron_schedule_v1 + pre-existing (crisis_word_list, cyp450_wiring, decision_matrix, finishing_queue, refusal_list, voice_integrity_test, weekly_scorecard) ✅
- **schemas/**: `trust_packet_v1.md` ✅
- **audits/**: 2026-05-21 full set + Day-78 preflight + Day-80 (migration-verify, smoke-report, integration-smoke, activation, deploy) ✅

---

## SECTION 7 — COMMERCE

- Stripe live mode 🔍 (dashboard not readable). Webhook secret IS set in prod (bad-sig→400). 
- Price IDs (from `prod-hooks.js` CONFIG): sleep `price_1TEKQmK4cATmIFbokmkYg47S`, stress `price_1TEKS6...BeCW`, longevity `price_1TEKSW...Jng9`, gut `price_1TEKSs...HtwQ`. 🔍 live-status of each not verified against Stripe.
- `checkout.session.completed` → protocol activation + purchase audit + **order_confirmation_v1 email (Wave 9, smoke-passed)** ✅
- Fullscript (fstoler) — seeded in `bleu_catalog` (Rail B 10 plans, commit `ed23b9a`) ✅
- Amazon Associates (bleulive20-20) 🔍 not verified this pass

---

## SECTION 8 — COMMS

- Resend `RESEND_API_KEY` ✅ set in Render (Captain, Day 80) — order + magic-link emails will send live.
- Twilio ❌ creds missing in Render (SMS paths return "Twilio not configured").
- Templates: order_confirmation_v1 ✅, magic_link_v1 ✅, day7_outcome_v1 ✅ (158-char, STOP language).

---

## SECTION 9 — BROKEN / INCOMPLETE (honest)

1. ✅ ~~Sign-in button → /auth/signin 404~~ **FIXED & deployed `42de24a`** (re-test pending).
2. ⚠️ `citizen_id` resolution in Stripe webhook — Wave 9 now find-or-creates bleu_citizens, BUT magic-link/verify and webhook create citizens independently; no profile↔citizen reconciliation.
3. ⚠️ Phone not on `bleu_citizens` — day-7 resolves phone via `session_id→user_coherence` join; citizens w/o session/phone are skipped (never texted).
4. ⚠️ Two inbound SMS webhooks (`/twilio-reply` unauth + `/api/sms/inbound` signed) — not consolidated; only one can be the Twilio URL.
5. ❌ `TWILIO_*` missing in Render → no SMS sends.
6. 🔒 `logTrustPacket` not retrofitted onto guidance routes (by design).
7. 🔍 `SUPABASE_SERVICE_KEY` **exposed in chat Day 80, NOT confirmed rotated** — highest-priority security item.
8. 🔍 11 tables RLS-off + anon/auth granted (Section 2) — needs a grant review.
9. ⚠️ `/twilio-reply` stores plaintext phone in `outcome_events` (TD-010 inconsistency vs. hashed elsewhere).
10. 🔍 CYP450 — `cyp450_wiring_audit.md` exists; engine wiring referenced in prompt; **not verified end-to-end** this pass.
11. ❌ Mobile audit — not done.
12. ❌ Admin/Captain dashboard — does not exist.
13. ❌ `/welcome`, `/partners` landings + `/m`,`/p` redirects — not built.
14. ⚠️ Create-account modal double-modal + dead password field.
15. ⚠️ `getSessionCitizen` built but no route consumes it (sessions mint but aren't read).

---

## SECTION 10 — NEXT 3 DAYS PUNCH LIST (rank-ordered; Captain Soul-Gates)

**Day 81 — close the loop + secure**
1. 🔁 **Rotate `SUPABASE_SERVICE_KEY`** in Supabase + update Render (security; ~5 min).
2. ✅ Captain re-run Wave-12 sign-in smoke on live site (~15 min) — fix already deployed.
3. Grant review: lock the 11 RLS-off/anon-granted tables, esp. `dr_felicia_reviews`, `practitioner_bookings`, `care_twin_patterns`, `safety_checks` (security).
4. Wire `getSessionCitizen` into the routes that should be citizen-aware (auth actually does something).
5. Reconcile citizen identity across magic-link / verify / Stripe webhook.

**Day 82 — distribution + reach**
6. `/welcome` + `/partners` landing pages; `/m` + `/p` redirects w/ attribution.
7. Phone capture on `bleu_citizens` (unblocks day-7 reliably).
8. Mobile audit + fixes.
9. Twilio creds into Render (if day-7/reorder SMS go live) + consolidate the two SMS webhooks; fix `/twilio-reply` plaintext-phone.

**Day 83 — depth + governance**
10. CYP450 end-to-end verification pass.
11. Retrofit `logTrustPacket` onto ALVAI guidance routes.
12. Admin/Captain dashboard MVP.
13. Rail B Stoler signoff file (governance paper trail).

---
*Audit by Claude Code, Day 80 close-out. Every claim either verified live or marked 🔍. No code modified to produce this document.*
