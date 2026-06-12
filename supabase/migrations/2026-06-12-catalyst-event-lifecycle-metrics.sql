-- Catalyst event lifecycle metrics support.
-- Adds first-resolution timestamping and origin labeling for organic-only
-- Command View / Navigator Queue metrics.

BEGIN;

ALTER TABLE public.catalyst_event
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE public.catalyst_event
  ADD COLUMN IF NOT EXISTS event_origin TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalyst_event_event_origin_check'
      AND conrelid = 'public.catalyst_event'::regclass
  ) THEN
    ALTER TABLE public.catalyst_event
      ADD CONSTRAINT catalyst_event_event_origin_check
      CHECK (event_origin IS NULL OR event_origin IN ('organic', 'test', 'seeded', 'demo'))
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.catalyst_event
  VALIDATE CONSTRAINT catalyst_event_event_origin_check;

CREATE INDEX IF NOT EXISTS idx_catalyst_event_origin_status_created
  ON public.catalyst_event(event_origin, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_catalyst_event_resolved_at
  ON public.catalyst_event(resolved_at)
  WHERE resolved_at IS NOT NULL;

COMMIT;
