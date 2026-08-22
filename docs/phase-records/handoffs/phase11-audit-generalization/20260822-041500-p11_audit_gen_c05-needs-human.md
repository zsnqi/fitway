# Phase 11 audit generalization c05 — NEEDS_HUMAN on approved visual authority

## Terminal state of this attempt

- Status: `NEEDS_HUMAN`. Repair attempts consumed by c05: `0`.
- The stop is an authority conflict, not repeated validation failure. No repair was attempted
  because every available fix crosses human visual authority.
- Base / candidate: `da2abc7` / `70b8bade30d4a44153d355ec41ec8be315397362`. Candidate preserved,
  not integrated. `main` remains at `da2abc7`; Slice A remains integrated at `e6c14b5`.
- The c04 terminal record and frozen candidate `e42b6c4` remain untouched. S5 remains frozen.

## What c05 completed

- Opened the human-authorized successor attempt with its own durable activation record.
- Corrected the single carried whitespace defect forward: one trailing blank line removed from each
  of two c04 handoff records, with no content change (`git diff --ignore-blank-lines` empty for both).
- Re-earned every executable gate on this candidate, then submitted it to a fresh independent
  verifier that did not produce it.

## Executed evidence, all on candidate `70b8bad`

- `pnpm check:repository` — PASS: 41 milestones, 8 canonical approval screenshots.
- `pnpm verify:fast` — PASS: 61 files / 452 tests.
- `pnpm verify:phase --phase phase11-audit` — PASS: 452 unit, 1 integration file / 8 tests, 19/19 browser.
- `pnpm verify:full` — PASS: 452 unit, 117 simulator, both builds, 17 integration files / 98 tests,
  83 browser and accessibility tests, clean mutation guard, clean tree.
- Pre-submission freeze over `da2abc7..70b8bad` — frozen: clean worktree, whitespace clean in
  worktree, index, and full range, Biome clean, repository invariants clean.
- `git diff --check da2abc7..70b8bad` exit `0`; `git diff --check da2abc7..e42b6c4` exit `2`, preserved.
- Canonical PNG hashes unchanged from the c04 record: AR desktop
  `983755EFF3EDCF4C76A61295D502FA7C2DBC0B38B9C0964E23723803F70AFDBD`, EN mobile
  `F5AF4DEF1BA8217E7340604219DF8E01CC5293BD7E2C49102680519F4A421F3C`.
- Disclosed flake, no repair made: the first `verify:full` failed one Phase 2 browser-timing
  assertion (5000ms locator wait on the public live count), outside the c05 owned scope. The file
  then passed 9/9 in isolation and the second full run passed complete.

## Independent verdict: FAILED_VALIDATION

The fresh native verifier ran its own ladder from run ID `v11d_audit_gen_r1` with its own disposable
database and returned FAILED_VALIDATION on one high finding, plus lower findings recorded below.

### The blocking finding

The effective-count filter select truncates its default option label mid-word at most required
review widths. Measured against the select content box (border box minus 12px inline-start and the
36px arrow lane):

- EN "Any effective count" — 105px of text against 71px (1440), 74px (1200), 52px (1024), 64px (820),
  55px (768), 47px (721), 95px (360), 79px (320). It fits only at 390.
- AR at the same widths — 78px against 71/74/52/64/55/47px.

Located at `apps/web/src/components/owner/audit/messages.ts:59` and `:139`, rendered by
`owner-audit-section.tsx:154-170` inside the two-equal-column grid at `owner-audit.css:68-72`.

### Coordinator confirmation, independent of the verifier numbers

- The label is new to this slice: `effectiveAny` was introduced at `30d6abc`. Its siblings are much
  shorter — "Any prior", "Any reason" — which is the width budget the existing composition assumes.
- The verifier own EN desktop capture renders the control as "Any effectiv".
- **The human-approved canonical baseline itself contains the truncation.**
  `tests/browser/__screenshots__/win32/chromium/phase11-audit.browser.spec.ts/owner-audit-ar-desktop-1440x900.png`,
  replaced at `d6a5818` under the approval recorded in
  `20260822-000500-p11_audit_gen_c04-resume-activation.md`, renders that control truncated by its
  final letter while its sibling prior-count control renders in full.
