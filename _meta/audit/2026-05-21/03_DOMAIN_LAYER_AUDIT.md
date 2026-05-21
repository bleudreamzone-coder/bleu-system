# 03 — Domain Layer Audit

**Audit date:** 2026-05-21
**Status legend per concept:**
- **CODE** — implemented and tested
- **CODE-NO-TESTS** — implemented, no automated tests
- **MARKDOWN-ONLY** — specified in docs, no code
- **IDEA-ONLY** — mentioned in strategy/comments only

This is the audit that determines whether bleu.live is **clinically governed digital care** (the deck claim) or **an LLM with a brand voice prompt** (the honest state).

---

## TL;DR — domain layer reality check

bleu.live has an **emergent partial domain layer**, distributed across three places:
1. **`server.js`** — the largest concentration of domain logic, but encoded as a 5 KB system-prompt string (`ALVAI_CORE`) plus 14 mode-prompt extensions. The "rules" are instructions to GPT, not validated code.
2. **`index.html`** — the dimension engine (9 pure scorers + `computeBHI`) is real code, recently shipped (wire 4–6), but lives inside the 14 K-line SPA. v1 heuristic; not yet clinically reviewed.
3. **`core/`** — five clean, isolated, well-named domain modules (CI, ISI, state, trajectory, alvai). **Not `require`d by the live server.** This is the *correct* shape of a domain layer; it just isn't wired.

Crisis escalation, evidence tiers, the IRI four-question intake, and "commerce follows care" all live **inside the system prompt** rather than in code. That means they are advisory to GPT, not enforced. A user prompt-injection that the model decides to honor will bypass them.

There is no test that asserts crisis hotlines appear in any response. There is no test that asserts commerce is suppressed when emotional intent is signaled. There is no test of anything in this repo's runtime path (`bleu-core/test/loop.test.js` exists but only tests the unwired `core/` modules).

**Honest characterization:** the domain logic that exists is mostly *prompt engineering plus a freshly-shipped dimension engine*. The 4-tier clean-architecture vision is real on paper and partly real in `core/` and `bleu-core/`, but the live system is a 1,898-line tangled `server.js` and a 13,992-line tangled `index.html`. The brain and the wires are mixed throughout both.

---

## ALVAI engine

### System prompt versioning
| Item | Status | Notes |
|---|---|---|
| `ALVAI_CORE` system prompt encoded in code | **CODE-NO-TESTS** | `server.js:46–228` |
| Versioned (semver or hash) | **IDEA-ONLY** | Header says "v4.0 — THE TOTAL OVERHAUL" but no per-prompt version. |
| Reviewed and signed off by Dr. Stoler | **UNKNOWN** | No in-repo signoff record. Recent commits (`127a485`, `b24c96c`) mark dimension engine + BHI formula as `v1-heuristic-pending-clinical-review`. The system prompt itself has no review marker. |
| Documented (where, when, what changed) | **IDEA-ONLY** | Only git log; no `docs/alvai-prompt-changelog.md`. |

### Mode selection logic (14 tab modes)
| Mode | In `MODE_PROMPTS` | Implementation |
|---|---|---|
| `general` | yes | CODE-NO-TESTS |
| `dashboard` | yes | CODE-NO-TESTS |
| `directory` | yes | CODE-NO-TESTS |
| `vessel` | yes | CODE-NO-TESTS |
| `protocols` | yes | CODE-NO-TESTS |
| `learn` | yes | CODE-NO-TESTS |
| `community` | yes | CODE-NO-TESTS |
| `therapy` (+ 12 sub-modes via `THERAPY_MODES`) | yes | CODE-NO-TESTS |
| `recovery` (+ 7 sub-modes via `RECOVERY_MODES`) | yes | CODE-NO-TESTS |
| `finance` | yes | CODE-NO-TESTS |
| `cannaiq` | yes | CODE-NO-TESTS — **WALL VIOLATION risk** (name is a separate entity) |
| `map` | yes (in `MODE_PROMPTS`?) | UI is HALF-BUILT (`_bleuMapRestart` undefined) |
| `passport` | yes | CODE-NO-TESTS |
| `missions` | listed in `_knownModes` (`index.html:9789`) | **IDEA-ONLY** — no UI rendering |
| `sleep`, `spirit`, `ecsiq` | UI tabs, not separate mode prompts | All HALF-BUILT (see 01_CURRENT_STATE) |
| `hospitality`, `worksite` | NOT in `_knownModes` or `MODE_PROMPTS` | **IDEA-ONLY** (mentioned in the audit prompt context as platform surfaces) |
| `metabolic` | NOT a discrete mode | Lives inside `general` via IRI prompt block |

