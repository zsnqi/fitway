# Phase 11 owner shell b02 worker candidate

- Status: `READY_FOR_INTEGRATION`. Repairs consumed: `0/2` (no gate went red after the fix).
- Base commit / candidate commit: `2f2b518` (activation) / see commit recorded by the coordinator.
- Branch / worktree / run ID: `work/phase11-shell-b02` /
  `D:/Projects/fitway-worktrees/phase11-shell-b02` / `p11_shell_b02`.
- Owned paths used: `apps/web/src/components/owner/owner-shell.css` only, plus this handoff.
  No shared lease was taken or needed.

## Diff against the preserved b01 candidate

```
git diff --stat 0b015ee -- apps/web/src/components/owner apps/web/src/routes/admin.tsx tests/browser
 apps/web/src/components/owner/owner-shell.css | 22 ++++++++++++----------
```

`owner-shell.tsx`, `apps/web/src/routes/admin.tsx`, `tests/browser/phase11-shell.browser.spec.ts`,
and both canonical screenshots are **byte-identical** to the preserved candidate. The failing
assertion at `phase11-shell.browser.spec.ts:475` was not touched, narrowed, or skipped.

## Root cause

The coordinator hypothesis **held**, and the real defect is broader than the single red assertion
reported by b01.

The failing element is the shell's own skip link, `a.operations-skip-link` — the first target the
forced-colors loop reaches. Surveyed under forced-colors emulation after a pointer interaction, all
seven visible enabled targets reported the same thing:

| target | `outline-style` | `box-shadow` | `:focus` | `:focus-visible` |
| --- | --- | --- | --- | --- |
| `.operations-skip-link` | `none` | `none` | true | false |
| `.owner-rail__logout` | `none` | `none` | true | false |
| `.owner-rail__language` | `none` | `none` | true | false |
| `.owner-nav__link` (x2) | `none` | `none` | true | false |
| `.owner-rail__brand` | `none` | `none` | true | false |
| `.owner-chart-interaction` | `none` | `none` | true | false |

So b01's "one red target" was only the loop's first iteration aborting the test. The actual gap: in
forced-colors mode the ordinary `box-shadow` focus ring is discarded by forced-color adjustment, and
the compensating `outline: 2px solid Highlight` was scoped to `:focus-visible`. `:focus-visible`
tracks the last interaction modality, so after any pointer interaction **no** focused control in the
owner shell carried any focus indicator at all in high-contrast mode.

A second, related gap surfaced from the same survey: the skip link's reveal
(`transform: translateY(0)`) was also `:focus-visible`-scoped, so a focused-but-not-focus-visible
skip link stayed parked at `translateY(-160%)` above the viewport. An outline drawn on an off-screen
element is not a visible focus indicator; fixing only the outline would have turned the assertion
green while the user still saw nothing.

## Fix

Two selector changes in `owner-shell.css`, both `:focus-visible` -> `:focus`, each confined to a
state that cannot be reached by pointer or that has no design cost:

1. `.owner-shell .operations-skip-link:focus` now performs the reveal. `DESIGN_GUIDE.md` §13 requires
   a "visible-on-focus skip link" and that "focus is never hidden"; the link parks off-screen and is
   unreachable by pointer, so `:focus` is a strict superset of the previous behaviour with no
   at-rest or pointer-interaction change.
2. Inside `@media (forced-colors: active)`, the `outline: 2px solid Highlight` rule is keyed to
   `:focus`. In high-contrast mode a guaranteed indicator outranks suppressing the ring for pointer
   focus, and the outline is the only indicator that survives forced-color adjustment.

Both rules carry comments explaining why the departure from `:focus-visible` is deliberate, so a
later reader does not "correct" it back.

The ordinary (non-forced-colors) focus treatment remains `:focus-visible` exactly as before, so
`DESIGN_GUIDE.md` §11's `:focus-visible` requirement and the approved visual composition are
untouched. Biome reflowed the forced-colors selector once `:focus` shortened it; it is now written as
two selectors, which keeps specificity above every competing rule in the file.

## Validation commands and results

| # | command | result |
| --- | --- | --- |
| 1 | `playwright test tests/browser/phase11-shell.browser.spec.ts` | **5 passed** |
| 2 | `playwright test phase11-shell + phase4-staff-web + phase9-owner-ui` | **21 passed** |
| 3 | `pnpm --filter web check-types` | **pass**, exit 0 (`vite build && tsc --noEmit`) |
| 4 | `biome check` on the four owned files | **pass**, "Checked 4 files. No fixes applied." |
| 5 | `pnpm verify:fast` | **pass**, "passed without repository mutation" |
| 6 | `FITWAY_PHASE=phase11-shell pnpm verify:phase` | **pass**, 5 passed, no repository mutation |
| 7 | `git diff --check` / `git status --short --branch` | clean / only the six candidate paths |

Runs 5 and 6 require `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` exported from
`apps/server/.env`; without them `apps/server/src/cron.test.ts` fails on environment rather than on
this change. Phase 4 and Phase 9 suites were run unmodified.

## Polish loop evidence

- Locales: Arabic RTL and English LTR, both exercised for geometry, axe, and the focus states.
- Widths: 1440, 768, 390, 320 in both locales (spec test 1), plus 640 for the focus/reflow test.
- States: live, loading, error, forbidden; rail bounding box proven identical across all three.
- Skip-link reveal measured under pointer modality at every width and locale: settles at `y = 8`
  in all eight combinations, right-anchored in Arabic (x = 1192/520/142/72) and left-anchored at
  x = 16 in English, so the logical inset mirrors correctly. Height 44-46.4px, at or above the
  44px minimum. Retracts above the viewport on blur.
- Forced colors: the 2px `Highlight` ring was confirmed by rendered screenshot on the skip link,
  the logout button, and the brand link, not only by computed style.
- Also covered by the passing suite: keyboard order and focus return (skip link -> Enter -> `main`),
  44x44 targets, reduced motion and reduced transparency, live regions (`status` and `alert`),
  200% zoom reflow, asymmetric non-zero safe areas at 768 and 320, and no document-level
  horizontal scrolling.
- Axe: no serious or critical violations in either locale.

## Canonical screenshots

Confirmed **unmodified**. Both baselines hash-match the preserved b01 candidate
(`223516149dd3509421e579510e7650d2897c88fc` and `5eb282fdc58bcc21e731e78b1fb876d90e0b1da6`), and the
`toHaveScreenshot` test passes against them, so the at-rest composition is unchanged. No baseline was
regenerated.

## Independent verifier findings

None yet — a fresh verifier that did not implement this candidate has not reviewed it.

## Remaining work / blockers

None. One observation for the coordinator, outside this worker's scope and deliberately not acted
on: `apps/web/src/components/staff/staff.css:205` carries the same `:focus-visible`-scoped skip-link
reveal for the staff and login shells, and `owner-shell.css` is the only file in `apps/web/src` with
a `@media (forced-colors: active)` block at all. The same two gaps therefore still exist on the
staff, board, and login surfaces. That is a separate phase's decision, not a Phase 11 repair.

## Exact resume command

```powershell
Set-Location 'D:\Projects\fitway-worktrees\phase11-shell-b02'
$env:FITWAY_RUN_ID='p11_shell_b02'
node_modules\.bin\playwright.CMD test tests/browser/phase11-shell.browser.spec.ts --reporter=line
```

## Stop / escalation conditions

Stop and escalate `NEEDS_HUMAN` on any canonical baseline diff, any material change to the approved
at-rest composition, or any Product/Spec conflict. Do not merge, push, edit `PROJECT_STATE.yaml`, or
alter the verification profile from this worker.
