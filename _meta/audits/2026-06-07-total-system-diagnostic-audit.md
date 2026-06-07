# Total System Diagnostic Audit — code-source-of-truth

**Date:** 2026-06-07  
**Repo:** `bleudreamzone-coder/bleu-system`  
**Mode:** proof mode / no expansion  
**Scope:** live ALVAI behavior, `server.js`, `/api/chat`, `/api/chat/stream`, Dr. Felicia standards, Trust Packet v0, dormant governance scaffolds, data/memory, commerce, crisis, tests, PR #58, deployment/demo readiness, and Codex handoff.

## PART 1 — Executive System Diagnosis

- **VERIFIED — Actually live:** the production chat spine is `server.js`, especially `POST /api/chat` and `POST /api/chat/stream`; both build prompts, call OpenAI streaming chat completions, stream SSE output, run deterministic crisis detection, run commerce restraint, run Commerce Steward, write chat telemetry, and queue memory writes. Evidence: `server.js:2036-2244`, `server.js:2300-2410`.
- **VERIFIED — Live frontend:** `index.html` is a single-page, no-build frontend with home/local/support/learn/supply routes and the primary ALVAI input, but it is not presently a workforce-wellness/city-employee landing page. Evidence: `index.html:8-15`, `index.html:801-806`, `index.html:838-850`.
- **VERIFIED — Scaffold/dormant:** `core/schemas/*` explicitly says v1.1 schemas are tested-only/dormant and not wired into `server.js`; schema comments repeat that Signal/Decision/Trust Packet v1.1 are validated by tests but not imported by live code. Evidence: `core/schemas/README.md:3-7`, `core/schemas/signal_object_v1.1.schema.json:2-6`, `core/schemas/decision_object_v1.1.schema.json:2-6`, `core/schemas/trust_packet_v1.1.schema.json:2-7`.
- **VERIFIED — Trust Packet reality:** live Trust Packet v0 is built inside `server.js` and only logged when `BLEU_TEST_TRUST_PACKET_V0=1`, `NODE_ENV=development`, or `NODE_ENV=test`; the older `buildTrustPacket/logTrustPacket` helper is marked “NOT retrofitted onto any route yet.” Evidence: `server.js:265-293`, `server.js:340-360`, `server.js:808-813`, `server.js:846-860`.
- **VERIFIED — Broken/contradictory:** Dr. Felicia’s signed standards flag `server.js:68` as a Lock 2 violation, and `server.js` still contains “You carry 127 years of healing lineage” in the live ALVAI prompt. Evidence: `_meta/doctrine/felicia_standards_v1.md:54-57`, `server.js:63-69`.
- **VERIFIED — Current test failure:** `node tests/crisis_validator.test.js` fails on a false positive: “My phone is going to die soon, need to find a charger” trips the canonical crisis detector as `suicide/canonical_pattern`. Evidence: `tests/crisis_validator.test.js:66-75`, `core/safety/canonical_crisis_patterns.js:24-40`.
- **VERIFIED — Additional contradiction:** `core/safety/canonical_crisis_patterns.js` still says STATUS PROPOSED and “NOT wired into production yet,” but `detectCrisis()` imports and delegates to it, and `server.js` imports it for stability/commerce gating. Evidence: `core/safety/canonical_crisis_patterns.js:1-14`, `core/safety/crisis_validator.js:20-37`, `server.js:15-16`, `server.js:1263-1272`.
- **PARTIALLY VERIFIED — Closest to demo-ready:** Trust Packet v0 diagnostic is the closest governed proof because it exercises `/api/chat` and `/api/chat/stream` packet construction with no DB write and no raw message/PII, but it is a diagnostic harness, not an exposed stage route. Evidence: `server.js:3705-3756`.
- **VERIFIED — Biggest risk tonight:** live ALVAI prompt noncompliance and role overreach are the highest immediate risk because public/live responses inherit a signed-standards violation plus therapist/authority/commercial language. Evidence: `server.js:68`, `server.js:84`, `server.js:98`, `_meta/doctrine/felicia_standards_v1.md:54-76`.

## PART 2 — Live Path Map

### Runtime path

