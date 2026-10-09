<!-- brief-format: v1 role: verifier -->
# Verifier brief: <title> (<milestone-id>)

For a fresh `owner-direction-verifier` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/<worktree>`, branch `<branch>`, HEAD `<short-sha>`
- **Milestone:** `<milestone-id>`. Decisions: `<repo path to DECISIONS.md>` items <n, m>.
- **Read first, only these:** `<repo path>` §"<heading>" or rows `<ID, ID>`; one line each.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write only in `D:/fitway-temp/<run>/`; the coordinator checks `git status` in every worktree afterwards. (r04 G5)

## What was delivered

<Commit range, the brief it answered (path), and the frames or commands it claims.>

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| <V1> | <one observable claim> | <frame path, measurement, or command output> |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4). Removed pre-intro frames are detected with fonts held to first paint + 50 and + 100 ms
(G2).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line`;
what you could not run and why; anything that reads or behaves wrong though it passes its check or meets its rule,
with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"). At most 50 lines.

## Coordinator checklist (delete before launch)

- [ ] The checklist names observable outcomes, not the implementer's method.
- [ ] Held-out checks, if any, are in the checklist here and were never in the implementer's brief (B5).
- [ ] Every field is a pointer (path and §heading, row IDs, decision numbers); nothing is pasted from a source.
- [ ] `pnpm brief:check <this file>` passes against the worktree it names.