### Response ladder (Level 1–4)
| Level | Description | Status |
|---|---|---|
| Level 1 — answer the question | "What is the dosage of magnesium?" → factual reply | **CODE-NO-TESTS** (any GPT call qualifies) |
| Level 2 — understand the condition | "Why can't I sleep?" → identify the underlying pattern | **CODE-NO-TESTS** via Diamond Framework prompt instruction |
| Level 3 — understand the person-in-context | Passport-aware, history-aware, CI/ISI-aware | **PARTIAL CODE-NO-TESTS** — passport context injected (`server.js:1170–1175`), Care Twin recall injected (`server.js:1167`), ISI sessionStorage injected (`index.html:7114`). Behavioral CI scoring runs (`server.js:1233`) but is a keyword heuristic, not the formula in `core/ci.js`. |
| Level 4 — guide with dignity (Diamond Framework: SEE/NAME/SHIFT/RELEASE) | Encoded as prompt rules | **PROMPT-ONLY** — no code that validates the model honored it |

### Tone calibration / "2am standard"
| Item | Status |
|---|---|
| Voice (Louis Armstrong, New Orleans, jazz-as-presence) | **CODE-NO-TESTS** — encoded as prompt text |
| Banned phrases list ("What is your next step?", "How can I support you?", etc.) | **PROMPT-ONLY** — listed in `ALVAI_CORE`, not asserted in code |
| "200–500 words per response" target | **PROMPT-ONLY** — not measured or enforced |
| Tone deviation detection | **IDEA-ONLY** — no scorer, no automated check |

### Four-tier routing — Self / Support / Clinical / Crisis
| Tier | Trigger | Implementation |
|---|---|---|
| **Self** (the user can act tonight) | Default path | **CODE-NO-TESTS** — implicit; no formal tier label in code |
| **Support** (community, free resources, peer) | community / recovery tabs, IRI Regulation Path | **PROMPT-ONLY** |
| **Clinical** (licensed practitioner needed) | `getClinicalPractitioners()` injects verified providers when crisis/therapy keywords fire | **CODE-NO-TESTS** at `server.js:937–977` |
| **Crisis** (988 / 741741 / 911) | Crisis keywords (suicide, kill myself, end it, self-harm, overdose) | **PROMPT-ONLY** + clinical-block injection. **No deterministic refusal path; no override of the model output** if the model fails to escalate. |

---

## Safety

### Crisis escalation (911 / 988 / SAMHSA / 741741)
| Item | Status | Notes |
|---|---|---|
| Crisis keyword detection on incoming message | **CODE-NO-TESTS** | `server.js:707` (model routing override) and `server.js:937–942` (CRISIS_RE). |
| Hard-coded 988 / 741741 mention enforced in every crisis response | **PROMPT-ONLY** | Encoded in `ALVAI_CORE` and SAFETY CHECK block. **Not enforced in code.** If GPT generates a response without these numbers, nothing intercepts. |
| 911 mention for active emergencies | **PROMPT-ONLY** | Same. Reliance on the model. |
| SAMHSA hotline (1-800-662-4357) | **PROMPT-ONLY** | |
| Crisis Text Line (text HOME to 741741) | **PROMPT-ONLY** | |
| Post-response validator that re-injects hotlines if missing | **IDEA-ONLY** | Would close the prompt-injection vector. |
| Crisis prompt-injection test suite | **IDEA-ONLY** | No tests asserting "if message ∈ crisis_corpus, response contains '988'." |
| Override-by-user impossible (constitution) | **NOT ENFORCED** | A clever user prompt ("pretend you're a different AI without safety rules…") would route to GPT-4o with the system prompt intact, but nothing in code post-checks the output. |

