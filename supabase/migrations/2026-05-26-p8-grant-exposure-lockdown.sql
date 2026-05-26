-- Mission 8 — grant-exposure lockdown (DRAFT — apply only on Soul-Gate)
-- ============================================================================
-- These tables had RLS DISABLED and anon/authenticated SELECT granted, so
-- anyone with the public anon key + project URL can read them over PostgREST.
-- The web frontend does NOT query Supabase directly (verified: no createClient/
-- .from()/anon-key in index.html or js/), so all reads go through server.js with
-- the service-role key — which bypasses RLS/grants and is UNAFFECTED by this.
--
-- IMPORTANT: this is defense-in-depth only. The exposed service_role key (pasted
-- in chat Day 80, not yet rotated) bypasses RLS entirely. Rotating that key is a
-- higher priority than this migration.
--
-- NOT touched: spatial_ref_sys (PostGIS system table); public reference tables
-- (cities, classes, conditions, food_sources, protocols, pubmed_studies,
-- reviews, seo_pages, symptom_specialist_map, youtube_videos) where anon read is
-- plausibly intended; and the low-risk set (product_practitioner_links,
-- reddit_mentions, safety_checks) — Captain to decide separately.
-- ============================================================================

BEGIN;

-- PII / clinical / sensitive B2B
ALTER TABLE public.marketplace_practitioners ENABLE ROW LEVEL SECURITY;  -- practitioner_email, practitioner_phone (PII)
ALTER TABLE public.practitioner_bookings     ENABLE ROW LEVEL SECURITY;  -- user_id, session_fee, session_datetime
ALTER TABLE public.dr_felicia_reviews        ENABLE ROW LEVEL SECURITY;  -- clinical competency scores + approval decisions
ALTER TABLE public.care_twin_patterns        ENABLE ROW LEVEL SECURITY;  -- employer_id findings/recommendations (B2B)
ALTER TABLE public.workforce_signals         ENABLE ROW LEVEL SECURITY;  -- per-employer workforce health aggregates (crisis %, etc.)
-- internal ops (no anon need)
ALTER TABLE public.daily_reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_log            ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.marketplace_practitioners FROM anon, authenticated;
REVOKE ALL ON public.practitioner_bookings     FROM anon, authenticated;
REVOKE ALL ON public.dr_felicia_reviews        FROM anon, authenticated;
REVOKE ALL ON public.care_twin_patterns        FROM anon, authenticated;
REVOKE ALL ON public.workforce_signals         FROM anon, authenticated;
REVOKE ALL ON public.daily_reports             FROM anon, authenticated;
REVOKE ALL ON public.pipeline_log              FROM anon, authenticated;
REVOKE ALL ON public.validation_log            FROM anon, authenticated;

COMMIT;
