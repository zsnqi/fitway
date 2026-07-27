# phase5-staff-ui handoff

- Status: `NEEDS_HUMAN`
- Base / rejected candidate / safe corrective tip: `d6e7dd8ec8c24e558a85f6cbc0e79cf7ed1de5cf` / `a39475058172f9e1a54e9f6e630d60ae15fc319a` / `01b014d52b6f3dc135ad80ab012f3dec6625e86a`
- Branch / worktree / run ID: `work/phase5-staff-ui-b03` / `D:/Projects/fitway-worktrees/phase5-staff-ui` / `p5_staff_b03a`
- Owned paths used: `commands/**`, `use-staff-commands*`, `/staff`, the Phase 5 staff browser spec, and this handoff. No shared lease was used.

## Decisions and blocker

- Correction stepper, floor-at-zero preview, direct-set validation, optional reasons, destructive reset confirmation, mutation errors, session expiry, and session-local issuance history were implemented against the integrated Phase 5 mutation leaves.
- The integrated API has only `staff.operationalSnapshot`, `staff.issueCorrection`, and `staff.issueReset`. The frozen staff snapshot deliberately has no command lifecycle field. Authoritative `applied` occurs only after an accepted edge push acknowledges `appliedCommandId`; authoritative `superseded` is also repository state.
- Therefore the UI cannot truthfully satisfy the locked pending/applied/superseded presentation from the owned paths. The rejected candidate inferred later status from matching count/time and locally rewrote older pending commands; fresh review proved both can be false. The corrective tip removes those inferences and shows only server-returned issuance status.
- Exact unblock: the coordinator must authorize and integrate a staff-or-owner lifecycle read contract (or explicitly reconcile Product/Spec acceptance) that returns authoritative command IDs and `pending | applied | superseded` status. Backend/API/router work requires a new owner/lease and is forbidden in this slice. After integration, rebind the history, rerun the phase profile, and obtain fresh independent verification.

## Changes by file

- `commands/**`: localized Arabic/English controls, validation, responsive FITWAY styling, lifecycle presentation shell, accessible reset dialog, focus containment/return, and tests.
- `use-staff-commands*`: integrated mutation transport, concurrency guard, server-returned issuance history, errors, and focused tests. No lifecycle inference remains.
- `routes/staff.tsx`: mounts controls only with a usable snapshot response and redirects expired command sessions.
- `tests/browser/phase5-staff-ui.browser.spec.ts`: seven deterministic scenarios covering validation, zero floor, direct set, pending issuance, reset confirmation, 400/403/401, live/stale/closed/unavailable/loading/error, both directions, nine widths, Axe, keyboard/focus, targets, reduced motion, and 200%-equivalent reflow.

## Validation and artifacts

- Rejected candidate `a394750`: `pnpm verify:fast` PASS; assigned `pnpm verify:phase --phase phase5-staff-ui` PASS (34 files / 136 tests, simulator, 6/6 Chromium, mutation guard).
- Fresh verifier run `p5_staff_v01`: the same phase command PASS and seven captures visually sound, but verdict `FAILED_VALIDATION` because lifecycle inference violated edge authority. Interactive Browser discovery returned no available browser.
- Corrective tip `01b014d`: `pnpm verify:fast` PASS (34 files / 135 tests); focused unit/type checks PASS; repaired Playwright suite PASS (7/7) under `output/playwright/p5_staff_b03a_repair`.
- Review captures: `output/playwright/p5_staff_b03a_repair/review`. Canonical screenshots were not changed.
- Manual screenshot review confirmed Arabic RTL/English LTR composition, 390/768/1440 anchors, lifecycle/pending, reset dialog, and the 640 CSS-pixel layout equivalent to 1280 at 200% zoom. The in-app Browser runtime had no connected browser, so no interactive Browser pass is claimed.

## Review findings

- Standards review found unannounced inline errors, bidi isolation gaps, and missing affected-state coverage; the corrective tip adds alert semantics, isolates interpolated runs, covers route states, both-direction widths, zero floor, 403, and reduced-motion behavior.
- Spec review and the independent verifier both found the authoritative lifecycle gap. That finding cannot be repaired inside the lease and remains the sole material implementation blocker.
- The corrective tip has not received a new independent verdict because the contract mismatch remains unresolved.

## Resume

After an authoritative lifecycle read is integrated, start from `01b014d52b6f3dc135ad80ab012f3dec6625e86a`, bind the hook without changing locked semantics, then run a fresh isolated `pnpm verify:phase --phase phase5-staff-ui` and independent Browser/Playwright review. Stop again on any inferred lifecycle state, unleased backend/shared-file edit, Product/Spec conflict, canonical screenshot change, or unavailable required Browser gate.
