# Clinical Sign-Off — Serious-Illness Ledger and Soft-Safety Question Activation

**Reviewer:** Dr. Felicia Stoler, DCN, MS, RDN, FACSM, FAND, Dipl. ACLM
**Role:** Chief Clinical Officer, BLEU.live
**Date:** 2026-06-14

**Scope of this sign-off:** Authorization to activate two clinical surfaces on
BLEU.live:

1. Serious-illness ledger routing (`SERIOUS_ILLNESS_LEDGER_ENABLED`, PR #83).
2. Soft-safety question rendering (`SOFT_SAFETY_QUESTION_ENABLED`, PR #85).

## Serious-Illness Ledger Routing

On the amber serious-illness path, the system writes a write-ahead
`catalyst_event`, suppresses commerce, and flags a human for follow-up.

**Determination:** APPROVED as-is.

## Soft-Safety Question

On the amber path, a gentle safety line renders before support content.

**Determination:** APPROVED with the finalized wording below, which replaces the
placeholder.

**Finalized soft-safety wording:**

> "Before we keep going: if any of this ever feels like too much, you're not
> alone, and there are people who can help. For now — how are you holding up?"

## Governing Condition

The crisis (red / 988) takeover behavior is unchanged by these activations and
remains the governing safety layer above both surfaces. Active intent routes to
the crisis takeover regardless of context. These two activations operate only
on the amber path, beneath it.

This wording and these behaviors are locked clinical surfaces. No change to
either ships without a further written sign-off from the clinical authority
named above.

**Signed:** Dr. Felicia Stoler, 2026-06-14
