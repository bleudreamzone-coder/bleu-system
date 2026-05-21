-- TD-003-P0 — REVOKE anon/authenticated access on 7 user-data tables
-- ============================================================================
-- Generated: 2026-05-21 (afternoon ship session)
-- Discovery: supabase/policies/PROCEDURE.md credentialed pull
-- Finding:   _meta/rls-audit-2026-05-21.txt
-- Decision:  SHIP_IT_PROMPT.md TASK 1 — Option C (REVOKE, no RLS layer)
--
-- DO NOT APPLY UNTIL BLEU HAS READ THIS FILE.
-- ============================================================================
--
-- WHY THIS FIX
--
-- All 7 listed tables currently have:
--   - rls_enabled = false
--   - GRANT ALL ON TABLE ... TO anon
--   - GRANT ALL ON TABLE ... TO authenticated
--
-- The public anon JWT is embedded in index.html line 795 (correct usage —
-- anon keys are public by design). With GRANT ALL TO anon and no RLS,
-- anyone with that key can SELECT/INSERT/UPDATE/DELETE every row of these
-- tables. Most damaging: user_coherence.phone (SMS reorder numbers).
--
-- Verification done before writing this migration:
--   $ grep -rn "<7 tables>" --include="*.html" --include="*.js" --include="*.ts"
--   - server.js:                   uses SUPABASE_SERVICE_KEY (service-role)
--   - supabase/functions/alvai:    uses SUPABASE_SERVICE_ROLE_KEY (service-role)
--   - index.html:                  zero references
--
-- All legitimate writes/reads of these 7 tables happen via the service-role
-- JWT, which bypasses both GRANT and RLS. Revoking anon/authenticated
-- breaks nothing for legitimate use and closes the exposure completely.
--
-- ============================================================================
--
-- DEFENSE-IN-DEPTH NOTE (not in this migration, Bleu's call)
--
-- This migration follows Option C from _meta/rls-audit-2026-05-21.txt:
-- REVOKE only, no RLS enable. The README at supabase/policies/README.md
-- says these tables MUST have rls_enabled = true. With REVOKE-only, the
-- README claim is technically not satisfied, though the security posture
-- is equivalent (no non-service role can touch the table either way).
--
-- If you want defense-in-depth, append before applying:
--
--   ALTER TABLE public.user_coherence      ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.commitments         ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.emotional_signals   ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.predictive_signals  ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.session_embeddings  ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.user_arcs           ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.agent11_syntheses   ENABLE ROW LEVEL SECURITY;
--
-- With RLS on and zero policies, service_role still bypasses; anon and
-- authenticated would also be denied even if a future migration accidentally
-- re-granted them. Costless second layer.
--
-- ============================================================================
--
-- APPLICATION INSTRUCTIONS (manual, by Bleu)
--
-- Option 1 — Supabase Dashboard SQL Editor (recommended for review):
--   1. Open https://supabase.com/dashboard/project/sqyzboesdpdussiwqpzk/sql/new
--   2. Paste the BEGIN ... COMMIT block below
--   3. Click Run
--   4. Re-run supabase/policies/PROCEDURE.md to confirm REVOKE took
--
-- Option 2 — supabase db push from this repo (after link):
--   supabase db push
--   (Will apply this migration along with any other pending ones.)
--
-- ============================================================================

BEGIN;

-- user_coherence — per-user phone, CI, ISI scores (SMS reorder data)
REVOKE ALL ON TABLE public.user_coherence FROM anon;
REVOKE ALL ON TABLE public.user_coherence FROM authenticated;

-- commitments — per-user commitments extracted from sessions
REVOKE ALL ON TABLE public.commitments FROM anon;
REVOKE ALL ON TABLE public.commitments FROM authenticated;

-- emotional_signals — per-user emotional state (hopelessness, anxiety, etc.)
REVOKE ALL ON TABLE public.emotional_signals FROM anon;
REVOKE ALL ON TABLE public.emotional_signals FROM authenticated;

-- predictive_signals — per-user stall/streak/escalation predictions
REVOKE ALL ON TABLE public.predictive_signals FROM anon;
REVOKE ALL ON TABLE public.predictive_signals FROM authenticated;

-- session_embeddings — per-session 1536-dim vectors (PII via session_id ↔ user_id)
REVOKE ALL ON TABLE public.session_embeddings FROM anon;
REVOKE ALL ON TABLE public.session_embeddings FROM authenticated;

-- user_arcs — per-user narrative arcs
REVOKE ALL ON TABLE public.user_arcs FROM anon;
REVOKE ALL ON TABLE public.user_arcs FROM authenticated;

-- agent11_syntheses — per-user agent synthesis output (cached by query_hash)
REVOKE ALL ON TABLE public.agent11_syntheses FROM anon;
REVOKE ALL ON TABLE public.agent11_syntheses FROM authenticated;

COMMIT;

-- ============================================================================
-- POST-APPLICATION VERIFICATION
-- ============================================================================
--
-- Run this in the SQL editor after applying to confirm:
--
--   SELECT
--     table_name,
--     grantee,
--     string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privs
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public'
--     AND table_name IN (
--       'user_coherence', 'commitments', 'emotional_signals',
--       'predictive_signals', 'session_embeddings', 'user_arcs',
--       'agent11_syntheses'
--     )
--     AND grantee IN ('anon', 'authenticated', 'service_role')
--   GROUP BY table_name, grantee
--   ORDER BY table_name, grantee;
--
-- Expected: only `service_role` rows for each of the 7 tables.
-- If `anon` or `authenticated` rows still appear: the REVOKE did not apply.
--
-- Then re-run supabase/policies/PROCEDURE.md end-to-end and confirm the
-- new _meta/rls-audit-2026-05-21.txt reflects the change. Update FU-004
-- status to RESOLVED if so.
