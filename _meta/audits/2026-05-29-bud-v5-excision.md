# 2026-05-29 — BUD V5 Cross-Repo Intercept Excision

## Status

Implemented as PR 4 / Decision A from `_meta/audits/2026-05-29-cannaiq-excision-plan.md`.

## Authorization

Captain + Dr. Felicia Joint Soul-Gate authorized removal on 2026-05-29. Clinical signoff scope: this is technical hygiene only. CannaIQ remains a separate platform, and BLEU's local CannaIQ mode remains preserved.

## Removed

- Removed the pre-state `server.js:218-784` BUD V5 cross-repo prompt block, including the `BUD_V5_SYSTEM_PROMPT` template literal.
- Removed the pre-state `server.js:2318-2326` `buildPrompt()` branch that returned `BUD_V5_SYSTEM_PROMPT` when `mode === 'cannaiq' && assistant === 'Bud'`.

Post-excision behavior: `buildPrompt()` now falls through to `MODE_PROMPTS[mode] || MODE_PROMPTS.general`; for `mode === 'cannaiq'`, this preserves BLEU's local `MODE_PROMPTS.cannaiq` path.

## Preserved

- `MODE_PROMPTS.cannaiq` remains in `server.js` and continues to define BLEU's local CannaIQ mode.
- `ecsiqMode()` remains in `server.js` for use/reset classification.
- The commerce steward's ECSIQ/CannaIQ no-commerce branch remains intact.
- The `/ecsiq` sea route remains intact.
- `core/safety/canonical_crisis_patterns.js` was not modified.
- The per-mode smoke harness remains in place; its Bud leak-token comment now refers to the retired prompt instead of a live server.js line range.

## Verification

Commands run on 2026-05-29:

```sh
node --check server.js
node tests/integration/per-mode-chat.smoke.js
rg -n "BUD_V5_SYSTEM_PROMPT|assistant === 'Bud'|V5 BUD" server.js tests/integration/per-mode-chat.smoke.js
```

Expected result: syntax check passes, dry-run smoke passes, and no active server/test references to the retired intercept remain.

## Risk Notes

- This PR intentionally does not remove BLEU's local CannaIQ prompt, ECSIQ classifier, ECSIQ route, or crisis pattern proposal file.
- If any external CannaIQ client still sends `mode:'cannaiq', assistant:'Bud'` to this service, it no longer receives the retired standalone Bud prompt. It receives the preserved local CannaIQ mode path instead.
