# BLEU-SOURCE-LEDGER
## Every external claim → its verifiable source
### June 11, 2026 · Law 5 / non-negotiable #5: no claim ships without a source

| Claim used in BLEU docs | Source | Verified |
|---|---|---|
| APCM codes G0556/G0557/G0558 exist; monthly, time-free, complexity-tiered; began Jan 1, 2025 | CMS CY2025 Physician Fee Schedule final rule; cms.gov APCM services page | Jun 2026 |
| APCM 2025 national averages ≈ $15.20 / $48.84 / $107.07 (locality varies) | AAFP APCM guidance; CMS PFS | Jun 2026 — re-verify per locality before quoting |
| FQHCs/RHCs can bill APCM and individual care-management codes (G0511 unbundling era) | NARHC CY26 summaries; RHIhub APCM care-management page | Jun 2026 |
| PIN services reimbursable since Jan 1, 2024; deliverable by auxiliary personnel or peer support specialists; eligible conditions include severe mental illness and SUD | CMS PFS CY2024; RHIhub Principal Illness Navigation page | Jun 2026 |
| Medicaid Reentry §1115: 19 state waivers approved; pre-release services up to 90 days incl. MAT + case management | KFF 1115 waiver tracker; CSG Justice Center | Jun 2026 |
| Medicaid suspension-not-termination for incarcerated individuals effective Jan 1, 2026 | Consolidated Appropriations Act 2024; KFF Waiver Watch | Jun 2026 |
| 12-month postpartum Medicaid: 48 states + DC adopted (Arkansas last holdout; Wisconsin passed 2026); Louisiana included | KFF postpartum tracker; Georgetown CCF; CMS press releases | Jun 2026 |
| ~1/3 of maternal deaths occur 1 week–1 year postpartum; Medicaid finances ~42% of US births | Georgetown CCF / CMS | Jun 2026 |
| Rural access barriers: workforce shortages, transportation, health literacy, cost, distance | Rural Health Information Hub, healthcare-access topic | Jun 2026 |
| Discharge/transitions are a patient-safety improvement area (readmission reduction) | AHRQ improve-discharge resources | Jun 2026 |
| Lifestyle medicine six pillars: nutrition, physical activity, restorative sleep, stress management, connectedness, risky-substance avoidance | American College of Lifestyle Medicine | Jun 2026 |
| Helpful-content / doorway-page / structured-data rules governing city pages | Google Search Essentials; Search Central documentation | Jun 2026 |
| Medical-adjacent app scrutiny; consent/privacy/push rules | Apple App Review Guidelines | Jun 2026 |

## Internal ground-truth ledger (repo/DB evidence)
| Fact | Evidence |
|---|---|
| Crisis narrowed patterns live | core/safety/canonical_crisis_patterns.js; commit 4d5805e; crisis_validator PASS |
| Keys env-based; state doc removed | tank-filler.py os.environ reads; commit c3d4e00 |
| zip_centroids 41,488 / 53 states | workflow run "Load ZIP Centroids #1" SUCCESS; REST probes 70130 / 714xx |
| practitioners 485,476; lat NULL | live DB diagnostic Jun 10 |
| Directory string-match | server.js ~1620 / ~1719 / ~2676 |
| Engine = gpt-4o via pickModel | server.js ~1730 |

## Retired claims (permanently — never reintroduce)
68% absenteeism reduction · 5.6× ROI · 89% satisfaction · "10 million patients"
(forbidden everywhere per felicia_standards_v1) · iHerb LYZ6523 (dead channel) ·
"Dr. Felicia Ranked" credential-as-endorsement patterns.
