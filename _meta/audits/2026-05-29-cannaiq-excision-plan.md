# Bud / CannaIQ Excision Plan — 2026-05-29 (Day 81)

**Auditor:** Claude Code (CC) · **Trigger:** Captain decision — "Bud must be excised entirely from bleu-system."
**Status:** PLAN ONLY. No code/schema/deploy touched producing this document. Captain Soul-Gate required before any removal PR.
**Pinned to:** `server.js` @ commit `56e9fd8`.

---

## TL;DR

**The excision is bigger and more nuanced than the earlier brief suggested.** Once I traced every line precisely, it splits cleanly into **three independent decisions** rather than one — and Captain should make them one at a time, in order. Decision A is safe and uncontroversial. Decisions B and C are real product/architecture decisions disguised as code cleanup.

This document does three things: (1) corrects two factual errors in `docs/REPO_MAP.md`; (2) lays out the three decisions with line-precise inventory; (3) recommends a 4-PR sequence with the smallest, safest cut first.

---

## Corrections to REPO_MAP.md (transparency)

Tonight's deeper grep surfaced two claims in the repo map that were imprecise. Flagging them so the historical record is honest. The map itself is unchanged (immutable artifact); future revisions should pick these up.

| REPO_MAP.md claim | Reality | What changed |
|---|---|---|
| §11 / §17: "`index.html` nav label 'CannaIQ'" | `index.html` has **no visible CannaIQ nav label or link**. The only CannaIQ-adjacent mention is **one comment** at line 28: `ECS rule: on Home, cannabis is never the primary word. ECSIQ holds it.` Architectural intent, not UI. | No nav-link removal needed in `index.html`. |
| §11: "`cities/01-supabase-tables.sql` — CannaIQ MASTERPIECE schema" | The **commit message** for this file was "CANNAIQ MASTERPIECE…" but the **file content** is a one-time BLEU profiles/auth schema scaffold (PROFILES table, etc.). Misfiled-and-mislabeled, but not CannaIQ schema. | This file is a generic cleanup target (misfile in `cities/`), not a CannaIQ excision target. |

Also surfaced (not in REPO_MAP at all):

| Finding | Where | Significance |
|---|---|---|
| **BLEU.live has a dedicated `/ecsiq` route in the Seven Seas router** | `server.js:3803-3805` (`pn.match(/^\/(local\|support\|learn\|supply\|ecsiq\|why)\/?$/)`) | Sea VI = ECSIQ. Cannabis is **architecturally sequestered** to this sea on BLEU.live; not mixed into Local/Supply. The supply.html comment "Wall held: ECS not cannabis. Cannabis lives in Sea vi (ECSIQ)" is the design intent. **Removing cannabis from BLEU.live means removing Sea VI** — that's a real product surface, not just stray code. |
| Eight doctrine docs mention cannabis-related terms | `_meta/doctrine/*` | Most are passing references (refusal cross-links, voice examples, CYP450 audit, OpenAI Agents SDK migration doctrine). Doctrine layer is not deeply entangled — but it does exist. |
| CLAUDE.md lists 14 tab modes **including `cannaiq`** | `CLAUDE.md:7` | The project's own canonical statement says cannabis IS a BLEU tab. Removing means amending CLAUDE.md. |
| Master audit prompt explicitly says CannaIQ + Hybrid LA are separate entities | `BLEU_LIVE_MASTER_AUDIT_PROMPT.md:58, 60` | Captain has already stated the architectural intent that CannaIQ is separate. Excision aligns with this. |

---

## The three decisions (each independent; choose explicitly)

