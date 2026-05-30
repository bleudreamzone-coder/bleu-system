# Codex Total System Blueprint v1 — bleu.live — 2026-05-29

**Status:** Audit-only institutional blueprint. No production code, database schema, service configuration, or runtime behavior is changed by this document.

## Revision Log

- **v1.0 initial generation — 2026-05-29:** Total system blueprint filed for Captain Soul-Gate and Dr. Felicia clinical review.
- **v1.0 revision — 2026-05-29:** Schema integrity fixes for Decision Object gates (one-per-named-gate enforcement) and `refusal_checks` (item completeness + uniqueness) after automated review, before Captain Soul-Gate merge.

**Verification basis:** Repository inspection on 2026-05-29, prior audit files, doctrine files, clinical signoff files, Supabase migration inventory, and application surface inventory. Items not directly executed from this document are marked as review requirements, not claims of live verification.

---

## SECTION 1 — SYSTEM INTENT

| # | Surface | Blueprint obligation | Proof artifact |
|---|---|---|---|
| 1 | Public user journey | Convert anxious, sleep, gut, and longevity intent into safe protocol entry | Landing pages + chat routes |
| 2 | Clinical safety | Keep crisis, medication, contraindication, and scope boundaries ahead of commerce | Refusal doctrine + Decision Object |
| 3 | Commerce | Sell only inside safety-approved protocol and partner rails | Stripe + catalog audit rows |
| 4 | Follow-up | Close the loop with day-7 outcome capture and reorder timing | SMS/email templates + comms tables |

## SECTION 2 — AUTHORITIES

| # | Authority | Role | Required gate |
|---|---|---|---|
| 1 | Captain Soul-Gate | Product, doctrine, merge authority | Explicit merge approval |
| 2 | Dr. Felicia | Clinical review and supplement safety | Clinical signoff for content claims |
| 3 | Repository audit trail | Institutional memory | Markdown audit documents |
| 4 | Automated review | Schema and implementation defect detection | Bot comments resolved before merge |

## SECTION 3 — INFRASTRUCTURE BOUNDARY

| # | Component | Boundary | Notes |
|---|---|---|---|
| 1 | Render web service | Application runtime | Requires env inventory review |
| 2 | Render cron jobs | Scheduled messaging | Requires bearer secret review |
| 3 | Supabase | Data and audit persistence | Requires RLS/grant review |
| 4 | Cloudflare/DNS | Public routing | Requires dashboard confirmation |

## SECTION 4 — DATA BOUNDARY

| # | Data class | Storage expectation | Safety concern |
|---|---|---|---|
| 1 | Citizen identifiers | Service-mediated tables | PII minimization |
| 2 | Session and magic-link tokens | Expiring auth tables | Token replay prevention |
| 3 | Decision Objects | Audit ledger | Complete proof unit |
| 4 | Commerce events | Idempotent order ledger | No duplicate activation |

## SECTION 5 — DOCTRINE BOUNDARY

| # | Doctrine | Enforced by | Review trigger |
|---|---|---|---|
| 1 | Refusal doctrine | Decision Object `refusal_checks` | Any guidance generation |
| 2 | Source doctrine | Evidence gate | Any claim with health implication |
| 3 | Pressure doctrine | Commerce gate | Any CTA or purchase path |
| 4 | Voice integrity | Claim boundary gate | Any rewritten copy |

## SECTION 6 — DECISION OBJECT V1.1 JSON SCHEMA