1. **Frontend → endpoint:** the frontend presents the ALVAI input and quick-start prompts in `index.html`; the live route surface is server-side `POST /api/chat` and `POST /api/chat/stream`. Evidence: `index.html:838-850`, `server.js:2036`, `server.js:2300`.
2. **Request entry / telemetry:** both chat endpoints parse JSON and log `chat_message_in` via `logEvent`. Evidence: `server.js:2040-2052`, `server.js:2304-2314`.
3. **Crisis detection:** both call `detectCrisis()` before model output and log `[CRISIS]` when detected. Evidence: `server.js:2057-2070`, `server.js:2315-2327`.
4. **Open Window / Trust Packet context:** both compute `openWindowGate()`, `getCommerceGate()`, and a v0 packet context before response generation. Evidence: `server.js:2076-2084`, `server.js:2328-2336`.
5. **Prompt build:** both call `buildPrompt(...)`; `/api/chat` additionally does opening-line locks and practitioner lookup injection. Evidence: `server.js:2142-2166`, `server.js:2337-2339`.
6. **Memory recall:** both resolve identity, optionally embed the user message for authenticated users, load short-term history from `conversation_history`, and load semantic recall. Evidence: `server.js:2168-2186`, `server.js:2340-2356`.
7. **Model call:** both call `https://api.openai.com/v1/chat/completions` with `stream: true`. Evidence: `server.js:2202-2206`, `server.js:2372-2376`.
8. **Stream output:** both stream SSE chunks to the client; crisis banner is written before model chunks when detected. Evidence: `server.js:2208-2219`, `server.js:2392-2397`.
9. **Commerce Steward:** both call `runCommerceSteward(res, p, crisis)` after prose and before ending the stream. Evidence: `server.js:2229-2233`, `server.js:2398-2400`.
10. **Trust Packet v0 logging:** both build `SignalObject.v0`, `DecisionObject.v0`, and `TrustPacket.v0` after completion and call `logTrustPacketV0()`, which logs only under diagnostic/dev/test conditions. Evidence: `server.js:2235-2244`, `server.js:2401-2410`, `server.js:354-360`.
11. **Memory write:** `/api/chat` writes `user_coherence`, primary `conversation_history`, and duplicate legacy `conversation_memory`; `/api/chat/stream` writes only `conversation_history` when Supabase is configured and response length is adequate. Evidence: `server.js:2254-2294`, `server.js:2427-2444`.

### Scenario behavior

- **VERIFIED — Normal chat:** enters `/api/chat` or `/api/chat/stream`, logs ingress, builds prompt, calls OpenAI, streams output, runs commerce steward, logs Trust Packet v0 in dev/test/diagnostic only, and writes memory if configured. Evidence: `server.js:2036-2244`, `server.js:2300-2444`.
- **VERIFIED — Greeting cache:** `/api/chat` short-circuits greetings such as `hello`, `hi`, `hey`, `help`, etc.; it uses minute-based rotating variants, streams the cached response, skips memory, and builds/logs Trust Packet v0. This is not deterministic minute-to-minute. Evidence: `server.js:2086-2120`.
- **VERIFIED — Emotional/support request:** emotional terms are tracked in an in-memory set and suppress commerce cards; the commerce gate marks `support_tier`. Evidence: `server.js:223-234`, `server.js:244-256`, `server.js:2054-2056`.
- **VERIFIED — Crisis request:** `detectCrisis()` triggers a non-overrideable banner before model output and Commerce Steward suppresses cards via crisis/open-window gates. Evidence: `core/safety/crisis_validator.js:23-48`, `server.js:2071-2075`, `server.js:2393-2395`, `server.js:1350-1364`.
- **VERIFIED — Product/supplement request:** Commerce Steward only emits product cards when commerce gate allows, productBrain matches catalog rows, safety is not blocked, and cart cap allows cards. Evidence: `server.js:1309-1364`, `server.js:1373-1403`.
- **VERIFIED — Practitioner lookup:** `/api/chat` detects therapist/doctor/practitioner/near-me/ZIP patterns, queries the `practitioners` table for up to 3 rows, and injects either verified rows or a no-results instruction. Evidence: `server.js:2148-2166`.
- **VERIFIED — Trust Packet v0 logging:** packets include signal, decision, response summary, memory write status, and outcome-checkpoint flag, but do not persist to DB and only log in dev/test/diagnostic. Evidence: `server.js:293-360`.

## PART 3 — ALVAI Calibration Audit

