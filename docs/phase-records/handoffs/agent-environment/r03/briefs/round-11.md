<!-- brief-format: v1 role: codex -->
# Codex brief: verify-fitway reports plainly (agent-environment-r03, round 11)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-verify`, branch `agent-environment-r03-verify`, HEAD `70bc51c1`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 19.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/codex-rounds.md`, the section on round 9 (result f32d4cca, level
    xhigh): its "Also found" line.
  - `.agents/skills/verify-fitway/SKILL.md` and the scripts beside it.

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
- Other rounds run beside this one in other worktrees. The contract tests and the CLI bind ports 3176-3177: if they
  are taken, wait with Monitor until both are free (up to 90 minutes) instead of reporting a failure; never stop a
  process you did not start. (round 8: H10 failed on a held port)
- The concept is the Eclipse folder of `owner-followup-r04-build` at `1d3539a3`; read it from your own
  `git archive` in your run folder, never from its worktree. Its recipe file is `verification-recipes.json` there.

## Goal

Every verify-fitway outcome a user or agent reads names what happened once, and a missing dependency or recipe file
says how to fix it.

## Causes and required outcomes

- **V1. No recipe file reads as a pass.** `map.mjs:641-661` counts recipe files with no minimum and `cli.mjs:468-471`
  prints `DRIFT PASS: 0 recipe files found and checked.` (`pnpm check:verification-map` on `70bc51c1`). Outcome: with no
  recipe file the command says that no recipe file was found and does not print PASS; with one or more the output is
  as now. The fast ladder runs this command (`scripts/verify.mjs:358`) and still passes on a tree with no recipe file.
  Intent: CI never reads "nothing checked" as "checked".
- **V2. A missing dependency gives a raw module error.** `discover.mjs:6-18` resolves `typescript` lazily; only `help`
  and the doctor name the install step (`cli.mjs:86-87`, `:306-307`), so `map`, `list` and `drift` in a clone without
  `node_modules` print `Cannot find module 'typescript'`. Outcome: every command that needs a dependency names the
  missing package and the install command, and prints no stack. Intent: a cold agent recovers in one step.
- **V3. The doctor prints its failure twice.** `cli.mjs:310-319` prints `DOCTOR FAIL` and `FIX`, then rethrows, and
  `cli.mjs:665-668` prints `FAIL:` with the same message; `drive` does the same. Outcome: each failure prints one
  block. Intent: one fault reads as one fault.
- **V4. Keyboard-unreachable is counted as a problem.** `runner.mjs:529-531` sets `keyboard-unreachable` and
  `:590-599` counts every status but `pass` and `not-reachable` as a problem. Outcome: the drive summary counts items
  not reachable by keyboard separately from failures and names each; the exit status still fails when one is not
  reachable. Intent: the reader sees which kind of finding it is.
- **V5. The summary drops the feature's proof.** `runner.mjs:131` writes only the state proof, while the feature proof
  (`drive.mjs` `proveFeature`, used at `runner.mjs:405-466`) never reaches the entry. Outcome: each summary entry
  carries the proof that the feature's state was reached (for a dialog, that it is open), beside the state proof.
  Intent: a pass shows what it proved.
- **V6. Tab steps carry the activation's label.** `drive.mjs:163-191` gives every Tab step the activation's `action`.
  Outcome: each recorded step names what it was (a Tab move and where focus went, or the activation). Intent: the
  evidence reads as what was done.
- **V7. Proven.** Outcome: tests for V1-V6, each failing on `70bc51c1` and passing after, run in the fast ladder;
  `node scripts/verify.mjs fast` passes on your committed, clean tree; `drift` on the build's concept still passes.
  Intent: the repairs are shown, not claimed.

## Scope

You may change `.agents/skills/verify-fitway/` and `.claude/skills/verify-fitway/`; commit once when done. Everything
else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
