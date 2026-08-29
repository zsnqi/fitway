# Phase 11 Uptime mobile fidelity — fresh b02 attempt plan

- Status: `PLAN_REPAIR_2_READY`; independent review rejected the initial plan and repair 1 before activation. This is the final permitted focused plan correction and requires a fresh independent review. Another plan rejection stops Uptime planning for new human direction. The future implementation repair budget remains `0/2`. The human explicitly authorized a fresh Uptime attempt on 2026-08-29 with a new reviewed plan and fresh bounded repair budget. This is not B2 repair 3.
- Planning anchor: clean coordinator branch `codex/remaining-scope-coordinator` at `a3e64573630f4953bea717d238f0f8b357540391`.
- Execution base if the plan passes: a coordinator-only activation commit on the then-current authoritative coordinator branch. The fresh b02 worktree starts there, never from b01. It carries forward only the three accepted source commits `3a02a126ba3031c0b4c3f12934ee2dffd97065dd`, `b04215cada5c717b3e115b3a34d585b5039b34c4`, and `04c2d3be01c14a42974666af636c96f2ed23ce39` as new b02 commits with byte-identical resulting source. The terminal b01 branch, its uncommitted B2 candidate at SHA-256 `a0e69ed02e833227883da7a3b5577c7a520b99ca18f386e842010aa5a9fc64aa`, its `2/2` budget, and all terminal records remain immutable.
- Fresh attempt identity: `phase11-uptime-mobile-fidelity-b02`; prospective branch `work/phase11-uptime-mobile-fidelity-b02`; prospective worktree `C:/Users/Pc Force/.codex/worktrees/p11-uptime-mobile-b02`; run ID `p11_uptime_mobile_b02`; validation repair budget `0/2`.

## Objective

Deliver a reviewable executable browser contract for the already accepted Uptime A1/A2/B1 mobile implementation. The contract must fail when localized region names, record values, shown/total lanes, count paint/containment, natural auto-height behavior, or locked Arabic delivery wording regress, while preserving every previously accepted runtime, accessibility, responsive, RTL/LTR, desktop, and canonical check.

Observable success is a fresh one-file test implementation, on top of a separately reviewed byte-identical carry-forward of accepted A1/A2/B1 source, that passes independent source review before execution and then proves the accepted Owner Health UI at all nine required widths in both locales without changing accepted production bytes, copy, Paper, or canonical screenshots.

## Authority and locked boundaries

- Human decision: fresh Uptime attempt authorized; the failed b01/B2 lineage remains history and grants no repair 3.
- Accepted production boundary: Uptime A1/A2/B1 at `04c2d3be01c14a42974666af636c96f2ed23ce39`; accepted Paper successor `1DZC-0`; existing desktop composition and canonical baselines remain fixed.
- Rejected B2 files and reviews are negative evidence only. No failed B2 commit or uncommitted file may be cherry-picked, copied wholesale, reset, amended, or treated as an accepted candidate. Only the three accepted source commits named above may be carried forward.
- Locked product/data/copy behavior remains unchanged. Exact independent literals come from the accepted visible strings already recorded in current source and prior authority records; production catalogs are never used as the test oracle.
- No Paper edit, product decision, source repair, canonical promotion, shared token change, or server/API/schema/router work is authorized.

## Scope and rollback

The only new implementation file is `tests/browser/phase11-health.browser.spec.ts` in the fresh b02 worktree. Before that test stage, one carry-forward stage may write exactly `owner-health-view.tsx`, `owner-health.css`, and `owner-health-section.tsx` by applying the three accepted source commits without alteration; after source hashes match accepted B1, those paths become frozen. The worker may write only a new `*-p11_uptime_mobile_b02-worker-*.md` handoff on its branch. Coordinator-only plan/review/route/verification records and `PROJECT_STATE.yaml` remain coordinator-owned.

Everything else is forbidden, including any production change beyond the exact accepted carry-forward bytes, message catalogs, hooks, canonical PNGs, test configuration, root manifests/lockfiles, normative authorities, Paper, server/API/database paths, and the preserved b01 worktree.

