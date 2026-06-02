# Captain Soul-Gate Calibration Audit — Full Repo State Enumeration

Date: 2026-06-02.
Repo: `bleudreamzone-coder/bleu-system`.
Local branch during audit: `codex/calibration-audit-repo-state-2026-06-02`.
Local HEAD before this audit file: `fa90d8d80e568150b1b794dc8a3dcbe9a7adef83` (`Merge pull request #23 from bleudreamzone-coder/codex/add-outcome_checkpoints-schema`).
Tone: institutional auditor voice. Ground truth first; reassurance second.

## Audit Method and Limitations

1. Local git had no usable remote data at start of audit beyond local branch `work`; `git remote -v` initially returned no configured remote output, and only local branch `work` existed.
2. I added `origin=https://github.com/bleudreamzone-coder/bleu-system.git` for attempted enumeration, but `git fetch --prune origin '+refs/heads/*:refs/remotes/origin/*' '+refs/pull/*/head:refs/remotes/origin/pr/*'` failed with `CONNECT tunnel failed, response 403`.
3. Direct Python access to `https://api.github.com/repos/bleudreamzone-coder/bleu-system` also failed with `URLError <urlopen error Tunnel connection failed: 403 Forbidden>`.
4. Therefore, GitHub API-level mergeability, true remote branch ahead counts, and exact created/updated timestamps could not be fetched from the terminal.
5. Public GitHub HTML pages were reachable through the web view. Those pages were used for PR title, status, branch, author, commit count, visible changed-file counts, visible diff stats, and Codex Connector comments.
6. Where GitHub HTML exposes conflicting snapshots, this audit names the conflict instead of pretending certainty. Example: the generic `/pulls` page without an explicit open filter showed stale PRs #3 and #6, while `?q=is%3Apr+is%3Aopen` showed #21 and #22 as the two current open PRs.
7. The local repository contains authoritative merge commits through PR #23; those merge commits were used for the Day 83 shipped record.
8. No files outside this audit document were intentionally modified.

## Section 1 — Every Open Pull Request Right Now

GitHub's explicit open-filter page reports `2 Open` / `21 Closed` and lists PR #22 and PR #21 as the two open PRs (source: `https://github.com/bleudreamzone-coder/bleu-system/pulls?q=is%3Apr+is%3Aopen`, lines 180-264 in web view).

### PR #22 — `refactor(cannaiq): remove BUD V5 cross-repo intercept`

- PR number: #22.
- Title: `refactor(cannaiq): remove BUD V5 cross-repo intercept`.
- Author: `bleudreamzone-coder` / Captain owner account.
- Branch: `codex/execute-multi-pr-system-up-workflow`.
- Created date: Jun 2, 2026.
- Last activity date: Jun 2, 2026, visible latest commit `6525cad`.
- Number of commits: 1.
- Files modified: 3 visible files: `_meta/audits/2026-05-29-bud-v5-excision.md`, `server.js`, `tests/integration/per-mode-chat.smoke.js`.
- Total lines added / removed: +45 / -576.
- Merge readiness status: needs review / likely superseded. GitHub HTML says open, but local main already contains merge commit #20 with the same BUD V5 excision theme.
- ChatGPT Codex Connector comment/review: no review comments visible; one thumbs-up reaction by `chatgpt-codex-connector[bot]` is visible.
- Plain-language summary: PR #22 removes the standalone BUD V5 cross-repo prompt from BLEU's `server.js`, preserves local CannaIQ surfaces, updates the per-mode smoke harness comment, and adds an excision audit. This is production-code touching work because it modifies `server.js`, so it cannot be treated as a routine merge from this audit.

### PR #21 — `Add Signal Object v1.1 JSON Schema, fixtures, and schema tests`

