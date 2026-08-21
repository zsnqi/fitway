# Phase 11 audit generalization c04 — final repair candidate

## Review disposition

The independent native review of candidate `d6a5818` returned `FAILED_VALIDATION`. It confirmed
the select-arrow root fix, all canonical comparisons, and 9/9 focused Playwright checks, but found
two release blockers:

- the generalized DTO and mapper did not independently reassert the database's owner-only
  governance-author rule or the two destructive-action reason requirements;
- the browser governance fixture used one owner as both actor and target, then searched the whole
  table for the duplicated name.

This is validation repair attempt 2/2. No safety gate was weakened and S5 remains frozen.

## Focused repair

- `auditEntrySchema` and `toAuditEntry` now fail closed unless access/settings rows have a resolved
  owner actor, and unless `staff_pin_deactivated` / `owner_deactivated` carry a reason. These are the
  exact existing database constraints; no new product rule was introduced.
- Unit tests cover non-owner access and settings actors plus null reasons for both destructive
  actions at the schema/mapper boundary.
- PostgreSQL integration now lists a real `owner_deactivated` row through the actor join, aliased
  target join, strict mapper, and repository page, proving the raw target display name survives.
- The browser fixture now uses a distinct owner target and asserts the actor and target cells
  independently in EN and AR.
- The native-select logical inline-end padding fix and the two approved canonical baselines are
  unchanged by this repair.

## Verification so far

- Targeted unit/component: 4 files / 51 tests PASS.
- Exact disposable PostgreSQL database `fitway_integration_p11_audit_gen_c04_repair2`: 2 files /
  20 tests PASS.
- `pnpm check-types`: eight workspace projects PASS.
- Focused S4 Playwright on isolated port 4624/artifacts: 9/9 PASS, including the distinct governance
  target in both locales, all required widths, select logical padding, accessibility, and unchanged
  canonical comparisons.
- `git diff --check`: PASS.

## Remaining release gates

1. Commit this frozen repair candidate.
2. Run the repository-required phase/fast/full verification ladder against the candidate.
3. Obtain a fresh independent read-only review of the repaired candidate.
4. On PASS, durably integrate and mark S4 `DONE`, release the baseline lease, and stop before S5.
