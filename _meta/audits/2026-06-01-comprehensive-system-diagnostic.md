# Comprehensive System Diagnostic — bleu-system

- **Date:** 2026-06-01 request, executed 2026-06-02 UTC
- **Mode:** Read-only diagnostic plus report artifact only; no code changes, migrations, merges, or runtime wiring were executed.
- **Scope basis:** Local checkout `work` at commit `d745d7e`, whose latest merge commit is PR #31 into `main`; this checkout has no configured remote, so live database state and branch mergeability are marked UNVERIFIED where they cannot be proven from files or accessible GitHub HTML.

## 1. Presenting picture

BLEU is a live Node/http `server.js` application whose browser chat path is still the hand-built `/api/chat` and `/api/chat/stream` OpenAI stream path, with deterministic crisis banner injection and commerce-card gating wired there; around that live spine sits a large new shadow/schema layer—Signal/Decision/Trust Packet, memory, tools, metrics, outcomes, counterfactual review/capture, model router, SDK adapter, and shadow wiring—that is mostly validated by tests but not imported by `server.js` and therefore is not yet part of the live request path. `server.js:1930`, `server.js:2021`, `server.js:2061`, `server.js:2108`, `server.js:2166`, `server.js:2210`, `server.js:2253`, `package.json:11`.

## 2. Integration reality — live wiring vs orphan/scaffold

### Live request path anchors

| Live surface | Actual wiring | Diagnostic |
|---|---|---|
| `/api/chat` | Route enters at `server.js:1930`, parses body at `server.js:1934`, calls `detectCrisis()` at `server.js:1954`, builds prompt at `server.js:2021`, applies commerce gate at `server.js:2061-2062`, streams OpenAI at `server.js:2078-2082`, runs commerce steward before `[DONE]` at `server.js:2105-2109`, writes memory at `server.js:2147-2159`. | LIVE. |
| `/api/chat/stream` | Route enters at `server.js:2166`, calls `detectCrisis()` at `server.js:2183`, builds prompt at `server.js:2195`, applies commerce gate at `server.js:2210-2211`, streams OpenAI at `server.js:2227-2230`, writes crisis banner at `server.js:2249`, runs commerce steward at `server.js:2253-2255`, writes memory at `server.js:2275-2286`. | LIVE but likely secondary to `/api/chat`. |
| ECSIQ/CannaIQ | There is no separate `/ecsiq` route found in `server.js`; ECSIQ is a `sea`/`mode` condition inside commerce stewardship that classifies reset/use and returns without cards. `server.js:1198-1203`, `server.js:1268-1272`. | LIVE only as mode/sea logic on chat routes; `/ecsiq` route itself is NOT VERIFIED / not found. |
| Frontend chat hook | `js/bleu-prod-hooks.js` sets `alvaiEndpoint: '/api/chat'` and its sendPrompt comment identifies streaming `/api/chat`. `js/bleu-prod-hooks.js:17`, `js/bleu-prod-hooks.js:575`. | LIVE browser path points to `/api/chat`. |

### Schemas, scaffolds, configs, and fixtures

