-- ═══════════════════════════════════════════════════════════════
-- BLEU BHI COLUMNS MIGRATION — 2026-04-22
-- Project: sqyzboesdpdussiwqpzk (Bleu-Live)
--
-- Adds two columns to `profiles` to persist the BLEU Health Index
-- (BHI) — the "one number" score computed from the nine dimension
-- scorers shipped in wire 4 (commit 127a485).
--
-- Why this exists: without persistence, every BHI computation is
-- ephemeral and the "one number" lies on every device change — the
-- same silent-sync bug we eliminated this morning for the 10 health
-- columns. Writing bhi_score to Supabase closes the round-trip for
-- the dashboard ring the same way wire 3 closed it for health data.
--
-- Scale: 0-100 (matches the 0-100 scale of the dimension scorers in
-- wire 4). Not the legacy 0-1000 scale that the pre-wire-5 dashboard
-- IIFE assumed.
--
-- Idempotent: every ADD COLUMN uses IF NOT EXISTS. Safe to re-run.
-- No CHECK constraint on range intentionally — matches the precedent
-- set by the 2026-04-22 passport health columns migration, where
-- ranges live in COMMENTs rather than DB-enforced constraints so
-- existing writes don't retroactively fail.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bhi_score      SMALLINT,
  ADD COLUMN IF NOT EXISTS bhi_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.bhi_score      IS 'BLEU Health Index — the single composite wellness score, 0-100 scale. Computed client-side as the clamped mean of the 9 dimension scores (Sleep, Mind, Movement, Nutrition, Social, Finance, Spirit, Recovery, ECS). Range not enforced at DB layer. Formula v1 is heuristic pending clinical review by Dr. Felicia Stoler.';
COMMENT ON COLUMN profiles.bhi_updated_at IS 'Set by renderDashboardBHI on every BHI computation. Telemetry signal for when a user''s tier last changed. ISO 8601 TIMESTAMPTZ.';

-- ═══════════════════════════════════════════════════════════════
-- Verification — expect exactly 2 rows, alphabetically ordered:
--   bhi_score, bhi_updated_at
-- ═══════════════════════════════════════════════════════════════
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('bhi_score', 'bhi_updated_at')
ORDER BY column_name;
