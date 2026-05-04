# bleu.live — Clinical Audit Against the Foundational Brief

**Audited file:** `/workspaces/bleu-system/index.html` (committed at HEAD `4c92919`, 14,602 lines, 1,284,450 bytes — identical SHA to `index.v3-backup.html` on disk)
**Auditor:** Claude (Opus 4.7)
**Date:** 2026-05-04
**Rubric:** The locked Foundational Brief — the Promise, the 13 Principles (Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM — Chief Clinical Officer), and the Operating Doctrine.
**Scope:** Read-only audit. No code was modified. AUDIT.md is the only output.

> **Note on the file state:** `index.html` is currently deleted in the working tree (`git status: D index.html`). The audit was performed against the committed version at HEAD, which is byte-identical to `index.v3-backup.html` on disk. This deletion is itself worth flagging — see Bucket A item #1.

---

## EXECUTIVE SUMMARY

| Metric | Count |
|---|---|
| Total surfaces audited | 14 primary + 6 ancillary = **20** |
| Total principle violations found | **127** discrete findings across 13 principles |
| **Bucket A — Bleeding now** | **18** (active user harm or trust damage) |
| **Bucket B — Drift fixes** | **47** (copy / contrast / labels) |
| **Bucket C — Structural** | **22** (flow / IA / page architecture rewrites) |

### The 5 most urgent fixes (by user harm)

1. **Restore `index.html` to the working tree.** It is currently deleted. The site is being served from a stale branch state. (Bucket A · 5 min · low risk)
2. **Strip the affiliate CPA dollar amounts that leak into user UI.** Lines like *"$50–150 CPA"*, *"$100–200 CPA"*, *"$50–200 CPA · Finance bridge"*, *"Agent 10 gate required"* are visible to users on Therapy and Recovery panels. This is internal monetisation language — it tells the user *"you are a unit of revenue."* It violates Principles 5, 6, 8, 10, and 11 simultaneously. (Bucket A · 30 min · low risk)
3. **Fix Dr. Felicia's title across the file.** The brief locks her title as **Chief Clinical Officer.** The file uses *"Co-Founder"* (line 1817), *"Clinical Director"* (lines 1956, 2163), *"Clinical Director, BLEU.live"* (line 2163), and *"Co-Founder"* in the credit byline. None match the locked title. (Bucket A · 15 min · low risk)
4. **Reorder Therapy panel: free options ABOVE paid affiliates.** Currently *"ONLINE THERAPY — START TODAY"* (BetterHelp $60/wk, Talkspace $69/wk) appears before *"CAN'T AFFORD THERAPY? HERE'S WHAT'S FREE."* This violates Principle 4 (free options first) and Principle 6 (help and selling). (Bucket A · 1 hr · low risk)
5. **Tone down financial-pitch language on the Home tab.** The user lands on *"$830K value created per user"*, *"17yr evidence gap closed"*, *"$2.1M three-generation social value"*, *"Patent Pending"*. This is investor-deck copy in front of a person looking for help. Violates Principle 1 (plain language), Principle 8 (one voice), Principle 10 (not about us). (Bucket A · half-day · low risk on copy, medium on layout)

### The 5 highest-leverage fixes (small effort, big standard improvement)

1. **Raise minimum on-screen font from 9–11px to 14px.** The file contains 483 instances of `font-size:10px`, 453 of `11px`, 390 of `9px`, 19 of `8px`, and 3 of `7px`. Body is 19px (good) but every label, badge, caption, footer is sub-readable. A simple search-and-replace on `font-size:9px → 13px`, `10px → 13px`, `11px → 14px` lifts the whole site. (Bucket B · 1 hr · low risk)
2. **Replace clinical jargon strings with plain English in user-facing copy.** *"NF-κB suppression"*, *"8-OHdG reduction"*, *"glymphatic clearance"*, *"P-glycoprotein and BCRP transporter inhibition"*, *"FAAH polymorphism"*, *"CYP450 enzyme pathways"* — all appear on user-facing surfaces, not behind a "for clinicians" toggle. Felicia's standard: *"If a tired person at 11pm can't understand it, it doesn't ship."* (Bucket B · half-day · low risk)
3. **Remove the `(CPA / Commission / Agent gate)` footer line from each affiliate card.** Six instances. Replace with *"BLEU may earn a small commission. Trust scores are unaffected."* (Bucket B · 15 min · low risk)
4. **Delete the second auth blob.** Two parallel auth screens exist — one in Passport (`#auth-screen`, lines 5165–5203) and a Fullscript phone-capture modal (lines 14146–14254). Both are functional, but the phone-capture modal asks for `tel:` *before* the user has used the protocol. Move it to the post-purchase confirmation only. (Bucket B · 30 min · low risk)
5. **Cap the typewriter / cycling text scripts.** Almost every panel has a "typewriter" script cycling 5–6 italic lines. They steal attention, fight the chat input, and burn battery on mobile. Replace each with one well-chosen static sentence. (Bucket B · 1 hr · low risk)

### What is working WELL — protect this during fixes

- **Crisis lines are exhaustive and present.** All six required (988, Crisis Text 741741, SAMHSA 1-800-662-4357, Trevor 1-866-488-7386, Never Use Alone 1-800-484-3731, 911) appear on Therapy, Recovery, and Community. Recovery panel even includes a Naloxone overdose protocol at line 6073. **Do not touch.**
- **The "Body / Mind / Money / Spirit" four-card router** at the top of Home (lines 1414–1435) is the single best execution of the brief on the entire site. Plain language, four equal options, no upsell, immediate routing to Alvai. **Build more pages this way.**
- **The Alvai system prompt at line 7413** explicitly enforces "Commerce follows care," "No bullets or headers," "Walk with pain first," tier-A/B/C/D/E context hierarchy with crisis-suppression of commerce. The voice doctrine is right at the model layer — the UI just needs to match it.
- **The "Why Alvai Speaks This Way" doc on the Learn tab** (lines 4152–4191) is a gem. It explains the 2am-person principle, the screener-vs-receiver model, the covenant. **Surface this — don't bury it inside Learn.**
- **The "Explore without an account" escape hatch** in Passport auth (line 5200) honours Principle 5 perfectly. Account asked for with a stated reason and a clear "no thanks" path.
- **The Pioneer Passport pricing card** (lines 5236–5260) cleanly shows three tiers (Explorer free / Pioneer 12-month free / PRO $9.99) with clear trade-offs. No dark patterns.
- **The Crisis line on Recovery hero** (line 5879) — *"If you are in crisis right now → 988 Suicide + Crisis Lifeline"* — is correctly placed *above* every other recovery option. This is Principle 4 done right.
- **The BLEU.LIVE locked palette CSS variables** (lines 272–296) — `--bleu-cream-elevated`, `--bleu-purple`, `--bleu-gold` — are correctly defined and aliased. Don't break this.
- **The Fullscript phone-capture modal has a Skip button** (line 14233) and clear reason ("One text in 28 days so you don't run out mid-protocol"). The mechanism honours Principle 5 even if the surface is over-eager.
- **The 14 nav tab IDs match the brief** (`home, passport, dashboard, directory, vessel, map, learn, community, therapy, recovery, finance, ecsiq, sleep, spirit` — confirmed at lines 1347–1360). Display labels differ ("Pulse"/"Find Care"/"Supply"/"City") but IDs are intact, so all routing/protect logic works.
- **All four Stripe live price IDs are present** (lines 13071–13074): Sleep `price_1TEKQmK4...` ($49), Stress `price_1TEKS6K4...` ($45), Longevity `price_1TEKSWK4...` ($69), Gut `price_1TEKSsK4...` ($55). Plus Pro and Pioneer. **Do not touch.**
- **`bleulive20-20` Amazon affiliate tag** appears 53 times. Intact.
- **City subdomain detection for 32 cities** (lines 153–189) is intact and tied to typewriter/title overrides.
- **`@keyframes goldPulse` and `.gold-pulse` helper class** present at lines 325+ per the most recent commit.
- **`_vc / _vp / _vShow` Vessel cart with GOLD/SILVER/BRONZE rankings** present at lines 7–145 with `bleulive20-20` correctly wired into Amazon URLs.

---

## SURFACE-BY-SURFACE AUDIT

