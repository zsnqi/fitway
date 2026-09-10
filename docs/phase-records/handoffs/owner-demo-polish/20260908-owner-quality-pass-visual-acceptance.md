# Human visual acceptance — Owner quality pass canonical reconciliation (S6a)

Date: 2026-09-08

## Authorization and boundary

The human owner explicitly authorized the full Owner-related UI quality repair
by written instruction on 2026-09-08, with the live product as the acceptance
standard and with explicit sign-off on the audit findings that motivated it.
This is the human approval record required by `docs/WORKFLOW.md` for the
serialized canonical reconciliation below. It follows the r06 precedent for
test-expectation adaptation and canonical promotion, and it is honest about its
provenance: the authorization came from the owner's written repair instruction
recorded in the working instruction for this slice (S6a), not from a separate
in-person contact-sheet review.

This record does not authorize a Paper mutation, a product redesign beyond the
registered repair, a privacy or security change, a deployment, or a demo-data
reset. The approved Paper families and deviations remain the visual source of
truth; every change classified below is a routed-layer material, layout, copy,
or navigation refinement over the unchanged Paper authority. Public and Staff
surfaces remained byte-untouched.

## Commit-less working-tree context

Branch `codex/owner-demo-prep` at HEAD `601d219` ("docs: record
presentation-ready r07 completion"). The multi-slice Owner UI repair (control
material unification, Base UI minute pagination, audit select focus migration,
Reports range recomposition, heatmap reading panel, copy updates, coverage
margin, section navigation rest/URL/deep-link contract, Settings loading
skeleton and board materials, Access PIN reveal material, audit date-field
track fill, Health heading restructure) was present entirely as uncommitted
working-tree changes. Before this slice the tree carried those product changes
plus no Owner test or canonical updates; after this slice it additionally
carries the Owner spec adaptations, one product regression fix, seven
re-rendered canonicals, and the registry reconciliation described here. No
commit was created by this slice.

## Comparison and classification

The registered Owner browser suites (phase9-owner-ui, phase10-ui-csv,
phase11-shell, phase11-audit, phase11-access, phase11-health,
phase11-settings, desktop-demo) were run before repair: 74 passed, 7 failed,
3 skipped. Every failure was classified against the written intentional-change
list. Six failures were intentional-change consequences; one was a real
regression introduced by a slice and was repaired in product code.

- Owner Daily (phase9-owner-ui:174, :1008): the disclosure summary now carries
  the reviewed coverage copy ("تغطية القراءات" / "Readings coverage"), the
  minute-page pagination trigger is the unified dark control, and the heatmap
  description copy was updated. The assertion was adapted to the new coverage
  copy and the Daily desktop-Arabic and mobile-English canonicals were
  re-rendered. Analytical values, timezone behavior, and selection semantics
  are unchanged.
- Owner shell navigation (phase11-shell:581): first visits now rest the
  destination heading at its scrollY=0 offset instead of pinning it to the
  viewport top, and remembered restores are clamped ≥ 0. The test already
  encoded the resting contract; its transient-frame assertions were adapted
  (see below). See the regression paragraph for the product fix that made the
  remembered restore hold.
- Activity Log (phase11-audit:843, :932): focus rings moved onto the native
  select elements themselves (the wrapper no longer carries an outline) and
  the minute-page pagination trigger is the unified dark control. The
  focus-ring probe was pointed at the control itself and the desktop-Arabic
  and mobile-English canonicals were re-rendered. Filter transport, paging,
  signed-value isolation, and pagination semantics are unchanged.
- System Status (phase11-health:683): the heading is now a title with a
  subtitle paragraph below it (the range pill no longer sits at inline-end),
  adding ~25px of honest height. The desktop-Arabic and mobile-English
  canonicals were re-rendered. Uptime/incident semantics are unchanged.
- Settings (phase11-settings:496): the loading state renders a real skeleton
  card instead of a text-only pending status. The regression-baseline loading
  canonical was re-rendered. Clean/dirty canonicals stayed byte-untouched:
  their normal assertions passed without re-render.

### Real regression found and repaired (flagged)

