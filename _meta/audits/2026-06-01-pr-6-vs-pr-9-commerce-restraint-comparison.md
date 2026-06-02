# PR #6 vs PR #9 Commerce Restraint Comparative Audit

**Date:** 2026-06-01  
**Scope:** Audit only. No production files modified.  
**Important limitation:** This local checkout already has PR #6 merged into `HEAD` as merge commit `3515b1c`. Network access to GitHub PR refs/diffs is blocked in this environment (`git ls-remote https://github.com/bleudreamzone-coder/bleu-system.git ...` failed with HTTP CONNECT 403), and the repository has no remote configured in `.git/config`. Therefore, this audit can verify PR #6 from local Git history, but cannot independently fetch PR #9 contents, branch SHA, or conflict markers. PR #9 notes below are limited to the user-provided PR description/status and explicitly marked as unverified where applicable.

## Q1 — What files does each PR change?

### PR #6 inventory

- **PR title / merge subject:** `Merge pull request #6 from bleudreamzone-coder/codex/restrict-premature-commerce-in-alvai-flow`.
- **Branch name:** `codex/restrict-premature-commerce-in-alvai-flow`.
- **Merge commit SHA:** `3515b1c07d1cae7a88503933caf68952fd78794e`.
- **PR head commit SHA:** `389f108a4b430cd8bbf12b1e5d17de58806f40da`.
- **Files modified:**
  - `server.js`: 67 additions, 0 deletions.
  - `supabase/functions/alvai/index.ts`: 35 additions, 7 deletions.
- **Total diff size:** 102 insertions, 7 deletions across 2 files.

### PR #9 inventory

- **PR title:** Reported by user as `Constrain early ALVAI commerce surfaces`.
- **Branch name:** Reported by user as `codex/review-contents-of-pr-#6`.
- **Commit SHA:** I do not know. GitHub PR refs could not be fetched from this environment.
- **Files modified:** Reported by user as:
  - `server.js`.
  - `supabase/functions/alvai/index.ts`.
- **Total diff size:** Reported by user as 132 additions, 11 deletions across 2 files.

### Side-by-side file overlap

| File | PR #6 | PR #9 | Notes |
| --- | --- | --- | --- |
| `server.js` | Yes | Reported yes | Both appear to touch the live chat server. |
| `supabase/functions/alvai/index.ts` | Yes | Reported yes | Both appear to touch the Supabase ALVAI edge function. |
| Other files | No | Reported no | No additional files are known from the available evidence. |

## Q2 — What is each PR's core approach?

### PR #6 stated motivation

The merge commit subject says: `Constrain early ALVAI commerce surfaces`. The code itself labels the new server-side mechanism as `COMMERCE RESTRAINT — timing + framing gate for ALVAI commerce` and the edge-function equivalent as a `Conservative timing/framing gate for every commerce surface in this function`.

### PR #6 technical approach

PR #6 adds a conservative commerce gate to both the Node chat server and the Supabase ALVAI edge function. The gate blocks commerce when the response is the first assistant response, when the user has not stated a commerce-relevant concern, when the request is in crisis, or when a support/emotional tier is detected. When blocked, the Node server suppresses commerce cards in `runCommerceSteward()` and injects a system instruction forbidding product, affiliate, checkout, paid-plan, and BetterHelp-offer language. The edge function similarly suppresses marketplace practitioners, verified products, affiliate layers, prescription layers, pathway/bundle cart generation, and adds a commerce-restraint layer to the system prompt.

### PR #9 stated motivation

Reported by user as same/similar title: `Constrain early ALVAI commerce surfaces`. I cannot quote PR #9's author body or commit message from local evidence because PR #9 could not be fetched.

### PR #9 technical approach

Unverified from local source. Based only on the user-provided PR description, PR #9 reportedly adds a centralized commerce-restraint gate with regex/helpers, identifies suppression reasons including `first_response`, `no_stated_concern`, `support_tier`, and `crisis`, wires that gate into `runCommerceSteward()` and the Supabase ALVAI edge function, and adds a `BLEU_TEST_COMMERCE_GATE` harness for first-turn, follow-up, no-concern, crisis, and support-tier cases. That description is highly similar to the verified PR #6 implementation in this checkout.

### Side-by-side approach comparison

