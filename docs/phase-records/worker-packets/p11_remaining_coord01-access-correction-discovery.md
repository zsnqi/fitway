# FITWAY Access repository behavior-correction discovery packet

## Identity

- Parent run: `p11_remaining_coord01`.
- Stage: read-only Access repository behavior-correction discovery.
- Route: `opencode-go/deepseek-v4-pro`, control `high`.
- Worktree: `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`.
- Required route-boundary ancestor: `e1bd67485c8faf4efa0cdaf3c2db1c183a966fd3`; later commits may contain only this coordinator-owned packet or review records.

## Authority and objective

The frozen Paper candidate handoff is `docs/phase-records/handoffs/phase11-access-paper-successor/20260824-233047-p11_access_paper_c01-candidate-freeze.md`. Do not access Paper itself. The active human decision is binding: owner create and reset/change flows preserve the password entered by the user, successful responses contain no generated or returned secret, and the generated-owner-credential Paper state is behaviorally non-authoritative.

Map the smallest repository correction required for the current Access UI candidate to conform to that frozen textual authority. This is investigation only; do not implement or run tests.

## Read boundary

Read only the non-secret repository files needed to answer the questions, expected to include the current Access component, hook, focused unit/browser tests, `apps/web/src/routes/admin.tsx` only if mounting context matters, the Access API contracts, and directly relevant portions of `FITWAY_PRODUCT.md`, `SPEC.md`, and `DESIGN_GUIDE.md`. You may discover more precise targets with `rg`.

Forbidden: every write, Git mutation, `.env` or secret value, Paper access, test/build execution, network access, unrelated source, and further delegation. Do not propose M4/M5 access races, owner-access rate limiting, or the workflow environment-documentation gap. Any transport, backend, schema, or migration requirement is a stop finding, not permission to expand scope.

## Questions

1. What do the current repository create-owner and reset/change-credential flows actually send, render, and retain? Identify whether user-entered password fields already exist and whether any secret is shown after success.
2. What is the smallest behavior and fidelity delta against the frozen handoff? Separate required changes from already-conformant behavior.
3. Give the exact owned file set and line-level anchors for a bounded writer. Explicitly name forbidden sibling/shared files that need no change.
4. Identify the focused unit/browser assertions and canonical baseline impacts needed for a non-vacuous correction gate.
5. State whether the correction remains transport-, backend-, schema-, and migration-free. If not, emit `STOP_CONDITION` with exact evidence.

## Return contract

Return one compact map, not file contents or search narration:

- `VERDICT`: `MIGRATION_FREE_BOUNDED_CORRECTION`, `ALREADY_CONFORMANT`, or `STOP_CONDITION`.
- `CURRENT_BEHAVIOR`: concise bullets with `file:line` evidence.
- `REQUIRED_DELTA`: concise bullets distinguishing implementation, tests, and baselines.
- `OWNERSHIP_PACKET`: exact writable paths and explicit forbidden paths.
- `PARENT_CHECKS`: 4–8 exact checks the coordinator should perform.
- Final sentinel: `END-OF-MAP`.

Do not repair anything. Keep the working tree byte-identical.