- **VERIFIED / P0 — Signed-standard violation:** live prompt says “You carry 127 years of healing lineage,” while Lock 2 says lineage is personal storytelling only and explicitly flags that exact prompt claim as a violation. Evidence: `server.js:68`, `_meta/doctrine/felicia_standards_v1.md:54-57`.
- **VERIFIED / P0 — Therapist overreach:** live prompt says “You are a therapist with a healers heart in every mode,” while the standards prohibit implied scope beyond verified roles and ALVAI may not diagnose/prescribe/treat/cure. Evidence: `server.js:98`, `_meta/doctrine/felicia_standards_v1.md:58-76`.
- **VERIFIED / P0 — Commerce pressure inside core voice:** “THE SALE COMES FROM THE SOUL” and “Pick up Thorne Magnesium tonight” conflicts with the standard that commerce follows care and is never surfaced during crisis/vulnerable states; later prompt rules try to constrain price/link behavior, creating internal contradiction. Evidence: `server.js:84`, `server.js:118-124`, `_meta/doctrine/felicia_standards_v1.md:61-76`.
- **VERIFIED / P1 — Medical/pharmacological implication risk:** the weight-loss pathway tells ALVAI to surface GLP-1 gateways and says a licensed physician reviews every prescription request. This may be acceptable only with Dr. Felicia signoff and careful copy, but it is live prompt content and medication-related. Evidence: `server.js:176-188`, `_meta/doctrine/felicia_standards_v1.md:61-76`.
- **VERIFIED / P1 — Role overload:** ALVAI is simultaneously a soul guide, storefront guide, therapist-like voice, directory router, supplement explainer, medication-cost helper, and crisis-adjacent support. The prompt itself tries to be too many roles and relies on prompt obedience rather than enforceable boundaries for many instructions. Evidence: `server.js:59-216`.
- **VERIFIED — “Therapist” language exists:** live prompt requires “I am an AI wellness guide, not a licensed therapist,” but also says “You are a therapist,” creating direct contradiction. Evidence: `server.js:98`, `server.js:155`.
- **Minimum safe patch recommendations:** remove the lineage claim; replace “therapist” identity with “AI wellness guide”; remove sales-as-soul language and product-specific price examples from `ALVAI_CORE`; preserve deterministic code gates; add a small prompt compliance smoke test that rejects the removed strings. No dormant modules, no schema changes, no new architecture.

## PART 4 — Dr. Felicia Standards Compliance

- **COMPLIANT / VERIFIED:** the standards document itself is signed, binding, and states only Dr. Stoler can amend it. Evidence: `_meta/doctrine/felicia_standards_v1.md:1-9`, `_meta/doctrine/felicia_standards_v1.md:82-95`.
- **NONCOMPLIANT / VERIFIED:** the live ALVAI prompt violates Lock 2 by using lineage as authority. Evidence: `server.js:68`, `_meta/doctrine/felicia_standards_v1.md:54-57`.
- **NEEDS CODE PATCH / VERIFIED:** therapist identity and sales-first copy should be patched in `server.js` because they are live prompt content. Evidence: `server.js:84`, `server.js:98`, `_meta/doctrine/felicia_standards_v1.md:58-76`.
- **NEEDS SIGNOFF / VERIFIED:** GLP-1/semaglutide/Ozempic/medication pathway copy and “licensed physician reviews every prescription request” are medication/clinical content requiring Dr. Stoler review. Evidence: `server.js:176-188`, `_meta/doctrine/felicia_standards_v1.md:15-20`, `_meta/doctrine/felicia_standards_v1.md:61-76`.
- **UNKNOWN / BLOCKED:** current production Supabase migration application state cannot be verified from local files alone; migration files exist, but DB state requires credentialed Supabase verification. Evidence: `supabase/migrations/2026-05-21-p0-revoke-anon.sql:59-69`.
- **NEEDS TEST / VERIFIED:** add prompt-compliance tests for forbidden strings and role framing because current tests focus on schemas/crisis, not prompt clinical-copy compliance. Evidence: `package.json:10-12`, `tests/crisis_validator.test.js:27-107`.

## PART 5 — Trust Packet / Governance Reality

