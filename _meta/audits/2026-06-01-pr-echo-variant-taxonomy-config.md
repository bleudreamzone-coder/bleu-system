# PR Echo — Variant Taxonomy v1 Runtime Config (Shadow Mode)

**Date:** 2026-06-01
**Branch:** `codex/pr-echo-variant-taxonomy-config`
**Status:** Audit filed for shadow-mode runtime config only. No classifier wiring, route behavior, Supabase function, crisis pattern, prompt catalog, or production behavior changed.

## Rationale

PR Echo creates the fourth foundation artifact after the Signal Object, Decision Object, and Trust Packet schemas: a versioned runtime config containing the ICP Prism Doctrine's named variants. The doctrine says variant classification is the bridge between category positioning and operational delivery, and that variants determine onboarding, calibration, dose, voice, commerce timing, escalation, routing, and outcome weights. `_meta/doctrine/icp_prism_doctrine_v1.md:16-27`

The BLEU Bible requires variants to remain probabilistic blends rather than fixed labels, with the Arbiter considering full blends for routing, dose, voice, and commerce decisions. `_meta/THE_BLEU_BIBLE.md:357-372` The Bible also lists 34 variants as the Signal Object's variant classification substrate. `_meta/THE_BLEU_BIBLE.md:243-247`

The Total System Blueprint remains the institutional schema roadmap and explicitly frames its contents as audit-only, not production behavior. `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md:1-3` Section 8 of that blueprint is medication-safety focused, so Echo treats taxonomy config as shadow data and does not let doctrine outrun functioning reality. `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md:195`

## Variant Count

| ICP | Label | Variants | Doctrine source |
|---|---:|---:|---|
| ICP 1 | Self-Pay | 11 | `_meta/doctrine/icp_prism_doctrine_v1.md:166-324` |
| ICP 2 | Hospitality Guest | 6 | `_meta/doctrine/icp_prism_doctrine_v1.md:328-414` |
| ICP 3 | Hospitality Worker | 5 | `_meta/doctrine/icp_prism_doctrine_v1.md:418-492` |
| ICP 4 | Clinical / Nutrition-Safe | 5 | `_meta/doctrine/icp_prism_doctrine_v1.md:496-558` |
| ICP 5 | Institutional | 7 | `_meta/doctrine/icp_prism_doctrine_v1.md:562-620` |

**Total:** 34 variants (11 + 6 + 5 + 5 + 7).

## Felicia-Mandatory Clinical Variants

The doctrine's signoff matrix marks `V4.x (all clinical variants)` as mandatory Felicia signoff. `_meta/doctrine/icp_prism_doctrine_v1.md:668-675` Echo encodes all five clinical variants with `felicia_mandatory: true`:

| Variant | Label | Naming citation | Mandatory citation |
|---|---|---|---|
| V4.1 | Multi-Med Older Adult | `_meta/doctrine/icp_prism_doctrine_v1.md:500-510` | `_meta/doctrine/icp_prism_doctrine_v1.md:668-675` |
| V4.2 | Pregnant/Trying-to-Conceive | `_meta/doctrine/icp_prism_doctrine_v1.md:512-522` | `_meta/doctrine/icp_prism_doctrine_v1.md:668-675` |
| V4.3 | Autoimmune Navigator | `_meta/doctrine/icp_prism_doctrine_v1.md:524-534` | `_meta/doctrine/icp_prism_doctrine_v1.md:668-675` |
| V4.4 | Mental Health + Lifestyle | `_meta/doctrine/icp_prism_doctrine_v1.md:536-546` | `_meta/doctrine/icp_prism_doctrine_v1.md:668-675` |
| V4.5 | Cardiovascular Concerned | `_meta/doctrine/icp_prism_doctrine_v1.md:548-558` | `_meta/doctrine/icp_prism_doctrine_v1.md:668-675` |

## Band Default Ambiguity

Most individual Citizen variants include explicit band signatures in the doctrine. Echo encodes conservative single-value defaults from those signatures using valid Signal Object enum values so cross-schema integrity can be tested.

The institutional buyer variants (`V5.1`-`V5.7`) are explicitly organizational profiles, not individual Citizens, and do not include six-band signatures. `_meta/doctrine/icp_prism_doctrine_v1.md:562-620` Echo therefore uses conservative valid Signal Object enum placeholders for those six-band defaults and records a `default unknown` watchout on each V5 entry.

One additional ambiguity: the requested placeholder examples (`L0_unknown`, `C_unknown`, `R0`, `T0`, `D1`) do not exactly match the current Signal Object enum strings. Echo prioritizes cross-schema integrity by using the current valid enum strings, such as `R0_pre_contemplation`, `T0_hostile`, and `D1_micro`, and noting uncertainty in watchouts where applicable.

## Forward Path

PR Foxtrot follows with the Wrong Answer Library skeleton. Felicia clinical signoff is not required for this PR because the taxonomy is shadow-mode config data only. Felicia clinical signoff **will** be required when this taxonomy is wired to live classifier behavior, clinical routing, supplement logic, or response generation.
