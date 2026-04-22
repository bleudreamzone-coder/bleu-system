# Passport Health Columns Migration — 2026-04-22

## Why this migration exists

On 2026-04-22, end-to-end verification of the Passport write path (see `docs/passport-function-inventory.md` → "End-to-end write/read path verification") discovered that `syncHealthToSupabase` at `index.html:7499` has been writing 11 columns to `profiles` — of which only `medications` actually exists at the database level. The other 10 columns (`weight_lbs`, `resting_hr`, `hrv_ms`, `sleep_hrs`, `steps_daily`, `energy_score`, `anxiety_score`, `mood_score`, `primary_goal`, `health_updated_at`) were never created.

PostgREST responds to updates containing unknown columns with `400 PGRST204`. `upsertProfile` at `index.html:7474` wraps every write in `try { ... } catch(e) {}`, so the error was swallowed and the UI showed a success toast for a save that never persisted. Confirmed on 2026-04-22 via:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'weight_lbs','resting_hr','hrv_ms','sleep_hrs','steps_daily',
    'energy_score','anxiety_score','mood_score','primary_goal','health_updated_at'
  );
```

Result: **0 rows.** Every Passport health save since launch has landed nowhere.

This migration is the prerequisite for Block 1 wiring. Every downstream change (`/api/personalize` extension, server-to-localStorage hydration, `computeDimensionScores`, BHI recompute, Dashboard stat boxes) depends on these columns existing.

## What data was lost

**No production data was lost at the database layer, because no production data was ever persisted.**

- Every `syncHealthToSupabase` write silently 400'd; the row update never applied.
- `renderHealthData` at `index.html:7289` reads only `localStorage['bleu_health']`, so users saw their typed values re-hydrate on the same device and reasonably assumed the save had worked.
- Every user's Passport health data therefore exists only on the browser profile where it was entered. Clearing site data, switching devices, or using a different browser would have erased it for that user. Nothing in Supabase backs it up.

After the migration applies, the existing `syncHealthToSupabase` code will start writing successfully the next time a user opens the Passport health panel and saves — no code change needed on the write side, only the schema.

## How to apply

1. Open the Supabase dashboard for project `sqyzboesdpdussiwqpzk` (Bleu-Live).
2. Navigate to SQL Editor → New query.
3. Paste the full contents of `supabase/migrations/20260422_add_passport_health_columns.sql`.
4. Click Run.
5. The final `SELECT` in the file is the verification block. Expect **exactly 10 rows** in the result pane, alphabetically ordered: `anxiety_score`, `energy_score`, `health_updated_at`, `hrv_ms`, `mood_score`, `primary_goal`, `resting_hr`, `sleep_hrs`, `steps_daily`, `weight_lbs`. Each row should show the expected `data_type` (`numeric`, `smallint`, `integer`, `text`, or `timestamp with time zone`) and `is_nullable = YES`.
6. If you see 10 rows: migration successful. Proceed to Block 1 wiring (`/api/personalize` extension first).
7. If you see fewer than 10 rows: the `ALTER TABLE` statement or one of its `ADD COLUMN` clauses failed. Check the error pane in the SQL editor and stop — do not proceed to wiring until all 10 exist.

## Rollback

The migration is additive only — no data is transformed, no existing column is touched. Rollback is `ALTER TABLE profiles DROP COLUMN IF EXISTS <name>` per column, but there is no production reason to roll back: the columns are nullable with no default, so existing rows are unaffected.

## Notes on design choices

- **No `CHECK` constraints on score ranges.** The `syncHealthToSupabase` function does not clamp inputs. Adding `CHECK (energy_score BETWEEN 0 AND 100)` would cause writes from users who type outside that range to fail loudly, which is a behavior change beyond the scope of this fix. Ranges are documented in `COMMENT ON COLUMN` instead.
- **No indexes.** Passport reads these columns only by `profiles.id` (already the primary key). No query pattern in `server.js` or `index.html` filters or orders by a health column.
- **No default values.** `syncHealthToSupabase` only sets a column when the user provides input (`if (hd.weight)`), so `NULL` correctly represents "user has not provided this yet."
