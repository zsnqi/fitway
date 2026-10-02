<!-- brief-format: v1 role: verifier -->
# Verifier brief: finish V5 and V6 of the K-02 review (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `15c0103`
  (the eclipse folder equals `58d838b`)
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 4, 8, 11-12.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/briefs/verifier-k02-reports-states.md`
  (the original brief and checklist); `D:/fitway-temp/owner-r04-k02-verify/PARTIAL.md` (the previous verifier's
  results and resume commands); `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` (for V6).

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write only in `D:/fitway-temp/owner-r04-k02-verify/`; the coordinator checks `git status` in every worktree
  afterwards. A local server uses port 3176 or 3177. (r04 G5)

## What was delivered

Commit `58d838b` over `51c8ece`, as in the original brief. V1-V4 and V7 are recorded in PARTIAL.md; take them as
given and do not rerun them. Reuse the previous run's scripts in `D:/fitway-temp/owner-r04-k02-verify/`.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V5a | The remaining V5 runs in PARTIAL.md "To resume": timed arrivals, `file://`, HTTP under `no-store` and with no cache header | CLS and first-screen moves per option, width and language for each run |
| V5b | Arrival after a retry (error, then retry, then data) moves nothing in the first screen | the same measures, per option |
| V5c | Each move V5 finds is visible to a person | before and after crops at 2x of the 1440 EN header and peak meta, and of any other element that moves more than 1 px |
| V5d | Which moves are shared by all three options and which belong to one option | a per-option list |
| V6 | Every new Arabic and English string in `58d838b` follows `DO-NOT.md` and items 11-12 | each string, its option, and the rule it meets or breaks; wrapping at 390 AR in the error, pending and closed frames |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

The V5 and V6 rows with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with
`file:line`; the paths of the crops; what you could not run and why. At most 40 lines.
