# Demo Readiness Audit — Natchitoches Rural Health Transformation Summit

**Date:** 2026-06-07
**Trip / venue:** Natchitoches Rural Health Transformation Summit, June 9–12, 2026
**Mode:** read-only demo-readiness pass; no behavior changes
**Scope:** protected live web chat path only: `server.js`, `/api/chat`, `/api/chat/stream`
**Status labels used:** VERIFIED / PARTIALLY VERIFIED / UNKNOWN / BLOCKED / REQUIRES DR. STOLER SIGNOFF

## 0. Executive answer

**PARTIALLY VERIFIED — BLEU can be shown safely only as a care-first live web chat walkthrough if the presenter keeps the scope narrow and avoids medication-specific or unaudited mode/submode demonstrations.** The current checkout contains the care-first ALVAI prompt repair, deterministic crisis banner wiring, commerce suppression for distress language, and observe-only Trust Packet v0 diagnostics. Evidence: `server.js:59-122`, `server.js:220-260`, `server.js:2036-2074`, `server.js:2298-2335`, `server.js:3702-3757`.

**BLOCKED for fully deterministic summit proof:** the only existing deterministic Signal → Decision → Trust Packet proof is a diagnostic harness using a sleep input and mocked stream chunks, not an exposed stage route or live browser demo path. Evidence: `server.js:3702-3757`. The live `/api/chat` and `/api/chat/stream` flows still call OpenAI with `temperature: 1`, making clinical prose non-deterministic. Evidence: `server.js:2197-2204`, `server.js:2365-2373`.

**P0 before June 9:** fix the known crisis false-positive, keep therapy/recovery submodes off-screen unless Dr. Stoler approves the exact wording, and create/verify a deterministic governed proof path after Tasks 1–4 in the finishing queue. Evidence: `_meta/doctrine/finishing_queue.md:22-74`, `tests/crisis_validator.test.js:63-85`, `server.js:666-684`, `server.js:1888-1903`.

## 1. LIVE-STATE CONFIRMATION

### 1.1 Care-first ALVAI prompt repair

- **VERIFIED in current checkout — no exact forbidden strings found:** `rg -n "THE SALE COMES FROM THE SOUL|127 years of healing lineage|You are a therapist" server.js` returned no matches during this audit. This confirms the exact strings called out in the prompt are absent from the inspected `server.js` checkout.
- **VERIFIED — replacement voice is care-first, not sales-first:** the live `ALVAI_CORE` now says care comes first; a product is never the first thing to reach for; when someone is hurting, the response gives understanding and a free first step with no product. Evidence: `server.js:82-106`.
- **VERIFIED — ALVAI no longer claims to be a therapist in the inspected core prompt:** the current role language says, “You are an AI wellness guide,” while also instructing a natural closing that names it is not a licensed therapist. Evidence: `server.js:100`, `server.js:152`.
- **VERIFIED — lineage-as-credential phrase is removed from the live prompt:** current line `server.js:68` carries New Orleans narrative voice, not the previously flagged “127 years of healing lineage” claim. Evidence: `server.js:63-70`; prior signed-standard action flag still documents why the old claim was forbidden at `_meta/doctrine/felicia_standards_v1.md:54-57`.
- **PARTIALLY VERIFIED — 16 wisdom voices / influences are present:** line `server.js:70` contains the named voices requested for the live repair: Martin Luther King, Louis Armstrong, Barack Obama, Hippocrates, Maya Angelou, Mahalia Jackson, Pema Chodron, Rachel Naomi Remen, Cicely Saunders, Mother Teresa, Leah Chase, Marion Nestle, Thich Nhat Hanh, Thomas Merton, and the Dalai Lama, plus “survivors who have come through hard things.” Evidence: `server.js:70`. Count depends on whether “survivors” is counted as a named wisdom voice; if the requirement is exactly 16 named human sources, **UNKNOWN / needs human interpretation**.

### 1.2 Distress terms suppress commerce

- **VERIFIED — distress terms are in the emotional-intent suppression regex:** `anxious`, `anxiety`, `panic`, and depressed/depression are included in `EMOTIONAL_INTENT_RE`. Evidence: `server.js:220-230`.
- **VERIFIED — emotional intent becomes a commerce gate reason:** `getCommerceGate()` sets `supportTier` from `checkEmotionalIntent()` and returns `allowed: false` when the reason is `support_tier`. Evidence: `server.js:241-254`.
- **VERIFIED — the prompt-level commerce restraint explicitly forbids products, supplements, carts, affiliate links, prices, stores, checkout, Amazon, Fullscript, Stripe, BetterHelp offers, or paid plans when the gate is active.** Evidence: `server.js:255-260`.
- **VERIFIED — the Commerce Steward emits zero cards and logs suppression when the commerce gate is not allowed.** Evidence: `server.js:1347-1357`.