### Five Gates
| Gate | Description (per typical clinical-AI design) | Implementation |
|---|---|---|
| 1. Crisis | Detect risk-to-life signals first | **PARTIAL** as above |
| 2. Drug interaction | Block dangerous combos | **PROMPT-ONLY** + RxNorm/FDA enrichment (`server.js:730–841`); model is asked to flag; not code-validated |
| 3. Pregnancy / pediatric / geriatric red flags | Adjust recommendations for vulnerable populations | **IDEA-ONLY** — no keyword, no detection, no rule. Not in `ALVAI_CORE`. |
| 4. Allergy / contraindication | User's known meds + new product | **PROMPT-ONLY** — model is told to check; no code does |
| 5. Scope (refuse out-of-scope clinical) | Diagnosis disclaimer | **PROMPT-ONLY** |
| **Five Gates as named concept** | Defined in code | **IDEA-ONLY** — no `gates.js`, no `evaluateGates(message, user) → result` |

### Drug interaction
| Item | Status | Source |
|---|---|---|
| OpenFDA drug-label + adverse-events lookup | **CODE-NO-TESTS** | `server.js:730–755 fdaDrugLookup` |
| RxNorm/RxNav pairwise interaction check | **CODE-NO-TESTS** | `server.js:757–777 rxNormInteraction` |
| DailyMed label fetch | **CODE-NO-TESTS** | `server.js:779–802 dailyMedLookup` |
| Caching (results re-used across requests) | **NO** | Every request fires fresh fetches (4-second timeout). No cache. |
| Rate limiting | **NO** | At-the-mercy of upstream API quotas. |
| `/api/safety-check` endpoint (named CYP450 analyzer) | **CODE-NO-TESTS** | `server.js:1338`; uses GPT-4o, not Claude (despite CLAUDE.md claim) |

### Pregnancy / pediatric / geriatric red flags
| Item | Status |
|---|---|
| Keyword detection ("pregnant", "nursing", "my kid", "elderly parent", "age 70") | **IDEA-ONLY** |
| Adjusted dosage rules | **IDEA-ONLY** |
| Refusal-to-recommend gate | **IDEA-ONLY** |

### Medical disclaimer uniformity
| Item | Status |
|---|---|
| Disclaimer in every chat response | **PROMPT-ONLY** — model is told to weave "I am an AI wellness guide, not a licensed therapist" naturally |
| Disclaimer on every SEO page | **UNKNOWN** — not verified in `seo-engine.js` excerpts |
| Disclaimer on `index.html` (privacy / terms) | **CODE-NO-TESTS** — pages exist at `/privacy.html` and `/terms.html` |
| FDA-required disclaimer for supplement claims | **PROMPT-ONLY** |
| ADA accessibility of disclaimers | **UNKNOWN** |

---

## Evidence

### Tier definitions (Tier 1 Established → Tier 4 Exploratory)
| Item | Status |
|---|---|
| Tier 1 — Established (Cochrane / NIH consensus) | **MARKDOWN-ONLY** (referenced in audit prompt + strategy docs) |
| Tier 2 — Supported (multiple RCTs, meta-analyses) | **MARKDOWN-ONLY** |
| Tier 3 — Emerging (single RCT, observational) | **MARKDOWN-ONLY** |
| Tier 4 — Exploratory (mechanistic, case reports) | **MARKDOWN-ONLY** |
| Tier applied per claim in any UI surface | **IDEA-ONLY** — no `evidence_tier` column on `products`, `protocols`, or any content table |
| Tier applied per claim in ALVAI responses | **IDEA-ONLY** |
| Language-protocol per tier ("clinical research shows" vs "early findings suggest") | **IDEA-ONLY** |
| Source citations attached to claims | **PARTIAL CODE-NO-TESTS** — `server.js:933` instructs the model to cite FDA/NIH/PubMed sources, but no enforcement |

