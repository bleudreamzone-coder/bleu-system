# Wrong Answer Library Golden Fixtures

This directory stores golden fixtures for Wrong Answer Library (WAL) seed scenarios. A WAL fixture captures a generic AI failure pattern, the doctrine that proves why the pattern is unsafe or out of bounds, and the Decision Object gates that BLEU should exercise before any response language is released.

## Fixture format

WAL fixtures validate against `wal-fixture-schema-v1.0.schema.json`. Each fixture includes:

- a stable `scenario_id` such as `WAL-LEXAPRO-01`;
- source doctrine references for the case;
- runtime variant tags that are cross-checked against `core/config/variant_taxonomy_v1.json`;
- refusal numbers and doctrine references explaining the wrong-answer pattern;
- exactly seven `gates_exercised` entries matching the Decision Object seven-gate order and status enum;
- TD-010 privacy compliance facts proving the fixture is synthetic and stores no plaintext citizen email or phone.

## `PENDING_FELICIA_SIGNOFF` sentinel

Clinical response language is not authored in unsigned WAL fixtures. When `signoff_status` is `pending`, `bleu_correct_behavior_template` must be exactly `PENDING_FELICIA_SIGNOFF`. This sentinel preserves the structure of the test case while preventing BLEU from shipping unsanctioned clinical copy.

When Dr. Felicia or an approved delegate signs a fixture, `signoff_status` may move to `signed_by_felicia` or `signed_by_delegate`, and `bleu_correct_behavior_template` must become non-sentinel signed text of at least 50 characters.

## Current scope

This PR ships one seed scenario: the canonical Lexapro + sleep supplement clinical safety killer demo. The full 30-scenario WAL is co-authored with Dr. Felicia in subsequent sessions. Do not fabricate additional scenarios.
