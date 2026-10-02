<!-- brief-format: v1 role: verifier -->
# Verifier brief: Reports' states options (owner-design-exploration-r04, K-02)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `58d838b`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 2, 4, 8-13.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`;
  `design-research/owner-composition-exploration-r04/directions/briefs/designer-k02-reports-states.md` (what was
  asked); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows K-02, K-38, STA-10…14, PH-1…3 by row ID.

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
  afterwards. A local server, if you need one, uses port 3176 or 3177. (r04 G5)

## What was delivered

Commit `58d838b` over `51c8ece`: three options for Reports' states. The page opens as
`design-research/owner-composition-exploration-r04/directions/eclipse/reports.html?option=a|b|c&state=loading|closed|delayed|unavailable|pending|error` (no `option` = the live page
as before). The designer's frames are in `D:/fitway-temp/owner-r04-k02/out/`; render your own rather than trust
them. An optional measuring kit, itself still under review, is at
`D:/Projects/fitway-worktrees/owner-r04-nav/design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/README.md`.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | Without `option`, Reports renders as at `51c8ece` | byte or pixel equality at 1440, 768, 390, AR and EN, two periods |
| V2 | Every option and state renders at 1440, 768 and 390, AR and EN, with no sideways scroll and no console error | a count of frames rendered and of failures |
| V3 | K-38 closes at 320, AR and EN: the title fits its box and does not move across states | box and text widths, title x per state |
| V4 | No non-live state looks live, and the brightest element is never stale, unavailable or empty (DECISIONS item 8) | what is lit per option and state; where an option departs, say so |
| V5 | Data arriving after loading moves nothing in the first screen | layout-shift sum and first-screen element moves per width |
| V6 | New Arabic and English wording follows `DO-NOT.md` and items 11-12 | each new string, with the rule it meets or breaks |
| V7 | Only files under `design-research/owner-composition-exploration-r04/directions/eclipse/` changed; frames are outside the repository; not pushed | `git diff --stat 51c8ece 58d838b`, `git status` |

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line`;
what you could not run and why. At most 50 lines.