The section-navigation slice's URL synchronization used raw
`history.replaceState`. `@tanstack/history` (1.162.0) patches
`window.history.replaceState` and notifies the router, whose
`scrollRestoration: true` then reset the window scroll to top after the
section-switch transition had restored the remembered position — every
remembered restore collapsed back to scrollY 0 (proven with an instrumented
scroll log: restore to 135, router `scrollTo(0)` after settle, no recovery).
Fix: `apps/web/src/components/owner/reporting/owner-section-switch.tsx` now
synchronizes `?section=<id>` through the router's own `navigate` with
`replace: true, resetScroll: false`, preserving the slice's URL, popstate, and
deep-link contract while letting the remembered restore hold. This was a small,
unambiguous slice-introduced defect; nothing else in the product was changed.

## Test expectations adapted (minimal diffs, intent preserved)

- tests/browser/phase9-owner-ui.browser.spec.ts:214 — disclosure coverage
  substring "نسبة الوقت الذي توفرت فيه قراءات" → "تغطية القراءات" (new
  reviewed coverage copy; the assertion still proves the coverage text lives
  in the detail disclosure).
- tests/browser/phase11-audit.browser.spec.ts:867 — the focus-ring probe reads
  the focused control itself instead of the legacy `.owner-audit-select`
  wrapper (the ring intentionally moved onto the select; the assertion still
  proves every focusable control shows a visible ring).
- tests/browser/phase11-shell.browser.spec.ts:688 and :708 — the restore
  probes assert the settled last rAF frame is off the top instead of every
  sampled frame (a transient clamp to 0 while the short retained panel is
  briefly displayed is part of the new settlement; the exact remembered
  positions 135 and near-bottom are still asserted verbatim).

No assertion was weakened; each test's intent survives under the new contract.

## Serialized re-render (run owner_quality_pass_s6a)

A scoped `--update-snapshots` run (grep-limited to exactly the four failing
tests) re-rendered seven existing screenshot files and added or removed none.
Inventory stayed at 41 files.

Re-rendered accepted-mapped canonicals (records updated in
tests/browser/visual-authority-cases.mjs with this record as their
approvalRecord; Paper leaf references untouched):

- Owner Daily completed, Arabic desktop
  (`win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png`)
- Owner Daily completed, English mobile
  (`win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-en-mobile-390x844.png`)
- Activity Log populated, Arabic desktop
  (`win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-ar-desktop-1440x900.png`)
- Activity Log populated, English mobile
  (`win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-en-mobile-390x844.png`)
- System Status populated, Arabic desktop
  (`win32/chromium/phase11-health.browser.spec.ts/owner-health-route-ar-desktop-1440x900.png`)
- System Status populated, English mobile
  (`win32/chromium/phase11-health.browser.spec.ts/owner-health-route-en-mobile-390x844.png`)

Re-rendered regression-baseline canonical (rejected-listed by path, no
accepted-case record):

- Settings loading, English desktop
  (`win32/chromium/phase11-settings.browser.spec.ts/owner-settings-loading-route-en-desktop-1440x900.png`)

Byte-untouched: all Public, Login, Staff, Login-adjacent, Reports (phase10),
Access, Settings clean/dirty, Settings error, Owner shell canonicals, and the
Staff review captures — their normal assertions passed without re-render.
The rejected-baseline tree SHA-256 in the route authority manifest was
recomputed to `7464c87c…` with the file count unchanged at 41.

## Verification status at recording time

After the adaptations and the product fix, the full Owner suite set passed
(27/27 in the focused three-spec run; the four canonical tests passed after
their scoped re-render). The visual-authority registry validation invocation
used by the repository invariants was executed against the updated records.
`verify:fast` / `verify:full` and the mutation-guarded full ladder remain the
coordinator's to run before integration; no commit was created by this slice.

## Append-only addendum — 2026-09-10 owner-surface-completion acceptance

The human owner's 2026-09-10 authorization of the `owner-surface-completion-r01`
pass supersedes the `owner-audit-closure-r03` `NEEDS_HUMAN` Owner-baseline
blocker for Owner surfaces only. Under that authorization the coordinator
inspected the regenerated renders against the live product and accepted them;
the human did not perform a separate contact-sheet inspection. The original
2026-09-08 account above is unchanged. The full per-surface acceptance record is
`docs/phase-records/handoffs/owner-demo-polish/20260910-owner-surface-completion-visual-acceptance.md`.

The canonical this record remains the `approvalRecord` for now carries:

- Owner Daily completed Arabic desktop
  (`win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png`):
  `063721013eb6040fe08835aa31ee2ab8d309c283100585a1453aaf1b08d40342` →
  `1c3dfc4006df48252f69e707e7619d7e8460810525668f26ef8afd1120f07d89`.
