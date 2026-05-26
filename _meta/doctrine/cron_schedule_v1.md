# Cron Schedule v1

Render cron jobs (defined in `render.yaml`). Render cron runs in **UTC** with no
DST adjustment, so Central-time equivalents shift by an hour across CDT/CST.

| Job | render.yaml schedule (UTC) | Central (CDT / CST) | Endpoint | Auth |
|---|---|---|---|---|
| `bleu-reorder-reminders` | `0 14 * * *` | 09:00 / 08:00 | `POST /api/send-reorder-reminders` | Bearer `REORDER_CRON_SECRET` |
| `bleu-day7-outcomes` | `0 15 * * *` | 10:00 / 09:00 | `POST /api/send-day7-outcomes` | Bearer `REORDER_CRON_SECRET` |

## Notes
- Both jobs `curl` the web service with `Authorization: Bearer $REORDER_CRON_SECRET`.
  The secret must be set on **the web service AND each cron** in the Render dashboard
  (`sync: false` means Render does not copy it automatically). Missing → handler
  returns 500 (unset) or 401 (wrong); both fail closed, no sends.
- `bleu-day7-outcomes` selects the cohort `first_seen_at ∈ [now-7d-12h, now-7d]`,
  dedupes via `bleu_events.day7_outcome_sent`, skips opted-out numbers, and resolves
  phone via `bleu_citizens.session_id → user_coherence.phone`. Citizens without a
  resolvable phone are skipped (never texted).
- Day-7 send requires Twilio configured (`TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER`);
  if unset the handler returns 200 with `{error:'Twilio not configured'}` and sends nothing.
- If a dedicated daily 10:00 *Central* (DST-correct) time is required, switch the
  schedule seasonally or move scheduling to a TZ-aware scheduler.
