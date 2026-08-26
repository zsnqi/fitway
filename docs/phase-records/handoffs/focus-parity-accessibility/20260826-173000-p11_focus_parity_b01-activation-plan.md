# Focus-parity accessibility — activation plan

- Run: `p11_focus_parity_b01`.
- Coordinator baseline: `c3c39580f5d15f104621248beee72e9371d95b00` on
  `codex/remaining-scope-coordinator`.
- Planned worker branch/worktree: `work/phase11-focus-parity-b01` at
  `D:/Projects/fitway-worktrees/phase11-focus-parity-b01`.
- Prior discovery: `20260825-012900-p11_focus_parity_c01-current-target-map.md`, parent gate
  `PASS` / `READY_BOUNDED`.

## Objective and acceptance

Close the three already-proven focus-parity defects without changing composition or product
behavior:

1. public and shared staff/login skip links reveal under programmatic `:focus`, not only
   `:focus-visible`;
2. public, login, and operations-shell focus indicators retain a minimum 2px system-color outline
   in Windows forced-colors mode without double-owning staff-board controls;
3. the owner skip link has no transition under `prefers-reduced-motion: reduce` despite the more
   specific owner rule.

Acceptance requires discriminating browser assertions for all three defects, the focused public,
staff/login, and owner-shell browser specs passing, automated accessibility remaining green, and no
canonical screenshot diff.

## Scope and rollback

Writable implementation scope is exactly:

- `apps/web/src/index.css`;
- `apps/web/src/components/staff/staff.css`;
- `apps/web/src/components/owner/owner-shell.css`;
- `tests/browser/public-baseline.browser.spec.ts`;
- `tests/browser/phase4-staff-web.browser.spec.ts`;
- `tests/browser/phase11-shell.browser.spec.ts`.

Run-local handoffs, route decisions, and verification records for this milestone are also writable.
`PROJECT_STATE.yaml` remains coordinator-only. Paper, screenshot baselines, configuration,
`staff-board.css`, routes, catalogs, tokens, and every other application surface are forbidden.

The implementation stage is one commit. Reverting it restores the pre-slice CSS and browser
assertions while leaving the project consistent. A required edit outside scope, any canonical image
change, or a material visual-direction question stops the stage.

## Stages and gates

1. Coordinator activation: record this plan, route decision, exact ownership, worker identity, and
   lease; commit before implementation.
2. Native writer: add the three CSS repairs and discriminating Playwright assertions, then run the
   three focused specs and `pnpm verify:fast`; write a candidate handoff and freeze the commit.
3. Fresh independent reviewer: read-only scope/contract review plus fresh focused browser and fast
   verification. It reports `PASS` or `FAILED_VALIDATION` and never repairs.
4. Coordinator integration: inspect the complete diff and evidence, integrate the accepted
   candidate, run the registered focused gate, update the ledger and terminal handoff, and stop.

## Verification fixed before implementation

- `pnpm exec playwright test tests/browser/public-baseline.browser.spec.ts tests/browser/phase4-staff-web.browser.spec.ts tests/browser/phase11-shell.browser.spec.ts --project=chromium`
  with a unique `FITWAY_RUN_ID`, unique web port, and run-local artifacts;
- `pnpm verify:fast` with required synthetic process-local environment;
- `pnpm check:repository`, `git diff --check`, formatter/type gates, and candidate-freeze checks
  after all candidate records are written;
- fresh independent review repeats the decisive browser and fast checks from a clean run id;
- coordinator runs the registered focused profile after integration and confirms the worktree is
  clean.

Interactive Browser inspection covers public, login, staff, and owner skip-link/focus behavior in
normal, forced-colors, and reduced-motion modes. Canonical screenshot updates are not authorized by
this slice; the expected image diff is empty.

## Route and authority decisions

Implementation is delegated for recoverability and independent ownership after the delegation
evaluation was reached too late for an unqualified direct selection. Registry revision
`2026-08-25.10` makes normal external capacity unavailable and Ox Alpha standby-only. Native
`gpt-5.6-terra` at `high`, role `worker`, no-history fork is selected because CSS specificity and
three existing Playwright harnesses require bounded coupling awareness.

This slice implements the durable discovery map; it makes no product, security, privacy, content,
or visual-direction decision. FITWAY's existing focus tokens, shell composition, locale behavior,
and canonical images remain locked.

## Current state

At activation drafting, the authoritative coordinator worktree is clean at `c3c3958`. The older
`work/phase11-access-ui-b01` worktree is divergent and dirty with unrelated Settings/Paper records;
it is superseded for current project state and is not an integration source. Its later unit-ladder
record is also superseded because `c3c3958` already contains the accepted reference-gating lifecycle
repair with a different test structure.
