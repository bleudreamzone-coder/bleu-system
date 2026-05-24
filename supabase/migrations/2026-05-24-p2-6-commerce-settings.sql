-- Phase 2 — Mission 2.6: global commerce kill switch
-- ============================================================================
-- One row. commerce_enabled_global=false makes /api/plan/continue and
-- /api/stripe/create-session refuse with 503. ALVAI cards still render —
-- suppression is at checkout, not at recommendation. Captain-authorized
-- production safety control. Server-mediated only (service-role), RLS locked.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.bleu_commerce_settings (
  id                      boolean     PRIMARY KEY DEFAULT true,
  commerce_enabled_global boolean     NOT NULL DEFAULT true,
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id)   -- only id=true allowed → at most one row
);

INSERT INTO public.bleu_commerce_settings (id, commerce_enabled_global)
VALUES (true, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.bleu_commerce_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bleu_commerce_settings FROM anon;
REVOKE ALL ON TABLE public.bleu_commerce_settings FROM authenticated;

COMMIT;

-- Toggle off:  UPDATE public.bleu_commerce_settings SET commerce_enabled_global=false, updated_at=now() WHERE id;
-- Toggle on:   UPDATE public.bleu_commerce_settings SET commerce_enabled_global=true,  updated_at=now() WHERE id;
