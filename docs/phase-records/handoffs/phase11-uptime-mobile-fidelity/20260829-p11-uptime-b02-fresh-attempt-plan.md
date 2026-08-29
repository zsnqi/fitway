# Phase 11 Uptime mobile fidelity — fresh b02 attempt plan

- Status: `PLAN_REPAIR_1_READY`; the first independent plan review rejected the initial plan before activation, and this focused correction requires a fresh independent rereview. The future implementation repair budget remains `0/2`. The human explicitly authorized a fresh Uptime attempt on 2026-08-29 with a new reviewed plan and fresh bounded repair budget. This is not B2 repair 3.
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

Rollback boundaries: revert the test commit to return to the frozen carry-forward; then revert the three carry-forward commits in reverse order to return to the coordinator activation tree. Each b02 commit has one parent and leaves b01 untouched.

## Stage sequence

### Stage 0 — independent plan review

A fresh read-only reviewer checks this plan against the terminal B2 findings, the accepted B1 source, current Owner Health markup/CSS/copy, repository workflow, and the actual planned verification commands. The reviewer must reject any false-pass seam, hidden production mutation, ambiguous paint oracle, non-executable criterion, or route/repair-accounting gap. No branch, worktree, lease, source edit, or runtime gate exists before `PLAN_REVIEW_PASS`.

Plan-review corrections do not consume the future source-validation budget because no implementation candidate exists. Two failed focused plan corrections stop planning and require a new human-reviewed direction.

### Stage 1 — coordinator activation and accepted source carry-forward

After `PLAN_REVIEW_PASS`, the coordinator registers the existing `phase11-health` profile and exact browser path for b02, changes only the b02 ledger block to `READY`, records branch/worktree/run ID/lease/activation handoff, and commits that live state. Create `work/phase11-uptime-mobile-fidelity-b02` and its non-overlapping worktree from that coordinator activation commit.

Before any source or test edit, run `pnpm install --frozen-lockfile`, require `pnpm exec vitest --version` to print a version, and provision the ignored `apps/server/.env` from the coordinator worktree without printing or copying it into tracked files. Record the actual initial HEAD and clean status.

Apply the accepted A1, A2, and B1 source-only commits in order with three separate `git cherry-pick` operations, producing three new b02 carry-forward commits. After each commit, verify its one-file diff and resulting blob against the accepted commit. After B1, `git diff --exit-code 04c2d3b --` over the three accepted Owner Health source paths must be empty; focused component tests, `pnpm --filter web check-types`, and `pnpm --filter web build` must pass. A fresh read-only scope review must pass before the test lease opens. Any conflict or byte difference is rejection, not a repair of accepted source.

### Stage 2 — fresh browser-contract implementation

Start from the committed B1 browser spec now present on the fresh branch; consult the terminal B2 candidate only as rejected evidence and write a new bounded contract.

The contract must preserve all existing Uptime functional/state/timezone/request/sibling-route, keyboard/focus, forced-colors, reduced-motion, 200% reflow, axe, screenshot, and canonical assertions, and add these independently reviewable oracles:

