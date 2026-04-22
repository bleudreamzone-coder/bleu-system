# BHI Columns Migration — 2026-04-22

## Why this migration exists

Wire 5 of Block 1 replaces the hardcoded Dashboard BHI IIFE (`index.html:2169–2202` — a parse-time script that averaged a static 7-entry `dims` array and always produced `466 / "Developing"`) with a runtime function driven by the 9-dimension scoring engine shipped in wire 4 (commit `127a485`).

The new renderer `renderDashboardBHI()` needs to persist the computed BHI score so it survives device change — the same round-trip discipline wire 3 established for health data. Without these two columns, every BHI write would silently 400 at PostgREST and be swallowed by the fire-and-forget `.catch(()=>{})`, exactly the bug we fixed this morning for the passport health columns.

This migration is the prerequisite for Phase B of wire 5 (the frontend engine additions + IIFE removal + tier-legend relabel + three hook-point integrations).

## Relationship to wire 4

Wire 4 (commit `127a485`) shipped the 9 pure dimension scorers (`scoreSleep`, `scoreMind`, `scoreMovement`, `scoreNutrition`, `scoreSocial`, `scoreFinance`, `scoreSpirit`, `scoreRecovery`, `scoreEcs`), the `computeDimensionScores()` orchestrator, and the `renderDimensionTiles()` Passport-tile renderer. Each scorer returns a 0–100 integer.

Wire 5 adds a second layer on top of the same engine:

- `computeBHI(dimensionScores)` — pure function, takes the scores object from `computeDimensionScores()`, returns `{bhi, tier}`.
- `renderDashboardBHI()` — runtime renderer. Reads state via `collectUserData()`, runs scorers via `computeDimensionScores()`, composes BHI via `computeBHI()`, writes three Dashboard DOM elements (`#bhi-num`, `#bhi-tier-lbl`, `#bhi-dim-bars`), and **persists `bhi_score` + `bhi_updated_at` to `profiles`** via `sbClient.from('profiles').update(...)` fire-and-forget.

The BHI is a **function** of the dimension scores. It's not a separate score with its own signals — it's the composite. So wire 5 doesn't add new inputs; it adds a new output derived from wire 4's existing outputs.

## Formula v1 (pending clinical review)

```
BHI = clamp(round(mean(dimensionScores)), 0, 100)
```

Where `dimensionScores` is the 9-entry object returned by `computeDimensionScores()` (with the `_version` key excluded). Simple arithmetic mean, rounded, clamped.

Same v1-heuristic spirit as the individual scorers: good enough to ship a real number today, transparent enough that Dr. Stoler can replace the formula with a weighted mean by clinical priority (or any other composition) without touching the orchestrator, renderer, persistence, or tier-banding logic. Single-function swap.

Marked in-code as `DIMENSION_SCORING_VERSION = 'v1-heuristic-pending-clinical-review'` — the same version string wire 4 used, since BHI is part of the same engine layer.

## Tier banding v1 (pending clinical review)

| Score range | Tier label |
|---|---|
| 0–30 | Foundations |
| 31–50 | Building |
| 51–70 | Thriving |
| 71–85 | Flourishing |
| 86–100 | Optimal |

Encoded in the engine as a `TIER_BANDS` constant. Labels chosen for dignity across the range:

- **Foundations** — not "Starting" or "Beginner." What you have when you're early in the work. A user at 25 is at the foundation of their path, not failing.
- **Building** — active, present-tense, aspirational without being saccharine.
- **Thriving** — warm, recognizable, middle-of-the-pack users feel seen.
- **Flourishing** — borrowed from positive-psychology literature (Seligman, PERMA). Clinical legitimacy Dr. Stoler will recognize.
- **Optimal** — achievable, not superlative. "Elite/Peak/Master" would feel gamified.

None shame low scores. All describe state, not prescribe medicine. All work equally across age and starting-point.

The legacy HTML tier legend at `index.html:2157–2161` used the prior 0–1000 scale with labels Critical/Developing/Active/Thriving/Apex. Wire 5 Phase B will rewrite that legend to the new 5-tier naming on the 0–100 scale.

## How to apply

1. Open the Supabase dashboard for project `sqyzboesdpdussiwqpzk` (Bleu-Live).
2. Navigate to SQL Editor → New query.
3. Paste the full contents of `supabase/migrations/20260422_add_bhi_columns.sql`.
4. Click Run.
5. The final `SELECT` is the verification block. Expect **exactly 2 rows**, alphabetically ordered: `bhi_score` and `bhi_updated_at`. `data_type` should show `smallint` and `timestamp with time zone` respectively, `is_nullable = YES` on both.
6. If you see 2 rows: migration successful. Proceed to wire 5 Phase B (frontend).
7. If you see fewer than 2 rows: check the error pane. Do not proceed to Phase B until both columns exist — the frontend write path will silently fail at PostgREST the same way the morning's health columns did.

## Rollback

Additive-only migration. No data is transformed, no existing column is touched. Rollback is `ALTER TABLE profiles DROP COLUMN IF EXISTS bhi_score; ALTER TABLE profiles DROP COLUMN IF EXISTS bhi_updated_at;`. Both columns are nullable with no defaults, so existing rows are unaffected by the add.

## Notes on design choices

- **No `CHECK (bhi_score BETWEEN 0 AND 100)`.** Matches the precedent set by this morning's passport health columns migration. `computeBHI` already clamps the value client-side, so the DB-layer constraint would only ever catch a client bug — and if one ever happens, we'd rather log and keep the write than crash the `.update()`. Range lives in `COMMENT ON COLUMN`.
- **No default value.** `NULL` means "this user has not yet had a BHI computed" — accurate for users who were created before wire 5 deployed. A default of `0` or `50` would be a lie.
- **No index.** The BHI columns are read only by the user's own row (`WHERE id = <user_id>`) — the existing primary key index already handles that. Cohort queries (e.g., "average BHI across all users this week") would use the `jazz_bird_ci_research` view or ad-hoc aggregation, not a real-time index on `profiles.bhi_score`.
- **Two columns, not one JSON.** `bhi_updated_at` as a separate column (vs. a `bhi: {score, updated_at}` JSONB) keeps it queryable and aligns with the `health_updated_at` pattern from this morning's migration. JSONB would make "show me users whose BHI changed in the last 24 hours" a harder query than it needs to be.