On available evidence, PR #6 and PR #9 appear to pursue the same class of fix: a timing/framing gate that prevents early or unsafe commerce. They likely overlap directly because both reportedly modify the same two production files and both reportedly wire a commerce gate into `runCommerceSteward()` and the ALVAI edge function. I cannot determine whether they are identical, divergent, or complementary without PR #9's actual diff.

## Q3 — What exact code does each PR add?

### PR #6 — `server.js`

#### Commerce concern regex and gate helpers, lines 803-830

**Purpose:** Detect whether commerce can surface and generate prompt language when it must be restrained.

Critical lines:

```js
const COMMERCE_CONCERN_RE = /\b(sleep|insomnia|can'?t sleep|cannot sleep|wake|anxiety|anxious|stress|overwhelm|panic|pain|inflamm|joint|arthritis|fatigue|tired|exhausted|energy|brain fog|focus|gut|digest|bloat|constipat|ibs|diarrhea|mood|depress|sad|blood sugar|insulin|weight|glp-?1|semaglutide|ozempic|metabolic|cholesterol|heart|blood pressure|immune|sick|hormone|thyroid|menopause|supplement|vitamin|magnesium|melatonin|omega|probiotic|berberine|protocol|product|cart|amazon|fullscript|stripe|subscribe|subscription)\b/i;
const firstResponse = !hasPriorAssistantTurn(p || {}, opts.priorMessages);
const supportTier = !!opts.supportTier || checkEmotionalIntent(sessionId, message);
if (crisisTier) reason = 'crisis_tier';
return { allowed: !reason, reason, firstResponse, supportTier, crisisTier, hasConcern };
```

#### Commerce steward suppression, lines 1819-1828

**Purpose:** Prevent commerce cards from being emitted when the gate blocks commerce.

Critical lines:

```js
if (!commerceGate.allowed) {
  memoryBrain(ctx, intent, { matched: [], no_match: true }, { decision: 'block', badge: null }, { max_cards: 0, reason: commerceGate.reason });
  logDecision({
    outputs: { cards_count: 0, suppressed: true, reason: commerceGate.reason, first_response: commerceGate.firstResponse, has_concern: commerceGate.hasConcern }
  });
```

#### Chat prompt injection, lines 2636-2637 and 2785-2786

**Purpose:** Apply the gate to both non-stream and stream chat prompt construction after server-authoritative short-term history is loaded.

Critical lines:

```js
p._commerceGate = getCommerceGate(p, crisis, { priorMessages: shortTerm, supportTier: suppressCommerce });
sys = appendCommerceGatePrompt(sys, p._commerceGate);
```

The same two-line pattern appears in the second chat path:

```js
p._commerceGate = getCommerceGate(p, crisis, { priorMessages: shortTerm, supportTier: suppressCommerce });
sys = appendCommerceGatePrompt(sys, p._commerceGate);
```

#### Commerce gate test harness, lines 4156-4173

**Purpose:** Provide an environment-triggered smoke harness for first-response, follow-up, no-concern, crisis, and support-tier gate behavior.

Critical lines:

```js
if (process.env.BLEU_TEST_COMMERCE_GATE === '1') {
  const cases = [
    ['first concern blocks', { message: 'I cannot sleep', history: [] }, { detected: false }, {}, 'first_response'],
    ['support blocks', { message: 'I am overwhelmed and need help', history: [{ role: 'assistant', content: 'Tell me more.' }] }, { detected: false }, { supportTier: true }, 'support_tier'],
```

### PR #6 — `supabase/functions/alvai/index.ts`

#### Edge commerce gate helpers, lines 1296-1320

**Purpose:** Mirror commerce gating inside the Supabase ALVAI function.

Critical lines:

```ts
const COMMERCE_CONCERN_RE = /\b(sleep|insomnia|can'?t sleep|cannot sleep|wake|anxiety|anxious|stress|overwhelm|panic|pain|inflamm|joint|arthritis|fatigue|tired|exhausted|energy|brain fog|focus|gut|digest|bloat|constipat|ibs|diarrhea|mood|depress|sad|blood sugar|insulin|weight|glp-?1|semaglutide|ozempic|metabolic|cholesterol|heart|blood pressure|immune|sick|hormone|thyroid|menopause|supplement|vitamin|magnesium|melatonin|omega|probiotic|berberine|protocol|product|cart|amazon|fullscript|stripe|subscribe|subscription|therapy|therapist|counselor)\b/i;
const firstResponse = !hasPriorAssistantTurn(messages);
if (isCrisis) reason = "crisis_tier";
else if (supportTier) reason = "support_tier";
return { allowed: !reason, reason, firstResponse, supportTier, hasConcern };
```

