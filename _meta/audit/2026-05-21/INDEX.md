# BLEU.LIVE Master Audit — 2026-05-21

**Auditor:** Claude (Opus 4.7) reading the codebase
**Audit prompt:** `/BLEU_LIVE_MASTER_AUDIT_PROMPT.md` (saved to repo root for re-runs)
**Git tip at audit time:** `f70426a` (wire 1: anon→auth conversation memory merge)
**Previous audit:** `docs/bleu-system-state.md` (2026-04-22, git tip `999330f`) — referenced throughout

---

## Deliverables

| # | File | One-line summary |
|---|---|---|
| 00 | [Executive Summary](00_EXECUTIVE_SUMMARY.md) | 1-page brief for Dr. Stoler / grant reviewer / state procurement. Top 5 strengths, top 5 risks, most urgent action, what's better and weaker than the deck implies, top 10 next steps. |
| 01 | [Current State](01_CURRENT_STATE.md) | What is LIVE / STAGED / HALF-BUILT / DOCUMENTED-ONLY / IDEA-ONLY across ALVAI, Vessel, Passport, Commerce, Learn/SEO, Near You, Practitioner Directory, Worksite, Admin tools. |
| 02 | [File Inventory](02_FILE_INVENTORY.md) | Tree of repo, every file classified by layer (P/A/D/I) and status. Single migration baseline. |
| 03 | [Domain Layer Audit](03_DOMAIN_LAYER_AUDIT.md) | Most important deliverable. Per-concept status: ALVAI engine, mode routing, safety, Five Gates, evidence tiers, protocols, Passport, commerce-follows-care. Most clinical "rules" are PROMPT-ONLY, not code-enforced. |
| 04 | [Infrastructure Audit](04_INFRASTRUCTURE_AUDIT.md) | Supabase, Stripe, Twilio, Fullscript, Amazon, OpenAI, every external API, deployment, CI. RLS policies are not in repo. Stripe webhook signature verification can be bypassed. |
| 05 | [Revenue Audit](05_REVENUE_AUDIT.md) | Honest revenue picture: code permits 4 commerce paths; Stripe Longevity bug misclassifies every paying customer; attribution is weak; dashboard data must come from Stripe / Plausible / Fullscript / Amazon (not in repo). |
| 06 | [Content Engine Audit](06_CONTENT_ENGINE_AUDIT.md) | 6,025 high-quality pre-rendered SEO pages on disk in `dist/` — not served by the live server. Sitemap.xml at root has 3 URLs. Wall-violation in schema.org publisher across 1,810+ pages. |
| 07 | [Clinical Governance Audit](07_CLINICAL_GOVERNANCE_AUDIT.md) | Per-surface review: who reviewed, when, what evidence tier, what disclaimers. Five Gates, evidence tiers, per-protocol clinical docs — all missing. BHI v1 explicitly pending clinical review (correct discipline). |
| 08 | [Tangled Files Report](08_TANGLED_FILES_REPORT.md) | Refactor priority list. `index.html` (13,992 L) #1; `server.js` (1,898 L) #2; `engine.py` #3. Sequencing principle: extract pure domain first, then peel off integrations, then tabs. |
| 09 | [Security and Privacy Audit](09_SECURITY_AND_PRIVACY_AUDIT.md) | No secret leaks found (anon key public by design; no service-role JWT). But: `.gitignore` is 36 bytes, RLS in dashboard only, no rate limit, no OWASP headers, no consent on conversation embeddings. |
| 10 | [Tech Debt Register](10_TECH_DEBT_REGISTER.md) | 60 items, ID'd TD-001 to TD-060, severity-tagged. 5 CRITICAL, 22 HIGH, 21 MEDIUM, 12 LOW. Priority lenses for revenue / clinical / security / refactor. |
| 11 | [Next 30 Days](11_NEXT_30_DAYS.md) | Week-by-week plan. Week 1 emergency fixes, Week 2 domain layer foundations, Week 3 infrastructure cleanup, Week 4 refactor of tangled files. Each task: effort, owner, blocked-by, acceptance criteria. ~230 engineer hours + ~26 clinical hours + ~8 legal hours. |

---

## How to use

- **First-time read (10 min):** open `00_EXECUTIVE_SUMMARY.md`. Stop.
- **Decision-making (30 min):** `00_EXECUTIVE_SUMMARY.md` → `01_CURRENT_STATE.md` → `11_NEXT_30_DAYS.md`.
- **Engineer onboarding (1 day):** read in order. Cross-reference with `docs/bleu-system-state.md` (the prior audit, still ~95% accurate) and the three migration notes in `docs/`.
- **Grant submission prep:** `00_EXECUTIVE_SUMMARY.md` (three things weaker than the deck), `07_CLINICAL_GOVERNANCE_AUDIT.md` (what "clinically governed" requires), `06_CONTENT_ENGINE_AUDIT.md` (Jazz Bird wall violation must be fixed first).
- **Re-audit in 90 days (2026-08-19):** rerun the audit prompt (`/BLEU_LIVE_MASTER_AUDIT_PROMPT.md`), produce `_meta/audit/2026-08-19/`, diff against this one.

---

## Sign-off criteria (from the audit prompt)

- [x] All 12 deliverable files exist
- [x] Every file in the codebase is classified in `02_FILE_INVENTORY.md`
- [x] Every domain concept is statused in `03_DOMAIN_LAYER_AUDIT.md`
- [x] The honest revenue picture is documented in `05_REVENUE_AUDIT.md` (with explicit "UNKNOWN — pull from Stripe dashboard" where the repo cannot answer)
- [x] No secrets are found in the public repo (confirmed via grep + git log)
- [x] `11_NEXT_30_DAYS.md` plan has owners, estimates, and acceptance criteria
- [x] `00_EXECUTIVE_SUMMARY.md` is readable in 10 minutes
- [x] A new senior engineer can orient in under one day (cross-referenced with `docs/bleu-system-state.md`)

---

## What the audit deliberately did not do

- Open the Supabase, Stripe, Render, Plausible, Fullscript, or Amazon dashboards (no auth available to this auditor). Every number that requires a dashboard is marked **UNKNOWN — pull from `<system>`** in the relevant deliverable.
- Run `npm audit` (no lockfile in repo).
- Run the test suite (none exists in the production code path).
- Diff against the prior audit line-by-line. Instead, references prior audit findings where they remain accurate; updates them where the past month's wires changed reality.
- Make code changes. This is read-only.

The audit is complete and reproducible. Re-run the prompt against a future git tip to produce a diff-able successor.