The file map (from grep on `<div class="panel"`):

| # | Surface | Panel ID | Lines | Status |
|---|---|---|---|---|
| 1 | Home | `p-home` | 1371–2024 | Active default |
| 2 | Alvai | `p-alvai` | 2026–2229 | Ancillary |
| 3 | Dashboard ("Pulse") | `p-dashboard` | 2231–2410 | In nav |
| 4 | Directory ("Find Care") | `p-directory` | 2412–2553 | In nav |
| 5 | Vessel ("Supply") | `p-vessel` | 2555–3348 | In nav |
| 6 | Map ("City") | `p-map` | 3349–3913 | In nav |
| 7 | Protocols | `p-protocols` | 3914–4096 | Sub-mode |
| 8 | Learn | `p-learn` | 4097–4716 | In nav |
| 9 | Community | `p-community` | 4717–5090 | In nav |
| 10 | Passport | `p-passport` | 5091–5441 | In nav |
| 11 | Therapy | `p-therapy` | 5442–5680 | In nav |
| 12 | Finance | `p-finance` | 5681–5826 | In nav |
| 13 | Recovery | `p-recovery` | 5827–6082 | In nav |
| 14 | ECSIQ | `p-ecsiq` | 6083–6683 | In nav |
| 15 | Sleep | `p-sleep` | 6684–6891 | In nav |
| 16 | Terms | `p-terms` | 6892–6911 | Legal |
| 17 | Privacy | `p-privacy` | 6912–6934 | Legal |
| 18 | Enterprise | `p-enterprise` | 10979–12636 | Sub-mode |
| 19 | Why BLEU | `p-why` | 12637–12811 | In nav (extra) |
| 20 | Spirit | `p-spirit` | 12812–end | In nav |

The 14 brief-required tabs are all present. **Note:** "Why BLEU" (`p-why`) is a 15th tab in the actual nav (line 1361) — it's allowed but not in the brief's protect list.

---

### 1. HOME (`p-home`, lines 1371–2024)

**Purpose.** First impression, route the user into Alvai, surface the four life domains (Body / Mind / Money / Spirit), and give a quick read of the platform's stats and trust signals.

**What it sells.** Account creation (via Pioneer pricing card on Passport indirectly), affiliate links to BetterHelp / Thorne / Amazon / Charlotte's Web / Oura / GoodRx / YNAB / ClassPass (line 1841–1849), the *Enterprise* / *city.bleu.live* deal (line 1736), and indirectly every supplement protocol via the routing cards.

**Key copy quotes (verbatim).**
- *"Everything you need to heal — in one place."* (line 1403) ✓ on-brief
- *"Practitioners. Guidance. Safety. Recovery. Finance. Cannabis. Community. Always free for Citizens. The infrastructure wellness was always missing."* (lines 1409–1411) ✓
- *"This is not a wellness app. It is a time machine."* (line 1864) ⚠ marketing voice
- *"Everyone else is selling the ambulance at the bottom of the cliff. BLEU.live sells the fence at the top — and the fence adds 8 years to your life."* (line 1954) — attributed to "Dr. Felicia Stoler, DCN · Clinical Director, BLEU.live" ⚠ wrong title
- *"$830K Value created per user — At $100K/QALY — health economics standard"* (lines 1936–1938) ⚠ investor copy
- *"127-year healing lineage · New Orleans · Patent Pending · NPI Verified · Nutrition & lifestyle oversight: Dr. Felicia Stoler DCN MS RDN FACSM"* (line 1853–1856) — title omits FAND, Dipl. ACLM and "Chief Clinical Officer"

**Visual notes.** Body font is `clamp(13px,1.8vw,15px)` for hero sub. Stat tiles use `font-size:9px` letter-spacing labels — sub-readable (lines 1440, 1448, 1452). The "AI MODES" / "PRACTITIONERS" / "INTERACTIONS" / "ALWAYS FREE" badges are 9px on dark. Cards stack 2-column on mobile but the page has *eleven* major sections including a "Time Machine Thesis," "Biological Age Equation," "Evolutionary Mismatch," "Vagus Nerve thread," and "Foundation Line" — far too many.

**Principle grades.**
- **P1 — Plain language: DRIFT.** Mostly plain in the four-card router and concern-cards, but "$830K QALY value", "NF-κB suppression", "Antonovsky's salutogenic triad", "transgenerational epigenetic inheritance", "47% less DNA oxidation · Glymphatic clearance" appear above the fold of the lower thirds.
- **P2 — One step at a time: FAIL.** Eleven sections on one page. The four-card router is good; everything below it is overwhelming.
- **P3 — Behavior first: DRIFT.** The router asks Body/Mind/Money/Spirit (good), but the "Build My Stack" and "Trusted Partners" affiliate strip appear before any breath/movement/connection guidance.
- **P4 — Respect people's money: DRIFT.** Affiliate strip is shown but no free-first framing. "Always free for Citizens" appears in the hero, which is good.
- **P5 — Be upfront about trust: PASS.** No data capture on Home itself; account is offered later.
- **P6 — Help vs selling: DRIFT.** Affiliate strip and Enterprise card sit alongside "I cant sleep" / "I need a therapist" cards — same visual treatment, blurred lines.
- **P7 — Make it easy to read: FAIL.** 9–11px labels, dense gradients, three concurrent typewriter scripts on this panel alone.
- **P8 — One voice: FAIL.** "Time machine" / "$830K value" / "Vagus nerve" / "Jazz Bird NOLA" / "Patent Pending" / "Dr. Felicia ranked" — at least four distinct voices.
- **P9 — Science you can use: DRIFT.** Mechanism callouts (telomerase, NF-κB, 8-OHdG) are not translated to action.
- **P10 — Not about us: FAIL.** "$830K per user," "17yr gap closed," "127-year healing lineage," "Patent Pending," "Jensen Huang called the new computer" — talking to peers, investors, and the press.
- **P11 — Integrity: PASS.** No undisclosed sponsored content on Home.
- **P12 — Practice what we preach: DRIFT.** Animated orbs, breathe-pulse, three concurrent scripts — performative, not restful.
- **P13 — Progress not perfection: PASS.** Returning Citizen card (line 1531) honours the streak/sessions language well.

---

### 2. PASSPORT (`p-passport`, lines 5091–5441)

**Purpose.** Account identity, account creation, citizenship tier (Explorer / Pioneer / PRO), wellness profile, focus chips, life dimensions, supplement stack, health data, sobriety counter, NOLA tourism card, settings.

**What it sells.** Pioneer founding tier (12 months free → $9.99/mo via Stripe), Pro tier ($9.99/mo), Fullscript dispensary ("Order Supplements →"), all data uploads (Apple Health / Oura / Whoop / Garmin), and indirectly every other tab.

**Key copy quotes.**
- *"Your passport is waiting. Once you check in, score, or save anything, it lives here. A record of your becoming. Nothing is saved without your knowing."* (lines 5094–5095) ✓ exemplary on Principle 5
- *"Your wellness journey, remembered and enhanced."* (line 5170)
- *"Pioneers get the full platform free for 12 months. The platform earns from the ecosystem. Never from the people it serves."* (line 5150) ✓
- *"FOUNDING · FREE 12 MONTHS"* — *"First 12 months · No exceptions · Then $9.99/mo"* (lines 5246, 5249) ✓ honest pricing
- *"Cancel anytime · Secure via Stripe · No hidden fees"* (line 5262)

**Visual notes.** Rich profile screen with score ring (good). Then 8 stat boxes, 8 quick-action chips, 6+ life dimension tiles, 8 focus chips, affiliate strip, wellness cart, saved journeys, manual health entry form (8 input fields), file import, NOLA tourism card, session history, settings — **on a single scroll.**

