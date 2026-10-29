<!-- brief-format: v1 role: codex -->
# Codex brief: a lint for the Owner concept's CSS (agent-environment-r03, round 13)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-css`, branch `agent-environment-r03-css`, HEAD `70bc51c1`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 13, 16.
- **Read first, only these:**
  - `docs/phase-records/handoffs/owner-design-exploration/r04/good-css-review.md`: the findings this lint makes
    checkable (hover gating, `transition: all`, `ease-in`, `outline: none`).
  - `scripts/verify.mjs`: how the fast ladder runs a script's tests.

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
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- Other rounds run beside this one in other worktrees. The fast ladder's contract tests bind ports 3176-3177: if they
  are taken when you run the ladder, wait with Monitor until both are free (up to 90 minutes) instead of reporting a
  failure; never stop a process you did not start. (round 8: H10 failed on a held port)
- The live concept is the Eclipse folder of `owner-followup-r04-build` at `1d3539a3`; read it from your own
  `git archive` in your run folder, never from its worktree. This branch's own copy of the folder is older.

## Goal

The good-css review's four findings become a command that names each occurrence in a concept folder, so the Owner fix
round can prove them gone and a later change cannot bring them back unseen.

## Causes and required outcomes

- **C1. Nothing checks them.** The review counted them by hand (77 `:hover` lines, 4 gated; 12 `outline: none`; 0
  `transition: all`; `ease-in` unused); no script in `scripts/` reads a concept's CSS. Outcome: `pnpm
  check:concept-css -- <folder>` reads every `.css` file in the folder and prints, per finding, the file, line and
  rule, then a count per rule, for: a `:hover` selector not inside an `@media` whose condition includes
  `(hover: hover)`; a `transition` or `transition-property` naming `all`; an `ease-in` timing function (not
  `ease-in-out`) or its `cubic-bezier` equivalent in a transition or animation; an `outline: none` or `outline: 0`
  with no visible focus indicator in its place on the same element (an outline, box-shadow or border set by the rule
  or by a `:focus`, `:focus-visible` or `:focus-within` rule for it), unless a comment on the declaration names the
  selector that draws the ring and that selector exists with a focus style. It exits non-zero when any finding
  exists. Intent: each finding is one line a fixer can act on, and the moved-ring cases the review describes can be
  declared rather than miscounted.
- **C2. It never touches what it reads.** Outcome: the command writes nothing in the folder and runs on any folder
  path, including one outside the repository and one with no CSS (which it reports as such, not as a pass). Intent:
  it lints the build's concept from any checkout.
- **C3. Proven.** Outcome: tests with planted fixtures for each rule and each exception (a gated hover, `ease-in-out`,
  a replaced outline, a declared moved ring, a declared ring whose selector does not exist) run in the fast ladder's
  unit-test step; the command's counts on the build's folder at `1d3539a3` are reported beside the review's;
  `node scripts/verify.mjs fast` passes on your committed, clean tree. The command itself is not added to the ladder.
  Intent: the lint is trusted before it is used to judge a fix.

## Scope

You may add `scripts/check-concept-css.mjs` (new) and its test, and the one `check:concept-css` line in `package.json`'s
scripts section; commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be
met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the counts on the build's folder per
rule; the files you changed; the commit SHA; anything you could not do. At most 25 lines.
