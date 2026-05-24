-- Phase 7.2A — bleu_citizens canonical paying-user identity table
-- ============================================================================
-- A canonical identity surface tied to successful Stripe payments. Distinct
-- from profiles (auth) — this is the paying-Citizen record. Server-mediated
-- only, RLS locked. Magic-link auth + verify endpoint come in 7.2B/7.2C.
-- email_hash = SHA-256 of lowercased email (see server.js hashEmail).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.bleu_citizens (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash               text        NOT NULL UNIQUE,
  session_id               text,
  profile_id               uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_seen_at            timestamptz NOT NULL DEFAULT now(),
  plan_started_at          timestamptz,
  first_stripe_session_id  text,
  kill_switch_opt_out_at   timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bleu_citizens_email_hash
  ON public.bleu_citizens(email_hash);
CREATE INDEX IF NOT EXISTS idx_bleu_citizens_session_id
  ON public.bleu_citizens(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bleu_citizens_profile_id
  ON public.bleu_citizens(profile_id) WHERE profile_id IS NOT NULL;

ALTER TABLE public.bleu_citizens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bleu_citizens FROM anon;
REVOKE ALL ON public.bleu_citizens FROM authenticated;

COMMIT;