**Principle grades.**
- **P1: PASS** for the empty-state copy. **DRIFT** for "epigenetic inheritance" and "FHIR R4" mentions in user UI.
- **P2: FAIL.** This is the worst Principle 2 violation in the file. One screen, ~30 distinct interactive zones.
- **P3: DRIFT.** Supplement stack and "Order Supplements →" are above behavioural focus chips.
- **P4: PASS.** Three-tier pricing card honestly shows free option first.
- **P5: PASS.** Best-in-file. Empty state, "Explore without an account," signed reason for data, manual-only health entry, "stored locally, never transmitted" callout.
- **P6: DRIFT.** Affiliate strip ("PRACTITIONER-GRADE SUPPLEMENTS · Order Supplements →") on the same canvas as "My Wellness Stack" — feels like an in-app upsell.
- **P7: FAIL.** 9–11px labels everywhere; FHIR / Apple Health labels are 10px.
- **P8: DRIFT.** "Care Twin" / "Pioneer Citizen" / "Wellness Tourism" / "FHIR R4 export" — at least three voices.
- **P9: PASS.** Each life-dimension tile prompts a specific Alvai conversation.
- **P10: PASS** mostly. The Pioneer copy frames the user as the foundation, not BLEU.
- **P11: PASS.** Clear sign-out, data-clear, conversation-delete buttons (lines 5426–5429).
- **P12: DRIFT.** Page is exhausting to read; not a model of restful design.
- **P13: PASS.** Streak, sessions, "Every day matters" copy throughout.

---

### 3. DASHBOARD / "Pulse" (`p-dashboard`, lines 2231–2410)

**Purpose.** Single-number BHI (BLEU Health Index), live environmental data (UV, humidity, temp, wind by zip), 7-system metabolic dashboard, quick-action grid, chat.

**What it sells.** Implicit: the platform's data depth. Quick-jump to Vessel ("Get Score →") which is commerce. Cellular Health Score routes to Vessel.

**Key copy quotes.**
- *"Your pulse, right now."* (line 2232) ✓
- *"Apple built retention with one ring. Credit scores shaped behaviour with one number. The BHI is your single metric — across all seven molecular systems. Watch it rise."* (line 2286) ⚠ comparing to Apple/credit-scores is "about us"
- *"BLEU is the first system to see the whole you — and measure whether you are becoming more complex, or less."* (line 2262) ⚠ marketing
- *"Ary Goldberger at Harvard proved that health is not stability. It is complexity."* (line 2241) ⚠ jargon for the 11pm-tired-person test

**Visual notes.** BHI ring is 68px Georgia serif (readable). Tier labels (`0–30 Foundations`...`86–100 Optimal`) at 9px (unreadable). Live environment widget at 9px labels. Quick-action grid mixes 18px emoji with 11px labels.

**Principle grades.**
- **P1: DRIFT.** "Cellular Health Score," "Allostatic load," "Glymphatic clearance" all here.
- **P2: FAIL.** Six major widgets on one screen.
- **P3: DRIFT.** "Quick action: A protocol is not a checklist. It is a molecular prescription" (line 2329) sells protocol/product before behavior.
- **P4: NA** (no money asked here).
- **P5: PASS.** Zip code is requested with clear reason.
- **P6: PASS.**
- **P7: FAIL.** 9px tier labels.
- **P8: DRIFT.** "Pulse" / "BHI" / "Cellular Health Score" / "Connected Tabs" / "Wellness · Sleep · Missions · Day Streak" — naming inconsistency.
- **P9: DRIFT.** Mechanisms (8-OHdG, telomerase, NF-κB, vagal tone) are listed without action steps.
- **P10: FAIL.** Apple-comparison + credit-score-comparison is talking to product reviewers, not users.
- **P11: PASS.**
- **P12: DRIFT.**
- **P13: PASS.** "Watch it rise" / "trajectory" framing is correct.

---

### 4. DIRECTORY / "Find Care" (`p-directory`, lines 2412–2553)

**Purpose.** Search 855K NPI-verified practitioners. Quick-tap concern chips that auto-search.

**What it sells.** Free service. No direct commerce. Cross-link to Vessel and Alvai. (Indirectly: future booking commission.)

**Key copy quotes.**
- *"Find Exactly Who You Need"* (line 2414) ✓
- *"You don't need to know the clinical term. Just start where it hurts."* (line 2509) ✓ exemplary
- *"485,476 entries · 127+ specialties · 50 states · NPI checked nightly via CMS.gov"* (line 2504) ✓
- *"Real licensed providers · NPI verified · Data from CMS.gov federal registry"* (line 2532) ✓
- *"Nutrition & lifestyle oversight: Dr. Felicia Stoler, DCN, MS, RDN, FACSM, Dipl ACLM"* (line 2505) — missing FAND and "Chief Clinical Officer" title

**Number inconsistency:** Hero says **485K+** verified (line 2443). Home tab says **800K+** / **855K+**. Alvai panel says **855,247**. Pick one.

**Principle grades.**
- **P1: PASS** for the chip language ("My Anxiety Won't Stop", "Exhaustion Nobody Can Explain", "My Back Is Killing Me"). **PASS** for "Just start where it hurts."
- **P2: PASS.** Cleanest panel in the file.
- **P3: PASS.** Routes to clinicians (behavior/intervention) before products.
- **P4: PASS.** "Many offer free consultations."
- **P5: PASS.**
- **P6: PASS.** No commercial layer.
- **P7: DRIFT.** Trust score row at 12px, search subheaders at 10–11px.
- **P8: PASS.** Coherent voice throughout.
- **P9: PASS.**
- **P10: PASS.**
- **P11: PASS.** Explicit *"Trust scores are NEVER affected by affiliate status or payment"* (line 2542).
- **P12: PASS.**
- **P13: PASS.**

This is the **second-best surface** in the file. Build others to this standard.

---

### 5. VESSEL / "Supply" (`p-vessel`, lines 2555–3348)

**Purpose.** Clinical product marketplace. Supplements, groceries, therapy services, pharmacy, events.

**What it sells.** **Everything.** Amazon supplements via `bleulive20-20`, Fullscript clinical protocols (10 named: Anti-Inflammation, Anxiety Relief, Daily Foundation, Energy & Focus, Immune Support, Longevity, Metabolic Reset, Mood, Perimenopause, Sleep Restoration), Walmart+ groceries, Talkspace, BetterHelp, BLEU Clinical Dispensary.

**Key copy quotes.**
- *"Hello 👋 — Your clinical marketplace — supplements, groceries, therapy, services. Alvai checks your medications before every recommendation."* (lines 2709–2710) ✓ honest
- *"BLEU Supply"* — sticky header (line 2681). The nav says "Supply" but the URL/ID is `vessel`. ⚠ naming drift
- *"+ Add to Stack"* button — green CTA on every product (line 2778)
- *"Personalized for you."* / *"Once you tell Alvai what you are working on — body, mind, money, or spirit — your recommendations land here."* (lines 2735–2736) ✓
- *"Curated bundles built around evidence — Sleep Reset, Stress, Longevity Core, Gut Reset. Each one assembled by Dr. Felicia Stoler."* (line 2745)

**Visual notes.** Amazon-style sticky header with cart, account, search. Star ratings, "Prime FREE delivery" badges, "$17 /240 tabs — 4 month supply" pricing — well executed and on-brief for honest cost. But the page is dense: 8 supplement cards, 10 Fullscript protocols, 4 grocery cards, 3 therapy service cards, plus filter tabs. Account-stub *"Hello, sign in / Account"* (line 2697) hints at account capture without explanation.

**Principle grades.**
- **P1: PASS** for product names and outcomes. **DRIFT** for "Albion TRAACS chelated", "GABA-A receptors", "CYP2C19 substrate" in product whys.
- **P2: FAIL.** Browse / For You / Protocols sub-tabs PLUS category tabs PLUS Alvai bar PLUS sticky header — multiple navigations on one screen.
- **P3: FAIL.** Vessel IS commerce. Behavior-first routing should happen *before* the user lands here.
- **P4: PASS.** Prices, supply duration, Walmart+ groceries shown — honest cost.
- **P5: DRIFT.** "Hello, sign in / Account" stub doesn't explain why.
- **P6: DRIFT.** "BLEU Clinical Dispensary" with "15% discount" sits next to "Talkspace $69/wk" — mixed help/sell.
- **P7: FAIL.** 9px brand labels, 11px why-text, 10px add-to-stack buttons.
- **P8: PASS** within the panel. The Amazon-style is consistent.
- **P9: DRIFT.** Whys are scientific but jargony.
- **P10: PASS.**
- **P11: DRIFT.** Affiliate disclosure ("BLEU earns referral commission on purchases") is present but small.
- **P12: PASS.**
- **P13: PASS.**

