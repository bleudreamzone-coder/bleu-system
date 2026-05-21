# 02 — File Inventory

**Audit date:** 2026-05-21 · **Git tip:** `f70426a` (wire 1: anon→auth conversation memory merge)
**Layers:** P=Presentation · A=Application · D=Domain · I=Infrastructure · X=Cross-cutting/none

## Tree (root, depth 2, with `cities/` and `dist/` collapsed)

```
/workspaces/bleu-system
├── 1000                                    (empty file)
├── BLEU_Global_100K (1).zip                (19 MB)
├── BLEU_HERO_12Cities (1).zip              (760 KB)
├── BLEU_HERO_ALL_333_UPGRADED.zip          (9 MB)
├── BLEU_LIVE_MASTER_AUDIT_PROMPT.md
├── BLEU_LIVE_Score_v2_Nuclear.html         (55 KB)
├── BLEU_NOLA_2am_v3_Nuclear.html           (24 KB)
├── BLEU_US_Cities (1).zip                  (21 MB)
├── BLEU_dist_{anxiety,gut,meta,sleep}.zip  (4 × ~2.7 MB)
├── CLAUDE.md
├── CNAME                                   ("bleu.live")
├── alvai-v3.ts                             (794 L — v3 edge fn, dead)
├── autonomous-engine.js                    (752 L — never required)
├── batch1.py                               (220 L — one-shot)
├── bleu-3fixes.py … bleu-win.py            (~16 fix/patch scripts)
├── bleu-core/                              (nested sub-project, see below)
├── bleu-master.html                        (2,255 L — backup)
├── cannaiq-new.html                        (14 bytes — WALL VIOLATION marker)
├── ciq.py                                  (10 KB)
├── cities/                                 (154 US city .html + 01-supabase-tables.sql)
├── core/                                   (5 .js — clean domain modules, NEVER REQUIRED)
├── deploy.sh
├── dist/                                   (~6,025 generated pages: cities 4214, anxiety 603, sleep 604, gut 603, whitepapers 1, plus DEAD index*.html + scripts)
├── docs/                                   (5 .md — audit/migration notes, current)
├── engine.py                               (1,172 L — LIVE pipeline)
├── enhance-*.py, files (*).zip             (one-shots + asset bundles)
├── fix-*.py, home*.py, master.py, mp2.py   (one-shot scripts)
├── index (7-13).html                       (7 backup snapshots)
├── index.html                              (13,992 L — LIVE SPA)
├── index.html.backup* (5 files)            (DEAD)
├── inject-cannaiq.py                       (WALL VIOLATION risk)
├── main                                    (empty file)
├── manifest.json
├── nixpacks.toml
├── nola-enhanced.html                      (40 KB)
├── nola-index*.txt (7 files)               (DEAD snapshots, contain stale edge fn URL)
├── nola-soul.py
├── ocean-deploy.py, ocean-enhance.py
├── package.json                            (3 lines)
├── patch.py, patch-bleu.py
├── privacy.html, terms.html
├── railway.json
├── rebuild.py
├── requirements.txt                        (3 deps)
├── ripple_state.json
├── robots.txt
├── seo-engine.js                           (767 L — LIVE, required by server.js)
├── server-old-claude.js                    (751 L — DEAD)
├── server-v4.js                            (253 L — DEAD older version)
├── server.js                               (1,898 L — LIVE)
├── server.js.backup                        (DEAD)
├── sitemap.xml                             (3 URLs only — see Content audit)
├── stream-upgrade.py                       (one-shot)
├── supabase/
│   ├── functions/
│   │   ├── alvai/index.ts                  (2,363 L — v5.0 edge fn, AMBIGUOUS-DEAD)
│   │   ├── alvai/index.ts.backup, .backup2 (DEAD)
│   │   └── stripe-checkout/index.ts        (LIVE — used by /api/personalize flow?)
│   └── migrations/
│       ├── 20260422_add_bhi_columns.sql
│       ├── 20260422_add_passport_health_columns.sql
│       └── add_coherence_index.sql
├── sw.js                                   (253 B service worker)
├── tab-dashboard.py, tab-directory.py
├── tank-filler.py                          (1,116 L — one-shot data filler)
├── upgrade.py
└── .github/workflows/beast.yml             (only CI; runs engine.py 4× daily)
```

