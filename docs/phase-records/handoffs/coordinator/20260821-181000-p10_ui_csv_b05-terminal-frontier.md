# Phase 10 UI/CSV b05 — terminal frontier and the one open human decision

- Recorded: 2026-08-21 18:10 +03:00.
- Milestone `phase10-ui-csv-b05`: `FAILED_VALIDATION`. Not integrated. `main` unchanged at `87c42dc`
  plus this record; nothing from b05 has been merged.
- Candidate: `bf44049` on `codex/phase10-ui-csv-b05`, worktree
  `D:/Projects/fitway-worktrees/phase10-ui-csv-b05`, clean.
- Repair 2 source commit: `d3cef4f`; its result record is
  `docs/phase-records/handoffs/phase10-ui-csv/20260821-171500-p10_ui_csv_b05-repair-2-result.md`
  in that worktree.
- `validationRepairAttempts` exhausted at `2/2`. Under the rule stated in the repair-2 activation
  record, this rejection is the terminal third recurrence.

## Why this is terminal rather than a third repair

The repair 2 activation named the failed gate as reporting/CSV control-board density and allowed one
final source repair. The repair reproduced the approved skeleton and passed everything executable,
but the fresh fidelity gate rejected the same gate a third time. The remaining difference is not a
mechanical defect a third repair would fix — it is a placement question about repository-owned
privacy copy that no agent has the authority to settle. Spending a third repair on it would be
spending it on a decision, not on an implementation.

## Gate 1 — fresh independent Paper fidelity review: `FAILED_VALIDATION`

Read-only, fresh session, confirmed the Paper content hash `3b0faca3` for file
`01KYPX5AF950XZVVDD88B6J7QB`, Page 1, area `17YY-0` itself.

**Accepted as matching the approved composition.** Board width `664`, padding `16px 18px` desktop
and `16px` mobile, radius `16px` / `28px`, internal gap `12`, heading line `22`, control row `63`,
action bottom-aligned on the control row, `blur(22px) saturate(1.14)`, board fill
`rgba(29,24,28,0.125)`, edge `rgba(220,197,201,0.18)`, inset lift `rgba(255,238,240,0.027)`. Where
the reporting board is not stretched to a taller sibling — stacked full-width at `721`–`820` — it
renders at exactly the approved `131px`. The reviewer's own words: the approved skeleton is
reproduced correctly.

**The single rejection driver — row count.** The approved board is two rows, `[22, 63]`. The
candidate export board is three, `[22, 63, 36]`, the third being the supporting line carrying
`csvDescription` and `csvPrivacyNote`; that row measures `72px` at `390`. Because the boards are
equal-height by a locked decision, the extra row holds both at `179px` against an approved `131px`
at `1440`, and leaves `48px` of visibly empty box at the bottom of the reporting board. The reviewer
searched approved area `17YY-0` for that copy at every breakpoint and found it placed nowhere on any
board.

Measured deltas: `1440` both boards `179` vs `131`; `768` reporting `131` vs `133` and export `179`
vs `133`; `390` reporting `207` vs `183`, export `291` EN / `253` AR vs `198`; `320` reporting `300`
vs `239`.

**Reviewer's stated smallest remedy, not applied:** move `messages.csvDescription` and
`messages.csvPrivacyNote` out of `[data-owner-reporting-export]` to section prose beneath the control
pair and drop `.owner-reporting-board__aside`. Every string is preserved, no IDREF changes, and both
boards then render at the approved `664x131` with the void gone.

**Secondary observations, none verdict-driving.** The heading metadata wraps to a second line at
`390` and a third at `320`, because the catalog's `rangeHint` is a 58-character sentence where
Paper's placeholder metadata is 17 characters — the reviewer classed this as a content consequence
the repository owns, and noted part of Paper's `18px` mobile heading comes from the mobile specimen's
`system-ui` anomaly that plan v3 forbids inheriting. During CSV export the desktop boards stretch to
`354px` with `225px` empty, which is the same stretch mechanism, and Paper composes no desktop
exporting board to violate. At `320` with 200% zoom the "Prepare export" button's box extends past
the root's right edge; the reviewer flagged its own measurement uncertainty there and confirmed
`d3cef4f` did not introduce it.

