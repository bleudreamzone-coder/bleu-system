# PR Counterfactual Capture Infrastructure Audit — 2026-06-02

## Rationale

BLEU's Bible identifies the Counterfactual as the proof unit that distinguishes BLEU from generic wellness AI and requires every production ledger record to include one (`_meta/THE_BLEU_BIBLE.md`). PR #12's Trust Packet v1.1 schema makes `counterfactual.class` an enum, which gives this PR a stable source for priority classification (`core/schemas/trust_packet_v1.1.schema.json`). PR #19's CounterfactualReview v1.1 schema and adapter enforce that clinical counterfactual classes require `tier_2_felicia` or `tier_3_felicia_autonomous` authority (`core/schemas/counterfactual_review_v1.1.schema.json`, `core/agents/review/counterfactual_reviewer.js`). The expected companion Trust Packet logger path is `core/agents/trust/trust_packet_logger.js`; once the logging plumbing PR lands, a future wiring PR can feed emitted Trust Packets into this dormant capture bridge. Tier boundaries remain governed by `_meta/doctrine/decision_matrix.md`.

This PR is the bridge between emitted Trust Packets and human CounterfactualReview. It does not create live feeds, apply SQL, or enable queue writes by default.

## Priority classes and rationale

| Priority | Classes | Clinical rationale |
| --- | --- | --- |
| `P0_clinical_urgent` | `crisis_missed` | Missing a crisis signal is the highest clinical risk and starts a 24-hour review clock. |
| `P1_clinical_routine` | `unsafe_supplement`, `missed_referral`, `wrong_dose` | These are clinical safety classes that require Felicia/delegate review but are routine rather than crisis-urgent by default. |
| `P2_quality_review` | `overclaim`, `premature_commerce`, `voice_drift` | These protect BLEU truthfulness, restraint, commerce boundaries, and voice integrity. They are important but non-clinical in this default map. |
| `P3_documentation` | `privacy_leak`, `none` | These enter documentation/infrastructure follow-up here; privacy may receive a future separate security incident workflow, and `none` is retained as audit documentation. |

The mapping is an institutional default and starting point. Dr. Felicia may refine it in a future doctrine document.

## Staleness threshold defaults

| Priority | Threshold | Rationale |
| --- | ---: | --- |
| `P0_clinical_urgent` | 24 hours | Urgent clinical misses should be visible within one day. |
| `P1_clinical_routine` | 168 hours / 7 days | Routine clinical safety review fits a weekly review cadence. |
| `P2_quality_review` | 720 hours / 30 days | Quality/commerce/voice reviews fit a monthly governance cadence. |
| `P3_documentation` | 2160 hours / 90 days | Documentation follow-up fits a quarterly maintenance cadence. |

These are defaults only. Activation requires Dr. Felicia signoff.

## Triple-defense authority chain now present at queue depth

The authority moat now has these layers:

1. Trust Packet schema — `counterfactual.class` enum from PR #12.
2. CounterfactualReview schema — PR #19 if/then enforcement blocks clinical review by `tier_1_captain`.
3. CounterfactualReview adapter — PR #19 `validateAuthorityChain` blocks clinical Captain-tier submissions.
4. Review queue dequeue authority — this PR blocks `tier_1_captain` from dequeuing clinical priority items.
5. SQL CHECK constraint — this PR's dormant migration prevents clinical queue rows from being dequeued by Captain tier.

The prompt calls this the four-layer authority chain; in implementation terms, the queue and SQL additions make the chain five concrete enforcement surfaces while preserving the same institutional principle.

## Dormant-by-default activation sequence

1. Dr. Felicia signs the counterfactual priority map and staleness thresholds.
2. Dr. Felicia signs the reviewer authority chain and reviewer identity registry.
3. Captain applies the SQL migration via Supabase dashboard.
4. Captain sets `COUNTERFACTUAL_CAPTURE_ENABLED=true` in Render.
5. A future PR wires Trust Packet logger emission to `createCounterfactualCapture().capture()`.

## Forward path

- RLS exposure remediation audit.
- Shadow agent wiring scaffold.
- Future reviewer registry doctrine.
- Future Supabase persistence for queue enqueue/dequeue/staleness state.
- Future logger-to-capture wiring only after Felicia signoff.