- **VERIFIED — v0 code exists live:** `buildTrustPacketV0()` emits `SignalObject.v0`, `DecisionObject.v0`, and `TrustPacket.v0` from live endpoint context. Evidence: `server.js:293-351`.
- **VERIFIED — v0 logs only:** `logTrustPacketV0()` prints to console only when test/dev/diagnostic env conditions are true. Evidence: `server.js:354-360`.
- **VERIFIED — older Trust Packet helper exists but is not retrofitted:** `buildTrustPacket/logTrustPacket` writes `trust_packet` to `bleu_events`, but the comment says it is not wired to any route. Evidence: `server.js:808-813`, `server.js:846-860`.
- **VERIFIED — v1.1 schemas exist:** Signal, Decision, and Trust Packet v1.1 schemas are present and declare tested-only/dormant status. Evidence: `core/schemas/README.md:3-15`, `core/schemas/trust_packet_v1.1.schema.json:1-17`.
- **VERIFIED — tests exist:** `package.json` chains schema tests including Signal, Decision, Trust Packet, trust-packet logger, and WAL Lexapro fixture tests. Evidence: `package.json:10-12`.
- **VERIFIED — persistence is disabled/approval-gated:** Trust Packet v1.1 migration says do not apply without Felicia retention signoff, has RLS and service-role-only policy, and is not called by `server.js`. Evidence: `supabase/migrations/2026-06-02-trust-packets-table.sql:1-3`, `supabase/migrations/2026-06-02-trust-packets-table.sql:57-68`.
- **REQUIRES HUMAN SIGNOFF:** persistent Trust Packet storage, schema activation, and dormant agent wiring require explicit approval under the repo charter. Evidence: `AGENTS.md:19-26`, `AGENTS.md:65-72`.
- **Safest demo path:** use the live v0 bridge with `BLEU_TEST_TRUST_PACKET_V0=1 node server.js` and/or `NODE_ENV=test/development` log visibility, plus a fixed model stub only if implemented inside the live code path without hand-writing output. Do not wire `core/agents/*` or persist v1.1 packets tonight. Evidence: `server.js:3705-3756`, `AGENTS.md:51-60`.

## PART 6 — Supabase / Data / Memory Audit

- **VERIFIED — `conversation_history` is the primary live memory store:** helper writes role/content/session/user/embedding rows and reads short-term history; semantic recall is auth-only. Evidence: `server.js:1501-1517`, `server.js:1520-1546`.
- **VERIFIED — `conversation_memory` duplication exists:** `/api/chat` still writes both user and assistant content to legacy `conversation_memory` after writing `conversation_history`, with a TODO to remove after migration audit. Evidence: `server.js:2291-2293`.
- **VERIFIED — `user_coherence` stores live CI and phone/reorder data:** `/api/chat` writes coherence scores; reorder reminder writes phone and protocol data; migration notes call `user_coherence.phone` sensitive. Evidence: `server.js:2254-2271`, `server.js:3042-3050`, `supabase/migrations/2026-05-21-p0-revoke-anon.sql:13-21`.
- **VERIFIED — `outcome_events` exists as an append-only event log migration:** it stores `user_id`, `session_id`, `event_type`, `protocol_name`, `source`, and `payload` with RLS service-role policy. Evidence: `migrations/outcome_events.sql:1-13`, `migrations/outcome_events.sql:20-28`.
- **VERIFIED / P0 privacy risk:** Twilio replies persist `from_phone`, `to_phone`, `body_text`, and account SID inside `outcome_events.payload`; this conflicts with the TD-010 direction elsewhere that plaintext phone/email should not be stored. Evidence: `server.js:3212-3235`, `server.js:3238-3261`, `supabase/migrations/2026-06-01-memory-records-table.sql:26-33`.
- **PARTIALLY VERIFIED — RLS/grants:** migration files revoke anon/authenticated from sensitive tables and enable service-role policies on newer tables, but local repo cannot prove the migrations were applied to production. Evidence: `supabase/migrations/2026-05-21-p0-revoke-anon.sql:73-103`, `supabase/migrations/2026-06-02-trust-packets-table.sql:57-68`.
- **Codex action required:** patch Twilio outcome payload to store hashed/redacted phone and non-plaintext body classification only; run a DB/RLS verification script with Supabase credentials if available; do not apply dormant memory_records/trust_packets migrations without signoff.

## PART 7 — Commerce / Stripe / Affiliate Audit

