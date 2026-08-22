# Phase 11 audit generalization c06 — human-authorized composition repair: activation and plan

## Human decision recorded

On 2026-08-22 the human approver chose **option 2** from the c05 decision record
(`20260822-041500-p11_audit_gen_c05-needs-human.md`): **repair the composition**.

Verbatim scope of the authority granted:

- A composition repair for the effective-count filter truncation is authorized.
- The approved EN/AR meaning and behavior must be preserved. The control/layout composition is
  adjusted so the required labels render correctly across the required responsive widths.
- If the corrected composition requires it, **serialized replacement of the affected canonical
  baselines after verification** is authorized.
- Repository truth overrides the authorizing prompt.

Option 3 (new EN/AR copy) is therefore **not** taken: every message string in
`apps/web/src/components/owner/audit/messages.ts` stays byte-identical. The fix is layout only.

## Attempt identity

- Run ID: `p11_audit_gen_c06`. Phase: `phase11-audit-generalization` (S4).
- Branch: `codex/phase11-audit-gen-slice-b` (unchanged). Worktree:
  `D:/Projects/fitway-worktrees/phase5-staff-integration`.
- Base for the repair: the preserved c05 candidate `70b8bade30d4a44153d355ec41ec8be315397362`.
- Slice base commit for range checks stays `da2abc7`; `main` remains at `da2abc7`.
- Repair budget: this repair is **attempt 1 of 2** against the c05 finding. c05 consumed 0.
- Preserved and untouched: the c03/c04 terminal records, candidate `e42b6c4`, and every c05 record.

## Objective, in observable terms

At all nine required widths (320, 360, 390, 721, 768, 820, 1024, 1200, 1440) in both `en` and `ar`,
every `<select>` inside `.owner-audit-filters` renders its **widest** option label fully inside its
own content box — that is, measured text advance width fits within
`border box − padding-inline-start − padding-inline-end`, with the 36px native-arrow lane preserved.

This is stronger than the reported defect, which named only the effective-count default option. The
c05 coordinator confirmation established that the pre-existing prior-count control already overruns
by 2px at 721, so the acceptance criterion covers every filter select, not just the new one.

## Root cause, as read from the repository

- `apps/web/src/components/owner/audit/owner-audit.css:46-48` sizes every filter field from one
  uniform track: `grid-template-columns: repeat(auto-fit, minmax(210px, 1fr))`.
- `apps/web/src/components/owner/audit/owner-audit.css:68-72` splits the three paired fields
  (prior, effective, reason) into two **equal** columns: `minmax(0, 1fr) minmax(0, 1fr)`.
- The mode `<select>` therefore receives roughly half of a 210px-floored field, while the numeric or
  text partner receives the same half despite needing far less. Subtracting the 12px inline-start
  padding and the 36px arrow lane (`owner-audit.css:88-90`) leaves a content box in the 47–74px
  range at the multi-column widths, against a 105px EN label advance.
- The narrow widths pass only because `auto-fit` collapses to a single wide column there.

The root cause is the equal split combined with a track floor that was sized for the unpaired
fields. It is composition, not copy — which is exactly the finding the human ruled on.

## Planned change

Scope, all inside S4 `ownedPaths`:

1. `apps/web/src/components/owner/audit/owner-audit.css`
   - Raise the filter track floor to a value that admits the widest select label, expressed as
     `minmax(min(100%, <floor>px), 1fr)` so a narrow viewport collapses the track instead of
     forcing document overflow.
   - Give the paired controls an asymmetric split: the mode `<select>` takes the free space, its
     numeric/text partner takes a bounded track sized for the values it actually accepts.
   - Remove the dead `owner-audit-field--pair` modifier or give it the rule it always implied
     (verifier [low] finding; it is the natural carrier for the asymmetric split).
   - Correct the stale six-column comment at `owner-audit.css:115-118` to seven (verifier [low]).
2. `tests/browser/phase11-audit.browser.spec.ts`
   - Add the missing assertion the verifier identified as [medium]: the existing width sweep asserts
     the arrow lane but never that the option text fits inside it. The new assertion measures each
     filter select's widest option against its own content box at every swept width and locale.
     This is the negative control for the defect — it must fail on `70b8bad` before the CSS changes.

Explicitly out of scope: `messages.ts` (any locale), the audit table, the API/repository layer,
`scripts/verify.mjs` (coordinator-owned; the [low] verify:phase profile gap stays recorded, not
fixed, inside this slice), the Arabic target-column microcopy nit, and every path in
`forbiddenPaths`.

## Stages and rollback boundaries

- **Stage A — activation.** This record plus the `PROJECT_STATE.yaml` transition. Rollback: revert
  the activation commit; the candidate is untouched.
- **Stage B — failing assertion.** The browser assertion alone, demonstrated red on the unmodified
  composition. Rollback: revert that commit; the suite returns to its c05 state.
- **Stage C — composition repair.** The CSS change that turns Stage B green. Rollback: revert that
  commit; Stage B goes red again and nothing else moves.
- **Stage D — serialized canonical baseline replacement.** Only the two S4-owned PNGs, regenerated
  on the locked Windows/Chromium toolchain after C is green, under the human authorization above.
  Rollback: `git checkout` the two files from `70b8bad`.

## Verification, fixed before the work starts

- `pnpm exec playwright test tests/browser/phase11-audit.browser.spec.ts` — the new assertion red at
  Stage B, green at Stage C, and 19/19 at Stage D.
- `pnpm check:repository`, `pnpm verify:fast`, `pnpm verify:phase --phase phase11-audit`,
  `pnpm verify:full`, each on the final candidate, each with a unique `FITWAY_RUN_ID`.
- `git diff --check da2abc7..<candidate>` exit 0, plus the whitespace and freeze checks over the
  full range, run **after** every durable record for this attempt is written.
- Fresh independent verification by a session that did not produce the candidate, carrying the human
  decision above, returning PASS or FAILED_VALIDATION without editing.

## Risks and unknowns

- Raising the track floor reduces the desktop column count. That is a visible composition change and
  is precisely what the authorization covers; it is why Stage D exists.
- `min(100%, …)` is the guard against the new floor overflowing at 320px. `expectNoDocumentOverflow`
  already covers that at every swept width and must stay green.
- Text advance measured through canvas `measureText` is an approximation of the select's own
  shaping. It is used as the assertion basis because it is deterministic; the acceptance margin is
  stated in the test so a marginal pass is not mistaken for a comfortable one.
- The two canonical PNGs are platform-bound. Regeneration happens only in this serialized pass.

## Open decisions

None blocking. The single open decision that stopped c05 is now recorded above.