### 1.3 Deployment status

- **UNKNOWN — deployed on Render:** this audit has repo access only. It cannot confirm that the inspected checkout is deployed on Render without dashboard access, current Render commit SHA, or production response proof.
- **UNKNOWN — “on main” exactness:** local branch is `work`, not `main`, and this audit did not fetch or compare a remote production branch. The inspected HEAD is `749344d Merge pull request #62 from bleudreamzone-coder/codex/add-compliance-test-for-alvai-prompts` from `git log --oneline -1`.

## 2. SAFE DEMO SCRIPT — live web chat path only

**Use only `/api/chat` or `/api/chat/stream`. Do not use signup, magic links, SMS, Stripe, cart, product cards, dormant `core/agents/*`, or Trust Packet v1.1 persistence.** The live paths both run crisis detection, commerce gating, prompt build, model streaming, Commerce Steward, and Trust Packet v0 construction. Evidence: `server.js:2036-2241`, `server.js:2298-2407`.

### Step A — Anxiety / distress input: walk with feeling; no product card; 988 only if crisis

- **Exact user input to type:** `I feel anxious and my chest is tight. I do not want products. I just need help slowing down tonight.`
- **Endpoint:** `/api/chat` from the web chat; `/api/chat/stream` is also live, but one endpoint should be chosen and rehearsed.
- **Expected governed behavior:**
  - **VERIFIED — distress suppresses commerce:** `anxious` matches the emotional-intent regex; the support-tier commerce gate is set; commerce restraint is appended; Commerce Steward returns before emitting cards. Evidence: `server.js:220-260`, `server.js:1347-1357`, `server.js:2180-2183`.
  - **VERIFIED — anxiety opening line is available on `/api/chat`:** `detectOpening()` returns “Your mind is running ahead of your body. Let's slow it down.” for anxious/anxiety/panic/stress/overwhelm/racing mind/worry. Evidence: `server.js:2120-2131`.
  - **VERIFIED — non-crisis anxiety should not trigger the deterministic banner unless `detectCrisis()` matches a crisis phrase.** Evidence: `server.js:2054-2071`, `core/safety/crisis_validator.js:32-48`.
  - **DEMO RISK — final prose depends on live model call:** `/api/chat` calls OpenAI with `temperature: 1`; same input can vary. Evidence: `server.js:2197-2204`.
- **REQUIRES DR. STOLER SIGNOFF — any on-stage mental-health copy:** the exact presenter framing for anxious/chest-tight/slowing-down language is mental-health-adjacent and must be approved before use. Binding standard: `_meta/doctrine/felicia_standards_v1.md:72-79`.

### Step B — Sleep input: plain 6th-grade, behavior-first guidance

- **Exact user input to type:** `I cannot sleep and I am exhausted. Give me one simple thing I can do tonight before bed.`
- **Endpoint:** `/api/chat`.
- **Expected governed behavior:**
  - **VERIFIED — 6th-grade reading level is required by `ALVAI_CORE`.** Evidence: `server.js:72`.
  - **VERIFIED — sleep opening line is available on `/api/chat`:** `detectOpening()` returns “Your system is wired right now. Not broken — just stuck.” for sleep/insomnia/can't sleep/tired/exhausted/restless. Evidence: `server.js:2120-2124`.
  - **VERIFIED — first response blocks commerce even when sleep is a commerce concern:** sleep matches `COMMERCE_CONCERN_RE`, but `firstResponse` alone makes `getCommerceGate()` disallow commerce with reason `first_response`. Evidence: `server.js:233-254`.
  - **VERIFIED — the prompt instructs lifestyle/behavior-first framing and says a supplement is supportive at most, never the lead.** Evidence: `server.js:182-184`.
  - **DEMO RISK — final prose depends on live model call:** `/api/chat` calls OpenAI with `temperature: 1`. Evidence: `server.js:2197-2204`.
- **REQUIRES DR. STOLER SIGNOFF — sleep guidance copy:** any exact sleep advice said on stage is health guidance and must be approved. Binding standard: `_meta/doctrine/felicia_standards_v1.md:72-79`.

### Step C — Crisis input: deterministic 988 banner

