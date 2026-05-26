# Trust Packet v1 — canonical guidance-route record

**Status:** scaffold. Helper built (`buildTrustPacket` / `logTrustPacket` in `server.js`), NOT yet retrofitted onto routes.
**Written to:** `bleu_events.payload` with `event_type = 'trust_packet'`.
**Purpose:** one machine-readable record per meaningful guidance route, so every route is auditable, replayable, and learnable. This is the data form of the seven gates in `_meta/doctrine/coca_cola_recipe_v1.md`.

---

## Fields

| Field | Type | Allowed values | Required |
|---|---|---|---|
| `signal_detected` | enum | `sleep` `stress` `gut` `energy` `mood` `pain` `crisis` `general` | yes |
| `risk_level` | enum | `low` `medium` `high` `crisis` | yes |
| `evidence_tier` | enum | `established` `emerging` `experimental` `narrative` | yes |
| `claim_boundary` | enum | `education_only` `wellness_support` `refer_to_clinician` | yes |
| `safety_flags` | string[] | free-form short flags (e.g. `cyp450`, `pregnancy`, `ssri`) | yes (may be `[]`) |
| `action_route` | enum | `calm` `learn` `protocol` `product` `practitioner` `track` `escalate` | yes |
| `commerce_gate_state` | enum | `green` `yellow` `red` `black` | yes |
| `outcome_check_scheduled` | enum | `none` `day_3` `day_7` `day_30` | yes |
| `reviewer_version` | string | e.g. `felicia_review_v1` (non-empty) | yes |
| `timestamp` | string | ISO 8601; defaults to `now()` if omitted | auto |

`buildTrustPacket(args)` **throws** a descriptive `Error` if any required field is missing or out of enum, or if `safety_flags` is not a string array, or `reviewer_version` is empty. `logTrustPacket(args)` wraps it never-throws and writes the row (also accepts `session_id`, `user_id`, `mode` for the `bleu_events` columns).

---

## Example payload

```json
{
  "signal_detected": "sleep",
  "risk_level": "low",
  "evidence_tier": "established",
  "claim_boundary": "wellness_support",
  "safety_flags": [],
  "action_route": "protocol",
  "commerce_gate_state": "green",
  "outcome_check_scheduled": "day_7",
  "reviewer_version": "felicia_review_v1",
  "timestamp": "2026-05-26T15:00:00.000Z"
}
```

## Crisis example (gates cascade)

```json
{
  "signal_detected": "crisis",
  "risk_level": "crisis",
  "evidence_tier": "established",
  "claim_boundary": "refer_to_clinician",
  "safety_flags": ["self_harm"],
  "action_route": "escalate",
  "commerce_gate_state": "black",
  "outcome_check_scheduled": "none",
  "reviewer_version": "felicia_review_v1"
}
```
