-- 2026-06-02 RLS Exposure Remediation
-- DO NOT APPLY without Captain Soul-Gate and Dr. Felicia
-- signoff on clinical-data table policies per
-- _meta/audits/2026-06-02-rls-exposure-audit.md
-- Section 6 (Application Checklist)
--
-- Candidate source artifact only. This file was not executed by Codex.
-- Captain applies manually through the Bleu-Live Supabase SQL Editor after review.

BEGIN;

-- Step 1: Revoke broad anon defaults (audit Section 3).
-- No ALTER DEFAULT PRIVILEGES ... GRANT ... TO anon statement was found in
-- supabase/migrations/ as of 2026-06-02, so there is no default-privilege
-- revoke to run from migration history alone. Direct table anon revokes remain
-- below as defense-in-depth.

-- Step 2: Enable RLS on every table classified as P0/P2 from migration history.
-- P0: user_coherence was created by add_coherence_index.sql and lacks an actual
-- non-comment ALTER TABLE ... ENABLE ROW LEVEL SECURITY statement in migrations.
ALTER TABLE public.user_coherence ENABLE ROW LEVEL SECURITY;

-- P2: these tables already have RLS enabled in their creating migrations but no
-- CREATE POLICY statements; the ALTERs are idempotent belt-and-suspenders.
ALTER TABLE public.bleu_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_plan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_open_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_open_window_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_commerce_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bleu_comms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Step 3A: Revoke anon on protected tables (audit Sections 2-4).
-- Anon receives no table access in this remediation plan.
REVOKE ALL ON TABLE public.user_coherence FROM anon;
REVOKE ALL ON TABLE public.bleu_events FROM anon;
REVOKE ALL ON TABLE public.bleu_decisions FROM anon;
REVOKE ALL ON TABLE public.bleu_plan FROM anon;
REVOKE ALL ON TABLE public.bleu_plan_events FROM anon;
REVOKE ALL ON TABLE public.bleu_catalog FROM anon;
REVOKE ALL ON TABLE public.bleu_open_windows FROM anon;
REVOKE ALL ON TABLE public.bleu_open_window_actions FROM anon;
REVOKE ALL ON TABLE public.bleu_commerce_settings FROM anon;
REVOKE ALL ON TABLE public.bleu_citizens FROM anon;
REVOKE ALL ON TABLE public.stripe_processed_events FROM anon;
REVOKE ALL ON TABLE public.bleu_comms FROM anon;
REVOKE ALL ON TABLE public.magic_links FROM anon;

-- Step 3B: Preserve conservative authenticated posture except explicit own-row
-- SELECT surfaces below. Existing app flows are server-mediated; service_role
-- remains the operational writer/reader.
REVOKE ALL ON TABLE public.bleu_events FROM authenticated;
REVOKE ALL ON TABLE public.bleu_decisions FROM authenticated;
REVOKE ALL ON TABLE public.bleu_plan FROM authenticated;
REVOKE ALL ON TABLE public.bleu_plan_events FROM authenticated;
REVOKE ALL ON TABLE public.bleu_catalog FROM authenticated;
REVOKE ALL ON TABLE public.bleu_open_windows FROM authenticated;
REVOKE ALL ON TABLE public.bleu_open_window_actions FROM authenticated;
REVOKE ALL ON TABLE public.bleu_commerce_settings FROM authenticated;
REVOKE ALL ON TABLE public.stripe_processed_events FROM authenticated;
REVOKE ALL ON TABLE public.bleu_comms FROM authenticated;
REVOKE ALL ON TABLE public.magic_links FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_coherence FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.bleu_citizens FROM authenticated;

