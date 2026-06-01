# Core Schemas

This directory stores production-ready JSON Schemas for BLEU's future four-function runtime (`decompose`, `decide`, `record`, `respond`). The files are shadow-mode artifacts: they are not wired into `server.js`, `/api/chat`, route handlers, Supabase migrations, or any production path yet.

Schemas in this directory are reserved for the future Agents SDK migration and related mechanical implementation work described by the Total System Blueprint.

## Schema inventory

| Schema | Purpose | Status | Authorization |
|---|---|---|---|
| `signal_object_v1.1.schema.json` | Validates the Prism/`decompose()` Signal Object: primary intent, Six Bands, probabilistic variant blend, risk flags, evidence need, Three Voices, and Six Pressures. | Shadow mode | Total System Blueprint Sections 5 and 6; Source Document v1 Three Voices and sacred line; ICP Prism Doctrine Six Bands and variant system; Pressure Architecture v1 Six Pressures. |

## Scope boundary

These schemas define validator form only. They do not activate clinical claims, alter chat behavior, change commerce routing, or bypass future Captain Soul-Gate / Dr. Felicia review gates before runtime wiring.
