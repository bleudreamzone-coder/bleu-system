-- 2026-06-01 metric_events table — DO NOT APPLY without
-- Dr. Felicia retention policy signoff per
-- _meta/clinical/signoffs/[date]-stoler-signoff-memory-retention-policies.md

CREATE TABLE IF NOT EXISTS metric_events (
  event_id uuid PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN (
    'chat_turn',
    'gate_fired',
    'refusal_triggered',
    'commerce_gate_state',
    'agent_invoked',
    'tool_invoked',
    'decision_emitted',
    'trust_packet_emitted',
    'error_caught'
  )),
  event_subtype text NOT NULL,
  session_id text NOT NULL CHECK (session_id LIKE 'h_%'),
  citizen_id uuid NULL REFERENCES bleu_citizens(id),
  schema_version text NOT NULL DEFAULT '1.1',
  occurred_at timestamptz NOT NULL,
  event_data jsonb NOT NULL,
  td_010 jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metric_events_type_occurred
  ON metric_events (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_metric_events_session_occurred
  ON metric_events (session_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_metric_events_citizen_occurred
  ON metric_events (citizen_id, occurred_at DESC)
  WHERE citizen_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metric_events_inserted_at
  ON metric_events (inserted_at);

ALTER TABLE metric_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_metric_events_select"
  ON metric_events
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_metric_events_insert"
  ON metric_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No authenticated policy is granted.
-- No anon policy is granted.