**Re-confirmed still passing:** desktop heading/tab seam sharing the route heading row, mobile
full-width seam, Arabic heading at the right-side reading start, inherited Cairo 400–700 with no
`system-ui`/800, the removed History hairline, labelled-region-only horizontal scroll, narrow
containment (`scrollWidth - clientWidth = 0` at 320/390/768/1440 in both locales at zoom 1 and 2),
synchronized heatmap selection / roving `tabIndex` / `document.activeElement`, frozen daily siblings,
and both the invalid-range and CSV-exporting states.

## Gate 2 — fresh independent candidate verification: `PASS`, meaning `READY_FOR_INTEGRATION` only

Fresh session, no Paper access, explicitly conditional on the fidelity gate it does not own.

Scope: `36` changed paths across `git diff 7ef287e...HEAD`, **none outside scope**. The inherited
`bd580c9` merge was confirmed to be a genuine carry that altered no inherited path — the diff against
`cd4c0fb` is the activation side alone. `apps/web/src/routes/admin.tsx` stays inside its active route
lease: `beforeLoad`, the 401 redirect, the 403 branch, every message key, section order and URLs are
unchanged. `packages/db/**`, the frozen reporting contracts, `reporting-repository.ts`,
`apps/web/src/i18n/**`, `routeTree.gen.ts`, canonical baselines, `PROJECT_STATE.yaml`, the verify
scripts, root manifests and `visual-direction-gate/**` are all untouched. No debug, generated, or
scratch artifacts.

Conformance: no message string removed, shortened, or reworded; `rangeHint` and `csvHint` kept their
element ids so every `aria-describedby` IDREF still resolves; both `<legend>` elements survive as
clip-based `fw-sr-only`, so both fieldsets keep an accessible name; every `label`/`for`,
`aria-labelledby` and `aria-controls` resolves; error, `role="alert"`, live-region, CSV
abort/download lifecycle and 44px targets untouched; the three new procedures are `ownerProcedure`
reads with no writer.

Commands re-run independently under `_verify` identities: focused Vitest `43/43`, `check-types` PASS,
`verify:fast` PASS on a clean tree, unit `447/447`, simulator `117`, integration `10/10`, focused
Chromium `5/5`, `verify:phase --phase phase10-ui-csv` PASS with **`30/30` browser** and no repository
mutation, `git diff --check` clean. The two frozen Phase 11 Arabic canonical element screenshots that
failed at repair 1 pass in a fresh environment with no baseline file moved.

### New finding carried forward — MEDIUM, unaddressed

`tests/browser/phase10-ui-csv.browser.spec.ts:268-285` and `:939` — `expectNoOverflow(page, true)`
skips the section-level `overflow.reporting <= 0` assertion at all nine widths in both locales, and
the two surviving checks cannot substitute for it because `apps/web/src/index.css:3-9`
(`html{overflow-x:clip}`, `body{overflow-x:hidden}`) and `owner-shell.css:12` clip reporting overflow
before it reaches document or body. The compensating box checks cover only the export start button,
the disclosure summary, `.owner-reporting__note` and `.owner-reporting__footnote` — not the
comparison table, reading panel, legend, date inputs, or problem messages. Introduced in `13992d3`,
**not** by repair 2. The strict form still runs and passes once at `:1041`, and no clipping was found
in the 390/768/1440 review captures in either locale.

This finding must not be spent as a third repair. Resolve it inside whatever successor attempt the
human authorizes, or record it as an accepted residual at integration.

### Inherited findings, pre-existing at `bd580c9`

- `owner-reporting.css:138-139` — the Arabic timezone label and its value collide.
  `.owner-reporting__window bdi` uses `margin-inline-start: 6px`, but `<bdi>` defaults to `dir=auto`
  and `Asia/Riyadh` computes `ltr`, so the 6px lands on the far side of the run and renders with no
  separator. The sibling window-range `<bdi>` is unaffected because its content is Arabic-first.
- `messages.ts:53,65,123` / `:177,189,247` — `hourAxis`, `selectedExpected`, `csvExporting` are
  defined in both catalogs and never rendered.
