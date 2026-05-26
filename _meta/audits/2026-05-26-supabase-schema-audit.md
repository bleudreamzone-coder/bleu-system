# Supabase Schema Audit — 2026-05-26 (read-only, via Management API)

**62 public base tables.** Row counts use `pg_class.reltuples` (approx; `-1`/unknown = never ANALYZEd).

## Foreign-key graph (only 9 FK relationships exist)
- `bleu_citizens → profiles`
- `magic_links → bleu_citizens`
- `bleu_comms → bleu_citizens`
- `bleu_plan_events → bleu_plan`
- `bleu_open_window_actions → bleu_open_windows`
- `dr_felicia_reviews → marketplace_practitioners`
- `practitioner_bookings → marketplace_practitioners`
- `product_practitioner_links → practitioners, products`

**Implication:** the Mission-6/7 app tables (citizens/magic_links/comms/plan) are properly related; the ~50 data-pipeline tables (practitioners, products, pubmed_studies, reddit_mentions, etc.) are intentionally denormalized scraper sinks with no FKs — normal for an ingest DB, not a defect.

## Indexes
Mission-6/7 tables carry the indexes defined in their migrations (bleu_events, bleu_citizens, magic_links, bleu_comms all index their lookup columns + status/sent_at). 🔍 The large legacy tables (practitioners ~434k, locations ~23k, products ~9.5k) were not index-audited this pass — recommend `EXPLAIN` on the practitioner search query before traffic grows.

## Custom (non-extension) RPC functions
`calculate_practitioner_trust`, `calculate_product_trust`, `calculate_user_lss`. (Everything else is PostGIS / pgvector / pg_trgm extension machinery.) 🔍 Whether these 3 are called by current code was not traced — verify they're live or candidates for removal.

## Row-level security posture (post Day-80 lockdown)
- All Mission-6/7 + audit tables: RLS on, no anon/auth grants ✅
- 11 sensitive/low-PII tables locked Day-80 (p8 + p8b) ✅
- 10 public reference tables: anon read by design (cities, classes, conditions, food_sources, protocols, pubmed_studies, reviews, seo_pages, symptom_specialist_map, youtube_videos)
- `spatial_ref_sys`: PostGIS system table (untouched, correct)
- ~25 tables have RLS **off** but also **no anon/auth grants** (service-role only) — acceptable (e.g., user_coherence, emotional_signals); RLS-on would be belt-and-suspenders.

## Day-81 schema hardening candidates
1. Run `ANALYZE` — most tables show `reltuples=-1` (never analyzed) → planner is flying blind; could cause bad query plans at scale.
2. Consider RLS-on (still service-only) for the ~25 RLS-off/no-grant tables for defense-in-depth.
3. Verify the 3 custom RPCs are still used; drop if dead.
4. `outcome_events` has anon/auth grant + RLS on — confirm intended (telemetry table).
