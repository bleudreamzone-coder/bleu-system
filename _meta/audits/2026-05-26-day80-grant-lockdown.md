# Grant-exposure lockdown — 2026-05-26 (Day 80)

## Finding
Live query: **22** public tables had RLS disabled AND `anon`/`authenticated`
SELECT granted — readable by anyone with the public anon key + project URL via
PostgREST. (The Day-80 total-system-audit said "11" — corrected here to 22.)
Frontend verified to NOT use the anon key (no `createClient`/`.from()` in
`index.html`/`js/`), so all app reads go through `server.js` service-role —
unaffected by revoking anon.

## Applied (Management API, HTTP 201) — `2026-05-26-p8-grant-exposure-lockdown.sql`
Enabled RLS + revoked anon/authenticated on 8 tables. Post-apply verify: all 8
`rls=true`, grants `NONE`.

| Table | Why locked |
|---|---|
| marketplace_practitioners | practitioner_email, practitioner_phone (PII) |
| practitioner_bookings | user_id, session_fee, session_datetime (user PII) |
| dr_felicia_reviews | clinical competency scores + approval decisions |
| care_twin_patterns | per-employer B2B findings/recommendations |
| workforce_signals | per-employer workforce health aggregates (crisis %, alerts) |
| daily_reports | internal pipeline stats |
| pipeline_log | internal scrape ops |
| validation_log | internal validation log |

## Left intentionally
- **Optional (Captain deferred):** product_practitioner_links, reddit_mentions, safety_checks (no user_id; aggregate).
- **Public reference (anon read plausibly intended):** cities, classes, conditions, food_sources, protocols, pubmed_studies, reviews, seo_pages, symptom_specialist_map, youtube_videos.
- **System (never touch):** spatial_ref_sys (PostGIS).

## ⚠️ Does NOT close the bigger hole
The `service_role` key exposed in chat (Day 80) bypasses RLS + grants entirely
and is **not yet rotated**. This lockdown is defense-in-depth; key rotation
remains the top security action.
