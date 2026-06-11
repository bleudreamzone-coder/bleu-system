# BLEU-PATHWAY-OPPORTUNITY-LEDGER
## §9.8 — One row per opportunity · Most ideas bank; one or two build
### June 11, 2026 · Decision statuses: banked / research / pilot / build / kill

Scoring: a pathway advances only with all five lane-test conditions AND a named
outcome metric. The master equation: (pain × accountable buyer × repeatability ×
documentation need × rail × distribution × measurability × trust) ÷ (complexity ×
safety risk × compliance burden × operational friction).

| pathway_id | window | siren | rail | institution | funding rail | proof metric | status |
|---|---|---|---|---|---|---|---|
| PW-01 | rural med-change post-discharge | amber | care_transition | rural hospital / FQHC | TCM·APCM·HRRP | 71457 closed loop; D+2 reply | **build** |
| PW-02 | behavioral-health discharge / post-crisis | red→black | bhi | CMHC / 988 | BHI·CoCM·PIN | contact made; escalation handled | banked→next |
| PW-03 | addiction recovery + reentry | amber→red | bhi/chi_pin | treatment ctrs / corrections | PIN-PS·Reentry §1115·SAMHSA | MAT continuity; appt kept | banked·high |
| PW-04 | postpartum / maternal | amber→red | care_transition/bhi | Medicaid MCO / OB / FQHC | 12-mo postpartum Medicaid | D+7 check; warning-sign escalation | banked·high |
| PW-05 | chronic drift CHF/COPD/DM | green→amber | ccm | primary care / ACO | CCM·APCM·RPM/RTM·PIN | monthly touch completion | banked·recurring |
| PW-06 | new-diagnosis onboarding | green→amber | ccm | primary care | CCM·APCM·PIN | first-30-day plan adherence | banked |
| PW-07 | ED discharge no follow-up | amber | care_transition | ED / health system | TCM-adj·CHI | avoidable-return reduction | banked |
| PW-08 | pre-surgical prehab | amber | care_transition | surgical center | cancellation avoidance | day-of cancellation rate | banked |
| PW-09 | SNF/rehab → home | amber | care_transition | SNF / home health | TCM·RPM | fall/readmit window closure | banked |
| PW-10 | caregiver activation | green→amber | chi_pin | health system / AAA / employer | CHI·grants | caregiver activation rate | banked |
| PW-11 | worksite open-window support | green→amber | worksite | employer (Monteleone anchor) | employer spend·workers' comp | support engagement; RTW completion | banked |
| PW-12 | city care-desert intelligence | n/a (civic) | chi_pin | city / parish / public health | civic budgets·grants | no-match rate; desert map adoption | banked |

Full row schema for new entries: pathway_id, window_type, catalyst_trigger,
human_pain, default_siren_level, workflow_rail, accountable_institution, buyer_type,
funding_or_value_rail, distribution_surface, route_assets_needed,
verified_resource_requirement, consent_requirement, phi_zone, commerce_allowed,
staff_action_required, human_owner, outcome_metric, proof_metric, pilot_location,
MVP_scope, data_needed, risk_level, complexity_score, revenue_model,
expansion_score, decision_status.

**Rule:** new ideas enter as `banked` by default. Promotion to `pilot` requires the
lane test + a named accountable buyer + a proof metric. Promotion to `build`
requires the prior build's closed-loop proof. `kill` is honorable.
