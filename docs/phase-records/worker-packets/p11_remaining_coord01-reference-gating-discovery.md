# FITWAY reference-gating unit debt — read-only discovery packet

## Identity and boundary

- Parent run: `p11_remaining_coord01`.
- Route: `opencode-go/deepseek-v4-pro`, control `high`.
- Worktree: `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`.
- Route-boundary HEAD: `793d84c9535c4faf4f6356c35d703295ba86be01`; later commits may contain only this coordinator packet/route record.
- This is read-only discovery. Keep the worktree byte-identical. Do not run tests.

## Known evidence

During the prior Access candidate's full unit ladder, `apps/server/src/reference-gating.test.ts:5` timed out in its hook at 10,000ms under suite load. The same file passed standalone in approximately 1.17s. A disposable-Postgres contention hypothesis was tested and disproved. Raising timeouts, retries, skips, weakened assertions, or self-registering the failure as flaky are forbidden.

## Objective

Map the smallest plausible root cause and a native reproduction/repair plan. Read only `apps/server/src/reference-gating.test.ts`, its direct helpers/imports, the closest server test files demonstrating the same setup/cleanup pattern, relevant Vitest configuration and verification scripts, and the prior Access/reference-gating evidence discovered with `rg`. Do not read `.env` or any secret value.

## Questions

1. What exactly runs in the timed-out hook, and which operations can block only under full-suite load?
2. Does the file own a lifecycle defect, rely on a shared/global resource, or merely expose a runner contention symptom? Cite every structural claim as `file:line`.
3. Which neighboring tests show the preferred deterministic setup/teardown pattern, if any?
4. What is the smallest writable file set for a focused repair? Production source or test-runner/config need is a stop finding, not authority to expand.
5. Give a native reproduction matrix using unique FITWAY_RUN_ID, disposable database resources, and serialized unit/full ladders. Do not inflate timeouts.
6. Identify the non-vacuity and regression assertions the parent must preserve.

## Return contract

- `VERDICT`: `TEST_LIFECYCLE_BOUNDED`, `NEEDS_NATIVE_REPRODUCTION`, or `STOP_CONDITION`.
- `HOOK_MAP`: exact operations and `file:line` anchors.
- `ROOT_CAUSE_RANKING`: at most three evidence-backed hypotheses.
- `OWNERSHIP_PACKET`: exact writable and forbidden paths.
- `NATIVE_REPRODUCTION`: bounded commands/resources conceptually, without environment values.
- `PARENT_CHECKS`: 4–8 exact checks.
- Final sentinel: `END-OF-MAP`.

Return no file contents or search narration. Do not repair anything.