Rollback boundaries: revert the handoff commit first, then test, B1 carry-forward, A2 carry-forward, and A1 carry-forward in reverse order. The state after each revert is respectively the test candidate without a stale handoff, frozen accepted carry-forward, accepted A1/A2, accepted A1, and the coordinator activation tree. Each b02 commit has one parent and leaves b01 untouched.

## Stage sequence

### Stage 0 — independent plan review

A fresh read-only reviewer checks this plan against the terminal B2 findings, the accepted B1 source, current Owner Health markup/CSS/copy, repository workflow, and the actual planned verification commands. The reviewer must reject any false-pass seam, hidden production mutation, ambiguous paint oracle, non-executable criterion, or route/repair-accounting gap. No branch, worktree, lease, source edit, or runtime gate exists before `PLAN_REVIEW_PASS`.

Plan-review corrections do not consume the future source-validation budget because no implementation candidate exists. Two failed focused plan corrections stop planning and require a new human-reviewed direction.

### Stage 1 — coordinator activation and accepted source carry-forward

After `PLAN_REVIEW_PASS`, the coordinator registers the existing `phase11-health` profile and exact browser path for b02, changes only the b02 ledger block to `READY`, records branch/worktree/run IDs, three disposable databases, lease, activation handoff, and `baseCommit: SELF`, and commits that live state. The exact command block creates `work/phase11-uptime-mobile-fidelity-b02` and its non-overlapping worktree from that recorded activation commit, enters it, and fails on any branch/HEAD/status mismatch.

Before any source or test edit, run `pnpm install --frozen-lockfile`, require `pnpm exec vitest --version` to print a version, and provision the ignored `apps/server/.env` from the coordinator worktree without printing or copying it into tracked files. Record the actual initial HEAD and clean status.

Apply the accepted A1, A2, and B1 source-only commits in order with three separate `git cherry-pick` operations, producing three new single-parent b02 carry-forward commits. The fail-fast command block checks each commit's sole changed path and target blob against the accepted commit before continuing. After B1, exact three-source equality, focused component tests, web type-check/build, full activation-to-B1 allowlist, and a fresh read-only carry-forward scope review must pass before the test lease opens. Any conflict, extra path, missing review, or byte difference is rejection, not a repair of accepted source.

### Stage 2 — fresh browser-contract implementation

Start from the committed B1 browser spec now present on the fresh branch; consult the terminal B2 candidate only as rejected evidence and write a new bounded contract.

The contract must preserve all existing Uptime functional/state/timezone/request/sibling-route, keyboard/focus, forced-colors, reduced-motion, 200% reflow, axe, screenshot, and canonical assertions, and add these independently reviewable oracles:

1. Assert each offline/incident region with `getByRole("region", { name: expected, exact: true })` in Arabic and English; substring matches are forbidden.
2. Pin exact independent literals for every static label/state word exercised by the responsive contract, including Arabic `غير مؤكد` and English `unconfirmed`, and exercise them in rendered output. Locale-formatted dates, times, durations, and numbers use frozen fixture-derived structural oracles and exact Western-digit/`bdi` assertions rather than hard-coded ICU punctuation.
3. A file-local literal `expectedCells` matrix independently enumerates the exact accessible name for all 3×4 offline and 2×5 incident cells in both locales. It calls no production formatter, catalog, or helper; dates/times/durations are frozen literal outputs for the fixed fixture. At 320/360/390 every cell uses `getByRole("cell", { name: expected, exact: true })` plus exact `ariaSnapshot`, so `aria-hidden`, `inert`, or hidden ancestry fails. Before measurement wait for `document.fonts.ready`. For every value text fragment and its complete owner/ancestor chain, require non-empty range rects within 1px tolerance, visible display/content/opacity, nontransparent `color` and `-webkit-text-fill-color`, `filter:none`, `mask-image:none`, no clipping/finite max-block constraint, and containment inside cell, region, owning `.owner-health-block`, and viewport. `elementsFromPoint` plus a separate rectangle-intersection scan of every visible positioned descendant/sibling rejects opaque overlays even with `pointer-events:none`. Pseudo coverage is deterministic: for `::before`/`::after`, only `content:none|normal` or a fully transparent background is accepted; any nonempty positioned pseudo with zero insets or computed width/height intersecting a text sample is rejected.
4. Use two separate, table-bound count chains at 320/360/390 in Arabic and English. Board-header counts prove exact visible/accessibility text and paint for both numeric `bdi` ranges and the connector text node inside count lane → header → the region that owns that exact table. Bounded fixtures set each total above returned rows; each matching `.owner-health-block` must contain exactly one expected table and one summary. The summary proves exact visible/accessibility text and paint for label, connector, and both numeric ranges inside summary → that owning block → viewport/document. Swapping summaries between blocks, transparent connectors, hidden accessibility ancestry, or below-390 clipping must fail.
5. Prove natural mobile auto-height at 320/360/390 in both locales on the first incident row's fifth delivery cell and its owning block. Assert computed `height/block-size` is content-derived, `max-block-size:none`, and nonclipping overflow for cell, row, `tbody`, region, and block; scan matching mobile CSS rules and reject authored fixed/finite `height`, `block-size`, `max-height`, or `max-block-size` on those layers. In `try/finally`, append a `grid-column:1/-1`, `display:block`, `white-space:pre-wrap` span containing eight explicit 20px lines, wait two animation frames, and require every layer to grow by at least 100px without scroll clipping, then restore within 1px. At 320 and 390 in both locales, reversible fixed-baseline, oversized 2000px block-size, finite 4000px max-block-size, and outer-block clipping controls must each make the helper return false, then restore all styles.
6. Retain exact semantic column headers/scopes, record/field counts, DOM order, RTL/LTR lane reflection, bidi isolation, 390px Paper dimensions, below-390 contraction, the 720/721 breakpoint, desktop sticky-table behavior, and document/region overflow rules.

