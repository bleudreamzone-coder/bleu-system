# Memory Architecture (Shadow Mode — Schema Only)

Status: DORMANT — memory interface scaffold only; live memory remains in server.js.

PR India adds the dormant durable memory shape for future agents and the Orchestrator. It does **not** connect `/api/chat`, `server.js`, Supabase, or any live agent path to memory.

## Doctrine source

BLEU treats Memory as one of the Five Machines. The Lens Architecture doctrine defines the series as Signal → Safety → Route → Outcome → Memory, with Memory recording what happened so the next Signal→Route is sharper. `_meta/doctrine/lens_architecture_doctrine_v1.md` identifies this as the compounding moat.

The Bible reduces BLEU to four runnable primitives: `decompose`, `decide`, `record`, and `respond`. Memory belongs to the durable proof created by `record()` and the later recall that sharpens the next `decompose()`/`decide()` cycle. The Bible's operating mantra includes “Record before confidence” and “Track before claiming,” which this schema preserves without activating runtime writes.

## Files shipped

- `core/schemas/memory_record_v1.1.schema.json` — one MemoryRecord with per-kind payload validation.
- `core/schemas/memory_query_v1.1.schema.json` — retrieval query contract so agents ask through a Query rather than direct SQL.
- `supabase/migrations/2026-06-01-memory-records-table.sql` — migration file only; not applied in this PR.
- `core/agents/memory/memory_interface.js` — dormant validating adapter stub.

## Record kinds

- `episodic` — interaction summaries, variant tags, gates, refusals, and whether commerce surfaced.
- `semantic` — durable facts by topic with confidence. Plaintext email/phone markers are rejected.
- `preference` — stated or inferred citizen preferences by domain/key/value.
- `decision_history` — observed outcomes attached to Decision Objects.
- `counterfactual_link` — Trust Packet counterfactual references acknowledged by the Citizen.

## TD-010 compliance

No plaintext email or phone is ever allowed in `payload jsonb`. The record schema requires:

```json
{
  "pii_hashed": true,
  "plaintext_email_stored": false,
  "plaintext_phone_stored": false
}
```

Those `const` values enforce TD-010 at schema level rather than convention. The SQL migration mirrors that object with a `td_010` JSONB check. Semantic facts also reject `plaintext_email` and `plaintext_phone` markers.

## Future Sleep Agent pseudocode

```js
const { createMemoryAdapter } = require('./core/agents/memory/memory_interface');
const memory = createMemoryAdapter({ sink: process.env.BLEU_MEMORY_ADAPTER_SINK });

async function futureSleepAgent(signal) {
  const prior = await memory.read({
    session_id: signal.session_id,
    kinds: ['episodic', 'preference', 'decision_history'],
    tier: 'tier_2_felicia',
    max_records: 10,
  });

  const decision = decideSleepRoute(signal, prior);

  await memory.write({
    record_id: crypto.randomUUID(),
    session_id: signal.session_id,
    citizen_id: signal.citizen_id ?? null,
    kind: 'episodic',
    schema_version: '1.1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ttl_days: 90,
    retention_authority: 'tier_2_felicia',
    payload: {
      interaction_summary: decision.reason,
      variant_tags: signal.variant_tags,
      gates_triggered: decision.gates_triggered,
      refusals_triggered: decision.refusals_triggered,
      commerce_surfaced: decision.commerce_allowed,
    },
    td_010: {
      pii_hashed: true,
      plaintext_email_stored: false,
      plaintext_phone_stored: false,
    },
  });
}
```

## Activation sequence

Memory activation follows the same discipline as the shadow runner:

1. Dr. Felicia signs off on retention policies at Tier 2.
2. Captain manually applies the SQL migration.
3. Captain manually sets the memory adapter sink environment variable.
4. Engineering gradually cuts over from the process-local `Set` to the durable adapter.

Until that sequence completes, memory infrastructure remains dormant under Refusal 18.