- PR number: #21.
- Title: `Add Signal Object v1.1 JSON Schema, fixtures, and schema tests`.
- Author: `bleudreamzone-coder` / Captain owner account.
- Branch: `codex/merge-pr-#4-and-close-pr-#3`.
- Created date: Jun 2, 2026.
- Last activity date: Jun 2, 2026, visible latest commit `0bcee6a`.
- Number of commits: 1.
- Files modified: GitHub HTML shows one `.js`, seven `.json`, and one `.md` file class; visible file tree includes `core/schemas/README.md`, `core/schemas/signal_object_v1.1.schema.json`, `package-lock.json`, `package.json`, four `tests/fixtures/signal_object/*.json` fixtures, and `tests/schemas/signal_object_v1_1.test.js`.
- Total lines added / removed: exact aggregate line count was not visible in the accessible HTML. Visible per-file examples include `core/schemas/README.md` +24 and `core/schemas/signal_object_v1.1.schema.json` +191.
- Merge readiness status: needs review / likely superseded. It modifies a schema and package metadata, and local main already contains a merged Signal Object schema path from PR #5.
- ChatGPT Codex Connector comment/review: yes. Codex reviewed commit `0bcee6ae48` and left P1/P2 comments about Ajv strict schema type requirements and incomplete vulnerability-floor enforcement.
- Plain-language summary: PR #21 adds an early Signal Object v1.1 schema, fixtures, tests, and package changes. The current main already has a later Signal Object v1.1 test suite passing through `npm run test:schemas`, so this PR appears to be an older duplicate/superseded branch, not a clean merge candidate.

## Section 2 — Recent Merges (Last 24 Hours)

Local git merge commits from 2026-06-01 evening through 2026-06-02 UTC, chronological oldest to newest:

1. PR #8 — `docs(audit): add 2026-06-01 state-of-institution snapshot`; merge commit `b80070b3656c57d06e871885199d7183da52a72e`; merger/author `bleudreamzone-coder`; merged `2026-06-01 18:48:06 -0500`. Summary: shipped a state-of-institution audit snapshot.
2. PR #6 — `Constrain early ALVAI commerce surfaces`; merge commit `3515b1c07d1cae7a88503933caf68952fd78794e`; merger/author `bleudreamzone-coder`; merged `2026-06-01 18:53:03 -0500`. Summary: shipped early ALVAI commerce-restraint gating.
3. PR #10 — `docs(audit): PR 6 vs PR 9 commerce restraint comparative review`; merge commit `d449cabfa392cc30a4885f3b5bfcea72e79d69bb`; merger/author `bleudreamzone-coder`; merged `2026-06-01 19:07:36 -0500`. Summary: shipped the PR #6 / PR #9 scope-breach comparison audit.
4. PR #11 — `feat(schemas): add Decision Object v1.1 schema in shadow mode`; merge commit `33a904c64f0a47aeb4eb09b113fe7772ccd4f576`; merger/author `bleudreamzone-coder`; merged `2026-06-01 19:23:47 -0500`. Summary: shipped Decision Object shadow schema fixtures/tests.
5. PR #12 — `feat(schemas): add Trust Packet v1.1 schema in shadow mode`; merge commit `3ffbb4473c36e981aff460472ec98cd200def52f`; merger/author `bleudreamzone-coder`; merged `2026-06-01 19:29:46 -0500`. Summary: shipped Trust Packet shadow schema fixtures/tests.
6. PR #13 — `feat(config): add Variant Taxonomy v1 runtime config (34 variants) and tests`; merge commit `3ff35d8be5df969b570bed0b68570b47a6194121`; merger/author `bleudreamzone-coder`; merged `2026-06-01 19:40:58 -0500`. Summary: shipped variant taxonomy runtime config.
7. PR #14 — `feat(agents): add SDK adapter scaffold`; merge commit `a263e03329c9095bca4ea2faa09318cbfe5fbd16`; merger/author `bleudreamzone-coder`; merged `2026-06-01 20:09:58 -0500`. Summary: shipped dormant Agents SDK adapter scaffold.
8. PR #15 — `feat(agents): add shadow runner infrastructure (dormant by default)`; merge commit `a66de3af37b91d1fe91ce90f470ccbb1b0b3a428`; merger/author `bleudreamzone-coder`; merged `2026-06-01 20:17:44 -0500`. Summary: shipped dormant shadow-runner infrastructure.
9. PR #16 — `feat(agents): add memory architecture schema (shadow mode, stub adapter)`; merge commit `c1d58eb7752a1bf243442ffd538a8a7df8b0989e`; merger/author `bleudreamzone-coder`; merged `2026-06-01 20:26:15 -0500`. Summary: shipped memory architecture schema and stub adapter.
10. PR #17 — `feat(agents): add tool registry schema v1.1 (shadow mode, empty registry)`; merge commit `b42124d6b3108b13478524185b45950c93470a28`; merger/author `bleudreamzone-coder`; merged `2026-06-01 20:39:59 -0500`. Summary: shipped empty tool registry schema.
11. PR #18 — `feat(metrics): add metric_event v1.1 schema and dormant stub emitter`; merge commit `83f2d36c02dc70d2b6c126aaa3ea64c4abc38388`; merger/author `bleudreamzone-coder`; merged `2026-06-01 20:58:19 -0500`. Summary: shipped metric event schema and dormant emitter.
12. PR #19 — `feat(review): add counterfactual_review v1.1 schema with triple-defense authority chain`; merge commit `0fa4688e6e28a9c54b26b5ee39c9ba4cab4c4dbf`; merger/author `bleudreamzone-coder`; merged `2026-06-01 21:11:24 -0500`. Summary: shipped counterfactual review schema.
13. PR #20 — `refactor(server): excise BUD V5 cross-repo intercept`; merge commit `26b4f72cd245236f3012a0a5c2516343691adb88`; merger/author `bleudreamzone-coder`; merged `2026-06-01 21:25:37 -0500`. Summary: shipped BUD V5 cross-repo intercept excision into local main.
14. PR #23 — `feat(outcomes): add outcome_checkpoint v1.1 schema with stub adapter and triple PII protection`; merge commit `fa90d8d80e568150b1b794dc8a3dcbe9a7adef83`; merger/author `bleudreamzone-coder`; merged `2026-06-01 21:29:53 -0500`. Summary: shipped outcome checkpoint schema/tests and adapter.

