# Phase 11 audit generalization c06 — repair candidate ready for independent verification

- Status: candidate frozen, awaiting fresh independent verification.
- Run ID: `p11_audit_gen_c06`. Repair attempt 1 of 2 on the c05 finding.
- Branch / worktree: `codex/phase11-audit-gen-slice-b` in
  `D:/Projects/fitway-worktrees/phase5-staff-integration`.
- Slice base: `da2abc7`. Prior candidate: `70b8bade30d4a44153d355ec41ec8be315397362`.
- Authority: human decision 2026-08-22, option 2 of
  `20260822-041500-p11_audit_gen_c05-needs-human.md`, recorded in full in
  `20260822-145700-p11_audit_gen_c06-activation-and-repair-plan.md`.

## Decisions made, and by whom

- **Human, 2026-08-22:** repair the composition; preserve the approved EN/AR meaning and behavior;
  serialized replacement of the affected canonical baselines is authorized after verification.
- **Coordinator, from the repository:** the defect is broader than the reported label. Measurement
  on `70b8bad` (below) shows every paired mode select clipping in both locales, including controls
  that predate this slice. The repair therefore targets the composition rule, not one control.
- **Coordinator:** option 3 is not taken. Every string in `messages.ts` is byte-identical to
  `70b8bad` in both locales; `git diff 70b8bad..HEAD` over that file is empty.

## Changes by file

- `apps/web/src/components/owner/audit/owner-audit.css`
  - Filter track floor raised from `minmax(210px, 1fr)` to `minmax(min(100%, 256px), 1fr)`, sized
    from the longest option label rather than from the shortest field.
  - The `@media (max-width: 820px)` override that set a 180px floor is removed; one floor now
    governs every multi-column width, and the 720px single-column rule is unchanged.
  - `.owner-audit-field__controls` changes from `minmax(0, 1fr) minmax(0, 1fr)` to
    `minmax(0, max-content) minmax(72px, 1fr)`: each mode select is sized from its own longest
    option in its own locale, the value partner keeps a floor of its own, and if a field is ever too
    narrow for both, the select is squeezed and the label assertion fails rather than the input
    silently collapsing.
  - Stale comment corrected: the scroll hint describes seven columns, not six (verifier [low]).
- `apps/web/src/components/owner/audit/owner-audit-section.tsx`
  - The dead `owner-audit-field--pair` modifier is removed from its three call sites; no rule for it
    existed anywhere in `apps/web/src` (verifier [low]).
- `tests/browser/phase11-audit.browser.spec.ts`
  - New `findFilterSelectLabelOverruns` measures every option of every filter select against that
    control's own content box (`clientWidth` minus both inline paddings, so the 36px arrow lane is
    excluded), at all nine required widths in both locales, with a stated 2px safety margin.
  - The width sweep collects overruns across the whole sweep and asserts once at the end, so one
    clipped width cannot mask the other eight.
- `tests/browser/__screenshots__/win32/chromium/phase11-audit.browser.spec.ts/*.png`
  - Both S4-owned canonical baselines replaced in one serialized pass, after the repair was green.
- `PROJECT_STATE.yaml`, phase records — coordinator-owned; activation, plan, and this record.

## The defect, measured on `70b8bad` before any change

The new assertion was demonstrated red on the unmodified composition. Complete result, content box
against measured text advance, at 13px in the rendered font:

- EN `effective-mode` "Any effective count" 105.12px against 79px (320), 95px (360), 47px (721),
  55px (768), 64px (820), 52px (1024), 74px (1200), 71px (1440).
- EN `reason-mode` "No reason given" 88.02px against 79px (320) and the same 47-74px boxes above.
- EN `prior-mode` "Not recorded" 71.14px and "Any prior" 49.43px against 47px (721).
- AR `effective-mode` default option 77.96px against 79px (320) — inside the 2px margin — and
  against 47/55/64/52/74/71px at 721/768/820/1024/1200/1440.
- AR `prior-mode` default option 71.49px and `reason-mode` contains-option 58.53px at those widths.

Only 390px passed in both locales, because below 721px the fields already stacked to one column.

## Validation commands and results, all on the candidate

