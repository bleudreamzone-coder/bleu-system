# Trust Packet Logging Plumbing

This directory contains dormant-by-default Trust Packet logging infrastructure. It ships the logger, factory, and response hashing utility that future Decision + Response emission paths can use after clinical retention signoff and migration application.

## Source of truth

- `_meta/THE_BLEU_BIBLE.md` defines `record()` as the ledger function and says the Ledger Entry / Trust Packet carries the decision, response, outcome plan, and Counterfactual proof field.
- `_meta/THE_BLEU_BIBLE.md` also mandates that every Ledger Entry include Counterfactual evidence; there is no production version where Counterfactual is optional.
- `core/schemas/trust_packet_v1.1.schema.json` is the implementation source of truth for this PR. The logger validates against that schema and the factory constructs packets to match it.
- `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` does not contain a dedicated Trust Packet logging section. It does list runtime Decision Object logging as a near-term safety-engine workstream, so this PR is the honest origin for the standalone Trust Packet logger plumbing.

## Architecture

`trust_packet_factory.js` creates schema-shaped Trust Packet v1.1 records from a Decision Object UUID, Signal Object UUID, privacy-preserving response metadata, mandatory Counterfactual, outcome plan, and audit context.

`trust_packet_logger.js` validates candidate packets before accepting them into a sink. It does not cross-validate the Decision Object reference; the Decision Object is validated separately at construction time, and the logger only treats `decision_id` as a UUID reference.

`response_hasher.js` provides pure SHA-256 hashing and whitespace word counting for response text.

## Sink modes

- `buffer`: in-memory only, for tests and zero-I/O development. This is the default sink.
- `stdout`: appends `JSON.stringify(packet)` to stdout with a `[TRUST]` prefix for dev observability.
- `supabase`: intentionally incomplete. `flush()` throws `NotImplementedError` until a future PR wires real writes after Dr. Felicia retention signoff and Captain SQL migration application.

## TD-010 response hashing discipline

Response text is never persisted in Trust Packets. The factory stores only:

- `response.hash`: SHA-256 hex digest of the raw response text.
- `response.word_count`: whitespace-split word count.

This keeps the Trust Packet useful as an audit trail while reducing the TD-010 privacy surface.

## Dormant activation sequence

1. Dr. Felicia signs the retention policy and Trust Packet emission protocols from the Tier 4 master list.
2. Captain applies `supabase/migrations/2026-06-02-trust-packets-table.sql` via the Supabase dashboard.
3. Captain sets `TRUST_PACKET_LOGGER_ENABLED=true` in Render.
4. Captain sets `TRUST_PACKET_LOGGER_SINK=supabase` in Render.
5. A future PR wires `logger.emit()` calls into `server.js` Decision Object emission paths.

## Refusal 18 enforcement

The logger never throws from `emit()`. Caller/schema errors return `{ accepted: false, reason }`, including mandatory Counterfactual failures and TD-010 plaintext violations. Infrastructure errors are swallowed, logged with a `[TRUST]` prefix, and counted as drops.

## Schema drift note

The current `core/schemas/trust_packet_v1.1.schema.json` has no top-level `schema_version` property and stores TD-010 under `audit.td_010` with `pii_hashed`, `plaintext_email_stored`, and `plaintext_phone_stored`. The factory follows the schema exactly so created packets validate. The SQL file includes a `schema_version` column because that column is database metadata, not a JSON field inside the Trust Packet payload.

## Forward path

- Counterfactual capture infrastructure: build `CounterfactualReview` records from emitted Trust Packets.
- RLS audit: verify storage access boundaries before persistent logging is enabled.
- Shadow agent wiring scaffold: prepare Decision emission paths without violating dormant-by-default constraints.