## Section 3 — Branches Without Associated Pull Requests

Remote branch enumeration is limited. Terminal fetch of `refs/heads/*` failed with HTTP tunnel 403, so exact ahead counts and PR associations could not be computed locally.

GitHub's branch HTML lists many `codex/*` branches updated Jun 1-2, including branches already associated with merged PRs (#5, #6, #8, #10-#20, #23) plus current open-PR branches `codex/execute-multi-pr-system-up-workflow` and `codex/merge-pr-#4-and-close-pr-#3`.

Potential orphan / cleanup candidates visible from branch HTML:

1. `codex/review-contents-of-pr-#6` — updated Jun 1, 2026. No associated open or merged PR found in the current open list or local merge-log PR titles. Best estimate: audit/review residue from the PR #6 / PR #9 comparison sequence. Commits-ahead count unknown due blocked fetch. Codex naming pattern: yes.
2. All other visible `codex/*` branches correspond either to an open PR (#21/#22) or a locally merged PR (#5, #6, #8, #10-#20, #23). They may still exist remotely after merge; this is branch-cleanup residue, not automatically orphaned work.

## Section 4 — Codex Cloud Task State

Visible PR descriptions contain a `Codex Task` link placeholder, but the accessible GitHub HTML returned `Sorry, something went wrong` instead of exposing the full `chatgpt.com/codex/cloud/tasks/task_e_*` URL.

Task cross-reference from accessible evidence:

1. PR #22 — Codex Task link present; task ID not visible; PR status open by GitHub open-filter page, but locally superseded by merged PR #20.
2. PR #21 — Codex Task link present; task ID not visible; PR status open by GitHub open-filter page, but locally superseded by merged PR #5.
3. PR #23 — merged in local git and listed as closed/merged by GitHub closed-filter page; task URL not visible from terminal or local merge commit.
4. PR #20 — merged in local git and listed as closed/merged by GitHub closed-filter page; task URL not visible from terminal or local merge commit.
5. PRs #8, #10-#19 — merged in local git; task URLs not visible from local merge commits. GitHub closed-filter listing confirms their closed/merged status but does not expose task URLs in the accessible listing.

Potential abandoned Codex completed work: no task URL can be proven abandoned from accessible evidence. The open PRs #21/#22 are the only visible current task residues.

## Section 5 — PRs Needing Captain Action

### PR #22 — 🔴 CLOSE AS SUPERSEDED / 🟠 NEEDS REVIEW if Captain disagrees

Recommendation: close PR #22 as superseded by merged PR #20, unless Captain knows PR #22 contains a materially different delta not present in PR #20.

Justification: PR #22 touches `server.js`, so the prompt's explicit rule forbids recommending a merge without at least 🟠 review. Local git already shows PR #20 merged with `refactor(server): excise BUD V5 cross-repo intercept per severance doctrine` at merge commit `26b4f72cd245236f3012a0a5c2516343691adb88`; PR #22's subject and description are the same BUD V5 excision surface. Because `node --check server.js`, schema tests, and dry-run smoke all pass at local HEAD after PR #20/#23, this looks like duplicate residue rather than a merge-now item.

Suggested close comment:

> Closing as superseded by merged PR #20 (`26b4f72cd245236f3012a0a5c2516343691adb88`), which shipped the BUD V5 cross-repo intercept excision. No further Captain action on this duplicate branch unless a diff review shows material changes not present in #20.

### PR #21 — 🔴 CLOSE AS SUPERSEDED / 🟠 NEEDS REVIEW if Captain disagrees

Recommendation: close PR #21 as superseded by merged PR #5 and the current cumulative schema stack, unless Captain wants to salvage a specific fixture or README detail.

Justification: PR #21 modifies a `*.schema.json` file and package metadata, so the prompt bars a merge recommendation without review. Local git already has PR #5 merged for Signal Object v1.1, and current `npm run test:schemas` reports Signal Object `5/5` passing plus all downstream schema suites passing. Codex also left a P1 review on PR #21 about strict Ajv compilation failure and a P2 review about incomplete vulnerability-floor enforcement, making it unsafe as a merge-now candidate.

Suggested close comment:

> Closing as superseded by merged PR #5 and the current main schema stack. Current `npm run test:schemas` reports Signal Object `5/5` passing, and PR #21 still has Codex review findings about Ajv strict mode and vulnerability-floor enforcement. If any fixture/README content is still desired, reopen as a narrow follow-up patch.

Felicia hold assessment: neither PR needs a fresh 🟡 Felicia hold as the primary action. PR #22 is production-server code but described as technical hygiene, and PR #21 is schema scaffolding; both are better handled as duplicate/superseded closures. If Captain chooses to review and revive either PR, PR #22 should receive explicit review because it touches production routing surfaces.

## Section 6 — Cumulative Schema Test State

Commands run from `/workspace/bleu-system` on 2026-06-02:

1. `node --check server.js` — PASS, exit code 0.
2. `npm run test:schemas` — PASS, exit code 0. npm emitted warning `Unknown env config "http-proxy"`; this warning did not fail the test.
3. `node tests/integration/per-mode-chat.smoke.js` — PASS dry-run, exit code 0.

Per-suite schema breakdown from `npm run test:schemas`:

- signal-object: 5 / 5.
- decision-object: 6 / 6.
- trust-packet: 5 / 5.
- variant-taxonomy: 4 / 4.
- adapter-shape: 6 / 6.
- shadow-runner-shape: 5 / 5.
- memory-architecture: 7 / 7.
- tool-registry: 7 / 7.
- metric-event: 11 / 11.
- counterfactual-review: 16 / 16.
- weekly-scorecard: not present in current `npm run test:schemas` command, so Lima is not represented in local HEAD by this suite.
- outcome-checkpoint: 23 / 23.
- Total counted fixture assertions: 94 / 94.

Smoke dry-run details: the smoke harness stayed in DRY RUN mode, listed 14 modes, confirmed the leak helper self-test, and printed `DRY RUN OK — re-run with RUN_LIVE=1 to execute live`.

No 🔴 test/check blocker found in the three requested checks.

## Section 7 — Captain Action Checklist

1. Close PR #22 as superseded by PR #20. Acceptance criteria: PR #22 is closed with the suggested supersession comment citing merge commit `26b4f72cd245236f3012a0a5c2516343691adb88`.
2. Close PR #21 as superseded by PR #5/current schema stack. Acceptance criteria: PR #21 is closed with the suggested supersession comment citing current Signal Object `5/5` schema pass and Codex review findings.
3. Investigate remote branch `codex/review-contents-of-pr-#6`. Acceptance criteria: Captain decides whether it was intentionally retained, should be deleted after PR #10's audit merge, or should become a narrow PR.
4. Optional branch hygiene pass: after Captain closes duplicate open PRs, delete remote branches for merged PRs only if GitHub confirms no active PR depends on them. Acceptance criteria: no branch is deleted unless its corresponding PR is merged/closed and Captain approves branch cleanup.
5. Continue only after the duplicate PR state is resolved or consciously accepted. Acceptance criteria: GitHub open PR count is either zero or contains only intentional active work.
6. No blocker resolution needed for the requested checks. Acceptance criteria: `node --check server.js`, `npm run test:schemas`, and `node tests/integration/per-mode-chat.smoke.js` remain passing after any branch cleanup.

Category counts:

- Merge now: 0.
- Review before deciding: 0 primary, 2 conditional if Captain rejects supersession and wants to revive PR #21/#22.
- Hold for Felicia: 0.
- Close as superseded: 2.
- Investigate orphan: 1.
- Test/check blocker to resolve: 0.


## Evidence Appendix — Commands and Source Pointers

### Terminal commands used

1. `pwd && git status --short --branch` confirmed the working directory and current branch state.
2. `find /workspace -name AGENTS.md -print` and `find / -maxdepth 3 -name AGENTS.md -print` found no AGENTS.md instruction files in scope.
3. `git remote -v` returned no configured remote output at initial inspection.
4. `git branch --show-current` returned `work` before the audit branch was created.
5. `git log --oneline -5` showed local HEAD at PR #23.
6. `git remote add origin https://github.com/bleudreamzone-coder/bleu-system.git` was attempted to create a fetch target.
7. `git fetch --prune origin '+refs/heads/*:refs/remotes/origin/*' '+refs/pull/*/head:refs/remotes/origin/pr/*'` failed with the 403 tunnel limitation noted above.
8. `python - <<'PY' ... urllib.request.urlopen('https://api.github.com/repos/bleudreamzone-coder/bleu-system') ... PY` failed with the 403 tunnel limitation noted above.
9. `git switch -c codex/calibration-audit-repo-state-2026-06-02` created the requested audit branch.
10. `git show-ref --head` confirmed local refs contained only HEAD and local branch state before remote fetch could populate refs.
11. `git log --merges --since='2026-06-01T00:00:00Z' --pretty='%H%x09%ci%x09%s' --reverse` provided the local Day 83 merge chronology.
12. `git log --since='2026-06-01T00:00:00Z' --format='%H%x09%an%x09%ae%x09%ci%x09%s' --reverse` checked authorship on recent local commits.
13. `node --check server.js` performed the requested syntax check.
14. `npm run test:schemas` performed the requested cumulative schema check.
15. `node tests/integration/per-mode-chat.smoke.js` performed the requested smoke dry-run.
16. `wc -l _meta/audits/2026-06-02-calibration-audit-repo-state.md` was used to verify audit length.

### GitHub web evidence used

1. Open PR list: `https://github.com/bleudreamzone-coder/bleu-system/pulls?q=is%3Apr+is%3Aopen`.
2. Closed PR list: `https://github.com/bleudreamzone-coder/bleu-system/pulls?q=is%3Apr+is%3Aclosed`.
3. PR #22 conversation page: `https://github.com/bleudreamzone-coder/bleu-system/pull/22`.
4. PR #22 files page: `https://github.com/bleudreamzone-coder/bleu-system/pull/22/files`.
5. PR #21 conversation page: `https://github.com/bleudreamzone-coder/bleu-system/pull/21`.
6. PR #21 files page: `https://github.com/bleudreamzone-coder/bleu-system/pull/21/files`.
7. Branch list page: `https://github.com/bleudreamzone-coder/bleu-system/branches/all`.
8. Historical/stale default pulls page: `https://github.com/bleudreamzone-coder/bleu-system/pulls`.
9. Historical PR #6 page: `https://github.com/bleudreamzone-coder/bleu-system/pull/6`.
10. Historical PR #3 page: `https://github.com/bleudreamzone-coder/bleu-system/pull/3`.

### Open PR evidence details

1. The explicit open-filter page reports PR #22 and PR #21, not PR #3 and PR #6.
2. PR #22 conversation page reports the base as `main` and head as `codex/execute-multi-pr-system-up-workflow`.
3. PR #22 conversation page reports one commit and shows commit `6525cad`.
4. PR #22 files page reports `+45 -576` and three changed files.
5. PR #22 files page shows `_meta/audits/2026-05-29-bud-v5-excision.md` as added with 42 additions.
6. PR #22 description says the excision removes `BUD_V5_SYSTEM_PROMPT` and the `assistant === 'Bud'` branch.
7. PR #22 description says `core/safety/canonical_crisis_patterns.js` was untouched.
8. PR #22 page shows no Codex review comments, but it shows a `chatgpt-codex-connector[bot]` thumbs-up reaction.
9. PR #21 conversation page reports the base as `main` and head as `codex/merge-pr-#4-and-close-pr-#3`.
10. PR #21 conversation page reports one commit and shows commit `0bcee6a`.
11. PR #21 files page shows file classes `.js`, `.json`, and `.md`.
12. PR #21 files page shows `core/schemas/signal_object_v1.1.schema.json` with 191 additions.
13. PR #21 files page shows `core/schemas/README.md` with 24 additions.
14. PR #21 page shows Codex reviewed commit `0bcee6ae48`.
15. PR #21 Codex review includes a P1 item about missing `type: "object"` in conditional schemas under strict Ajv.
16. PR #21 Codex review includes a P2 item about incomplete vulnerability-floor enforcement for `C3-C4` and `T0`.

### Recent merge evidence details

1. Local merge commit `b80070b3656c57d06e871885199d7183da52a72e` names PR #8.
2. Local merge commit `3515b1c07d1cae7a88503933caf68952fd78794e` names PR #6.
3. Local merge commit `d449cabfa392cc30a4885f3b5bfcea72e79d69bb` names PR #10.
4. Local merge commit `33a904c64f0a47aeb4eb09b113fe7772ccd4f576` names PR #11.
5. Local merge commit `3ffbb4473c36e981aff460472ec98cd200def52f` names PR #12.
6. Local merge commit `3ff35d8be5df969b570bed0b68570b47a6194121` names PR #13.
7. Local merge commit `a263e03329c9095bca4ea2faa09318cbfe5fbd16` names PR #14.
8. Local merge commit `a66de3af37b91d1fe91ce90f470ccbb1b0b3a428` names PR #15.
9. Local merge commit `c1d58eb7752a1bf243442ffd538a8a7df8b0989e` names PR #16.
10. Local merge commit `b42124d6b3108b13478524185b45950c93470a28` names PR #17.
11. Local merge commit `83f2d36c02dc70d2b6c126aaa3ea64c4abc38388` names PR #18.
12. Local merge commit `0fa4688e6e28a9c54b26b5ee39c9ba4cab4c4dbf` names PR #19.
13. Local merge commit `26b4f72cd245236f3012a0a5c2516343691adb88` names PR #20.
14. Local merge commit `fa90d8d80e568150b1b794dc8a3dcbe9a7adef83` names PR #23.

### Branch evidence details

1. GitHub branch HTML lists `main` updated Jun 2, 2026.
2. GitHub branch HTML lists `codex/add-outcome_checkpoints-schema`, corresponding to locally merged PR #23.
3. GitHub branch HTML lists `codex/execute-multi-pr-system-up-workflow`, corresponding to open PR #22.
4. GitHub branch HTML lists `codex/merge-pr-#4-and-close-pr-#3`, corresponding to open PR #21.
5. GitHub branch HTML lists `codex/fix-operational-blockers-for-deployment`, corresponding to locally merged PR #20.
6. GitHub branch HTML lists `codex/add-counterfactual_reviews-schema`, corresponding to locally merged PR #19.
7. GitHub branch HTML lists `codex/add-metric_events-schema-and-stub-emitter`, corresponding to locally merged PR #18.
8. GitHub branch HTML lists `codex/add-tool-registry-schema`, corresponding to locally merged PR #17.
9. GitHub branch HTML lists `codex/add-memory-architecture-schema-files`, corresponding to locally merged PR #16.
10. GitHub branch HTML lists `codex/add-shadow-runner-infrastructure`, corresponding to locally merged PR #15.
11. GitHub branch HTML lists `codex/add-agents-sdk-adapter-scaffold`, corresponding to locally merged PR #14.
12. GitHub branch HTML lists `codex/add-variant-taxonomy-v1.1-runtime-config`, corresponding to locally merged PR #13.
13. GitHub branch HTML lists `codex/add-trust-packet-v1.1-schema`, corresponding to locally merged PR #12.
14. GitHub branch HTML lists `codex/add-decision-object-v1.1-schema`, corresponding to locally merged PR #11.
15. GitHub branch HTML lists `codex/audit-pr-#6-and-pr-#9-comparison`, corresponding to locally merged PR #10.
16. GitHub branch HTML lists `codex/review-contents-of-pr-#6`; no corresponding open PR or local merge PR number was identified.
17. GitHub branch HTML lists `codex/create-state-of-institution-audit`, corresponding to locally merged PR #8.
18. GitHub branch HTML lists `codex/fix-hardcoded-ci-test-paths`, corresponding to locally merged PR #7.
19. GitHub branch HTML lists `codex/restrict-premature-commerce-in-alvai-flow`, corresponding to locally merged PR #6.
20. GitHub branch HTML lists `codex/create-signal-object-v1.1-schema-files`, corresponding to locally merged PR #5.

## Final Audit Finding

The repo is not build-broken in the requested checks. The messy part is not local test state; it is GitHub PR/branch residue. Local main has shipped through PR #23 and passes the cumulative schema stack. GitHub still reports two open PRs (#21 and #22) that appear duplicated/superseded by already merged work (#5 and #20 respectively). Captain's safest next move is cleanup, not another merge.