- **Exact user input to type only if Dr. Stoler approves live crisis demonstration:** `I want to die.`
- **Endpoint:** `/api/chat` or `/api/chat/stream`.
- **Expected governed behavior:**
  - **VERIFIED — deterministic crisis detector delegates to the canonical crisis matcher.** Evidence: `core/safety/crisis_validator.js:20-48`.
  - **VERIFIED — canonical crisis patterns include `want to die`.** Evidence: `core/safety/canonical_crisis_patterns.js:20-40`.
  - **VERIFIED — `/api/chat` writes the crisis banner SSE before model output.** Evidence: `server.js:2054-2071`, `server.js:2205-2208`.
  - **VERIFIED — `/api/chat/stream` writes the crisis banner SSE before stream chunks.** Evidence: `server.js:2313-2324`, `server.js:2389-2392`.
  - **VERIFIED — the banner content contains 988, 911, SAMHSA, 741741, and SAFETY FIRST in the existing test harness.** Evidence: `tests/crisis_validator.test.js:99-107`.
  - **DEMO RISK — model continues after the deterministic banner:** the banner is deterministic, but the downstream model prose remains non-deterministic. Evidence: `server.js:2205-2229`, `server.js:2389-2396`.
- **REQUIRES DR. STOLER SIGNOFF — crisis demo wording:** the exact crisis input and any spoken setup in front of officials should be approved, including whether to demonstrate this live at all. Binding standard: `_meta/doctrine/felicia_standards_v1.md:78-79`.

## 3. DEMO BLOCKERS — prioritized before June 9

### P0-1 — Fix crisis false positive: “My phone is going to die…”

- **VERIFIED BLOCKER:** the negative test explicitly says “My phone is going to die soon, need to find a charger” must not detect crisis, but the current canonical pattern `\b(want|wanna|going) to die\b` can match device context. Evidence: `tests/crisis_validator.test.js:63-85`, `core/safety/canonical_crisis_patterns.js:20-25`.
- **VERIFIED runtime effect:** `detectCrisis()` delegates to `isCrisisPhrase()`, so the false positive can trigger the real crisis path. Evidence: `core/safety/crisis_validator.js:20-48`, `server.js:2054-2071`, `server.js:2313-2324`.
- **Owner:** Codex with Dr. Stoler boundary review.
- **Estimate:** 30–60 minutes for regex/test repair plus review.
- **Finishing queue mapping:** Task 1. Evidence: `_meta/doctrine/finishing_queue.md:22-30`.

### P0-2 — Do not demo unaudited therapy/recovery submodes until reviewed

- **VERIFIED BLOCKER:** `buildPrompt()` appends `THERAPY_MODES[tm]` and `RECOVERY_MODES[rm]` directly into the live prompt when `mode` is `therapy` or `recovery`. Evidence: `server.js:1888-1891`.
- **VERIFIED — compliance test coverage gap remains plausible:** the submode strings contain mental-health and addiction instructions, including CBT/DBT/somatic/couples/trauma/eating/recovery/harm-reduction copy. Evidence: `server.js:666-684`.
- **VERIFIED — potential clinical-overreach phrases exist in submodes:** examples include “General talk therapy,” “CBT,” “DBT,” “Somatic therapy,” “Couples,” “Trauma-Informed,” “HAES,” “Meeting finder,” and harm-reduction instructions. Evidence: `server.js:666-684`.
- **PARTIALLY VERIFIED — commerce-forward language in these submodes:** the submode strings themselves are not sales-forward, but because they are appended into live prompts, any unapproved clinical copy could surface during a demo. Evidence: `server.js:666-684`, `server.js:1888-1903`.
- **Owner:** Dr. Stoler for copy approval; Codex for bounded removal/repair only after approval.
- **Estimate:** 60–120 minutes to audit and patch exact strings after clinical signoff; faster path is to hide the modes from demo.
- **Finishing queue mapping:** Task 3 / Task 4 scope-adjacent but not fully duplicated; do not create a new task before finishing the P0 queue. Evidence: `_meta/doctrine/finishing_queue.md:40-57`.

### P0-3 — Create deterministic governed proof path, or do not claim deterministic live demo

- **VERIFIED BLOCKER:** Trust Packet v0 diagnostic proves construction of `SignalObject.v0`, `DecisionObject.v0`, and `TrustPacket.v0` with no raw user message, no session/user PII, and no DB write, but it uses a fixed sleep payload and diagnostic mock chunks. Evidence: `server.js:3702-3757`.
- **VERIFIED — live routes build Trust Packet v0 after completion:** `/api/chat` and `/api/chat/stream` both build and log Trust Packet v0 after response completion. Evidence: `server.js:2232-2241`, `server.js:2398-2407`.
- **BLOCKED — no exposed deterministic stage route:** no current evidence shows a stage-ready fixed model stub through the live web chat path. Existing live requests still call OpenAI. Evidence: `server.js:2197-2204`, `server.js:2365-2373`.
- **Owner:** Codex after Tasks 1–4; Dr. Stoler for any medication/mental-health copy.
- **Estimate:** 2–4 hours if approved as fixed-stub proof preserving live governance logic; longer if production UX must show the packet on-screen.
- **Finishing queue mapping:** Task 6. Evidence: `_meta/doctrine/finishing_queue.md:67-74`.

