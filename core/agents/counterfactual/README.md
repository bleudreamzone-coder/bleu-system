# Counterfactual Capture Infrastructure (Dormant)

This directory provides the dormant bridge between Trust Packet emission and human CounterfactualReview. The Bible establishes the Counterfactual as BLEU's proof unit and requires every production ledger record to include one; this infrastructure turns that field into a prioritized review queue instead of an unworked log backlog (`_meta/THE_BLEU_BIBLE.md`).

## Source-of-truth inputs

- `_meta/THE_BLEU_BIBLE.md` — Counterfactual mandate and the institutional review loop from emission to durable audit evidence.
- `core/schemas/trust_packet_v1.1.schema.json` — PR #12 Trust Packet schema; `counterfactual.class` enum is the source of priority classification.
- `core/schemas/counterfactual_review_v1.1.schema.json` — PR #19 CounterfactualReview schema; clinical review classes require the Felicia tier authority chain.
- `core/agents/review/counterfactual_reviewer.js` — PR #19 adapter enforcement pattern via `validateAuthorityChain`.
- `core/agents/trust/trust_packet_logger.js` — companion Trust Packet logger path expected from the logging plumbing PR; this capture consumes records emitted by that logger when the future wiring PR lands.
- `_meta/doctrine/decision_matrix.md` — Tier 1/2/3 authority doctrine.

## Workflow

1. A Trust Packet is emitted with a mandatory `counterfactual` field.
2. `extractReviewTemplate(trustPacket)` converts it into a **partial** CounterfactualReview template.
3. `classifyPriority(counterfactual.class)` assigns institutional default priority.
4. `getStalenessThresholdHours(priority)` assigns the default staleness clock.
5. The dormant queue orders templates by priority, then `queued_at` age.
6. A future reviewer interface dequeues items only after reviewer authority is validated.
7. The reviewer submits the complete CounterfactualReview through the PR #19 review adapter.

The template intentionally omits final reviewer fields (`reviewer_id`, `reviewer_tier`, `verdict`, `verdict_reason`, confidence, etc.) until a human reviewer dequeues and submits.

## Priority classes

The priority classifier is a **STARTING POINT**. Dr. Felicia's clinical authority may refine the mapping in a future doctrine document; this PR ships only the institutional default.

| Priority | Counterfactual classes | Rationale |
| --- | --- | --- |
| `P0_clinical_urgent` | `crisis_missed` | A missed crisis signal can represent immediate safety risk and gets a 24-hour review clock. |
| `P1_clinical_routine` | `unsafe_supplement`, `missed_referral`, `wrong_dose` | Clinical safety risks require Felicia/delegate review but generally do not imply the same immediate crisis clock. |
| `P2_quality_review` | `overclaim`, `premature_commerce`, `voice_drift` | These items protect truthfulness, commerce restraint, and BLEU voice integrity; they are important quality reviews but not clinical dequeue items. |
| `P3_documentation` | `privacy_leak`, `none` | `privacy_leak` is documentation/legal-infrastructure follow-up under TD-010 logging constraints here; `none` records no-difference documentation. Future privacy remediation may add separate security incident workflows. |

## Staleness thresholds

Staleness thresholds are institutional defaults. Dr. Felicia may override them per clinical class in a future doctrine document.

| Priority | Threshold | Rationale |
| --- | ---: | --- |
| `P0_clinical_urgent` | 24 hours | Clinical urgent review must not sit unworked past one day. |
| `P1_clinical_routine` | 168 hours / 7 days | Routine clinical items receive a weekly clinical review clock. |
| `P2_quality_review` | 720 hours / 30 days | Quality, commerce-restraint, and voice-integrity reviews fit a monthly audit cadence. |
| `P3_documentation` | 2160 hours / 90 days | Documentation and no-difference items fit a quarterly maintenance cadence. |

`getStaleness()` returns `hoursElapsed`, `thresholdHours`, `isStale`, and `staleness_ratio`; a ratio greater than `1.0` means stale.

## Triple-defense authority chain at the queue layer

Clinical counterfactual review is guarded at multiple layers:

1. Trust Packet schema: `counterfactual.class` is constrained to the PR #12 enum.
2. CounterfactualReview schema: PR #19 if/then schema enforcement blocks clinical reviews by `tier_1_captain`.
3. CounterfactualReview adapter: PR #19 `validateAuthorityChain` blocks clinical Captain-tier submissions.
4. Review queue adapter: this PR blocks `tier_1_captain` from dequeuing clinical priority items.
5. SQL CHECK constraint: this PR's dormant migration prevents clinical rows from being dequeued by Captain tier.

The queue therefore refuses bypass before a reviewer ever reaches final review submission.

## Dormant-by-default activation sequence

Activation requires all of the following, in order:

1. Dr. Felicia signs counterfactual review priorities and staleness thresholds (Tier 2 master list).
2. Dr. Felicia signs the reviewer authority chain, including which `reviewer_id` values exist and which reviewer tiers they hold.
3. Captain applies `supabase/migrations/2026-06-02-counterfactual-review-queue-table.sql` via Supabase dashboard.
4. Captain sets `COUNTERFACTUAL_CAPTURE_ENABLED=true` in Render.
5. A future PR wires the Trust Packet logger to call `capture()` whenever a Trust Packet is emitted.

Default behavior is disabled. `getSink()` defaults to `stub`; the `supabase` sink is scaffold-only and throws `NotImplementedError` internally.

## Refusal 18 enforcement

Capture and queue infrastructure failures are swallowed with `[CF_CAPTURE]` and `[CF_QUEUE]` prefixes so a logging/queue outage never degrades the user-facing product path. Schema validation failures resolve with explicit `accepted: false` or `enqueued: false` reasons. Authority violations intentionally throw because they are caller discipline failures, not infrastructure failures.

## Forward path

- PR RLS exposure remediation audit.
- PR Shadow agent wiring scaffold.
- Future Trust Packet logger wiring after Felicia signoff.
- Future Supabase persistence and reviewer registry doctrine after Felicia signoff.
