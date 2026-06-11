# BLEU-CODEX-BUILD-PHASES
## Source of truth · The stamped build sequence, charter-compliant
### Signed: Bleu · June 11, 2026 · Each phase = branch + PR + human merge · Nothing merges blind

**Charter compliance:** This sequence operates under AGENTS.md. Phases marked
[THREESOME] touch schema/architecture and execute only after recorded approval by
Bleu + Dr. Felicia + Codex. Phases marked [BLEU] need Bleu's recorded approval.
No phase touches crisis language, ALVAI prompt text, or clinical copy — those are
Dr. Stoler's lane and OUT OF SCOPE here. The Lexapro demo path (AGENTS.md §4) is
protected: no phase may degrade it.

---

## PHASE 0 — Ground-truth audit [may execute directly — read-only]
Clean main (discard/park any dirty checkout incl. codex/fix-auth-routing). Report
HEAD sha. Verify in tree: loader present, crisis narrowed patterns, env-based keys.
Probe Supabase: zip_centroids?zip=eq.70130 → New Orleans; 714xx rows exist;
catalyst_event must NOT exist (if it does, STOP). Run crisis_validator → PASS.
GATE: print audit table; proceed only on match.

## PHASE 1 — catalyst_event + sms_log tables [THREESOME — schema]
SQL per BLEU-AZ-MASTER §5; rationale NOT NULL; RLS on; follow-up index.
VERIFY: insert without rationale FAILS; with rationale succeeds; delete test row.

## PHASE 2 — zips_within_radius() function [THREESOME — schema]
Bounding-box prefilter on (lat,lng) index + haversine (3958.8 mi), ordered by
distance, longitude box guarded with greatest(cos(lat),0.01).
VERIFY: zips_within_radius(31.76,-93.09,25) → 714xx by distance.

## PHASE 3 — resolveLocation() waterfall [BLEU — live path, Law 2 reporting]
core/geo/resolveLocation.js + wiring; tiers: entry context (?zip/?loc/subdomain,
high confidence) → IP X-Forwarded-For (low, soft default only) → zip_centroids
lookup (high) with small static fallback; browser-geo left as stub. Uniform shape
{lat,lng,zip,confidence,source}. CONFIDENCE LAW: provider names surface only at
confidence='high'. Add /geo debug route on the `if (pn ===` dispatch pattern.
VERIFY: /?zip=71457 → high/entry; no params → low/ip.
Law 2 report required: files, lines, before/after, tests, unverified remainder.

## PHASE 4 — Radius routing + desert honesty [BLEU — live path, Law 2 reporting]
Replace zip=like/zip=eq/address_line1-ilike paths with resolveLocation →
zips_within_radius (R=25→50→100) → practitioners by zip-set, ordered by zip
distance. Desert fallback: telehealth + HRSA FQHC/RHC + 988 + SAMHSA + 211 with
honest distance. NEVER fabricate. Old paths retained behind USE_RADIUS_ROUTING
env flag (default true) — rollback is a flag flip.
VERIFY: 71457 → real 714xx by distance OR honest desert route; 70130 → dense result.

## PHASE 5A — Write-ahead rationale in the handler [THREESOME — live-path decision behavior]
On routed med-change turns: classify medication_change/amber/care_transition using
EXISTING siren logic (do not modify it); compose rationale; INSERT catalyst_event
BEFORE responding; refuse to ship on insert failure (safe fallback);
follow_up_due_at = now()+2 days; system_version from package.json.
VERIFY: one simulated turn → one row, rationale non-null, created_at < response.

## PHASE 5B — SMS spine, flagged OFF [THREESOME — new live behavior; sends disabled]
SMS_ENABLED env flag default false (toll-free verification pending; sends write
sms_log status='simulated'). Outbound scheduler endpoint: open events past
follow_up_due_at AND consent_status='granted' only — consent gate is absolute.
Inbound POST /api/sms-inbound: YES/OK/REACHED → closed/resolved; NO/HELP/STILL →
reopen + staff_action_required + follow_up +1 day; crisis language in replies →
EXISTING crisis protocol (no new safety language). No PHI in message bodies.
VERIFY: simulated outbound logs; 'YES' closes; 'still need help' reopens with flag.

## PHASE 6 — Repo polish [may execute directly, with grep-before-move proof]
ajv ^8 + ajv-formats devDependencies per the AGENTS.md schema test rule
(Ajv2020 from 'ajv/dist/2020', strict:true — never downgrade); full `npm test`
green; ci.yml fails PRs on red. Archive one-off root scripts to /_archive/ with
README — grep for live references before moving each; never move engine.py,
tank-filler.py, populate_zip_centroids.py, deploy.sh, server.js, index.html, ciq.py.
nola repo (separate PR): remove 1-byte junk files + duplicated loader/workflow;
add .gitignore; CNAME and index.html untouched.

---

## OUT OF SCOPE (hard)
ALVAI prompt / safety language / crisis patterns / siren wording (Dr. Stoler) ·
SLEEP directive · desert resource CONTENT · reading-grade rewrites · model tier
decision · city-page attribution regeneration (separate reviewed job) ·
practitioner geocoding backfill · enabling live SMS · wiring dormant core/agents
modules into the live path (AGENTS.md §2 binding rule).

## DEFINITION OF DONE — the 71457 proof loop
[ ] audit table printed, clean main
[ ] catalyst_event exists; NOT NULL proven by insert-failure
[ ] radius function returns 714xx by distance
[ ] resolveLocation high/low behavior proven
[ ] 71457 → verified providers by distance OR honest desert; zero fabricated names
[ ] one med-change turn → one row, rationale written BEFORE reply
[ ] simulated SMS loop closes/reopens; consent gate proven
[ ] full suite green incl. schema suites; credential grep empty per branch
[ ] all PRs listed, none merged by Codex
