-- outcome_events: append-only event log for Stripe checkouts and Twilio replies
-- Source of truth for outcome data feeding Trust-to-Revenue Loop and grant evidence
-- Service-role writes only; RLS blocks all other access

CREATE TABLE IF NOT EXISTS outcome_events (
  event_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  session_id    text,
  event_type    text NOT NULL,
  protocol_name text,
  source        text NOT NULL,
  payload       jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcome_events_user_id ON outcome_events(user_id);
CREATE INDEX IF NOT EXISTS idx_outcome_events_created_at ON outcome_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outcome_events_event_type ON outcome_events(event_type);

ALTER TABLE outcome_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_outcome_events" ON outcome_events;
CREATE POLICY "service_role_all_outcome_events"
  ON outcome_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
