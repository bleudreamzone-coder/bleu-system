# Wire 3: conversation_memory Reader Audit

**Date:** April 23, 2026
**Commit baseline:** c076ce4 (post-wire-2)
**Status:** COMPLETE — zero readers found, dual-write removal cleared for wire 4 after dashboard check

---

# === WIRE 3 READER AUDIT ===

## 1. All `conversation_memory` references (grouped by file)

**`server.js`** — 3 hits, all in `/api/chat` handler:

| Line | Class | Context |
|---|---|---|
| 1263 | REFERENCE (comment) | `// TODO: remove after conversation_memory migration — audit readers first.` |
| 1264 | **WRITE** | `querySupabase('conversation_memory', '', 0, 'POST', { user_id: uid, session_id: sid, role: 'user', content: p.message, mode: m, created_at: ts }).catch(()=>{});` |
| 1265 | **WRITE** | `querySupabase('conversation_memory', '', 0, 'POST', { user_id: uid, session_id: sid, role: 'assistant', content: full.substring(0, 4000), mode: m, created_at: ts }).catch(()=>{});` |

**`docs/bleu-system-state.md`** — 5 hits, all REFERENCE/documentation:

| Line | Class | Context |
|---|---|---|
| 79 | REFERENCE | Section header: `### conversation_memory (legacy, being migrated away from)` |
| 82 | REFERENCE | `Readers: none found.` (prior audit claim — this audit independently confirms it) |
| 255 | REFERENCE | Endpoint doc: `conversation_memory (legacy dual-write, 1259/1260)` — line numbers slightly stale (actual 1264/1265, drifted 5 from wire 1/1a/2 additions) |
| 764 | REFERENCE | Known gaps section |
| 841 | REFERENCE | TODO marker inventory |
| 873 | REFERENCE | "legacy conversation_memory dual-write: TODO to remove." |

**No other files**. Repo-wide grep with no extension filter yielded only `server.js` and `docs/bleu-system-state.md`.

## 2. READ hits with full context

**No reads found. `conversation_memory` is write-only in this codebase.**

Every code reference is a WRITE (`.insert()` via `querySupabase` with `'POST'`). There are zero `SELECT` / `.select()` / `.from('conversation_memory')` / PostgREST GET calls / `match_conversation_memory` RPCs / frontend queries / edge-function reads.

## 3. Edge functions / cron / orchestration

**Edge functions** (`supabase/functions/`):
- `alvai/index.ts` — zero hits
- `alvai/index.ts.backup` — zero hits
- `alvai/index.ts.backup2` — zero hits
- `stripe-checkout/index.ts` — zero hits

**Cron / workflows / config**:
- Grep across `*.yml`, `*.yaml`, `*.json`, `*.toml` (including `.github/workflows/`, `package.json`, `railway.json`, `nixpacks.toml`, `supabase/config.*`): zero hits
- No GitHub Actions job references `conversation_memory`
- No Render/Railway orchestration references it

## 4. Schema / migrations

**SQL files in repo**:
- `cities/01-supabase-tables.sql` — zero hits
- `supabase/migrations/add_coherence_index.sql` — zero hits
- `supabase/migrations/20260422_add_bhi_columns.sql` — zero hits
- `supabase/migrations/20260422_add_passport_health_columns.sql` — zero hits

**No `CREATE TABLE conversation_memory` statement exists anywhere in the repo.** The table was presumably created directly via the Supabase dashboard at some earlier point and never checked in.

**Cannot verify from repo** (would need Supabase dashboard access):
- Database triggers on `conversation_memory` (could exist server-side, invisible to repo grep)
- Views that `SELECT FROM conversation_memory`
- RLS policies referencing it
- External projects / analytics tools / backup jobs reading from it

The docs at `bleu-system-state.md:83` already acknowledged this gap: `"RLS: cannot determine."` Flagging it again here — this is the one remaining "unknown" that wire 4 should not proceed without checking.

## 5. Current dual-write locations (precise)

**Location**: `server.js:1264-1265`, inside the `/api/chat` POST handler.

**Containing context** (lines 1243–1266):

```js
        const sid = identity.convId;
        const uid = identity.userId;
        const m = p.mode || 'general';

        // Primary store: conversation_history with embeddings (powers semantic recall).
        // Anonymous turns persist without embeddings; backfill on anon→auth migration.
        (async () => {
          try {
            await storeConversationTurn(identity, 'user', p.message, userEmbedding);
            const assistantEmbedding = identity.source === 'supabase_auth'
              ? await embedText(full)
              : null;
            await storeConversationTurn(identity, 'assistant', full, assistantEmbedding);
          } catch (e) {
            console.error('[memory] /api/chat write failed:', e.message);
          }
        })();

        // TODO: remove after conversation_memory migration — audit readers first.
        querySupabase('conversation_memory', '', 0, 'POST', { user_id: uid, session_id: sid, role: 'user', content: p.message, mode: m, created_at: ts }).catch(()=>{});
        querySupabase('conversation_memory', '', 0, 'POST', { user_id: uid, session_id: sid, role: 'assistant', content: full.substring(0, 4000), mode: m, created_at: ts }).catch(()=>{});
```

