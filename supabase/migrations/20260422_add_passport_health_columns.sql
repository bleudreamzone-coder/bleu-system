-- ═══════════════════════════════════════════════════════════════
-- BLEU PASSPORT HEALTH COLUMNS MIGRATION — 2026-04-22
-- Project: sqyzboesdpdussiwqpzk (Bleu-Live)
--
-- Adds the 10 health columns that syncHealthToSupabase
-- (index.html:7499) has been writing to `profiles` since the
-- Passport feature shipped. None of these columns existed at the
-- database level. Every write silently 400'd at PostgREST
-- ("column does not exist") and was swallowed by upsertProfile's
-- try/catch at index.html:7495. No production data was persisted;
-- localStorage copies on each user's device are the only surviving
-- source. This migration is the prerequisite for Block 1 wiring.
--
-- Idempotent: every ADD COLUMN uses IF NOT EXISTS. Safe to re-run.
-- No CHECK constraints intentionally — ranges are documented in
-- the column COMMENTs, not enforced at the DB level, so existing
-- bad-typed writes don't retroactively fail.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS weight_lbs        NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS resting_hr        SMALLINT,
  ADD COLUMN IF NOT EXISTS hrv_ms            SMALLINT,
  ADD COLUMN IF NOT EXISTS sleep_hrs         NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS steps_daily       INTEGER,
  ADD COLUMN IF NOT EXISTS energy_score      SMALLINT,
  ADD COLUMN IF NOT EXISTS anxiety_score     SMALLINT,
  ADD COLUMN IF NOT EXISTS mood_score        SMALLINT,
  ADD COLUMN IF NOT EXISTS primary_goal      TEXT,
  ADD COLUMN IF NOT EXISTS health_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.weight_lbs        IS 'User-entered body weight in pounds. Written by syncHealthToSupabase from the Passport manual entry form. Format NUMERIC(5,2) supports values up to 999.99.';
COMMENT ON COLUMN profiles.resting_hr        IS 'Resting heart rate in beats per minute. Realistic range 30-220; not enforced at DB layer.';
COMMENT ON COLUMN profiles.hrv_ms            IS 'Heart rate variability in milliseconds (RMSSD). Realistic range 10-200; not enforced at DB layer.';
COMMENT ON COLUMN profiles.sleep_hrs         IS 'Average nightly sleep duration in hours. Format NUMERIC(3,1) supports values up to 99.9.';
COMMENT ON COLUMN profiles.steps_daily       IS 'Average daily step count. INTEGER accommodates 0 through 100000+.';
COMMENT ON COLUMN profiles.energy_score      IS 'User-rated energy level, 0-100 scale. Higher = more energy. Not enforced at DB layer.';
COMMENT ON COLUMN profiles.anxiety_score     IS 'User-rated anxiety level, 0-100 scale. Higher = more anxious. Not enforced at DB layer.';
COMMENT ON COLUMN profiles.mood_score        IS 'User-rated mood, 0-100 scale. Higher = better mood. Not enforced at DB layer.';
COMMENT ON COLUMN profiles.primary_goal      IS 'Free-form text describing the user''s current wellness goal. No length cap.';
COMMENT ON COLUMN profiles.health_updated_at IS 'Set by syncHealthToSupabase on every manual save or device import (Apple Health XML, Oura JSON, wellness CSV).';

-- ═══════════════════════════════════════════════════════════════
-- Verification — expect exactly 10 rows, alphabetically ordered:
--   anxiety_score, energy_score, health_updated_at, hrv_ms,
--   mood_score, primary_goal, resting_hr, sleep_hrs,
--   steps_daily, weight_lbs
-- ═══════════════════════════════════════════════════════════════
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'weight_lbs',
    'resting_hr',
    'hrv_ms',
    'sleep_hrs',
    'steps_daily',
    'energy_score',
    'anxiety_score',
    'mood_score',
    'primary_goal',
    'health_updated_at'
  )
ORDER BY column_name;
