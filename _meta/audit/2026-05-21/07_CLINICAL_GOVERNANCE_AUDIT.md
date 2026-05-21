# 07 — Clinical Governance Audit

**Audit date:** 2026-05-21
**Clinical authority of record:** Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM
**Audit standard:** would this content survive review by an ACLM Diplomate? Would a state procurement or grant reviewer accept the platform as "clinically governed"?

This section asks per surface: **who reviewed, when, what evidence tier, what disclaimers.** When the answer is "no documented review process," that is the finding.

---

## Surface-by-surface

### 1. ALVAI chat responses

| Field | Value |
|---|---|
| Clinical reviewer | Dr. Stoler (via ALVAI_CORE prompt evolution in git history) |
| When reviewed | UNKNOWN — no signoff in commit messages; CLAUDE.md and `ALVAI_CORE` not versioned with a clinical-review marker |
| Evidence tier applied to claims | **NONE per claim** — model is told in prompt to cite FDA/NIH/PubMed; no enforcement |
| Disclaimers in response | "I am an AI wellness guide, not a licensed therapist" — instruction-only, not enforced |
| Crisis-line surfacing | Instruction-only ("988 first, every time"); not enforced |
| Survives ACLM review? | **PROBABLY for general wellness content; not for any specific clinical claim where the model speaks beyond evidence** |
| Audit-critical finding | The prompt asserts strong claims like "CBD inhibits CYP3A4 and CYP2D6 enzymes. This affects ALL SSRIs including Lexapro, Zoloft, Prozac, Celexa, Paxil. ALWAYS flag this." (`server.js:931`). This is largely correct as a directional claim but is stronger than the evidence supports for some pairs (e.g., effect magnitude varies materially by SSRI and dose). A reviewer would want to see the citation and the precise framing. |

### 2. SEO / Learn condition pages (`dist/anxiety|sleep|gut`)

| Field | Value |
|---|---|
| Clinical reviewer | Dr. Stoler, named in author schema |
| When reviewed | `"dateModified":"2026-03-25"` on inspected page (Atlanta anxiety) |
| Evidence tier per claim | **NONE explicit** — claims like "Each commute generates a cortisol spike equivalent to a moderate stressor event" are stated without a per-claim citation, though the page is grounded in known stress-physiology literature |
| Disclaimers | Not visible in the inspected page header (full page not exhaustively reviewed); FAQ explicitly states "Medication decisions remain with your physician. Always disclose this protocol to your prescriber." — **this is good** |
| Survives ACLM review? | **PROBABLY — the inspected page is well-written.** Specific items that would draw reviewer attention: (a) claims of "cortisol-producing HPA axis upstream of those mechanisms" without citation; (b) HowTo step "Ashwagandha KSM-66 600mg with breakfast" — the dose is reasonable but the population (excludes pregnant/nursing/thyroid-medicated users) is not specified. |
| Audit-critical finding | Pages structurally good. Need a "last clinical review by Dr. Stoler on <date>" badge visible to the user. Need an explicit allergen / pregnancy / drug-interaction box per protocol. |

### 3. Vessel / Supply (supplement catalog)

