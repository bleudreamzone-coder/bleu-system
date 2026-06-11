# BLEU-AZ-MASTER
## Source of truth · Master Calibration v2, reconciled with the repo charter
### Signed: Bleu (system doctrine lane) · June 11, 2026 · Additive only — nothing locked is edited

---

## 0. Reconciliation block (resolves CONFLICT flagged by Archivist)

**There is one loop, two granularities. No second architecture exists.**

| Charter (committed) | Calibration v2 (this doc) | Code |
|---|---|---|
| HEAR | **Signal** | `decompose()` / Prism |
| GOVERN | **Siren + Rail + Route + Record** | `decide()` + `record()` / Arbiter + Ledger |
| RETURN | **Return** | `respond()` + follow-up / Alvai |

The dual axis (Siren = how dangerous; Rail = what workflow/money path) lives **inside
GOVERN** — it is the Arbiter's two questions made explicit. The v2 engine
`Signal → Siren → Rail → Route → Record → Return` is the finer-grain elaboration of
`HEAR → GOVERN → RETURN`, signed into the doctrine lane per AGENTS.md §6 ("newest
signed/dated document wins inside its own lane"). The crosswalk file
`_meta/doctrine/architecture_crosswalk_v1.md` remains valid; a v2 row-set addition
is REQUIRES THREESOME (architecture lane) and is staged, not assumed.

**Priority reconciliation:** AGENTS.md §4 (Lexapro deterministic demo, Natchitoches
Summit June 9–12) governs through the summit's close. The 71457 rural med-change
wedge inherits #1 priority when Bleu marks the summit priority CLOSED in AGENTS.md.
The Lexapro demo and the 71457 wedge are the same governed loop on different fixed
inputs; nothing in this packet weakens the demo path.

---

## 1. The one truth

**BLEU is a governed Open Window contact engine.**
It detects the vulnerable moment after a plan is made but before a human has carried
it out, classifies how dangerous it is, routes one safer next step, documents the
action, and returns until the window closes.

## 2. The engine (locked, v2 granularity)

```
Signal → Siren → Rail → Route → Record → Return
  (HEAR)  (────────── GOVERN ──────────)  (RETURN)
```

- **Signal** — what the human revealed (the catalyst moment)
- **Siren** — how dangerous: green (education) / amber (support–barrier) /
  red (urgent safety) / black (crisis → 988, fixed protocol, no improvisation)
- **Rail** — workflow/money path: care_transition (TCM) · ccm/apcm · bhi/cocm ·
  chi_pin · worksite · crisis (no commerce, ever)
- **Route** — next safest step: verified human, resource, or honest "no match"
- **Record** — the auditable proof; rationale written BEFORE the response ships
- **Return** — did it resolve? If not, the window stays open

## 3. The lane test (anti-sprawl filter)

A pathway is built only with **all five**: a vulnerable human moment · an accountable
institution · a repeatable workflow · a documentable action · a funding rail.

## 4. The wedge (ships first)

**Rural medication-change confusion after discharge.** Proof loop on ZIP 71457:
med-change signal → amber → care_transition → verified support within radius or
honest desert routing → catalyst_event recorded with write-ahead rationale →
"Did you reach someone, or do you still need help?"

## 5. The catalyst event (atomic object — schema REQUIRES THREESOME before creation)

One row per governed interaction; the safety record and the billing-support record
at once. Fields: event_id, user_id/partner_id, window_type, catalyst_type,
siren_level, workflow_rail, trust_packet_id/route_id, **rationale NOT NULL**
(the write-ahead ledger rule), staff_action_required/human_owner,
billing_support_category, consent_status, phi_zone, commerce_allowed/media_allowed
(false in red/black), follow_up_due_at/status/outcome, system_version.

## 6. Money model

BLEU **enables** institutions; it never bills Medicare. Rails (verify exact PFS
rates with Dr. Stoler before any external number): CCM 99490 · APCM G0556–G0558 ·
TCM · BHI/CoCM 99484 · CHI/PIN (incl. peer-support PIN-PS) · RPM/RTM.
Capital (SBIR, state innovation) funds the build; revenue is PMPM/setup/per-episode
software fees. Affiliate commerce is a minor side stream, never the lead.
Buyer ladder: rural hospital → FQHC/RHC → Medicaid MCO/ACO → city/civic.

## 7. The moat

The gates that stop BLEU from causing harm are the same gates that produce the
billing documentation, the staff triage, and the payer reporting. The buyer's
question BLEU answers: **"Who needs the human call today?"**

## 8. One product, two faces · public positioning (locked)

Internal: the Open Window engine. External: **BLEU Bridge — After the Handoff**.
Public sentence: *"BLEU helps rural hospitals, FQHCs, employers, cities, and
communities identify the person who needs the human call today — then route one
safer next step, document the reason, and return until the window closes."*
Content taxonomy: ACLM six pillars (prevention/Learn layer) × lifecycle transitions
(the windows). SEO law: trust before conversion; author/reviewer/date/source on
clinical pages; local pages only where verified resource density exists; commerce
suppressed wherever safety risk appears. Clinical content: Dr. Stoler's lane.

## 9. The six non-negotiables (carried verbatim)

1. Care-first, commerce-last; commerce suppressed in red/black.
2. No fabricated providers — empty = "no verified match" + widen/route.
3. Write-ahead ledger — no governed response without committed rationale.
4. Crisis → 988, fixed protocol; any safety-language change = Dr. Stoler written sign-off.
5. No claim without a verifiable source; the retired stat bar stays retired.
6. BLEU is an enabler, not a biller.

## 10. Ground truth (verified June 10–11, 2026 — do not re-litigate)

Crisis false-positive fixed (4d5805e, signed off). Keys rotated (c3d4e00,
bleuservice61026). zip_centroids loaded: 41,488 zips / 53 states; 714xx real.
practitioners 485,476 rows, zip present, lat/lng ALL NULL (geocoding = later data
job; match by zip set). Directory is string-match (the gap the wedge closes).
Engine tier currently gpt-4o/gpt-4o-mini via pickModel — tier decision is a human
call, out of build scope. 15 suites + prompt_compliance green.

## 11. Discipline statement

The convergence is saturated. BLEU becomes valuable when one window works so
clearly that every other window becomes obvious. Narrow to land. Wide to win —
but land first.

> Serve the Quarter. Earn the door. Bring it home.
> Finish, don't build. The moat is refusal. The voice is the product.