| | Decision | What it removes | Risk | Captain question |
|---|---|---|---|---|
| **A** | Remove the **BUD V5 cross-repo intercept** | `server.js:218-783` (566 LOC) — the BUD voice that gets served when `cannaiq.net` sends `mode:'cannaiq', assistant:'Bud'` | 🟢 LOW | "Does `cannaiq.net` need bleu-system to serve Bud's voice on its behalf?" If no (probably correct — its own server should), this is pure cleanup. |
| **B** | Remove **BLEU.live's own ECSIQ sea (Sea VI)** + the `cannaiq` MODE_PROMPT | `server.js:1063-1091` (29 LOC cannaiq prompt) · `server.js:1736-1755` (`ecsiqMode` classifier) · `server.js:1793-1796` (ECSIQ branch in routing) · `server.js:3803-3805` (`/ecsiq` route in Seven Seas) · supply.html + index.html ECSIQ comments | 🟠 MEDIUM | "Is cannabis a thing BLEU.live talks about at all? Or does cannabis live 100% on CannaIQ.net / Hybrid LA, with BLEU.live being a pure non-cannabis longevity surface?" |
| **C** | Scrub **cannabis trigger words + bridge copy** from BLEU prompts | `server.js:2042` DEEP_TRIGGERS (remove `cbd`,`thc`,`cannabis`,`strain`,`terpene`) · `server.js:2041` DEEP_MODES (remove `'cannaiq'`) · ~15 cross-mode "bridge to CannaIQ" lines scattered through MODE_PROMPTS (`server.js:812, 912, 921, 947, 967, 1062, 1077`) · `_meta/doctrine` passing references | 🟡 LOW–MEDIUM | "If a user asks BLEU about CBD or THC, what should happen? Today: routed to deep-mode handler + bridged toward CannaIQ. After C: routed to general ALVAI; no bridge." |

**Captain Soul-Gate recommendation:** sequence as A → B → C. Pause at each. A is reversible-by-revert (no behavior change visible to BLEU.live users — only `cannaiq.net` could notice if it was relying on the intercept). B and C are real product decisions that should be made deliberately.

---

## Line-precise inventory

### Decision A — BUD V5 cross-repo intercept

| Path | Line(s) | LOC | What it is |
|---|---|---|---|
| `server.js` | 218–224 | 7 | Header comment block (`═══ BUD V5 — CANNAIQ.NET INTERCEPT ═══`) explaining the source-of-truth contract |
| `server.js` | 225–783 | 559 | `const BUD_V5_SYSTEM_PROMPT` template literal — the entire BUD voice prompt |
| `server.js` | (anywhere `BUD_V5_SYSTEM_PROMPT` is referenced — needs a grep after removal) | — | Call sites that select the prompt when `mode==='cannaiq' && assistant==='Bud'`. Per the header comment, the gate logic is somewhere in the request handler that picks the system prompt. |
| `_meta/doctrine/refusal_doctrine_v1.md` (passing references only) | — | — | No hard dependency on BUD V5 prompt; references are conceptual. |

**Estimated PR size:** 566 LOC deleted from `server.js` + the call-site gate. Single file. ~570 LOC net.

