# Phase 11 owner shell — coordinator integration and DONE

- Status: `DONE`. Repair attempts consumed: `0/2`.
- Candidate: `1a4dea5` on `work/phase11-shell-b02`, activation `2f2b518` (`SELF`).
- Coordinator run ID / database: `p11_shell_c02` / `fitway_integration_p11_shell_c02`.
- Rejected b01 candidate `0b015ee` and its worktree remain immutable provenance.

## What shipped

A dedicated owner shell for `/admin` — local rail, navigation, session controls, and brand mark —
replacing the borrowed `StaffShell`. `apps/web/src/routes/admin.tsx` changes only the wrapper; the
route guard, the 401 redirect, and the localized 403 are untouched.

## The defect b01 died on was systemic, not cosmetic

b01's closeout described one focused target reporting `outline-style: none` under forced-colors
emulation. Both the b02 worker and, independently, the verifier established that this was the
assertion loop aborting on its **first** iteration.

The real cause: FITWAY's ordinary focus treatment is a `box-shadow` ring with `outline: 0`, and
forced-color adjustment discards `box-shadow`. The compensating `outline: 2px solid Highlight` was
keyed to `:focus-visible`, which tracks interaction modality. The spec performs a real pointer click
immediately before the forced-colors block, so every subsequently script-focused target reported
`:focus-visible` false. The verifier measured all seven visible enabled targets dropping to
`outline: none` under b01 semantics and reporting `solid 2px` under the candidate — the change is
load-bearing.

A second gap came from the same root: the skip link's reveal was also `:focus-visible`-scoped, so a
focused-but-not-focus-visible skip link stayed parked above the viewport. Fixing only the outline
would have turned the assertion green while drawing a ring on an element the user cannot see. That
is a defect in **normal** rendering, not only in high contrast.

## The fix, and why each site is a legitimate exception

Two selectors move from `:focus-visible` to `:focus`. `DESIGN_GUIDE.md` §11 requires
`:focus-visible` for ordinary controls, so each needs its own justification:

1. **Skip link.** Measured at rest at `top −62.4` (en) / `−66.2` (ar), fully above the viewport and
   not hit-testable — `elementFromPoint` does not return it. There is no pointer path to focus it, so
   `:focus` and `:focus-visible` are behaviourally identical under pointer and `:focus` only adds the
   script case. A strict superset at zero at-rest or pointer cost, and §13 requires a
   "visible-on-focus skip link".
2. **Forced-colors block only.** Verified in normal mode that ordinary rendering is completely
   unaffected: after a real pointer click the language button still reports `outlineStyle: none`.
   Inside forced colors the UA has already discarded `box-shadow`, so the outline is the only
   surviving indicator, and keying it to a modality heuristic lets it vanish entirely. §11 states a
   floor, and `:focus` ⊃ `:focus-visible`, so the floor is still met.

The ordinary non-forced-colors treatment remains `:focus-visible`, so the approved composition is
untouched.

## Test and baseline integrity

`git diff 0b015ee 1a4dea5 -- tests/browser/phase11-shell.browser.spec.ts` is **empty**; blob
`5199d78` on both sides. No assertion was softened, narrowed, skipped, or made `expect.soft`. Both
canonical screenshots are hash-identical to b01 (`2235161`, `5eb282f`) and none was regenerated. The
only delta in the whole slice versus the preserved candidate is `owner-shell.css`.

## Independent verification — `PASS`

A fresh verifier at the exact candidate in its own detached worktree, instructed not to read the
implementer's handoff until it had recorded its own assessment. It performed its own browser
inspection rather than relying on the worker's: both locales across 320/390/768/1024/1440 and the
live, loading, error, and forbidden states.

Measured: skip link settles at `top: 8` and is hit-testable in all ten locale-by-width combinations,
with the logical inset mirroring correctly (`left: 16` in English, `right` = width − 16 in Arabic);
seven forced-colors targets clean at every matrix cell, including a control the spec's own loop never
reaches; tab order matching visual and logical order with focus transfer to `main#operations-main`;
no undersized targets; zero document horizontal scroll at every cell and at 200% zoom; Axe clean at
every impact level in both locales; and owner/staff/anonymous authorization behaving as before.

Ladder: focused 5 passed, combined with the unchanged Phase 4 and Phase 9 suites 21 passed, web
types, Biome, `verify:fast` (49 files / 298 tests), and the registered phase gate — all with a clean
mutation guard. The focused spec ran five times with no flake.

The verifier confirmed afterwards that the worker's handoff converged with its own conclusions on
cause and on both exception justifications.

## Findings

1. **Low, not integrated into this candidate — reduced motion.** The verifier found, independently
   and unreported by the implementer, that `owner-shell.css:57-58` selects the skip link at
   specificity `0,2,0`, outranking the reduced-motion block's `.owner-shell *` at `0,1,0`, so
   `transition: none` never applies to it. It is the only element in the shell retaining a real
   transition under `prefers-reduced-motion: reduce`, animating over roughly 160 ms. The spec's
   reduced-motion assertion checks `.owner-rail`, which correctly reports `0s`, so nothing catches
   it. Inherited from b01, not introduced by b02. `DESIGN_GUIDE.md` §10 sanctions short
   property-specific focus transitions and scopes its reduced-motion clauses to charts and skeletons,
   so this is not a contract violation, but it defeats the component's declared intent.

   **Deliberately not patched into the verified candidate.** Amending code after an independent PASS
   would break the chain between what was verified and what was integrated, for a non-blocking
   finding. It is carried in
   `docs/phase-records/handoffs/coordinator/20260815-031500-focus-parity-gap.md` as gap 3 of the
   pending accessibility slice.
2. **Observation, not a defect.** `OwnerShell` renders both nav links unconditionally where
   `StaffShell` took `showAdminLink`, so a staff user on `/admin` sees the "Owner area" link for the
   page they are already on, carrying `aria-current`. No Spec rule governs this, and the unchanged
   Phase 4 acceptance test still passes.
3. **Cross-surface, out of scope, independently confirmed.** The same `:focus-visible`-scoped skip
   link exists in `staff.css` for the staff, board, and login shells, and `owner-shell.css` is the
   only file in `apps/web/src` with a forced-colors block at all. Recorded as gaps 1 and 2 of the
   same pending slice.

## Not proved

The verifier used Chromium's forced-colors emulation, not a real Windows High Contrast session, so
`Highlight` resolution against actual OS themes is unverified. Chromium only — the `:focus-visible`
modality heuristic is UA-specific, though `:focus` is strictly safer everywhere. The canonical
baselines were verified by hash and by the passing `toHaveScreenshot`, not by fresh pixel inspection
against Paper.

## Released

Owner, heartbeat, and lease cleared. Profile `phase11-shell` retained now that the slice is
integrated.

`phase11-audit` is now unblocked: its authority packet requires integrated shell first.

No push, no deploy, no external provisioning.
