# day7_outcome_v1

**template_version:** `day7_outcome_v1`
**comm_type:** `sms`
**trigger:** `scheduleDay7OutcomeChecks()` via `POST /api/send-day7-outcomes` (cron, daily 10:00 America/Chicago)
**channel:** Twilio (`TWILIO_PHONE_NUMBER`)
**length:** 158 chars — single SMS segment (≤160 GSM-7)

---

## Body (verbatim — must stay ≤160 chars, must keep STOP language)

```
Hi from BLEU. It's been 7 days since you started your protocol. Reply BETTER, SAME, or WORSE so Dr. Felicia can review your trajectory. Reply STOP to opt out.
```

The exact string lives in `server.js` as `DAY7_OUTCOME_BODY` — keep the two in sync.

---

## Compliance notes (TCPA)

- **STOP language present** ("Reply STOP to opt out") — required for transactional/marketing SMS.
- Inbound `STOP|UNSUBSCRIBE|CANCEL|END|QUIT` → handler writes `sms_opted_out` (keyed by `phone_hash`); `scheduleDay7OutcomeChecks()` skips any opted-out number on future runs.
- Sender identity ("Hi from BLEU") in the first line.
- One message per Citizen per protocol — deduped via `bleu_events` `day7_outcome_sent`.
- No PII in the body; recipient stored only as `recipient_hash` (TD-010).

## Inbound parse → response

| Reply (case-insensitive, prefix) | result | Auto-reply |
|---|---|---|
| `better` | `better` | Thank you. Your check-in is recorded. Dr. Felicia will review. Reply STOP anytime. |
| `same` | `same` | (same as above) |
| `worse` | `worse` | (same as above) |
| `stop`/`unsubscribe`/`cancel`/`end`/`quit` | `opt_out` | You're opted out. We won't text again. You can still use bleu.live. |
| anything else | `unparseable` | Thanks. We couldn't read that as BETTER/SAME/WORSE — but it's logged. |
