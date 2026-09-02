# FITWAY fidelity/integration closure r04 repair-2 candidate

## Completed

- Preserved the accepted r04 implementation and repair-1 candidate at
  `38fe58354769de01ea77dff12f4953f35d51d402` without reopening Public, Staff, Login, or unrelated
  Owner fidelity work.
- Reconciled the two fresh source reviews. Both confirmed one remaining behavior gap: repair 1
  suppressed legitimate route-remount and reconnect refreshes, while its test never exercised the
  required cached-data failure path.
- Narrowed mount behavior so only a late in-page observer joining an already-observed Daily query
  suppresses the duplicate request. Normal stale first-observer remount and reconnect refreshes are
  restored.
- Preserved validated cached Daily/time-context data after a failed background refresh so already
  visited Owner subtrees keep their local drafts and filters.
- Split the false proof from the real failure proof: a late Access visit still issues no duplicate
  Daily/time-context pair, and a forced stale reconnect now fails its second Daily request while the
  mounted Settings draft remains present and unchanged.

## Exact current state

- Branch/worktree/run lineage: `codex/fidelity-integration-closure`,
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`,
  `fidelity_r04_repair2_*`.
- Base `b1bc91c4028eb02083ea59dc73a3c8c03614c767`; accepted repair-1 parent
  `38fe58354769de01ea77dff12f4953f35d51d402`; repair-2 candidate commit `SELF` after the freeze
  below.
- `main` remains `8f5ff99a9e48722a9cb44b6124833099f3704f42`. Nothing is pushed, deployed,
  tagged, released, or externally provisioned.
- r01/r02/r03 remain immutable `FAILED_VALIDATION`. r04 is `VALIDATING` with its final focused
  repair count `2/2`.

## Decisions

- The declined global pixel tolerance and renderer/cache manipulation remain rejected. Official-logo
  source, intrinsic-size, visibility, no-inline-SVG, and byte-equality proofs remain intact, with
  masking confined to the live image in seven new r04 non-live canonicals.
- The first source-review request to persist full-gate evidence was a closure sequencing item, not a
  product defect; it will be satisfied in the terminal record after this exact candidate completes
  the fresh full gate and reviews.
- The Settings loading subtree duplication noted heuristically is non-blocking accepted behavior and
  is not refactored during closure.
- The initial reconnect regression failure was retained as repair evidence: the selected Settings
  tab became empty after the second Daily request returned 503. The repaired rerun proves the
  mounted subtree and value survive that same background failure.

## Remaining

1. Freeze and commit this exact repair-2 candidate.
2. Run `pnpm verify:fast`, then a fresh `pnpm verify:full` with a new exact disposable database and
   isolated browser resources.
3. Run fresh independent Standards, Spec, and rendered Paper/accessibility reviews on the exact
   repair-2 commit.
4. Fast-forward the accepted candidate into canonical `main`, revalidate the desktop synthetic
   demo against the repaired live routes, record terminal r04 closure, and leave `main` clean.

## Blockers

- None. The earlier rendered-review worker stopped only because its account usage window was
  exhausted; it made no repository changes and will be restarted against the exact repair-2
  candidate.

## Verification

- Pre-repair proof: the late-observer check passed, while the forced stale reconnect reproduced the
  missing subtree after the second Daily request failed with 503 (`1/2 PASS`).
- Repaired focused regression: late-observer request suppression plus failed-reconnect cached-data
  preservation passed `2/2` in `4.7s`.
- Complete Settings browser slice passed `19/19` in `21.2s`, including desktop/mobile, English/Arabic,
  keyboard, 200-percent reflow, axe, and canonical routed states.
- Workspace type/build check passed all eight participating projects and the web production build.
- The previous repair-1 exact candidate passed its full disposable gate: `572/572` unit,
  `117/117` simulator, `133/133` integration, `132` browser/accessibility passes plus three
  intentional desktop-demo skips. Because source review found the behavior gap above, those results
  are historical repair evidence only and will not be reused as repair-2 acceptance.

## Recommended next session

Continue in `verify` mode on the exact r04 repair-2 candidate. No implementation work remains unless
a fresh gate returns a new verified finding; a third validation recurrence would be terminal
`FAILED_VALIDATION` under the project repair budget.