The paint helper must prove its own sensitivity with reversible negative controls before acceptance: transparent `color`/`-webkit-text-fill-color`, `filter:opacity(0)`, CSS masking, `aria-hidden` ancestry, a same-host opaque zero-inset `::after`, opaque positioned sibling and descendant overlays including `pointer-events:none`, transformed off-clip placement, and clipped ancestry must each make the applicable evidence return false, after which DOM/style state restores in `finally`. Existing 390/1440 screenshot assertions and axe color-contrast checks remain a separate visual backstop.

The bounded incident fixture sets the first incident to `unconfirmed: 1` with coherent notice totals. Its fifth-cell literal must include English `1 unconfirmed` and Arabic `1 غير مؤكد`; the aggregate metric alone never satisfies this oracle.

The implementation writer commits the test-only change, then writes and commits only its b02 worker handoff citing the test commit and non-runtime checks. It runs the exact pre-review freeze block over the complete candidate before source review. That block proves: each carry commit one-parent/one-file/exact-blob, test commit one-file, handoff commit one-file, full activation-to-candidate allowlist, source equality, repository invariants, Biome, focused component tests, web type/build, clean status, and whitespace. It runs no Playwright, phase, integration, Browser, or visual gate. Any need for new production bytes, copy, Paper, canonical, configuration, or a second test file is an immediate stop, not scope expansion.

### Stage 3 — independent source review and cumulative repair accounting

A fresh read-only reviewer inspects the frozen one-file test diff and complete candidate topology against Standards and Spec/accepted Paper axes before any Playwright, phase, integration, Browser, or visual execution. The review must construct at least one adversarial counterexample for each new oracle and confirm the test would fail it.

The first formally submitted candidate begins at repair `0/2`. Any source-review, mechanical, runtime, Browser/Paper, accessibility, canonical, repository, or final independent-verification rejection consumes the next cumulative focused repair. After repair 2/2, another rejection is terminal `FAILED_VALIDATION` for b02. No gate receives its own reset budget.

### Stage 4 — executable and visual gates

Only after source review passes, the coordinator creates a detached verifier worktree at the exact frozen candidate commit, independently installs from the lockfile, checks Vitest, provisions its ignored `.env`, and uses verifier-specific run/database/output resources. Then:

