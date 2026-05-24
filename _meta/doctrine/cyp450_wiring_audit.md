# CYP450 Safety Wiring Audit

**STATUS: AUDIT COMPLETE — wiring mission queued as 7.8B.** No code changed in
this mission (7.8). Findings only.

## Section 1 — CYP450 engine location + signature
There is **no callable CYP450 engine function in the runtime (`server.js`).**
`CYP450` appears only as PROSE in MODE_PROMPTS (cannaiq, ~line 1067) and one
SEO/string reference (~2663). `CYP_DATABASE` exists only in `.py` build/
generator scripts (ciq.py, master.py, bleu-masterpiece*.py, rebuild.py, …) —
content generators, not the live request path.

The runtime drug-interaction capability is **`GET /api/safety-check`**
(server.js ~2656), which queries **FDA OpenFDA labels + RxNorm** at request
time (per CLAUDE.md). It is a standalone endpoint, not a function the commerce
flow calls.

## Section 2 — Engine call sites in the commerce flow
**None.** `runCommerceSteward` → `safetyBrain(ctx)` (server.js ~1319) reads
`ctx.safety_status`, which is hardcoded to `'clear'` at ctx construction
(~1452, comment: "Phase 5 fills this"). So in production `safetyBrain` always
returns `{decision:'render', badge:null}`. The cart Add / Checkout path makes
no call to `/api/safety-check`, FDA/RxNorm, or any CYP database.

(The CHAT prose path does fire FDA/RxNorm interaction lookups when 2+ drugs/
supplements are mentioned — server.js ~1916 — so ALVAI can WARN in
conversation. That warning does not gate the card.)

## Section 3 — Card render integration status
The card carries a `safety_badge` field (Mission 2.3/2.5) wired to
`safety.badge`. Because `safetyBrain` always returns `badge:null` today, the
badge **never renders**. The "✓ Reviewed by Dr. Stoler" line is `felicia_signoff`
(catalog static flag), NOT a live interaction status. The seam exists; it is
unfed.

## Section 4 — Medications data source path
**No structured medications store exists.** `profiles` has no medications
column; `bleu_citizens` (shipped 7.2A) has none; the only medications field
anywhere is `session_embeddings.medications_mentioned` (free-text, embedding
context — not a queryable per-user med list). Wiring a real interaction gate
first requires a medications field on the Citizen/profile.

## Section 5 — Three-step wiring plan for Mission 7.8B
1. **Store:** add a `medications jsonb` column to `bleu_citizens` (or `profiles`)
   + a capture path (Passport already collects health data; extend it).
2. **Screen:** at cart Add (or pre-Checkout), retrieve the Citizen's
   medications, pass them + the cart SKU's active ingredients to a runtime
   engine. Cheapest path: reuse `/api/safety-check` (FDA/RxNorm) internally;
   richer path: port the `.py` CYP_DATABASE into a `core/safety/cyp_engine.js`
   exporting `screen(meds, ingredients) → CLEAR | MONITOR | CAUTION`.
3. **Reflect:** set `ctx.safety_status` from the screen result so `safetyBrain`
   emits the badge ('Verify with your clinician' / 'Please verify with
   Dr. Stoler before starting'); badge color on the card reflects status;
   `gate`/`block` reduce `max_cards` or suppress.

## Section 6 — Risk assessment
**Current exposure: MODERATE, not Tier-1 emergency.**
- Cards render with ZERO interaction screening (`safety_status` always 'clear').
- BUT: the live catalog is low-interaction OTC supplements (magnesium,
  L-theanine, omega-3, D3, zinc, psyllium, melatonin, ashwagandha) + 4 BLEU
  Rail A plans — not high-interaction prescription compounds.
- AND there is no medications store to screen against even if wired today.
- The CHAT path still surfaces FDA/RxNorm warnings when meds are mentioned.

Conclusion: no user is currently shown a high-risk drug-interaction card,
because the catalog is OTC-supplement-grade and no med data exists to collide
with. 7.8B is **important but not an overnight Tier-1** — it should precede
seeding any higher-interaction SKUs (e.g. anything beyond OTC supplements, or
the Fullscript Rail B clinical protocols if they include actives with known
CYP interactions). Recommend 7.8B before Rail B cards go live to users.
