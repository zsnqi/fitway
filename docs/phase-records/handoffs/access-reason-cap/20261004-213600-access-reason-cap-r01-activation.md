<!-- handoff-format: resume-point-v1 -->
# access-reason-cap-r01: activation

- **As of:** `claude/busy-bartik-858366` at `312bd86`, 2026-10-04 21:36 +03:00
- **Previous resume point:** none
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 33 (the reason's length)

## State

The access contract accepts a reason of up to 500 characters (`packages/api/src/access/contracts.ts` (lines 19-23)), while the
audit log stores at most 240 (`packages/api/src/audit/list.ts` (lines 72), the database check in
`packages/db/src/schema/application.ts` (lines 571-573)). The PIN reason field sets `maxLength={500}`
(`apps/web/src/components/owner/access/owner-access-view.tsx` (lines 527)). Read only; no test has run.

## Running now

The worker session `task_fdc69808` in `D:/Projects/fitway/.claude/worktrees/busy-bartik-858366`.

## Next steps

1. Reproduce with a failing test, then cap the contract and both form fields at 240 with their own message (AR and EN).
2. Add the one SPEC.md line, run the authoritative tests, and hand off for independent verification.

## Waiting on the user

Nothing.

## Known risks

- The integration reproduction needs the explicitly named disposable database; server env vars may be missing outside the live worktree.
- The second reason field (owner deactivation, near line 784 of the view) is unchecked.

## Pointers

- Research digest: `D:/fitway-temp/owner-r04-access-questions/REPORT.md` section 5.
- Packet: `docs/phase-records/task-packets/access-reason-cap-r01.yaml`.
