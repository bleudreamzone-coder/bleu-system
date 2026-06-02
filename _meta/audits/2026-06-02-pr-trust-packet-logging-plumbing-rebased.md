# PR Audit — Trust Packet Logging Plumbing (Rebased Replacement)

**Date:** 2026-06-02  
**Status:** Combined replacement content for conflict-blocked PR #27.  
**Scope:** Dormant Trust Packet logger/factory/hasher, SQL draft, docs, and schema tests.

## Doctrine citations

- Bible Counterfactual mandate: `_meta/THE_BLEU_BIBLE.md:490-498` requires Wrong Answer Library / Counterfactual proof so BLEU can demonstrate restraint instead of generic AI speed.
- Trust Packet v1.1 schema: `core/schemas/trust_packet_v1.1.schema.json` requires `response`, `counterfactual`, `outcome_plan`, and `audit` with TD-010 fields.
- Refusal 18: `_meta/doctrine/refusal_doctrine_v1.md:25` says BLEU will not inflate doctrine faster than functioning reality.

## Rebase rationale

This file documents a REBASED replacement for PR #27 (`codex/add-trust-packet-logging-plumbing`), which was blocked by `package.json` merge conflicts after PR #25 merged. This replacement ships the same intent from current main and appends its schema test without dropping any existing test entries, including the counterfactual capture test already present on main.

## Safety posture

- Logger is dormant by default: `TRUST_PACKET_LOGGER_ENABLED` must be truthy to emit.
- Raw response text is not persisted; only SHA-256 hash and word count are stored.
- Supabase persistence is a migration draft only and `flush()` throws `NotImplementedError` for the `supabase` sink until a future wiring PR.
- `emit()` uses Refusal 18 swallow logic: no caller throw for logging infrastructure failures.