| Module/file | Referenced by live request path? | Import/reference evidence | Diagnostic |
|---|---:|---|---|
| `core/safety/crisis_validator.js` | YES | Imported in `server.js:15`; called in `/api/chat` at `server.js:1954` and stream at `server.js:2183`. | Live safety primitive. |
| `core/safety/canonical_crisis_patterns.js` | YES | Imported in `server.js:16`; used by `openWindowGate()` bridge at `server.js:1170`. | Live safety primitive. |
| `core/config/variant_taxonomy_v1.json` | NO | Referenced by schema tests and fixture docs, not by `server.js`; test imports at `tests/schemas/variant-taxonomy-v1.test.js:6` and WAL cross-check at `tests/schemas/wal-lexapro-killer-demo.test.js:10`. | Shadow/test config, not live classifier wiring. |
| `core/schemas/signal_object_v1.1.schema.json` | NO | Test/adapter references only: `tests/schemas/signal-object-v1.1.test.js:7`, `tests/agents/_adapter/adapter-shape.test.js:78`; no `server.js` reference found. | Validated scaffold. |
| `core/schemas/decision_object_v1.1.schema.json` | NO | Test/adapter/shadow references: `tests/schemas/decision-object-v1.1.test.js:7`, `tests/agents/shadow/shadow-runner-shape.test.js:9`; no `server.js` reference found. | Validated scaffold. |
| `core/schemas/trust_packet_v1.1.schema.json` | NO | Required by logger at `core/agents/trust/trust_packet_logger.js:5` and tests at `tests/schemas/trust-packet-v1.1.test.js:7`; no `server.js` reference found. | Scaffold plus dormant logger validation. |
| `core/schemas/shadow_comparison_v1.0.schema.json` | NO | Loaded by shadow wiring at `core/agents/shadow/wiring.js:7-10`; no `server.js` reference found. | Dormant shadow comparison contract. |
| `core/schemas/memory_record_v1.1.schema.json` | NO | Loaded by `core/agents/memory/memory_interface.js:8`; no `server.js` reference found. | Dormant memory-architecture scaffold, separate from live `conversation_history` writes. |
| `core/schemas/tool_registration_v1.1.schema.json` | NO | Loaded by `core/agents/tools/tool_registry.js:7`; no `server.js` reference found. | Dormant tool registry contract. |
| `core/schemas/metric_event_v1.1.schema.json` | NO | Used by dormant metrics emitter and tests; schema event types include `trust_packet_emitted` at `core/schemas/metric_event_v1.1.schema.json:539`. | Dormant metric schema; live `server.js` uses its own `logEvent()` path, not this emitter. |
| `core/schemas/counterfactual_review_v1.1.schema.json` | NO | Required by reviewer at `core/agents/review/counterfactual_reviewer.js:5`; no `server.js` reference found. | Dormant review contract. |
| `core/schemas/outcome_checkpoint_v1.1.schema.json` | NO | Tested at `tests/schemas/outcome-checkpoint.test.js:7`; migration says dormant until clinical protocol signoff at `supabase/migrations/2026-06-01-outcome-checkpoints-table.sql:36`. | Dormant outcome contract/table. |
| `core/schemas/model_routing_decision_v1.1.schema.json` | NO | Loaded by router at `core/agents/router/model_router.js:9-12`; no `server.js` reference found. | Dormant router decision schema. |
| `core/schemas/counterfactual_review_v1.1.schema.json` | NO | Required by `core/agents/review/counterfactual_reviewer.js:5`. | Dormant review schema. |
| `core/schemas/tool_invocation_log_v1.1.schema.json` | NO | No live `server.js` import found; table migration exists in `supabase/migrations/2026-06-01-tool-invocation-log-table.sql`. | Present but not live. |
| `core/agents/_adapter/*` | NO | `freezeRegistry()` explicitly creates empty maps and “wires no runtime behavior.” `core/agents/_adapter/index.js:23-35`. | SDK adapter scaffold only. |
| `core/agents/router/*` | NO | `createModelRouter()` records routing decisions only and `invoke()` throws `NotImplementedError`. `core/agents/router/model_router.js:293-333`; no `server.js` import found. | Shelved/dormant. |
| `core/agents/tools/tool_registry.js` | NO | Registry is tested and documented, but no `server.js` import found; Felicia-gated tool registration is scaffold-only. `core/agents/tools/README.md:9-11`. | Dormant. |
| `core/agents/trust/*` | NO | Factory hashes response in memory and logger is disabled unless env/config enables it. `core/agents/trust/trust_packet_factory.js:18-30`, `core/agents/trust/trust_packet_logger.js:110-154`; no `server.js` import found. | Built, not emitting from live chat. |
| `core/agents/outcomes/*` | NO | Outcome checkpoint table comment says dormant until signoff. `supabase/migrations/2026-06-01-outcome-checkpoints-table.sql:36`. | Dormant. |
| `core/agents/memory/*` | NO | Memory interface loads a schema, but live request path uses `storeConversationTurn()`/`querySupabase()` inside `server.js`, not this adapter. `core/agents/memory/memory_interface.js:8`, `server.js:2147-2159`, `server.js:2275-2286`. | Dormant scaffold. |
| `core/agents/counterfactual/*` | NO | Capture is disabled unless `COUNTERFACTUAL_CAPTURE_ENABLED === 'true'`; Supabase sink throws NotImplementedError. `core/agents/counterfactual/capture.js:85-103`, `core/agents/counterfactual/capture.js:130-137`. | Dormant. |
| `core/agents/shadow/shadow_runner.js` | NO | Shape test imports it; no `server.js` import found. `tests/agents/shadow/shadow-runner-shape.test.js:8-14`. | Dormant runner. |
| `core/agents/shadow/wiring.js` | NO | Explicitly enabled only by env; default sink buffer; no `server.js` import found. `core/agents/shadow/wiring.js:397-405`, `core/agents/shadow/wiring.js:416-423`. | Dormant wiring scaffold. |
| `tests/fixtures/golden/wal-lexapro-killer-demo.json` | NO | Validated by `tests/schemas/wal-lexapro-killer-demo.test.js`; package test chain includes that test. `package.json:11`. | Test fixture only; no runtime demo route. |
| `tests/fixtures/golden/wal-fixture-schema-v1.0.schema.json` | NO | PR #26 fixture description and local test validate it; no `server.js` reference found. `tests/schemas/wal-lexapro-killer-demo.test.js:7-10`. | Test fixture schema only. |
| `supabase/functions/alvai/index.ts` | NO for current browser path | Docs state active frontend calls Render `/api/chat`, not the edge function. `docs/edge-function-investigation.md:15`, `docs/edge-function-investigation.md:94`. | Legacy/orphan unless an external caller exists; external traffic UNVERIFIED. |
| `supabase/functions/stripe-checkout/index.ts` | NO for current frontend | Frontend calls `server.js` `/api/stripe/create-session` via `js/bleu-prod-hooks.js:558`; server route is `server.js:3117`. | Likely orphaned. |
| Root `migrations/*.sql` | NO | Repo map calls root `migrations/` a confusable duplicate and recommends moving/deleting. `docs/REPO_MAP.md:594`. | Legacy/unclear. |
| `supabase/migrations/*.sql` | NO runtime import | These are deployment artifacts; they are not live request-path modules. Example RLS/REVOKE file is manual-apply oriented. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:59-69`. | Pending/applied state UNVERIFIED unless snapshot or DB confirms. |

**Recent additions live vs dead weight:** PR #29’s Trust Packet logging + Lexapro fixture is merged into the branch, but the Trust Packet logger is not imported by `server.js` and the Lexapro WAL fixture is only in the schema test chain. `git log` shows PR #29 merged locally; `package.json:11` includes `trust-packet-logger` and `wal-lexapro` tests; `server.js` has no Trust Packet import. PR #30’s shadow wiring scaffold is merged locally but not imported by `server.js`; `createShadowWiring({}).isEnabled()` defaults false. `core/agents/shadow/wiring.js:397-405`. PR #31’s Felicia standards document exists and is pending, not binding. `_meta/doctrine/felicia_standards_v1.md:7-14`.

## 3. Security — P0 first

### RLS / grants / known 7-table exposure

| Table | RLS enabled in repo snapshot? | Current repo snapshot anon/authenticated grants | Remediation migration state | Diagnostic |
|---|---:|---|---|---|
| `user_coherence` | NO in snapshot; no `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for this table found in snapshot; migration itself says RLS was false. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:13-21`. | Snapshot grants only service_role at `supabase/schema-snapshot-2026-05-21.sql:2712`; no anon/authenticated line present near it. | Migration file contains `REVOKE ALL` for anon/authenticated. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:75-77`. Live DB applied state UNVERIFIED. | Sensitive because `server.js` writes CI records into `user_coherence`. `server.js:2132-2137`. |
| `commitments` | NO / UNVERIFIED live. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:13-17`. | Snapshot grants only service_role. `supabase/schema-snapshot-2026-05-21.sql:2478`. | REVOKE statements present. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:79-81`. | Known 7-table member. |
| `emotional_signals` | NO / UNVERIFIED live. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:13-17`. | Snapshot grants only service_role. `supabase/schema-snapshot-2026-05-21.sql:2510`. | REVOKE statements present. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:83-85`. | Known 7-table member. |
| `predictive_signals` | NO / UNVERIFIED live. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:13-17`. | Snapshot grants only service_role. `supabase/schema-snapshot-2026-05-21.sql:2616`. | REVOKE statements present. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:87-89`. | Known 7-table member. |
| `session_embeddings` | NO / UNVERIFIED live. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:13-17`. | Snapshot grants only service_role. `supabase/schema-snapshot-2026-05-21.sql:2692`. | REVOKE statements present. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:91-93`. | Known 7-table member. |
| `user_arcs` | NO / UNVERIFIED live. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:13-17`. | Snapshot grants only service_role. `supabase/schema-snapshot-2026-05-21.sql:2708`. | REVOKE statements present. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:95-97`. | Known 7-table member. |
| `agent11_syntheses` | NO / UNVERIFIED live. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:13-17`. | Snapshot grants only service_role. `supabase/schema-snapshot-2026-05-21.sql:2438`. | REVOKE statements present. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:99-101`. | Known 7-table member. |

