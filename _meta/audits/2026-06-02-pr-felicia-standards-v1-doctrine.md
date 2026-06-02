# PR Audit — Felicia Standards v1 Doctrine

## Scope

This PR adds a structured institutional doctrine document for Dr. Felicia Stoler's professional standards as they apply to bleu.live operations. The PR also updates the clinical signoff directory convention and adds a reusable signoff template.

No code, schema, package, server, API, Supabase function, or crisis-pattern module changes are in scope.

## Files Added or Updated

- Added `_meta/doctrine/felicia_standards_v1.md`.
- Updated `_meta/clinical/signoffs/README.md` to document the current signoff convention while preserving that historical signoffs may predate it.
- Added `_meta/clinical/signoffs/_template-stoler-signoff.md`.
- Added `_meta/audits/2026-06-02-pr-felicia-standards-v1-doctrine.md`.

## Doctrine Sources Read

- `_meta/doctrine/decision_matrix.md:1-5` defines the governance layer and frames clinical governance, evidence, and Soul Gate.
- `_meta/doctrine/decision_matrix.md:7-13` defines Tier 1 as Captain authority for code architecture, deploy, infrastructure, non-clinical copy, grant logistics, vendors, and non-clinical pricing.
- `_meta/doctrine/decision_matrix.md:15-23` defines Tier 2 as Dr. Felicia deciding while Bleu recommends, including clinical claims, protocols, interaction rules, credential framing, clinical content, regulatory positioning, templates, guidance, and media health claims.
- `_meta/doctrine/decision_matrix.md:25-29` defines Tier 3 as Dr. Felicia deciding while the system performs autonomously, including escalation thresholds, crisis routing modifications, red-flag screen updates, and hard-stop contraindication updates.
- `_meta/THE_BLEU_BIBLE.md:838-853` identifies Dr. Felicia Stoler as President & Chief Clinical Officer, lists credentials, describes her clinical authority surfaces, states that her separate founder role must not be conflated, and emphasizes scarce-time signoff workflows.
- `_meta/THE_BLEU_BIBLE.md:500-509` requires Felicia signoff on Wrong Answer Library entries, describing clinical authority becoming machine-enforceable proof.
- `_meta/THE_BLEU_BIBLE.md:1184-1188` states that Dr. Felicia's clinical signoffs flow through audit documents.
- `_meta/doctrine/refusal_doctrine_v1.md:16-21` includes clinical-review gating and evidence-boundary refusals, including Refusal 18's discipline against doctrine getting ahead of functioning reality.
- `tests/fixtures/golden/README.md:16-22` documents the PENDING_FELICIA_SIGNOFF sentinel pattern used by the Lexapro fixture and prohibits substitute clinical behavior language while signoff remains pending.

## Institutional Priority Source

Captain Soul-Gate's 2026-06-02 instruction identified `felicia_standards_v1.md` as an open institutional priority and requested a structured template for Dr. Felicia to fill section by section during signoff sprints. This audit records that handoff priority as the driver for the PR.

## PENDING_FELICIA_SIGNOFF Discipline

The doctrine document deliberately separates structural scaffolding from clinical authorship. Codex populated factual identity, governance-source lists, filing conventions, and maintenance rules. Codex did not author Dr. Felicia's professional standards, thresholds, referral criteria, wording preferences, continuing-education goals, disclosure details, or brand-communication policies.

Every clinical-authority subsection that requires Dr. Felicia's own professional judgment uses the exact sentinel:

```text
PENDING_FELICIA_SIGNOFF — to be authored by Dr. Felicia Stoler in clinical signoff session
```

This mirrors the Lexapro fixture discipline: when clinical behavior is pending, the repository records the pending state rather than inventing clinical answer language.

## Authority Boundary

Engineering and audit content in this PR was authored by Codex under Captain Soul-Gate authority. Clinical and professional standards content remains Dr. Felicia's authority. Future edits that replace PENDING_FELICIA_SIGNOFF markers must be authored, reviewed, and signed by Dr. Felicia through the signoff process.

## Forward Path

1. Dr. Felicia opens `_meta/doctrine/felicia_standards_v1.md` during the Saturday signoff sprint or any later work session.
2. She reviews one section at a time.
3. She replaces PENDING_FELICIA_SIGNOFF markers only where she is authoring her own clinical or professional standard.
4. She files matching signoff documents in `_meta/clinical/signoffs/` using `_template-stoler-signoff.md`.
5. Each authored section lands through a PR using conventional commit prefix `docs(felicia-standards):`.
6. Each signed section flips the sentinel to a dated `Signed by Dr. Felicia Stoler: YYYY-MM-DD` line.

## Discipline Checks

- The unverified patient-volume figure is not used in the standards doctrine.
- Captain family lineage is not used as credential weight.
- Dr. Felicia's bleu.live authority and separate founder role are not conflated.
- Personal financial or relationship details are not referenced.
- Refusal 18 is honored by shipping a structured template that does not get ahead of signed clinical reality.

## Acceptance Evidence to Run

- `node --check server.js`
- `npm run test:schemas`
- `node tests/integration/per-mode-chat.smoke.js`
- `wc -l _meta/doctrine/felicia_standards_v1.md`
- `grep -c "PENDING_FELICIA_SIGNOFF" _meta/doctrine/felicia_standards_v1.md`
- forbidden patient-volume phrase absence check for `_meta/doctrine/felicia_standards_v1.md`
- `grep -c "Jazz Bird" _meta/doctrine/felicia_standards_v1.md`
- `ls _meta/clinical/signoffs/`