#### Gate creation, line 2156

**Purpose:** Calculate edge commerce permission after safety/crisis status is known.

Critical lines:

```ts
const commerceGate = getCommerceGate(messages, userText, isCrisis, safetyResult.risk_tier || 0);
```

#### Marketplace/product suppression, lines 2189 and 2202

**Purpose:** Suppress marketplace practitioners and verified products unless commerce is allowed.

Critical lines:

```ts
if (commerceGate.allowed && marketplacePractitioners && marketplacePractitioners.length > 0) {
```

```ts
if (commerceGate.allowed && products?.length > 0) {
```

#### Affiliate/prescription/bundle suppression and prompt injection, lines 2213-2217 and 2255

**Purpose:** Suppress generated commercial context and inject restraint language into the model prompt.

Critical lines:

```ts
const affiliateLayer = commerceGate.allowed ? detectAffiliates(userText) : "";
const prescriptionLayer = commerceGate.allowed ? generatePrescription(userText, currentBiomarkers, isCrisis) : "";
const pathways = commerceGate.allowed ? classifyPathway(userText, currentBiomarkers) : [];
const bundleLayer = commerceGate.allowed ? generateBundleCart(pathways) : "";
const commerceGateLayer = getCommerceGateLayer(commerceGate);
```

```ts
const systemPrompt = [ALVAI_SYSTEM_PROMPT, modeLayer, therapyLayer, recoveryLayer, commerceGateLayer, contextData, prescriptionLayer, bundleLayer, affiliateLayer, passportLayer, trustLayer, simulationLayer, VOICE_SEAL]
```

### PR #9 exact code

I do not know. PR #9's diff was not available in this local checkout and could not be fetched because external GitHub access was blocked by HTTP CONNECT 403. Do not rely on this audit for exact PR #9 line quotations until someone with GitHub access exports PR #9's diff or the PR branch is present locally.

## Q4 — Turns-to-first-commerce after each PR

### If PR #6 alone is merged

Commerce can surface no earlier than the second assistant response, and only if all of these are true:

1. There is at least one prior assistant message in short-term history or supplied history.
2. The current user message matches `COMMERCE_CONCERN_RE`.
3. The request is not crisis-tier.
4. The request is not support/emotional-tier.

On the first assistant response, PR #6 blocks commerce even when the user states a relevant concern such as `I cannot sleep`. The test harness encodes that as expected reason `first_response`. On a second assistant response with an explicit concern, the harness expects commerce to be allowed.

### If PR #9 alone is merged

Unknown from primary evidence. Based only on the user-provided PR description, PR #9 appears to have the same intended turns-to-commerce behavior as PR #6: first response blocks, follow-up with a stated concern may allow, no-concern/crisis/support-tier blocks. This is not independently verified.

### If both are merged together

Unknown and likely conflict-prone. If both gates are semantically similar and one wins cleanly, expected behavior would remain: no first-turn commerce; earliest commerce is a second assistant response with a stated concern and no support/crisis suppression. If both gates are stacked or partially duplicated, stricter behavior could result, or conflicting prompt language could appear. This requires human review of PR #9's actual conflict regions.

## Q5 — Conflict analysis

### PR #6 merge readiness

PR #6 is already merged in this checkout as merge commit `3515b1c`. There are no current local conflict markers in `server.js` or `supabase/functions/alvai/index.ts`.

### PR #9 conflict analysis

PR #9 is reported by the user as having merge conflicts against `main`, but I cannot list exact conflict files or line ranges from primary evidence because the PR #9 branch/diff is not available locally and GitHub fetch is blocked. Given the reported files and the verified PR #6 line ranges, likely overlap areas are:

- `server.js` around the commerce helper insertion near current lines 803-830.
- `server.js` around `runCommerceSteward()` near current lines 1778-1830.
- `server.js` around chat prompt construction near current lines 2636-2637 and 2785-2786.
- `server.js` around the test harness near current lines 4156-4173.
- `supabase/functions/alvai/index.ts` around commerce helpers near current lines 1296-1320.
- `supabase/functions/alvai/index.ts` around context assembly and commerce layers near current lines 2156-2255.

Because these are clinical/commerce policy surfaces, conflicts should not be auto-resolved blindly. They require human judgment to preserve the intended restraint semantics and avoid reintroducing first-turn BetterHelp/product/card language.

