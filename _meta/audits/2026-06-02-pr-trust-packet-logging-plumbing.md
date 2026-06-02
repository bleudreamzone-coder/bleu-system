# PR Trust Packet Logging Plumbing Audit

Date: 2026-06-02
Branch: `codex/pr-trust-packet-logging-plumbing`

## Rationale

`_meta/THE_BLEU_BIBLE.md` defines `record()` as the Ledger function that logs the Decision Object, response, risk rationale, and outcome tracking into a Ledger Entry / Trust Packet. It also states that the Counterfactual is part of every record and is what makes BLEU institutionally defensible.

The same Bible Counterfactual section says the Counterfactual is BLEU's proof unit and mandates that every Ledger Entry include Counterfactual evidence. This PR implements dormant plumbing for that proof unit without wiring runtime emission.

`core/schemas/trust_packet_v1.1.schema.json` is the PR #12 schema source of truth. The logger consumes it for validation and the factory constructs records that validate against it. The schema requires `packet_id`, `signal_id`, `decision_id`, `response`, `counterfactual`, `outcome_plan`, and `audit`; it requires `counterfactual.prevented_wrong_answer`; and it stores TD-010 under `audit.td_010`.

`_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` does not have a dedicated Trust Packet logging section. It honestly provides adjacent support by listing runtime Decision Object logging as a near-term safety-engine workstream. This PR is therefore the origin point for the standalone dormant Trust Packet logger plumbing.

## Dual Counterfactual enforcement

- `core/agents/trust/trust_packet_factory.js` throws when `counterfactual` is missing or when `counterfactual.prevented_wrong_answer` is empty. That is a caller construction error.
- `core/agents/trust/trust_packet_logger.js` rejects malformed packets with `{ accepted: false, reason: "counterfactual_missing_mandatory_field" }`. That is defense in depth for packets not created by the factory.

The Trust Packet cannot be accepted by this logger without the mandatory proof field.

## TD-010 privacy surface

Response text is never persisted in the Trust Packet. `core/agents/trust/response_hasher.js` computes a SHA-256 hex digest and word count; `core/agents/trust/trust_packet_factory.js` stores only `response.hash` and `response.word_count` alongside model and evaluator metadata.

The logger also rejects TD-010 plaintext violations if `plaintext_email_stored` or `plaintext_phone_stored` is true under either the schema path (`audit.td_010`) or the defensive compatibility path (`td_010_compliance`).

## Dormant-by-default activation sequence

1. Dr. Felicia signs the retention policy and Trust Packet emission protocols from the Tier 4 master list.
2. Captain applies `supabase/migrations/2026-06-02-trust-packets-table.sql` via the Supabase dashboard.
3. Captain sets `TRUST_PACKET_LOGGER_ENABLED=true` in Render.
4. Captain sets `TRUST_PACKET_LOGGER_SINK=supabase` in Render.
5. A future PR wires `logger.emit()` calls into `server.js` Decision Object emission paths.

## Refusal 18 swallow logic

`emit()` never throws to callers. Schema failures and TD-010 violations resolve as rejected results. Infrastructure failures are caught, logged with a `[TRUST]` prefix, counted as drops, and resolved as `{ accepted: false, reason: "infrastructure_error" }`.

The only intentional throw is `flush()` on the `supabase` sink, which raises `NotImplementedError` because persistent writes are forbidden until the future wiring PR.

## Forward path

- Future PR wires logger emission into `server.js` Decision Object emission paths after Felicia retention signoff and Captain SQL migration application.
- Counterfactual capture infrastructure builds `CounterfactualReview` records from emitted Trust Packets.
- RLS exposure remediation audit verifies that Trust Packet persistence is institutionally closed before activation.
- Shadow agent wiring scaffold can consume the same dormant proof infrastructure once emission is authorized.

## Schema drift surfaced honestly

The current Trust Packet v1.1 JSON schema in main does not include a top-level `schema_version` field and does not include `plaintext_phone_in_payload`; TD-010 currently requires only `pii_hashed`, `plaintext_email_stored`, and `plaintext_phone_stored` under `audit.td_010`. The factory follows the schema exactly to keep generated packets valid. The SQL migration keeps `schema_version` as a table column rather than a JSON payload field.
