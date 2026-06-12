# Phase 3 Closed-Loop Proof Deed Book

Date: 2026-06-12

This document records the production proof that BLEU's governed rural medication-change loop can hear a post-discharge medication-change signal, assign the correct safety/workflow lane, route through the verified radius system, write the catalyst event before the response, send a simulated follow-up, receive a simulated reply, and close the event with an outcome. The proof uses two production events. Event A came from live traffic and proves Signal, Siren, Rail, Route, and Record. Event B was a seeded, consented, simulated event and proves Return and closure.

## Loop Proven

| Stage | Proof Event | Basis |
| --- | --- | --- |
| Signal | Event A | A post-discharge medication-change message produced a `catalyst_event` row with `catalyst_type='medication_change'`. |
| Siren | Event A | The same row records `siren_level='amber'`. |
| Rail | Event A | The same row records `workflow_rail='care_transition'`. |
| Route | Event A | The same row records `route_id='radius_71457_25mi_providers_found'`, documenting the radius route decision for ZIP 71457. |
| Record | Event A | The catalyst event exists as the write-ahead ledger row for the governed response. |
| Return | Event B | `sms_log` contains one simulated outbound follow-up row and one simulated inbound `REACHED` row for the seeded event. |
| Closed | Event B | The seeded event ended with `status='resolved'` and `outcome='reached_support'`. |

## Event A - Route And Record Proof

Event A is a live production `catalyst_event` row with:

- `event_id='145bdeb8-97d3-4c03-b711-5e46c5aff813'`
- `route_id='radius_71457_25mi_providers_found'`
- `catalyst_type='medication_change'`
- `siren_level='amber'`
- `workflow_rail='care_transition'`

This row proves that the 71457 med-change signal reached the governed route path, that the radius router recorded a 25-mile providers-found decision, and that the route decision was preserved in the write-ahead catalyst ledger. The live route surfaced a verified provider row from the practitioners directory, but this document intentionally does not reproduce the provider's name, phone number, address, NPI, or any contact details. The verifiable artifact for this deed book is the catalyst event row and its route metadata.

Re-run this read-only verification:

```sql
select event_id, route_id, catalyst_type, siren_level,
       workflow_rail, status, created_at
from catalyst_event
where route_id = 'radius_71457_25mi_providers_found'
order by created_at desc
limit 3;
```

Expected proof row:

- `route_id='radius_71457_25mi_providers_found'`
- `catalyst_type='medication_change'`
- `siren_level='amber'`
- `workflow_rail='care_transition'`

## Event B - Return Closure Proof

Event B is a seeded proof event:

- `event_id='f47ed23f-259d-49ed-aae3-80d69b610c86'`
- `route_id='phase3_return_proof_71457'`
- `consent_status='granted'`
- `catalyst_type='medication_change'`
- `workflow_rail='care_transition'`

This was not a real-patient consent event. It was deliberately seeded with `consent_status='granted'` so the Phase 3 Return processor could be tested without weakening the production consent gate. Consent capture for real patients does not exist yet. Real-patient Return activation remains out of scope until that consent capture path is built and clinically approved.

The Return loop was simulated only. `SMS_ENABLED` remained off. No live SMS was sent. The processor wrote `sms_log` rows with `status='simulated'`. The outbound body was generic and contained no patient name, phone number, address, diagnosis, condition, or medication name beyond the generic word "medicine." The inbound body was sanitized to `REACHED`, not stored as raw free text.

Re-run this read-only verification:

```sql
select direction, body, status, created_at
from sms_log
where event_id = 'f47ed23f-259d-49ed-aae3-80d69b610c86'
order by created_at;

select status, outcome, staff_action_required
from catalyst_event
where event_id = 'f47ed23f-259d-49ed-aae3-80d69b610c86';
```

Expected final state:

- `sms_log` has two rows for this `event_id`.
- One row has `direction='outbound'`, `status='simulated'`, and the generic follow-up body.
- One row has `direction='inbound'`, `status='simulated'`, and `body='REACHED'`.
- `catalyst_event.status='resolved'`.
- `catalyst_event.outcome='reached_support'`.
- `catalyst_event.staff_action_required=false`.

Read-only verification on 2026-06-12 returned exactly that final state.

## Metrics Integrity Note

These proof events are mechanism evidence, not partner-facing organic outcomes. Event A and Event B remain origin-labeled proof rows for auditability. Command View organic metrics, including consented closed-loop counts and closure-rate calculations, exclude seeded, test, and demo rows from the primary metric set while preserving those rows in integrity counts.

## What This Proves

Together, Event A and Event B prove this production mechanism:

```text
Signal -> Siren -> Rail -> Route -> Record -> Return -> Closed
```

The proof is narrow and specific. It proves the 71457 medication-change-after-discharge wedge. It proves write-ahead recording for the routed response. It proves the simulated Return mechanism can write an outbound follow-up row, accept a simulated `REACHED` reply, and close the event with an outcome.

## What Is Not Yet Claimed

This document does not claim:

- Real-patient consent capture is live.
- Live SMS sending is enabled.
- Real patients are receiving Return texts.
- Place intelligence is complete.
- Command View is live.
- Navigator queue is live.
- Four subdomains are live.
- AEO or public surface exports are complete.
- Provider identity or contact details should be copied from this proof artifact.

Those are future or separate builds. The honest claim here is that the closed-loop mechanism is proven in production with one live Route/Record event and one seeded, consented, simulated Return/Closed event.

## How To Re-Run Safely

Re-run Return proof only against a seeded, simulated, consented test event. Do not run it against real patient data unless real-patient consent capture has been built, clinically reviewed, and explicitly enabled.

Safe re-run rules:

- Use a test `catalyst_event` row created only for proof.
- Set `consent_status='granted'` only on that seeded test row.
- Keep `SMS_ENABLED=false` or unset.
- Use `RETURN_LOOP_ENABLED=true` only after the deployed server is green.
- Verify with read-only `select` queries.
- Do not copy secrets, API keys, env values, phone numbers, provider contact details, or raw patient narrative into this document or any PR.

## Privacy Statement

Event B is a seeded proof event. It contains no real patient narrative and no phone number. This document intentionally omits provider personal contact details and does not include secrets, API keys, env values, or credentials.
