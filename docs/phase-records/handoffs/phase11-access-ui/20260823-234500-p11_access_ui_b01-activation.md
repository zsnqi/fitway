# Slice B — `phase11-access-ui`: activation

Milestone `phase11-access-ui`, run `p11_access_ui_b01`, branch `work/phase11-access-ui-b01`,
base `0ef72c2` — the integrated head after P1, **not** the `aaa646b` the plan named.

The approved specification is the "Slice B" section of
`docs/phase-records/handoffs/coordinator/20260823-124724-p11-access-successor-sequence-plan.md`.
It is not restated here. This record covers only what has changed since that plan was written, plus
the coordinator-owned activation work.

## The blocker is gone, and it was removed differently than planned

The plan's first human decision read:

> The load-sensitive browser debt is stabilized before Slice B activates. All three entries carry
> `surface: ["apps/web/**", "tests/browser/**"]`. Slice B is entirely inside that surface, so it
> could not attribute any of those three reds.

That is satisfied. All three entries are **closed** (`phase11-browser-debt`, integrated `ffe3745`,
independent review PASS). Slice B can now be judged on a ladder where those three assertions are
deterministic rather than load-dependent.

**But it was not removed the way the plan assumed, and the difference matters to this slice.** The
plan implicitly treated the debt as a stabilization problem. An intermediate slice,
`phase11-ladder-contention`, tested the obvious infrastructure fix — raising Playwright's `expect`
timeout from 5000 ms to 20000 ms — and **falsified it**: assertions given four times the budget still
failed with the element *absent*. It reverted, and closed with a net-zero code diff.

The two mechanisms that were actually proven, and that Slice B must design against:

1. **A state that has already passed.** A transient bounded by a fixture timer, sampled after
   navigation, hydration and a click, is gone before the assertion runs. Hold the state open under
   test control; do not race it.
2. **A fixed wall-clock window hydration can outrun.** A freshness window built from Node's
   `Date.now()` can close before first paint, so the state never renders at all. Anchor to a
   controlled page clock.

**Raising a timeout is not the fix, and this is not a matter of opinion here — it was tested and
falsified.** Evidence:
`docs/phase-records/verification/20260823-p11_ladder_contention_b01-falsification-result.json`.

## What is new for Slice B

- **A new-to-this-repository pattern is now in use**: `page.clock.install()` / `pauseAt` /
  `fastForward`, with three worked examples in `tests/browser/phase2.browser.spec.ts`,
  `phase3.browser.spec.ts` and `phase10-ui-csv.browser.spec.ts`. The non-obvious part is recorded in
  their comments — react-query delivers cache notifications through `setTimeout(0)`, which a paused
  fake clock owns, so flush steps are load-bearing rather than decorative.
- **The known-flaky register is empty of open entries.** If a new load-sensitive failure appears in
  Slice B's own spec, **no entry covers it and none may be opened by the run that hits it.** It is
  Slice B's to fix, using the two mechanisms above.
- **One out-of-scope site is known to fail intermittently**:
  `apps/server/src/phase2.integration.test.ts:779`, observed three times by three sessions, scheduled
  as milestone `phase11-e2e-propagation-wait`. It is **not attributable** — it may not be cited to
  excuse a red run — but a Slice B ladder that goes red *there* is not a Slice B defect. Record it,
  re-run, and do not repair it.

## Coordinator-owned activation work, in this commit only

- **`scripts/verify.mjs`** — new `phase11-access` profile. `integrationFiles` is the existing access
  integration test; `browserFiles` lists the new access spec **plus every sibling `/admin` spec
  present at activation**: `phase11-audit`, `phase11-health`, `phase10-ui-csv`, `phase9-owner-ui`,
  `phase11-shell`. The comments at the `phase11-health` and `phase11-audit` profiles record two
  separate occasions where omitting a sibling hid a real regression until coordinator `verify:full`
  caught it. This profile is written not to make that mistake a third time.
- **`PROJECT_STATE.yaml`** — the milestone, its lease, and `phase-11`'s dependency list extended.

## Scope

Per the plan, unchanged. Owned paths are the new `apps/web/src/components/owner/access/**` subtree,
`apps/web/src/hooks/use-owner-access.ts` and its test, `tests/browser/phase11-access.browser.spec.ts`
and its own baseline subtree, and this slice's records.

**Shared lease, one file:** `apps/web/src/routes/admin.tsx`, exclusive, limited to mounting the access
Owner section. The shell composition, the route guard, every sibling section and every other URL stay
unchanged.

**Forbidden**, per the plan and now also: `playwright.config.ts`, `vitest.config.ts`,
`vitest.integration.config.ts` and `scripts/verify.mjs` after this activation commit — the contention
slice held that lease, tested it and falsified it, and reopening it is not this slice's work.
`packages/**`, `apps/server/**` and `packages/db/**` remain forbidden: **if the UI turns out to need a
transport or schema change, that is a stop condition, not a decision inside this slice.**

The seven approved action labels, the secret-free audit rule, and the owner lifecycle decisions are
human-locked. M4, M5, rate limiting on the owner access leaves, and the `docs/WORKFLOW.md` step-8
environment gap remain carried forward and unscheduled.

## The highest-risk element, restated because it is easy to lose

**The one-time PIN reveal** is three risks at once — security (no persistence past the reveal, no log,
no screenshot leak), accessibility (focus placement and focus *return* around a transient credential
display), and copy (unambiguous that the value is shown once). It gets its own review axis, not one
line in a component review.

Its acceptance is specific: the revealed PIN appears in exactly the two flows the locked decision
names and no other path; it is not persisted in client state past the reveal; it is in no log and no
rendered audit row; and **no canonical screenshot captures real PIN material** — a baseline containing
a credential is a blocking finding.

## Known human gate

**Canonical screenshot baselines stay under human approval**, whoever generates them, per
`docs/WORKFLOW.md`. They must be generated in this worktree with the locked toolchain. A material
design change is `NEEDS_HUMAN`.

## Stages

Route is **Open** on every implementation and investigation stage, evaluated when the stage opens,
from this record and the plan, **before that stage's own target-file reading is performed by anyone
including the coordinator**, with its route-decision JSON written before the stage is assigned.

Stage 1 is the surface investigation the plan already scoped. Stage 7 independent verification must
not route to whichever candidate implements the writing stages.

## Open decisions

**None blocking.** The plan's two scoping questions were answered by the human when it was written,
and the debt precondition is now satisfied.