### P0-4 — Confirm production deployment or avoid saying “this is what Render runs”

- **UNKNOWN / BLOCKED:** repo-only audit cannot verify Render deployment. Need Render dashboard, deployed commit SHA, or a production endpoint proof.
- **Owner:** Bleu / ops.
- **Estimate:** 15–30 minutes with dashboard access.

### P1 — Checkout/cart kill switch is fail-open; hide commerce surfaces

- **VERIFIED:** global commerce kill switch fails open on missing DB row/read error. Evidence: `server.js:1416-1436`.
- **Owner:** Bleu + Codex after demo-critical safety proof.
- **Estimate:** 30–60 minutes if policy is to fail closed; otherwise hide from demo.

### P1 — SMS/Twilio reply PII persistence remains unsafe for demo

- **VERIFIED:** `/twilio-reply` writes `from_phone`, `to_phone`, `body_text`, and `account_sid` into `outcome_events`. Evidence: `server.js:3200-3258`.
- **PARTIALLY VERIFIED:** `/api/sms/inbound` hashes the phone, but still logs `raw_text`. Evidence: `server.js:3156-3181`.
- **Owner:** Codex + human ops.
- **Estimate:** 1–2 hours to repair; do not demo before repair.
- **Finishing queue mapping:** Task 5. Evidence: `_meta/doctrine/finishing_queue.md:58-65`.

## 4. HIDE FROM DEMO

Hide these surfaces on the summit screen unless explicitly approved and rehearsed:

1. **Product cards / cart / Stripe checkout — HIDE.** Cards can be emitted by Commerce Steward when gates allow them, and checkout kill switch fails open on DB read failure. Evidence: `server.js:1370-1400`, `server.js:1416-1436`.
2. **Twilio SMS replies — HIDE.** One webhook persists phone/message PII to `outcome_events`; the newer inbound path still logs raw text. Evidence: `server.js:3156-3181`, `server.js:3200-3258`.
3. **Account signup / magic links — HIDE.** The demo requirement says not to depend on signup, Resend, live account creation, or external email delivery; this audit did not re-verify those flows.
4. **Live model improvisation on medication / clinical topics — HIDE.** Data enrichment can inject FDA/NIH/PubMed instructions and medication-safety language into the prompt; all such copy requires clinical approval. Evidence: `server.js:1760-1837`, `_meta/doctrine/felicia_standards_v1.md:72-79`.
5. **Therapy/recovery submodes — HIDE unless approved.** They append mental-health/addiction-specific instructions directly into the live prompt. Evidence: `server.js:666-684`, `server.js:1888-1891`.
6. **Cannabis/CannaIQ medication or withdrawal demonstrations — HIDE unless approved.** CannaIQ prompt contains medical/withdrawal and psychosis-escalation language. Evidence: `server.js:640-648`.
7. **Greeting cache as proof of determinism — HIDE for canonical proof.** It rotates by minute and is not stable minute-to-minute. Evidence: `server.js:2083-2117`.

## 5. REQUIRES DR. STOLER SIGNOFF

Every line below is either proposed demo input, expected output framing, or clinical/mental-health copy that may be spoken or shown. Do not use on stage until Dr. Stoler approves exact wording.

1. **Anxiety demo input:** `I feel anxious and my chest is tight. I do not want products. I just need help slowing down tonight.` — mental-health / body-symptom framing. **REQUIRES DR. STOLER SIGNOFF.**
2. **Anxiety expected opening:** `Your mind is running ahead of your body. Let's slow it down.` — already in code, still mental-health copy if highlighted on stage. Evidence: `server.js:2123-2125`. **REQUIRES DR. STOLER SIGNOFF.**
3. **Sleep demo input:** `I cannot sleep and I am exhausted. Give me one simple thing I can do tonight before bed.` — health guidance setup. **REQUIRES DR. STOLER SIGNOFF.**
4. **Sleep expected opening:** `Your system is wired right now. Not broken — just stuck.` — already in code, still health-adjacent copy if highlighted on stage. Evidence: `server.js:2121-2124`. **REQUIRES DR. STOLER SIGNOFF.**
5. **Crisis demo input:** `I want to die.` — crisis demonstration. **REQUIRES DR. STOLER SIGNOFF.**
6. **Crisis banner:** deterministic 988 / 911 / SAMHSA / Crisis Text Line language. Evidence: `tests/crisis_validator.test.js:99-107`; runtime injection at `server.js:2068-2071` and `server.js:2389-2392`. **REQUIRES DR. STOLER SIGNOFF before live public demonstration.**
7. **Any Lexapro / medication scenario:** no exact Lexapro demo copy is approved in this audit. Medication wording remains **REQUIRES DR. STOLER SIGNOFF** and should wait until Task 6 creates a deterministic governed proof path. Evidence: `_meta/doctrine/finishing_queue.md:67-74`, `_meta/doctrine/felicia_standards_v1.md:72-79`.