1. Assert the exact Arabic and English accessible name of each offline/incident region, not mere truthiness.
2. Pin exact independent literals for every static label/state word exercised by the responsive contract, including Arabic `غير مؤكد` and English `unconfirmed`, and exercise them in rendered output. Locale-formatted dates, times, durations, and numbers use frozen fixture-derived structural oracles and exact Western-digit/`bdi` assertions rather than hard-coded ICU punctuation.
3. For every mobile cell at 320/360/390 in both locales, assert its exact accessible name through `getByRole("cell", { name: ... })` or an exact `ariaSnapshot`, so `aria-hidden`, `inert`, or hidden accessibility ancestry fails. Separately collect every value text range and ancestor chain: require non-empty client rects, `display` not `none`, `visibility: visible`, `content-visibility` not `hidden`, opacity greater than zero, nontransparent `color` and `-webkit-text-fill-color`, no clipping by any ancestor, and containment inside cell and region. Sample the center of every range fragment with `elementsFromPoint`; the first accepted hit must be the value owner or its ancestor/descendant, with no opaque covering sibling/non-ancestor. Inspect `::before`/`::after` on the owner and ancestor chain and reject a nonempty positioned opaque covering pseudo-element.
4. Use two separate count containment chains at 320/360/390 in Arabic and English. Board-header counts must have exact visible and accessible text, Western digits, and both numeric `bdi` ranges painted inside count lane → board header → region. Bounded summaries must use a fixture whose totals exceed returned rows and prove exact visible and accessible text plus both numeric `bdi` ranges inside `.owner-health__shown` → `.owner-health-block` → viewport/document. Neither chain may be substituted for the other.
5. Prove natural mobile auto-height at 320/360/390 in both locales on the first incident row's fifth (delivery) cell. In `try/finally`, append a `grid-column: 1 / -1`, `display:block`, `white-space:pre-wrap` span containing eight explicit 20px lines, wait two animation frames, and compare before/after/restored rectangles and scroll/client metrics for the cell, row, `tbody`, and region. Each layer must grow by at least 100px without clipping, then restore within 1px after removal. At 320 and 390 in both locales, reversible negative controls apply fixed baseline and oversized 2000px `block-size`/hidden overflow to the same layers; the helper must return false, then restore all styles in `finally`.
6. Retain exact semantic column headers/scopes, record/field counts, DOM order, RTL/LTR lane reflection, bidi isolation, 390px Paper dimensions, below-390 contraction, the 720/721 breakpoint, desktop sticky-table behavior, and document/region overflow rules.

The paint helper must prove its own sensitivity with reversible negative controls before acceptance: transparent `color`/`-webkit-text-fill-color`, `aria-hidden` ancestry, a same-host opaque `::after`, an opaque positioned sibling overlay, transformed off-clip placement, and clipped ancestry must each make the applicable evidence return false, after which the DOM/style state is restored in `finally`. Existing 390/1440 screenshot assertions and axe color-contrast checks remain a separate visual backstop.

The implementation writer commits the test-only change, then writes and commits only its b02 worker handoff citing the test commit and commands, then runs the candidate-freeze check over the complete candidate. The exact diff from the accepted carry-forward commit to the test commit is one test file; the later handoff commit is record-only. Any need for new production bytes, copy, Paper, canonical, configuration, or a second test file is an immediate stop, not scope expansion.

### Stage 3 — independent source review and cumulative repair accounting

A fresh read-only reviewer inspects the entire one-file diff against both Standards and Spec/accepted Paper axes before any Playwright execution. The review must construct at least one adversarial counterexample for each new oracle and confirm the test would fail it.

The first formally submitted candidate begins at repair `0/2`. Any source-review, mechanical, runtime, Browser/Paper, accessibility, canonical, repository, or final independent-verification rejection consumes the next cumulative focused repair. After repair 2/2, another rejection is terminal `FAILED_VALIDATION` for b02. No gate receives its own reset budget.

### Stage 4 — executable and visual gates

Only after source review passes:

1. Run the focused Owner Health unit/component tests, direct Biome check, web type-check and build, ancestry/diff/scope/freeze checks, and the complete `phase11-health.browser.spec.ts` in Chromium with a unique run ID and review directory.
2. Inspect the live route interactively with Browser and compare repository Playwright screenshots at 320/360/390/721/768/820/1024/1200/1440, Arabic RTL and English LTR. Recheck loading, populated, clear, unmonitored, unavailable/error states represented by the existing suite.
3. Verify keyboard order/focus, 44px targets, exact accessible names, semantic headers/scopes, axe serious/critical results, reduced motion, forced colors, 200% zoom/reflow, safe containment, and no page or mobile-region overflow.
4. Compare 390px mobile renders to accepted Paper successor `1DZC-0` and 1440px desktop renders to the preserved desktop source. Existing canonical screenshots must match without update; any requested promotion is `NEEDS_HUMAN` and outside this attempt.
5. Run `pnpm build`, `pnpm verify:fast`, `FITWAY_PHASE=phase11-health pnpm verify:phase`, and the candidate freeze checks after every durable candidate record is committed. A fresh detached verifier repeats the source, browser, accessibility, RTL/LTR, Paper, desktop, canonical, repository, ancestry, and scope gates without editing.

