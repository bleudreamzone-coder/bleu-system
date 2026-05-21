# RLS Snapshot Procedure

How to pull the current Supabase RLS posture into this repo. **Run this when Bleu has Supabase admin credentials in hand.**

This procedure was scaffolded on 2026-05-21 but not executed in that session because the credentialed pull happens outside the Claude Code execution environment.

## Prerequisites

- Supabase CLI installed (`npm i -g supabase` or `curl -fsSL https://supabase.com/install.sh | sh`)
- Supabase access token in env (`SUPABASE_ACCESS_TOKEN`) OR `supabase login` in your shell
- Project ref: `sqyzboesdpdussiwqpzk`
- Read access to the project (admin or db-readonly role; the service-role key is sufficient)

## Step 1 — Link the local repo to the project

From the repo root:

```bash
supabase link --project-ref sqyzboesdpdussiwqpzk
```

This creates `.supabase/config.json` and `.supabase/.temp/`. Both are gitignored (`.supabase/` was added to `.gitignore` in the same PR that introduced this folder).

## Step 2 — Full schema snapshot

```bash
DATE=$(date -u +%Y-%m-%d)
supabase db dump --schema public --schema-only > supabase/schema-snapshot-${DATE}.sql
```

Inspect the file. It should contain every `CREATE TABLE`, `CREATE INDEX`, `CREATE POLICY`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `CREATE FUNCTION` (for RPC), and `GRANT/REVOKE` for the public schema.

## Step 3 — RLS-only extract

```bash
DATE=$(date -u +%Y-%m-%d)
{
  echo "-- RLS policies + RLS-enable statements extracted from schema-snapshot-${DATE}.sql"
  echo "-- Generated $(date -u +%FT%TZ)"
  echo ""
  grep -E "^(CREATE POLICY|ALTER TABLE.*ROW LEVEL SECURITY|REVOKE|GRANT)" supabase/schema-snapshot-${DATE}.sql
  echo ""
  echo "-- Full policy bodies follow:"
  awk '/CREATE POLICY/,/;/' supabase/schema-snapshot-${DATE}.sql
} > supabase/policies/policies-${DATE}.sql
```

Verify by opening `supabase/policies/policies-${DATE}.sql` and confirming every user-data table from the README's covered-tables list has at least one `CREATE POLICY` and one `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` entry.

## Step 4 — Per-table RLS-enabled audit

Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query):

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
  ) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY rls_enabled ASC, tablename ASC;
```

Export the result as CSV. Save it to `_meta/rls-audit-${DATE}.txt` (you can paste the CSV directly; readability is fine — the file is a snapshot, not a query target).

**Read the result carefully.** Any user-data table where `rls_enabled = false` is a **P0 finding**. Stop, flag, and decide whether to enable RLS or whether the table is intentionally service-role-only (in which case there should still be `REVOKE`s for `public`, `anon`, and `authenticated`).

The user-data tables (per the README's covered-tables list) MUST show `rls_enabled = true`:

- `profiles`
- `conversation_history`
- `conversation_memory`
- `user_coherence`
- `conversations`
- `commitments`
- `emotional_signals`
- `predictive_signals`
- `care_twin_state`
- `care_twin_embeddings`
- `session_embeddings`
- `user_arcs`
- `agent11_syntheses`
- `product_feedback`
- `session_feedback`
- `user_signals`
- `outcome_events`

## Step 5 — Commit

```bash
git add supabase/schema-snapshot-*.sql supabase/policies/policies-*.sql _meta/rls-audit-*.txt
git commit -m "chore(governance): RLS snapshot — $(date -u +%Y-%m-%d)"
```

## Step 6 — Verify and act on findings

If Step 4 surfaces any P0 (user-data table without RLS):

1. Enable RLS in the dashboard: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
2. Write the appropriate policy (typically: authenticated users can SELECT/UPDATE/DELETE their own row, no INSERT for anon).
3. Re-run Step 2–4 to capture the new state.
4. Commit a follow-up: `fix(rls): enable RLS on <table> + add per-user policy`.

If Step 4 shows everything is in order: file the artifacts and note the next-review date (`+90 days`).

## Going forward

After this initial snapshot, **all RLS changes go through this repo**:

1. Write the migration in `supabase/migrations/<timestamp>_<description>.sql`.
2. Apply via the Supabase SQL editor or `supabase db push`.
3. Refresh `supabase/policies/policies-${DATE}.sql` by running Step 3.
4. Commit both in the same PR.

The CI gate for this (a workflow that pulls the live policies daily and diffs against the committed file) is **Week 4 of the 30-day plan** (`_meta/audit/2026-05-21/11_NEXT_30_DAYS.md`).
