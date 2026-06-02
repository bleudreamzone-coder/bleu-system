-- DO NOT APPLY without Dr. Felicia signoff on outcome capture protocols and retention policy per Tier 3 master list.
-- OutcomeCheckpoint v1.1 shadow migration file only. This file is intentionally not applied by this PR.

CREATE TABLE IF NOT EXISTS public.outcome_checkpoints (
  checkpoint_id uuid PRIMARY KEY,
  trust_packet_id uuid NOT NULL, -- Forward reference: eventual FK to trust_packets table once Trust Packet persistence exists.
  session_id text NOT NULL CHECK (session_id LIKE 'h_%'),
  citizen_id uuid NOT NULL REFERENCES public.bleu_citizens(id),
  schema_version text NOT NULL DEFAULT '1.1',
  checkpoint_day smallint NOT NULL CHECK (checkpoint_day IN (3, 7, 30)),
  scheduled_at timestamptz NOT NULL,
  captured_at timestamptz NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'captured', 'missed', 'declined', 'expired')),
  delivery_channel text NULL CHECK (delivery_channel IS NULL OR delivery_channel IN ('sms', 'email', 'in_app')),
  delivery_attempts integer NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
  self_report jsonb NULL,
  measurement_update jsonb NULL,
  decline_reason text NULL,
  td_010 jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT outcome_checkpoints_captured_shape CHECK (
    (status = 'captured' AND captured_at IS NOT NULL AND self_report IS NOT NULL)
    OR status != 'captured'
  ),
  CONSTRAINT outcome_checkpoints_open_shape CHECK (
    (status IN ('scheduled', 'missed', 'expired') AND captured_at IS NULL AND self_report IS NULL)
    OR status NOT IN ('scheduled', 'missed', 'expired')
  ),
  CONSTRAINT outcome_checkpoints_declined_shape CHECK (
    (status = 'declined' AND decline_reason IS NOT NULL AND length(decline_reason) > 0 AND self_report IS NULL)
    OR status != 'declined'
  )
);

COMMENT ON TABLE public.outcome_checkpoints IS 'OutcomeCheckpoint v1.1 follow-up records fulfilling Trust Packet outcome_plan day_3/day_7/day_30 commitments. Dormant until clinical protocol signoff.';
COMMENT ON COLUMN public.outcome_checkpoints.trust_packet_id IS 'Forward reference to future trust_packets table; FK intentionally deferred until Trust Packet persistence exists.';

CREATE INDEX IF NOT EXISTS idx_oc_citizen_scheduled ON public.outcome_checkpoints (citizen_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_oc_status_scheduled ON public.outcome_checkpoints (status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_oc_trust_packet ON public.outcome_checkpoints (trust_packet_id);
CREATE INDEX IF NOT EXISTS idx_oc_captured ON public.outcome_checkpoints (captured_at DESC) WHERE captured_at IS NOT NULL;

ALTER TABLE public.outcome_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY outcome_checkpoints_service_role_all
  ON public.outcome_checkpoints
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY outcome_checkpoints_authenticated_select_own
  ON public.outcome_checkpoints
  FOR SELECT
  TO authenticated
  USING (citizen_id = auth.uid());

REVOKE ALL ON TABLE public.outcome_checkpoints FROM anon;