**RLS conclusion:** the repo contains a REVOKE-only remediation and explicitly says it does not enable RLS on those seven tables unless the operator appends ALTER TABLE statements. `supabase/migrations/2026-05-21-p0-revoke-anon.sql:35-55`. The schema snapshot suggests anon/authenticated grants are already absent for the seven tables, but the live Supabase project was not queried, so “applied to production” is UNVERIFIED. `supabase/schema-snapshot-2026-05-21.sql:2438`, `supabase/schema-snapshot-2026-05-21.sql:2478`, `supabase/schema-snapshot-2026-05-21.sql:2510`, `supabase/schema-snapshot-2026-05-21.sql:2616`, `supabase/schema-snapshot-2026-05-21.sql:2692`, `supabase/schema-snapshot-2026-05-21.sql:2708`, `supabase/schema-snapshot-2026-05-21.sql:2712`.

### Stripe

| Question | Finding | Evidence |
|---|---|---|
| Do live price IDs in code match the canonical set? | The canonical set is defined twice in code: frontend maps sleep/stress/longevity/gut to four price IDs and backend maps those four plus `pro`. The frontend lacks the `pro` key present in backend. `js/bleu-prod-hooks.js:40-43`, `server.js:3304-3308`. | Match for four Rail A plan IDs; `pro` backend-only. |
| Is create-session restricted to known price IDs? | YES; `/api/stripe/create-session` rejects missing/unknown `price_id` before calling Stripe. `server.js:3124-3127`. | Fail-closed for unknown IDs. |
| Is webhook fail-closed? | YES in source: missing webhook secret returns 500, missing/malformed/bad signature returns 400, timestamp outside 300s returns 400. `server.js:3313-3319`, `server.js:3327-3336`, `server.js:3343-3365`. | Source is fail-closed. |
| Test/placeholder keys left? | No `sk_live`, `sk_test`, `pk_live`, `pk_test`, or `whsec_` production secret was found in source by the diagnostic scan; test-only `whsec_smoke_local_test` exists in the Stripe smoke test. `tests/integration/stripe-webhook.smoke.js:7`. | Source secret scan is a best-effort regex, not a full secret scanner. |

