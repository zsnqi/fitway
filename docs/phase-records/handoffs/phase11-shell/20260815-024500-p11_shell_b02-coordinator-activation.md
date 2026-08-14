# Phase 11 owner shell b02 coordinator activation

- Status: `PLANNED -> IN_PROGRESS`. **Fresh attempt** with its own repair counter at `0/2`.
- Branch / worktree / run ID: `work/phase11-shell-b02` /
  `D:/Projects/fitway-worktrees/phase11-shell-b02` / `p11_shell_b02`.
- Base commit: `300c59d` on `main`.
- Dependency: `phase-9` is `DONE`.

## Why b02 is a fresh attempt and not a third b01 repair

`20260810-012600-p11_shell_coord01-failed-validation.md` is explicit: b01 consumed both permitted
repair cycles and "a future fresh activation may reuse the preserved candidate and must begin with a
new attempt record and repair counter; it may not be treated as a third repair of b01". This record
is that new attempt. Rejected candidate `0b015ee` on `work/phase11-shell-b01` and its worktree remain
immutable provenance and are not rewritten, deleted, or resumed.

## What b01 actually proved, and the single thing it did not

The rejected candidate passed, across its own run and two repair cycles: focused 5/5 then combined
21/21 with unchanged Phase 4 and Phase 9 suites, web types and build, Biome, `verify:fast`, the
registered phase gate, Axe with no serious or critical violations in either locale, true 44x44
targets across both locales at 1440/768/390/320, asymmetric non-zero safe-area geometry, navigation
and state invariance, and both canonical screenshots unchanged.

Exactly one assertion remained red at the terminal stop, at
`tests/browser/phase11-shell.browser.spec.ts:475`: under forced-colors emulation one focused
interactive target reported computed `outline-style: none`, where the test requires a non-`none`
outline at least 2px wide for every visible enabled target.

## Coordinator hypothesis, offered as a starting point and not as a finding

Inspection of the preserved CSS, not of the implementer's reasoning: the ordinary focus treatment
uses `outline: 0` with a `box-shadow` ring, which forced-colors mode discards, and the
`@media (forced-colors: active)` block compensates with `outline: 2px solid Highlight` — but it
scopes that rule to `:focus-visible` only. Chromium does not reliably match `:focus-visible` for
programmatic `element.focus()` on links and buttons; it depends on the last interaction modality,
which explains why most targets passed and one did not.

If that holds, covering `:focus` as well as `:focus-visible` inside the forced-colors block is a
genuine accessibility improvement rather than an accommodation to the test, because it guarantees a
visible indicator for any focused interactive target in high-contrast mode. The worker must confirm
or refute this against the actual failing element rather than assume it, and must not weaken the
assertion to make it pass.

## Preserved candidate reapplied onto current `main`

The candidate's touched paths have **no drift** since its base:

```
git diff --stat $(git merge-base 0b015ee main) main -- \
  apps/web/src/routes/admin.tsx apps/web/src/components/owner/ tests/browser/   ->   (empty)
```

So the six candidate paths were checked out from `0b015ee` onto a branch from current `main` and are
staged uncommitted in the b02 worktree: `owner-shell.tsx`, `owner-shell.css`, the `/admin` wrapper
change, `phase11-shell.browser.spec.ts`, and the two canonical screenshots. The b01 completion record
was deliberately **not** carried over; it stays b01 provenance.

## Scope

Owned:

- `apps/web/src/components/owner/owner-shell.tsx` and `owner-shell.css`
- `apps/web/src/routes/admin.tsx`, limited to the shell wrapper switch
- `tests/browser/phase11-shell.browser.spec.ts`
- new `docs/phase-records/handoffs/phase11-shell/*-p11_shell_b02-worker-*.md`

Forbidden, including but not limited to: every backend, API, database, and edge surface; the Phase 9
owner analytics components and their tests; `apps/web/src/components/staff/**`; shared catalogs,
global tokens, and `routeTree.gen.ts`; `tests/browser/phase4-staff-web.browser.spec.ts`,
`phase9-owner-ui.browser.spec.ts`, `public-baseline.browser.spec.ts`, and
`staff-paper-fidelity.review.spec.ts`; `PROJECT_STATE.yaml`; `scripts/verify.mjs`; root manifests,
lockfiles, and configuration; Paper and `visual-direction-gate/**`; every normative document; every
other milestone's record.

**Canonical screenshots are read-only to this worker.** The two `phase11-shell` baselines carried
over are shared coordinator-owned acceptance evidence. b01 proved they stay unchanged across the
repair cycles, and a focus-state fix must not alter the at-rest composition. If the worker observes
a canonical diff it stops and reports it rather than regenerating a baseline.

## Verification profile

`scripts/verify.mjs` has no `phase11-shell` profile at `300c59d`. The coordinator registers it with
`browserFiles: ["tests/browser/phase11-shell.browser.spec.ts"]` and `integrationFiles: []` before the
worker's phase gate, and removes it again if the attempt terminates unintegrated.

## Resources

- worker: run `p11_shell_b02`
- verifier: run `p11_shell_v02`
- coordinator: run `p11_shell_c02`

Playwright derives a run-unique port and output directory from the run ID, so no port is reserved by
hand.

## Exit

The worker completes the phase UI polish loop in both locales across the required widths, runs the
focused suite plus the unchanged Phase 4 and Phase 9 regression, `verify:fast`, and the registered
phase gate, then commits a candidate and stops at `READY_FOR_INTEGRATION`. A fresh verifier that did
not implement it reviews before any merge. Two focused repairs maximum; the third recurrence is
terminal.
