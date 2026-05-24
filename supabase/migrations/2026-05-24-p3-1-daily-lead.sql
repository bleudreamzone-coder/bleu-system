-- Phase 3 — Mission 3.1: bleu_daily_lead governance view
-- ============================================================================
-- Daily lead indicators over the last 90 days of bleu_events. Server/admin
-- read only (anon + authenticated revoked). Apply via Management API.
-- ============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.bleu_daily_lead AS
SELECT
  date_trunc('day', created_at)::date AS day,
  count(DISTINCT session_id) FILTER (
    WHERE event_type = 'plan_started'
  ) AS sessions_with_plan_started,
  count(DISTINCT session_id) FILTER (
    WHERE event_type = 'plan_item_added'
  ) AS sessions_with_plan_item_added,
  count(*) FILTER (
    WHERE event_type = 'chat_message_out'
  ) AS total_alvai_responses,
  count(*) FILTER (
    WHERE event_type = 'alvai_quiet'
  ) AS siren_incidents
FROM public.bleu_events
WHERE created_at > now() - interval '90 days'
GROUP BY 1
ORDER BY 1 DESC;

REVOKE ALL ON public.bleu_daily_lead FROM anon;
REVOKE ALL ON public.bleu_daily_lead FROM authenticated;

COMMIT;