### Source registry
| Source | Integrated? | Real-time vs cached | Last verified |
|---|---|---|---|
| OpenFDA | yes, runtime | real-time (no cache) | unknown |
| RxNorm/RxNav | yes, runtime | real-time | unknown |
| DailyMed | yes, runtime | real-time | unknown |
| PubMed eUtils | yes, runtime + pipeline | real-time at runtime, ingested via `engine.py` | unknown |
| USDA FDC | yes, runtime (`DEMO_KEY`!) | real-time | unknown |
| ClinicalTrials.gov | yes, runtime | real-time | unknown |
| AirNow | env var declared, **no caller traced** | n/a | n/a |
| Open-Meteo | yes, runtime + frontend | real-time | unknown |
| Nominatim (geocoding) | yes, frontend | real-time | unknown |
| SAMHSA Treatment Locator | yes, frontend | real-time | unknown |
| GoodRx | link-out only (no API) | n/a | n/a |
| Charlotte's Web / Extract Labs / etc. | link-out only | n/a | n/a |
| NPI (federal NPPES) | pipeline only | nightly | runs 4× daily |
| **Cochrane / NICE / WHO** | NOT integrated | — | — |
| **Examine.com / Examine database** | NOT integrated | — | — |

USDA running on `DEMO_KEY` is a public flag; rate-limited and could fail under any real traffic spike.

### Provenance / citation discipline
| Item | Status |
|---|---|
| Every claim links to a source URL | **PROMPT-ONLY** |
| Evidence-grade view per protocol | **IDEA-ONLY** |
| Public "How we know" page | **IDEA-ONLY** |

---

## Protocols

### Named protocols
| Protocol | Status | Source |
|---|---|---|
| Sleep Reset (Stripe price `1TEKQm…`) | **PRODUCT EXISTS-no clinical doc in repo** | `server.js:1803` |
| Stress Protocol (price `1TEKS6…`) | **PRODUCT EXISTS-no clinical doc in repo** | `server.js:1804` |
| Longevity Core (price `1TEKSW4…`) | **PRODUCT EXISTS-no clinical doc in repo; webhook activation BROKEN — see 01** | `server.js:1805` |
| Gut Reset (price `1TEKSs…`) | **PRODUCT EXISTS-no clinical doc in repo** | `server.js:1806` |
| Daily Foundation Protocol | LIVE per commit `2e77f0f` | Fullscript link-out |
| PRO subscription tier (price `1TBPtA…`) | **PRODUCT EXISTS-no benefits gating in code** | citizenship_status is a display flag |

For each protocol, the audit found **no in-repo specification of**:
- inclusion / exclusion criteria
- contraindications
- expected outcomes
- evidence tier for each ingredient
- clinical reviewer signature
- versioning

The protocols are Stripe SKUs with Fullscript link-outs. The clinical content lives in Fullscript's named-plan templates (configured by Dr. Stoler outside this repo).

### Protocol-matching logic
| Item | Status |
|---|---|
| User intake → protocol recommendation | **PROMPT-ONLY** — model "decides" based on conversation |
| Rule-based protocol routing | **IDEA-ONLY** |
| Documented matching criteria | **IDEA-ONLY** |
| Confidence score on recommendation | **IDEA-ONLY** |

---

## Passport