- **VERIFIED — commerce gating exists:** `getCommerceGate()` blocks commerce on crisis, support tier, first response, and no stated concern; `appendCommerceGatePrompt()` adds prompt-level commerce restrictions. Evidence: `server.js:236-263`.
- **VERIFIED — product cards are code-suppressed by gate:** Commerce Steward returns early and logs suppression when commerce is not allowed. Evidence: `server.js:1350-1359`.
- **VERIFIED — crisis suppression exists in code:** Commerce Steward returns on open-window crisis, intent crisis, or deterministic crisis. Evidence: `server.js:1362-1364`.
- **VERIFIED — Stripe create-session is restricted to known price IDs:** it rejects missing/unknown `price_id` before calling Stripe. Evidence: `server.js:3272-3282`.
- **VERIFIED — Stripe webhook fails closed on missing/invalid secret/signature:** it refuses missing webhook secret, missing signature, malformed signature, invalid signature, and stale timestamps. Evidence: `server.js:3487-3547`.
- **VERIFIED / P1 — commerce kill switch is fail-open:** checkout kill switch logs and returns `true` on read failure; this protects revenue but is not safest for a stage demo. Evidence: `server.js:1419-1438`.
- **PARTIALLY VERIFIED — price ID consistency:** `create-session` uses `PROTOCOL_MAP`, but full price-ID/environment consistency requires checking configured Stripe prices and environment variables, which local repo cannot prove. Evidence: `server.js:3279-3295`.
- **Demo classification:** product cards and checkout should not be shown in the Lexapro/counterfactual safety demo; commerce is safe enough for general smoke only if the fixed demo input is non-commerce or gate-suppressed. Evidence: `server.js:252-263`, `server.js:1350-1364`.

## PART 8 — Crisis / Clinical Safety Audit

- **VERIFIED — deterministic detector:** `detectCrisis()` delegates to canonical regex patterns and returns detected/category/matched without model involvement. Evidence: `core/safety/crisis_validator.js:23-48`.
- **VERIFIED / P0 — current false-positive regression:** local `node tests/crisis_validator.test.js` fails because “My phone is going to die soon, need to find a charger” is incorrectly detected as crisis. This is code-enforced safety overreach and should be repaired before public/demo reliance on crisis metrics. Evidence: `tests/crisis_validator.test.js:66-75`, `core/safety/canonical_crisis_patterns.js:24-40`.
- **VERIFIED — crisis banner:** crisis banner is imported from keywords and test asserts it contains 988, 911, SAMHSA, 741741, and SAFETY FIRST. Evidence: `core/safety/crisis_validator.js:20`, `tests/crisis_validator.test.js:99-107`.
- **VERIFIED — crisis logging:** both chat endpoints log `[CRISIS]` with category, matched phrase, session, user, and endpoint. Evidence: `server.js:2061-2070`, `server.js:2318-2327`.
- **VERIFIED — commerce suppression during crisis:** crisis routes force commerce gate reason and Commerce Steward early return. Evidence: `server.js:252-256`, `server.js:1362-1364`.
- **PARTIALLY VERIFIED — mental-health safety:** crisis banner and no-commerce behavior are code-enforced; many other mental-health boundaries are prompt-only and inherit the therapist-language contradiction. Evidence: `server.js:98`, `server.js:155`, `server.js:2071-2075`.
- **REQUIRES HUMAN SIGNOFF — medication/demo language:** Lexapro/SSRI/counterfactual demo clinical wording must come from Dr. Stoler or be labeled REQUIRES DR. STOLER SIGNOFF. Evidence: `_meta/doctrine/felicia_standards_v1.md:15-20`, `_meta/doctrine/felicia_standards_v1.md:72-79`.
- **VERIFIED — Lexapro status is fixture/test-only:** the WAL Lexapro fixture is in the schema test chain, but no runtime endpoint is shown in `server.js`. Evidence: `package.json:11`, `tests/fixtures/golden/wal-lexapro-killer-demo.json`.

## PART 9 — Tests / CI / PR Audit