- `owner-reporting.css:515-524` — heatmap cells are `26px` by `min-inline-size: 18px`, below the
  44px practical minimum in `DESIGN_GUIDE.md:231`; mitigated by the adjacent semantic table and the
  roving-tabindex keyboard grid.
- `owner-reporting.css:680-682` — `overflow-wrap: anywhere` on the board note permits mid-word breaks
  in Arabic as well as English.

### Test-strength caveats recorded by the verifier

Genuine negative controls include the whole `expectBoardDensity` group — `hintRows === 0`, the
`0px 0px` action divider, `board.height <= 180` at 1440 and `=== 131` stacked, the 63/44 row
geometry, the mobile full-width action row, the 17px heading offset and 12px gap — plus the
heading-seam locator, the board material assertions, the equal-height assertion, and the heatmap
`toBeFocused()` steps. Tautologies that guard rather than prove: the `44px` tab height, the Cairo
family/weight range, the clamp and RTL-direction content of the heatmap steps, the History round
trip, and the board padding values. The density constants are hardcoded Chromium-plus-Cairo pixel
values — platform-pinned like a screenshot baseline without being one — and a font or browser bump
will break them. Both control-board helpers measure the default state only.

## Process defect in this session, owned by the coordinator

Both gates were run concurrently against the same worktree, and the fidelity reviewer's brief
permitted a throwaway probe spec under `tests/browser/`. That probe existed briefly while the
candidate verifier was running and failed its first `verify:fast` on Biome. The verifier detected the
contamination, waited for a clean tree, verified the tracked spec blob against `HEAD` before
accepting any result, and every figure it reported comes from the clean tree — so its verdict stands.
The probe was deleted and both worktrees are clean at `bf44049`.

The rule this violated: a read-only reviewer must not write into a tracked directory of a worktree
another session is validating. Future concurrent read-only gates either take separate worktrees, or
their probes go outside the repository. Parallel review remains allowed; parallel writes into a
shared tracked tree do not.

## The one open decision — human only

**May `messages.csvDescription` and `messages.csvPrivacyNote` move out of the CSV export control
board to section prose immediately beneath the control pair?**

- Approved area `17YY-0` places neither sentence on any board at any breakpoint; the approved boards
  are two rows everywhere.
- Repair 2 kept them on the board because the activation boundary forbids hiding privacy information
  and because relocating privacy copy away from the control that produces the file is a composition
  decision, not an implementer's call. That reasoning is why the work stopped here rather than
  continuing.
- The fidelity reviewer's counter-position, verified in its report: relocation hides nothing, keeps
  the copy visible in the same panel and contained at 390, depends on no `aria` relationship, and
  the surface already carries comparable explanatory prose in `.owner-reporting__footnote`.
- Cost of yes: both boards reach the approved `664x131` at desktop, the `48px` void disappears, and
  the milestone can proceed with a bounded successor.
- Cost of no: the approved density is unreachable while the copy stays on the board, and Phase 10
  closes only by accepting a permanent documented deviation from `17YY-0`.

Nothing else in Phase 10 is blocked on anything else. No other milestone is waiting on a decision.

## State of the world

- `main` at `87c42dc` plus this record and the ledger update. No b05 content merged.
- `codex/phase10-ui-csv-b05` preserved at `bf44049`; `codex/phase10-ui-csv-b04` immutable at
  `cd4c0fb`; every preserved ref untouched.
- `phase-10` remains `PLANNED`; its dependency on `phase10-ui-csv-b05` is unmet.
- S3 and every later stage of
  `docs/phase-records/handoffs/coordinator/20260816-224000-completion-preflight-and-remaining-execution-plan.md`
  are not started.
- Disposable Postgres `fitway-phase2-postgres` was restarted on `127.0.0.1:55432`; the three
  `fitway_integration_p10_ui_csv_b05*` databases exist and are disposable.

## Resume condition

A human answers the placement question above. A successor attempt then needs explicit authorization
exactly as b05 did after b04, and should carry `bf44049` forward non-destructively, apply the chosen
placement, and additionally close the MEDIUM overflow-guard finding.
