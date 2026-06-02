# 2026-06-02 RLS Exposure Remediation Audit

> Security surface audit plus candidate revoke/RLS migration.
> This document reads repository migration sources only.
> It does **not** query Bleu-Live Supabase.
> It does **not** apply SQL.
> Candidate migration: `supabase/migrations/2026-06-02-rls-exposure-remediation.sql`.

## SECTION 1 — METHODOLOGY

1. Scope reviewed: every `*.sql` file under `supabase/migrations/`, sorted chronologically by filename where possible.
2. The review treated repository migration files as source evidence, not live database truth.
3. The review searched for `CREATE TABLE` statements to enumerate tables created by migrations.
4. The review searched for actual, non-comment `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements.
5. The review searched for actual, non-comment `CREATE POLICY` statements and mapped policy names to target tables.
6. The review searched for actual, non-comment `GRANT ... TO anon` statements.
7. The review searched for actual, non-comment `REVOKE ... FROM anon` statements because prior hardening migrations used revoke-only controls.
8. The review searched for `ALTER DEFAULT PRIVILEGES` statements in migration files.
9. The review also searched `docs/`, `_meta/`, and `supabase/policies/` for Supabase SQL Editor query references that Captain may use for verification.
10. This audit intentionally does not use `supabase db pull`, Management API calls, project credentials, or the Supabase dashboard.
11. Therefore, any table created manually in Bleu-Live outside committed migrations is outside this file's direct evidence.
12. Any policy edited manually in Bleu-Live after these files were authored is outside this file's direct evidence.
13. Any default privilege configured manually in Bleu-Live but not committed to migration source is outside this file's direct evidence.
14. The table inventory below is complete for tables created by committed `CREATE TABLE` statements in `supabase/migrations/`.
15. It is not a complete live Supabase inventory.
16. Prior live audits in `_meta/audits/2026-05-26-total-system-audit.md` and `_meta/audits/2026-05-26-day80-grant-lockdown.md` describe a larger live surface than this migration-source inventory.
17. That distinction matters: live-state audit and migration-source audit answer different questions.
18. Live-state audit asks: what is in the database now?
19. Migration-source audit asks: what access posture would a reviewer infer from committed database source files?
20. This PR ships the latter, plus a candidate SQL artifact for Captain review before application.
21. Risk classifications used here:
22. 🔴 P0 EXPOSED: RLS disabled in migration source and the table contains Citizen, user, or clinical data.
23. 🟠 P1 RISK: RLS disabled in migration source but the table appears to contain only system infrastructure or aggregate/reference data.
24. 🟡 P2 INCOMPLETE: RLS enabled in migration source but no explicit policy is committed for that table.
25. 🟢 P3 SECURED: RLS enabled in migration source and at least one explicit policy is committed for that table.
26. ⚪ UNKNOWN: migration source does not create the table, or source and prior live-audit claims cannot be reconciled from files alone.
27. Direct anon grants are marked `Y` only when an actual non-comment `GRANT ... TO anon` is present in migration source.
28. Comment-only references to prior `GRANT ALL TO anon` findings are not counted as active source grants.
29. Direct anon revokes are noted in rationales because they are meaningful defense-in-depth, but revoke-only is not the same as RLS-on.
30. The candidate migration does not create or drop data.
31. The candidate migration does not delete rows.
32. The candidate migration does not grant anon access.
33. The candidate migration leaves anon with no RLS policy.
34. The candidate migration marks clinical-data tables with `FELICIA-SIGNOFF-REQUIRED` comments.
35. Important parser note: `supabase/migrations/2026-05-23-p1-audit-foundation.sql` contains an apparent duplicate/incomplete `CREATE INDEX IF NOT EXISTS idx_bleu_events_type_created` line before the full index statement.
36. This audit surfaces that honestly as a source-file quality finding.
37. It did not prevent enumeration of table names, RLS statements, revokes, and policies.
38. Captain should treat that file-quality finding as separate from this PR's candidate migration.
39. SQL Editor query references found in repo:
40. `supabase/policies/PROCEDURE.md` Step 4 contains the per-table RLS enabled audit query using `pg_tables` and `pg_policies`.
41. `supabase/policies/PROCEDURE.md` Step 6 instructs enabling RLS and writing policies when P0 user-data tables are found.
42. `supabase/migrations/2026-05-21-p0-revoke-anon.sql` contains post-application verification using `information_schema.role_table_grants`.
43. `supabase/migrations/2026-05-23-p1-audit-foundation.sql` contains post-application verification using `pg_class`, `pg_namespace`, and `information_schema.role_table_grants`.
44. `_meta/audits/2026-05-29-dns-sms-verification.md` references follow-up DB queries for SMS delivery verification, not RLS posture.
45. `_meta/audits/2026-05-26-day80-grant-lockdown.md` records a live grant-exposure lockdown applied through the Management API.
46. `_meta/audits/2026-05-26-total-system-audit.md` records live public-table findings, including RLS-off and anon/auth grant surfaces.
47. No committed migration file reviewed here contains an actual `ALTER DEFAULT PRIVILEGES` statement.
48. No committed migration file reviewed here contains an actual direct `GRANT ... TO anon` statement.
49. Multiple migration files contain direct `REVOKE ... FROM anon` statements.
50. This means the broad default-privilege surface is remembered in prior context, but not reproducible from committed migration source alone.

## SECTION 2 — TABLE INVENTORY

| # | Table | Creating migration | RLS enabled in migrations? | Policies defined in migrations? | Direct anon grants? | Risk |
|---:|---|---|---|---|---|---|
| 1 | `bleu_events` | `2026-05-23-p1-audit-foundation.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 2 | `bleu_decisions` | `2026-05-23-p1-audit-foundation.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 3 | `bleu_plan` | `2026-05-23-p1-audit-foundation.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 4 | `bleu_plan_events` | `2026-05-23-p1-audit-foundation.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 5 | `bleu_catalog` | `2026-05-23-p2-catalog.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 6 | `bleu_open_windows` | `2026-05-24-p1-6-open-windows.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 7 | `bleu_open_window_actions` | `2026-05-24-p1-6-open-windows.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 8 | `bleu_commerce_settings` | `2026-05-24-p2-6-commerce-settings.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 9 | `bleu_citizens` | `2026-05-24-p7-2a-citizens.sql` | Y | None | N | 🟡 P2 INCOMPLETE / FELICIA SIGNOFF REQUIRED |
| 10 | `stripe_processed_events` | `2026-05-24-stripe-idempotency.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 11 | `bleu_comms` | `2026-05-26-p7-3a-comms.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 12 | `magic_links` | `2026-05-26-p7-4a-magic-links.sql` | Y | None | N | 🟡 P2 INCOMPLETE |
| 13 | `counterfactual_reviews` | `2026-06-01-counterfactual-reviews-table.sql` | Y | `counterfactual_reviews_service_role_all` | N | 🟢 P3 SECURED / FELICIA SIGNOFF REQUIRED |
| 14 | `memory_records` | `2026-06-01-memory-records-table.sql` | Y | `memory_records_service_role_all`; `memory_records_authenticated_select_own_session` | N | 🟢 P3 SECURED / FELICIA SIGNOFF REQUIRED |
| 15 | `metric_events` | `2026-06-01-metric-events-table.sql` | Y | `service_role_metric_events_select`; `service_role_metric_events_insert` | N | 🟢 P3 SECURED |
| 16 | `outcome_checkpoints` | `2026-06-01-outcome-checkpoints-table.sql` | Y | `outcome_checkpoints_service_role_all`; `outcome_checkpoints_authenticated_select_own` | N | 🟢 P3 SECURED / FELICIA SIGNOFF REQUIRED |
| 17 | `shadow_observations` | `2026-06-01-shadow-observations-table.sql` | Y | `service_role_select_shadow_observations`; `service_role_insert_shadow_observations` | N | 🟢 P3 SECURED |
| 18 | `tool_invocation_log` | `2026-06-01-tool-invocation-log-table.sql` | Y | `tool_invocation_log_service_role_only` | N | 🟢 P3 SECURED |
| 19 | `user_coherence` | `add_coherence_index.sql` | N from actual SQL; comment-only RLS suggestion exists in `2026-05-21-p0-revoke-anon.sql` | None | N | 🔴 P0 EXPOSED from migration-source RLS posture / FELICIA SIGNOFF REQUIRED |

### Per-table findings

#### 1. `bleu_events`

- Created by `2026-05-23-p1-audit-foundation.sql`.
- Contains `session_id`, `user_id`, `event_type`, `sea`, `mode`, and JSON `payload`.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: RLS-on with no policy is functionally closed to non-bypass roles, but explicit service-role policy is clearer and reviewable.

#### 2. `bleu_decisions`

- Created by `2026-05-23-p1-audit-foundation.sql`.
- Contains `session_id`, `user_id`, `decision_type`, JSON `inputs`, and JSON `outputs`.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Decision Objects can include user-context audit data, so explicit service-role-only policy should replace implicit lockout.

#### 3. `bleu_plan`

- Created by `2026-05-23-p1-audit-foundation.sql`.
- Contains `session_id`, `user_id`, plan `items`, totals, status, and safety status.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Plan rows are Citizen-facing product state; direct authenticated reads should not be added until identity semantics are confirmed.

#### 4. `bleu_plan_events`

- Created by `2026-05-23-p1-audit-foundation.sql`.
- Contains plan lifecycle event payloads tied to `bleu_plan`.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Service-role-only policy is the conservative baseline.

#### 5. `bleu_catalog`

- Created by `2026-05-23-p2-catalog.sql`.
- Contains commerce catalog rows for BLEU-owned protocols, Fullscript placeholders, and affiliate fallback products.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Some catalog data may eventually be public reference data, but anon access should be an explicit future policy rather than inherited access.

#### 6. `bleu_open_windows`

- Created by `2026-05-24-p1-6-open-windows.sql`.
- Contains `session_id`, `user_id`, receptivity/stability scores, phase, red flags, opt-in, and commerce gate state.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Behavioral readiness and red-flag data are sensitive; service-role-only policy is appropriate until a direct-user access model is approved.

#### 7. `bleu_open_window_actions`

- Created by `2026-05-24-p1-6-open-windows.sql`.
- Contains action content and completion state linked to an open window.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Action history is user-context data; no anon access and explicit service-role-only baseline.

#### 8. `bleu_commerce_settings`

- Created by `2026-05-24-p2-6-commerce-settings.sql`.
- Contains commerce configuration and kill-switch style settings.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Internal configuration should remain server-mediated.

#### 9. `bleu_citizens`

- Created by `2026-05-24-p7-2a-citizens.sql`.
- Contains `email_hash`, `session_id`, `profile_id`, Stripe session linkage, plan start, and kill-switch opt-out timestamps.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE, with clinical/privacy signoff required before changing access semantics.
- Rationale: This is canonical Citizen identity. The candidate migration proposes service-role full access and authenticated own-row SELECT via `profile_id = auth.uid()` only after Felicia/Captain approval.

#### 10. `stripe_processed_events`

- Created by `2026-05-24-stripe-idempotency.sql`.
- Contains Stripe event IDs and processing timestamps.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: It is system infrastructure; service-role-only policy is sufficient.

#### 11. `bleu_comms`

- Created by `2026-05-26-p7-3a-comms.sql`.
- Contains `citizen_id`, `recipient_hash`, message metadata, subject/body, provider IDs, and delivery status.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Even without plaintext recipients, communications logs can reveal sensitive engagement patterns. Service-role-only is the conservative baseline.

#### 12. `magic_links`

- Created by `2026-05-26-p7-4a-magic-links.sql`.
- Contains hashed email, token, expiry/consumption state, `citizen_id`, IP address, and user agent.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source defines no policy.
- Risk: 🟡 P2 INCOMPLETE.
- Rationale: Authentication tokens and abuse metadata should remain service-role-only.

#### 13. `counterfactual_reviews`

- Created by `2026-06-01-counterfactual-reviews-table.sql`.
- Contains review authority chain, clinical-review flags, verdicts, suggested revisions, TD-010 evidence, and trust packet forward references.
- Migration source enables RLS.
- Migration source defines `counterfactual_reviews_service_role_all`.
- Migration source defines no anon policy.
- Risk: 🟢 P3 SECURED, with Felicia signoff required for any policy change.
- Rationale: Clinical counterfactual surfaces are authority surfaces; service-role-only is safe until review workflows require more.

#### 14. `memory_records`

- Created by `2026-06-01-memory-records-table.sql`.
- Contains session/citizen memory records, retention authority, TTL, JSON payload, and TD-010 controls.
- Migration source enables RLS.
- Migration source defines `memory_records_service_role_all`.
- Migration source defines `memory_records_authenticated_select_own_session`.
- Migration source revokes anon and write privileges from authenticated.
- Risk: 🟢 P3 SECURED, with Felicia signoff required.
- Rationale: Memory retention is clinical/privacy governance. Existing policy is explicit, but live application still requires retention signoff.

#### 15. `metric_events`

- Created by `2026-06-01-metric-events-table.sql`.
- Contains event telemetry with `session_id`, optional `citizen_id`, event data, and TD-010 object.
- Migration source enables RLS.
- Migration source defines service-role SELECT and INSERT policies.
- Migration source defines no anon policy.
- Risk: 🟢 P3 SECURED.
- Rationale: Explicit service-role policies exist; no anon access is committed.

#### 16. `outcome_checkpoints`

- Created by `2026-06-01-outcome-checkpoints-table.sql`.
- Contains `trust_packet_id`, `session_id`, `citizen_id`, day 3/7/30 outcome state, self-report, measurement update, and delivery metadata.
- Migration source enables RLS.
- Migration source defines `outcome_checkpoints_service_role_all`.
- Migration source defines `outcome_checkpoints_authenticated_select_own` using `citizen_id = auth.uid()`.
- Migration source revokes anon.
- Risk: 🟢 P3 SECURED, with Felicia signoff required.
- Rationale: Outcome capture protocol is clinical. Policy shape must be signed off before live application.

#### 17. `shadow_observations`

- Created by `2026-06-01-shadow-observations-table.sql`.
- Contains shadow-runner decisions, trust packets, response hashes, parity status, latency, errors, and TD-010 compliance.
- Migration source enables RLS.
- Migration source defines service-role SELECT and INSERT policies.
- Migration source defines no anon/authenticated policies.
- Risk: 🟢 P3 SECURED.
- Rationale: Shadow implementation details are not Citizen-facing; service-role-only is appropriate.

#### 18. `tool_invocation_log`

- Created by `2026-06-01-tool-invocation-log-table.sql`.
- Contains tool ID, agent ID, session ID, decision ID, parameters, result, latency, retries, and cost.
- Migration source enables RLS.
- Migration source revokes anon and authenticated.
- Migration source grants service_role.
- Migration source defines `tool_invocation_log_service_role_only`.
- Risk: 🟢 P3 SECURED.
- Rationale: Tool parameters and results can expose operational and user context; explicit service-role-only policy is correct.

#### 19. `user_coherence`

- Created by `add_coherence_index.sql`.
- Contains `user_id`, coherence scores, allostatic load proxy, ISI language sample, session ID, tab context, city, and neighborhood.
- Migration source does not contain an actual non-comment RLS enable statement for this table.
- `2026-05-21-p0-revoke-anon.sql` contains comment-only suggested RLS statements and actual anon/authenticated revokes.
- Migration source defines no policy.
- Direct anon grant is not present in committed source.
- Risk: 🔴 P0 EXPOSED under migration-source RLS criteria because RLS is off in actual source and the table contains user/health/wellness data.
- Rationale: Even where direct anon grants were revoked, RLS-off on sensitive user data fails the defense-in-depth rule in `supabase/policies/README.md` and `supabase/policies/PROCEDURE.md`.

### Tables listed in the prompt but not created by migration source

- `conversation_history`: not created by `supabase/migrations/*.sql` in this repo snapshot.
- `decisions`: no table with that exact name is created; `bleu_decisions` is created.
- `trust_packets`: not created by `supabase/migrations/*.sql` in this repo snapshot.
- `counterfactual_review_queue`: not created by `supabase/migrations/*.sql` in this repo snapshot.
- `weekly_scorecards`: not created by `supabase/migrations/*.sql` in this repo snapshot.
- `bleu_citizens_settings`: not created by `supabase/migrations/*.sql` in this repo snapshot.
- These may exist live or in future branches, but this audit cannot verify them from committed migration files.

## SECTION 3 — ALTER DEFAULT PRIVILEGES SURFACE

1. Search target: every `*.sql` file under `supabase/migrations/`.
2. Search string: `ALTER DEFAULT PRIVILEGES`.
3. Finding: no committed migration file contains an actual `ALTER DEFAULT PRIVILEGES` statement.
4. Finding: no committed migration file contains `ALTER DEFAULT PRIVILEGES ... GRANT ... TO anon`.
5. Therefore the candidate migration does not include `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;` as an active statement.
6. The candidate migration documents this as Step 1 and leaves the default-privilege revoke out because this audit cannot prove the grant from migration source.
7. Direct table-level revokes from anon are still included for P0/P2 remediation targets.
8. Prior context and earlier audits reference broad anon exposure in live state.
9. That live-state claim should be re-tested by Captain in the Supabase SQL Editor before applying any remediation.
10. Recommended live verification query:

```sql
SELECT
  defaclobjtype,
  defaclacl
FROM pg_default_acl;
```

11. Recommended role-grant verification query:

```sql
SELECT
  table_schema,
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_schema, table_name, grantee
ORDER BY table_name, grantee;
```

12. If live `pg_default_acl` shows anon default access, Captain should add the default-privilege revoke before COMMIT in the SQL Editor transaction.
13. If live `pg_default_acl` does not show anon default access, the candidate migration's direct revokes are still useful but do not address a nonexistent default surface.

## SECTION 4 — REMEDIATION PLAN

1. Global rule: anon receives no access to any protected table.
2. Global rule: service_role receives explicit full access where a table currently has RLS enabled but no policy.
3. Global rule: direct authenticated access is added only where row-ownership semantics are clear and signoff is obtained.
4. Global rule: clinical or Citizen-identifiable tables require Felicia signoff before the candidate migration is applied.
5. Global rule: no remediation path deletes data.
6. Global rule: no remediation path drops tables.
7. Global rule: no remediation path weakens RLS.

### 🔴 P0 EXPOSED table plan

#### `user_coherence`

- Enable RLS with `ALTER TABLE public.user_coherence ENABLE ROW LEVEL SECURITY`.
- Revoke anon from the table.
- Revoke authenticated write privileges.
- Add `user_coherence_service_role_all` for service_role full access.
- Add `user_coherence_authenticated_select_own` for authenticated SELECT where `user_id = auth.uid()`.
- Mark `FELICIA-SIGNOFF-REQUIRED` because the table contains physiological/wellness scoring, ISI language sample, session context, and location fields.
- Rationale: this is sensitive user wellness data. RLS must be on even if prior revokes removed direct anon/auth grants.

### 🟠 P1 RISK table plan

- No table created by migration source was classified as 🟠 P1 RISK.
- If Captain discovers a live table that is RLS-off but contains only system infrastructure data, baseline remediation should enable RLS, revoke anon/authenticated, and add service-role-only policy.

### 🟡 P2 INCOMPLETE table plan

#### `bleu_events`

- Add `bleu_events_service_role_all`.
- Keep anon denied.
- Keep authenticated denied pending explicit direct-user need.

#### `bleu_decisions`

- Add `bleu_decisions_service_role_all`.
- Keep anon denied.
- Keep authenticated denied pending Decision Object reader design.

#### `bleu_plan`

- Add `bleu_plan_service_role_all`.
- Keep anon denied.
- Keep authenticated denied until direct plan reads are mapped to `user_id` or session identity safely.

#### `bleu_plan_events`

- Add `bleu_plan_events_service_role_all`.
- Keep anon denied.
- Keep authenticated denied.

#### `bleu_catalog`

- Add `bleu_catalog_service_role_all`.
- Keep anon denied.
- If product later wants public catalog reads, that should be a separate PR with explicit disclosure and risk review.

#### `bleu_open_windows`

- Add `bleu_open_windows_service_role_all`.
- Keep anon denied.
- Keep authenticated denied.
- Rationale: receptivity/stability and red-flag data can be clinically sensitive.

#### `bleu_open_window_actions`

- Add `bleu_open_window_actions_service_role_all`.
- Keep anon denied.
- Keep authenticated denied.

#### `bleu_commerce_settings`

- Add `bleu_commerce_settings_service_role_all`.
- Keep anon denied.
- Keep authenticated denied.

#### `bleu_citizens`

- Add `bleu_citizens_service_role_all`.
- Add authenticated SELECT only for `profile_id = auth.uid()`.
- Revoke anon entirely.
- Revoke authenticated write privileges.
- Mark `FELICIA-SIGNOFF-REQUIRED` because this table is the canonical Citizen identity surface.

#### `stripe_processed_events`

- Add `stripe_processed_events_service_role_all`.
- Keep anon denied.
- Keep authenticated denied.

#### `bleu_comms`

- Add `bleu_comms_service_role_all`.
- Keep anon denied.
- Keep authenticated denied.
- Rationale: communications logs can reveal engagement and delivery patterns even with hashed recipient identifiers.

#### `magic_links`

- Add `magic_links_service_role_all`.
- Keep anon denied.
- Keep authenticated denied.
- Rationale: auth tokens and request metadata should never be directly readable by anon or authenticated clients.

### 🟢 P3 SECURED table plan

- `counterfactual_reviews`: no new policy needed in this candidate migration, but the migration includes a Felicia marker because policy changes are clinical authority surfaces.
- `memory_records`: no new policy needed in this candidate migration, but the migration includes a Felicia marker because retention policy and payload shape are clinical/privacy surfaces.
- `metric_events`: no new policy needed; service-role SELECT/INSERT exists.
- `outcome_checkpoints`: no new policy needed in this candidate migration, but the migration includes a Felicia marker because outcome capture protocol is clinical.
- `shadow_observations`: no new policy needed; service-role SELECT/INSERT exists.
- `tool_invocation_log`: no new policy needed; service-role-only policy exists.

## SECTION 5 — CANDIDATE REVOKE MIGRATION

1. Candidate file: `supabase/migrations/2026-06-02-rls-exposure-remediation.sql`.
2. Status: source artifact only; not applied by Codex.
3. The migration opens with `BEGIN;`.
4. Step 1 documents that no committed `ALTER DEFAULT PRIVILEGES` anon grant was found.
5. Step 1 therefore does not run a default-privilege revoke from source evidence alone.
6. Step 2 enables RLS on `user_coherence`.
7. Step 2 repeats RLS enablement on P2 tables as idempotent defense-in-depth.
8. Step 3A revokes anon from all P0/P2 target tables.
9. Step 3B preserves conservative authenticated posture by revoking writes and broad access.
10. Step 3 creates service-role policies for `user_coherence` and every P2 table that lacks committed policies.
11. Step 3 creates authenticated own-row SELECT for `user_coherence` using `user_id = auth.uid()`.
12. Step 3 creates authenticated own-row SELECT for `bleu_citizens` using `profile_id = auth.uid()`.
13. Step 3 creates no anon policy.
14. Step 3 includes `FELICIA-SIGNOFF-REQUIRED` markers for `user_coherence`, `bleu_citizens`, `counterfactual_reviews`, `memory_records`, and `outcome_checkpoints`.
15. Step 4 runs informational SELECTs against `pg_class` and `pg_policies`.
16. Step 4 runs `SELECT count(*) FROM pg_policies WHERE schemaname = 'public';`.
17. The migration closes with `COMMIT;`.
18. Rollback plan before COMMIT: run `ROLLBACK;` in the same SQL Editor transaction.
19. Rollback plan after COMMIT: prepare a separate reviewed migration that drops only the newly-created policies and restores prior grants if required; do not improvise in production.
20. Emergency lockout response: confirm service-role application paths first, because service_role bypasses RLS.
21. Emergency lockout response: if direct authenticated reads fail, inspect `information_schema.role_table_grants` and `pg_policies` before changing policies.
22. Emergency lockout response: do not grant anon access to fix application behavior.
23. Test plan before COMMIT: dry-run the transaction with `ROLLBACK;` first.
24. Test plan before COMMIT: verify the policy count and policy names returned by `pg_policies`.
25. Test plan after COMMIT: verify service-mediated app flows still write/read expected tables.
26. Test plan after COMMIT: verify authenticated own-row SELECT works only for approved tables.
27. Test plan after COMMIT: verify anon cannot select protected tables through PostgREST.
28. Test plan after COMMIT: file `_meta/audits/[date]-rls-remediation-applied.md` with live results.

## SECTION 6 — APPLICATION CHECKLIST FOR CAPTAIN

1. Read this audit document end-to-end.
2. Confirm the migration-source inventory matches Captain's expectation.
3. Review the apparent duplicate/incomplete index line in `2026-05-23-p1-audit-foundation.sql` as a separate source-quality issue.
4. Get Dr. Felicia signoff on clinical-data table policies before application.
5. Exact Felicia-signoff tables in this audit: `user_coherence`.
6. Exact Felicia-signoff tables in this audit: `bleu_citizens`.
7. Exact Felicia-signoff tables in this audit: `counterfactual_reviews`.
8. Exact Felicia-signoff tables in this audit: `memory_records`.
9. Exact Felicia-signoff tables in this audit: `outcome_checkpoints`.
10. Open the Supabase SQL Editor on the Bleu-Live project.
11. Paste the candidate migration from `supabase/migrations/2026-06-02-rls-exposure-remediation.sql`.
12. For the first pass, replace final `COMMIT;` with `ROLLBACK;`.
13. Run the migration in a transaction as a dry-run check.
14. Verify expected policy count with `SELECT count(*) FROM pg_policies WHERE schemaname = 'public';`.
15. Inspect the returned `pg_policies` rows for expected policy names.
16. Inspect `information_schema.role_table_grants` for anon grants.
17. If dry-run looks good, restore `COMMIT;`.
18. Apply only after Captain Soul-Gate at application time.
19. Test that authenticated users can still read their own approved data.
20. Test that anon users cannot read `user_coherence`.
21. Test that anon users cannot read `bleu_citizens`.
22. Test that anon users cannot read `magic_links`.
23. Test that anon users cannot read `memory_records`.
24. Test that anon users cannot read `outcome_checkpoints`.
25. Test that service-mediated app flows still work.
26. File a confirmation audit doc at `_meta/audits/[date]-rls-remediation-applied.md`.
27. In that confirmation doc, list which policies are now live.
28. In that confirmation doc, list the policy count before and after.
29. In that confirmation doc, list any live-state deviations from this migration-source audit.
30. Do not merge future clinical policy changes without matching documentation.

## SECTION 7 — HONEST FOOTNOTES

1. This audit cannot verify live Supabase state.
2. This audit cannot verify whether prior Management API lockdowns remain live.
3. This audit cannot verify manually-created tables absent from migration source.
4. This audit cannot verify dashboard-created policies absent from migration source.
5. This audit found 19 tables created by committed migration source.
6. The prompt's likely table list includes names not created by committed migration source.
7. `conversation_history` is not created by committed migration source in this repo snapshot.
8. `trust_packets` is not created by committed migration source in this repo snapshot.
9. `counterfactual_review_queue` is not created by committed migration source in this repo snapshot.
10. `weekly_scorecards` is not created by committed migration source in this repo snapshot.
11. `bleu_citizens_settings` is not created by committed migration source in this repo snapshot.
12. `decisions` is not created under that exact name; `bleu_decisions` is created.
13. The 2026-05-26 live audit documented more public tables than committed migration source creates.
14. That means live database history and source migration history are not perfectly aligned.
15. The candidate migration intentionally does not touch live-only tables not created by committed migrations.
16. The candidate migration intentionally does not touch public reference tables from earlier live audits.
17. The candidate migration intentionally does not add anon access to `bleu_catalog`, even if product might later decide some catalog rows can be public.
18. That is a conservative choice: public-read catalog policy should be a separate explicit authorization.
19. The candidate migration proposes authenticated SELECT for `user_coherence` and `bleu_citizens` only.
20. Those policies require signoff because identity and clinical/privacy semantics are authority surfaces.
21. Existing `outcome_checkpoints_authenticated_select_own` uses `citizen_id = auth.uid()` in source.
22. This audit does not prove that `citizen_id` equals the Supabase auth UID in live data.
23. Captain and Felicia should verify identity mapping before relying on that direct-reader policy.
24. Existing `memory_records_authenticated_select_own_session` uses JWT session claim matching, not `citizen_id`.
25. This audit does not prove that session claims are always present in live JWTs.
26. The candidate migration does not alter existing `memory_records` or `outcome_checkpoints` policies.
27. The candidate migration marks those tables for signoff because applying their table migrations remains a clinical-data decision.
28. The apparent duplicate/incomplete `CREATE INDEX` line in `2026-05-23-p1-audit-foundation.sql` is surfaced rather than hidden.
29. This audit did not modify that existing migration because the PR scope forbids modifying existing migration files.
30. If Captain wants that source-quality issue fixed, it should be a separate PR with careful live-state awareness.
31. No doctrine conflict was found with the conservative no-anon recommendation.
32. The only possible product tension is future public catalog reads; this audit chooses safety over convenience until explicit authorization.
33. Refusal 18 applies: doctrine cannot outrun functioning reality.
34. Security infrastructure must be reviewable before application.
35. This PR provides the reviewable artifact.
36. Captain retains application authority.
37. Dr. Felicia retains clinical policy signoff authority.
38. Codex did not apply the migration.
39. Codex did not connect to Supabase.
40. Codex did not install packages.
41. Codex did not modify existing migrations.
42. Codex did not modify `server.js`.
43. Codex did not modify route handlers.
44. Codex did not modify `supabase/functions/alvai/index.ts`.
45. Codex did not modify schema JSON files.
46. Codex did not touch `core/safety/canonical_crisis_patterns.js`.
47. The remediation migration is a candidate source file only.
48. The safest next step is Captain/Felicia review, then SQL Editor dry-run, then explicit application Soul-Gate.
