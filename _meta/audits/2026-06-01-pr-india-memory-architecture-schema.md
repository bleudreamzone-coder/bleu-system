# PR India — Memory Architecture Schema (Shadow Mode)

**Status:** Schema-only shadow artifact. No runtime wiring. No SQL migration applied.
**Authorization:** Captain Soul-Gate, 2026-06-01.
**Clinical activation:** Dr. Felicia signoff not required for this schema-only PR; required before any live retention policy is activated.

## Rationale

PR India adds the future durable session memory shape for BLEU agents and the Orchestrator. The Memory Machine is one of the Five Machines in `_meta/doctrine/lens_architecture_doctrine_v1.md`: Memory records what happened so the next Signal→Route pass is sharper, and doctrine names that compounding as the moat.

`_meta/THE_BLEU_BIBLE.md` frames BLEU's runnable core as `decompose()`, `decide()`, `record()`, and `respond()`. Memory belongs to durable recording and later recall: no answer without recorded reason, and no confidence without tracked outcomes.

`_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` preserves the institutional blueprint and release discipline for bounded schema work, audit records, database governance, and PII minimization. The current file's Section 12 is Commerce Rails, not a memory-specific section; this audit therefore cites the blueprint for institutional memory, bounded PR discipline, database governance, and PII controls rather than inventing a nonexistent section heading.

## Current process-local Set

`server.js` currently contains a process-local `EMOTIONAL_SESSIONS = new Set()` near line 790. That Set is useful as an immediate in-process suppression signal, but it resets on restart and cannot coordinate across multiple Render instances. A future multi-instance deployment requires a durable adapter so session memory can be retrieved consistently by agents.

This PR does **not** modify that Set, `/api/chat`, `server.js`, or any live memory path. The replacement shape lands now as a shadow artifact only; the cutover is future work after retention authority is signed.

## TD-010 enforcement

TD-010 is enforced at schema level, not by convention:

- `td_010.pii_hashed` is `const true`.
- `td_010.plaintext_email_stored` is `const false`.
- `td_010.plaintext_phone_stored` is `const false`.
- semantic `citizen_facts` reject `plaintext_email` and `plaintext_phone` markers.
- the migration file mirrors the TD-010 object with a JSONB check.

No plaintext email or phone may be stored in `payload jsonb`.

## Files shipped

- `core/schemas/memory_record_v1.1.schema.json` — MemoryRecord v1.1 with per-kind `oneOf` payload branches.
- `core/schemas/memory_query_v1.1.schema.json` — MemoryQuery v1.1 with a 50-record retrieval cap.
- `supabase/migrations/2026-06-01-memory-records-table.sql` — migration file only, not applied.
- `core/agents/memory/memory_interface.js` — validating stub adapter returning dormant values unless a live store is configured, in which case it throws `NotImplementedError`.
- `core/agents/memory/README.md` — memory doctrine, TD-010, Sleep Agent pseudocode, and activation sequence.
- `tests/schemas/memory-architecture.test.js` — seven schema fixtures.

## Activation sequence

1. Dr. Felicia signs off retention policies at Tier 2.
2. Captain manually applies `supabase/migrations/2026-06-01-memory-records-table.sql`.
3. Captain manually sets the memory adapter sink environment variable.
4. Engineering gradually cuts over from the process-local Set to the durable adapter.

## Forward path

PR Juliet should follow with the Tool Registry Schema. Memory remains dormant until the clinical and operational activation gates are satisfied.