### Stage 5 — coordinator integration

Only a fresh independent `PASS` permits a no-ff integration of the b02 branch, which contains accepted A1/A2/B1 plus the new test commit, into the authoritative coordinator branch. The coordinator reruns the focused phase gate and `pnpm verify:full` with unique resources, confirms tracked status is clean, records the integrated commit, marks b02 `DONE`, and makes aggregate Phase 11 depend on b02 while retaining the terminal b01 block unchanged.

If pre-integration validation terminates, preserve the b02 branch/worktree and records, release only b02 leases, and keep b01 untouched. If an integrated candidate must be undone, use an ordinary merge revert; never rewrite or reset history.

## Exact activation and verification commands

The coordinator runs this activation/preflight block once, after the reviewed activation commit and before the test writer starts:

```powershell
$uptimeCoordinatorEnv = 'C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration/apps/server/.env'
$uptimeWorkerEnv = 'C:/Users/Pc Force/.codex/worktrees/p11-uptime-mobile-b02/apps/server/.env'
$uptimeWorkerHandoff = 'docs/phase-records/handoffs/phase11-uptime-mobile-fidelity/20260829-p11-uptime-b02-worker-candidate.md'
if (-not (Test-Path -LiteralPath $uptimeCoordinatorEnv)) { throw 'coordinator apps/server/.env is absent' }
Copy-Item -LiteralPath $uptimeCoordinatorEnv -Destination $uptimeWorkerEnv -Force
if (-not (Test-Path -LiteralPath $uptimeWorkerEnv)) { throw 'worker apps/server/.env was not provisioned' }
pnpm install --frozen-lockfile
pnpm exec vitest --version
git status --short --branch
git cherry-pick 3a02a126ba3031c0b4c3f12934ee2dffd97065dd
git cherry-pick b04215cada5c717b3e115b3a34d585b5039b34c4
git cherry-pick 04c2d3be01c14a42974666af636c96f2ed23ce39
```

After the test-only and worker-handoff commits exist, the writer and fresh verifier run this non-writing candidate block from the b02 worktree:

```powershell
$uptimeWorkerHandoff = 'docs/phase-records/handoffs/phase11-uptime-mobile-fidelity/20260829-p11-uptime-b02-worker-candidate.md'
pnpm exec biome check tests/browser/phase11-health.browser.spec.ts
pnpm exec vitest run apps/web/src/components/owner/health/owner-health-view.test.tsx apps/web/src/hooks/use-owner-health.test.tsx
pnpm --filter web check-types
pnpm --filter web build
$env:FITWAY_RUN_ID='p11_uptime_mobile_b02'
$env:FITWAY_PLAYWRIGHT_REVIEW_DIR='test-results/p11_uptime_mobile_b02/review'
pnpm exec playwright test tests/browser/phase11-health.browser.spec.ts --project=chromium
pnpm build
pnpm verify:fast
$env:FITWAY_PHASE='phase11-health'
pnpm verify:phase
git diff --exit-code 04c2d3be01c14a42974666af636c96f2ed23ce39 -- apps/web/src/components/owner/health/owner-health-view.tsx apps/web/src/components/owner/health/owner-health.css apps/web/src/components/owner/health/owner-health-section.tsx
git diff --check HEAD^^^^^..HEAD
git diff --name-only HEAD^^..HEAD^
git rev-parse HEAD^^
git rev-parse HEAD^^^
git rev-list --parents --max-count=1 HEAD^
node 'C:/Users/Pc Force/.codex/skills/agent-project-workflow/scripts/candidate-freeze-check.mjs' --dir 'C:/Users/Pc Force/.codex/worktrees/p11-uptime-mobile-b02' --base 'HEAD^^^^^' --capture 'test-results/node_modules/p11_uptime_mobile_b02_freeze.txt' --also "repository=pnpm check:repository" --record $uptimeWorkerHandoff
git status --short --branch
```

