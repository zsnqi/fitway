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

Nothing. **Paused by the user (2026-10-04, "بنأجلها").** The candidate is on `claude/busy-bartik-858366`:
fix `dbc7431`, receipt `c7cd8cb` (`docs/phase-records/handoffs/access-reason-cap/20261004-221500-access-reason-cap-r01-evidence-receipt.md`),
reproduced red and green on unit and integration. `verify:fast` fails only at `check:frontier`: the fix changes three
files the pinned 2026-09-15 frontier snapshot protects. The user authorized a narrow recorded transition for exactly
those three paths (packet limitations), but Claude's auto-mode classifier refused it in the coordinator session, and
the worker refused to act on an approval relayed by another session.

## Next steps

1. Reproduce with a failing test, then cap the contract and both form fields at 240 with their own message (AR and EN).
2. Add the one SPEC.md line, run the authoritative tests, and hand off for independent verification.

## Waiting on the user

The user resumes it, or it waits for the move of production to the Owner redesign, which replaces these files.
To resume: in a session running in the prompting permission mode, the user confirms the transition directly and
approves the prompt; that session merges `origin/codex/owner-redesign-r04`, records the transition after the
20260919-134000 pattern, reruns `verify:fast`, and hands off for independent review.

## Known risks

- The integration reproduction needs the explicitly named disposable database; server env vars may be missing outside the live worktree.
- The second reason field (owner deactivation, near line 784 of the view) is unchecked.

## Pointers

- Research digest: `D:/fitway-temp/owner-r04-access-questions/REPORT.md` section 5.
- Packet: `docs/phase-records/task-packets/access-reason-cap-r01.yaml`.
