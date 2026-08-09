# Login Paper adoption coordinator closeout — FAILED_VALIDATION

- Status: `FAILED_VALIDATION`; not integrated.
- Activation commit: `471d3a31dd8ef61236786d337e7dad98bd91011f`.
- Rejected candidate: `9b65356cfefe8b9a42e41b4912d9efa7af020345` on
  `work/login-paper-adoption-b01`.
- Worktree: `D:/Projects/fitway-worktrees/login-paper-adoption`, clean at closeout.
- Repair attempts consumed: 2.
- Shared leases: none; released.

## Candidate preserved

The worker preserved seven owned paths: the Login route adaptation, local Login chrome and CSS,
one focused browser specification, two Login-only canonical screenshots, and its terminal handoff.
The candidate is 1,124 insertions and 24 deletions from the activation commit. It remains available
on its worker branch and was not cherry-picked to `main`.

No shared/global file, catalog, existing browser test, existing screenshot baseline, Staff/Admin/
Public surface, Paper artifact, or normative source changed. In particular,
`tests/browser/phase4-staff-web.browser.spec.ts` remained byte-for-byte unchanged.

## Validation outcome

- Focused Biome: PASS.
- Web build and TypeScript check: PASS.
- Focused Login browser suite after repair cycle 2: FAIL, 6/7 passing.
- Passing focused coverage: Arabic/English; 1440/768/390/320; responsive RTL/LTR physical rail;
  no overflow; two canonical screenshot assertions; invalid, service, and rate-limit visuals with
  frozen semantics; keyboard/focus/44px targets; 200% zoom; reduced motion/transparency; and Axe
  serious/critical checks.
- Browser/Paper comparison at 1440, 390, and 320 found the implemented spacing, typography,
  contrast, alignment, fit, and repetition consistent with the approved Login family.
- Deferred after the mandatory stop: the unchanged Phase 4 browser suite, `pnpm verify:fast`, the
  registered phase gate, and fresh independent review.

The remaining failure is isolated to the new test. Its submitting-state assertion reuses
`getByRole("button", { name: "Open operations" })`; the product correctly changes that accessible
name to `Signing in…`, so Playwright can no longer resolve the old-name locator while the transient
state is rendered. Repair cycle 1 fixed nondeterministic keyboard setup. Repair cycle 2 gated the
request deterministically and exposed this stable locator defect. A third occurrence triggered the
repository's terminal validation rule; no further code/test edit or run was permitted.

## Evidence

- Worker terminal handoff on the rejected branch:
  `docs/phase-records/handoffs/login-paper-adoption/20260810-000221-login_paper_b01-failed-validation.md`
- Latest disposable review captures:
  `D:/Projects/fitway-worktrees/login-paper-adoption/output/playwright/login_paper_b01_focus2/review/`
- Latest failure evidence:
  `D:/Projects/fitway-worktrees/login-paper-adoption/output/playwright/login_paper_b01_focus2/test-results/login-paper-adoption.brows-f816f-en-authentication-semantics-chromium/`

## Smallest safe resume action

A newly authorized activation may begin from the rejected checkpoint, replace only the submitting
assertion's accessible-name-dependent locator with a stable owned locator, and rerun the focused
suite before the deferred Phase 4 and repository ladders. No implementation defect is indicated by
the terminal evidence. This closeout grants no automatic third repair cycle.