## 6. READY-BY-MONDAY PUNCH LIST

This list maps to the six existing finishing-queue tasks so work is not duplicated.

### P0 — must fix or control before demo

- [ ] **Task 1 — Crisis false-positive repair.** Tighten `going to die` so device contexts do not trigger while true ideation still does; run `node tests/crisis_validator.test.js`. Evidence: `_meta/doctrine/finishing_queue.md:22-30`, `tests/crisis_validator.test.js:63-85`.
- [ ] **Tasks 2–4 — Prompt compliance stays repaired and submodes are either approved or hidden.** Exact forbidden strings are absent in current checkout, but unaudited therapy/recovery submodes should not be shown. Evidence: `_meta/doctrine/finishing_queue.md:31-57`, `server.js:59-122`, `server.js:666-684`, `server.js:1888-1891`.
- [ ] **Task 6 — Deterministic Lexapro/governance proof.** Either create/verify an approved fixed-stub live proof path that emits real Signal → Decision → Governed Response → Trust Packet, or do not claim deterministic clinical demo. Evidence: `_meta/doctrine/finishing_queue.md:67-74`, `server.js:3702-3757`.
- [ ] **Dr. Stoler exact-script approval.** Approve the exact anxiety, sleep, crisis, and any medication wording before travel. Evidence: `_meta/doctrine/felicia_standards_v1.md:72-79`.
- [ ] **Render deployment confirmation.** Verify deployed SHA or capture production proof; otherwise say “repo-verified, deployment unknown.”

### P1 — nice to have if P0 closes

- [ ] **Task 5 — SMS/Twilio PII repair.** Do not show SMS until this is fixed; one webhook stores phone/body/account fields. Evidence: `_meta/doctrine/finishing_queue.md:58-65`, `server.js:3200-3258`.
- [ ] Add a stage-safe way to display the existing Trust Packet v0 diagnostic output without exposing raw user text, PII, or DB persistence. Evidence: `server.js:351-358`, `server.js:3702-3757`.
- [ ] Decide whether checkout kill switch should fail closed during demos; otherwise keep commerce surfaces off-screen. Evidence: `server.js:1416-1436`.

### P2 — after trip

- [ ] Full prompt/submode clinical copy audit across all modes, not just the summit script. Evidence: `server.js:360-684`.
- [ ] Resolve stale comments in canonical crisis patterns claiming “PROPOSED” / “NOT wired,” because runtime now imports them. Evidence: `core/safety/canonical_crisis_patterns.js:1-14`, `core/safety/crisis_validator.js:20-37`, `server.js:12-16`.
- [ ] Do not wire dormant `core/agents/*` / `core/schemas/*`, and do not persist Trust Packet v1.1 without Threesome approval. Evidence: `AGENTS.md:19-26`, `AGENTS.md:29-37`.

## 7. Checks run during this audit

- `rg -n "THE SALE COMES FROM THE SOUL|127 years of healing lineage|You are a therapist" server.js` → no matches.
- `rg -n "Maya Angelou|Mahalia Jackson|Pema Chodron|Rachel Naomi Remen|Cicely Saunders|Mother Teresa|Leah Chase|Marion Nestle|Thich Nhat Hanh|Thomas Merton|Dalai Lama|Martin Luther King|Louis Armstrong|Barack Obama|Hippocrates" server.js` → matches at `server.js:64` and `server.js:70`.
- `node tests/crisis_validator.test.js` → FAIL, one false positive on “My phone is going to die soon, need to find a charger.”
- `BLEU_TEST_TRUST_PACKET_V0=1 node server.js` → PASS; creates/logs SignalObject.v0, DecisionObject.v0, and TrustPacket.v0 for `/api/chat` and `/api/chat/stream` with no raw message, no session/user PII, and no DB write.