- Copy alone cannot resolve it. The worst-case content box is 47px at 721, and the pre-existing
  "Any prior" already overruns there by 2px, so no meaningful label of this kind fits at every
  required width in the current grid. The root cause is the composition, and it also affects
  controls that predate this slice.

## Why this stops instead of being repaired

`AGENTS.md` makes a material visual-direction change immediately `NEEDS_HUMAN`, and `docs/WORKFLOW.md`
requires human approval to update a canonical baseline or alter a locked visual decision. Every path
forward crosses that line:

- changing the filter composition alters a Paper-governed surface and the approved S4 composition;
- changing the EN and AR label copy is a bilingual content decision no authority currently specifies;
- accepting the current rendering means ruling that the approved baseline is approved as it stands.

The 2026-08-22 approval authorized serialized replacement of exactly the two canonical S4 audit
screenshots for the required target-column and effective-mode composition. It does not say whether
the truncation inside that composition was intended. Only the human can settle that, and any fix
that changes the rendering requires a fresh serialized baseline approval.

## Decision required

Choose one, and record it:

1. **Accept as approved.** Rule that the approved baseline stands as rendered and the finding is a
   disagreement with an accepted visual. c06 then re-submits the unchanged candidate for a fresh
   independent verification carrying that ruling.
2. **Repair the composition.** Authorize a bounded visual change to the filter control sizing, plus
   a serialized replacement of both canonical baselines for the corrected composition. This also
   touches the pre-existing marginal clipping on the prior and reason selects.
3. **Repair the copy.** Authorize new EN and AR labels for the effective-count filter. This narrows
   the overrun but does not by itself make every required width fit, so it likely pairs with 2.

Options 2 and 3 change user-visible rendering and therefore require a fresh canonical baseline
approval. Option 1 requires none.

## Other verifier findings, none blocking, none repaired

- **[medium]** The slice visual gate asserts the arrow lane 36px padding but never that the selected
  option text fits inside it — `tests/browser/phase11-audit.browser.spec.ts:661-672`. It passes 9/9
  while the labels clip at those same widths.
- **[low]** `verify:phase --phase phase11-audit` never runs
  `apps/server/src/phase11-audit-generalization.integration.test.ts`; the profile at
  `scripts/verify.mjs:113-125` lists only the Phase 11 audit file. That test passes (12 tests) but
  only under `verify:full`. `scripts/verify.mjs` is coordinator-owned and was correctly untouched.
- **[low]** Dead CSS modifier `owner-audit-field--pair` applied at
  `owner-audit-section.tsx:123,154,212` with no rule anywhere in `apps/web/src`.
- **[low]** Stale comment at `owner-audit.css:115-118` says six columns; the table now renders seven.
- **[low]** Arabic microcopy for the target column and its empty state reads as a calque for an
  account column. Content nit, not a locked decision.
- **[info]** The secret-free assertion at `phase11-audit.integration.test.ts:653-655` dropped one
  term and added four; net coverage is stronger and the drop is required because the prior and new
  credential-version fields are legitimate non-secret fields.
- **[info]** The preserved c04 terminal record says the historical whitespace check exits 1; it
  exits 2. The record is terminal and correctly left unedited; c05 records state 2.

Verifier bulky artifacts are under the session scratchpad at `v11d`; coordinator run artifacts at `c05`.

## Ledger correction made with this record

The verifier found `ownedPaths` did not authorize three record globs the range actually adds
(`*-p11_audit_gen_v02-*`, `*-c03-*`, `*-c05-*`). That is a coordinator ledger inaccuracy, not
candidate code, and it is corrected in this commit so the ledger describes what the phase actually
wrote. No candidate file was touched.

## Verification not performed

- No repair, so no post-repair gate run exists.
- The verifier inspection was Chromium on Windows only; the repository defines no other engine.
- No manual screen-reader pass; automated axe found no serious or critical violations in either locale.
- Access and settings governance write paths are S5/S6 and do not exist yet, so end-to-end governance
  writes could not be exercised.

## Recommended next session

Mode: `plan`, and only after the human records one of the three decisions above. Do not repair, do
not integrate, do not regenerate any canonical baseline, and do not start S5 before that decision.
