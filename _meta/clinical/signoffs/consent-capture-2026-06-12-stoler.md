# Clinical Sign-Off — Consent Capture + Subject Spine (incl. Consent Copy)

**Artifact reviewed:** Consent capture mechanism — `POST /api/consent/grant`,
`POST /api/consent/revoke`, `consent_subject` table and subject spine linkage.
PR #76 (merge `56905c8`), schema patch applied 2026-06-12, metrics integration
PR #77 (merge `a88573e`).

**Reviewer:** Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM
**Role:** Chief Clinical Officer, BLEU.live
**Date:** 2026-06-12

**Scope of this sign-off:**
1. The five-scope consent model: routing, follow-up, loop-status recording,
   privacy-protected longitudinal linkage, and aggregate reporting.
2. The patient-facing consent copy, approved as written below:

> BLEU can help you find one safe next step and check back later.
> If you say yes:
> — We may text you to see if you got help.
> — We keep track of how this request went.
> — We connect your future BLEU visits using a code, not your name.
> — We use overall numbers, never your story, to show where help is missing.
> You can reply STOP any time and we will stop.
> BLEU is not emergency care and does not give medical advice. If this is an
> emergency, or you might hurt yourself or someone else, call 911 now.
> Do not stop, start, or change medicine because of BLEU.

3. No-consent behavior: no non-emergency follow-up; the event remains gated;
   emergency guidance is never withheld.
4. Revocation: STOP always works; revocation closes follow-up on open events.
5. Longitudinal linkage by privacy-protected identifier ("a code, not your
   name") is approved as consent for outcome measurement over time.

**Determination:** Reviewed and APPROVED for production activation
(`CONSENT_CAPTURE_ENABLED=true`).

**Signed:** Dr. Felicia Stoler, 2026-06-12
