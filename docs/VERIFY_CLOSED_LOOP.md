# Verify Closed Loop

This read-only harness confirms the Phase 3 closed-loop proof still holds. It performs Supabase REST `GET` requests only. It does not insert, update, patch, delete, send SMS, call Twilio, or mutate production data.

## Required Environment

Set these variables in your shell before running:

```bash
export SUPABASE_URL
export SUPABASE_SERVICE_KEY
```

Assign both values from your local secret manager or deployment environment before running. Do not paste the values into commits, tickets, PR comments, or chat. The verifier does not print either value.

## Run

```bash
npm run verify:closed-loop
```

By default, the script verifies the documented production proof rows:

- Event A Route/Record: `145bdeb8-97d3-4c03-b711-5e46c5aff813`
- Event B Return/Closed: `f47ed23f-259d-49ed-aae3-80d69b610c86`

To verify a different pair of proof rows:

```bash
EVENT_A_ID='event-a-uuid' EVENT_B_ID='event-b-uuid' npm run verify:closed-loop
```

or:

```bash
node scripts/verify-closed-loop.js \
  --event-a-id=event-a-uuid \
  --event-b-id=event-b-uuid
```

## Checks

The harness passes only when all checks pass:

- Event A exists and has `route_id='radius_71457_25mi_providers_found'`.
- Event A has `catalyst_type='medication_change'`, `siren_level='amber'`, and `workflow_rail='care_transition'`.
- Event B has `status='resolved'`, `outcome='reached_support'`, and `staff_action_required=false`.
- Event B has at least one `sms_log` row with `direction='outbound'` and `status='simulated'`.
- Event B has at least one `sms_log` row with `direction='inbound'`, `status='simulated'`, and `body='REACHED'`.

## Output

The script prints only PASS/FAIL lines, event IDs, counts, directions, statuses, and outcome fields. It does not print secrets, phone numbers, provider contact details, or raw `sms_log` free text.

Expected final line:

```text
FINAL PASS - closed loop proof holds
```

If any check fails, the script exits nonzero and prints:

```text
FINAL FAIL - closed loop proof is broken
```

If required env vars are missing, the script exits nonzero with a clear `CONFIG FAIL` message.

## Manual SQL Fallback

If the Node script cannot be run in the target environment, use these read-only SQL checks in Supabase:

```sql
select event_id, route_id, catalyst_type, siren_level, workflow_rail, status
from catalyst_event
where event_id = '145bdeb8-97d3-4c03-b711-5e46c5aff813';

select event_id, status, outcome, staff_action_required
from catalyst_event
where event_id = 'f47ed23f-259d-49ed-aae3-80d69b610c86';

select direction, status, count(*) as row_count
from sms_log
where event_id = 'f47ed23f-259d-49ed-aae3-80d69b610c86'
group by direction, status
order by direction, status;
```

Expected state:

- Event A route ID is `radius_71457_25mi_providers_found`.
- Event A is `medication_change`, `amber`, `care_transition`.
- Event B is `resolved` with `outcome='reached_support'`.
- Event B has a simulated outbound row and a simulated inbound row.
