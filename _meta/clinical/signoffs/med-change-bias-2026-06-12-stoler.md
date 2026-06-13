# Clinical Sign-Off — Medication-Change Routing Bias v0

**Artifact reviewed:** Med-change routing bias — PR #78 (merge `1ea3c25`).
When `catalyst_type='medication_change'`, route candidates are reordered
pharmacist first, clinic/primary care second, existing order after. Crisis
routing and honest-desert fallback verified unchanged. Every biased route
writes `med_change_bias=pharmacist_first` into the ledger rationale for audit.

**Reviewer:** Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM
**Role:** Chief Clinical Officer, BLEU.live
**Date:** 2026-06-12

**Scope of this sign-off:** The clinical routing logic and ordering
(pharmacist → clinic/primary care → existing order) for post-discharge
medication-change events; the auditable rationale marker.

**Determination:** Reviewed and APPROVED for production activation
(`MED_CHANGE_BIAS_ENABLED=true`).

**Signed:** Dr. Felicia Stoler, 2026-06-12
