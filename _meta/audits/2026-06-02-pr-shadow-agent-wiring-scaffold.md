# PR Shadow Agent Wiring Scaffold Audit

**Date:** 2026-06-02  
**Branch:** `codex/pr-shadow-agent-wiring-scaffold`  
**Scope:** dormant shadow subscription wiring, hash-only comparison schema, direct test fixture, documentation, and audit trail.

## Doctrine and source anchors

- `_meta/THE_BLEU_BIBLE.md` defines BLEU's operating order as decompose, decide, record, respond; the record layer is where defensible proof belongs before any candidate path becomes production.
- `_meta/THE_BLEU_BIBLE.md` also identifies Counterfactual proof as part of every record. Shadow comparisons are not Counterfactuals yet, but they create the future evidence substrate for what a candidate agent would have done beside production.
- `_meta/audits/2026-05-29-codex-total-system-blueprint-v1.md` does not appear to include a dedicated shadow-observation section by name. It does document a governed rollout model with clinical review and Decision Object logging; this audit cites that honestly as adjacent doctrine rather than claiming absent shadow-specific text.
- `core/agents/shadow/shadow_runner.js` is the PR #15 observation source for dormant parallel observation.
- `core/agents/_adapter/agent_interface.js` is the PR #14 future agent interface boundary; this PR does not invoke agents.
- `_meta/doctrine/decision_matrix.md` assigns clinical claims, protocols, crisis thresholds, and clinical red-flag updates to Dr. Felicia's Tier 2/3 authority.

## What changed

- Added `core/schemas/shadow_comparison_v1.0.schema.json` for `ShadowComparisonResult` records.
- Added `core/agents/shadow/wiring.js` with `createShadowWiring(config)` and `SHADOW_WIRING_SINKS`.
- Updated `core/agents/shadow/README.md` to document Shadow Runner plus Shadow Agent Wiring architecture.
- Added `tests/agents/shadow/wiring.test.js` as a standalone direct-invocation test file.
- Added this audit record.

## Clinical agent gating at registration

Clinical agent registration is blocked unless the wiring factory receives `felicia_signoff_doc`:

- `tier_2_felicia` without signoff resolves `registered=false` with reason `clinical_agent_requires_felicia_signoff`.
- `tier_3_felicia_autonomous` without signoff resolves `registered=false` with reason `clinical_agent_requires_felicia_signoff`.
- `tier_infrastructure` can register without clinical signoff because it is not a clinical-authority tier.

This PR registers no real agents. The subscription list ships empty. The gating exists so later per-agent registration PRs cannot bypass Felicia authority.

## TD-010 hash-only discipline

`observeAndCompare()` accepts raw production and shadow response inputs only long enough to derive:

- `production_response_hash`,
- `shadow_response_hash`,
- `production_word_count`,
- `shadow_word_count`,
- `hashes_match`,
- `word_count_delta`.

The persisted comparison object never includes raw response text. The schema locks `td_010_compliance` to `pii_hashed=true`, `plaintext_email_stored=false`, `plaintext_phone_stored=false`, and `contains_raw_response_text=false`.

## Dormant-by-default activation sequence

1. Dr. Felicia signs Tier 2/3 clinical agent boundaries.
2. Captain enables Shadow Runner with `SHADOW_RUNNER_ENABLED` in Render.
3. Captain enables Shadow Wiring with `SHADOW_WIRING_ENABLED` in Render.
4. Captain registers agents through subsequent audited per-agent PRs.
5. A future PR wires Trust Packet Logger consumption so shadow comparisons can become Counterfactual evidence.

This sequence preserves pre-cutover discipline: observation first, comparison second, promotion never automatic.

## Package script conflict avoidance

`package.json` was **not** modified in this PR. The new test file ships in place and is verified by direct node invocation:

```bash
node tests/agents/shadow/wiring.test.js
```

It is not yet part of `npm run test:schemas`. The separate glob refactor PR will auto-discover it later.

## Forward path

Future per-agent registration PRs should be separate and should include explicit Felicia signoff before any Tier 2 or Tier 3 registration, including:

- Crisis Safety Agent,
- Med Safety Agent,
- Clinical Review Agent,
- mode agents that cross into clinical guidance.

Each future PR should keep production behavior unchanged until shadow parity, clinical boundaries, and Trust Packet evidence are reviewed.