1. Run the focused Owner Health unit/component tests, direct Biome check, web type-check and build, ancestry/diff/scope/freeze checks, and the complete `phase11-health.browser.spec.ts` in Chromium with a unique run ID and review directory.
2. Inspect the live route interactively with Browser and compare repository Playwright screenshots at 320/360/390/721/768/820/1024/1200/1440, Arabic RTL and English LTR. Recheck loading, populated, clear, unmonitored, unavailable/error states represented by the existing suite.
3. Verify keyboard order/focus, 44px targets, exact accessible names, semantic headers/scopes, axe serious/critical results, reduced motion, forced colors, 200% zoom/reflow, safe containment, and no page or mobile-region overflow.
4. Compare 390px mobile renders to accepted Paper successor `1DZC-0` and 1440px desktop renders to the preserved desktop source. Existing canonical screenshots must match without update; any requested promotion is `NEEDS_HUMAN` and outside this attempt.
5. Run `pnpm build`, `pnpm verify:fast`, and `FITWAY_PHASE=phase11-health pnpm verify:phase` on the writer candidate and detached verifier with distinct resources. Write runtime/visual evidence only to coordinator-owned durable records after both read-only runs, then rerun final freeze/status/topology checks against the unchanged candidate. The detached verifier repeats source, browser, accessibility, RTL/LTR, Paper, desktop, canonical, repository, ancestry, and scope gates without editing.

### Stage 5 — coordinator integration

Only a fresh independent `PASS` permits a no-ff integration of the b02 branch, which contains accepted A1/A2/B1 plus the new test commit, into the authoritative coordinator branch. The coordinator reruns the focused phase gate and `pnpm verify:full` with unique resources, confirms tracked status is clean, records the integrated commit, marks b02 `DONE`, and makes aggregate Phase 11 depend on b02 while retaining the terminal b01 block unchanged.

If pre-integration validation terminates, preserve the b02 branch/worktree and records, release only b02 leases, and keep b01 untouched. If an integrated candidate must be undone, use an ordinary merge revert; never rewrite or reset history.

## Exact activation and verification commands

Before activation the coordinator provisions, through the established scoped local disposable-Postgres mechanism, three existing empty databases and records proof without credentials: `fitway_integration_p11_uptime_mobile_b02`, `fitway_integration_p11_uptime_mobile_v02`, and `fitway_integration_p11_uptime_mobile_c02`. They are distinct from `DATABASE_URL`; absence or name mismatch stops. Native command failures are fail-fast.

The coordinator runs this activation/carry-forward block once after committing the reviewed activation record. It creates and enters the exact worktree, asserts activation identity, prepares ignored dependencies/environment, and stops after the carry-forward gates; the test writer does not start until a fresh read-only carry-forward review passes.

