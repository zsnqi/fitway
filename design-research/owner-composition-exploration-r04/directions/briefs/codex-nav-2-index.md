<!-- brief-format: v1 role: codex -->
# Codex brief: a generated index for Eclipse (owner-design-exploration-r04, nav-2)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-nav`, branch `owner-r04-nav`, HEAD `51c8ece`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 3 and 4.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` lines 1-8;
  the first 40 lines of `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` and
  its `## ` headings, to learn its row format.

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
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

An agent finds an Eclipse spec row or function by its name and opens the right lines, without reading
`DESIGN-SPEC.md` (170 KB) or `app.js` (189 KB) whole.

## Causes and required outcomes

- **I1.** Agents search these files by eye. Outcome: `eclipse/tools/build-index.mjs` writes `eclipse/INDEX.md`:
  every `DESIGN-SPEC.md` heading and row ID (`STA-10`, `K-38`, `CHT-18` and the like) with its line number and
  its short title; every top-level function, class and named function constant in `app.js`, `components.js`,
  `reports.js` and `tuner.js` with its line number. One line per entry, grouped by file.
- **I2.** An index goes stale silently. Outcome: `node eclipse/tools/build-index.mjs --check` exits 1 and names the
  first stale entry when `INDEX.md` differs from what it would write, and exits 0 when current. Two runs give
  byte-identical output (no timestamps, LF).
- **I3.** `INDEX.md` opens with two lines: what it is and the command that regenerates and checks it. Node built-ins
  only; `pnpm biome check <your files>` passes.

## Scope

You may add `design-research/owner-composition-exploration-r04/directions/eclipse/tools/build-index.mjs` and
`design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`; commit once when done. Everything
else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the entry counts per file and the
size of `INDEX.md`; the files you changed; the commit SHA; anything you could not do.