---

### 6. MAP / "City" (`p-map`, lines 3349–3913)

**Purpose.** Geographic intelligence. 12 NOLA neighborhoods scored, 32 crises matrix, practitioner search, city intelligence widgets.

**What it sells.** Enterprise / city deployment ("THE 222-CITY MODEL · $1.8M annual deployment cost · $42M annual benefit · 23:1 ROI" at lines 3722–3729). This is a **B2B sales page inside a wellness app.**

**Key copy quotes.**
- *"New Orleans. Every neighborhood. Every practitioner."* (line 3459) ✓
- *"New Orleans scores 40 out of 100. Louisiana is ranked 50th nationally."* (line 3467) — heavy-handed
- *"$1.8M Annual deployment cost / $42M Annual documented benefit / 23:1 Return on investment"* — selling cities, not helping a person
- *"Hotel Monteleone Proof"* button (line 3733) — case-study selling

**Visual notes.** 4-column stat grid, live indicator pulses, neighborhood cards with score bars. Many 9–10px labels.

**Principle grades.**
- **P1: DRIFT.** "Allostatic load," "AQI 47," "ROI 23:1" — not for the tired person.
- **P2: FAIL.** 4 view tabs (12 Neighborhoods / 32 Crises Matrix / Practitioners / City Intelligence) + ROI deck at the bottom.
- **P3: FAIL.** Sells city deployment.
- **P4: NA.**
- **P5: PASS.**
- **P6: FAIL.** B2B sales mixed with consumer health.
- **P7: FAIL.** 9–10px labels, dense intel grids.
- **P8: FAIL.** Two voices: consumer help + civic-investor pitch.
- **P9: DRIFT.**
- **P10: FAIL.** "23:1 ROI / city pays nothing / documented benefit" — talking to mayors, not citizens.
- **P11: PASS.**
- **P12: DRIFT.**
- **P13: PASS.**

**Recommendation:** Move the 222-city / Hotel Monteleone / ROI material to `p-enterprise`. Map should be: my city → my neighborhood → my closest practitioner → my next step.

---

### 7. LEARN (`p-learn`, lines 4097–4716)

**Purpose.** Video and research library. YouTube embeds, channels, music, deep dives, recovery + mental health, 16-crisis research index.

**What it sells.** Nothing directly. (Some affiliate music apps deeper.) Routes to Alvai via "ASK THE RESEARCH" chat.

**Key copy quotes.**
- *"The medicine of 2043 exists in a journal right now."* (line 4149) ✓ on-voice
- *"Why Alvai Speaks This Way"* — internal design standard, expandable doc (lines 4152–4191) ✓ **gem**
- *"50,000 studies indexed. 465 reviewed to Dr. Felicia Stoler's clinical standard."* (line 4202) ✓
- *"A protocol is not a checklist. It is a molecular prescription."* — voice cross-pollination from Dashboard, fine.

**Visual notes.** Video grid, channel chips, research list. 9–10px metadata.

**Principle grades.**
- **P1: PASS** mostly.
- **P2: DRIFT.** Two parallel video systems (curated CURATED_VIDEOS at line 4520 + V1/V2/V3 grids).
- **P3: PASS.**
- **P4: PASS.** Free YouTube content first.
- **P5: PASS.**
- **P6: PASS.**
- **P7: DRIFT.**
- **P8: PASS.**
- **P9: PASS.** "Learning something tonight that changes what you do tomorrow."
- **P10: PASS.**
- **P11: PASS.**
- **P12: PASS.**
- **P13: PASS.**

The "Why Alvai Speaks This Way" doc is the platform's voice constitution. **Surface it on Home as well.**

---

### 8. COMMUNITY (`p-community`, lines 4717–5090)

