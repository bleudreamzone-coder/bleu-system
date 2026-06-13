-- Barrier Ledger additive columns for catalyst_event.
-- Manual apply only; run before setting BARRIER_LEDGER_ENABLED=true.

ALTER TABLE public.catalyst_event
  ADD COLUMN IF NOT EXISTS barrier_type TEXT,
  ADD COLUMN IF NOT EXISTS barrier_confidence NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS user_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS barrier_resolved_status TEXT,
  ADD COLUMN IF NOT EXISTS aggregate_allowed BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalyst_event_barrier_type_check'
      AND conrelid = 'public.catalyst_event'::regclass
  ) THEN
    ALTER TABLE public.catalyst_event
      ADD CONSTRAINT catalyst_event_barrier_type_check
      CHECK (
        barrier_type IS NULL OR barrier_type IN (
          'transportation',
          'cost',
          'confusion',
          'pharmacy_access',
          'fear',
          'caregiver_burden',
          'broadband',
          'food_insecurity',
          'eligibility',
          'device_abandonment',
          'work_schedule',
          'trust'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalyst_event_barrier_confidence_check'
      AND conrelid = 'public.catalyst_event'::regclass
  ) THEN
    ALTER TABLE public.catalyst_event
      ADD CONSTRAINT catalyst_event_barrier_confidence_check
      CHECK (
        barrier_confidence IS NULL OR (
          barrier_confidence >= 0
          AND barrier_confidence <= 1
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalyst_event_barrier_resolved_status_check'
      AND conrelid = 'public.catalyst_event'::regclass
  ) THEN
    ALTER TABLE public.catalyst_event
      ADD CONSTRAINT catalyst_event_barrier_resolved_status_check
      CHECK (
        barrier_resolved_status IS NULL OR barrier_resolved_status IN (
          'open',
          'resolved',
          'still_blocked'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_catalyst_event_barrier_type_origin
  ON public.catalyst_event (barrier_type, event_origin, created_at DESC)
  WHERE barrier_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalyst_event_barrier_resolution
  ON public.catalyst_event (barrier_resolved_status, status, created_at DESC)
  WHERE barrier_resolved_status IS NOT NULL;
