-- Mission 7.6 — Stripe webhook idempotency table
-- ============================================================================
-- Records every processed Stripe event id so a re-delivered webhook (Stripe
-- retries on non-2xx, and at-least-once delivery) cannot double-activate a
-- Citizen. Server-mediated only, RLS locked.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id     text        PRIMARY KEY,
  event_type   text        NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_processed_at
  ON public.stripe_processed_events(processed_at);

ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_processed_events FROM anon;
REVOKE ALL ON public.stripe_processed_events FROM authenticated;

COMMIT;