### Secrets, keys, PII in source/logs

- `server.js` reads OpenAI, Supabase service, anon gateway, Twilio, Reorder cron, and Stripe secrets from environment variables, not literals. `server.js:18-36`, `server.js:3121-3124`, `server.js:3327-3330`.
- PII risk remains in logs/storage: crisis logs include session/user IDs and matched terms, not full message. `server.js:1955-1963`, `server.js:2184-2192`. Twilio reply logging stores `from_phone`, `to_phone`, and `body_text` in `outcome_events` payload. `server.js:3098-3104`. Conversation memory stores raw user and assistant content in `conversation_memory` as a TODO-to-remove legacy path. `server.js:2157-2159`.
- Docs record a prior service-key exposure as “not confirmed rotated”; this is not verified from live ops in this audit. `docs/REPO_MAP.md:472`, `docs/REPO_MAP.md:599`.

## 4. Clinical-safety enforcement

| Surface | Enforced in code or prompt-only? | Evidence | Pass/fail |
|---|---|---|---|
| Crisis escalation | CODE ENFORCED for hard crisis phrases: `detectCrisis()` is imported, called on `/api/chat` and `/api/chat/stream`, and writes `CRISIS_BANNER` independent of model output. `server.js:15`, `server.js:1951-1968`, `server.js:2182-2183`, `server.js:2249`. | `CRISIS_BANNER` text includes 988, 911, SAMHSA, and Crisis Text Line. `core/safety/crisis_keywords.js:64-80`. | PASS for deterministic banner; breadth of phrase list is limited to validator/pattern files. |
| Open-window crisis bridge | CODE ENFORCED for commerce gating: `openWindowGate()` merges canonical crisis detection with suicidality regex and psychosis/mania hard stop. `server.js:1158-1173`. | Commerce steward returns without cards when open-window or deterministic crisis is detected. `server.js:1264-1267`. | PASS for commerce suppression. |
| Commerce restraint in ALVAI flow | CODE ENFORCED in live path: `getCommerceGate()` computes first-response/support/crisis/no-concern reasons; `appendCommerceGatePrompt()` blocks product/affiliate/price/store language when active; both chat routes apply it before OpenAI; commerce steward suppresses cards if blocked. `server.js:244-263`, `server.js:2061-2062`, `server.js:2210-2211`, `server.js:1252-1261`. | Live. |
| Lexapro / drug-interaction demo | TEST PASS for fixture schema and enum correctness; NOT live end-to-end because it is a WAL fixture test, not a live route. `tests/schemas/wal-lexapro-killer-demo.test.js:7-10`, `package.json:11`. | PASS as schema/fixture; runtime E2E UNVERIFIED/not wired. |

