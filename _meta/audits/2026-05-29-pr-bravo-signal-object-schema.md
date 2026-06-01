# PR Bravo — Signal Object v1.1 Schema Audit

**Status:** Shadow-mode schema addition. No production wiring.
**Date:** 2026-05-29
**Authorization:** Captain + Dr. Felicia Joint Soul-Gate 2026-05-29.

## Scope

This PR adds the first standalone schema artifact for the future Prism / `decompose()` layer:

- `core/schemas/signal_object_v1.1.schema.json`
- `core/schemas/README.md`
- `tests/schemas/signal-object-v1.1.test.js`

The schema is JSON Schema 2020-12 and uses `$id: https://bleu.live/schemas/signal-object-v1.1.json`.

## Design rationale

The Total System Blueprint establishes doctrine boundaries that must be enforced before guidance generation, including source doctrine, pressure doctrine, and voice integrity. It also uses strict JSON Schema fixtures as the proof pattern for future runtime objects and calls for schema fixtures before safety-engine wiring.

The Source Document requires every BLEU surface to carry three voices at once: User voice / warmth, Clinical voice / restraint, and Infrastructure voice / durability. The Signal Object encodes these as `three_voices.user_voice`, `three_voices.clinical_voice`, and `three_voices.infrastructure_voice` assessments so the Prism output carries the presence of all three before response generation.

The same Source Document locks BLEU's sacred line: BLEU is not more generic AI brightness; it is a clinically governed lens for vulnerable moments. The Signal Object therefore requires risk classification, evidence need, needed information, and audit-oriented identifiers rather than free-form response copy.

The ICP Prism Doctrine defines six independent Citizen bands and the concrete band values used for Life Stage, Clinical Complexity, Financial Capacity, Readiness, Trust, and Dose Tolerance. The Signal Object encodes those in `six_bands` as fixed keys with enum-constrained `value` fields and confidence scores.

The ICP Prism Doctrine also defines V1.4, the Anxiety-Forward Young Adult, including SSRI context and a conservative safety watch-out. The sleep + SSRI fixture validates that this variant can be represented as a weighted blend with V1.4 at probability `0.55`, `primary_intent: "sleep"`, and `risk_level: "yellow"`.

The Pressure Architecture names six pressures that can bend BLEU away from its thesis: information, nervous-system, time, competitive, legal, and philosophical pressure. The Signal Object encodes these as `six_pressures` with fixed keys and a required discipline string for each pressure.

## Schema encoding summary

- **Three Voices:** fixed `three_voices` object with `user_voice`, `clinical_voice`, and `infrastructure_voice`; each carries `status` and `rationale`.
- **Six Bands:** fixed `six_bands` object with `life_stage`, `clinical_complexity`, `financial_capacity`, `readiness`, `trust`, and `dose_tolerance`; each carries `value`, `confidence`, and optional `rationale`.
- **Six Pressures:** fixed `six_pressures` object with `information`, `nervous_system`, `time`, `competitive`, `legal`, and `philosophical`; each carries pressure status and discipline.
- **Variant blend:** array of variant-weight objects with `variant_id`, human-readable `label`, and `probability` constrained to `0 <= p <= 1`.
- **Safety posture:** `risk_level`, `risk_flags`, `needed_info`, `commerce_intent`, and `evidence_need` are required so the downstream Arbiter/Decision Object can inspect the complete signal.

## What this PR does not do

- Does not modify `server.js`.
- Does not modify `/api/chat` or any route handler.
- Does not wire validation into production traffic.
- Does not modify Supabase migrations.
- Does not modify `core/safety/canonical_crisis_patterns.js`.
- Does not change the `MODE_PROMPTS` catalog.
- Does not activate any new clinical claim.

## Forward path

PR Charlie should add the Decision Object schema. PR Delta should add the Trust Packet / Ledger Entry schema. Runtime wiring remains future work and should require separate Captain Soul-Gate, Dr. Felicia review where clinical claims or safety behavior activate, and smoke tests after wiring.

## Source references

- Total System Blueprint doctrine boundary and schema-fixture path: `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md:50-61`, `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md:318-328`.
- Source Document Three Voices and sacred line: `_meta/doctrine/source_document_v1.md:24-31`, `_meta/doctrine/source_document_v1.md:43-47`.
- ICP Prism Doctrine Six Bands and V1.4 scenario: `_meta/doctrine/icp_prism_doctrine_v1.md:33-117`, `_meta/doctrine/icp_prism_doctrine_v1.md:214-224`.
- Pressure Architecture Six Pressures: `_meta/doctrine/pressure_architecture_v1.md:1-38`.
