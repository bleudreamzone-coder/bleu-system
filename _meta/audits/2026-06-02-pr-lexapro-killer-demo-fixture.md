# PR Lexapro Killer Demo Fixture Audit

## Rationale

This PR adds one Wrong Answer Library (WAL) seed scenario for the canonical Lexapro + sleep supplement killer demo. The BLEU Bible defines the WAL as the test harness proving what generic AI would do wrong, and its example V1.4 entry identifies the Lexapro/SSRI scenario, serotonergic supplement risk, commerce suppression, and Felicia signoff requirement. `_meta/THE_BLEU_BIBLE.md:447-488`

The ICP Prism Doctrine defines V1.4 as the Anxiety-Forward Young Adult profile and explicitly names Lexapro/Zoloft context, supplement and lifestyle support, and SSRI contraindication language for St. John's Wort, 5-HTP, and SAMe. `_meta/doctrine/icp_prism_doctrine_v1.md:214-226` It also marks V1.4 / Anxiety on SSRI as mandatory Felicia signoff territory. `_meta/doctrine/icp_prism_doctrine_v1.md:668-674`

The runtime Variant Taxonomy confirms `V1.4` exists, labels it `Anxiety-Forward Young Adult`, marks `felicia_mandatory` true, and forbids serotonergic supplement recommendation language. `core/config/variant_taxonomy_v1.json:111-143`

The refusal basis is refusal 4 (`Will not let commerce override safety`), refusal 5 (`Will not claim to diagnose`), refusal 9 (`Will not allow unsafe claims past clinical review`), and refusal 13 (`Will not pretend certainty beyond evidence tier`). `_meta/doctrine/refusal_doctrine_v1.md:11-20`

The Decision Object schema remains the source of truth for seven gate names and gate status values. The WAL fixture schema and test cross-check fixture `gates_exercised` against `core/schemas/decision_object_v1.1.schema.json` rather than relying only on prompt memory.

## PENDING_FELICIA_SIGNOFF discipline

This PR intentionally does not author clinical response language. The Lexapro fixture sets `bleu_correct_behavior_template` to the exact `PENDING_FELICIA_SIGNOFF` sentinel while `signoff_status` is `pending`. The fixture schema enforces that exact sentinel for pending signoff. It also requires future signed Felicia/delegate fixtures to replace the sentinel with non-sentinel text of at least 50 characters.

This keeps the WAL structure testable now without pretending that engineering can sign clinical wording. The clinical behavior text stays under Dr. Felicia's authority.

## Gate status enum correction

A prior prompt attempt referenced gate status values that do not exist in main (`soft_warn`, `needs_human_signoff`). This corrected PR uses the actual Decision Object `gate_base.status` enum from `core/schemas/decision_object_v1.1.schema.json`: `pass`, `passed`, `blocked`, `needs_review`, `hard_stop`, and `reroute`.

The calibration audit was the visibility instrument that exposed the mismatch by inventorying the Day 83 schema/test state after PR #11 shipped Decision Object v1.1 and by recording the cumulative schema suite state through the latest merged infrastructure work. `_meta/audits/2026-06-02-calibration-audit-repo-state.md:61-69` `_meta/audits/2026-06-02-calibration-audit-repo-state.md:130-146`

## Forward path

Dr. Felicia signs the scenario Saturday by editing `bleu_correct_behavior_template` away from `PENDING_FELICIA_SIGNOFF`, setting `signoff_status` to `signed_by_felicia`, and attaching or citing a `signoff_doc`. Until that change lands, the fixture proves the wrong-answer pattern, refusal coverage, gate mapping, variant mapping, and TD-010 privacy posture only.
