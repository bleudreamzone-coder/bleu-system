# Shadow Runner Infrastructure

PR Hotel adds the dormant shadow-observation layer for BLEU's future agent migration. It creates the safe place where a candidate agent can run beside the existing `server.js` path, record what it would have done, and compare that candidate path against the live production response without changing the citizen-facing response.

## Architecture

Blueprint Section 11 calls for a **shadow-first migration**: agent paths must prove parity and safety before they are allowed to own production traffic. This directory implements only that observation scaffold:

1. `createShadowRunner(config)` receives a future adapter registry.
2. `observe(requestContext)` accepts a snapshot of a chat request/response boundary.
3. When explicitly enabled and sampled, registered candidate agents can produce `ShadowObservation` records.
4. `flush()` writes buffered records to stdout in development or to the future Supabase sink.

No live route imports this runner in PR Hotel. No real agent is registered here. The production response still flows exclusively through the existing `server.js` implementation until a later PR deliberately wires an observation hook.

## Dormant-by-default controls

The shadow runner will **never auto-enable**. The safe defaults are:

- `SHADOW_RUNNER_ENABLED=false`
- `SHADOW_RUNNER_SINK=stdout`
- `SHADOW_RUNNER_SAMPLE_RATE=0.0`

Production deployment requires Captain to manually set these in the Render dashboard after Dr. Felicia signs off on the first agent boundary. `SHADOW_RUNNER_SAMPLE_RATE` must be incremented manually from `0.0` upward.

## Activation sequence

Activation requires all of the following, in order:

1. **Dr. Felicia signoff** on the agent being shadowed (Tier 2).
2. **Captain manual Render env var setting** for `SHADOW_RUNNER_ENABLED`, `SHADOW_RUNNER_SINK`, and `SHADOW_RUNNER_SAMPLE_RATE` (Tier 1).
3. **Captain manual Supabase SQL migration application** using `supabase/migrations/2026-06-01-shadow-observations-table.sql`.
4. **Captain manual sample-rate increment** from `0.0` upward after reviewing first observations.

Dormant-by-default is the safety feature. The runner is not a launch switch.

## Future registration example

Pseudocode only; this PR does not export or register a real agent:

```js
const { freezeRegistry } = require('../_adapter');
const { createShadowRunner } = require('./shadow_runner');

const registry = freezeRegistry(); // Future PR replaces with signed candidate registry.
const shadowRunner = createShadowRunner({ registry });

await shadowRunner.observe({
  sessionId: 'sha256:hashed-session-id',
  userText: '[redacted or minimized request text]',
  signal: null,
  crisisTier: 'none',
  commerceGate: { allowed: false },
  liveResponseText: 'Existing server.js response text',
});
```

Future agent PRs must emit Decision Object and Trust Packet references before shadow records are used for parity review.

## Privacy and refusal boundary

Shadow observations are implementation-detail records, not citizen-readable data. Session identifiers must be hashed per TD-010, and the schema requires:

- `pii_hashed: true`
- `plaintext_email_stored: false`
- `plaintext_phone_stored: false`

Refusal 18 applies: shadow infrastructure cannot break production. `observe()`, `flush()`, and `isEnabled()` swallow internal errors and log them with `[SHADOW]`.
