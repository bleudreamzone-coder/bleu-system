# PR Delta — Trust Packet v1.1 Schema Audit

**Date:** 2026-06-01  
**Branch:** `codex/pr-delta-trust-packet-schema-v1.1`  
**Status:** Shadow schema only; no runtime wiring, no Supabase migration, no production behavior change.

## Summary

PR Delta adds the Trust Packet v1.1 JSON Schema as the third foundation schema in the Total System Blueprint roadmap. The Trust Packet is the future `record()` proof envelope that joins a Signal Object, Decision Object, generated response metadata, mandatory Counterfactual, outcome plan, and audit/privacy facts into one defensible unit.

This PR intentionally does **not** activate `logTrustPacket`, does **not** create a `trust_packets` table, and does **not** wire validation into `/api/chat`, `server.js`, `supabase/functions/alvai/index.ts`, or any route handler.

## Doctrine and blueprint rationale

- `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` is the blueprint authority for foundation-schema work. The Delta authorization points to Section 7 for the Trust Packet schema. In the repository copy reviewed during this PR, Section 7 is titled **Crisis Safety** and requires crisis decisions to be recorded with commerce absent in crisis. This Trust Packet schema preserves that proof direction by making the record envelope explicit while keeping runtime behavior untouched.
- `_meta/doctrine/lens_architecture_doctrine_v1.md` defines the five-machine chain: Signal → Safety → Route → Outcome → Memory. Trust Packet v1.1 is the future Memory-machine artifact for preserving what happened so later routing can become sharper.
- The same Lens doctrine names TD-010 as privacy infrastructure: hash and audit everything, with RLS and idempotency as trust controls. Trust Packet v1.1 therefore carries a TD-010 audit object with `pii_hashed` plus const-false plaintext email and phone storage flags.
- `_meta/THE_BLEU_BIBLE.md` states that every ledger/trust packet record includes a Counterfactual and that this is BLEU's proof of differentiation. It also frames the Wrong Answer Library and Restraint Score as audit substance for proving BLEU's restraint-positive edge.

## Schema decisions

### Mandatory Counterfactual

`counterfactual` is required at the top level of `trust_packet_v1.1.schema.json`. Inside that object, the schema requires:

- `class`
- `prevented_wrong_answer`
- `bleu_difference`
- `confidence`

The text fields use `minLength: 1`, including for the `none` class. This means a Trust Packet cannot satisfy the schema by omitting the Counterfactual, leaving the prevented wrong answer blank, or treating the Counterfactual as an optional convention.

This matters because the Counterfactual is the proof unit. A Trust Packet without Counterfactual would be weak in grant review, acquirer diligence, institutional audit, or clinical review because it would fail to show what BLEU restrained, prevented, or intentionally matched.

### TD-010 privacy enforcement

The schema requires `audit.td_010` with:

- `pii_hashed` as a boolean audit fact
- `plaintext_email_stored` as `const: false`
- `plaintext_phone_stored` as `const: false`

The fixture suite proves the const-false email rule by rejecting a packet with `plaintext_email_stored: true`. The schema also applies the same const-false enforcement to phone storage.

### Outcome plan

The schema requires `outcome_plan.day_3`, `outcome_plan.day_7`, and `outcome_plan.day_30` sub-objects. This keeps the Trust Packet aligned with the Outcome and Memory machines: a route is not finished unless it can be followed, audited, or explicitly deferred.

## Files changed

- `core/schemas/trust_packet_v1.1.schema.json`
- `tests/schemas/trust-packet-v1.1.test.js`
- `core/schemas/README.md`
- `package.json`
- `_meta/audits/2026-06-01-pr-delta-trust-packet-schema.md`

## Tests and acceptance status

Acceptance commands for this PR:

1. `node --check server.js`
2. `npm run test:schemas`
3. `node tests/integration/per-mode-chat.smoke.js`

Expected schema fixture count after Delta: 5 Signal + 6 Decision + 5 Trust Packet = 16 total fixtures.

## Forward path

PR Echo should add the Variant Taxonomy runtime config as the next foundation artifact.

Future production wiring remains out of scope for this PR and should require separate authorization:

- Activate dormant `logTrustPacket`
- Create a `trust_packets` Supabase table or equivalent persistence model
- Connect Trust Packet generation to Memory Agent / Memory Machine behavior
- Wire runtime validation into production traffic

## Clinical and merge authority

Dr. Felicia clinical signoff is not required for this PR because it is a shadow schema only. It activates no clinical claim, no route, no supplement guidance, no commerce path, and no production behavior.

Captain Soul-Gate retains merge authority. This PR must not be merged by Codex.
