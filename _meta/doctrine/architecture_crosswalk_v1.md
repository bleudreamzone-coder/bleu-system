# BLEU Architecture Crosswalk v1

## Purpose

This document reconciles BLEU doctrine language with the live runtime loop. It establishes the canonical mapping between Prism, Arbiter, Ledger, Alvai, Return, repo schemas, and the current `/api/chat` implementation.

## Canonical Loop

Raw user message
→ Prism / HEAR / decompose
→ Signal Object
→ Arbiter / GOVERN / decide
→ Decision Object
→ Alvai / RETURN / respond
→ User-facing response
→ Ledger / RECORD
→ Trust Packet
→ Return / outcome checkpoint / follow-up

## Doctrine-to-code crosswalk table

| Doctrine name | Loop phase    | Function                              | Data object                                 | Current live code status                                                               | Canonical future                                    |
| ------------- | ------------- | ------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Prism         | HEAR          | `decompose(msg, ctx)`                 | Signal Object v1.1                          | implicit classification inside `server.js`; no formal object emitted                   | explicit `signal` object emitted per chat           |
| Arbiter       | GOVERN        | `decide(signal, rules)`               | Decision Object v1.1                        | `detectCrisis()`, `openWindowGate()`, `getCommerceGate()` live but monolithic          | explicit `decision` object emitted per chat         |
| Ledger        | RECORD        | `record(decision, response, outcome)` | Trust Packet v1.1                           | partial writes to `conversation_memory` and `user_coherence`; Trust Packet not emitted | explicit `trust_packet` generated and stored/logged |
| Alvai         | RETURN        | `respond(decision, packet)`           | Citizen-facing output                       | live stream on `/api/chat`                                                             | remains live voice layer                            |
| Return        | FOLLOW-UP     | outcome checkpoint                    | `outcome_checkpoint` + `follow_up_schedule` | Twilio follow-up partial                                                               | formal outcome loop                                 |
| Kaleidoscope  | HEAR sub-read | part of `decompose()`                 | no separate object                          | doctrine concept only                                                                  | remain embedded in Prism, not separate module       |

## Critical correction

The architecture is not missing. The canonical map already exists in doctrine. The gap is that the live runtime does not yet emit the formal Signal, Decision, and Trust Packet objects. This creates doctrine/code drift.

The v0 bridge in `server.js` closes the first observability gap without adding doctrine, renaming agents, changing ALVAI voice, or creating a second architecture. The live chat routes now construct a `signal_v0`, `decision_v0`, and `trust_packet_v0` from existing gates: crisis detection, open-window routing, commerce restraint, response metadata, and memory-write status.

## Runtime v0 bridge

The v0 bridge is observe-only. It builds the objects in memory and logs only structured classification metadata in development/test diagnostics. It does not persist packets to Supabase yet, does not write to a `trust_packets` table, and does not include raw user messages or PII. Persistence must wait until the Trust Packet storage path and RLS posture are explicitly verified.

Both live chat routes are covered:

- `/api/chat`, the primary Render Node route used by the browser stream path.
- `/api/chat/stream`, the parallel stream route that still exists and must not silently drift.

The internal objects are not exposed to citizen-facing chat responses by default. The user still receives only ALVAI's streamed response and existing SSE control events.

## `night_reset` status

The `night_reset` Deno/Supabase slice appears to be a proof-of-concept or reference implementation of the loop, but it is not currently the live frontend path if the frontend calls Render `/api/chat`. It must either be folded in as the reference implementation or retired as an orphaned prototype. BLEU should not maintain three competing expressions of the same loop: monolith, scaffold, and edge prototype.

## Verification

Run the v0 bridge diagnostic from the repository root:

```bash
BLEU_TEST_TRUST_PACKET_V0=1 node server.js
```

The diagnostic exercises a normal `/api/chat`-shaped payload through the same Trust Packet v0 builder used by `/api/chat` and `/api/chat/stream`. It confirms that:

- `signal_v0` is created.
- `decision_v0` is created.
- `trust_packet_v0` is created.
- The normal chat path is a crisis-false path.
- The commerce gate does not force commerce on a first normal response.
- Response streaming metadata can be summarized without exposing raw response text.
- Raw user content is not carried into the logged Trust Packet metadata.

## Rule

No new doctrine layer should be added until the existing loop emits runtime objects.