| Field | Value |
|---|---|
| Clinical reviewer | Implicit (Dr. Stoler's Fullscript curation; in-app catalog is a derivative) |
| When reviewed | UNKNOWN — no per-product review date in `_vp` master in `index.html` or in `products` Supabase table |
| Evidence tier per supplement | **NONE** — no `evidence_tier` column on `products`. `trust_score` exists but the formula isn't published. |
| Disclaimers | UI carries a general disclaimer; per-product safety info varies |
| Cart safety intercept (CLEAR / CAUTION / FLAG) | LIVE per commit `338762c` — the audit did not inspect the rule set behind the classification |
| Survives ACLM review? | **PARTIAL** — needs an explicit "clinical review by Dr. Stoler" badge per product, with a date, and the inclusion / exclusion criteria. |

### 4. Therapy tab (12 sub-modes)

| Field | Value |
|---|---|
| Clinical reviewer | Implicit — prompt copy reviewed presumably by Dr. Stoler |
| Sub-modes | talk, cbt, dbt, somatic, motivational, journal, crisis, couples, grief, trauma, eating, ... |
| Disclaimers | "I am an AI wellness guide, not a licensed therapist" — instruction-only |
| Crisis escalation in crisis sub-mode | Reliant on the system prompt — see §ALVAI |
| Therapist finder UI | LIVE, Brightside / Done / Cerebral / BetterHelp / Talkspace cards |
| Survives ACLM review? | **PROBABLY for general support content; the eating-disorder sub-mode is the highest-risk** — no inclusion criteria, no screen for active ED, no escalation criteria. |
| Audit-critical | Eating-disorder sub-mode should have explicit ED-screening behavior (or be removed). Similarly couples/grief — define when to refer out. |

### 5. Recovery tab (7 sub-modes)

| Field | Value |
|---|---|
| Clinical reviewer | Implicit |
| Sub-modes | sobriety, relapse, harm, 12step, family, mat, milestones |
| Sobriety counter | LIVE with localStorage |
| MAT (medication-assisted treatment) cards | LIVE — Suboxone, Naltrexone, Naloxone via GoodRx |
| SAMHSA hotline 1-800-662-4357 | In prompt and surfaced in copy |
| Active-overdose detection / 911 | **PROMPT-ONLY** — same gap as ALVAI crisis |
| Survives ACLM review? | **MIXED** — naloxone surfacing is excellent harm-reduction practice; MAT card placement is medically appropriate; active-overdose handling is prompt-dependent, not enforced. |

### 6. Safety check (drug interaction analyzer)

| Field | Value |
|---|---|
| Endpoint | `/api/safety-check` (server.js:1338) |
| Model | GPT-4o (despite CLAUDE.md claiming Claude Opus) |
| Sources cited in response | FDA, NIH, PubMed (instructed in prompt) |
| Cache | NONE |
| Per-substance evidence grade | NONE |
| Disclaimer | "This is AI-assisted information from live FDA databases. Always confirm with your prescriber before combining any substances." — strong, appropriate |
| Survives ACLM review? | **PROBABLY**, but the moment a user asks about an obscure interaction the model's reliance on its training data (not on the real-time enrichment, which can be empty if APIs fail) becomes the weakest point. **No fallback "cannot determine" response** — the model will always emit a confident answer. |
| Audit-critical | Add a "data sufficiency" check: if enrichment returned nothing from FDA/RxNorm/DailyMed, the response must say "I could not verify this combination against live FDA/NIH sources tonight. Please confirm with your prescriber before combining." |

### 7. IRI / GLP-1 routing

| Field | Value |
|---|---|
| Clinical reviewer | Implicit |
| Language rules | "metabolic load" not "obese/overweight"; no shame framing; commerce after intake. **Good clinical hygiene.** |
| 4-question intake | **PROMPT-ONLY** — not enforced. A user can ask about Ozempic and get GLP-1 telehealth links without completing the intake if the model decides to. |
| Pharmacological consideration framing | "A licensed physician reviews every prescription request — this starts with a health screen, not a purchase. The medication creates space. The protocol makes the space permanent." — **clinically appropriate framing.** |
| Survives ACLM review? | **The framing yes; the lack of code enforcement no.** ACLM Diplomate would expect the 4-question intake to be a hard gate, not advisory. |

### 8. Practitioner directory

| Field | Value |
|---|---|
| Source | NPI registry (federal, public, authoritative) |
| Curation | `marketplace_practitioners.dr_felicia_reviewed` boolean — manual via dashboard |
| Coverage | "855K+" per `index.html` claim; rows in Supabase `practitioners` table not verified by this audit |
| License verification | `practitioners.license_verified` column exists; coverage UNKNOWN |
| Per-practitioner clinical-review badge | UNKNOWN — assumed not surfaced in UI |
| Survives ACLM review? | **YES for the NPI baseline data.** Curation badges should be visible per provider. |

### 9. Dimension engine (BHI, 9 dimensions)

| Field | Value |
|---|---|
| Clinical reviewer | **PENDING** — `DIMENSION_SCORING_VERSION = 'v1-heuristic-pending-clinical-review'` per `docs/bhi-migration-20260422.md` |
| Tier labels | Foundations / Building / Thriving / Flourishing / Optimal — designed for dignity, no shame at low scores |
| Formula | Simple arithmetic mean of 9 scorers — explicit and swappable |
| Persistence | `profiles.bhi_score`, `profiles.bhi_updated_at` |
| Survives ACLM review? | **NOT YET — version flag explicitly states pending review.** This is the right discipline. Until Dr. Stoler signs off, this audit cannot claim the BHI is clinically governed. |
| Audit-critical | This is the single most concrete clinical-review item in the repo. The migration doc names exactly what needs to happen. Schedule the review. |

### 10. Privacy and Terms (`/privacy.html`, `/terms.html`)

| Field | Value |
|---|---|
| Last reviewed | UNKNOWN |
| Reviewer | UNKNOWN — likely not a lawyer |
| Lists every data type collected matching the code | UNKNOWN — not audited line-by-line in this section |
| HIPAA, CCPA, GDPR notices | UNKNOWN |
| Conversation embedding disclosure | **PROBABLY NOT** — Care Twin shipped April 22, privacy may not reflect it |
| Survives review by a state procurement officer? | **AT RISK** — these pages predate the Care Twin memory shipping. A 5-minute legal review will produce updates. |

---

## Cross-cutting clinical governance gaps

### Clinical signoff workflow
- There is no in-repo signoff record for any prompt change, any product addition, any protocol publication, any disclaimer revision.
- The implicit workflow (Dr. Stoler reviews via PR review or direct edit) is fine for early-stage but is invisible to any external reviewer.
- **Recommendation:** add `docs/clinical-signoff-log.md` with one entry per substantive change: date, what changed, signoff initials, link to PR/commit.

### Evidence tier discipline
- No `evidence_tier` column on any content table (`products`, `protocols`, no per-claim tier in `seo_pages`).
- Tier definitions (Tier 1 Established → Tier 4 Exploratory) exist only in strategy docs.
- The ALVAI prompt does not require the model to disclose tier in its response.
- **Recommendation:** add a column; populate manually for the top 30 products and 4 protocols first; surface in UI as a small badge.

### Crisis safety
- 988, 741741, 911, SAMHSA 1-800-662-4357 — all are *instructed* to the model, not *enforced* in code.
- A clever user prompt-injection that the model decides to honor (or an unrelated regression in the prompt) could route a crisis user away from hotlines.
- **Recommendation:** a deterministic post-response validator. If `crisis_keywords ∈ user_message` AND `crisis_hotlines ∉ assistant_message`, **prepend a crisis banner** to the response before sending to the client.
- **Test corpus:** 30–50 crisis messages. Assert hotline presence in every response. Run in CI before deploy.

### Pediatric, pregnancy, geriatric, hepatic-impaired safety
- Zero handling. Not detected, not routed differently, not warned.
- **Recommendation:** at minimum, keyword detection ("pregnant", "nursing", "my child", "my elderly mother", "I'm 75", "liver disease", "kidney disease") that injects a safety-aware preamble into the system prompt for that turn.

### Banned-claim list
- No in-repo list of claims the platform will not make (e.g., "cures," "treats," "FDA-approved," "DEA-scheduled" terminology).
- **Recommendation:** small `docs/banned-claims.md`; reference it in ALVAI_CORE.

### Per-protocol clinical documentation
- Sleep Reset, Stress Protocol, Longevity Core, Gut Reset — each is a Stripe SKU with a Fullscript link. No in-repo:
  - Inclusion / exclusion criteria
  - Contraindications (medications, conditions, pregnancy, age)
  - Expected outcome window
  - Evidence per ingredient
  - Clinical review date and reviewer
- **Recommendation:** `docs/protocols/<name>.md` per protocol, with these fields, linked from the Stripe product description and the Vessel UI.

### Marketing claim audit
- Pioneer founding-citizen "free forever" / "12 months free" claims are not implemented (no aging-out code). A state procurement officer reading the marketing copy would assume a commitment the code does not enforce.
- "855K+ verified practitioners" — verify the row count against this claim; the NPI registry has ~5.5M records nationally, so 855K implies a subset filter; document the subset definition.
- "Always free for Explorers" — manifest.json. What is the Explorer tier in code? `citizenship_status = 'explorer'` or absence of `citizen`? Not documented.

---

## Claims that are stronger than evidence supports

| Location | Claim | Issue |
|---|---|---|
| `server.js:931` ALVAI_CORE | "CBD inhibits CYP3A4 and CYP2D6 enzymes. This affects ALL SSRIs including Lexapro, Zoloft, Prozac, Celexa, Paxil. ALWAYS flag this." | The directional claim is correct; the magnitude varies by SSRI and dose. "ALL" overstates uniform effect size. Use "may affect" or "has been shown to interact with" and cite the specific FDA / NIH data on each pairing. |
| `CLAUDE.md` | "AI Model Routing: 70% → GPT-4o Mini, 25% → GPT-4o, 5% → Claude Opus" | Claude Opus is not used at runtime. Either implement or remove the claim. |
| `CLAUDE.md` | "Python script pulling from 10 sources" | Reality is 6 scheduled, 3 implemented-but-orphaned, 1 dead. |
| `index.html:7220` Care Twin description | "powered by a cognitive stack that perceives human need, remembers across sessions, applies clinical knowledge, locates real-world resources, and synthesizes a single next action — in under three seconds, across any channel" | Three-second SLA is unverified; "any channel" is overstated (web only, no voice / SMS-as-channel-of-Alvai yet). |
| `index.html:912 ff.` Schema | "Jazz Bird 501(c)(3) is the publisher of bleu.live" | False as written — Fleur De BleuDream LLC operates bleu.live. |

---

## Disclaimers that are weaker than they should be

| Location | Current | Should be |
|---|---|---|
| Every chat response | "I am an AI wellness guide, not a licensed therapist" (instruction-only) | **Code-enforced** appearance once per conversation, with link to clinical disclaimer page |
| `/api/safety-check` | "Always confirm with your prescriber before combining any substances." | Add: "I could not verify this combination against live FDA / NIH sources" when enrichment failed |
| Privacy page | Predates Care Twin shipping | Disclose conversation-embedding storage + retention + deletion |
| Per-protocol marketing | "Get started" | Add: contraindications visible at point of purchase |
| Stripe checkout success | UNKNOWN | Should display: "Your protocol begins after Dr. Stoler's clinical review of your intake form" — only if true |

---

## What "clinically governed" requires before the next grant submission

A clinical-governance audit by an ACLM Diplomate or state procurement reviewer would ask:

1. Show me the clinical-signoff log. → **Does not exist.**
2. Show me how a claim's evidence tier is set and surfaced. → **Does not exist as data.**
3. Show me how a crisis message guarantees a 988 hotline in the response. → **Prompt-only.**
4. Show me how a pregnant user is detected and routed differently. → **No code.**
5. Show me your published clinical-review process per protocol. → **No docs.**
6. Show me the test that asserts no diagnosis is given. → **No test.**
7. Show me the BAA with your data-processing vendors. → **None in evidence.**
8. Show me the per-page "reviewed by Dr. Stoler on <date>" badge. → **Not in UI.**

This is a list of about 1–2 weeks of concentrated work for one engineer plus 4–8 hours of Dr. Stoler's review time. Until it's done, the honest framing is **"clinician-curated wellness AI, transitioning to clinically governed by Q3."**