**Risk per removal:** 🟢
- BLEU.live itself never receives traffic with `assistant:'Bud'` (per the inline comment, that flag only comes from cannaiq.net's frontend).
- CannaIQ.net's own canonical prompt already lives at `/workspaces/cannaiq/app/api/chat/route.ts` per the comment at `server.js:224` — so removing this copy aligns CannaIQ with single-source-of-truth.
- Failure mode if a `cannaiq.net` user hits BLEU with `mode:'cannaiq', assistant:'Bud'` after removal: falls through to `MODE_PROMPTS.cannaiq` (BLEU's own cannabis prompt — Decision B territory) or to general ALVAI. Neither crashes.

### Decision B — BLEU's own ECSIQ sea (Sea VI)

| Path | Line(s) | LOC | What it is |
|---|---|---|---|
| `server.js` | 1063–1091 | 29 | `MODE_PROMPTS.cannaiq` — BLEU's own "28 years of cannabis medicine" prompt. Includes regulatory floor (FDA/CDC/FTC), USE MODE, RESET MODE. |
| `server.js` | 1736–1755 (approx — function ends with closing `}`) | ~20 | `function ecsiqMode(message)` — classifies cannabis-sea messages as `use` vs `reset` |
| `server.js` | 1793–1797 | 5 | ECSIQ/CannaIQ branch in routing handler that calls `ecsiqMode()` and logs `ecsiq_mode_classified` |
| `server.js` | 3803–3805 | 3 | Seven Seas route regex: `/^\/(local\|support\|learn\|supply\|ecsiq\|why)\/?$/` — remove `ecsiq` token (or remove the route entirely if also dropping `why`) |
| `index.html` | 28 | 1 | Comment: `ECS rule: on Home, cannabis is never the primary word. ECSIQ holds it.` |
| `supply.html` | 28 | 1 | Comment: `Wall held: ECS not cannabis. Cannabis lives in Sea vi (ECSIQ).` |
| Any sea HTML rendering an "ECSIQ" tab/link | TBD — needs grep after Captain confirms B | — | None found in current grep, but a "Sea VI" entry in any tab list/sidebar would need removal too |
| `CLAUDE.md` | 7 | 1 | Remove `cannaiq` from the 14-mode list; update count to 13 (or whatever the real number is post-B) |

**Estimated PR size:** ~60 LOC across 5 files.

**Risk per removal:** 🟠
- `/ecsiq` route returns 404 after — any inbound link / bookmark / shared URL breaks.
- Any logged event of type `ecsiq_mode_classified` in `bleu_events` is now orphan history (fine — historical events stay readable; just no new ones).
- The "regulatory floor" prose in the cannaiq prompt is the only place in `server.js` that cites FDA/CDC/FTC posture on cannabis. If BLEU ever needs to defend "we used to say X about cannabis" → it's gone from the live prompt but preserved in git history.
- **Real question Captain should answer first:** Does anyone link to `/ecsiq`? Is it in any printed material, social post, or partner deck? If yes, add a 301 to `/learn` or `/support` before deletion.

### Decision C — Cannabis trigger words + bridge copy

| Path | Line(s) | What it is | Recommended action |
|---|---|---|---|
| `server.js` | 2041 | `const DEEP_MODES = ['therapy','recovery','crisis','cannaiq','directory']` | Remove `'cannaiq'` element |
| `server.js` | 2042 | `const DEEP_TRIGGERS = [...,'cbd','thc','cannabis','strain','terpene',...]` | Remove those 5 elements |
| `server.js` | 812 | `Cannabis questions → CannaIQ.` (in general routing prose) | Remove that clause |
| `server.js` | 912 | `Bridges: CannaIQ — "Some pair with cannabis."` (dashboard mode) | Remove `CannaIQ` bridge |
| `server.js` | 921 | `CannaIQ — "What to ask for at the dispensary."` (directory mode) | Remove `CannaIQ` bridge |
| `server.js` | 947 | `CannaIQ — "28 years of cannabis context."` (map mode) | Remove `CannaIQ` bridge |
| `server.js` | 967 | `…stress, grief, relationships, cannabis, longevity.` (community mode wellness goals) | Remove `cannabis` token |
| `server.js` | 1062 | `Vessel — "body needs support too."` ← unrelated, **leave alone** | (no change) |
| `server.js` | 1077 | `Bridges: Vessel — "Cannabis works best in a complete stack." …` (inside cannaiq mode — gone with B) | (removed with B) |
| `_meta/doctrine/coca_cola_recipe_v1.md`, `cyp450_wiring_audit.md`, `decision_matrix.md`, `_README.md`, `openai_agents_sdk_migration_v1.md`, `source_document_v1.md`, `lens_architecture_doctrine_v1.md`, `refusal_doctrine_v1.md` | scattered | Passing references to cannabis, mostly as voice examples or cross-links | Editorial pass; not a deletion. Captain + Dr. Felicia decide what stays as historical context. |

**Estimated PR size:** ~10 LOC across `server.js` + an editorial doctrine pass.

**Risk per removal:** 🟡
- A user typing "best CBD for sleep" after removal hits **general ALVAI** instead of the deep-mode handler. ALVAI's general prompt has no cannabis specialization → answers will be generic.
- Cross-mode bridges shrink slightly — voice becomes a bit more inward-facing.
- **Reversible.** Each removal is a small diff.

---

## Root-level and other artifacts (CannaIQ-adjacent dead code)

These are independent of the three decisions above — they can ship in the same PR or separately. All are dead.

| Path | Size | Status | Action |
|---|---|---|---|
| `inject-cannaiq.py` | 29 lines (mostly placeholder) | 💀 dead since April 23, 2026 | Archive to `_archive/legacy-codemods/` (with the other 38 dead root .py scripts — see REPO_MAP §19 PR #2) or delete |
| `ciq.py` | 101 lines (HTML codemod for CannaIQ tab styling) | 💀 dead since April 23, 2026 | Same — archive or delete |
| `cities/01-supabase-tables.sql` | 65 lines | 💀 misfiled BLEU profiles+auth scaffold (**NOT** CannaIQ schema as REPO_MAP misstated) | Move out of `cities/` (it's HTML pages dir) → `_archive/legacy-sql/` or delete (schema is now superseded by `supabase/migrations/`) |
| Any other root `.py` mentioning cannabis | (checked — none) | — | — |

---

## Dependencies + integration points to consider

### Supabase tables
- **No `cannaiq_*` tables found in `supabase/migrations/`.** ✅
- `bleu_catalog` may have cannabis-tagged entries — needs grep at decision time (no schema change required either way; entries can be soft-flagged or left).
- `bleu_events` has historical `ecsiq_mode_classified` events (Decision B+) — leave history intact; just stop writing new ones.

### Env vars
- **No CannaIQ-specific env vars exist.** BUD/cannaiq paths use the same `OPENAI_API_KEY` as everything else. No orphan vars after removal.

### Imports
- `BUD_V5_SYSTEM_PROMPT`, `ecsiqMode`, `MODE_PROMPTS.cannaiq` — all live inside `server.js`. **No external file imports them.** No broken-import risk in this repo.
- The `cannaiq` repo at `/workspaces/cannaiq/` is a **separate** codebase. Its `app/api/chat/route.ts` has its own `BUD_SYSTEM_PROMPT` per the comment at `server.js:224`. Cannot break cannaiq repo from edits here.

### Doctrine
- **8 doctrine files mention cannabis/CBD/THC/strain/terpene** at least once — mostly as voice examples, cross-links, or in `cyp450_wiring_audit.md` (which is genuinely about drug interactions, including cannabinoid–medication). Decision C editorial pass would touch these.
- `_meta/doctrine/refusal_doctrine_v1.md` doesn't contain hard cannabis content — false positive in grep (matched on `[[refusal_list]]` link).

### Test coverage
- **Zero current tests cover the BUD intercept, ECSIQ mode, or cannaiq MODE_PROMPT.** Removing them won't break any test.
- **BUT:** to prove no regression on the chat path generally, before/during/after each PR we need:
  - A test that POSTs `/api/chat` with `mode:'cannaiq', assistant:'Bud'` and asserts the response is sensible (after A: falls through to `MODE_PROMPTS.cannaiq`; after A+B: falls through to general; never crashes).
  - A test that POSTs `/api/chat` with each of the other 13 modes and asserts each still returns a response (regression guard against accidentally touching a sibling key in `MODE_PROMPTS`).
  - A test that visits `/ecsiq` (after B) and asserts the 4xx response is the expected one (not a 500).
  - A `node --check server.js` build smoke (lint-equivalent for unbundled JS) — already trivially passes; just include in CI.

---

## Recommended PR sequence

| PR | Title | Scope | LOC delta | Captain pause for review |
|---|---|---|---|---|
| **0 (pre-req)** | `test(chat): add per-mode smoke test for /api/chat` | New `tests/integration/chat-modes.smoke.js` covering all 14 modes (current state). Establishes the baseline that subsequent removals can't regress. | +~120 (test only) | ✅ — confirm the test passes against current main before any removal |
| **1** | `refactor(cannaiq): remove BUD V5 cross-repo intercept (Decision A)` | Delete `server.js:218-783` (566 LOC) + remove the call-site that selects BUD_V5 when `assistant:'Bud'` + update test from PR #0 to assert post-A behavior | −570 ± | ✅ — Captain confirms cannaiq.net team is OK with serving Bud from their own server |
| **2** | `chore: archive dead root-level Python scripts + misfiled SQL` | Move `inject-cannaiq.py`, `ciq.py`, `cities/01-supabase-tables.sql`, and (per REPO_MAP §19 PR #2) the 36 other dead root .py files to `_archive/` | git mv only; no code change | 🟡 — low risk; can ship without Captain pause |
| **3 (B — optional)** | `feat(architecture): retire ECSIQ sea + BLEU cannaiq mode (Decision B)` | Remove `MODE_PROMPTS.cannaiq` (29 LOC), `ecsiqMode` function (~20 LOC), ECSIQ routing branch (5 LOC), `/ecsiq` route token (3 LOC), supply.html + index.html comments (2 lines), CLAUDE.md mode-list update | −60 | ✅ — real product decision; Captain decides explicitly; also add 301 from `/ecsiq` → `/learn` if any inbound links exist |
| **4 (C — optional)** | `refactor: drop cannabis trigger words + cross-mode bridges (Decision C)` | Trim `DEEP_TRIGGERS`, `DEEP_MODES`, bridge clauses in 5 mode prompts | −10 | ✅ — editorial; Captain or Dr. Felicia reviews voice impact |

**Timeline guidance:**
- PR 0 + PR 1 are tonight-or-tomorrow material. Low risk, high signal, no product decision.
- PR 2 is anytime — pure janitorial.
- PRs 3 and 4 wait for Captain to answer the two questions in the decision table above. Not tonight.

---

## What this plan does NOT do

- ❌ No code removed. No files moved. No commits made beyond this single document being written.
- ❌ No decision made on B or C — those are Captain's to make explicitly.
- ❌ No edits to REPO_MAP.md — the corrections are noted here so the historical record is honest. If Captain wants the map amended, that's a separate small PR.
- ❌ No changes to doctrine docs — Decision C's editorial pass is recommended, not executed.
- ❌ No tests written — PR #0 in the sequence is the recommendation; not done yet.

---

## Open questions for Captain Soul-Gate

1. **Decision A:** Does CannaIQ.net's frontend still rely on `bleu-system.onrender.com` serving the BUD voice via `mode:'cannaiq', assistant:'Bud'`? If yes → coordinate with cannaiq.net team before removal. If no (or unknown) → ship A; the cannaiq.net team will tell us if it broke them.
2. **Decision B:** Is `/ecsiq` linked anywhere outside the repo? Partner deck, social post, business card, printed material, email? If yes → add `301 /ecsiq → /learn` (or wherever) before deletion.
3. **Decision B:** Does BLEU.live retain ANY cannabis-related content surface, or does cannabis = 100% CannaIQ.net + Hybrid LA? (This is the founder-level architecture decision the per-PR cleanup is downstream of.)
4. **Decision C:** When a user asks BLEU "best CBD for sleep" after C, what's the right answer? Options: (a) generic ALVAI ("I don't specialize in cannabis — try CannaIQ.net") with a soft bridge; (b) hard refuse; (c) leave the trigger words in just enough to route, but no bridge copy.
5. **Doctrine:** The OpenAI Agents SDK migration doctrine (`_meta/doctrine/openai_agents_sdk_migration_v1.md`) was filed Day 80. Does it need amending to reflect "ALVAI moves to Agents SDK AND drops cannabis surface" as one unified decision, or are these two separate doctrine notes?
6. **Cross-repo coordination:** Should the cannaiq repo also archive any "BLEU integration" code that assumed bleu-system served BUD? (Likely yes after A.)

---

## Companion document

See `_meta/audits/2026-05-29-dns-sms-verification.md` (filed same day) for the ops audit that should land before any of these PRs — confirms what's running, what's broken, what's silent. The `REORDER_CRON_SECRET` gap discovered tonight is independent of excision but should be fixed in parallel.

---

*Plan by Claude Code, Day 81. Read-only audit. Captain Soul-Gate required before any code removal.*