## Q6 — Regression risk for each PR

### PR #6 regression risk

- **Touches `core/safety/canonical_crisis_patterns.js`:** No. Verified PR #6 modifies only `server.js` and `supabase/functions/alvai/index.ts`.
- **Changes Stripe pricing or product catalog:** No direct product catalog or Stripe pricing file is changed. The diff contains the words `Stripe`, `prices`, and product/pricing strings only inside commerce-restraint prompt text or unchanged surrounding code, not as catalog mutations.
- **Modifies schemas under `core/schemas/`:** No.
- **Breaks smoke tests when applied:** No break observed in this checkout. `node --check server.js`, `BLEU_TEST_COMMERCE_GATE=1 node server.js`, and `npm test` pass.
- **Uncommitted side effects / env vars / dependencies / migrations:** None observed. PR #6 adds no dependency files and no migrations. It adds one optional test env trigger: `BLEU_TEST_COMMERCE_GATE=1`.

**Risk note:** The Supabase edge function still contains older, strong commerce instructions in `ALVAI_SYSTEM_PROMPT`, including a mental-health override that says a BetterHelp card is first output when the user mentions anxiety/stress/therapy. PR #6 adds a later `commerceGateLayer`, but it does not delete those older instructions. This creates prompt-conflict risk: the new restraint layer competes with an existing non-negotiable commerce card instruction. The verified lines currently show the older edge prompt requiring card-first behavior for mental health mentions and the new gate layer being appended later in the system prompt.

### PR #9 regression risk

Unknown from primary evidence. Reported changes are limited to `server.js` and `supabase/functions/alvai/index.ts`, which would imply no direct touch to `core/safety/canonical_crisis_patterns.js`, Stripe catalog/pricing files, or `core/schemas/`. However, this cannot be verified without the PR #9 diff. Reported test harness success is also unverified locally.

## Q7 — Disposition recommendation

**Recommendation: OPTION E — Hold both / surface to Dr. Felicia for clinical signoff before any further merge/disposition.**

Reasons:

1. **PR #6 is already merged in the local `main` history, so the operational question is no longer simply “merge PR #6 or PR #9.”** The checkout is at merge commit `3515b1c`, and PR #6's code is present in production files. Any next step should account for existing mainline state, not treat PR #6 as merely pending.
2. **PR #9 cannot be fairly accepted or rejected from this environment because its exact diff and conflict markers are unavailable.** The user-reported branch conflicts plus same-file overlap mean it should stay open as a proposal until someone exports or reviews the PR #9 diff directly.
3. **Clinical/commerce language needs Felicia review.** PR #6's edge function still has an older mental-health override requiring BetterHelp card-first behavior, while the new commerce gate adds restraint language. That is exactly the kind of clinical authority surface where human clinical signoff is appropriate before relying on prompt precedence as a safety guarantee.
4. **Do not close PR #9 yet.** Its reported approach may contain improvements over PR #6, especially if it handles conflict with older edge prompt language better. But do not merge it until conflict regions are reviewed and the scope breach is addressed institutionally.

**Practical next step:** Have a human with GitHub access export PR #9's `.diff`/files page and compare it directly against current `main` (`3515b1c`). The review should focus first on the conflict regions listed in Q5 and the edge prompt contradiction between older BetterHelp card-first instructions and the new restraint layer.

## Commands run for this audit

```bash
find .. -name AGENTS.md -print
```

```bash
git status --short --branch
```

```bash
git log --oneline -5
```

```bash
git show --stat --numstat --summary 389f108 --
```

```bash
git diff --unified=20 b80070b 389f108 -- server.js supabase/functions/alvai/index.ts
```

```bash
rg -n "COMMERCE_CONCERN_RE|hasPriorAssistantTurn|hasRecentCommerceConcern|getCommerceGate|appendCommerceGatePrompt|BLEU_TEST_COMMERCE_GATE|commerceGate|runCommerceSteward|marketplacePractitioners|affiliateLayer|prescriptionLayer|bundleLayer|ALVAI_SYSTEM_PROMPT|BetterHelp|weekly" server.js supabase/functions/alvai/index.ts
```

```bash
node --check server.js
```

```bash
BLEU_TEST_COMMERCE_GATE=1 node server.js
```

```bash
npm test
```

```bash
deno check supabase/functions/alvai/index.ts
```

The Deno check could not run because `deno` is not installed in this container.
