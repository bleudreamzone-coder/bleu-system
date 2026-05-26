-- Mission 8b — finish grant-exposure review (low-risk tail)
-- ============================================================================
-- Day-80 audit found 22 RLS-off + anon/auth-granted tables; 8 sensitive locked
-- in p8. Verified NO anon consumer exists anywhere: web frontend uses no anon
-- key; server.js uses SUPABASE_ANON_KEY only for GoTrue auth-verification (not
-- table reads); both edge functions use SUPABASE_SERVICE_ROLE_KEY. So revoking
-- anon is safe (server/edge use service-role; unaffected by RLS/grants).
--
-- Locking the 3 zero-PII tails for completeness. None hold user PII
-- (safety_checks has no user_id; reddit_mentions is scraped public data;
-- product_practitioner_links is relational).
--
-- LEFT OPEN intentionally (non-sensitive, intended-public reference data;
-- locking risks an external/SEO anon reader we can't see, for no security gain):
--   cities, classes, conditions, food_sources, protocols, pubmed_studies,
--   reviews, seo_pages, symptom_specialist_map, youtube_videos
-- NOT TOUCHED: spatial_ref_sys (PostGIS system table).
-- ============================================================================

BEGIN;

ALTER TABLE public.product_practitioner_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_mentions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checks              ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.product_practitioner_links FROM anon, authenticated;
REVOKE ALL ON public.reddit_mentions            FROM anon, authenticated;
REVOKE ALL ON public.safety_checks              FROM anon, authenticated;

COMMIT;
