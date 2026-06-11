# BLEU-OPEN-WINDOW-PATHWAYS
## Source of truth · The window family — one engine, many triggers
### Signed: Bleu · June 11, 2026 · Banked optionality except #1 · Lane test gates every build

Status legend: SHIPS (the wedge) · ADJACENT (same loop, near-term) · BANKED
(platform / SBIR future directions — not build scope).

| # | Window | Default siren | Rail | Accountable institution | Funding rail (verified Jun 2026) | Status |
|---|---|---|---|---|---|---|
| 1 | Rural medication-change after discharge | Amber (esc. red/black) | care_transition | Rural hospital → FQHC/RHC | TCM; APCM G0557; readmission avoidance (HRRP) | **SHIPS** |
| 2 | Behavioral-health discharge / post-crisis | Red→Black | bhi | CMHC, 988 system, integrated primary care | BHI/CoCM 99484; PIN (severe mental illness, Medicare since Jan 2024) | ADJACENT |
| 3 | Addiction recovery + reentry | Amber→Red | bhi / chi_pin | Treatment centers, sober living, corrections reentry | PIN-PS peer support (SUD); Medicaid Reentry §1115 (19 states, ≤90-day pre-release incl. MAT); suspension-not-termination since Jan 2026; SAMHSA | BANKED·HIGH |
| 4 | Postpartum / maternal | Amber→Red | care_transition / bhi / chi_pin | Medicaid MCO, OB, FQHC, perinatal programs | 12-month postpartum Medicaid (48 states + DC incl. Louisiana) | BANKED·HIGH |
| 5 | Chronic check-ins (CHF/COPD/diabetes) | Green→Amber | ccm | Primary care, FQHC/RHC, ACO | CCM 99490; APCM G0556–58; RPM/RTM; PIN | BANKED·RECURRING |
| 6 | New-diagnosis onboarding | Green→Amber | ccm | Primary care / FQHC | CCM/APCM/PIN | BANKED |
| 7 | ED discharge, no follow-up | Amber | care_transition / chi_pin | ED / health system | TCM-adjacent; CHI; avoidable-return reduction | BANKED |
| 8 | Pre-surgical / prehab | Amber | care_transition | Surgical center, pre-op clinic | cancellation/complication avoidance; bundles | BANKED |
| 9 | Post-rehab / SNF → home | Amber | care_transition | SNF, home health, PT network | TCM; RPM/RTM; readmission avoidance | BANKED |
| 10 | Caregiver activation | Green→Amber | chi_pin | Health system, Area Agencies on Aging, employer | CHI; caregiver grants; RPM on patient | BANKED |

## Beyond healthcare (same lane test applies)
Worksite wellness (employer rail; Monteleone anchor) · justice/reentry · veterans
transition · aging-in-place · disaster readiness / Ready City · student wellbeing ·
foster/child-welfare transitions · workers' comp return-to-work.

## Expansion sequence (locked order)
1 wedge → 2 behavioral-health discharge → 3 addiction+reentry (founder-moat:
PIN-PS makes lived-experience peer navigation a billable role) → 4 postpartum →
5 chronic drift (recurring revenue). Each advance requires the prior window's
closed-loop proof and the lane test's five conditions.

## The SMS spine (shared by every window)
The person in the open window does not open a web app; they get a text. The Return
step IS an SMS. One spine — outbound scheduler off follow_up_due_at, inbound webhook
closing/reopening events — configured per window. Consent-gated absolutely;
crisis replies route to the existing 988 protocol; no PHI in bodies.
Proof-of-life metric: the D+28 reply.
