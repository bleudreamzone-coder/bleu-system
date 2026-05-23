-- Phase 1 — Audit Foundation (P1)
-- ============================================================================
-- Generated: 2026-05-23
-- Doctrine:  "BLEU does not monetize pain; BLEU converts trusted guidance
--             into governed action."
-- Authority: Captain Soul Gate — Phase 1 designed in response to Phase 2 v2
--            assumption gap (the v2 paste assumed these tables existed; they
--            did not). Phase 1 ships the foundation Phase 2 will build on.
--
-- DO NOT APPLY UNTIL BLEU HAS READ THIS FILE.
-- ============================================================================
--
-- WHAT THIS MIGRATION CREATES
--
-- Four tables, all in the public schema, all server-mediated (no direct
-- client access — every read/write goes through server.js using the
-- service-role-keyed querySupabase() helper):
--
--   bleu_events       — generic event log (chat_message_in/out, alvai_quiet,
--                       session_start, purchase_completed, plus the Phase 2
--                       commerce events purchase_intent_detected, card_render,
--                       commerce_event_captured, alvai_safety_check).
--
--   bleu_decisions    — state/decision audit, reserved for Phase 4's
--                       state_estimate pipeline. inputs/outputs jsonb so we
--                       can replay how a decision was made.
--
--   bleu_plan         — the user's plan (Phase 2 "Your Plan" drawer).
--                       Singular table name from day one; the vocabulary
--                       lock applies to schema as well as UI. Partial unique
--                       index enforces "one active plan per session."
--
--   bleu_plan_events  — add/remove/safety_check/continue lifecycle log,
--                       FK'd to bleu_plan with ON DELETE CASCADE so a
--                       plan-delete cleans up its event trail.
--
-- ============================================================================
--
-- ACCESS MODEL
--
-- Every write goes through server.js → querySupabase() → REST API with the
-- service_role JWT. The service_role bypasses RLS by design. RLS is enabled
-- on all four tables with ZERO policies for anon/authenticated, so even if
-- a future GRANT accidentally re-exposed a table, no rows would be readable
-- or writable except via service_role. Same defense-in-depth posture as
-- 2026-05-21-p0-revoke-anon.sql (Option C + RLS belt and suspenders).
--
-- bleu_events and bleu_plan_events carry only operational metadata. They
-- DO NOT carry PII. Email is hashed (SHA-256) before logging per TD-010
-- (privacy: stop logging email plaintext) — see Mission 1.4 (server.js
-- stripe-webhook handler).
--
-- ============================================================================
--
-- APPLICATION INSTRUCTIONS (manual, by Bleu)
--
-- Option 1 — Supabase Dashboard SQL Editor (recommended for review):
--   1. Open https://supabase.com/dashboard/project/sqyzboesdpdussiwqpzk/sql/new
--   2. Paste the BEGIN ... COMMIT block below
--   3. Click Run
--   4. Run the POST-APPLICATION VERIFICATION block to confirm all four
--      tables exist with RLS enabled and zero anon/authenticated grants.
--
-- Option 2 — supabase db push from this repo (after link):
--   supabase db push
--   (Will apply this migration along with any other pending ones.)
--
-- Mission 1.5 smoke test depends on these tables existing in the live DB.
-- Render's running server uses service_role and will start writing rows
-- the moment Mission 1.3 ships — applying this migration is the gate.
--
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- bleu_events — generic event log
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bleu_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  text,
  user_id     uuid,
  event_type  text        NOT NULL,
  sea         text,
  mode        text,
  payload     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bleu_events_type_created
  ON public.bleu_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bleu_events_session_created
  ON public.bleu_events (session_id, created_at DESC);

ALTER TABLE public.bleu_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bleu_events FROM anon;
REVOKE ALL ON TABLE public.bleu_events FROM authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- bleu_decisions — state/decision audit (Phase 4 will populate)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bleu_decisions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text,
  user_id       uuid,
  decision_type text        NOT NULL,
  inputs        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  outputs       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bleu_decisions_session_created
  ON public.bleu_decisions (session_id, created_at DESC);

ALTER TABLE public.bleu_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bleu_decisions FROM anon;
REVOKE ALL ON TABLE public.bleu_decisions FROM authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- bleu_plan — the user's plan ("Your Plan" drawer)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bleu_plan (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     text        NOT NULL,
  user_id        uuid,
  items          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  total_cents    integer     NOT NULL DEFAULT 0,
  status         text        NOT NULL DEFAULT 'active',
  safety_status  text        NOT NULL DEFAULT 'pending',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- At most one active plan per session.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bleu_plan_active_session
  ON public.bleu_plan (session_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_bleu_plan_user_created
  ON public.bleu_plan (user_id, created_at DESC) WHERE user_id IS NOT NULL;

ALTER TABLE public.bleu_plan ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bleu_plan FROM anon;
REVOKE ALL ON TABLE public.bleu_plan FROM authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- bleu_plan_events — plan lifecycle log
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bleu_plan_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid        NOT NULL REFERENCES public.bleu_plan(id) ON DELETE CASCADE,
  event_type  text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bleu_plan_events_plan_created
  ON public.bleu_plan_events (plan_id, created_at DESC);

ALTER TABLE public.bleu_plan_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bleu_plan_events FROM anon;
REVOKE ALL ON TABLE public.bleu_plan_events FROM authenticated;

COMMIT;

-- ============================================================================
-- POST-APPLICATION VERIFICATION
-- ============================================================================
--
-- Run after applying to confirm all four tables exist with RLS on and zero
-- non-service-role grants:
--
--   SELECT
--     c.relname AS table_name,
--     c.relrowsecurity AS rls_enabled,
--     COALESCE(string_agg(DISTINCT g.grantee, ', ' ORDER BY g.grantee), '(none)') AS grantees
--   FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   LEFT JOIN information_schema.role_table_grants g
--     ON g.table_schema = n.nspname AND g.table_name = c.relname
--    AND g.grantee IN ('anon', 'authenticated')
--   WHERE n.nspname = 'public'
--     AND c.relname IN ('bleu_events','bleu_decisions','bleu_plan','bleu_plan_events')
--     AND c.relkind = 'r'
--   GROUP BY c.relname, c.relrowsecurity
--   ORDER BY c.relname;
--
-- Expected: 4 rows, rls_enabled=true on all, grantees='(none)' on all.
--
-- Mission 1.5 then runs end-to-end with curl + smoke counts on bleu_events.
-- ============================================================================
