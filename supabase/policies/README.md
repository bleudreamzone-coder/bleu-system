# Supabase RLS Policies — Source of Truth

This folder is the **authoritative source** for Row-Level Security policies on bleu.live's Supabase project (`sqyzboesdpdussiwqpzk`).

## Why this folder exists

Per `_meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md` and the matching `04_INFRASTRUCTURE_AUDIT.md`: RLS policies that protect user data (`profiles`, `conversation_history`, `user_coherence`, etc.) existed ONLY in the Supabase dashboard before this commit. No source of truth. No version control. No CI gate. If the Supabase project was migrated, recreated, or had its policies edited via the dashboard, the access-control rules disappeared with it. A state procurement reviewer would fail the platform on inspection.

This folder establishes the discipline. Every RLS change goes through here.

## Rules

1. **No RLS change happens in the dashboard without a corresponding commit here.** That includes new policies, edits to existing policies, and policy deletions.
2. Every policy file is named `<YYYY-MM-DD>-<short-description>.sql`. The date is the date of the policy change (the dashboard edit), not the commit date.
3. Every policy change requires a migration file in `supabase/migrations/`. The migration file is the apply-able artifact; the file in this folder is the canonical reference.
4. The full schema snapshot at `supabase/schema-snapshot-<DATE>.sql` is refreshed quarterly **and** after any major policy change.
5. The audit log at `_meta/rls-audit-<DATE>.txt` shows which tables have RLS enabled. Refreshed at the same cadence as the snapshot.

## Cadence

| Activity | Cadence | Trigger |
|---|---|---|
| Full schema snapshot | quarterly | calendar |
| RLS audit (which tables have RLS on/off) | quarterly | calendar |
| New policy SQL committed here | per-change | dashboard edit |
| Migration applied | per-change | merged PR |

## Current state — 2026-05-21

The directory structure is scaffolded; the actual snapshot has **NOT YET BEEN PULLED** because it requires Supabase admin credentials that are not present in this execution environment. See `PROCEDURE.md` for the credentialed pull steps. Once Bleu runs the procedure, the artifacts land at:

- `supabase/schema-snapshot-2026-05-21.sql` (full schema)
- `supabase/policies/policies-2026-05-21.sql` (RLS-only extract)
- `_meta/rls-audit-2026-05-21.txt` (per-table RLS-enabled report)

## Next review due

**2026-08-21** (90 days from 2026-05-21).

## Tables this folder covers

User-data tables that MUST have RLS enabled and policies committed here:

- `profiles` — email, health metrics, BHI, citizenship, Stripe customer ID
- `conversation_history` — every chat turn + 1536-dim embeddings
- `conversation_memory` — legacy duplicate (scheduled for removal)
- `user_coherence` — per-user CI/ISI/phone
- `conversations` — session metadata
- `commitments`, `emotional_signals`, `predictive_signals`, `care_twin_state`, `care_twin_embeddings`, `session_embeddings`, `user_arcs`, `agent11_syntheses` — Care Twin / edge-fn writes (status ambiguous per `docs/edge-function-investigation.md`)
- `product_feedback`, `session_feedback`, `user_signals` — frontend-anon writes
- `outcome_events` — added in the May 2026 reorg; webhook telemetry writes here

Tables that are intentionally service-role only (no anon access):

- `practitioners`, `locations`, `products`, `protocols`, `youtube_videos`, `pubmed_studies`, `reddit_mentions`, `marketplace_practitioners`
- `clicks`, `pageviews`, `sessions`, `scrape_log`, `daily_reports`, `environmental_data`

The `match_conversation_history` RPC is documented in `docs/bleu-system-state.md` as having `REVOKE` from `public/anon/authenticated`, `GRANT` to `service_role`, with `SECURITY DEFINER`. **This is the only access-control rule currently committed anywhere in this repo.** Every other rule needs to be pulled.

## Audit references

- `_meta/audit/2026-05-21/04_INFRASTRUCTURE_AUDIT.md` — full RLS gap analysis
- `_meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md` — security findings
- `_meta/audit/2026-05-21/10_TECH_DEBT_REGISTER.md` — TD-003 (CRITICAL)
