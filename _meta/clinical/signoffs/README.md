# Clinical Signoffs

Every safety rule, evidence claim, and protocol in the bleu.live domain layer requires sign-off by **Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM** (Chief Clinical Officer, bleu.live).

This folder is the audit trail. A grant reviewer, a state procurement officer, or a future engineer should be able to walk into this directory and read what was reviewed, when, by whom, against what evidence.

## File-naming convention

```
<rule-or-protocol>-<YYYY-MM-DD>-stoler.md
```

Examples:
- `crisis_validator-2026-05-21-stoler.md`
- `bhi_formula_v1-2026-06-01-stoler.md`
- `sleep_reset_protocol_v2-2026-07-12-stoler.md`

## Required sections in each signoff

1. **What was reviewed** — exact files, line ranges, or commit SHAs.
2. **Evidence reference** — PubMed IDs, Cochrane reviews, NICE guidelines, or clinical rationale.
3. **Decision** — APPROVED / APPROVED WITH CHANGES / REJECTED / PENDING.
4. **Approval date** — ISO 8601.
5. **Signature line** — Dr. Stoler's full name and credentials.
6. **Next review due** — calendar date the signoff expires and re-review is required.

## Rules

1. **No production deploy of safety / clinical logic without a current signoff.** "Current" means the signoff covers the exact code as-deployed; if the code changed, the signoff is stale.
2. **Signoffs do not back-date.** If a rule shipped before its signoff, that's a finding, not a fix. Note the gap in the signoff itself.
3. **PENDING signoffs are tolerable as scaffolds, but the deploy must be tagged with the same `pending-clinical-review` marker** (e.g., `DIMENSION_SCORING_VERSION = 'v1-heuristic-pending-clinical-review'` in `index.html`).
4. **A signoff covers the rule, not the engineer.** Re-signing happens when the rule changes, not when the engineer changes.

## Audit reference

`_meta/audit/2026-05-21/07_CLINICAL_GOVERNANCE_AUDIT.md` — the audit that surfaced the lack of a signoff log as a CRITICAL governance gap.
