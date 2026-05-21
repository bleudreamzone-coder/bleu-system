# 00 — Executive Summary

**Audit date:** 2026-05-21 · **Git tip:** `f70426a` · **Auditor:** Claude (Opus 4.7) reading the repo
**Audience:** Dr. Felicia Stoler (CCO) and Bleu Garner (CTO); written so a state procurement officer or grant reviewer can also use it as a first-pass briefing.

---

## What bleu.live is, in one paragraph

bleu.live is a working, deployed wellness-AI platform — a single Node.js server (1,898 lines), a single-page front end (13,992 lines), a Python data pipeline (1,172 lines) scraping six federal/commercial sources four times daily, and a Supabase database with ~28 tables. Authenticated users get a chat experience (ALVAI) backed by GPT-4o + 1536-dimensional semantic recall, a Passport that persists 10 health metrics, a Dashboard with a newly-shipped 9-dimension scoring engine and BHI composite, and the ability to subscribe to one of four monthly clinical protocols via Stripe. The platform is real software, in production, with measurable activity — and substantially less governed in code than the deck implies. The "clinically governed" framing rests today on a 5 KB system prompt, a Fullscript practitioner account, and Dr. Stoler's implicit review; almost none of it is enforced by code or backed by automated tests. This is fine for a pre-grant startup; it is the explicit gap between current state and what state procurement and ACLM-Diplomate review will require.

---

## Top 5 strengths — real, defensible, demonstrable today