The Decision Object is the institutional proof unit. A valid object must show that every named gate was evaluated exactly once and every refusal was evaluated exactly once with a concrete status and action.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://bleu.live/schemas/decision-object-v1.1.json",
  "title": "Decision Object v1.1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "decision_id",
    "created_at",
    "surface",
    "input_summary",
    "gates",
    "refusal_checks",
    "final_action"
  ],
  "properties": {
    "decision_id": { "type": "string", "minLength": 1 },
    "created_at": { "type": "string", "format": "date-time" },
    "surface": { "type": "string", "minLength": 1 },
    "input_summary": { "type": "string", "minLength": 1 },
    "gates": {
      "type": "array",
      "minItems": 7,
      "maxItems": 7,
      "prefixItems": [
        { "$ref": "#/$defs/crisis_gate" },
        { "$ref": "#/$defs/medication_safety_gate" },
        { "$ref": "#/$defs/evidence_gate" },
        { "$ref": "#/$defs/claim_boundary_gate" },
        { "$ref": "#/$defs/clinical_review_gate" },
        { "$ref": "#/$defs/commerce_gate" },
        { "$ref": "#/$defs/outcome_gate" }
      ],
      "items": false
    },
    "refusal_checks": {
      "type": "array",
      "minItems": 20,
      "maxItems": 20,
      "prefixItems": [
        { "$ref": "#/$defs/refusal_1" },
        { "$ref": "#/$defs/refusal_2" },
        { "$ref": "#/$defs/refusal_3" },
        { "$ref": "#/$defs/refusal_4" },
        { "$ref": "#/$defs/refusal_5" },
        { "$ref": "#/$defs/refusal_6" },
        { "$ref": "#/$defs/refusal_7" },
        { "$ref": "#/$defs/refusal_8" },
        { "$ref": "#/$defs/refusal_9" },
        { "$ref": "#/$defs/refusal_10" },
        { "$ref": "#/$defs/refusal_11" },
        { "$ref": "#/$defs/refusal_12" },
        { "$ref": "#/$defs/refusal_13" },
        { "$ref": "#/$defs/refusal_14" },
        { "$ref": "#/$defs/refusal_15" },
        { "$ref": "#/$defs/refusal_16" },
        { "$ref": "#/$defs/refusal_17" },
        { "$ref": "#/$defs/refusal_18" },
        { "$ref": "#/$defs/refusal_19" },
        { "$ref": "#/$defs/refusal_20" }
      ],
      "items": false
    },
    "final_action": {
      "type": "string",
      "enum": ["allow", "block", "escalate", "revise", "defer"]
    }
  },
  "$defs": {
    "gate_base": {
      "type": "object",
      "additionalProperties": false,
      "required": ["gate", "status", "rationale"],
      "properties": {
        "gate": { "type": "string" },
        "status": { "type": "string", "enum": ["passed", "blocked", "needs_review"] },
        "rationale": { "type": "string", "minLength": 1 }
      }
    },
    "crisis_gate": { "allOf": [{ "$ref": "#/$defs/gate_base" }, { "properties": { "gate": { "const": "crisis" } } }] },
    "medication_safety_gate": { "allOf": [{ "$ref": "#/$defs/gate_base" }, { "properties": { "gate": { "const": "medication_safety" } } }] },
    "evidence_gate": { "allOf": [{ "$ref": "#/$defs/gate_base" }, { "properties": { "gate": { "const": "evidence" } } }] },
    "claim_boundary_gate": { "allOf": [{ "$ref": "#/$defs/gate_base" }, { "properties": { "gate": { "const": "claim_boundary" } } }] },
    "clinical_review_gate": { "allOf": [{ "$ref": "#/$defs/gate_base" }, { "properties": { "gate": { "const": "clinical_review" } } }] },
    "commerce_gate": { "allOf": [{ "$ref": "#/$defs/gate_base" }, { "properties": { "gate": { "const": "commerce" } } }] },
    "outcome_gate": { "allOf": [{ "$ref": "#/$defs/gate_base" }, { "properties": { "gate": { "const": "outcome" } } }] },
    "refusal_base": {
      "type": "object",
      "additionalProperties": false,
      "required": ["refusal_number", "status", "action"],
      "properties": {
        "refusal_number": { "type": "integer", "minimum": 1, "maximum": 20 },
        "status": { "type": "string", "enum": ["passed", "triggered", "not_applicable"] },
        "action": { "type": "string", "minLength": 1 }
      }
    },
    "refusal_1": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 1 } } }] },
    "refusal_2": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 2 } } }] },
    "refusal_3": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 3 } } }] },
    "refusal_4": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 4 } } }] },
    "refusal_5": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 5 } } }] },
    "refusal_6": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 6 } } }] },
    "refusal_7": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 7 } } }] },
    "refusal_8": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 8 } } }] },
    "refusal_9": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 9 } } }] },
    "refusal_10": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 10 } } }] },
    "refusal_11": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 11 } } }] },
    "refusal_12": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 12 } } }] },
    "refusal_13": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 13 } } }] },
    "refusal_14": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 14 } } }] },
    "refusal_15": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 15 } } }] },
    "refusal_16": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 16 } } }] },
    "refusal_17": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 17 } } }] },
    "refusal_18": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 18 } } }] },
    "refusal_19": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 19 } } }] },
    "refusal_20": { "allOf": [{ "$ref": "#/$defs/refusal_base" }, { "properties": { "refusal_number": { "const": 20 } } }] }
  }
}
```

**Schema-integrity assertions:** the schema rejects seven repeated `outcome` gates, rejects a missing `commerce` gate, rejects twenty empty `refusal_checks` objects, and rejects a duplicate `refusal_number` with a missing required refusal number because fixed-position `prefixItems` require the named gate and refusal number at each slot.

## SECTION 7 — CRISIS SAFETY

| # | Requirement | Enforcement point | Escalation |
|---|---|---|---|
| 1 | Detect self-harm or emergency language | Crisis gate | Block guidance and present emergency resources |
| 2 | Avoid diagnosis during crisis | Claim boundary gate | Escalate to human/emergency support |
| 3 | Record crisis decision | Decision Object | Audit trail required |
| 4 | Keep commerce absent in crisis | Commerce gate | No checkout or upsell |

## SECTION 8 — MEDICATION SAFETY

| # | Risk | Required behavior | Evidence |
|---|---|---|---|
| 1 | CYP450 interactions | Require safety review | CYP450 wiring audit |
| 2 | Contraindicated supplements | Defer to clinician | Clinical signoff |
| 3 | Pregnancy/lactation | Avoid generic supplement claims | Claim boundary |
| 4 | Polypharmacy | Escalate before protocol | Medication gate |

## SECTION 9 — EVIDENCE RULES

| # | Claim type | Minimum support | Boundary |
|---|---|---|---|
| 1 | Educational content | Source-backed general wellness | No treatment promise |
| 2 | Protocol recommendation | Reviewable rationale | No diagnosis |
| 3 | Product listing | Ingredient and safety context | No cure claim |
| 4 | Outcome copy | User-reported framing | No inflated efficacy |

## SECTION 10 — CLAIM BOUNDARY

| # | Copy surface | Allowed | Disallowed |
|---|---|---|---|
| 1 | Landing pages | Wellness education | Disease cure claims |
| 2 | Chat | Informational guidance | Medical diagnosis |
| 3 | Email/SMS | Operational reminders | Pressure tactics |
| 4 | Checkout | Transparent purchase facts | Safety override by revenue |

## SECTION 11 — CLINICAL REVIEW

| # | Artifact | Reviewer | Status rule |
|---|---|---|---|
| 1 | Crisis patterns | Dr. Felicia | Signoff before promotion |
| 2 | Rail B supplement content | Dr. Felicia | Signoff before scale |
| 3 | Protocol variants | Dr. Felicia + Captain | Review before public claim |
| 4 | Outcome interpretation | Clinical reviewer | Conservative language only |

## SECTION 12 — COMMERCE RAILS

| # | Rail | Guardrail | Audit record |
|---|---|---|---|
| 1 | Stripe checkout | Idempotency + kill switch | Processed event row |
| 2 | Fullscript/Amazon | Partner disclosure | Catalog provenance |
| 3 | Reorder reminders | Consent + STOP language | Comms ledger |
| 4 | Upsell moments | Safety-first suppression | Decision Object commerce gate |

## SECTION 13 — OUTCOME LOOP

| # | Moment | Data captured | Purpose |
|---|---|---|---|
| 1 | Day 0 | Protocol activation | Baseline audit |
| 2 | Day 7 | User-reported outcome | Close loop |
| 3 | Reorder window | Continuity signal | Prevent silent drop-off |
| 4 | Adverse signal | Safety escalation | Human review |

## SECTION 14 — AUTHENTICATION

| # | Flow | Requirement | Risk |
|---|---|---|---|
| 1 | Magic link request | No user enumeration | Privacy leak |
| 2 | Token verify | Atomic consume | Replay |
| 3 | Session cookie | Secure secret | Forgery |
| 4 | Citizen reconciliation | Consistent identity | Duplicate records |

## SECTION 15 — MESSAGING

| # | Channel | Template | Constraint |
|---|---|---|---|
| 1 | Email | Magic link | No enumeration |
| 2 | Email | Order confirmation | Accurate purchase context |
| 3 | SMS | Day-7 outcome | STOP language |
| 4 | SMS | Reorder reminder | Consent and opt-out |

## SECTION 16 — DATABASE GOVERNANCE

| # | Check | Target | Pass condition |
|---|---|---|---|
| 1 | RLS | Sensitive tables | Enabled or service-only |
| 2 | Grants | anon/auth roles | No unintended read/write |
| 3 | Audit tables | Append-only intent | Complete event rows |
| 4 | Migrations | Supabase files | Ordered and reviewed |

## SECTION 17 — OBSERVABILITY

| # | Signal | Source | Action |
|---|---|---|---|
| 1 | Health checks | `/health` and `/api/ping` | Deployment verification |
| 2 | Checkout errors | Stripe webhook logs | Retry/diagnose |
| 3 | Messaging errors | Twilio/Resend responses | Credential/config review |
| 4 | Safety triggers | Decision Object rows | Clinical review |

## SECTION 18 — SECURITY

| # | Threat | Control | Review cadence |
|---|---|---|---|
| 1 | Secret exposure | Rotate and redeploy | Immediate on exposure |
| 2 | Webhook spoofing | Signature verification | Every webhook change |
| 3 | Cron abuse | Bearer secret | Every cron edit |
| 4 | PII leakage | Hash/minimize | Every data-path review |

## SECTION 19 — RELEASE DISCIPLINE

| # | Stage | Gate | Required artifact |
|---|---|---|---|
| 1 | Audit | Document current reality | Filed audit |
| 2 | Plan | Captain review | Soul-Gate decision |
| 3 | Build | Bounded PR | Diff + tests |
| 4 | Merge | Clean known defects | PR notes |

## SECTION 20 — KNOWN RISKS

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | Missing environment variable | Feature disabled | Dashboard verification |
| 2 | Incomplete clinical signoff | Unsafe claim drift | Hold promotion |
| 3 | Identity fragmentation | Follow-up misses | Citizen reconciliation |
| 4 | Schema looseness | False audit proof | Decision Object v1.1 constraints |

## SECTION 21 — NEXT 72 HOURS

| # | Priority | Owner | Definition of done |
|---|---|---|---|
| 1 | Confirm secrets | Captain/ops | Render env checklist complete |
| 2 | Clinical review agenda | Dr. Felicia | Signoff scope written |
| 3 | RLS/grant review | Engineering | Sensitive tables closed |
| 4 | Decision Object fixture | Engineering | Valid + invalid schema cases pass |

## SECTION 22 — NEXT 30 DAYS

| # | Workstream | Outcome | Dependency |
|---|---|---|---|
| 1 | Safety engine | Runtime Decision Object logging | Schema fixtures |
| 2 | Commerce engine | Safer checkout activation | Kill-switch audit |
| 3 | Messaging engine | Outcome loop reliability | Twilio credentials |
| 4 | Clinical library | Reviewed content variants | Dr. Felicia signoff |

## SECTION 23 — ACCEPTANCE CHECKLIST

| # | Acceptance item | Required status | Evidence |
|---|---|---|---|
| 1 | 24 sections present | Pass | Structural grep |
| 2 | Table inventory broad enough | Pass | Row grep count |
| 3 | Gate uniqueness fixed | Pass | `prefixItems` + `const` gates |
| 4 | Refusal completeness fixed | Pass | required fields + fixed refusal numbers |

## SECTION 24 — CAPTAIN SOUL-GATE SUMMARY

| # | Decision | Recommendation | Reason |
|---|---|---|---|
| 1 | Merge blueprint | Yes after review | Schema holes fixed inline |
| 2 | Ship production changes | No | Audit-only document |
| 3 | Clinical promotion | Hold for Dr. Felicia | Separate signoff required |
| 4 | Future schema work | Add executable fixtures | Preserve institutional proof |

---

*Filed by Codex on 2026-05-29 as an audit-only institutional blueprint. The v1.0 revision fixes the two schema integrity holes before merge: one-per-named-gate enforcement and refusal check completeness plus uniqueness.*