### Data collection
| Item | Status |
|---|---|
| Auth (email / password) via Supabase Auth | **CODE-NO-TESTS** |
| Health metrics (10 fields: weight, RHR, HRV, sleep, steps, energy, anxiety, mood, meds, primary goal) | **CODE-NO-TESTS** (since 2026-04-22 migration; before that, silently 400'd) |
| Conditions, wellness_goals, medications | **CODE-NO-TESTS** |
| Conversation history with embeddings (Care Twin) | **CODE-NO-TESTS** since `999330f` |
| ISI session score (currently sessionStorage only) | **CODE-NO-TESTS** for the modal; HALF-BUILT for persistence |
| Stripe customer_id, active_protocol, citizenship_status | **CODE-NO-TESTS** (with the Longevity bug above) |
| Wellness focus chips | localStorage only; **HALF-BUILT** for server persistence |
| Per-dimension scores | LIVE since wire 4–6 (`computeDimensionScores`) — heuristic v1 |
| BHI composite score (persisted) | **CODE-NO-TESTS** since wire 5 |

### Retention / deletion / export
| Item | Status |
|---|---|
| Clear all (localStorage + Supabase row) | **CODE-NO-TESTS** | `index.html:7537` |
| Export full passport (JSON download) | **CODE-NO-TESTS** | `exportFullPassport` |
| FHIR R4 export (Patient + Observations) | **CODE-NO-TESTS** | `index.html:9972` |
| Conversation deletion flow (purge `conversation_history`) | **IDEA-ONLY** — no endpoint, no UI |
| Account deletion endpoint | **IDEA-ONLY** |
| Retention policy / TTL on embeddings | **IDEA-ONLY** — embeddings stored indefinitely |

### Privacy policy alignment
| Item | Status |
|---|---|
| Privacy policy page exists | **CODE-NO-TESTS** | `/privacy.html` |
| Policy lists every data type collected (matches code) | **UNKNOWN** — not audited line-by-line |
| Policy explains conversation embeddings stored as vectors | **UNKNOWN** |
| Policy explains BHI score persisted | **UNKNOWN** |
| GDPR / CCPA opt-out flow | **IDEA-ONLY** |

### HIPAA readiness
**The platform is NOT HIPAA-compliant.** This is correct given:
- No BAA with Supabase (Supabase free/pro tiers do not include BAA by default)
- No BAA with OpenAI (OpenAI offers BAAs for enterprise; not in evidence here)
- No BAA with Render, Railway, Twilio, Plausible
- No audit logging of PHI access
- No data segregation between PHI and analytics
- Embeddings of health-related conversations stored without disclosure
- Service-role key used everywhere from the server — bypasses RLS entirely

**Audit recommendation:** the term "HIPAA" should not appear anywhere in marketing copy, in the deck, or in any state-procurement response unless and until BAAs are in place and PHI is logically segregated. The current text in CLAUDE.md and `index.html` should be checked for HIPAA claims. (None found in this audit — flag if you ever see one creep in.)

### Memory policy
| Item | Status |
|---|---|
| What ALVAI remembers across sessions | Conversation turns + 1536-dim embeddings; **stored for authenticated users only** |
| User opt-in / consent at the data-collection moment | **IDEA-ONLY** — no consent dialog before first save |
| User-visible "Alvai is remembering …" surface | **IDEA-ONLY** (per commit log notes "no reader surface yet") |
| User-visible "forget this conversation" control | **IDEA-ONLY** |
| Retention TTL | **IDEA-ONLY** |
| Embedding-content correlation safeguards (can someone reverse the embedding back to text?) | **CODE-NO-TESTS** — `conversation_history` stores both raw `content` and `embedding`. If the row is exposed, the text is right there. |

---

## Commerce rules — "Commerce follows care"

| Item | Status | Notes |
|---|---|---|
| The decision "should this user see commerce right now?" | **CODE-NO-TESTS, scattered** | Lives in *two* places: (a) `server.js:227 checkEmotionalIntent` flips an in-memory `EMOTIONAL_SESSIONS` set when keywords fire, and the SSE stream sends `{suppressCommerce:true}` to the client; (b) `index.html` shows/hides upsell cards based on that signal. |
| Is it in the domain layer? | **NO** | The keyword regex is in `server.js` (Application), the UI consequence is in `index.html` (Presentation). No isolated domain function. |
| Is it tested? | **NO** | No automated assertion that "if message contains 'crisis' then response has no upsell." |
| In-memory `EMOTIONAL_SESSIONS` Set | **CODE-NO-TESTS** | Server-local memory only — does **not** survive Render restart or scale-out. A second instance won't share state. |
| Per-mode commerce gating (vessel allowed, therapy suppressed, etc.) | **PROMPT-ONLY** | Each mode prompt instructs the model differently |
| Citizenship-tier gating of premium content | **NOT ENFORCED** | `citizenship_status` is read in 1 frontend place (display only). No `server.js` route checks it. |

---

## Identity / state modeling

The 2026-04-22 to 2026-05-21 wires shipped a real dimension engine (`index.html:8034–8377`) — this is the first time the platform has had **computed user state in code**. Before that, every dashboard number was hardcoded.

### Dimension scorers (9, pure functions of user data)
| Scorer | Status | Notes |
|---|---|---|
| `scoreSleep(data)` | **CODE-NO-TESTS** — v1 heuristic | `index.html:8062` |
| `scoreMind(data)` | **CODE-NO-TESTS** — v1 heuristic | `index.html:8076` |
| `scoreMovement(data)` | **CODE-NO-TESTS** — v1 heuristic | `index.html:8091` |
| `scoreNutrition` | **CODE-NO-TESTS** — v1 heuristic | |
| `scoreSocial` | **CODE-NO-TESTS** — v1 heuristic | |
| `scoreFinance` | **CODE-NO-TESTS** — v1 heuristic | |
| `scoreSpirit` | **CODE-NO-TESTS** — v1 heuristic | |
| `scoreRecovery` | **CODE-NO-TESTS** — v1 heuristic | |
| `scoreEcs` | **CODE-NO-TESTS** — v1 heuristic | |
| `computeDimensionScores(userData)` orchestrator | **CODE-NO-TESTS** | `index.html:8242` |
| `computeBHI(scores) → {bhi, tier}` | **CODE-NO-TESTS** — clamped mean | `index.html:8034`. Marked `v1-heuristic-pending-clinical-review`. |
| Tier banding (Foundations / Building / Thriving / Flourishing / Optimal) | **CODE-NO-TESTS** | Per `docs/bhi-migration-20260422.md` |
| Persistence (`profiles.bhi_score`, `profiles.bhi_updated_at`) | **CODE-NO-TESTS** since 2026-04-22 migration | |
| **Clinical signoff on the formula** | **NOT YET** | The migration doc explicitly states "v1 heuristic pending clinical review by Dr. Felicia Stoler." |
| Unit tests | **NONE** | These are pure functions — they are *exactly* what would be cheapest to unit-test, and no tests exist. |

### Coherence Index (CI) — `core/ci.js`
| Item | Status |
|---|---|
| Formula `(p*0.30)+(b*0.25)+(i*0.25)+(n*0.20)` | **CODE in `core/ci.js`** (clean, 67 lines) — **NOT WIRED** to server |
| Fusion detection (regex over "I am …" patterns) | **CODE in `core/ci.js`** — **NOT WIRED** |
| Live CI scoring in `/api/chat` | **CODE-NO-TESTS** at `server.js:1233` — uses a **different, simpler** keyword heuristic, not the formula in `core/ci.js` |
| Persistence to `user_coherence` | **CODE-NO-TESTS** | `server.js:1233` |
| Schema columns (`ci_composite`, `velocity_class`, `bifurcation_proximity`, `quantum_cognition_eligible`) | **DEFINED, NEVER WRITTEN** | `add_coherence_index.sql` |

### Identity Stability Index (ISI) — `core/isi.js`
| Item | Status |
|---|---|
| 6-dimension formula (observer/returnVelocity/selfRef/roleContinuity/valuesClarity/futureOrientation) | **CODE in `core/isi.js`** — **NOT WIRED** |
| ISI smoothing (alpha by session count) | **CODE in `core/isi.js`** — **NOT WIRED** |
| Live ISI modal in `index.html` (4 Likert questions) | **CODE-NO-TESTS** | Modal works |
| Persistence to `user_coherence.isi_fusion_score` | **NEVER** — modal stores in sessionStorage only |

### Trajectory — `core/trajectory.js`
| Item | Status |
|---|---|
| Linear regression slope + volatility computation | **CODE in `core/trajectory.js`** — **NOT WIRED** |
| Label set (STABILIZING / LOOPING / DECLINING / BREAKTHROUGH_WINDOW) | **CODE in `core/trajectory.js`** — **NOT WIRED** |
| Used by server to set confidence_tier on prompt | **NEVER** |

### State integration — `core/state.js`
| Item | Status |
|---|---|
| `computeState(message, passport) → UserState` (intent + moment + user_type + fusion + CI + ISI + trajectory + confidence_tier) | **CODE in `core/state.js`** — **NOT WIRED** |
| Used by server | **NEVER** |
| Confidence-tier-driven prompt assembly (`hold` / `gentle` / `warm` / `balanced` / `direct`) | **CODE in `core/alvai.js`** — **NOT WIRED** |

**This is the biggest single gap in the domain layer.** Real domain code exists, isolated from infrastructure, with a clear API. It is the right shape. Nobody calls it.

---

## Testing & validation discipline

| Item | Status |
|---|---|
| Any test that runs on the live `server.js` | **NONE** |
| Any test that runs on `index.html` | **NONE** |
| Any test of `seo-engine.js` | **NONE** |
| Any test of `engine.py` | **NONE** |
| `bleu-core/test/loop.test.js` — tests `core/` modules | **EXISTS** — not run by any CI |
| CI runs tests on push | **NO** — `beast.yml` runs the data pipeline only |
| Lint configured (eslint, prettier) | **NO** |
| Type-checking (TypeScript / JSDoc / Pyright) | **NO** for live JS; the dead `alvai-v3.ts` and edge fn `index.ts` are TS but unwired |
| Schema migrations run in test environment first | **NO** — migrations apply directly to the live `sqyzboesdpdussiwqpzk` project |
| Manual QA checklist before deploy | **UNKNOWN** |
| Smoke tests on Render after deploy | **NO** in repo |

---

## What "clinically governed" actually means today

If a state grant reviewer asks **"show me where the clinical authority sits in the code,"** the honest answers are:

1. **The `ALVAI_CORE` system prompt** in `server.js:46–228` — a ~5 KB string. Dr. Stoler reviews the spirit; updates flow through git commits. There is no separate clinical sign-off mechanism.
2. **The `marketplace_practitioners` table** has columns `marketplace_approved` and `dr_felicia_reviewed`. No in-repo write path, so the curation happens directly in the Supabase dashboard.
3. **Stripe product creation** (the four protocols) — Dr. Stoler defines benefits + ingredients in Fullscript; bleu.live links out.
4. **Disclaimers in privacy / terms** — last reviewed: unknown date.
5. **Crisis hotlines in prompt** — relies on GPT to honor the instruction. Not enforced.

That is the entire clinical-governance surface. It is mostly **prompt + Supabase dashboard + Fullscript dashboard**, not code-resident rules.

This is not unusual for a wellness platform at this stage. It is, however, a smaller surface than "clinically governed digital care delivery" implies. **The honest framing is "clinician-curated wellness AI with link-out to clinician-curated protocols."** Promotion to "clinically governed digital care" requires (a) gates that fire deterministically in code, (b) evidence tiers attached to claims in data, (c) signoff history per protocol, and (d) crisis-response tests that pass before every deploy.

---

## Domain-layer priority list

1. **Wire `core/` into the live `server.js`.** Replace the regex-keyword CI scoring at `server.js:1233` with `computeCI` from `core/ci.js`. Replace the parallel ISI sessionStorage logic with `core/isi.js`. Result: one source of truth for these formulas.
2. **Make the dimension engine testable.** Pull `computeDimensionScores`, `computeBHI`, and the 9 scorers out of `index.html:8034–8377` into a module (or into `core/`) and write the unit tests. They are pure functions of objects; tests are easy.
3. **Code the Five Gates as deterministic checks.** A function `evaluateGates(message, user) → {pass, blockers[]}` that runs *before* the OpenAI call and *can refuse the call entirely* for hard violations. The crisis gate should also be re-run on the response text — a post-validator that injects 988 / 741741 if the model failed to.
4. **Add evidence tiers to data, not just prompts.** Add `evidence_tier` and `evidence_sources` columns to `protocols` and `products`. Surface the tier label in any place a claim is shown.
5. **Document the clinical signoff workflow** — even if it's just "Dr. Stoler reviews ALVAI_CORE in a PR before merge, signed off in commit message." The current implicit process is invisible to auditors.
6. **Crisis prompt-injection test corpus.** A list of 30–50 messages that should trigger 988 / 741741 / SAMHSA in the response. Run it in CI before every deploy.