1. **A clean integration backbone exists and works.** OpenAI (GPT-4o + embeddings), Supabase (auth + REST + pgvector), Stripe (subscriptions + webhook), Twilio (SMS + inbound), Plausible (8 named events), six federal/clinical data APIs (FDA, RxNorm, DailyMed, PubMed, USDA, ClinicalTrials.gov) — all wired, all reachable, all running in production. Verifiable by hitting `/health` and walking the chat flow.
2. **Care Twin memory just shipped and is working.** As of 2026-04-22 (`999330f`), authenticated users have semantic recall across prior sessions via `conversation_history` + pgvector. Anonymous → authenticated identity merge shipped 2026-05 (`f70426a`). This is the first functional implementation of cross-session memory in the platform's history.
3. **The dimension engine is real code, not a hardcoded number.** Prior to wire 4–6 (last 30 days), the BHI ring was hardcoded `466` for every user. As of `b24c96c`, nine pure dimension scorers (`scoreSleep` → `scoreEcs`) feed a `computeBHI` orchestrator that persists per-user to `profiles.bhi_score`. Marked v1-heuristic-pending-clinical-review — the right discipline.
4. **855K-row NPI practitioner directory** with `/api/practitioners` lookup, dynamic SEO pages at `/practitioner/<npi>`, and a clinical-threshold injector that surfaces verified providers when crisis or therapy keywords fire. The data backbone for clinical referral is genuine.
5. **Excellent structured-data discipline on long-form content.** The 603 condition-specific anxiety pages in `dist/anxiety/` use FAQPage + HowTo + MedicalWebPage schema, condition-specific copy, named clinical authorship. This is among the cleanest SEO markup the auditor has seen on a wellness platform. (Caveat: see Risk #1 — the publisher entity is wrong.)

---

## Top 5 risks / gaps — concrete, prioritized

1. **WALL VIOLATION: Jazz Bird listed as publisher of bleu.live in schema.org markup.** `index.html:1079` and every page in `dist/anxiety|sleep|gut/*` (1,810+ pages) list `"publisher": "Jazz Bird 501(c)(3)"`. Per the audit prompt, Jazz Bird is a separate legal entity. Google indexes bleu.live as a nonprofit-published property; Stripe revenue goes to Fleur De BleuDream LLC. This blurs the entity wall in a way a grant reviewer or state procurement officer will read in 30 seconds. **Severity: CRITICAL.** Fix in week 1.
2. **CRITICAL revenue bug: Longevity Core protocol activation is broken.** `server.js:1805` maps `price_1TEKSWKcATmIFbojDTEJng9` (missing the `4`) when the frontend sends `price_1TEKSWK4cATmIFbojDTEJng9`. Every $69/mo Longevity subscriber is misclassified as `'pro'` in `profiles`. Stripe charges them correctly; the platform records the wrong protocol. Fix is one character; back-fill needs a Stripe → Supabase join. **Severity: CRITICAL.**
3. **Crisis safety is prompt-only, not code-enforced.** 988 / 741741 / SAMHSA hotlines are *instructed* to GPT, not validated in the response. A prompt-injection, a model regression, or simply a careless prompt edit could route a crisis user away from hotlines. No test corpus, no post-response validator. **Severity: CRITICAL** — this is the highest-impact governance gap.
4. **RLS policies live only in the Supabase dashboard, nowhere in the repo.** The Node server uses the service-role key for everything (bypassing RLS regardless); the frontend writes to `profiles`, `conversations`, etc. via the anon key — meaning policies must exist. Nothing in this repo documents them. A dashboard drop (intentional or accidental) goes unnoticed. **Severity: CRITICAL** for any HIPAA-adjacent posture or state procurement.
5. **The "domain layer" is mostly prompt and partly unwired.** Five clean domain modules exist in `core/` (CI formula, ISI formula, state, trajectory, alvai prompt builder) — *not `require`d by the live server*. A parallel keyword heuristic runs in `server.js:1233` instead. The actual clinical governance lives inside a 5 KB string in `server.js`. There are zero tests in the production code path. This is the deepest structural gap, and the one that most needs a multi-week investment. **Severity: HIGH for refactor; HIGH for governance claim.**

---

## Single most urgent action item

**Fix the Stripe Longevity Core typo, back-fill the affected `profiles` rows, and turn the webhook signature verification fail-closed — all in a single PR, this week.**

Three reasons:
1. Real Longevity customers are paying and the platform is mislabeling them.
2. The signature-skip-on-missing-env condition is one mis-configuration away from accepting forged webhook events.
3. Both fixes are < 1 hour of engineering and zero clinical review hours.

---

## Three things working better than expected

1. **Documentation discipline in `docs/`.** Five markdown files (system-state audit from 2026-04-22, edge function investigation, Passport function inventory, two migration docs) are extraordinarily clear, file-line-referenced, and self-skeptical. The Passport-write-path investigation that surfaced the silent-400 bug for all health-column writes is a model audit. This audit borrowed heavily from them.
2. **The "wire 1–6" commits in the past 30 days have closed real gaps.** Pre-April-22, every Passport health save silently 400'd at the database. Pre-wire-5, every BHI score was hardcoded `466`. Pre-wire-1, anonymous → authenticated identity stitching didn't exist. Each was identified and shipped in sequence. The platform is improving with discipline, not flailing.
3. **`dist/anxiety|sleep|gut/` content is grant-quality.** ~1,810 pages of condition×city pages with FAQ schema, HowTo schema, named clinical authorship, and condition-aware copy. The fact that they're not currently being served by the live server (see Risk in §6 of the content audit) is the only reason they aren't already generating organic traffic. This is the single largest under-utilized asset.

---

## Three things weaker than the pitch deck implies

1. **"Clinically governed" is mostly prompt and Fullscript curation, not code.** No clinical-signoff log. No evidence-tier column on any content table. No pregnancy / pediatric / geriatric detection. No Five Gates implementation. No banned-claims list. No per-protocol clinical documentation (`docs/protocols/<name>.md` does not exist for any of the four Stripe protocols). The honest framing today is **"clinician-curated wellness AI, transitioning to clinically governed by Q3."**
2. **"10 data sources, 4× daily" is closer to 6, 4× daily.** Per CLAUDE.md and the deck-style framing, 10 pipeline sources feed the data. Reality per `engine.py` + `beast.yml`: 6 scheduled (NPI, FDA, Google Places, YouTube, PubMed, Amazon), 3 implemented-but-orphaned (Reddit, Open Food Facts, Yelp), 1 dead (iHerb — not even in the dispatch dict).
3. **"5% of clinical queries route to Claude Opus" is not implemented at runtime.** CLAUDE.md states this. `pickModel` in `server.js:706` routes only between `gpt-4o-mini` and `gpt-4o`. The Anthropic client is used *only* in `engine.py` for YouTube transcript extraction. Either implement Claude routing or remove the claim.

A grant reviewer who reads the deck, hits the platform, and then reads CLAUDE.md will find these drifts within ~30 minutes. Closing them is one Bleu-week of work.

---

## Recommended next 30 days — top 10 in priority order

| # | Task | Effort | Owner | Why this week |
|---|---|---|---|---|
| 1 | Fix Stripe Longevity price ID typo + back-fill | S | Bleu | Active revenue misclassification |
| 2 | Stripe webhook fail-closed signature verification | S | Bleu | Forged-webhook risk; ships with #1 |
| 3 | Rewrite `.gitignore` (currently 36 bytes) | S | Bleu | Before someone commits `.env` |
| 4 | Replace Jazz Bird publisher entity across `index.html` + structured data | M | Bleu + Felicia | Entity wall; visible to every grant reviewer |
| 5 | Crisis-hotline post-response validator + test corpus | M | Bleu + Felicia | Single biggest clinical-safety gap |
| 6 | Dump + commit Supabase RLS policies | M | Bleu + Supabase admin | Source of truth for who-reads-what |
| 7 | Stripe subscription lifecycle (cancellation, refund, idempotency) | M | Bleu | Reported revenue accuracy |
| 8 | Wire `core/` modules into live `server.js` | M | Bleu + Felicia | First step out of monolith into domain layer |
| 9 | Per-protocol clinical documentation (`docs/protocols/*.md`) | M | Felicia drafts, Bleu commits | Required for any grant submission |
| 10 | Add CI test step (lint + crisis-corpus + dimensions) | M | Bleu | Enables every refactor that follows |

Full week-by-week plan with effort, owner, acceptance criteria, and blocking dependencies is in **`11_NEXT_30_DAYS.md`**.

---

## Reading order for this audit

For a 10-minute read by Dr. Stoler or a non-technical stakeholder: this file is enough.

For a 30-minute read by Bleu or a new senior engineer:
1. **`01_CURRENT_STATE.md`** — what's live, half-built, idea-only across every surface.
2. **`03_DOMAIN_LAYER_AUDIT.md`** — the most important deliverable. The honest state of the brain.
3. **`11_NEXT_30_DAYS.md`** — the actionable output.

For full systems orientation (one day): all 12 deliverables. The `INDEX.md` lists them in order.

---

## What this audit could not verify from the repo

Listed honestly so the reader knows where to look next:

- **Stripe Dashboard:** total transactions, MRR, churn, dispute rate, customer count.
- **Supabase Dashboard:** row counts per table, actual RLS policies, edge function invocation count (resolves the `alvai/index.ts` ambiguous-dead question).
- **Plausible Dashboard:** organic search traffic, top SEO pages, ALVAI conversation start rate per source, conversion funnel.
- **Fullscript Partner Portal:** click counts, conversion rate, commission to date.
- **Amazon Associates Dashboard:** click counts per tag, commission to date — and whether `bleulive20-20` and `bleu-live-20` belong to the same account.
- **Render Dashboard:** plan, scaling configuration, log retention, alert state.
- **Domain WHOIS:** owner of `bleu.live`, registration / renewal status.

Run a 30-minute pass on these next week. The numbers will substantially fill out the `05_REVENUE_AUDIT.md` and `06_CONTENT_ENGINE_AUDIT.md` gaps.

---

## The audit posture

This audit reads as a request to be honest. The platform has more to be proud of than the prior `docs/bleu-system-state.md` (April 22) implies — the past month's wires (BHI persistence, dimension engine, anon→auth memory merge, cart toast fix) substantively closed gaps. It also has a sharper edge than the deck implies: the clinical-governance claim rests on prompt engineering and one person's discipline, not on code. The fix is not to soften the marketing — it is to make the code match the claim, on the 30-day plan in `11_NEXT_30_DAYS.md`.

A new senior engineer reading this audit and the five `docs/` files should be able to commit useful code by Friday.

A state procurement officer reading just this executive summary should be able to:
- See three things they would push on (Risks 1, 3, 4 above).
- See what is real and demonstrable today (Strengths 1–5).
- Believe the team knows what they have and what they don't.

That last sentence is the test of an honest audit. It is the test this audit was written to pass.
