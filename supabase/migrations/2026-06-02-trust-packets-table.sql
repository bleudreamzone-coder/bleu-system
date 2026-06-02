-- DO NOT APPLY without Dr. Felicia retention policy signoff per Tier 4 master list item.
-- Trust Packet logging plumbing migration. This file is shipped dormant and is not applied by this PR.

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

  CONSTRAINT trust_packets_counterfactual_prevented_wrong_answer_chk CHECK (
    counterfactual ? 'prevented_wrong_answer'
    AND jsonb_typeof(counterfactual->'prevented_wrong_answer') = 'string'
    AND length(counterfactual->>'prevented_wrong_answer') > 0
  ),
  CONSTRAINT trust_packets_counterfactual_class_chk CHECK (
    counterfactual ? 'class'
    AND counterfactual->>'class' IN (
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
  CONSTRAINT trust_packets_td_010_plaintext_chk CHECK (
    audit ? 'td_010'
    AND (audit->'td_010'->>'plaintext_email_stored')::boolean = false
    AND (audit->'td_010'->>'plaintext_phone_stored')::boolean = false
  )
);

CREATE INDEX IF NOT EXISTS idx_tp_decision_id ON public.trust_packets (decision_id);
CREATE INDEX IF NOT EXISTS idx_tp_signal_id ON public.trust_packets (signal_id);
CREATE INDEX IF NOT EXISTS idx_tp_created_at ON public.trust_packets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tp_counterfactual_class
  ON public.trust_packets ((counterfactual->>'class'), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tp_clinical_counterfactuals
  ON public.trust_packets (created_at DESC)
  WHERE counterfactual->>'class' IN ('crisis_missed', 'unsafe_supplement', 'missed_referral', 'wrong_dose');

ALTER TABLE public.trust_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_packets_service_role_full_access"
  ON public.trust_packets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No authenticated or anon policies are created. Trust Packets are institutional infrastructure.