## Inventory table — sorted by path

| Path | Layer | Status | Target (4-tier) | Notes |
|---|---|---|---|---|
| `1000`, `main` | X | DEAD | delete | Empty files, unknown origin |
| `BLEU_*.zip` (6 archives, ~62 MB) | X | DEAD | move out of repo | Asset bundles; do not belong in source control |
| `BLEU_LIVE_MASTER_AUDIT_PROMPT.md` | X | LIVE | `_meta/` | Reusable audit spec — saved by this audit |
| `BLEU_LIVE_Score_v2_Nuclear.html` | P | DEAD | archive | One-off marketing snapshot |
| `BLEU_NOLA_2am_v3_Nuclear.html` | P | DEAD | archive | One-off marketing snapshot |
| `CLAUDE.md` | X | LIVE | keep at root | Project instructions, mostly accurate |
| `CNAME` | I | LIVE | keep at root | "bleu.live" custom domain |
| `alvai-v3.ts` | D | DEAD | archive or move into `supabase/functions/` history | v3 12-agent edge fn; superseded by v5 in `supabase/functions/alvai/`; neither is invoked |
| `autonomous-engine.js` | A | STAGED-DEAD | infrastructure or delete | 752 L scheduler module; **never `require`d** anywhere — orphan |
| `batch1.py`, `bleu-3fixes.py` … `bleu-win.py` (~17) | X | DEAD | archive | One-shot fix/patch scripts; not part of runtime |
| `bleu-core/` | D/A/P | STAGED | promote to D when ready | Self-contained mini-project with **wired** `core/` (CI/ISI/state/trajectory/alvai), tests, own `server.js`. Real domain code; not consumed by live server. |
| `bleu-core/test/loop.test.js` | X | STAGED | promote | The only test in the repo; not run by any CI |
| `bleu-master.html` | P | DEAD | archive | 2,255 L backup |
| `cannaiq-new.html` | P | WALL VIOLATION | delete | 14-byte placeholder named for the separate CannaIQ entity |
| `ciq.py`, `inject-cannaiq.py` | X | WALL VIOLATION | delete or move to CannaIQ repo | "ciq" = CannaIQ; do not keep in bleu.live source tree |
| `cities/*.html` (154 US cities) | P | LIVE-OR-STAGED | move to `dist/cities/` or delete | Static SEO pages; **not served** by `server.js` (SEO is dynamic via `seo-engine.js`). Either dead duplicates or pre-rendered alternates. |
| `cities/01-supabase-tables.sql` | I | LIVE | `supabase/migrations/` | Misplaced — should be in migrations folder |
| `cities/deploy.sh` | I | DEAD | archive | Unused deploy script |
| `core/alvai.js` | D | STAGED | **the** Domain layer | 100 L. VOICE constant + buildSystemPrompt + CONFIDENCE_INSTRUCTIONS. Clean, pure, **never `require`d by server.js**. |
| `core/ci.js` | D | STAGED | **the** Domain layer | Coherence Index formula, fusion detection |
| `core/isi.js` | D | STAGED | **the** Domain layer | Identity Stability Index formula with smoothing |
| `core/state.js` | D | STAGED | **the** Domain layer | Computes UserState from message + passport |
| `core/trajectory.js` | D | STAGED | **the** Domain layer | Trajectory analysis (slope/volatility/engagement) |
| `deploy.sh` | I | UNKNOWN | infra | 25 KB shell script; not exercised by current deploys (Railway/Render do their own) |
| `dist/anxiety/` (603 files) | P | LIVE-OR-STAGED | content pipeline | Pre-rendered global anxiety×city SEO pages |
| `dist/cities/` (4,214 files) | P | LIVE-OR-STAGED | content pipeline | Pre-rendered global city SEO pages |
| `dist/gut/`, `dist/sleep/` (603+604) | P | LIVE-OR-STAGED | content pipeline | Pre-rendered condition×city pages |
| `dist/whitepapers/` (1 file) | P | DOCUMENTED-ONLY | — | Single file only |
| `dist/index (7-13).html`, `dist/server.js`, etc. | X | DEAD | delete | Duplicate backups inside dist |
| `docs/*.md` (5) | X | LIVE | keep | 2026-04-22 system-state audit + migration notes; **single most useful documentation in the repo** |
| `engine.py` | I | LIVE | Infrastructure (data adapter) | 1,172 L BEAST data pipeline. Mixed layers (some domain-shaped intent detection) — TANGLED |
| `enhance-*.py`, `enhance-learn-tab.py` | X | DEAD | archive | One-shot scripts |
| `files (*).zip` (4 archives, ~18 MB) | X | DEAD | move out of repo | Unknown bundles |
| `fix-*.py`, `home.py`, `home2.py`, `home3.py`, `master.py`, `mp2.py` | X | DEAD | archive | One-shot scripts |
| `index.html` | P/A/D mixed | LIVE | split into P + small A | **13,992 L** — TANGLED (UI + Supabase fetches + auth + dimension scoring + FHIR export + Stripe handoff + ~12 tabs). #1 refactor target. |
| `index.html.backup*` (5) | X | DEAD | delete | Backups; remove from working tree |
| `index (7-13).html` (7) | X | DEAD | delete | Backups |
| `manifest.json` | P | LIVE | keep | PWA manifest |
| `nixpacks.toml` | I | LIVE | keep | Nixpacks builder config (Node 20) |
| `nola-*.html`, `nola-*.txt`, `nola-soul.py` | P | DEAD or WALL VIOLATION risk | archive | Contain stale Supabase edge URL + Jazz Bird references — do not deploy |
| `ocean-deploy.py`, `ocean-enhance.py` | X | DEAD | archive | Old deploy/enhance scripts |
| `package.json` | I | LIVE | keep | Minimal (`{start: node server.js}`); no lockfile, no deps declared |
| `patch.py`, `patch-bleu.py` | X | DEAD | archive | One-shot patches |
| `privacy.html`, `terms.html` | P | LIVE | keep | Legal pages |
| `railway.json` | I | LIVE | keep | Railway deploy config |
| `rebuild.py` | X | DEAD | archive | One-shot |
| `requirements.txt` | I | LIVE | keep | Python deps for engine.py |
| `ripple_state.json` | I | UNKNOWN | investigate | 100 B JSON; touched only by one-off scripts; safe to delete |
| `robots.txt` | P | LIVE | keep | Allows all, blocks `/api/` |
| `seo-engine.js` | A | LIVE | Application | 767 L. **Required by server.js:1025**. Renders city/practitioner/sitemap pages from Supabase. |
| `server-old-claude.js`, `server-v4.js`, `server.js.backup` | X | DEAD | delete | Predecessor server files |
| `server.js` | A+D+I mixed | LIVE | split into A (HTTP) + D (prompts/clinical logic) + I (Supabase/OpenAI/Twilio/Stripe adapters) | **1,898 L** — TANGLED. Contains the entire ALVAI_CORE prompt (~5 KB) + 14 MODE_PROMPTS + clinical practitioner gating + Stripe webhook + Twilio + every external API client. #2 refactor target. |
| `sitemap.xml` | P | HALF-BUILT | regenerate | **3 URLs only** (root, terms, privacy). Does NOT list cities, practitioners, or condition pages. Massive gap. |
| `stream-upgrade.py` | X | DEAD | archive | One-shot |
| `supabase/functions/alvai/index.ts` | D+A mixed | AMBIGUOUS-DEAD | promote or delete | 2,363 L "v5.0 20-agent" edge function. **No in-repo caller.** Verdict per `docs/edge-function-investigation.md`: repo-local DEAD; external caller cannot be ruled out without checking Supabase dashboard invocation counts. |
| `supabase/functions/alvai/index.ts.backup{,2}` | X | DEAD | delete | Backups |
| `supabase/functions/stripe-checkout/index.ts` | I | LIVE | keep | Stripe checkout session creator |
| `supabase/migrations/20260422_add_bhi_columns.sql` | I | LIVE | keep | Adds bhi_score, bhi_updated_at |
| `supabase/migrations/20260422_add_passport_health_columns.sql` | I | LIVE | keep | Adds 10 health columns (weight, sleep, HRV, etc.) |
| `supabase/migrations/add_coherence_index.sql` | I | LIVE | keep | user_coherence table + view |
| `sw.js` | P | LIVE | keep | 253 B service worker stub |
| `tab-dashboard.py`, `tab-directory.py` | X | DEAD | archive | One-shot tab generators |
| `tank-filler.py` | X | DEAD | archive | 1,116 L one-shot data filler |
| `upgrade.py` | X | DEAD | archive | One-shot |
| `.gitignore` | I | HALF-BUILT | rewrite | **36 bytes**, contents: `\n.github/workflows/deploy-alvai.yml\n`. Does NOT exclude `.env`, `node_modules`, `*.swp`, OS files, or anything else standard. |
| `.server.js.swp` | X | DEAD | delete + add to .gitignore | Stray vim swap file committed |
| `.nojekyll` | I | LIVE | keep | GitHub Pages hint |
| `.github/workflows/beast.yml` | I | LIVE | keep | Only CI workflow — runs `engine.py` 4× daily, scrapes 6 sources. **No tests, no lint, no deploy gate.** |

