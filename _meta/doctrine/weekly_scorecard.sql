-- BLEU Weekly Scorecard — Balanced Scorecard
-- Run every Monday. Four numbers, watched together.
--
-- THE CATCH LINE: if revenue rises while sirens rise, the platform is failing.
-- Financial growth that comes with rising alvai_quiet incidents means BLEU is
-- monetizing distress instead of converting trusted guidance into governed
-- action. That is a Soul Gate failure, not a win.

SELECT 'Financial' AS dimension,
       count(DISTINCT session_id)::text AS value,
       'paying Citizens (purchase_completed) this week' AS metric
FROM public.bleu_events
WHERE event_type = 'purchase_completed'
  AND created_at > now() - interval '7 days'

UNION ALL

SELECT 'Customer',
       (count(*) FILTER (WHERE event_type='chat_message_out') * 100
         / NULLIF(count(*) FILTER (WHERE event_type='chat_message_in'), 0))::text || '%',
       'Alvai session completion rate (out/in)'
FROM public.bleu_events
WHERE created_at > now() - interval '7 days'

UNION ALL

SELECT 'Internal Process',
       (count(*) FILTER (WHERE event_type='alvai_quiet') * 1000
         / NULLIF(count(*) FILTER (WHERE event_type='chat_message_in'), 0))::text,
       'Siren incidents per 1000 sessions (target: 0)'
FROM public.bleu_events
WHERE created_at > now() - interval '7 days'

UNION ALL

SELECT 'Learning',
       '0',
       'citations added to protocols this week (manual count, future automation)';
