# PR Audit — Lexapro Killer Demo Fixture (Rebased Replacement)

**Date:** 2026-06-02  
**Status:** Combined replacement content for conflict-blocked PR #26.  
**Scope:** One golden WAL fixture, its schema, docs, and validation tests.

## Doctrine citations

- Bible Wrong Answer Library example: `_meta/THE_BLEU_BIBLE.md:456-487` defines the V1.4 Lexapro/SSRI counterfactual pattern and the safety decision to block serotonergic supplement recommendations.
- Bible Killer Demo phase: `_meta/THE_BLEU_BIBLE.md:1091-1096` calls for the Lexapro + Sleep + Supplements scenario as a concrete test case.
- ICP Prism V1.4: `_meta/doctrine/icp_prism_doctrine_v1.md:214-226` defines Anxiety-Forward Young Adult and the SSRI + supplement contraindication watch-out.
- Felicia mandatory list: `_meta/doctrine/icp_prism_doctrine_v1.md:668-674` includes V1.4 (Anxiety on SSRI).
- Refusal doctrine: `_meta/doctrine/refusal_doctrine_v1.md:11-20` covers refusals 4, 5, 9, and 13.
- Variant taxonomy: `core/config/variant_taxonomy_v1.json` includes `V1.4` with SSRI interaction watchouts.
- Decision Object schema: `core/schemas/decision_object_v1.1.schema.json` defines Seven Gate names and `gate_base.status` values used by the fixture.

## PENDING_FELICIA_SIGNOFF discipline

The fixture intentionally uses `PENDING_FELICIA_SIGNOFF` for `bleu_correct_behavior_template`. This PR does not author clinical answer language before Felicia's review; it only encodes the safety shape and rejection of generic wrong-answer patterns.

## Rebase rationale

This file documents a REBASED replacement for PR #26 (`codex/update-lexapro-prompt-with-correct-enum-values`), which was blocked by `package.json` merge conflicts after PR #25 merged. This combined replacement ships fresh from current main and appends its schema test after the existing cumulative test chain.