## 5. Built but unfinished

| Component | Present? | Runtime status | Evidence |
|---|---:|---|---|
| Trust Packet schema | YES | Not emitted by live chat. Factory and logger exist, but `server.js` does not import them; logger emission is disabled unless enabled. `core/agents/trust/trust_packet_factory.js:18-30`, `core/agents/trust/trust_packet_logger.js:110-154`. | Built scaffold. |
| Trust Packet table | YES migration | Table is migration artifact; live applied state UNVERIFIED. `supabase/migrations/2026-06-02-trust-packets-table.sql:57`. | Pending/applied unknown. |
| Shadow runner | YES | Dormant; no `server.js` import found. Shape tests exist. `tests/agents/shadow/shadow-runner-shape.test.js:8-14`. | Dormant. |
| Shadow wiring | YES | Dormant/non-blocking by design: `isEnabled()` is true only when env equals `true`; methods catch/log errors and return failure records. `core/agents/shadow/wiring.js:21-34`, `core/agents/shadow/wiring.js:234-250`, `core/agents/shadow/wiring.js:293-349`, `core/agents/shadow/wiring.js:397-405`. | Dormant and error-isolated. Production “returns before shadow resolves” is NOT APPLICABLE/UNVERIFIED because no production route invokes it. |
| Model Router | YES | Shelved: selects only from registry; `invoke()` always throws NotImplementedError. `core/agents/router/model_router.js:229-242`, `core/agents/router/model_router.js:324-333`. | Not live. |
| SDK adapter | YES | Shelved: empty frozen registries and interfaces only. `core/agents/_adapter/index.js:23-35`. | Not live. |
| Counterfactual capture | YES | Dormant: disabled unless `COUNTERFACTUAL_CAPTURE_ENABLED === 'true'`; Supabase sink is not wired. `core/agents/counterfactual/capture.js:85-103`, `core/agents/counterfactual/capture.js:130-137`. | Not live. |

## 6. Repo hygiene

### Pull requests and stale branches