- **VERIFIED — runnable scripts:** `npm start`, `npm run test:browser`, `npm run test:logic`, `npm run test:webhook-smoke`, `npm test`/`test:schemas`, and `BLEU_TEST_TRUST_PACKET_V0=1 node server.js` are configured. Evidence: `package.json:5-12`.
- **VERIFIED — schema test policy is documented:** AGENTS requires Ajv2020 from `ajv/dist/2020`, strict true, addFormats, no draft-07 downgrade, and semantic invalid assertions. Evidence: `AGENTS.md:103-105`.
- **VERIFIED — current package has Ajv deps:** root `package.json` includes `ajv` and `ajv-formats` dev dependencies. Evidence: `package.json:17-20`.
- **VERIFIED — PR #58 is open:** the public GitHub PR page shows “Unify schema tests on Ajv2020 strict validation #58” as Open, targeting `main` from `codex/consolidate-schema-fixes-into-one-pr`. Source: GitHub PR #58 page, lines 171-180 and 206-218 from browser fetch.
- **BLOCKED — PR #58 mergeability:** local `gh` CLI is unavailable and the unauthenticated GitHub page did not expose a reliable mergeability field; do not merge or treat it as shipped. Command evidence: `gh pr view 58 --repo bleudreamzone-coder/bleu-system --json ...` failed because `gh` is not installed.
- **What can run now:** `npm run test:schemas`, `npm run test:logic`, `npm run test:webhook-smoke`, `node tests/crisis_validator.test.js`, and `BLEU_TEST_TRUST_PACKET_V0=1 node server.js`.
- **VERIFIED — current local results:** Trust Packet v0 diagnostic, server logic smoke, and schema tests pass; crisis validator currently fails one false-positive guard. The failure should be treated as an engineering bug, not an environment limitation.
- **What proves next fix:** after ALVAI prompt patch, run `rg -n "127 years of healing lineage|You are a therapist|THE SALE COMES FROM THE SOUL|Pick up Thorne Magnesium" server.js` expecting no live prompt hits, plus `BLEU_TEST_TRUST_PACKET_V0=1 node server.js` and a chat smoke test.

## PART 10 — Demo Readiness Audit

- **Can safely demonstrate tonight:** greeting cache, deterministic crisis banner, commerce suppression on support/crisis/first response, Trust Packet v0 diagnostic, and practitioner lookup only if Supabase credentials/data are available. Evidence: `server.js:2086-2120`, `server.js:2057-2075`, `server.js:236-263`, `server.js:3705-3756`, `server.js:2148-2166`.
- **Cannot demonstrate yet:** a live deterministic Lexapro counterfactual path that emits real Signal → Decision → Governed Response → Trust Packet through the live route without a live model call or hand-written output. Evidence: `AGENTS.md:51-60`, `package.json:11`.
- **Must be deterministic:** greeting cache is not deterministic minute-to-minute because it uses `Math.floor(Date.now()/60000) % variants.length`; do not use it as the canonical demo proof. Evidence: `server.js:2104-2107`.
- **Output that can be trusted:** Trust Packet v0 diagnostic structural output can be trusted as no-DB, no-PII, no-raw-message proof; model prose cannot be trusted unless a fixed model stub is added through approved live governance logic. Evidence: `server.js:3740-3756`, `AGENTS.md:55-60`.
- **Requires Dr. Stoler signoff:** medication/mental-health/Lexapro language and any clinical counterfactual wording. Evidence: `_meta/doctrine/felicia_standards_v1.md:15-20`, `_meta/doctrine/felicia_standards_v1.md:72-79`.
- **Hide from demo:** product cards, checkout/Stripe, Twilio SMS replies, account signup/magic links, live model improvisation, and any unpatched ALVAI prompt claim. Evidence: `server.js:1373-1403`, `server.js:3272-3305`, `server.js:3209-3261`, `server.js:3310-3315`, `server.js:68`.
- **Minimum demo path:** fixed non-commerce support/safety input → live `/api/chat/stream` with test/development Trust Packet v0 log visibility → crisis/commerce gates visible → response from fixed stub or approved canned model layer only after prompt compliance patch.

## PART 11 — Workforce Wellness / City Wedge Reality Check

- **PARTIALLY VERIFIED — wedge in doctrine/content:** THE BLEU BIBLE contains employer/hotel/hospitality framing and hospitality variants, but that is doctrine/content, not live product proof. Evidence: `_meta/THE_BLEU_BIBLE.md:29-31`, `_meta/THE_BLEU_BIBLE.md:505-506`, `_meta/THE_BLEU_BIBLE.md:758-769`.
- **VERIFIED — not visible as live landing wedge:** `index.html` public meta and hero say “clinically governed care platform built for your life,” with nav for Home/Local/Support/Learn/Supply; no visible city employee/hospitality workforce route appears in inspected landing code. Evidence: `index.html:8-15`, `index.html:801-806`, `index.html:830-841`.
- **VERIFIED — some workforce data scaffolding exists:** an RLS remediation migration mentions `care_twin_patterns` and `workforce_signals`, but this is database/security scaffold, not a live wedge page. Evidence: `supabase/migrations/2026-05-26-p8-grant-exposure-lockdown.sql:23-27`.
- **Minimal task later:** add one non-clinical landing-page section or route label after P0 safety/demo fixes, using copy approved by Bleu and Dr. Stoler where health claims appear.
- **Recommendation:** wait until prompt compliance, Twilio privacy, and demo determinism are fixed.

