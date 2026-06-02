# CounterfactualReview v1.1 — Shadow Reviewer Adapter

CounterfactualReview is the dormant human-review loop for the mandatory Trust Packet `counterfactual` field. `_meta/THE_BLEU_BIBLE.md` Part VIII states that the Counterfactual is BLEU's proof unit and that every ledger entry must include one. `core/schemas/trust_packet_v1.1.schema.json` makes that mandate executable by requiring `counterfactual.class`, `prevented_wrong_answer`, `bleu_difference`, and `confidence`.

This directory adds the review layer above that proof claim. A Trust Packet can claim that BLEU prevented a generic-AI wrong answer; a CounterfactualReview records whether a qualified human reviewer confirms, disputes, revises, or finds insufficient evidence for that claim. Without populated review records, Trust Packet Counterfactuals are narrative. With this schema and a future review history, they become audit-grade evidence for grants, VCs, institutional buyers, and acquirers.

## Authority chain

The reviewer tiers mirror `_meta/doctrine/decision_matrix.md`:

- `tier_1_captain` — BLEU/Captain operational authority for non-clinical surfaces.
- `tier_2_felicia` — Dr. Felicia decides, BLEU recommends.
- `tier_3_felicia_autonomous` — Dr. Felicia decides, system performs autonomously.

Clinical counterfactual classes must be reviewed by `tier_2_felicia` or `tier_3_felicia_autonomous`:

- `crisis_missed`
- `unsafe_supplement`
- `missed_referral`
- `wrong_dose`

Non-clinical classes may be reviewed at any tier, including `tier_1_captain`:

- `overclaim`
- `premature_commerce`
- `privacy_leak`
- `voice_drift`
- `none`

The `none` class is a documentation case: it means the Trust Packet had no specific prevented wrong answer because BLEU matched generic AI behavior.

## Triple-defense enforcement

Authority surfaces must not be bypassable, so enforcement exists at three layers:

1. Schema: `core/schemas/counterfactual_review_v1.1.schema.json` rejects clinical reviews submitted with `tier_1_captain`.
2. Adapter: `validateAuthorityChain()` returns `{ valid: false, reason: "clinical_class_requires_felicia_tier" }` for clinical Captain-tier attempts, and `submitReview()` rejects explicitly.
3. SQL: `supabase/migrations/2026-06-01-counterfactual-reviews-table.sql` mirrors the same rule with a table-level CHECK constraint.

This is defense in depth, not paranoia. The institutional moat is the reviewable record of when Felicia-level authority was required and enforced.

## Dormant activation sequence

This PR ships schema, stub adapter, SQL file, documentation, tests, and audit only. It does not wire production review records.

Activation requires:

1. Dr. Felicia signs `_meta/clinical/signoffs/[date]-stoler-signoff-counterfactual-reviewer-authority-chain.md`, specifying authorized reviewer IDs and tiers, including herself as reserved reviewer ID `stoler-f`.
2. Captain applies `supabase/migrations/2026-06-01-counterfactual-reviews-table.sql` through the Supabase dashboard.
3. Captain sets `COUNTERFACTUAL_REVIEWER_ENABLED=true` in Render.
4. A future PR wires the adapter to live Trust Packet records and emits persisted CounterfactualReview rows.

## Adapter behavior

`createReviewer(config)` defaults to disabled and to the `stub` sink. `submitReview()` constructs a CounterfactualReview record through `review_factory.js`, validates it, enforces authority, and returns the constructed record without persistence. The `supabase` sink intentionally throws `NotImplementedError` until a future PR wires live persistence after reviewer authority signoff.