**Triggering condition**: Every successful `/api/chat` turn, after the model response is assembled and the `ts` timestamp is resolved. Fire-and-forget (`.catch(()=>{})`). No write-path gate beyond reaching the end of the handler with a `full` response.

**Paired `conversation_history` write**: Yes, same function, lines 1253 + 1257 via `storeConversationTurn(identity, 'user'|'assistant', ...)`. That's the canonical write. Dual-write property confirmed.

### ⚠️ Asymmetry flag: `/api/chat/stream` does NOT dual-write

Lines 1320–1337 show the streaming handler only writes to `conversation_history` via `storeConversationTurn`. **There is no `conversation_memory` write in the streaming path.**

The docs at `bleu-system-state.md:261` claim `/api/chat/stream` has "same memory wiring" as `/api/chat` — that's stale. Two possible reads:
- (a) The stream endpoint was intentionally built without the legacy dual-write (forward-looking). Consistent with "stream is future clients" framing.
- (b) The stream endpoint was built *after* the dual-write was added to `/api/chat` and nobody ported it. Oversight.

Either way it means: if any dashboards / analytics / downstream consumers *were* reading from `conversation_memory`, they're already missing every turn that went through `/api/chat/stream`. Since docs line 261 says stream isn't called by the current frontend, production volume on the asymmetry is zero today — but it's still a smoking gun that nothing downstream has been actively reading, because nobody has complained about half the data being missing.

**This asymmetry is empirical evidence that reinforces the grep-based "zero readers" finding.** Two independent signals pointing the same direction.

## 6. Recommendation

**Safe to remove the dual-write in wire 4. Zero readers found across every file audited.**

Files checked:
- 1 JavaScript server file (`server.js`)
- 1 HTML frontend (`index.html`)
- 4 edge-function TypeScript files (`alvai/index.ts` + 2 backups, `stripe-checkout/index.ts`)
- 4 SQL migration files
- All YAML/JSON/TOML config + workflow files
- 1 documentation markdown (`docs/bleu-system-state.md`, all references)
- Python pipeline (`engine.py` and siblings — grep included `.py`; zero hits)

Qualifying caveats for wire 4 to address before the removal:
1. **Supabase dashboard audit required** — confirm no server-side triggers, views, or scheduled SQL functions read from `conversation_memory`. This is the one unknown the repo can't answer.
2. **Optional belt-and-suspenders before removal**: rename the table in Supabase to `conversation_memory_deprecated_YYYYMMDD` for 1–2 weeks before dropping. If anything breaks (unknown external reader, dashboard, BI tool), restoring the rename is trivial. Only drop after the quarantine period passes cleanly. This converts the "did I miss anything?" question from a commit-review problem into a passive monitoring one.
3. **Asymmetry resolution**: when removing from `/api/chat:1264-1265`, also update `docs/bleu-system-state.md:261` to drop the "same memory wiring" claim for `/api/chat/stream` — it was never literally true.

**No edits made in this wire. Investigation complete.** Wire 4 (separate session) can proceed on the basis of this report plus the dashboard check in caveat 1.

---

## Next Steps for Wire 4 (dual-write removal)

Wire 4 should NOT proceed until all three of these are resolved:

1. **Supabase dashboard check** — Verify no triggers, views, or RLS policies reference `conversation_memory`. Repo grep cannot see these. Requires manual check in the Supabase dashboard:
   - Database → Tables → conversation_memory → check for any attached triggers
   - Database → Database → check views for any SELECT FROM conversation_memory
   - Authentication → Policies → filter by table = conversation_memory

2. **External consumer check** — Confirm no dashboards, analytics tools, BI queries, CSV exports, or backup jobs read from `conversation_memory` directly against the Supabase database. This is a human-check item: ask Bleu and Dr. Felicia whether anything they've set up touches this table.

3. **Rename-before-drop quarantine** — Before wire 4 removes the dual-write from `server.js:1264-1265`, rename the table in Supabase to `conversation_memory_deprecated_20260423`. Monitor for 1-2 weeks. If anything breaks (unknown external reader surfaces via errors or Slack alerts), restoring the rename is trivial. If nothing breaks after the quarantine passes cleanly, wire 4 ships: removes the dual-write code AND drops the renamed table. This converts the "did I miss anything?" question from a commit-review problem into a passive monitoring problem.
