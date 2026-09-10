# Owner surface completion — coordinator visual acceptance (2026-09-10)

Date: 2026-09-10

## Authorization and provenance

On 2026-09-10 the human owner explicitly authorized the audit-driven
`owner-surface-completion-r01` pass and instructed the coordinator to complete
it through implementation, live rendered inspection, independent review,
verification, final presentation walkthrough, and completion. That
authorization supersedes the `owner-audit-closure-r03` `NEEDS_HUMAN`
Owner-baseline blocker for Owner surfaces only, and is recorded in
`docs/phase-records/handoffs/owner-demo-polish/20260910-owner-surface-completion-r01.md`.

The coordinator regenerated the ten Owner canonicals listed below and inspected
each one against the live product. The human authorized the pass and its
completion; the human did not perform a separate contact-sheet inspection of
these frames, and this record does not claim that they did. This is the
human-approved baseline acceptance required by `PHASES.md` and
`docs/WORKFLOW.md` for the Owner-only canonical updates.

This record does not authorize a Paper mutation, a Public or Staff change, a
privacy or security change, a deployment, or a demo-data reset. The approved
Paper families and registered deviations remain the visual source of truth, and
every accepted case below keeps its registered Paper leaf reference unchanged.

## Accepted per-surface judgments

- **Daily** (Arabic desktop, English mobile): the only intentional changes are
  the unified navigation labels, the "Data coverage" naming, and the
  viewport-fixed atmosphere. The composition is intact and reads stronger next
  to the new surfaces.
- **Activity Log** (Arabic desktop, English mobile): navigation-label and copy
  updates only. Filters and table are unchanged, and the audit
  from-before/to-after wording is now owner-facing.
- **System Status** (Arabic desktop, English mobile): the hero now shows owner
  outcomes (percentage plus offline duration, or "stayed connected") with no
  raw monitored-minute fraction. The period line is reserved so entry is
  layout-stable, and the state panels are unified.
- **Settings** (English desktop clean/loading/error, Arabic mobile): one field
  system with 44px value+unit groups adjacent, 96px time inputs, and "%"
  adjacent; the weekly Status column is corrected; the error state is now a
  unified alert card under the Settings H1. The surface is materially stronger
  and coherent.

## Regenerated canonicals and accepted bytes

Ten existing files were regenerated; none was added or removed. Eight are
honestly Paper-mapped accepted cases and now carry these exact routed SHA-256
values in `tests/browser/visual-authority-cases.mjs`; their `approvalRecord`
paths are unchanged and received dated append-only addenda that record the
superseded predecessor values and link this acceptance.

- `ownerDaily--completed--ar--desktop` —
  `win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png`:
  `1c3dfc4006df48252f69e707e7619d7e8460810525668f26ef8afd1120f07d89` (366947 bytes).
- `ownerDaily--completed--en--mobile` —
  `win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-en-mobile-390x844.png`:
  `b43131097456b32e92b61226eb91fde796a1ecd05989f82830cfd19fab0ae67d` (153769 bytes).
- `ownerActivityLog--populated--ar--desktop` —
  `win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-ar-desktop-1440x900.png`:
  `c63e6675cdfdecdf8b3d504d7a2836a98908cb4c6765b8ad7a582e4db9c969eb` (403091 bytes).
- `ownerActivityLog--populated--en--mobile` —
  `win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-en-mobile-390x844.png`:
  `472aa6a031c2f119a529d250675a023c2127d8eb3586fb8070050e1d1c21a69f` (179893 bytes).
- `ownerSystemStatus--populated--ar--desktop` —
  `win32/chromium/phase11-health.browser.spec.ts/owner-health-route-ar-desktop-1440x900.png`:
  `943a5b72be3a0c5a8c16fb9737e1321f7215ec79e086596af09258238ab5b516` (506687 bytes).
- `ownerSystemStatus--populated--en--mobile` —
  `win32/chromium/phase11-health.browser.spec.ts/owner-health-route-en-mobile-390x844.png`:
  `5c12cadce982570c5c7de3fcbd90262a9e15378691dd141f3572d0bdd86c5e53` (276962 bytes).
- `ownerSettings--clean--en--desktop` —
  `win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-en-desktop-1440x900.png`:
  `072c119077d25815a2da8ad9b1525d4b497934e457b006c36bd80d4f88f325c1` (462970 bytes).
- `ownerSettings--dirty--ar--mobile` —
  `win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-ar-mobile-390x844.png`:
  `7f908136796f2de9d163b6165c2fb32b3c0878afa5a68a42078cee953df3170d` (213528 bytes).

