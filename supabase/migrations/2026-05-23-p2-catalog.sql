-- Phase 2 — Commerce Steward Catalog (P2)
-- ============================================================================
-- Generated: 2026-05-23
-- Doctrine:  "BLEU helps people start the right plan, not push to buy."
-- Authority: Captain Soul Gate — Phase 2 v2 retargeted Mission 2.1.
--
-- DO NOT APPLY UNTIL BLEU HAS READ THIS FILE.
-- ============================================================================
--
-- WHAT THIS MIGRATION CREATES
--
-- One table: bleu_catalog — the canonical source of truth for commerce
-- offerings rendered by Commerce Steward (Five Brains). Three rails:
--
--   Rail A — BLEU-owned Stripe protocols. Felicia signoff carried. The
--            primary path. Button label "Start". $49–$69/month.
--
--   Rail B — Reserved for Fullscript clinical templates. fullscript_template_id
--            stays NULL in Phase 2; first row populated when a clinically-
--            governed plan ships. Button label "View plan".
--
--   Rail C — Amazon affiliate fallback for single-supplement queries.
--            Button label "Add it". Disclosure required. tag=bleulive20-20.
--            price_cents intentionally NULL — Amazon prices fluctuate;
--            we never quote a stale number in our copy.
--
-- ============================================================================
--
-- SEED DATA — 16 rows total (12 active, 4 inactive)
--
-- Rail A: 4 active. felicia_signoff=true, signoff_date=2026-05-21.
--   sleep_reset / stress_protocol / longevity_core / gut_reset
--
-- Rail C: 8 active + 4 inactive.
--   Six rows use ASINs verified from prior project context (the original
--   v2.1 catalog spec): magnesium_glycinate, l_theanine_200mg,
--   ashwagandha_ksm66, omega3_epadha_2g, vitamin_d3_5000iu_k2,
--   zinc_picolinate_15mg.
--
--   Two rows use BEST-GUESS ASINs flagged below per Captain authorization:
--   melatonin_3mg_timed_release and psyllium_husk_capsules. Captain
--   verifies later via Amazon Studio and either confirms or runs UPDATE
--   to swap in the correct ASIN.
--
--   Note: zinc_picolinate_30mg in the v2.2 spec was renamed to
--   zinc_picolinate_15mg here per Captain — Thorne Zinc Picolinate is
--   15mg; we don't ship a SKU labeled with a strength the listing doesn't
--   carry.
--
--   Four rows ship active=false as schema placeholders awaiting ASIN
--   research from Captain: creatine_monohydrate_5g, bcaa_2_1_1,
--   nad_precursor, hawthorn_extract. They will not render until Captain
--   runs UPDATE bleu_catalog SET amazon_asin='...', amazon_url='...',
--   active=true WHERE sku='...'.
--
-- ============================================================================
--
-- ACCESS MODEL
--
-- All reads/writes server-mediated via service-role querySupabase. RLS on,
-- zero policies, anon/authenticated REVOKE'd. Same defense-in-depth as
-- Phase 1 audit tables (Option C + RLS belt and suspenders).
--
-- ============================================================================
--
-- APPLICATION INSTRUCTIONS (manual, by Bleu)
--
-- Option 1 — Supabase Dashboard SQL Editor (recommended for review):
--   1. Open https://supabase.com/dashboard/project/sqyzboesdpdussiwqpzk/sql/new
--   2. Paste the BEGIN ... COMMIT block below
--   3. Click Run
--   4. Run the POST-APPLICATION VERIFICATION query to confirm row counts.
--
-- Option 2 — supabase db push from this repo (after link):
--   supabase db push
--
-- Mission 2.2 (Five Brains) queries bleu_catalog. Mission 2.3 wires the
-- result into the chat stream as a cards SSE payload. Applying this
-- migration is the gate before Mission 2.3 produces non-empty card arrays.
--
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- bleu_catalog — Commerce Steward source of truth
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bleu_catalog (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                     text        UNIQUE NOT NULL,
  rail                    text        NOT NULL CHECK (rail IN ('A','B','C')),
  name                    text        NOT NULL,
  description             text,
  category                text,
  price_cents             integer,
  monthly                 boolean     DEFAULT false,
  stripe_price_id         text,                          -- Rail A only
  amazon_asin             text,                          -- Rail C only
  amazon_url              text,                          -- Rail C only; full URL with tag=bleulive20-20
  fullscript_template_id  text,                          -- Rail B only; NULL until Phase 3+
  felicia_signoff         boolean     DEFAULT false,
  signoff_date            date,
  evidence_grade          text        CHECK (evidence_grade IN ('A','B','C','D') OR evidence_grade IS NULL),
  active                  boolean     DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_rail_active ON public.bleu_catalog (rail, active);
CREATE INDEX IF NOT EXISTS idx_catalog_sku        ON public.bleu_catalog (sku);

ALTER TABLE public.bleu_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bleu_catalog FROM anon;
REVOKE ALL ON TABLE public.bleu_catalog FROM authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Rail A — 4 BLEU-owned Stripe protocols, signed off by Dr. Stoler 2026-05-21
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO public.bleu_catalog
  (sku, rail, name, description, category, price_cents, monthly,
   stripe_price_id, felicia_signoff, signoff_date, evidence_grade, active)
VALUES
  ('sleep_reset',      'A', 'Sleep Reset',
   'Get to sleep faster. Wake clearer.',
   'sleep',     4900, true,
   'price_1TEKQmK4cATmIFbokmkYg47S', true, DATE '2026-05-21', 'A', true),

  ('stress_protocol', 'A', 'Stress Protocol',
   'Take the edge off without taking yourself out.',
   'stress',    4500, true,
   'price_1TEKS6K4cATmIFbo1OW7BeCW', true, DATE '2026-05-21', 'A', true),

  ('longevity_core',  'A', 'Longevity Core',
   'The daily foundation that compounds.',
   'longevity', 6900, true,
   'price_1TEKSWK4cATmIFbojDTEJng9', true, DATE '2026-05-21', 'A', true),

  ('gut_reset',       'A', 'Gut Reset',
   'Restore the system that runs everything else.',
   'gut',       5500, true,
   'price_1TEKSsK4cATmIFbouxOBHtwQ', true, DATE '2026-05-21', 'A', true);

-- ─────────────────────────────────────────────────────────────────────────
-- Rail C — 8 Amazon affiliate active rows. tag=bleulive20-20.
-- ASIN provenance:
--   VERIFIED  — ASIN reused from prior project context (v2.1 catalog spec).
--   BEST_GUESS — Captain-authorized best guess; verify and UPDATE if wrong.
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO public.bleu_catalog
  (sku, rail, name, description, category,
   amazon_asin, amazon_url, felicia_signoff, active)
VALUES
  -- VERIFIED — NOW Foods Magnesium Glycinate
  ('magnesium_glycinate', 'C', 'NOW Foods Magnesium Glycinate',
   'A common support used for calm, sleep, and muscle relaxation.',
   'sleep',
   'B0CB984SHQ', 'https://www.amazon.com/dp/B0CB984SHQ?tag=bleulive20-20',
   false, true),

  -- VERIFIED — NOW Foods L-Theanine 200mg
  ('l_theanine_200mg', 'C', 'NOW Foods L-Theanine 200mg',
   'An amino acid often used for calm focus without drowsiness.',
   'stress',
   'B00GQV9YX6', 'https://www.amazon.com/dp/B00GQV9YX6?tag=bleulive20-20',
   false, true),

  -- BEST_GUESS — Natrol Melatonin 3mg Time Release (verify ASIN)
  ('melatonin_3mg_timed_release', 'C', 'Natrol Melatonin 3mg Time Release',
   'Timed-release melatonin used to support falling and staying asleep.',
   'sleep',
   'B003B3OOPA', 'https://www.amazon.com/dp/B003B3OOPA?tag=bleulive20-20',
   false, true),

  -- VERIFIED — Jarrow KSM-66 Ashwagandha
  ('ashwagandha_ksm66', 'C', 'Jarrow KSM-66 Ashwagandha',
   'A well-studied adaptogen used for stress modulation and resilience.',
   'stress',
   'B01D7YKVWQ', 'https://www.amazon.com/dp/B01D7YKVWQ?tag=bleulive20-20',
   false, true),

  -- VERIFIED — Nordic Naturals ProOmega 2000
  ('omega3_epadha_2g', 'C', 'Nordic Naturals ProOmega 2000',
   'High-potency omega-3 (EPA+DHA) for heart, brain, and inflammation support.',
   'longevity',
   'B01HQPYHDC', 'https://www.amazon.com/dp/B01HQPYHDC?tag=bleulive20-20',
   false, true),

  -- VERIFIED — NOW Foods Vitamin D3 + K2
  ('vitamin_d3_5000iu_k2', 'C', 'NOW Foods Vitamin D3 5000 IU + K2',
   'Vitamin D3 paired with K2 for bone and calcium balance.',
   'longevity',
   'B01GBGS7JU', 'https://www.amazon.com/dp/B01GBGS7JU?tag=bleulive20-20',
   false, true),

  -- BEST_GUESS — NOW Foods Psyllium Husk Caps (verify ASIN)
  ('psyllium_husk_capsules', 'C', 'NOW Foods Psyllium Husk Caps',
   'Soluble fiber used to support regularity and gut motility.',
   'gut',
   'B0013OVZWQ', 'https://www.amazon.com/dp/B0013OVZWQ?tag=bleulive20-20',
   false, true),

  -- VERIFIED — Thorne Zinc Picolinate 15mg
  -- (SKU renamed from zinc_picolinate_30mg → zinc_picolinate_15mg per Captain;
  --  Thorne's listing is 15mg, not 30mg, so the SKU name matches the dosage.)
  ('zinc_picolinate_15mg', 'C', 'Thorne Zinc Picolinate 15mg',
   'Highly absorbable zinc for immune and metabolic support.',
   'longevity',
   'B004O89XFS', 'https://www.amazon.com/dp/B004O89XFS?tag=bleulive20-20',
   false, true);

-- ─────────────────────────────────────────────────────────────────────────
-- Rail C — 4 inactive placeholders awaiting Captain-provided ASINs.
-- Will not render until UPDATE bleu_catalog SET amazon_asin='...',
-- amazon_url='https://www.amazon.com/dp/...?tag=bleulive20-20',
-- active=true WHERE sku='...';
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO public.bleu_catalog
  (sku, rail, name, description, category, felicia_signoff, active)
VALUES
  ('creatine_monohydrate_5g', 'C', 'Creatine Monohydrate 5g',
   'Well-studied compound for strength, recovery, and cognitive support.',
   'longevity', false, false),

  ('bcaa_2_1_1', 'C', 'BCAA 2:1:1',
   'Branched-chain amino acids for muscle repair and lean tissue support.',
   'longevity', false, false),

  ('nad_precursor', 'C', 'NAD+ Precursor (NR)',
   'Nicotinamide riboside, a precursor studied for cellular energy support.',
   'longevity', false, false),

  ('hawthorn_extract', 'C', 'Hawthorn Extract',
   'Traditional herbal support for cardiovascular health.',
   'longevity', false, false);

COMMIT;

-- ============================================================================
-- POST-APPLICATION VERIFICATION
-- ============================================================================
--
-- Confirm seed counts:
--
--   SELECT rail,
--          count(*) FILTER (WHERE active)     AS active_count,
--          count(*) FILTER (WHERE NOT active) AS inactive_count
--   FROM public.bleu_catalog
--   GROUP BY rail
--   ORDER BY rail;
--
-- Expected:
--   A | 4 | 0
--   C | 8 | 4
--
-- Confirm RLS posture (same template as Phase 1):
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
--     AND c.relname = 'bleu_catalog'
--     AND c.relkind = 'r'
--   GROUP BY c.relname, c.relrowsecurity;
--
-- Expected: 1 row, rls_enabled=true, grantees=(none).
-- ============================================================================
