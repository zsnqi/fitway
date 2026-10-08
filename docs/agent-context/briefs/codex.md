<!-- brief-format: v1 role: codex -->
# Codex brief: <title> (<milestone-id>, round <n>)

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
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

<One or two sentences: what is true after this round.>

## Causes and required outcomes

- **<X>1.** <The cause, with `path:line` or `path:start-end` evidence.> Outcome: <an observable result, not an approach;
  any allowance names its bound>. Intent: <what the outcome is for, so a literal reading that defeats it shows>.

## Scope

You may change `<paths>`; commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the files you changed; the commit
SHA; anything you could not do.

## Coordinator checklist (delete before launch)

The brief rules B1-B10 live here. Codex follows a brief to the letter, so most failed rounds trace to the brief
(`docs/phase-records/handoffs/agent-environment/codex-rounds.md`).

- [ ] B1. Every supported way to open and run the artifact is named (HTTP, `file://`, sizes, reduced motion), with
      the ones the checks cover.
- [ ] B2. Before requiring equality to a baseline, the baseline is checked for the defect being removed.
- [ ] B3. The Scope keeps its last sentence: an unmet outcome is measured and reported, never worked around.
- [ ] B4. Goal, cause and outcomes only; the approach is left open.
- [ ] B5. No verifier probe, threshold or held-out check, and no `fitway-grader` path.
- [ ] B6. One change per round, aimed at one cause.
- [ ] B7. The baseline meets each required outcome under each condition, or that condition is marked "unchanged from
      the baseline"; every command an outcome requires was run on the baseline in that scope first (`git ls-files
      -ci` lists the tracked `.claude/` files the local exclude covers).
- [ ] B8. Each measurable outcome has its intent beside it, so a literal reading that defeats the purpose shows;
      every outcome is literally reachable from the baseline; an allowance ("may trail") states its bound; an
      equality measured in emulation states its noise floor. (user, 2026-10-04; the Intent field since Evaluation
      B8 and B9, 2026-10-07)
- [ ] B9. An outcome about how a value fits names the widest value it can take, not only the current one: the widest
      the code can produce, not the widest the current data shows. (A Widest field was not shown to help.)
- [ ] B10. Every file, section and row the brief names exists at the named HEAD: `pnpm brief:check <this file>`
      passes against the worktree it names.
- [ ] Every limit the result must keep is an outcome of its own: where the tool may run from, length or size caps,
      no text kept twice, and every live artifact the change can reach still passing (evaluation C3). For a file the
      round deletes or renames, `git grep` its path in the open records (resume files, briefs, packets) first, and
      fix them before launch or name them as in scope (r03 round 3).
- [ ] A test suite that needs a clean tree is run after the commit.
- [ ] Every field is a pointer (path and §heading, row IDs, decision numbers); nothing is pasted from a source.