-- FELICIA-SIGNOFF-REQUIRED before applying: user_coherence
-- user_coherence stores per-user coherence, physiological, and location context;
-- allow authenticated SELECT only for rows whose user_id matches auth.uid().
GRANT SELECT ON TABLE public.user_coherence TO authenticated;
CREATE POLICY user_coherence_service_role_all ON public.user_coherence
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
CREATE POLICY user_coherence_authenticated_select_own ON public.user_coherence
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- bleu_events stores session/user audit payloads; keep service-role only until
-- app-layer direct-reader requirements are explicitly approved.
CREATE POLICY bleu_events_service_role_all ON public.bleu_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- bleu_decisions stores Decision Objects/audit outputs; service-role only.
CREATE POLICY bleu_decisions_service_role_all ON public.bleu_decisions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- bleu_plan stores governed plan contents; service-role only pending a product
-- decision about direct authenticated reads.
CREATE POLICY bleu_plan_service_role_all ON public.bleu_plan
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- bleu_plan_events stores plan lifecycle history; service-role only.
CREATE POLICY bleu_plan_events_service_role_all ON public.bleu_plan_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- bleu_catalog is commerce reference/offer data; keep server-mediated so future
-- public-read intent is an explicit Captain decision, not an inherited grant.
CREATE POLICY bleu_catalog_service_role_all ON public.bleu_catalog
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- bleu_open_windows stores behavioral timing/readiness signals; service-role only.
CREATE POLICY bleu_open_windows_service_role_all ON public.bleu_open_windows
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- bleu_open_window_actions stores action history tied to open windows; service-role only.
CREATE POLICY bleu_open_window_actions_service_role_all ON public.bleu_open_window_actions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- bleu_commerce_settings stores internal commerce flags; service-role only.
CREATE POLICY bleu_commerce_settings_service_role_all ON public.bleu_commerce_settings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- FELICIA-SIGNOFF-REQUIRED before applying: bleu_citizens
-- bleu_citizens stores Citizen identity links; authenticated SELECT is limited
-- to profile_id = auth.uid() and requires clinical/privacy signoff before apply.
GRANT SELECT ON TABLE public.bleu_citizens TO authenticated;
CREATE POLICY bleu_citizens_service_role_all ON public.bleu_citizens
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
CREATE POLICY bleu_citizens_authenticated_select_own ON public.bleu_citizens
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- stripe_processed_events stores webhook idempotency state; service-role only.
CREATE POLICY stripe_processed_events_service_role_all ON public.stripe_processed_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- bleu_comms stores hashed recipient communications audit; service-role only.
CREATE POLICY bleu_comms_service_role_all ON public.bleu_comms
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- magic_links stores passwordless auth tokens and request metadata; service-role only.
CREATE POLICY magic_links_service_role_all ON public.magic_links
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- FELICIA-SIGNOFF-REQUIRED before applying: counterfactual_reviews
-- Existing migration already creates service_role-only policy; marker included
-- because reviewer authority and clinical counterfactuals are clinical surfaces.

-- FELICIA-SIGNOFF-REQUIRED before applying: memory_records
-- Existing migration already creates service_role plus session-scoped SELECT;
-- retention and MemoryRecord payload policy remain clinical/privacy surfaces.

-- FELICIA-SIGNOFF-REQUIRED before applying: outcome_checkpoints
-- Existing migration already creates service_role plus citizen-scoped SELECT;
-- outcome capture protocol and retention policy require clinical signoff.

-- Step 4: Verification queries. These SELECTs are informational only.
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'user_coherence',
    'bleu_events',
    'bleu_decisions',
    'bleu_plan',
    'bleu_plan_events',
    'bleu_catalog',
    'bleu_open_windows',
    'bleu_open_window_actions',
    'bleu_commerce_settings',
    'bleu_citizens',
    'stripe_processed_events',
    'bleu_comms',
    'magic_links'
  )
ORDER BY c.relname;

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_coherence',
    'bleu_events',
    'bleu_decisions',
    'bleu_plan',
    'bleu_plan_events',
    'bleu_catalog',
    'bleu_open_windows',
    'bleu_open_window_actions',
    'bleu_commerce_settings',
    'bleu_citizens',
    'stripe_processed_events',
    'bleu_comms',
    'magic_links',
    'counterfactual_reviews',
    'memory_records',
    'metric_events',
    'outcome_checkpoints',
    'shadow_observations',
    'tool_invocation_log'
  )
ORDER BY tablename, policyname;

SELECT count(*) FROM pg_policies WHERE schemaname = 'public';

COMMIT;
