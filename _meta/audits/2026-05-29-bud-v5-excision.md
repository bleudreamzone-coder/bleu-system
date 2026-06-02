# BUD V5 Cross-Repo Intercept Excision Audit

Date: 2026-05-29
Branch: `codex/pr4-bud-v5-excision-2026-05-29`
Change type: documentation-and-code-only server prompt hygiene

## Authorization

Authorized by Captain + Dr. Felicia Joint Soul-Gate on 2026-05-29.

Clinical signoff reference: Dr. Felicia Stoler, Chief Clinical Officer, Soul-Gated Decision A on 2026-05-29 as part of the Joint Soul-Gate response to the reconciliation audit. Reference: Decision 6 of Joint Soul-Gate prompt.

Captain Soul-Gate timestamp: _pending merge-time entry by Captain_.

## Motivation

- Severance compliance per Bible + reconciliation audit Section 16.1.
- CannaIQ.net is a separate platform; cross-repo intercept logic does not belong in the bleu.live production server.
- Institutional positioning: institutional buyers including hotels, employers, FQHCs, and state Medicaid cannot tolerate cannabis adjacency in bleu.live's production codebase.

## Lines Removed

Removed from `server.js`:

1. Original lines 218-784: `BUD_V5_SYSTEM_PROMPT` block, including the CannaIQ.net Bud V5 standalone system prompt.
2. Original lines 2318-2326: `buildPrompt` branch for `mode === 'cannaiq' && assistant === 'Bud'`, which returned the standalone Bud V5 prompt instead of the normal mode prompt path.

## Lines Preserved

The following production code paths were intentionally preserved:

1. `MODE_PROMPTS.cannaiq` — preserved because bleu.live's internal CannaIQ tab remains a supported mode and should continue to construct from the canonical `MODE_PROMPTS` path.
2. `ecsiqMode` classifier — preserved because it is part of the cannabis sea reset/use classification path and is not the Bud V5 cross-repo intercept.
3. `/ecsiq` Sea VI route — preserved because it serves the existing Sea VI page route and is not the Bud V5 cross-repo intercept.
4. `core/safety/canonical_crisis_patterns.js` — preserved because crisis safety pattern handling is unrelated to the Bud V5 prompt removal and must remain untouched.

## LOC Counts

- `server.js` pre-change LOC: 4,162
- `server.js` post-change LOC: 3,587
- Net `server.js` reduction: 575 lines

The reduction corresponds to the prompt block plus the `buildPrompt` Bud intercept branch and surrounding comments.

## Verification

- Syntax validation: `node --check server.js` passed.
- Per-mode chat smoke dry run: `node tests/integration/per-mode-chat.smoke.js` passed.
- Bud V5 token leak check: the per-mode smoke dry run reports the Bud leak tokens under test and confirms the dry-run harness self-test passes on neutral text. Live execution remains available with `RUN_LIVE=1` when operationally desired.
- CannaIQ prompt path: verified statically that `MODE_PROMPTS.cannaiq` remains present and `buildPrompt` still initializes with `let p = MODE_PROMPTS[mode] || MODE_PROMPTS.general;`, so `mode === 'cannaiq'` now follows the same canonical mode prompt construction path as other modes.

## Scope Boundary

No schema changes, deploy configuration changes, crisis safety changes, or Sea VI route changes were made in this PR.
