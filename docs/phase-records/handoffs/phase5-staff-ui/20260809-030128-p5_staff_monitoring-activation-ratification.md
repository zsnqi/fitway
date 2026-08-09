# Phase 5 Staff Monitoring activation and human-decision ratification

- Status: `IN_PROGRESS`; this is an active, bounded Staff Monitoring repair and verification
  surface, not a declaration that `phase5-staff-ui` or aggregate `phase-5` is complete.
- Date: 2026-08-09
- Branch / worktree: `work/phase5-staff-paper-fidelity` / `D:/Projects/fitway`
- Base / inherited HEAD: `0f849756cee77d43e9013c9fd5e4e7b5cf36701a` /
  `45fc45ffdef03540590056fc301c4cdcdbc445bc`
- Current authority: this handoff, as named by `PROJECT_STATE.yaml`

## Completed

- The coordinator ratified the existing branch and worktree as the sole active Phase 5 Staff
  Monitoring work surface and granted only the owned paths and shared test lease recorded in
  `PROJECT_STATE.yaml`.
- The two 2026-08-08 authority-reconciliation records remain unchanged as historical provenance.
- The three resolved human decisions below are now durable and supersede contrary open-question or
  stale coordination wording for this slice.

## Exact current state

- `HEAD` remains `45fc45ffdef03540590056fc301c4cdcdbc445bc`, two commits above `main`
  `0f849756cee77d43e9013c9fd5e4e7b5cf36701a`. Nothing is committed, pushed, merged, or deployed by
  this activation.
- The inherited unstaged implementation remains exactly two files:
  `apps/web/src/components/staff/operational-snapshot-view.tsx` and
  `apps/web/src/components/staff/staff-board.css`.
- The inherited untracked files remain the `20260808-201400` reconciliation plan, the
  `20260808-203000` reconciliation terminal record, and `probe2.mjs`. This handoff is newly
  untracked and `PROJECT_STATE.yaml` is modified by the coordination pass. Nothing is staged.
- Paper, application implementation, tests, screenshots, baselines, and the diagnostic were not
  edited in this pass.

## Human decisions

1. **Arabic intra-zone keyboard/Tab order.** Preserve the existing approved authored Arabic
   intra-zone order exactly as implemented. Do not reverse or reinterpret it for RTL. This rules
   out the open-order item in the `20260808-203000` handoff.
2. **Staff capacity visibility.** Preserve the approved Staff Monitoring composition and current
   implementation without adding visible capacity. Capacity may remain in the DTO/data model where
   required; its presence does not require Staff UI rendering. For this surface, this human decision
   supersedes the older `PHASES.md` Phase 4 acceptance wording that required private capacity
   visibility. `PHASES.md` is intentionally unchanged in this bounded coordination pass.
3. **Existing Paper repair candidate and visual review.** The self-contained Staff Monitoring Paper
   repair candidate has already been visually reviewed against the approved design. Do not create,
   duplicate, modify, or request another Staff Monitoring Paper board or visual review. The visual
   gate is therefore recorded `PASS`; this does not close any code, browser, accessibility, or
   independent-review gate.

## Remaining

1. Finish the bounded repository repair already present in the two owned implementation files,
   reconciling Staff state selection with the server-owned snapshot semantics without changing the
   authored control order or adding capacity UI.
2. Add durable assertions in the owned Staff review spec and the constrained Phase 4 Staff browser
   lease for the authored Arabic order, monitoring-only negative control, Retry focus/target
   behavior, responsive overflow, and 200% reflow. Do not update canonical screenshots.
3. Run focused checks, then `pnpm verify:full` with isolated resources, and obtain a fresh
   repository-independent verifier after the final code state.
4. Hand the verified candidate back to the coordinator for integration and terminal-state review.

## Blockers

No human or product decision remains open for this bounded slice. Any new Product/Spec conflict,
write outside the recorded scope, or proposal to alter Paper is a new `NEEDS_HUMAN` stop; it is not
authority to reopen the three decisions above.

## Verification

- Before the coordination write, repository identity, branch, HEAD, worktree status, ledger schema,
  and the established Phase 5 activation pattern were inspected read-only.
- `git diff --check`: PASS.
- `pnpm check:repository`: PASS — 31 milestones and 8 canonical approval screenshots.
- Exact scope inspection: PASS. The only new tracked change is `PROJECT_STATE.yaml`; the inherited
  implementation diffs remain 5 insertions / 3 deletions in
  `operational-snapshot-view.tsx` and 50 insertions / 18 deletions in `staff-board.css`.
  `PHASES.md`, tests, `staff-board-shell.tsx`, `packages/api`, and
  `visual-direction-gate` have no new status entry.
- `probe2.mjs` remains untracked at 2,723 bytes with its inherited 2026-08-08 modification time.
- No application, browser, accessibility, visual, or full verification is claimed by this pass.

## Recommended next session

Execute one bounded Phase 5 Staff Monitoring repository repair on the activated branch. Work only
in the ledger-owned files and the exact Phase 4 browser-test lease; preserve the authored Arabic
Tab order, keep capacity out of the Staff rendering while leaving the DTO untouched, and do not
touch Paper or canonical baselines. Strengthen the stated Staff assertions, run focused checks and
the full isolated verification ladder, then stop for an independent repository verifier and a
durable handoff. Report the exact diff, commands/results, remaining gaps, and protected surfaces
confirmed unchanged.