## PART 12 — Prioritized Findings

### P0 — Must fix before demo/public push

1. **Finding:** crisis validator currently false-positives on a phone-battery sentence. **Evidence:** `tests/crisis_validator.test.js:66-75`, `core/safety/canonical_crisis_patterns.js:24-40`. **Risk:** crisis metrics and user experience can be polluted by non-crisis language. **Next action:** tighten the canonical `going to die` pattern so non-human/device contexts do not trip while true suicidal ideation still does. **Owner:** Codex + Dr. Felicia review.
2. **Finding:** live ALVAI prompt includes the forbidden lineage claim. **Evidence:** `server.js:68`, `_meta/doctrine/felicia_standards_v1.md:54-57`. **Risk:** signed clinical/professional standard violation in live path. **Next action:** patch `ALVAI_CORE` to remove lineage-as-authority wording. **Owner:** Codex.
3. **Finding:** live prompt says ALVAI is a therapist. **Evidence:** `server.js:98`, `_meta/doctrine/felicia_standards_v1.md:58-76`. **Risk:** implied licensure/scope and mental-health overreach. **Next action:** change to “AI wellness guide” and keep clinician/referral language bounded. **Owner:** Codex + Dr. Felicia review.
4. **Finding:** core prompt contains sales-first supplement language. **Evidence:** `server.js:84`, `server.js:110-124`. **Risk:** commerce pressure contradicts care-first standard and demo safety. **Next action:** remove product-specific price/purchase example from core prompt. **Owner:** Codex / Bleu / Dr. Felicia.
5. **Finding:** Twilio replies persist plaintext phone and message body in `outcome_events`. **Evidence:** `server.js:3221-3235`, `server.js:3247-3261`. **Risk:** PII and sensitive message storage. **Next action:** redact/hash phone and store intent classification, not raw body. **Owner:** Codex; Human ops for DB retention review.
6. **Finding:** no deterministic live Lexapro demo path exists. **Evidence:** `AGENTS.md:51-60`, `package.json:11`, `server.js:3705-3756`. **Risk:** stage demo depends on live model or hand-written output. **Next action:** after prompt patch, add approved fixed-stub live proof path only if it preserves real governance logic and no dormant wiring. **Owner:** Codex + Dr. Felicia for clinical copy.

### P1 — Should fix tonight if time remains

1. **Finding:** canonical crisis patterns file says proposed/not wired while it is wired. **Evidence:** `core/safety/canonical_crisis_patterns.js:1-14`, `core/safety/crisis_validator.js:20-37`. **Risk:** documentation contradicts runtime safety. **Next action:** update status comments only, citing signoff/audit. **Owner:** Codex / Dr. Felicia if clinical status is unclear.
2. **Finding:** commerce kill switch fails open on DB read failure. **Evidence:** `server.js:1419-1438`. **Risk:** demo/public checkout may remain enabled during DB failure. **Next action:** for demo, do not show checkout; later decide whether kill switch should fail closed. **Owner:** Bleu + Codex.
3. **Finding:** greeting cache is time-variant. **Evidence:** `server.js:2104-2107`. **Risk:** not suitable for deterministic demo proof. **Next action:** do not use greeting cache for canonical demo; optionally add test-mode deterministic variant later. **Owner:** Codex.

### P2 — Important but not tonight

1. Consolidate `conversation_memory` after audit readers are confirmed. Evidence: `server.js:2291-2293`. Owner: Codex.
2. Verify production RLS/grants with Supabase credentials. Evidence: `supabase/migrations/2026-05-21-p0-revoke-anon.sql:109-120`. Owner: Human ops / Codex.
3. Reconcile `CLAUDE.md` stale claims with current repo reality. Evidence: `CLAUDE.md:18`, `package.json:5-12`. Owner: Codex.
4. Make workforce/city wedge visible after safety/demo proof. Evidence: `index.html:8-15`, `_meta/THE_BLEU_BIBLE.md:758-769`. Owner: Bleu / Codex.

### DO NOT TOUCH — risky expansion or approval-required