The frozen candidate topology is exact: `HEAD` is the worker-handoff commit, `HEAD^` the test-only commit, `HEAD^^` accepted B1 carry-forward, `HEAD^^^` accepted A2 carry-forward, `HEAD^^^^` accepted A1 carry-forward, and `HEAD^^^^^` the coordinator activation commit. The ancestry commands must show the test commit has exactly `HEAD^^` as its sole parent, and the one-file name check must print only `tests/browser/phase11-health.browser.spec.ts`. Before any integration or `pnpm verify:full`, the ignored `apps/server/.env` must exist and be sourced without disclosure; absence stops the run. The detached verifier uses a distinct run ID and output directory. Coordinator integration additionally runs `pnpm verify:full`. Every run must leave tracked status unchanged from its pre-run snapshot except for the frozen b02 branch candidate where applicable.

## Risks, unknowns, and stop conditions

- The paint/occlusion helper is accepted only if every named negative control fails for the intended reason and all state restores. DOM hit-testing alone is not treated as glyph-paint proof; computed paint/pseudo/clip evidence, accessibility snapshots, negative controls, axe contrast, and canonical screenshots are cumulative oracles.
- The reversible growth probe uses one exact lane, six width/locale executions, measured thresholds, and `finally` restoration. Residue, sibling-determined false failure, or a green fixed/oversized negative control is rejection.
- The prior B2 diff is large and contains useful assertions, but copying it wholesale would blur the fresh-attempt boundary and reimport rejected seams. Reuse is by independently justified assertion only.
- Stop as `NEEDS_HUMAN` on Product/Spec/Paper conflict, material visual change, canonical update, forbidden-path need, privacy/security ambiguity, or shared ownership conflict. Stop as `FAILED_VALIDATION` when the fresh cumulative repair budget is exhausted.
- No open product decision blocks plan review. Settings Paper and Login are separate successor slices and remain out of scope here.

## Current handoff

- Completed: repository/durable-state discovery, initial plan commit `b2a73e82026f7ea0c7abedee99a33d13860c36c6`, independent plan-review rejection, and focused plan repair 1; no implementation, b02 branch/worktree, lease, runtime, Browser, or test change exists.
- Current state: coordinator branch contains only plan/ledger/route records beyond terminal b01 history; b01 remains terminal and its separate worktree retains exactly its recorded uncommitted test candidate.
- Human decisions: fresh Uptime and Settings attempts are authorized; Login must prefer WCAG AA with the smallest Paper-language-preserving adjustment. Only the Uptime decision is activated by this slice.
- Remaining: fresh independent rereview of repair 1, then b02 activation/carry-forward/test implementation/source review/executable verification/integration; later Settings, Login, and aggregate slices remain separate.
- Blockers: none for plan rereview. Activation is blocked until that rereview passes.
- Verification: planning used read-only repository, ledger, handoff, accepted source commits/hashes, CSS, copy, actual DOM ownership, branch topology, workflow preflight, verification scripts, and exact-worktree checks. No runtime or Browser verification was appropriate before an implementation candidate.
- Recommended next session/stage: `review` repaired plan 1 read-only against the first review findings, terminal findings, workflow, and actual accepted source; return locatable findings and `PASS` or `FAILED_VALIDATION`; do not repair it.
