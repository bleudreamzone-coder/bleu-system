-- Phase 4 console cleanup, Mission 2
-- Fixes 400 Bad Request on:
--   GET /rest/v1/profiles?select=cart_items,bleu_score,streak_days&id=eq.<uuid>
--
-- Run via Supabase Studio -> SQL Editor (or psql with service role).
-- Idempotent: safe to re-run.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cart_items   JSONB   DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bleu_score   INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days  INTEGER DEFAULT 0;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own profile" ON profiles;
CREATE POLICY "users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users update own profile" ON profiles;
CREATE POLICY "users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
