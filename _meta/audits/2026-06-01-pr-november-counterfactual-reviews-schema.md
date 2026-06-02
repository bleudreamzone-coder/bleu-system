# PR November — CounterfactualReview v1.1 Schema

**Date:** 2026-06-01  
**Status:** Shadow schema, dormant adapter, migration file not applied

## Rationale

`_meta/THE_BLEU_BIBLE.md` Part VIII defines the Counterfactual as BLEU's proof unit and requires every ledger entry to include one. `core/schemas/trust_packet_v1.1.schema.json` makes that obligation concrete by requiring the Trust Packet `counterfactual` object and its `class` enum. PR November adds the human-review record that can confirm, dispute, require revision, or mark insufficient evidence for those claims.

`_meta/doctrine/decision_matrix.md` defines the operating authority tiers: Tier 1 for BLEU/Captain operational decisions, Tier 2 where Dr. Felicia decides and BLEU recommends, and Tier 3 where Dr. Felicia decides and the system performs autonomously. This PR encodes that clinical counterfactual review authority at schema, adapter, and SQL levels.

`_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` does not explicitly name `counterfactual_reviews`. Its closest relevant surfaces are Decision Objects as audit proof, the repository audit trail as institutional memory, and schema looseness as a known risk. This PR should therefore be treated as the origin of the explicit `counterfactual_reviews` schema surface.

## Triple-defense authority chain

Clinical counterfactual classes are `crisis_missed`, `unsafe_supplement`, `missed_referral`, and `wrong_dose`. These require `tier_2_felicia` or `tier_3_felicia_autonomous` review. `tier_1_captain` is rejected for those classes.

The authority chain is enforced three ways:

1. **Schema if/then:** `core/schemas/counterfactual_review_v1.1.schema.json` rejects clinical reviews where `reviewer_tier` is `tier_1_captain`.
2. **Adapter helper:** `core/agents/review/counterfactual_reviewer.js` exports `validateAuthorityChain()`, and `submitReview()` rejects explicit authority violations before persistence.
3. **SQL CHECK:** `supabase/migrations/2026-06-01-counterfactual-reviews-table.sql` includes `counterfactual_reviews_authority_chain_check` to mirror the schema-level rule in database form.

Three layers are required because authority surfaces must not be bypassable. If a future caller skips schema validation, the adapter still blocks. If a future caller bypasses the adapter, the database still blocks.

## Institutional importance

Without CounterfactualReview records, the Trust Packet Counterfactual field is an unverified claim. With this schema and a future populated review history, the field becomes audit-grade evidence that can be defended to grant reviewers, VCs, institutional buyers, and acquirers.

This is the reviewable bridge between BLEU's claim that it prevented a generic-AI wrong answer and a qualified human's record that the claim is confirmed, disputed, revised, or not yet supported by enough evidence.

## Felicia reviewer authority dependency

This PR does not register reviewer IDs beyond reserving `stoler-f` for Dr. Felicia Stoler in documentation. Actual reviewer registration requires her Tier 2 signoff on a future doctrine document at `_meta/doctrine/reviewer_registry_v1.md`, including which reviewer IDs exist and what tier each holds.

## TD-010 compliance

The schema enforces TD-010 posture by requiring `td_010_compliance` and setting `plaintext_email_stored` and `plaintext_phone_stored` to `const false`. The migration mirrors the same no-plaintext posture in the `td_010` JSONB CHECK constraint.

## Forward path

- PR Lima can build `weekly_scorecards` on the MetricEvent substrate.
- PR Mike can build `outcome_checkpoints`.
- Future PRs can wire CounterfactualReview to live Trust Packet records only after Felicia signs the reviewer authority chain and Captain enables the dormant adapter.
