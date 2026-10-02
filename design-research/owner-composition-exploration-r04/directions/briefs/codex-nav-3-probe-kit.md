<!-- brief-format: v1 role: codex -->
# Codex brief: the verifier probe kit in the repository (owner-design-exploration-r04, nav-3)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-nav`, branch `owner-r04-nav`, HEAD `25795c9`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 4 and 6, rounds item 4.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` §"Open and capture"; the sources named under K1.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Playwright, Node scripts that run git or a browser) fail inside
  it: request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- A local server, if you need one, uses port 3178 or 3179 (3174 is the user's preview; 3176-3177 are in use).

## Goal

A verifier measures Eclipse with one maintained kit in the repository instead of copying one of 26 diverging
`lib.mjs` files out of temp folders.

## Causes and required outcomes

- **K1.** The kit lives outside the repository in copies. Outcome: `design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/` (new) holds one library
  built from `D:/fitway-temp/fonts-r1-verify/probes/lib.mjs` (the fullest: per-variant server, cache switches, font
  holds, `PROBE_PORT`), plus `overflowProbe()` and `openReports()` from
  `D:/fitway-scratch/reports/work/probes/lib.mjs`, `open()` and `shot()` from
  `D:/fitway-scratch/review/tools/lib.mjs`, and `D:/fitway-scratch/lane/work/geom.mjs` and
  `D:/fitway-scratch/lane/work/a11y.mjs`. Where two sources define the same name differently, keep one and report
  the difference. One-off scripts and Python helpers in those folders stay out.
- **K2.** Every copy hard-codes a worktree, an output folder and a port. Outcome: the Eclipse folder, the output
  folder and the port come from environment variables with stated defaults (the folder is found from the kit's own
  location; the port defaults to 3178); Playwright is reached through `createRequire` on the enclosing worktree's
  `package.json` with `@playwright/test`; the kit refuses to write its output inside any git working tree.
- **K3.** Nobody knows the kit runs until a verifier tries. Outcome: `design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/README.md` (new) lists each
  export in one line and gives one run line; that run line, executed in this worktree, opens `design-research/owner-composition-exploration-r04/directions/eclipse/index.html` and
  `design-research/owner-composition-exploration-r04/directions/eclipse/reports.html` at 1440×900 in Arabic, both over `file://` and over the kit's server, writes one screenshot each
  into the output folder, runs the overflow, geometry and accessibility probes once, and prints one pass line.
  Report its output.

## Scope

You may add files under `design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/` (new); commit once when done. Everything else is read-only, including the
source folders. Add no dependencies. `pnpm biome check` does not process `design-research/**`; do not try to make it.
If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the exports and where each came
from; the name conflicts you resolved; the files you added; the commit SHA; anything you could not do.
