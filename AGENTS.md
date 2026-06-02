# AGENTS.md — Codex Operating Charter for bleu-system

Read this before every task. This file controls how Codex operates inside the bleu-system repository.

**The repository is currently in proof mode, not expansion mode.** The job is to preserve the live path, demonstrate governed behavior, and produce observable runtime evidence. Do not improve, expand, refactor, activate, or re-architect the system unless the current approved task cannot work without that change.

---

## 1. Canonical loop

bleu-system runs one governed loop:

```
HEAR → GOVERN → RETURN
decompose() → decide() → record() → respond()
Prism → Arbiter → Ledger → Alvai (+ Return follow-up)
```

One architecture, two vocabularies — doctrine names (Prism → Arbiter → Ledger → Alvai) and code names (decompose → decide → record → respond). The mapping lives in `_meta/doctrine/architecture_crosswalk_v1.md`. Do not invent a second loop, architecture, agent hierarchy, or naming system.

---

## 2. Live vs dormant status

**LIVE — the only production request path:** `server.js`, `/api/chat`, `/api/chat/stream`. Currently includes crisis detection, commerce gating, memory writes, Stripe flow, the observe-only Trust Packet v0 bridge, and runtime response behavior.

**DORMANT / SCAFFOLD — built but NOT wired into live:** `core/agents/*` and `core/schemas/*` — shadow runner/wiring, model router, SDK adapter, Trust Packet factory/logger, memory interface, tool registry, counterfactual capture, outcome checkpoints.

**Binding rule:** Do not import, activate, connect, or wire dormant modules into the live request path without explicit Threesome approval (Bleu + Dr. Felicia + Codex). Source of truth: `_meta/audits/2026-06-01-comprehensive-system-diagnostic.md`. If status is unclear, mark UNVERIFIED and do not wire.

---

## 3. Operating laws

**Law 1 — No new layers.** Do not add new schemas, agents, abstractions, folders, registries, routers, protocols, or architecture unless all three are true: (1) the current approved task cannot work without it, (2) the change is directly connected to the live proof requirement, (3) explicit approval has been granted when the change touches architecture, schema, clinical safety, or live-path wiring.

**Law 2 — The live path is protected.** Do not refactor, rename, split, replace, or "clean up" the live request path unless the current task specifically requires it. When touching the live path, report: files changed, lines changed, behavior before, behavior after, how it was tested, what remains unverified.

**Law 3 — Trust Packet v0 is observe-only.** No DB write; no raw user message; no PII; no medication details beyond an approved redacted demo-safe structure; no hidden clinical claims; no change from observe-only to persistent storage without approval. Any Trust Packet modification must preserve redaction, non-PII behavior, and clinical safety boundaries.

**Law 4 — Clinical content is gated.** Any clinical claim, credential statement, evidence framing, public-facing health copy, demo language, or professional standard must conform to `_meta/doctrine/felicia_standards_v1.md` (SIGNED, binding). Codex does not author clinical or professional standards. The four locks bind: (1) no unverified figures — the "10 million patients" figure is forbidden everywhere; (2) lineage is personal narrative only, never a credential or public credibility claim; (3) credential framing must be honest and verifiable; (4) forbidden vocabulary and claim boundaries respected. If clinical content is needed, create a placeholder marked REQUIRES DR. STOLER SIGNOFF.

**Law 5 — Verify, do not assume.** Never invent repository state. Cite exact file paths and line numbers. Use labels honestly: VERIFIED / PARTIALLY VERIFIED / UNVERIFIED / BLOCKED / REQUIRES HUMAN SIGNOFF. A claim without file evidence is not a fact.

**Law 6 — The meter is runtime proof.** Progress is not commits, PR count, new agents/schemas/docs, or abstraction. Progress is a verified live behavior, a reproducible demo path, a visible Trust Packet, a controlled governed response, a real Citizen action, a logged proof artifact. A merged scaffold PR is not progress unless it produces verified runtime behavior.

---

## 4. Current priority

**Natchitoches Rural Health Transformation Summit demo — June 9–12, 2026.**

The number-one engineering task this week is a reliable, controlled, stage-ready counterfactual demo path for the **Lexapro calibrate** scenario, returning the real governed output shape: **Signal → Decision → Governed Response → Trust Packet.**

The demo must NOT depend on: signup, Resend, a live model call, live account creation, external email delivery, random model improvisation, or unapproved clinical language.

The demo must be **deterministic**: same input, same governed output, same decision structure, same Trust Packet shape, same safety boundaries, same observable proof.

**Determinism integrity (critical):** deterministic means fixed input + the *real* governance logic + a fixed model stub, producing reproducible *real* outputs. The Signal, Decision, and Trust Packet must be genuinely emitted by the live code on the fixed input — never hand-written, never hardcoded. We demo the real governor on a controlled scenario; we never fake the output.

Do not author the clinical content of the demo. Clinical wording comes from Dr. Stoler or is marked REQUIRES DR. STOLER SIGNOFF. All other migration, refactor, scaffold, and architecture work is secondary until the demo is stage-ready.

---

## 5. Change control

**Requires Dr. Stoler signoff:** clinical claims; evidence framing; credential language; nutrition, lifestyle, medication, mental health, or safety copy; public-facing professional standards.

**Requires Bleu signoff:** system doctrine; brand voice; product priority; Citizen experience; public positioning; commerce restraint.

**Requires Threesome (Bleu + Dr. Felicia + Codex):** schema changes; architecture changes; agent activation; dormant-to-live wiring; Trust Packet persistence; clinical safety workflow changes; new live-path decision behavior.

**May execute directly:** typos; formatting fixes; read-only audits; conflict identification; broken links; non-clinical copy cleanup; test/report generation that does not alter live behavior. After any direct execution, report what changed and what was verified.

---

## 6. Source-of-truth hierarchy

Primary sources: `THE_BLEU_BIBLE.md`, `_meta/doctrine/architecture_crosswalk_v1.md`, `_meta/audits/2026-06-01-comprehensive-system-diagnostic.md`, `_meta/doctrine/felicia_standards_v1.md`.

By lane: (1) clinical/professional content → signed Dr. Stoler standards; (2) system architecture → signed architecture doctrine + current audits; (3) live/dormant status → most recent system diagnostic; (4) background doctrine → THE_BLEU_BIBLE.md. **Newest signed/dated document wins only inside its own lane.** If documents conflict, do not resolve silently — flag the area: CONFLICT — HUMAN REVIEW REQUIRED.

---

## 7. Default Codex behavior

For every task, first determine: (1) Is this touching the live path? (2) Is this clinical/credential/evidence/health-related? (3) Is this activating dormant code? (4) Is this adding architecture? (5) Is this required for the current Natchitoches demo? (6) Can this be proven with file paths, line numbers, and tests?

If the task is not required for the current demo and risks architecture drift, **pause and report instead of building.**

Default posture: preserve the live path; prove governed behavior; do not expand the system; do not invent state; do not author clinical standards; record what is verified.

---

## 8. Final command

This system does not need more layers right now. It needs one controlled proof: a user signal enters; the system governs it; the response stays inside safety boundaries; the Trust Packet proves why; the demo repeats reliably. Until that is stage-ready, everything else is secondary.

You are not here to redesign BLEU. You are here to protect the live path, produce the Lexapro counterfactual demo, show Signal → Decision → Response → Trust Packet, and prove it without inventing new architecture.
