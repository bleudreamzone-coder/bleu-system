# Clinical Signoffs

This directory is the durable signoff log for Dr. Felicia Stoler's clinical and professional authority surfaces in bleu.live operations. A grant reviewer, state procurement officer, acquirer, future Captain, or future engineer should be able to read this directory and understand what Dr. Felicia reviewed, when she reviewed it, what she decided, what scope the decision covers, and how the decision can be revoked or superseded.

This directory may contain historical signoffs that predate the current convention. New Dr. Felicia signoffs should use the convention below unless a later doctrine version supersedes it.

## Current naming convention

```text
[YYYY-MM-DD]-stoler-signoff-[topic-kebab-case].md
```

Examples:

- `2026-06-06-stoler-signoff-agent-boundary-review.md`
- `2026-06-06-stoler-signoff-medication-safety-language.md`
- `2026-06-06-stoler-signoff-referral-wording.md`

Revocations use the related pattern:

```text
[YYYY-MM-DD]-stoler-revocation-[topic-kebab-case].md
```

## Required fields

Each new signoff document must include these fields:

- `signed_by`
- `signed_at`
- `topic`
- `decision_summary`
- `rationale`
- `scope`
- `expires_at`
- `revocation_path`

## Template

Use `_template-stoler-signoff.md` as the starting point for new signoff documents. Copy the template, rename it with the current naming convention, and replace placeholder values with Dr. Felicia's signed content.

The leading underscore keeps the template visually distinct from real signoff records and sorts it near the top of directory listings.

## Cross-reference

See `_meta/doctrine/felicia_standards_v1.md` Section 6 for the doctrine-level documentation and signoff protocol that governs this directory.

## Empty-directory note

This directory may contain only `README.md`, `_template-stoler-signoff.md`, and historical records at PR merge time. Dr. Felicia files new signoff documents as she works through authorship sprints and converts PENDING_FELICIA_SIGNOFF sections into dated signed sections.

## Legacy safety rules retained

Historical signoff records in this directory were created under the earlier safety-rule convention. The following rules remain institutionally relevant unless superseded by a later doctrine version:

1. No production deploy of safety or clinical logic without a current signoff covering the exact deployed rule.
2. Signoffs do not back-date; if a rule shipped before signoff, the gap is recorded as a finding.
3. Pending signoffs are tolerable as scaffolds only when the corresponding deploy is explicitly tagged with a pending clinical review marker.
4. A signoff covers the rule or doctrine surface, not the engineer.

## Historical audit reference

`_meta/audit/2026-05-21/07_CLINICAL_GOVERNANCE_AUDIT.md` surfaced the absence of a durable signoff log as a critical governance gap.
