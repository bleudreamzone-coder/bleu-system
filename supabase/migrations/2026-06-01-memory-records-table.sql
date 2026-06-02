-- PR India — Memory Architecture Schema (shadow mode)
-- File only. Do NOT apply until Captain manual activation after Dr. Felicia retention signoff.

CREATE TABLE IF NOT EXISTS public.memory_records (
  record_id uuid PRIMARY KEY,
  session_id text NOT NULL,
  citizen_id uuid REFERENCES public.bleu_citizens(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('episodic', 'semantic', 'preference', 'decision_history', 'counterfactual_link')),
  schema_version text NOT NULL DEFAULT '1.1' CHECK (schema_version = '1.1'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ttl_days integer CHECK (ttl_days IS NULL OR ttl_days > 0),
  expires_at timestamptz GENERATED ALWAYS AS (
    CASE
      WHEN ttl_days IS NULL THEN NULL
      ELSE created_at + make_interval(days => ttl_days)
    END
  ) STORED,
  retention_authority text NOT NULL CHECK (retention_authority IN (
    'tier_1_captain',
    'tier_2_felicia',
    'tier_3_felicia_autonomous',
    'tier_4_citizen_request'
  )),
  payload jsonb NOT NULL,
  td_010 jsonb NOT NULL CHECK (
    td_010 = '{"pii_hashed": true, "plaintext_email_stored": false, "plaintext_phone_stored": false}'::jsonb
  )
);

COMMENT ON TABLE public.memory_records IS 'Shadow-mode durable session memory records. Payload is app-layer validated by memory_record_v1.1 schema; no plaintext email or phone allowed under TD-010.';
COMMENT ON COLUMN public.memory_records.payload IS 'Per-kind MemoryRecord payload. JSON Schema validation occurs at app layer before writes.';
COMMENT ON COLUMN public.memory_records.td_010 IS 'TD-010 compliance object: pii_hashed true, plaintext email false, plaintext phone false.';

CREATE INDEX IF NOT EXISTS idx_memory_records_session_kind_created
  ON public.memory_records (session_id, kind, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memory_records_expires_at
  ON public.memory_records (expires_at);

ALTER TABLE public.memory_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY memory_records_service_role_all
  ON public.memory_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY memory_records_authenticated_select_own_session
  ON public.memory_records
  FOR SELECT
  TO authenticated
  USING (
    session_id = COALESCE(
      current_setting('request.jwt.claims', true)::jsonb ->> 'session_id',
      current_setting('request.jwt.claim.session_id', true)
    )
  );

REVOKE ALL ON public.memory_records FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.memory_records FROM authenticated;
