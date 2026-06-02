# Core Schemas

This directory stores production-ready JSON Schemas for BLEU's future four-function runtime (`decompose`, `decide`, `record`, `respond`). The files are shadow-mode artifacts: they are not wired into `server.js`, `/api/chat`, route handlers, Supabase migrations, or any production path yet.

Schemas in this directory are reserved for the future Agents SDK migration and related mechanical implementation work described by the Total System Blueprint.

## Schema inventory

| Schema | Purpose | Status | Authorization |
|---|---|---|---|
| `signal_object_v1.1.schema.json` | Validates the Prism/`decompose()` Signal Object: primary intent, Six Bands, probabilistic variant blend, risk flags, evidence need, Three Voices, and Six Pressures. | Shadow mode | Total System Blueprint Sections 5 and 6; Source Document v1 Three Voices and sacred line; ICP Prism Doctrine Six Bands and variant system; Pressure Architecture v1 Six Pressures. |
| `decision_object_v1.1.schema.json` | Validates the future `decide()` Decision Object: Seven Gates in fixed order, all 20 Refusals in fixed slots, LRAS components, response allowance, commerce permission, outcome schedule, Decision Matrix authority, and arbiter priority. | Shadow mode | Total System Blueprint Section 6; Coca-Cola Recipe v1 Seven Gates and LRAS; Refusal Doctrine v1; Decision Matrix Tier 1/2/3 authority. |
| `trust_packet_v1.1.schema.json` | Validates the future `record()` Trust Packet proof unit: response hash/model/count, mandatory Counterfactual, day-3/day-7/day-30 outcome plan, doctrine audit refs, refusal/pressure audit trail, and TD-010 privacy flags. Counterfactual is mandatory by top-level schema `required` constraint, not by convention. | Shadow mode | Total System Blueprint Section 7 Trust Packet mandate; THE BLEU BIBLE Counterfactual mandate, Wrong Answer Library, and Restraint Score; Lens Architecture Doctrine Memory Machine and TD-010 privacy infrastructure. |

## Scope boundary

These schemas define validator form only. They do not activate clinical claims, alter chat behavior, change commerce routing, or bypass future Captain Soul-Gate / Dr. Felicia review gates before runtime wiring.
