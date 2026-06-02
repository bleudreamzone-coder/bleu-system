-- DO NOT APPLY without Felicia retention signoff.
-- Trust Packet v1.1 dormant storage draft only; this migration is intentionally not executed by this PR.

CREATE TABLE IF NOT EXISTS public.trust_packets (
  packet_id uuid PRIMARY KEY,
  signal_id uuid NOT NULL,
  decision_id uuid NOT NULL,
  schema_version text NOT NULL DEFAULT '1.1',
  response jsonb NOT NULL,
  counterfactual jsonb NOT NULL,
  outcome_plan jsonb NOT NULL,
  audit jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trust_packets_schema_version_v1_1 CHECK (schema_version = '1.1'),
  CONSTRAINT trust_packets_counterfactual_prevented_wrong_answer_required CHECK (
    counterfactual ? 'prevented_wrong_answer'
    AND length(btrim(counterfactual->>'prevented_wrong_answer')) > 0
  ),
  CONSTRAINT trust_packets_counterfactual_class_valid CHECK (
    counterfactual->>'class' IN (
      'crisis_missed',
      'unsafe_supplement',
      'overclaim',
      'premature_commerce',
      'wrong_dose',
      'missed_referral',
      'privacy_leak',
      'voice_drift',
      'none'
    )
  ),
  CONSTRAINT trust_packets_td_010_no_plaintext_email CHECK (
    audit->'td_010'->>'plaintext_email_stored' = 'false'
  ),
  CONSTRAINT trust_packets_td_010_no_plaintext_phone CHECK (
    audit->'td_010'->>'plaintext_phone_stored' = 'false'
  )
);

CREATE INDEX IF NOT EXISTS trust_packets_decision_id_idx
  ON public.trust_packets (decision_id);

CREATE INDEX IF NOT EXISTS trust_packets_signal_id_idx
  ON public.trust_packets (signal_id);

CREATE INDEX IF NOT EXISTS trust_packets_created_at_desc_idx
  ON public.trust_packets (created_at DESC);

CREATE INDEX IF NOT EXISTS trust_packets_counterfactual_class_idx
  ON public.trust_packets ((counterfactual->>'class'));

CREATE INDEX IF NOT EXISTS trust_packets_clinical_counterfactual_pending_idx
  ON public.trust_packets (created_at DESC)
  WHERE counterfactual->>'class' IN ('crisis_missed', 'unsafe_supplement', 'wrong_dose', 'missed_referral')
    AND audit->>'clinical_review_status' = 'pending';

ALTER TABLE public.trust_packets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trust_packets FROM anon;
REVOKE ALL ON public.trust_packets FROM authenticated;
GRANT ALL ON public.trust_packets TO service_role;

CREATE POLICY trust_packets_service_role_only
  ON public.trust_packets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