Two additional frames remain regression-only, rejected-listed entries with no
Paper-case mapping:

- Settings loading English desktop
  (`win32/chromium/phase11-settings.browser.spec.ts/owner-settings-loading-route-en-desktop-1440x900.png`):
  `ca7a6ab5cdafce43dfc780053bd3f9c9f1f55edb703129a72a8b31cf0fa2ffdf` (380599 bytes).
- Settings error English desktop
  (`win32/chromium/phase11-settings.browser.spec.ts/owner-settings-error-route-en-desktop-1440x900.png`):
  `86e26f9a0f0ab97b62546437e78e674f73ab0a8ed0d745ca37e71666f9449e0e` (391151 bytes).

No Public, Staff, Login, or any other canonical byte changed in this pass.

## Rejected-baseline tree reconciliation

The 41-file `tests/browser/__screenshots__` rejected-baseline tree SHA-256 moved
from `4de951a4c76905ac5e6eb1e0d4b3e32ef0edd37c9c1fee56e43350b7355b95d4` to
`8764d805a5d4019d25a9cb3391c4461b2190a124ea05c49b43a0ccdd896ce8c0` with the
inventory still at 41 files. The regenerated frames were produced under the
default local Playwright run directory `output/playwright/local_b7bb8bab8088`
on 2026-09-10; its recorded last run passed with no failed tests. The authority
manifest records this acceptance as its current `promotionRecord`, and
`pnpm check:repository` passes against these bytes.

## Repair slice F addendum (2026-09-10)

The human-authorized final repair slice F of the same Owner UI pass fixed three
independent-review findings and re-rendered only the affected Settings frames:

- Owner primary-button hover contrast: an owner-scoped rule in
  `apps/web/src/components/owner/owner-shell.css` now hovers shared default
  `Button`s inside `.owner-shell` to
  `color-mix(in srgb, var(--fw-red) 86%, black)` (rendered
  `rgb(196.94, 21.5, 45.58)`, 5.96:1 with white) instead of `#ff2946` (3.71:1).
  The generic Button, Login, Public, Staff, and every global token are
  untouched; disabled buttons keep their disabled appearance.
- Settings header stability: the settled header now reserves the description
  line (`owner-settings__intro-reserved`, 23px) that the loading and error
  headers render, and the runtime description keeps one line at desktop widths,
  so the measured navigation anchor is 69px in all three states (was 44px
  settled and 92px loading/error) and the shared section tab strip no longer
  jumps when the payload lands.
- Settings chip copy: the chip renders the save state only (`Saved` /
  `Unsaved` / `Not saved`; `محفوظ` / `غير محفوظ` / `لم يُحفظ`) with no revision
  numeral.

Re-rendered regression baselines (none added or removed; all other canonicals
byte-untouched):

- `ownerSettings--clean--en--desktop` —
  `win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-en-desktop-1440x900.png`:
  `f74e35849af287114402841ef39e8efbdad8f33835200bdcec7308058a1a74ec` (461057 bytes).
- `ownerSettings--dirty--ar--mobile` —
  `win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-ar-mobile-390x844.png`:
  `394323e714c63515cf7ae880890544fe54d041773de74148c7d5cbf910bf931a` (212023 bytes).
- Settings loading English desktop (regression-only) —
  `win32/chromium/phase11-settings.browser.spec.ts/owner-settings-loading-route-en-desktop-1440x900.png`:
  `4f5942fbd5eaa4ecfcd315351f62cbc03809efcde5142d3d822d02de3267a1e8` (379999 bytes).
- Settings error English desktop (regression-only) —
  `win32/chromium/phase11-settings.browser.spec.ts/owner-settings-error-route-en-desktop-1440x900.png`:
  `a37f8f2077266f48b74c13ce4de4e0f3793502ffb44cfb128226b02d8bca1da3` (390938 bytes).

The 41-file `tests/browser/__screenshots__` tree SHA-256 moved from
`8764d805a5d4019d25a9cb3391c4461b2190a124ea05c49b43a0ccdd896ce8c0` to
`64b8fb6b6ec88c71c5bdefa338680cede29106ad37075da2c7652e53f0a2fa5f` with the
inventory still at 41 files. The accepted-case routed hashes in
`tests/browser/visual-authority-cases.mjs` carry the two new values, and the
manifest's `rejectedRoutedBaseline.treeSha256` carries the new tree hash. The
re-render used the same default local Playwright run directory
`output/playwright/local_b7bb8bab8088`, and
`tests/browser/phase11-settings.browser.spec.ts` passes 20/20 both with and
without `--update-snapshots`.
