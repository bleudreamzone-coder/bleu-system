# PR Charlie Audit — Decision Object v1.1 Schema

**Date:** 2026-06-01  
**Status:** Shadow-mode schema and test fixtures only. No production behavior, route handling, Supabase migration, clinical claim activation, or commerce behavior changed.

## Purpose

PR Charlie adds the second production-ready schema from the Total System Blueprint: the Decision Object v1.1. The Decision Object is the future `decide()` proof unit for BLEU's trust-governed routing. It records that every named gate was evaluated exactly once, every refusal was evaluated exactly once, and the final action stayed inside the institutional authority model.

## Doctrine basis

- `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` Section 6 defines the Decision Object v1.1 schema direction and the fixed-position integrity requirement for gates and refusal checks.
- `_meta/doctrine/coca_cola_recipe_v1.md` defines the Seven Gates in order: crisis, safety/medication safety, evidence, claim boundary, clinical review, commerce, and outcome. It also defines Lowest-Regret Action Score routing as the mechanism for choosing the safest next best step under uncertainty.
- `_meta/doctrine/refusal_doctrine_v1.md` defines the 20 institutional refusals that the schema records as `refusal_checks[0..19]`.
- `_meta/doctrine/decision_matrix.md` defines Tier 1, Tier 2, and Tier 3 authority boundaries. The schema records this through the required `authority` object so future runtime decisions can be audited against governance responsibility.

## Schema rationale

`core/schemas/decision_object_v1.1.schema.json` uses JSON Schema draft 2020-12 and declares `$id` as `https://bleu.live/schemas/decision-object-v1.1.json`.

The schema requires:

- `decision_id`, `created_at`, `surface`, and `input_summary` for audit identity and provenance.
- `gates` as exactly seven fixed-position gate objects.
- `refusal_checks` as exactly twenty fixed-position refusal objects.
- `lras` with the locked formula string: `benefit*evidence - (safety_cost + trust_cost)*(1 - reversibility) + followup_value`.
- `allowed_response`, `commerce_permission`, `outcome_schedule`, `authority`, and `arbiter_priority_stack` so future runtime decisions carry response, commerce, follow-up, governance, and priority proof in the same object.
- `final_action` as an explicit terminal action.

## PrefixItems fix coverage

The schema keeps the corrected fixed-slot structure from the blueprint revision:

1. `gates` uses `prefixItems` for exactly one `crisis`, `medication_safety`, `evidence`, `claim_boundary`, `clinical_review`, `commerce`, and `outcome` gate, with `items: false` to reject extra or reordered entries.
2. `refusal_checks` uses `prefixItems` for refusal numbers 1 through 20, each resolved through a required `refusal_base` plus a per-slot `const` refusal number, with `items: false` to reject extra entries.
3. Fixture d rejects a Decision Object missing the `commerce` gate.
4. Fixture e rejects twenty empty refusal objects, proving each refusal slot requires complete `refusal_number`, `status`, and `action` fields.
5. Fixture f rejects an invalid status on refusal 7, proving per-refusal item validation is active and not merely array-length validation.

## Fixture coverage

`tests/schemas/decision-object-v1.1.test.js` adds six fixtures:

1. Valid crisis scenario: Gate 1 hard stop, Gate 6 commerce blocked, refusals 1 and 4 triggered, all 20 refusals present in correct positions.
2. Valid SSRI medication interaction scenario: Gate 2 reroute, Gate 6 commerce blocked, refusals 4, 5, and 9 triggered.
3. Valid standard wellness inquiry: all gates pass, commerce allowed, all 20 refusals present with non-triggered statuses.
4. Invalid missing `commerce` gate.
5. Invalid `refusal_checks` array containing twenty empty objects.
6. Invalid refusal 7 status enum value.

The test harness follows the Signal Object schema pattern: it uses AJV with formats when installed and falls back to a focused fixture validator when dependencies are unavailable.

## What this PR does not do

- Does not modify `server.js`.
- Does not modify `/api/chat` or any route handler.
- Does not modify `supabase/functions/alvai/index.ts`.
- Does not wire validation into production traffic.
- Does not change Supabase migrations.
- Does not change crisis pattern detection.
- Does not change the MODE_PROMPTS catalog.
- Does not alter the existing Signal Object schema.
- Does not activate clinical claims.
- Does not change commerce behavior.

## Forward path

After PR Charlie merges, PR Delta should add the Trust Packet v1.1 schema. Trust Packet should become the required proof envelope for the response and the mandatory counterfactual record, while this Decision Object remains the gate/refusal/LRAS proof unit.
