-- Mission 7.4 — magic_links passwordless auth tokens
-- ============================================================================
-- One row per issued sign-in link. Token is a 256-bit random hex string
-- (crypto.randomBytes(32)), single-use (consumed_at), short-lived (15 min).
-- Server-mediated only, RLS locked.
--
-- TD-010 privacy: no plaintext email column. email_hash = SHA-256 of the
-- lowercased address (server.js hashEmail), matching bleu_citizens.email_hash
-- and bleu_comms.recipient_hash. ip_address / user_agent are kept for abuse
-- triage only.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.magic_links (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash  text        NOT NULL,
  token       text        NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  consumed_at timestamptz,
  citizen_id  uuid        REFERENCES public.bleu_citizens(id) ON DELETE SET NULL,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token
  ON public.magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_at
  ON public.magic_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_links_email_hash
  ON public.magic_links(email_hash);

ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.magic_links FROM anon;
REVOKE ALL ON public.magic_links FROM authenticated;

COMMIT;