Each run used its own `FITWAY_RUN_ID` and its own disposable database named for that run.

- `pnpm check:repository` — PASS: 41 milestones, 8 canonical approval screenshots.
- `pnpm verify:fast` (`p11_audit_gen_c06_g1`) — PASS: 61 files / 452 tests, no repository mutation.
- `pnpm verify:phase --phase phase11-audit` (`p11_audit_gen_c06_g2`, database
  `fitway_integration_p11_audit_gen_c06_g2`) — PASS: 452 unit, 1 integration file / 8 tests,
  19/19 browser, no repository mutation.
- `pnpm verify:full` (`p11_audit_gen_c06_g3`, database `fitway_integration_p11_audit_gen_c06_g3`) —
  PASS: 452 unit, 117 simulator, both builds, 17 integration files / 98 tests, 83 browser and
  accessibility tests, clean mutation guard, clean tree.
- Focused negative control: the layout sweep from `tests/browser/phase11-audit.browser.spec.ts` —
  red on `70b8bad`, green on the candidate.
- Full audit spec before the baseline replacement: 8 passed, 1 failed — only the canonical
  comparison, which is exactly what the serialized replacement then addressed.

Environment note, not a candidate defect: this worktree shell did not carry `CRON_SECRET` or the
integration database variables, and the project Postgres container `fitway-phase2-postgres` was
stopped. The runs above supply those from the repository own `.env` and `apps/server/.env` and start
that container. No repository file carries them.

## Canonical baseline replacement

Serialized, on the locked Windows/Chromium toolchain, after the repair was green, touching only the
two S4-owned files (`git status --short` showed exactly those two).

- `owner-audit-ar-desktop-1440x900.png`
  `983755EFF3EDCF4C76A61295D502FA7C2DBC0B38B9C0964E23723803F70AFDBD`
  to `B07D3EB32C088C624B72BA42C362C144CDFCEB144421C78F7B00EAE05DA9FEBF`
- `owner-audit-en-mobile-390x844.png`
  `F5AF4DEF1BA8217E7340604219DF8E01CC5293BD7E2C49102680519F4A421F3C`
  to `10B7C3DB7A6789A90D94DEB2AF15869EB6EC0B0A88EEBB40E20E1D3C0DC3FA1D`

The previous AR desktop baseline rendered the effective-count control truncated by its final letter.
The replacement renders every filter label whole in both locales.

## Browser, accessibility, and visual inspection

Direct inspection of the rendered review captures under
`output/playwright/p11_audit_gen_c06_b/review/`, not of layer names or DOM structure:

- EN 1440: four filter columns, every label whole, value partners proportioned to their content.
- AR 1440: RTL preserved, mirrored controls, the effective-count label whole.
- EN 768: two columns; the 18px partner sliver produced by the first pass is gone.
- EN 390: single column, every label whole.
- `expectNoDocumentOverflow` holds at all nine widths in both locales; axe reports no serious or
  critical violations in either locale; the 200% reflow capture is unchanged in kind.

## Deviation from the plan, recorded

Stages B and C were planned as separate commits. They landed as one (`4cce33c`) because a commit
carrying only the new assertion would have been a knowingly red commit in the candidate range. The
negative control it existed to provide was performed and is recorded above with its exact values;
reverting `4cce33c` still returns the tree to its `70b8bad` behaviour, so the rollback boundary is
intact. A second commit (`3eb157b`) then corrected the 721-820px band the first pass missed.

## Remaining work

- Fresh independent verification by a session that did not produce this candidate.
- Integration and the `DONE` transition, coordinator-owned, only after that verification passes.

## Not verified here

- Chromium on Windows only; the repository defines no other engine.
- No manual screen-reader pass.
- `scripts/verify.mjs` is coordinator-owned and untouched, so the recorded [low] finding that
  `verify:phase --phase phase11-audit` never runs
  `apps/server/src/phase11-audit-generalization.integration.test.ts` still stands. That file passes
  under `verify:full` (17 files / 98 tests).
- The Arabic target-column microcopy nit from the c05 verifier is a content matter and was not
  touched; changing it would be a copy decision this authorization does not cover.