**Purpose.** Connection as medicine. Recovery community finders (AA / NA / SMART / Refuge / In The Rooms / SAMHSA), mental health groups (NAMI / DBSA / 7 Cups / Reddit), fitness (Strava / parkrun / ClassPass / Meetups), grief & specialized (GriefShare / Cancer Support / Alzheimer's / DV Hotline), online platforms, NOLA-specific, crisis lines.

**What it sells.** ClassPass affiliate ("$19/mo"), Spotify / Calm / Headspace embeds. Most links are FREE community resources.

**Key copy quotes.**
- *"Loneliness kills 871,000 people per year. Connection reverses every gene."* (line 4730) ✓ landing punch
- *"Steven Cole at UCLA spent 17 years proving... loneliness rewrites 102 of your genes — a genomic response called the CTRA."* (line 4760) ⚠ jargon
- *"Connection is medicine. You remembered that."* (mirror copy) ✓
- *"$2.1M three-generation social value... underpriced by a factor of 10,000"* (lines 5063, 5070) ⚠ investor language

**Visual notes.** Lots of platform cards, ripple-effect diagram, embedded Spotify players (3 of them).

**Principle grades.**
- **P1: DRIFT.** "CTRA," "genomic response," "telomerase activation" — clinical for an 11pm tired person.
- **P2: FAIL.** Many sections, many platforms.
- **P3: PASS.** Connection-first.
- **P4: PASS.** Free options dominant; ClassPass is clearly priced.
- **P5: PASS.**
- **P6: DRIFT.** ClassPass affiliate next to crisis hotlines — different gravity, same visual weight.
- **P7: DRIFT.** 9–11px secondary text.
- **P8: DRIFT.** Genomic-clinical voice + investor "$2.1M" voice.
- **P9: DRIFT.**
- **P10: DRIFT.** "$2.1M three-gen value" / "underpriced by 10,000x" — investor talk.
- **P11: PASS.** Crisis lines clearly free, 24/7.
- **P12: DRIFT.**
- **P13: PASS.**

---

### 9. THERAPY (`p-therapy`, lines 5442–5680)

**Purpose.** 12 therapy modes (Talk / CBT / DBT / Somatic / Motivational / Journaling / Crisis / Couples / Grief / Trauma / Eating). Mode selector, quick chips, mood check-in, find-a-therapist search, online therapy affiliates, free options.

**What it sells.** **Heavy affiliate.** BetterHelp, Talkspace (each at $60–$69/wk), Brightside ($50–150 CPA), Done ADHD ($100–200 CPA), Cerebral ($65–100 CPA). The CPA dollar amounts **are visible to users** (lines 5542, 5547, 5552, 5557).

**Key copy quotes.**
- *"No sessions yet. When you talk with Alvai, the conversation is yours to keep — or to delete. Nothing is saved without your knowing."* (lines 5445–5446) ✓ best Principle 5 example in file
- *"Alvai knows you may be arriving at a difficult moment. This system was designed to guide — not to exploit that. Whatever you bring here, it will be met with care first."* (line 5501) ✓ exemplary
- *"Therapy changes your brain. Not as a metaphor. Eight weeks of CBT produces measurable changes in the inflammatory pathways that drive heart disease, cancer, and early aging."* (line 5478) — long, but accurate
- *"$50–150 CPA"* visible at line 5542, *"$100–200 CPA"* at 5547, *"$65–100 CPA"* at 5552, *"Commission · HSA-eligible"* at 5557 — **internal economics in user UI**
- *"💛 Affiliate -- funds this free platform"* (lines 5634, 5654) ✓ disclosure correct

**Visual notes.** Mode selector buttons, quick-row chips, then a "CLINICAL TELEHEALTH -- WHEN YOU'RE READY FOR HUMAN SUPPORT" affiliate block. Free options box ("CAN'T AFFORD THERAPY? HERE'S WHAT'S FREE") appears *after* the paid affiliates — reverse of Principle 4.

**Principle grades.**
- **P1: PASS** in user-facing copy. **FAIL** at "NF-κB suppression" (line 5462), "$32K Prevented cost" (line 5485).
- **P2: FAIL.** 11 mode buttons + 6 quick chips + clinical affiliate grid + mood check + find-a-therapist + paid affiliates + free options + crisis disclaimer = 8 sections.
- **P3: PASS.** Therapy IS behavior.
- **P4: FAIL.** Free options come AFTER paid affiliates.
- **P5: PASS** for empty-state copy.
- **P6: FAIL.** CPA pricing visible to users — that is the literal opposite of "help and selling are not the same thing."
- **P7: DRIFT.**
- **P8: DRIFT.** Empty-state voice (warm) ↔ stat-grid voice ($32K, 1 in 5) ↔ affiliate voice (CPA pricing) ↔ disclaimer voice (clinical).
- **P9: DRIFT.**
- **P10: DRIFT.**
- **P11: FAIL.** CPA leakage. Also lines like *"These are surfaced only when clinical signals indicate genuine need and action-stage readiness. Never for contemplation-stage users."* (line 5537) — internal ops language showing through.
- **P12: PASS** in voice intent.
- **P13: PASS.**

---

### 10. RECOVERY (`p-recovery`, lines 5827–6082)

**Purpose.** Substance use recovery. 7 modes (Early Sobriety / Relapse Prevention / Harm Reduction / 12-Step / Family / MAT / Milestones). Sobriety counter, treatment finder (live SAMHSA API), MAT medication GoodRx links, overdose protocol.

**What it sells.** Found ($50–200 CPA), Calm, Talkspace, Ethos Life Insurance ($50–200 CPA), GoodRx for Suboxone/Naltrexone/Naloxone.

**Key copy quotes.**
- *"You survived to get here. That is not nothing. That is everything."* (line 5841) ✓ on-voice
- *"Whether you are 3 hours sober or 3 years sober — you are in the right place."* (line 5837) ✓
- *"Built by someone who survived 9 overdoses and overcame 31 felonies. Who treated 30,000 patients."* (line 5857) — powerful but heavy on the founder
- *"If you are in crisis right now → 988 Suicide + Crisis Lifeline · Call or text 988 · Free · 24/7 · Confidential"* (line 5879) ✓ correct placement
- *"$50–200 CPA · Agent 10 gate required"* (line 5889), *"$50–200 CPA · Finance bridge"* (line 5978) — **CPA leakage**
- *"Dead people can't recover."* (line 5991) ✓ Harm Reduction card — bracing and correct
- *"🔥 If you or someone near you is experiencing an overdose: Call 911 immediately. Administer naloxone (Narcan) if available. 988 Lifeline · SAMHSA 1-800-662-4357 · Never Use Alone 1-800-484-3731 · Crisis Text Line text HOME to 741741"* (line 6073) ✓ all six crisis lines, correct

**Visual notes.** Crisis box at hero (correct). Sobriety counter is a real interactive feature with day/hours/savings/milestone tiles. Treatment locator hits SAMHSA's `findtreatment.gov` API live.

**Principle grades.**
- **P1: PASS** mostly. **DRIFT** for "Allostatic load reduction · Nervous system reset" (Home cross-link).
- **P2: DRIFT.** Many sections but each is purposeful.
- **P3: PASS.**
- **P4: PASS.** Free meetings, GoodRx savings shown first.
- **P5: PASS.**
- **P6: FAIL.** Ethos Life Insurance affiliate ($19/mo) for "users with dependents whose health trajectory affects life expectancy" (line 5977) — selling life insurance to people in early recovery is a serious P6 violation. CPA leakage repeats here.
- **P7: DRIFT.**
- **P8: DRIFT.** Recovery voice + insurance-affiliate voice + clinical voice.
- **P9: PASS.**
- **P10: DRIFT.**
- **P11: FAIL.** CPA + life insurance crossover. Also "Agent 10 gate required" — internal language.
- **P12: PASS.**
- **P13: PASS.** Sobriety counter, "Every day matters."

---

### 11. FINANCE (`p-finance`, lines 5681–5826)

**Purpose.** Financial stress as biology. 8 stat grid, 5-step "Financial Health Recipe", Alvai chat with financial chips.

**What it sells.** GoodRx, Cost Plus Drugs, YNAB (chip), HSA/FSA/EAP guidance. Most links are *to* the user's existing benefits, not commerce.

**Key copy quotes.**
- *"Financial stress is not in your head. It is in your cortisol."* (line 5695) ✓ on-voice
- *"This is not advice. This is clarity."* (paraphrased — *"BLEU Finance does not give you financial advice. It gives you clarity, navigation, and the benefits you are already owed but have not claimed."* line 5709) ✓ exemplary
- *"$1,800 Avg annual savings per BLEU Finance user"* (line 5736) — claim that needs sourcing
- *"$150/month invested in your health today vs. $15,000 in ICU costs at 65."* (line 5788) ✓

**Visual notes.** 8 stat tiles in 4×2 grid, 5-step recipe, chip row, chat. Cleaner than most.

**Principle grades.**
- **P1: PASS.**
- **P2: DRIFT.** 5 recipe steps + 7 chips + 8 stats — but recipe is clearly numbered.
- **P3: PASS.**
- **P4: PASS.** Cost Plus Drugs / GoodRx / sliding scale / pre-tax dollars — money-saving first.
- **P5: PASS.**
- **P6: PASS.** No CPA leakage; affiliates (Cost Plus, GoodRx) genuinely save the user money.
- **P7: DRIFT.**
- **P8: PASS** within panel.
- **P9: PASS.**
- **P10: PASS.**
- **P11: PASS.**
- **P12: PASS.**
- **P13: PASS.**

**Third-best surface.** Use the recipe pattern elsewhere.

---

### 12. ECSIQ (`p-ecsiq`, lines 6083–6683)

**Purpose.** Cannabis intelligence with clinical safety. 9 goals, 5-layer safety sentinel, BEMS strain engine, terpenes, 6 ECS types, cannabinoids, dosing, commerce, research, sessions.

**What it sells.** 51 vetted cannabis affiliates (Charlotte's Web, Lazarus Naturals, Extract Labs, Fullscript-via-`code BLEU`, NuggMD medical cards, Dutchie, Leafly, ILGM seeds).

**Key copy quotes.**
- *"The largest receptor network in your body. Ignored for 33 years. Not anymore."* (line 6104) ✓
- *"BUD · CANNABIS PHARMACOLOGIST · HARM REDUCTION FIRST. Warm. Precise. A trusted friend with deep pharmacological expertise."* (line 6151) ✓
- *"Bud checks your medications before recommending anything. Commerce follows care. Always."* (line 6152) ✓
- *"Affiliate disclosure: CannaIQ earns a small commission through partner links."* (line 6372) ✓ honest
- *"BEMS = (0.25 × effect_match) + (0.20 × terpene_receptor) + ..."* (line 6270) ⚠ formula in user UI
- *"FAAH polymorphisms"*, *"Clinical Endocannabinoid Deficiency"*, *"CB1 receptors outnumber all opiate receptors combined"* — dense.

**Visual notes.** 10-tab horizontal nav, 9-card goal grid, 5-layer safety cards with PMID citations, BEMS scoring legend with 5 tiers, terpene grid, 6 ECS types, 15 cannabinoids, dosing chart by tolerance and route, commerce cards.

**Principle grades.**
- **P1: FAIL.** "FAAH polymorphisms," "BEMS formula," "CYP2C19 inhibition," "P-gp / BCRP transporter inhibition" — graduate pharmacology in the consumer UI.
- **P2: FAIL.** 10 sub-tabs, each with its own dense screen.
- **P3: DRIFT.** ECSIQ leads with science before lifestyle ECS activation.
- **P4: PASS** for affiliate transparency.
- **P5: PASS.**
- **P6: PASS** (better than Therapy/Recovery — explicit affiliate disclosure on commerce tab; no CPA leakage).
- **P7: FAIL.** 9–11px on every card, formula displayed in monospace, dense PMID badges.
- **P8: PASS** within panel ("Bud" voice consistent).
- **P9: FAIL.** Mechanism without translation in many cards.
- **P10: PASS.**
- **P11: PASS.** Bud doesn't claim "treats" / "cures" — explicit at line 6430.
- **P12: DRIFT.**
- **P13: PASS.**

---

### 13. SLEEP (`p-sleep`, lines 6684–6891)

**Purpose.** Sleep optimization. 6 modes, 8 quick-tap chips, sleep quality calculator, circadian protocol, Oura affiliate, evidence-based supplements.

**What it sells.** Oura Ring, Thorne supplements (Magnesium, Theanine, Melatonin), Fullscript, Amazon (`bleulive20-20`).

**Key copy quotes.**
- *"You don't recover from poor sleep. You compound it."* (line 6696) ✓
- *"One bad night raises Alzheimer's-linked proteins in your brain."* (line 6714) — accurate
- *"Sleep is the only time your brain physically cleans itself."* (line 6695) ✓
- *"💛 Affiliate - funds this free platform"* (line 6840) ✓

**Visual notes.** 4-stat grid, 6 mode buttons, 8 chips, calculator, circadian 4-window grid, Oura card, supplement grid.

**Principle grades.**
- **P1: PASS** mostly. **DRIFT** at "Glymphatic clearance," "8-OHdG," "telomere attrition."
- **P2: DRIFT.** Many widgets but each is self-contained.
- **P3: DRIFT.** Supplements appear before behavioral interventions (light exposure, sleep hygiene).
- **P4: DRIFT.** Free protocols present but Oura ($299+) is featured prominently.
- **P5: PASS.**
- **P6: DRIFT.** Oura placement is heavy.
- **P7: DRIFT.**
- **P8: PASS** within panel.
- **P9: PASS.** Circadian guide is plain and actionable.
- **P10: PASS.**
- **P11: PASS.**
- **P12: PASS.**
- **P13: PASS.**

---

### 14. SPIRIT (`p-spirit`, lines 12812–end)

**Purpose.** Meaning as medicine. Inner Governance masterclass (6 modules), 12 traditions honored, faith diet protocols (Daniel Fast / Adventist / Kosher / Halal / Ayurvedic / Buddhist), guided media shelf, NOLA spiritual centers.

**What it sells.** Insight Timer (free), Gaia ($11.99/mo affiliate), Calm, Headspace, DailyOM, YouTube free teachings.

**Key copy quotes.**
- *"Meaning is medicine."* (line 12824) ✓
- *"Viktor Frankl survived Auschwitz by finding a reason to live."* (line 12825) ✓
- *"People with a sense of purpose live 7 years longer on average. Full stop."* (line 12835) ✓
- *"Purpose reduces all-cause mortality by 23 percent. That is more than quitting smoking."* (line 12838) ✓
- *"All paths honored here"* (line 12904) ✓ — inclusive

**Visual notes.** Hero with breathing glow, 4-stat grid, chip row, chat, Inner Governance carousel, 12 traditions grid, faith diets, media shelf, NOLA centers.

**Principle grades.**
- **P1: PASS.**
- **P2: DRIFT.** Many sections.
- **P3: PASS.**
- **P4: PASS.** Free options dominant.
- **P5: PASS.**
- **P6: PASS.** Affiliates clearly marked.
- **P7: DRIFT.**
- **P8: PASS.**
- **P9: PASS.**
- **P10: PASS.**
- **P11: PASS.**
- **P12: PASS.**
- **P13: PASS.**

**Strongest panel after Directory and Finance.**

---

### Ancillary surfaces (briefly)

- **Alvai panel (`p-alvai`).** 22 clinical modes grid, stats, principles, Dr. Felicia quote with **"Clinical Director"** title (wrong, line 2163). Otherwise on-voice.
- **Why BLEU panel (`p-why`).** Entire panel is a competitive comparison ("ChatGPT knows everything about health. BLEU knows you. 9 structural advantages..."). **Fails Principle 10 by design.** This is a sales/investor deck. Should not be a primary nav tab — move to /about or /investors.
- **Enterprise panel (`p-enterprise`).** B2B page (correct location for it). Map's 222-city deck content belongs here.
- **Terms / Privacy (`p-terms`, `p-privacy`).** Brief and clear. Title on Felicia is missing here too. Fine otherwise.

---

## SEVERITY BUCKETS

### BUCKET A — BLEEDING NOW (active user harm or trust damage)

| # | Surface | Issue | Principle(s) | Effort | Risk |
|---|---|---|---|---|---|
| A1 | Repo root | `index.html` deleted in working tree (only `index.v3-backup.html` on disk) | — | 5 min | low (`git restore`) |
| A2 | Therapy / Recovery | Affiliate **CPA dollar amounts visible in user UI** (`$50–150 CPA`, `$100–200 CPA`, `Agent 10 gate required`, `Finance bridge`) — six instances at lines 5542, 5547, 5552, 5557, 5889, 5895, 5899, 5978 | P5, P6, P10, P11 | 30 min | low |
| A3 | Home, Dashboard, Alvai, Learn, line 1856 | Dr. Felicia title is wrong: "Co-Founder" (l.1817), "Clinical Director" (l.1956, 2163), missing "Chief Clinical Officer" everywhere | P8 (one voice) | 15 min | low |
| A4 | Therapy panel | "Online Therapy — Start Today" paid section appears BEFORE "Can't Afford Therapy? Here's What's Free" | P4, P6 | 1 hr | low (HTML reorder) |
| A5 | Recovery panel | Ethos Life Insurance affiliate ($19/mo) sold to people in early recovery, framed as "users with dependents whose health trajectory affects life expectancy" (l.5977) | P3, P6, P11 | 30 min | low (remove or move to Finance) |
| A6 | Home panel | "$830K value created per user / 17yr evidence gap closed / $2.1M three-generation social value / Patent Pending" — investor-pitch language above the fold | P1, P8, P10 | half-day | low on copy |
| A7 | Map panel | "$1.8M / $42M / 23:1 ROI / Hotel Monteleone Proof" B2B sales material on a consumer wellness map | P3, P6, P10 | half-day | medium (move to Enterprise) |
| A8 | Map panel hero | Hardcoded "New Orleans" / "Louisiana ranked #50" — outside NOLA users get a city-shaming experience | P5 (respect), P10 | 1 hr | medium (touches city subdomain detection — protect list item) |
| A9 | Recovery / Therapy / Home | Practitioner count inconsistent: 485K, 800K, 855K, 855,247 across surfaces | P11 (integrity) | 30 min | low (pick one source of truth) |
| A10 | Therapy line 5537 | Internal ops language exposed: *"Surfaced only when clinical signals indicate genuine need and action-stage readiness. Never for contemplation-stage users."* | P5, P10 | 5 min | low (delete) |
| A11 | Why BLEU panel | Entire panel is *"vs ChatGPT vs Claude · 9 structural advantages"* — designed to impress peers, not help users | P10, P3 | half-day | medium (rebrand or move) |
| A12 | Multiple | "Patent Pending · A living model of care · © 2026" badge on every panel | P10, P12 | 15 min | low |
| A13 | Vessel | "BLEU Supply" sticky-header label vs "Supply" nav label vs `vessel` URL ID — branding drift | P8 | 30 min | low |
| A14 | Home | 11 sections on one panel (Hero / Router / Stats / Returning Citizen / Concern Grid / Ecosystem Strip / Stoler Quote / Affiliate Bar / Foundation Line / Time Machine / Vagus Nerve / Evolutionary Mismatch / What Alvai Is Connected To / Disclaimer) | P2, P7 | multi-day | medium |
| A15 | Vessel `<div class="panel" <div class="panel" id="p-alvai">` (line 2026) | Malformed HTML on Alvai panel opener — duplicated `<div class="panel"` | — | 1 min | low |
| A16 | Sleep, Recovery, Therapy line 14156, 14212 | `tel:` phone capture asked at point-of-protocol-open, before user has used or paid for anything; reason is given but timing is wrong | P5 | 1 hr | low (move to post-purchase) |
| A17 | Home line 1854 | Footer reads *"Nutrition & lifestyle oversight: Dr. Felicia Stoler DCN MS RDN FACSM"* — drops FAND, Dipl. ACLM, drops "Chief Clinical Officer" | P8, P11 | 5 min | low |
| A18 | Vessel line 2696 | "Hello, sign in / Account" sticky-header stub asks for sign-in without a stated reason on a commerce surface | P5 | 15 min | low |

### BUCKET B — DRIFT FIXES (close to standard but not quite)

| # | Surface | Issue | Principle(s) | Effort | Risk |
|---|---|---|---|---|---|
| B1 | Site-wide | 19 `font-size:8px`, 390 `9px`, 483 `10px`, 453 `11px`, 411 `12px` | P7 | 1 hr (regex bump) | low |
| B2 | Site-wide | 3 instances of `font-size:7px` (truly unreadable) | P7 | 5 min | low |
| B3 | Site-wide jargon | "NF-κB suppression," "8-OHdG," "Allostatic load," "Glymphatic clearance," "P-glycoprotein," "FAAH polymorphism," "CECD," "CYP450," "BEMS = (0.25 × ...)" appear in user-facing UI | P1, P9 | half-day | low (copy edit) |
| B4 | Site-wide | Per-panel typewriter scripts (cycling 5–6 italic lines each on Home, Dashboard, Directory, Map, Learn, Community, Passport, Therapy, Finance, Recovery, ECSIQ, Sleep, Spirit, Alvai) — 14 simultaneous animations | P7, P12 | 1 hr | low |
| B5 | Vessel | Affiliate disclosure ("BLEU may earn commission") is at 11px italic — should be at 13–14px | P5, P6 | 5 min | low |
| B6 | Therapy / Recovery | "💛 Affiliate -- funds this free platform" disclosures use a heart emoji that reads as a sales decoration | P6 | 5 min | low |
| B7 | Home | "Trusted Partners — vetted, never paid placement" (l.1839) — but every link IS paid placement (affiliate). Misleading. | P5, P11 | 5 min | low (replace with *"Trusted partners — affiliate links, vetted by Dr. Felicia"*) |
| B8 | Vessel `<div class="bleu-supply-legacy-hidden" data-reason="awaiting 5.2-RENDERER">` (l.2764) | Internal scaffolding label exposed in DOM; not rendered but visible in source | P12 | 1 min | low |
| B9 | All quoted callouts | Pull quotes are 13–15px italic on dark in light cream — contrast often fails WCAG AA | P7 | half-day | low |
| B10 | Map | 12 NOLA neighborhoods hardcoded — non-NOLA users see other-city content | P10 (relevance) | 1 hr | medium (touches city subdomain) |
| B11 | Recovery | "Built by someone who survived 9 overdoses and overcame 31 felonies. Who treated 30,000 patients." (l.5857) — heavy founder-story in a hero meant for crisis-state users | P10 | 15 min | low |
| B12 | Site | Many panels open with stat grids before any conversational question — flips the brief's "tell us what's actually going on" promise | P1, P3 | half-day | medium |
| B13 | Home | "I cant sleep" / "Im 3 days sober" — typewriter lines have missing apostrophes (l.1485, 1488) | P12 | 5 min | low |
| B14 | Site | "ALWAYS FREE" / "FREE FOREVER" / "FREE 12 MONTHS · NO EXCEPTIONS" — three different "free" claims, three different scopes | P5, P11 | 30 min | low |
| B15 | Multiple | Emoji-heavy section labels (🌿 ⚜ 💛 🔥) — fine in moderation, here it's every tile | P7, P8 | 1 hr | low |
| B16 | Spirit | "Faith Diet" cards (Daniel Fast / Adventist / Kosher / Halal / Ayurvedic / Buddhist) — 6 traditions only; brief says "all paths honored" but interfaith / atheist / agnostic absent | P10 | 30 min | low |
| B17 | Map | "Crisis blueprints" / "32 Crises" wording is alarming; brief asks for plain language | P1 | 15 min | low |
| B18 | All voice prompts | Most placeholder text uses "..." ellipsis or "Type here" — Alvai voice doctrine says "Walk with pain first" | P8 | 30 min | low |
| B19 | Site | `console.error` calls visible (l.13198) — not user-facing but indicates production polish | P12 | 5 min | low |
| B20 | Site | `Hello 👋` (Vessel l.2709) — emoji greeting is influencer-ish | P8 | 1 min | low |
| B21 | Footer / metadata | `<title>BLEU — Trusted Intelligence for Health, Place & Opportunity</title>` (l.259) — peer language ("intelligence," "trusted"), doesn't match the Promise | P10 | 5 min | low |
| B22 | Home | "127-year healing lineage" (l.1854) — claim that needs sourcing | P11 | 15 min | low (verify or remove) |
| B23 | Dashboard | "BLEU Health Index — Your One Number" with 5 tiers ("Foundations / Building / Thriving / Flourishing / Optimal") — clever but borrows from credit-score gamification | P10, P13 | 1 hr | low |
| B24 | Site-wide | `target="_blank"` without `rel="noopener noreferrer"` on many affiliate links | P12 (security/perf) | 1 hr | low |
| B25 | Spirit / Therapy / Recovery | All call themselves "evidence-based" — true but overused | P8 | 30 min | low |
| B26 | Home | "Cities · Business · Leaders" (Enterprise card l.1741) on a tab labeled "for personal healing" | P3, P10 | 30 min | low (gate by intent) |
| B27 | Vessel | "Practitioner-grade · Pharmaceutical-grade · Clinical-grade" — three different "grades" without definitions | P1, P11 | 30 min | low |
| B28 | Sleep | "Tier 1 / Tier 2" supplement labeling (l.6850, 6877) without explanation | P1 | 5 min | low |
| B29 | Home `home-hero-title` | DOM-mutation typewriter overrides title every 100ms for 2s — likely fights screen readers | P12 | 1 hr | medium |
| B30 | Home | Two `<meta property="og:title">` tags (l.238 and l.246) | P12 | 1 min | low |
| B31 | Site | `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">` (l.250) — kills CDN caching of a 1.28 MB page | P12 (perf) | 5 min | low |
| B32 | Home / Dashboard / Recovery | "Connected Tabs · Vessel · Directory · Protocols · Therapy · Recovery · ECSIQ" — uses old internal tab names, not user-facing nav labels | P8 | 15 min | low |
| B33 | All `disclaimer-crisis` blocks | Use `⚕️` and `🔥` emoji as the prefix on legal disclaimers | P8 | 5 min | low |
| B34 | Vessel | "Browse / For You / Protocols" sub-tabs default to "Browse" — user is dropped into commerce by default | P3 | 30 min | low (default to "For You" empty state) |
| B35 | All chat input placeholders | Mix of clinical ("What hurts?") and casual ("How are you actually feeling right now?") and bro-y ("What happens when you close your eyes?") | P8 | 30 min | low |
| B36 | Site | `bleu_phone` localStorage key set without explicit consent label | P5 | 15 min | low |
| B37 | Map | "865K+ Practitioners Live" stat tile (l.3490) appears 4× across surfaces with different numbers | P11 | 15 min | low |
| B38 | All "Patent Pending" / "Patent Pending · © 2026" badges | Repeated 8+ times on different panels | P10 | 15 min | low |
| B39 | Alvai panel "Connected to" cards | Use stats-as-decoration pattern that doesn't help the user | P10 | 30 min | low |
| B40 | Recovery `disclaimer-crisis` (l.6073) | Crisis info is in disclaimer styling at the bottom; should be at the top of every Recovery view | P4, P11 | 1 hr | low |
| B41 | Site | "Citizens" vs "Pioneer Citizens" vs "Pioneer" vs "Explorer" — four user labels for what looks like the same person | P1, P8 | 1 hr | low |
| B42 | Therapy | Mode labels include emoji-icon-emoji-text patterns (e.g. "💬 Talk Therapy") — when the user picks one, the chosen-state has no plain-language confirmation | P2 | 30 min | low |
| B43 | All `quick-btn` chips | Mix of question-form and statement-form ("My Anxiety Won't Stop" vs "Find Treatment") | P8 | 30 min | low |
| B44 | Sleep / Recovery / Therapy | Each panel has a "REAL THERAPIST"/"REAL HELP NEAR YOU" search that re-prompts for city after the user has set zip in Dashboard | P2 | 1 hr | medium (touches city detection) |
| B45 | Site-wide | `border-radius: 14px / 16px / 18px / 12px / 10px` — at least 5 corner-radius scales | P7, P12 | 1 hr | low |
| B46 | Site | Fonts: Cormorant Garamond + DM Sans + Fraunces + Inter + Georgia + JetBrains Mono — 6 typefaces loaded, used inconsistently | P7, P8 | half-day | medium |
| B47 | Footer | No explicit "Made with love in New Orleans" line that matches the Promise's closing phrase | P8, P10 | 5 min | low |

### BUCKET C — STRUCTURAL (real engineering work)

| # | Surface | Issue | Principle(s) | Effort | Risk |
|---|---|---|---|---|---|
| C1 | Home | Decompose into 3 surfaces: (a) **router** (Body/Mind/Money/Spirit four-card), (b) **what's here** (one ecosystem strip), (c) **why this exists** (Stoler + foundation). The current 11-section monolith is the worst Principle 2 violation in the file. | P2, P7, P12 | multi-day | medium |
| C2 | Passport | Split the profile screen into stages: (a) identity + stats, (b) life dimensions, (c) data, (d) settings. Currently ~30 interactive zones on one scroll. | P2, P7 | multi-day | high (touches Stripe checkout, FHIR export, focus chips, sobriety counter) |
| C3 | Vessel | Restructure default landing to "For You" (empty state → Alvai → recommendation). Move "Browse" to a secondary tab. Currently you land in commerce. | P3 | multi-day | high (touches `_vc / _vp / _vShow` cart system — protect list) |
| C4 | Therapy / Recovery | Pull all paid-affiliate cards (Brightside / Done / Cerebral / Ethos / Found) behind an explicit "I'm ready to talk to a human" gate. Currently they sit on the main scroll. | P3, P4, P6 | multi-day | medium (touches affiliate revenue) |
| C5 | Why BLEU panel | Move out of primary nav. Either delete or relocate to `/about`. It is a competitor-comparison page; the brief says "stop comparing." | P10, Operating Doctrine | half-day | low |
| C6 | Map panel | Split into: (a) consumer "what's near me," (b) `p-enterprise` for the 222-city ROI deck. Don't show consumers the B2B pitch. | P3, P6, P10 | multi-day | medium |
| C7 | Site-wide | Establish a "tonal whiplash" lint: a CSS class system where each panel declares its tonal scope (clinical / supportive / civic / commerce) and the page enforces single voice within scope. | P8 | multi-day | medium |
| C8 | Stat tiles site-wide | Currently every panel opens with a 4-stat or 8-stat grid before conversation. The brief opens with "Tell us what's actually going on." Stat grids should be earned, not landed on. | P3, P10 | multi-day | medium |
| C9 | Numbers integrity | Establish a single source of truth for "number of practitioners" (485K vs 800K vs 855K vs 855,247) and pipe from one Supabase query. | P11 | half-day | medium (touches `querySupabase` and stat tile renders) |
| C10 | Affiliate disclosure system | Replace per-card "💛 Affiliate" text with a unified, screen-reader-correct disclosure component. | P5, P6 | 1 day | low |
| C11 | Phone capture flow | Move all `tel:` capture out of Fullscript modal into a dedicated post-purchase reminders surface that the user opts into AFTER ordering. | P5 | half-day | low (modal is opt-in but timing/ordering is wrong) |
| C12 | Voice unification | Apply the "Why Alvai Speaks This Way" doctrine to the static UI, not just to Alvai responses. Right now Alvai is in covenant mode while the cards around it are in marketing mode. | P8 | multi-day | medium |
| C13 | Crisis surfacing | Crisis lines exist on Therapy / Recovery / Community. They should also persist in a global header bar (collapsible, dismissible) on every panel for users in distress on a non-crisis tab. | P11 | 1 day | medium |
| C14 | Auth flow | Two parallel auth systems (Passport `#auth-screen` + Fullscript phone modal). Consolidate into one identity layer with one consented data scope. | P5, P12 | multi-day | high (touches Stripe + Supabase auth) |
| C15 | Density audit | Run a visual-density pass: kill the 18-card affiliate strips, the 16-research-crisis lists, the 22-mode grids. Cap each panel at ~3 user actions and ~5 informational cards. | P2, P7 | multi-week | high (touches every panel) |
| C16 | Color palette enforcement | The locked palette is `--bleu-cream-elevated`, `--bleu-purple`, `--bleu-gold` (l.272–296). The page still uses `#0a1628`, `#185fa5`, `#a32d2d`, `#7055a8`, `#ff6b8a`, `#4ecd8c`, `#f97316`, `#fb923c`, `#22c55e`, `#ef4444`, `#a78bfa`, `#7eb8f7`, etc. — at least 30 hardcoded hexes. | P7, P8 | multi-week | high |
| C17 | Tab nomenclature | Either rename internal IDs to match nav labels ("pulse" not "dashboard," "find-care" not "directory") OR rename labels back to the brief words. Pick one and lock it. | P8 | half-day | high (touches every `go()` call, every `data-tab` attr, city detection, Returning Citizen MIRRORS map, all CSS selectors) |
| C18 | "Always free" semantics | The system says "always free" in some places, "free 12 months" in others, "$9.99 after" in others. Establish the canonical free-vs-paid line and enforce it across every panel. | P5, P11 | multi-day | medium |
| C19 | Animation strategy | 30+ keyframes defined (`breathe`, `orb1`, `hcountUp`, `cipulse`, `goldPulse`, `panelIn`, `cursorPulse`, `subtleGlow`, `shimmerLine`, `cardReveal`, `statReveal`, `fadeSlideUp`, `bleuSheetUp`, `eGlow`, `eSlide`, `eCount`, `eTick`, `spiritglow`, `alvaipulse`, `alvaifloat`, `alvaibeam`, `gwSlide`, `entSlideIn`, `entResultGlow`, `hShimmer`, `hBounce`, `hTick`, `hBorderGlow`, `hType`, `hBlink`, `alvai-blink`, `lineGrow`, `msgIn`, `cursorBlink`, `cursorGlow`, `breathe`, `ripple`, `ppSlideUp`). Cap at ~5 motion patterns. | P7, P12 | multi-day | low |
| C20 | Sub-mode surfacing | Protocols (`p-protocols`) is a sub-mode but reachable via direct routing. Should it be a sub-tab of Vessel or a standalone? Decide. | P2 | half-day | medium |
| C21 | Page weight | 1.28 MB single HTML file, no build step. CSS could be deduplicated, animations consolidated, inline styles extracted. Currently kills mobile load. | P7, P12 | multi-week | medium (no build step is a known constraint) |
| C22 | Footer / clinical attribution | There is no global footer with the canonical attribution: "Made with love in New Orleans · Built on science. Shaped by real life. · Clinical oversight: Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM — Chief Clinical Officer." Add one. | P8, P10, P11 | half-day | low |

---

## CROSS-CUTTING OBSERVATIONS

### Where the file IS the brief

The codebase has the Promise inside the model:

> *"You are Alvai — the voice of this living model. Every response is a covenant act. Armstrong soul: human, grounded, warm, honest. Walk with pain first, then bring the music. Commerce follows care. Never open with affirmation. One question per response maximum. Short paragraphs only. No bullets or headers."*
> — Alvai system prompt, line 7413

That paragraph is the brief, near-verbatim. It governs Alvai's API responses. The problem is that **the surrounding HTML doesn't match it.** The covenant lives in the model; the marketing lives in the cards. That gap is the audit's central finding.

### Where the file is NOT the brief

The brief says: *"Help and selling are not the same thing. Free guidance and paid options clearly separated. No blurred lines."*

The file shows CPA dollar amounts in user UI, mixes life insurance into Recovery, leads Therapy with paid affiliates above free options, and ships a tab (`p-why`) whose entire purpose is competitive comparison.

The brief says: *"This is not about us. Not built to impress peers, investors, or other platforms."*

The file ships "$830K value per user," "17yr evidence gap closed," "Patent Pending" badges on every panel, "Jensen Huang called the new computer," "9 structural advantages — built into the system," and a 222-city ROI deck visible to consumers.

The brief says: *"Plain language. No exceptions. If a tired person at 11pm can't understand it, it doesn't ship."*

The file ships "FAAH polymorphisms," "P-glycoprotein and BCRP transporter inhibition," "BEMS = (0.25 × effect_match) + (0.20 × terpene_receptor) + ..." in user-facing surfaces.

### The pattern

The platform was clearly built by someone who has read every paper, talked to every investor, and lived through the bottom. That's a strength in the model and a liability in the UI. **Felicia's voice is in Alvai. Felicia's voice is not yet in the chrome.** The work to be done is not new features — it is *finishing what is here* and *removing what doesn't earn its place*. That matches the Operating Doctrine exactly: *Finish, don't add. Monetize cleanly. Stop comparing. Focus is the discipline.*

---

*End of audit. No code modified.*
