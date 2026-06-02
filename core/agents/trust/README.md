# Trust Packet Logging Plumbing

This directory contains dormant Trust Packet v1.1 logging plumbing for the future BLEU `record()` path. It is intentionally not wired into `server.js`, `/api/chat`, or any Supabase Edge Function in this PR.

## Doctrine anchors

- The Bible requires a Counterfactual for every interaction so BLEU can show what generic AI would have done wrong and why BLEU's restraint matters (`_meta/THE_BLEU_BIBLE.md:490-498`).
- Trust Packet v1.1 was introduced by the PR #12 / Delta schema work and currently lives at `core/schemas/trust_packet_v1.1.schema.json`.
- Refusal 18 says BLEU will not inflate doctrine faster than functioning reality; this logger therefore swallows infrastructure errors and remains dormant until activation is signed off.
- TD-010 discipline means raw response text is never persisted. `response_hasher.js` hashes and counts words in memory, and `trust_packet_factory.js` stores only `response.hash` and `response.word_count`.

## Files

- `response_hasher.js` exposes pure SHA-256 and word-count helpers.
- `trust_packet_factory.js` creates immutable Trust Packet envelopes with mandatory counterfactual proof.
- `trust_packet_logger.js` validates packets against Trust Packet v1.1 and emits to one of three dormant sinks.

## Sink modes

1. `buffer` — default sink. Accepted packets are retained in memory for tests and future wiring experiments.
2. `stdout` — writes accepted packets to stdout with a `[TRUST]` prefix for local diagnostics.
3. `supabase` — reserved for a future wiring PR. `flush()` throws `NotImplementedError` so nobody mistakes this PR for live persistence.

## Dormant activation sequence

Trust Packet persistence must only be activated in this order:

1. Dr. Felicia retention signoff.
2. Manual application of `supabase/migrations/2026-06-02-trust-packets-table.sql`.
3. Explicit `TRUST_PACKET_LOGGER_ENABLED=true` environment activation and optional `TRUST_PACKET_LOGGER_SINK` selection.
4. A future wiring PR connecting the logger to the delivery path.

## Refusal 18 swallow logic

`emit(packet)` never throws to the caller. Schema and TD-010 failures resolve `{ accepted: false, reason }`; infrastructure exceptions are caught, logged with a `[TRUST]` prefix, and converted to a rejection result. This prevents logging plumbing from pretending to be production care delivery before the surrounding system is ready.

## TD-010 hashing discipline

The factory accepts raw response text only long enough to compute a SHA-256 hash and whitespace word count. The returned packet does not include the raw text, plaintext email, or plaintext phone fields. TD-010 requires `pii_hashed=true`, `plaintext_email_stored=false`, and `plaintext_phone_stored=false`.
