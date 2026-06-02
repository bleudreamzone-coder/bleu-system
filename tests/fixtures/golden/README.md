# Golden WAL Fixtures

Golden Wrong Answer Library (WAL) fixtures encode canonical examples of what generic AI would do wrong and which BLEU gates/refusals must catch the failure mode.

## Format

Each fixture validates against `wal-fixture-schema-v1.0.schema.json` and includes:

- `scenario_id`, `schema_version`, and human label.
- Doctrine references that justify the scenario.
- Variant tags tied to `core/config/variant_taxonomy_v1.json`.
- The generic wrong-answer pattern BLEU must avoid.
- Refusals and Seven Gate expectations exercised by the scenario.
- TD-010 compliance fields proving no real Citizen data or plaintext contact information is stored.

## PENDING_FELICIA_SIGNOFF sentinel

Clinical behavior templates are not authored before Dr. Felicia signoff. When `signoff_status` is `pending`, `bleu_correct_behavior_template` must equal `PENDING_FELICIA_SIGNOFF` exactly. Tests reject pending fixtures that contain substitute clinical language.

## Current scope

Only the Lexapro + sleep supplement killer demo ships in this PR. The full 30-scenario Wrong Answer Library is future co-authored work with Felicia and should not be inferred from this single fixture.