- Local git has no remote configured, so stale remote branches and mergeability cannot be fully checked from the checkout. `git config --get remote.origin.url` returned empty in this audit command. UNVERIFIED.
- Local history shows PRs #29, #30, and #31 merged into this branch; PRs #21, #26, and #27 are not merge commits in local history. `git log --oneline --decorate --all --grep='pull request #' -i --max-count=50`.
- Accessible GitHub HTML reports **2 open and 29 closed PRs** for `bleudreamzone-coder/bleu-system`; the list shows #21 and #22 open, #26 and #27 closed, #29 merged, #30 merged, and #31 merged. GitHub page lines: PR list `2 Open / 29 Closed`, #26/#27 closed, #29 merged, #21/#22 open. External HTML cannot be cited as a repo file, so detailed mergeability/conflict state is UNVERIFIED in this file-first chart.
- #21 is stale relative to current main because the same Signal Object schema now exists locally and #21 is still open in GitHub HTML with Codex review comments; local current branch already includes `core/schemas/signal_object_v1.1.schema.json` and its test in `package.json:11`. `core/schemas/README.md:12-19`, `package.json:11`. Mergeability UNVERIFIED.
- #26 and #27 were superseded by #29 according to PR #29 title/body and local merge commit; local history contains `Merge pull request #29` and the package test chain includes both Trust Packet logger and WAL Lexapro tests. `package.json:11`. GitHub HTML states #27 was closed after #29. Mergeability no longer relevant.

### Tests

| Suite | Exists | Diagnostic |
|---|---:|---|
| Schema/unit chain | YES | `package.json` `test:schemas` chains 15 schema/agent tests. `package.json:11`. Passed in this audit. |
| Integration smoke | YES | `tests/integration/stripe-webhook.smoke.js`, `per-mode-chat.smoke.js`, `server-logic.smoke.js`, `db-constraints.smoke.js`, and magic-link smoke exist. `tests/integration/README.md:1-40`. Stripe smoke and per-mode dry-run passed in this audit. |
| Browser tests | YES | Browser tests exist for crisis and rails. `package.json:7`, `tests/browser/crisis_flow.spec.js`, `tests/browser/rail_a_flow.spec.js`, `tests/browser/rail_c_flow.spec.js`. Not run in this audit. |
| Live E2E | LIMITED | Per-mode smoke defaults to DRY RUN unless `RUN_LIVE=1`; this audit did not fire live traffic. `tests/integration/per-mode-chat.smoke.js`. |

### Package.json / lockfile contention

`package.json` declares `ajv`, `ajv-formats`, and Playwright dev dependencies and has a long chained `test:schemas` command. `package.json:10-19`. `package-lock.json` contains the corresponding root dev dependency block and registry-resolved dependency graph. `package-lock.json:1-24`. PR #29 explicitly states it appended the Trust Packet logger and WAL Lexapro tests to the existing chain rather than replacing it; current `package.json:11` confirms the union chain. `package.json:11`.

## 7. Doctrine

| Doctrine question | Finding | Evidence |
|---|---|---|
| Is `felicia_standards_v1.md` still pending? | YES. Status says structured template; sections marked `PENDING_FELICIA_SIGNOFF` await Dr. Felicia authorship; authority boundary says Codex does not author clinical/professional standards. `_meta/doctrine/felicia_standards_v1.md:7-14`. | Pending, not final clinical doctrine. |
| Is any code/PR citing it as binding despite pending? | No live `server.js` import or citation was found. Mentions are docs/audit-only. UNVERIFIED for all GitHub PR comments beyond accessible HTML. | No code binding found. |
| Four locks — unverified patient-count figure | NOT ENFORCED in code found. The document has patient/citizen language pending but no numeric lock implementation. `_meta/doctrine/felicia_standards_v1.md:144-146`. | UNVERIFIED/not enforced. |
| Four locks — lineage-not-credential | NOT ENFORCED in code found. `server.js` prompt still says “127 years of healing lineage,” but there is no enforcement layer distinguishing lineage from credentials. `server.js:68`. | Prompt claim only. |
| Four locks — credential framing | PARTIAL scaffold only: Felicia document lists credentials and public credential framing as Tier 2, but verification status is pending and no live copy gate imports it. `_meta/doctrine/felicia_standards_v1.md:22-30`, `_meta/doctrine/felicia_standards_v1.md:69-79`. | Not live-enforced. |
| Four locks — forbidden vocabulary | PARTIAL live commerce vocabulary discipline exists in `server.js` prompt/gate, but it is ALVAI commerce-language discipline, not Felicia-standards enforcement. `server.js:293-297`, `server.js:258-263`. | Partial prompt enforcement only. |

## 8. Diagnosis

