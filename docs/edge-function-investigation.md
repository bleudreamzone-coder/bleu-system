# Edge Function Investigation — `supabase/functions/alvai/index.ts`

**Verdict:** AMBIGUOUS — in-repo evidence points overwhelmingly to DEAD, but this repo cannot prove the absence of an external caller (CannaIQ, city.bleu, Jazz Bird, or any other frontend deployed from a different repo). If you exclude that external unknown, the repo-local verdict is DEAD.

**Single resolution check:** open the Supabase dashboard at project `sqyzboesdpdussiwqpzk` → Edge Functions → `alvai` → Invocations tab. If the 7-day invocation count is 0 (or only matches your own manual test calls), DEAD is confirmed. If there is nontrivial traffic, the caller is external and we need its referer/User-Agent to locate it.

Date of investigation: 2026-04-22. Snapshot taken against `main` at HEAD.

---

## Evidence chain

### A. The shipped frontend points at Render/server.js, not the edge function

- `index.html:795` — `window.BLEU_CONFIG = { ALVAI_URL: "https://bleu-system.onrender.com/api/chat", SUPABASE_URL: "...", SUPABASE_ANON: "..." }`. This is the one config block the rest of the page reads.
- `index.html:13049` — `const ALVAI_URL = 'https://bleu-system.onrender.com/api/chat'; const r = await fetch(ALVAI_URL, { ... })` (first hardcoded chat call).
- `index.html:13083` — same hardcoded URL, second fetch call.
- `index.html` has 55 `sbClient` references (auth, `profiles`, `conversations` CRUD). **Zero** `sbClient.functions.invoke`, **zero** `supabase.functions.*`, **zero** `/functions/v1/` URLs.

### B. The Node server also does not call the edge function

- `server.js` contains the full `ALVAI_CORE` prompt and 14 mode prompts (`server.js:41`, 238–457). It is its own Alvai implementation.
- `server.js` references `${SUPABASE_URL}/rest/v1/...` many times (`server.js:507`, 511, 537, 1364, 1428, 1600, 1756…) but **never** `${SUPABASE_URL}/functions/v1/...`. Grep for `/functions/v1` against `server.js` returns nothing.

### C. No Supabase-native trigger path

- `supabase/migrations/` contains only `add_coherence_index.sql` — pure DDL on `user_coherence` and `profiles`. No `CREATE TRIGGER`, no `pg_net`, no `pg_cron`, no `supabase_functions.http_request`. Repo-wide grep for those tokens in `.sql` / `.py` / `.js` / `.ts` returns nothing.
- No `supabase/config.toml` exists (checked via `find . -name config.toml` — empty).
- No `deno.json` / `deno.jsonc` exists anywhere in the repo.
- `supabase/.temp/` contains only CLI metadata (`cli-latest`, `project-ref`, `postgres-version`, etc.) — no function registration.

### D. No workflow deploys or invokes the edge function

- `.github/workflows/beast.yml` is the only workflow. Its jobs are `python engine.py --source npi|fda|google|youtube|pubmed|amazon` plus `--status`. No `supabase functions deploy`, no curl/fetch to `/functions/v1/alvai`.

### E. The edge function's invocation model is standard HTTP — it needs a caller

- `supabase/functions/alvai/index.ts:1995` — `serve(async (req) => { if (req.method === "OPTIONS") return ...; const body = await req.json(); const { mode, therapy_mode, recovery_mode, user_context, user_id, journey_context } = body; ... })`.
- This is a classic Deno HTTP handler expecting POST JSON. It is **not** a DB webhook handler (no `record/old_record` body), **not** a cron handler (no scheduled expression anywhere), **not** a storage trigger. Without an HTTP POST hitting `https://sqyzboesdpdussiwqpzk.supabase.co/functions/v1/alvai`, it runs zero times.

### F. Every remaining reference to the edge-function URL in this repo is in dead files

The URL `https://sqyzboesdpdussiwqpzk.supabase.co/functions/v1/alvai` still appears in the repo, but only in files that are not served:

- Backup HTML (`index.html.backup`, `index.html.backup-enhance`, `index.html.backup-20260228-184041`, `index.html.backup-20260307-133826`, `index.html.backup-learn-20260228-190711`).
- Staging/scratch copies (`index (7).html` through `index (13).html`, `nola-index*.txt`).
- Deploy / build scripts (`ocean-deploy.py:508`, `ocean-enhance.py:845`, `stream-upgrade.py:21`, `bleu-total-repair.py:908`, `bleu-beta-deploy.py:5`). These scripts historically *wrote* the edge-function URL into `index.html`. The current, shipped `index.html` (line 795) has the Render URL, not the Supabase URL — so either these scripts were superseded or someone hand-edited the config block during the Render migration.

Taken together: the frontend migrated from edge-function-backed chat to Render-hosted `server.js` chat some time before the current `index.html` was committed (backup dated 2026-03-07 still had the edge URL; current `index.html` does not).

### G. The edge function header still claims it is current

- `supabase/functions/alvai/index.ts:1–45` — the v5.0 header is stamped "FINAL FORM ARCHITECTURE — March 2026" and lists 20 agents across 6 super-fields, with the deploy line `supabase functions deploy alvai --project-ref sqyzboesdpdussiwqpzk`. This is the source of the mystery: the code is ambitious and self-describes as live, but nothing in this repo routes traffic to it.

---

## Tables the edge function WRITES to

(from grep `.insert|.upsert|.update` against `supabase/functions/alvai/index.ts`)

| Table | Lines | Mode |
|---|---|---|
| `session_embeddings` | 246 | INSERT |
| `commitments` | 258 | INSERT |
| `user_arcs` | 263 | UPSERT |
| `emotional_signals` | 421 | INSERT |
| `predictive_signals` | 470 | INSERT |
| `agent11_syntheses` | 586 | INSERT |
| `care_twin_state` | 1539, 1830 | UPSERT |
| `care_twin_embeddings` | 1904 | INSERT |

**Correction to prior audit:** `docs/bleu-system-state.md:130` lists `care_twin_state` as being written at line 1904, but the actual table at line 1904 is `care_twin_embeddings`. Worth fixing in the next audit pass. Also `user_arcs` is written by the edge function but is not in the audit's ghost-tables inventory at all.

## Tables the edge function READS from

(from grep `.select(` against `supabase/functions/alvai/index.ts`)

| Table | Lines | Columns selected (abbrev.) |
|---|---|---|
| `commitments` | 211 | commitment_text, created_at, kept |
| `practitioners` | 319, 1932 | full_name, npi, specialty, address, phone |
| `products` | 337 | name, category, trust_score, description, ingredients |
| `marketplace_practitioners` | 352 | practitioner_name, email, phone, credentials, pricing, onboarding_status |
| `emotional_signals` | 427, 454, 1573 | hopelessness, anxiety_load, resilience, etc. |
| `agent11_syntheses` | 582 | synthesis_text by query_hash (cache lookup, 7-day TTL) |
| `user_arcs` | 642 | arc_name, progress_score, stall_flag, signals |
| `care_twin_state` | 1517, 1534 | trust_score, session_count, arc_position, committed_actions |
| `session_embeddings` | 2201 | user_id (existence check only) |

---

## What this means for Passport architecture

Write paths for Passport should go through **`server.js` on Render**, not through the edge function, until and unless someone confirms external callers exist. Reasoning: (1) the shipped frontend's only chat path is `POST https://bleu-system.onrender.com/api/chat` — anything the edge function writes today is either dead or coming from a caller we can't see from this repo, and building new Passport code to depend on it compounds the ambiguity; (2) `server.js` already holds Supabase service-role credentials and has the `querySupabase` helper, so adding Passport inserts there is a small local change; (3) if the Supabase dashboard check (see top of doc) later reveals the edge function *is* taking live traffic from CannaIQ or another frontend, migrating the Passport writes over at that point is cheaper than splitting writes across two backends today. The one constraint: the ghost tables the edge function writes to (`session_embeddings`, `care_twin_state`, `user_arcs`, `agent11_syntheses`, `care_twin_embeddings`) should be considered *shared* — if Passport writes to any of them, schema changes need to stay compatible with both writers regardless of whether the edge function turns out to be live or dead.
