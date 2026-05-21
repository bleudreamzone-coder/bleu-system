# Follow-ups discovered during 2026-05-21 critical fixes execution

This log captures items noticed during execution that are **out of scope** for the 5 critical fixes session. Each item references the relevant audit deliverable in `_meta/audit/2026-05-21/`.

This is the rebuilt v2 of the followups (the v1 branch was archived
locally as `fix/2026-05-21-criticals-v1-stale` after origin/main was
found to be 67 commits ahead of the audit's baseline).

---

## Scope-deferred items

### FU-001 — Jazz Bird prose claims in dist/anxiety|sleep|gut (1,810 pages)
**Discovered during:** Fix #3b dist sed
**Severity:** MEDIUM (bounded — these pages are not currently served by the live server per `_meta/audit/2026-05-21/06_CONTENT_ENGINE_AUDIT.md`)
**State:** schema.org publisher/affiliation FIXED via sed in this session. Body prose still contains operational claims attributing platform capabilities to Jazz Bird ("Jazz Bird's NPI database", "Jazz Bird's causal research pipeline", "Jazz Bird's city-level intelligence", "Jazz Bird 501(c)(3) Research Foundation", etc.).
**Resolution path:** content regeneration via the source generator (autonomous-engine.js or BEAST SEO routine — needs identification). Sed is the wrong tool for prose. Hard precondition before any migration of `dist/` to the dynamic engine.
**Reference:** `_meta/wall-violations-2026-05-21.txt` (FOLLOW-UP block on condition pages)

### FU-002 — Jazz Bird prose claims in dist/cities (4,214 pages)
**Discovered during:** Fix #3b dist sed
**Severity:** MEDIUM (same scope — not served by live server)
**State:** untouched. Pages contain "Jazz Bird 501(c)(3) maintains zero ad revenue …", "Jazz Bird 501(c)(3) · BLEU Deep South", "Jazz Bird Data Point", "Jazz Bird science", "Jazz Bird research donations", and many similar attributions.
**Resolution path:** content regeneration. Same precondition before migration.
**Reference:** `_meta/wall-violations-2026-05-21.txt` (FOLLOW-UP block on city pages)

### FU-003 — Dead-file Jazz Bird mentions
**Discovered during:** Fix #3b dist sed grep
**Severity:** LOW (files are not served)
**State:** untouched per surgical-fix scope. Mentions remain in `alvai-v3.ts`, `BLEU_*Nuclear.html`, `bleu-master.html`, ~17 one-shot `.py` scripts. (Note: many of the dead files originally flagged by the audit — `server-old-claude.js`, `server-v4.js`, `server.js.backup`, `nola-index*.txt`, `nola-enhanced.html` — were already deleted by the team's upstream cleanup commits before this branch was rebased.)
**Resolution path:** Week 3 of `_meta/audit/2026-05-21/11_NEXT_30_DAYS.md` ("Delete the DEAD pile" — W3.3) — partly done; remaining files queued.

### FU-004 — RLS snapshot credentialed pull
**Discovered during:** Fix #5 RLS export
**Severity:** CRITICAL (still TD-003 until executed)
**State:** structure, README, PROCEDURE, audit template all committed. The actual `supabase db dump` was NOT executed because the Claude Code execution environment did not have Supabase admin credentials.
**Resolution path:** Bleu runs `supabase/policies/PROCEDURE.md` end-to-end. Output lands in `supabase/schema-snapshot-2026-05-21.sql`, `supabase/policies/policies-2026-05-21.sql`, and the populated `_meta/rls-audit-2026-05-21.txt`. If any user-data table shows `rls_enabled = false`, that becomes its own P0 fix.
**Reference:** `supabase/policies/README.md`, `supabase/policies/PROCEDURE.md`

### FU-005 — Full `.gitignore` rewrite
**Discovered during:** Fix #5 added `.supabase/` only — minimum needed for the procedure to be safe to run
**Severity:** HIGH (TD-006 in the register, Week 1 W1.4 in the 30-day plan)
**State:** `.gitignore` currently excludes `.github/workflows/deploy-alvai.yml`, `docs/cleanup-may-2026/`, and (after this branch) `.supabase/`. Still does not exclude `.env`, `node_modules/`, `*.swp`, IDE files, OS junk. Anyone creating a `.env` next will commit it on `git add .`
**Resolution path:** comprehensive Node + Python `.gitignore`. Single small PR.
**Reference:** `_meta/audit/2026-05-21/09_SECURITY_AND_PRIVACY_AUDIT.md`

### FU-006 — v1 branch was rebuilt against current main
**Discovered during:** push attempt
**Severity:** INFORMATIONAL
**State:** the audit was performed at `f70426a`. By the time this branch was pushed, `origin/main` was 67 commits ahead, including upstream-resolved versions of Fix #1 (the Longevity typo, resolved better in commit `07636da` which also upgraded `PROTOCOL_MAP` values to `{name, mode}` objects) and Fix #3a (Jazz Bird removal from index.html, resolved in the phase-4 reorg). The v1 branch was archived locally as `fix/2026-05-21-criticals-v1-stale` and rebuilt clean against current main to keep the PR small and mergeable.
**Reference:** `_meta/audit/2026-05-21/EXECUTION_REPORT.md` (Notes section on reconciliation)