## Counts

| Category | Count |
|---|---|
| **LIVE source files** (drive production) | ~12 (server.js, index.html, seo-engine.js, engine.py, 5 migrations, manifest.json, sw.js, CNAME, privacy.html, terms.html, package.json, railway.json, nixpacks.toml, robots.txt, .github/workflows/beast.yml) |
| **STAGED-but-not-wired** | 7 (`core/*.js` × 5, `bleu-core/*`, `supabase/functions/alvai/index.ts` if external caller exists) |
| **DEAD files** at repo root | **60+** (one-shot scripts, backups, snapshots, server-old, alvai-v3, autonomous-engine, etc.) |
| **DEAD archives (zips)** | 10 archives totaling ~80 MB |
| **WALL VIOLATION** | 3 (`cannaiq-new.html`, `ciq.py`, `inject-cannaiq.py` — name CannaIQ which is a separate entity) |
| **Generated content** in `dist/` | ~6,025 SEO pages |
| **Static city pages** in `cities/` | 154 (status: probable duplicates of `dist/cities/`) |
| **Test files** | 1 (`bleu-core/test/loop.test.js` — not run by any CI) |

## Major gaps surfaced by inventory

1. **`.gitignore` is effectively empty (36 bytes).** No exclusion of `.env`, `node_modules`, IDE files, OS junk. The only line ignores a `deploy-alvai.yml` workflow that **doesn't exist**. Any developer creating a `.env` next will commit it.
2. **No `package-lock.json` or `yarn.lock`.** `npm audit` cannot run. No dependency pinning. (The repo declares zero `dependencies` in `package.json` and runs purely on Node built-ins + global `fetch` — so vulnerability surface is small, but lockless still blocks audit.)
3. **No `.env.example`.** New developer has no enumerated list of required env vars; must read `server.js` + `engine.py` to discover them.
4. **60+ DEAD files at repo root** (one-shot scripts, server backups, index.html backups, ~80 MB of zip archives). Obscures the real surface for any new engineer.
5. **`core/` exists with clean domain code but is not wired.** This is the *first time the platform has had a real domain layer in code* — and it is currently unreferenced. Wiring it into `server.js` is the entire "extract domain layer" milestone, already 80% done in `bleu-core/`.
6. **`bleu-core/` is a sibling mini-project** with its own `server.js`, `package.json`, and the only test file in the repo. Its status is unclear — it appears to be the "v2" of the system or a sandbox for the unwired `core/`. Needs an explicit decision: promote, archive, or document as the eventual replacement target.
7. **`autonomous-engine.js` (752 L) is never `require`d.** Ambitious "24/7 brain" module — references content factory, Google Indexing API, sitemap regeneration. Orphan.
8. **The Supabase edge function `alvai/` is ambiguous-dead.** No in-repo caller. May have external traffic from another property (CannaIQ frontend, city deployments) — requires dashboard verification.
9. **`cities/` (154 files) vs `dist/cities/` (4,214 files)**: two parallel city-page systems. One is almost certainly stale. The shipped server doesn't serve files from `cities/` directly; it generates pages via `seo-engine.handleRoute()`.
10. **3 wall-violation files** with CannaIQ branding sit in this repo's root.