Core condition: **a functioning live chat/commerce server is carrying a rapidly expanding institutional schema scaffolding layer that is mostly tested but not yet wired into the production request path**. The immediate clinical/security spine is stronger than the scaffolds, but the repo now has a high risk of “paper architecture drift”: schemas, migrations, and doctrine appear authoritative before runtime adoption, live DB application, and signoff status are proven.

## 9. Prioritized treatment plan — propose only, do not execute

### P0

1. **Confirm live RLS/REVOKE state for the 7 exposed tables**: run the verification SQL in `supabase/migrations/2026-05-21-p0-revoke-anon.sql:109-122` in Supabase dashboard; if grants remain, apply the `REVOKE ALL` block at `supabase/migrations/2026-05-21-p0-revoke-anon.sql:73-103`; decide whether to append the defense-in-depth `ENABLE ROW LEVEL SECURITY` statements from `supabase/migrations/2026-05-21-p0-revoke-anon.sql:43-55`.
2. **Rotate/verify Supabase service key if prior exposure is real**: docs flag it as exposed and not confirmed rotated. `docs/REPO_MAP.md:472`, `docs/REPO_MAP.md:599`. This is an ops action, not a code change.
3. **Stop raw PII/body-text storage in Twilio outcome payloads or document clinical/legal necessity**: `server.js` stores phone numbers and `body_text` in `outcome_events`. `server.js:3098-3104`. Proposed action: hash phone fields and store a redacted/summary body unless signoff requires plaintext.
4. **Remove or gate legacy `conversation_memory` dual-write of raw content**: TODO already says remove after audit. `server.js:2157-2159`. Proposed action: migrate readers to `conversation_history`, then delete legacy writes.

### P1

1. **Decide first live Trust Packet insertion point**: after `/api/chat` has a complete `full` response and before memory writes, create Decision/Signal placeholders only if clinically signed; otherwise keep disabled. Candidate location: `server.js:2105-2119` for non-streaming and `server.js:2253-2270` for stream.
2. **Normalize ECSIQ route semantics**: if `/ecsiq` is a required public route, add an explicit route; if ECSIQ is only a `sea`/`mode`, update docs/prompts to say so. Current code only has `server.js:1268-1272` mode/sea handling.
3. **Resolve PR #21/#22 stale open state**: close or supersede #21 if current main already contains Signal Object schema/tests; evaluate #22 against current `server.js` CannaIQ state. `package.json:11`, `server.js:525`, `server.js:1268-1272`.
4. **Run browser rail/crisis tests on the deployed UI**: browser suite exists but was not run here. `package.json:7`.

### P2

1. **Mark scaffolds visibly dormant in runtime docs and READMEs**: Trust Packet, Model Router, SDK adapter, Counterfactual Capture, and Shadow Wiring should all say “not imported by `server.js`” until wired. Evidence files: `core/agents/trust/trust_packet_logger.js:110-154`, `core/agents/router/model_router.js:324-333`, `core/agents/_adapter/index.js:23-35`, `core/agents/counterfactual/capture.js:101-137`, `core/agents/shadow/wiring.js:397-405`.
2. **Move or retire duplicate root `migrations/`**: repo map already recommends moving/deleting this duplicate. `docs/REPO_MAP.md:594`.
3. **Finish Felicia standards signoff before citing it as binding**: pending markers and verification pending remain. `_meta/doctrine/felicia_standards_v1.md:7-14`, `_meta/doctrine/felicia_standards_v1.md:30`.
4. **Package-lock contention guard**: keep PRs appending to `package.json:11` rather than replacing the chain; use `npm test` before merging scaffold PRs. `package.json:11`.

## Checks performed

- `git status --short --branch` — confirmed branch `work` before report creation.
- `git log --oneline --decorate --all --grep='pull request #' -i --max-count=50` — inspected local merged PR history.
- `rg --files`, targeted `rg -n`, and `nl -ba ... | sed -n` — inspected code, schemas, migrations, docs, and tests without modifying source code.
- `node --check server.js` — passed.
- `npm test` — passed schema chain.
- `node tests/integration/per-mode-chat.smoke.js dry-run` — passed dry-run only; no live traffic.
- `node tests/integration/stripe-webhook.smoke.js` — passed local webhook smoke.