- Do not wire `core/agents/*` into `server.js` tonight. Evidence: `AGENTS.md:19-26`.
- Do not activate or persist Trust Packet v1.1 storage without retention/RLS/signoff. Evidence: `supabase/migrations/2026-06-02-trust-packets-table.sql:1-3`.
- Do not create new schemas, agent layers, routers, or architecture. Evidence: `AGENTS.md:29-37`, `AGENTS.md:65-72`.
- Do not author clinical Lexapro/medication language without Dr. Stoler signoff. Evidence: `_meta/doctrine/felicia_standards_v1.md:15-20`, `_meta/doctrine/felicia_standards_v1.md:72-79`.

## PART 13 — Codex Handoff

**Task:** Patch `server.js` ALVAI prompt compliance with `_meta/doctrine/felicia_standards_v1.md`, starting with removing the “127 years of healing lineage” claim, then verify `/api/chat` still runs and Trust Packet v0 logging still works.

**Files to inspect:**
- `AGENTS.md`
- `server.js`
- `_meta/doctrine/felicia_standards_v1.md`
- `core/safety/crisis_validator.js`
- `core/safety/canonical_crisis_patterns.js`
- `package.json`

**Files likely to patch:**
- `server.js` only for P0 prompt compliance.
- Optional test file only if adding a small prompt-compliance smoke check without new architecture.

**Changes allowed:**
- Remove the lineage claim from `ALVAI_CORE`.
- Replace therapist identity language with bounded AI wellness-guide wording.
- Remove product-specific “sale from soul” price/purchase examples from the core prompt.
- Keep existing crisis detection, commerce gate, streaming, memory, and Trust Packet v0 behavior intact.

**Changes forbidden:**
- No new architecture.
- Do not wire dormant `core/agents/*` or `core/schemas/*` into live routes.
- Do not add Trust Packet persistence.
- Do not change schema versions or migrations.
- Do not author new clinical/medication/Lexapro content.
- Do not merge PR #58 or treat it as shipped.

**Tests/checks to run:**
- `rg -n "127 years of healing lineage|You are a therapist|THE SALE COMES FROM THE SOUL|Pick up Thorne Magnesium" server.js`
- `BLEU_TEST_TRUST_PACKET_V0=1 node server.js`
- `node tests/crisis_validator.test.js`
- `npm run test:logic`
- `npm run test:schemas` if dependencies are present.

**Report format:**
- Files changed with exact line ranges.
- Behavior before/after.
- Tests run with pass/warn/fail.
- What remains UNVERIFIED.
- Cite file paths and lines.

**Signoff boundaries:**
- Dr. Stoler: clinical claims, credential/evidence framing, nutrition/lifestyle/medication/mental-health copy.
- Bleu: brand voice, product priority, commerce restraint, Citizen experience.
- Threesome: schema changes, architecture changes, dormant-to-live wiring, Trust Packet persistence, clinical safety workflow changes, new live-path decision behavior.

## PART 14 — Final 4-Hour Execution Plan

- **Hour 1 — audit and patch P0 compliance.** Artifact: `server.js` P0 prompt patch removing lineage/therapist/sales-pressure language with no route or architecture changes.
- **Hour 2 — run tests and verify live-path behavior.** Artifact: test log for prompt-string scan, Trust Packet v0 diagnostic, crisis validator, server logic smoke, and schema tests if available.
- **Hour 3 — Trust Packet/demo proof path.** Artifact: captured Trust Packet v0 diagnostic output proving Signal → Decision → Governed Response summary → Trust Packet shape without DB write or raw message/PII.
- **Hour 4 — final handoff/demo notes.** Artifact: Codex handoff and demo script marking any clinical wording as REQUIRES DR. STOLER SIGNOFF.

## Final answers

1. **Single highest-leverage fix tonight:** patch `server.js` ALVAI prompt compliance with `_meta/doctrine/felicia_standards_v1.md`, starting with removal of “127 years of healing lineage.”
2. **Single highest-risk thing not to touch tonight:** wiring dormant `core/agents/*` / `core/schemas/*` or Trust Packet v1.1 persistence into the live path.
3. **Exact first Codex task to run:** Patch `server.js` ALVAI prompt compliance with `_meta/doctrine/felicia_standards_v1.md`, starting with removing the “127 years of healing lineage” claim, then verify `/api/chat` still runs and Trust Packet v0 logging still works.