```powershell
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
$uptimeCoordinator = 'C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration'
$uptimeWorker = 'C:/Users/Pc Force/.codex/worktrees/p11-uptime-mobile-b02'
$uptimeBranch = 'work/phase11-uptime-mobile-fidelity-b02'
$uptimeCoordinatorEnv = "$uptimeCoordinator/apps/server/.env"
$uptimeWorkerEnv = "$uptimeWorker/apps/server/.env"
Set-Location -LiteralPath $uptimeCoordinator
if ((git status --porcelain).Length -ne 0) { throw 'coordinator worktree is dirty' }
$uptimeActivation = (git rev-parse HEAD).Trim()
git worktree add -b $uptimeBranch $uptimeWorker $uptimeActivation
Set-Location -LiteralPath $uptimeWorker
if ((git branch --show-current).Trim() -ne $uptimeBranch) { throw 'wrong b02 branch' }
if ((git rev-parse HEAD).Trim() -ne $uptimeActivation) { throw 'wrong activation HEAD' }
if ((git status --porcelain).Length -ne 0) { throw 'fresh b02 worktree is dirty' }
if (-not (Test-Path -LiteralPath $uptimeCoordinatorEnv)) { throw 'coordinator apps/server/.env is absent' }
Copy-Item -LiteralPath $uptimeCoordinatorEnv -Destination $uptimeWorkerEnv -Force
pnpm install --frozen-lockfile
pnpm exec vitest --version
function Assert-UptimeCarryCommit([string]$expectedPath, [string]$acceptedCommit) {
  $actualPaths = @(git diff-tree --no-commit-id --name-only -r HEAD)
  if ($actualPaths.Count -ne 1 -or $actualPaths[0] -ne $expectedPath) { throw "carry path mismatch: $expectedPath" }
  if (((git rev-list --parents -n 1 HEAD).Trim().Split(' ')).Count -ne 2) { throw 'carry commit is not single-parent' }
  if ((git rev-parse "HEAD:$expectedPath").Trim() -ne (git rev-parse "$acceptedCommit`:$expectedPath").Trim()) { throw "carry blob mismatch: $expectedPath" }
}
git cherry-pick 3a02a126ba3031c0b4c3f12934ee2dffd97065dd
Assert-UptimeCarryCommit 'apps/web/src/components/owner/health/owner-health-view.tsx' '3a02a126ba3031c0b4c3f12934ee2dffd97065dd'
git cherry-pick b04215cada5c717b3e115b3a34d585b5039b34c4
Assert-UptimeCarryCommit 'apps/web/src/components/owner/health/owner-health.css' 'b04215cada5c717b3e115b3a34d585b5039b34c4'
git cherry-pick 04c2d3be01c14a42974666af636c96f2ed23ce39
Assert-UptimeCarryCommit 'apps/web/src/components/owner/health/owner-health-section.tsx' '04c2d3be01c14a42974666af636c96f2ed23ce39'
git diff --exit-code 04c2d3be01c14a42974666af636c96f2ed23ce39 -- apps/web/src/components/owner/health/owner-health-view.tsx apps/web/src/components/owner/health/owner-health.css apps/web/src/components/owner/health/owner-health-section.tsx
$uptimeCarryPaths = @(git diff --name-only $uptimeActivation..HEAD | Sort-Object)
$uptimeExpectedCarryPaths = @('apps/web/src/components/owner/health/owner-health-section.tsx','apps/web/src/components/owner/health/owner-health-view.tsx','apps/web/src/components/owner/health/owner-health.css') | Sort-Object
if (Compare-Object $uptimeCarryPaths $uptimeExpectedCarryPaths) { throw 'carry-forward allowlist mismatch' }
pnpm exec vitest run apps/web/src/components/owner/health/owner-health-view.test.tsx apps/web/src/hooks/use-owner-health.test.tsx
pnpm --filter web check-types
pnpm --filter web build
git diff --check $uptimeActivation..HEAD
if ((git status --porcelain).Length -ne 0) { throw 'carry-forward worktree is dirty' }
```

After the test-only commit and exact worker-handoff commit exist, the writer runs this non-runtime pre-source-review freeze. For the initial candidate, `HEAD` is handoff, `HEAD^` test, `HEAD^^` B1 carry, `HEAD^^^` A2, `HEAD^^^^` A1, and `HEAD^^^^^` activation. A later focused repair must freeze its new literal commit IDs in its own repair record before execution; it may not reuse these relative assumptions.

```powershell
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
$uptimeWorker = 'C:/Users/Pc Force/.codex/worktrees/p11-uptime-mobile-b02'
$uptimeWorkerHandoff = 'docs/phase-records/handoffs/phase11-uptime-mobile-fidelity/20260829-p11-uptime-b02-worker-candidate.md'
Set-Location -LiteralPath $uptimeWorker
if ((git status --porcelain).Length -ne 0) { throw 'candidate worktree is dirty' }
if (((git rev-list --parents -n 1 HEAD).Trim().Split(' ')).Count -ne 2) { throw 'handoff commit is not single-parent' }
if (((git rev-list --parents -n 1 HEAD^).Trim().Split(' ')).Count -ne 2) { throw 'test commit is not single-parent' }
if (@(git diff-tree --no-commit-id --name-only -r HEAD).Count -ne 1 -or (git diff-tree --no-commit-id --name-only -r HEAD).Trim() -ne $uptimeWorkerHandoff) { throw 'handoff commit scope mismatch' }
if (@(git diff-tree --no-commit-id --name-only -r HEAD^).Count -ne 1 -or (git diff-tree --no-commit-id --name-only -r HEAD^).Trim() -ne 'tests/browser/phase11-health.browser.spec.ts') { throw 'test commit scope mismatch' }
$uptimeCandidatePaths = @(git diff --name-only HEAD^^^^^..HEAD | Sort-Object)
$uptimeExpectedCandidatePaths = @('apps/web/src/components/owner/health/owner-health-section.tsx','apps/web/src/components/owner/health/owner-health-view.tsx','apps/web/src/components/owner/health/owner-health.css','tests/browser/phase11-health.browser.spec.ts',$uptimeWorkerHandoff) | Sort-Object
if (Compare-Object $uptimeCandidatePaths $uptimeExpectedCandidatePaths) { throw 'candidate allowlist mismatch' }
git diff --exit-code 04c2d3be01c14a42974666af636c96f2ed23ce39 -- apps/web/src/components/owner/health/owner-health-view.tsx apps/web/src/components/owner/health/owner-health.css apps/web/src/components/owner/health/owner-health-section.tsx
pnpm exec biome check tests/browser/phase11-health.browser.spec.ts
pnpm exec vitest run apps/web/src/components/owner/health/owner-health-view.test.tsx apps/web/src/hooks/use-owner-health.test.tsx
pnpm --filter web check-types
pnpm --filter web build
node 'C:/Users/Pc Force/.codex/skills/agent-project-workflow/scripts/candidate-freeze-check.mjs' --dir $uptimeWorker --base 'HEAD^^^^^' --capture 'test-results/node_modules/p11_uptime_mobile_b02_source_freeze.txt' --also "repository=pnpm check:repository" --record $uptimeWorkerHandoff
```

Only after independent source review passes, the writer candidate uses `p11_uptime_mobile_b02` / `fitway_integration_p11_uptime_mobile_b02` and runs the post-review executable block:

```powershell
$env:FITWAY_RUN_ID='p11_uptime_mobile_b02'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p11_uptime_mobile_b02'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p11_uptime_mobile_b02'
$env:FITWAY_PLAYWRIGHT_REVIEW_DIR='test-results/p11_uptime_mobile_b02/review'
$env:FITWAY_PHASE='phase11-health'
pnpm exec playwright test tests/browser/phase11-health.browser.spec.ts --project=chromium
pnpm build
pnpm verify:fast
pnpm verify:phase
node 'C:/Users/Pc Force/.codex/skills/agent-project-workflow/scripts/candidate-freeze-check.mjs' --dir 'C:/Users/Pc Force/.codex/worktrees/p11-uptime-mobile-b02' --base 'HEAD^^^^^' --capture 'test-results/node_modules/p11_uptime_mobile_b02_final_freeze.txt' --also "repository=pnpm check:repository" --record 'docs/phase-records/handoffs/phase11-uptime-mobile-fidelity/20260829-p11-uptime-b02-worker-candidate.md'
```

The coordinator creates and prepares the detached verifier with this exact block; it never reuses writer checkout/resources and makes no tracked edit:

```powershell
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
$uptimeCoordinator = 'C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration'
$uptimeWorker = 'C:/Users/Pc Force/.codex/worktrees/p11-uptime-mobile-b02'
$uptimeVerifier = 'C:/Users/Pc Force/.codex/worktrees/p11-uptime-mobile-v02'
$uptimeCandidate = (git -C $uptimeWorker rev-parse HEAD).Trim()
git -C $uptimeCoordinator worktree add --detach $uptimeVerifier $uptimeCandidate
Set-Location -LiteralPath $uptimeVerifier
if ((git rev-parse HEAD).Trim() -ne $uptimeCandidate) { throw 'verifier candidate mismatch' }
if ((git status --porcelain).Length -ne 0) { throw 'verifier worktree is dirty' }
Copy-Item -LiteralPath "$uptimeCoordinator/apps/server/.env" -Destination "$uptimeVerifier/apps/server/.env" -Force
pnpm install --frozen-lockfile
pnpm exec vitest --version
$env:FITWAY_RUN_ID='p11_uptime_mobile_v02'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p11_uptime_mobile_v02'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p11_uptime_mobile_v02'
$env:FITWAY_PLAYWRIGHT_REVIEW_DIR='test-results/p11_uptime_mobile_v02/review'
$env:FITWAY_PHASE='phase11-health'
pnpm exec playwright test tests/browser/phase11-health.browser.spec.ts --project=chromium
pnpm build
pnpm verify:fast
pnpm verify:phase
node 'C:/Users/Pc Force/.codex/skills/agent-project-workflow/scripts/candidate-freeze-check.mjs' --dir $uptimeVerifier --base 'HEAD^^^^^' --capture 'test-results/node_modules/p11_uptime_mobile_v02_final_freeze.txt' --also "repository=pnpm check:repository" --record 'docs/phase-records/handoffs/phase11-uptime-mobile-fidelity/20260829-p11-uptime-b02-worker-candidate.md'
if ((git status --porcelain).Length -ne 0) { throw 'verifier mutated tracked state' }
```

Only detached `PASS` permits the coordinator's serialized no-ff integration block:

```powershell
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
Set-Location -LiteralPath 'C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration'
if ((git status --porcelain).Length -ne 0) { throw 'coordinator worktree is dirty before integration' }
git merge --no-ff work/phase11-uptime-mobile-fidelity-b02 -m 'merge(phase11): integrate Uptime mobile fidelity b02'
$env:FITWAY_RUN_ID='p11_uptime_mobile_c02'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p11_uptime_mobile_c02'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p11_uptime_mobile_c02'
$env:FITWAY_PLAYWRIGHT_REVIEW_DIR='test-results/p11_uptime_mobile_c02/review'
$env:FITWAY_PHASE='phase11-health'
pnpm verify:phase
pnpm verify:full
git diff --check HEAD^..HEAD
if ((git status --porcelain).Length -ne 0) { throw 'integration verification mutated tracked state' }
```

All three database names and reset markers exactly match their run IDs and remain distinct from `DATABASE_URL`. A missing database, unsafe target, collision, or environment mismatch stops before the corresponding run. If post-merge verification fails because of b02, the coordinator ordinary-reverts the merge; it never resets history.

## Risks, unknowns, and stop conditions

- The paint/occlusion helper is accepted only if every named negative control fails for the intended reason and all state restores. DOM hit-testing alone is not treated as glyph-paint proof; computed paint/pseudo/clip evidence, accessibility snapshots, negative controls, axe contrast, and canonical screenshots are cumulative oracles.
- The reversible growth probe uses one exact lane, six width/locale executions, measured thresholds, and `finally` restoration. Residue, sibling-determined false failure, or a green fixed/oversized negative control is rejection.
- The prior B2 diff is large and contains useful assertions, but copying it wholesale would blur the fresh-attempt boundary and reimport rejected seams. Reuse is by independently justified assertion only.
- Stop as `NEEDS_HUMAN` on Product/Spec/Paper conflict, material visual change, canonical update, forbidden-path need, privacy/security ambiguity, or shared ownership conflict. Stop as `FAILED_VALIDATION` when the fresh cumulative repair budget is exhausted.
- No open product decision blocks plan review. Settings Paper and Login are separate successor slices and remain out of scope here.

## Current handoff

- Completed: repository/durable-state discovery, initial plan commit `b2a73e82026f7ea0c7abedee99a33d13860c36c6`, two independent plan rejections, and focused plan repairs 1 and 2; no implementation, b02 branch/worktree, lease, database run, runtime, Browser, or test change exists.
- Current state: coordinator branch contains only plan/ledger/route records beyond terminal b01 history; b01 remains terminal and its separate worktree retains exactly its recorded uncommitted test candidate.
- Human decisions: fresh Uptime and Settings attempts are authorized; Login must prefer WCAG AA with the smallest Paper-language-preserving adjustment. Only the Uptime decision is activated by this slice.
- Remaining: fresh independent final review of plan repair 2, then b02 activation/carry-forward/test implementation/source review/executable verification/integration; later Settings, Login, and aggregate slices remain separate.
- Blockers: none for final plan review. Activation is blocked until it passes; another rejection stops Uptime planning for new human direction.
- Verification: planning used read-only repository, ledger, handoff, accepted source commits/hashes, CSS, copy, actual DOM ownership, branch topology, workflow preflight, verification scripts, and exact-worktree checks. No runtime or Browser verification was appropriate before an implementation candidate.
- Recommended next session/stage: `review` repaired plan 2 read-only against both prior review records, terminal findings, workflow, database safety guard, Playwright 1.61 primitives, and actual accepted source; return locatable findings and `PASS` or `FAILED_VALIDATION`; do not repair it.
