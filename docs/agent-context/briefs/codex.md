<!-- brief-format: v1 role: codex delivers: commit -->
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
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
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

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it. Your diff is reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before
you start. (agent-tooling DECISIONS item 14)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

For `delivers: commit`, include exactly one `commit` line. For `delivers: report`, omit it. Add one row for every
outcome and limit ID the brief defines. A PASS command must match a command started after the last edit inside the
worktree, and its output must be one line the command printed. Outside the block, also list the files you changed and
anything you could not do.

## Coordinator checklist (delete before launch)

The brief rules B1-B14 live here. Codex follows a brief to the letter, so most failed rounds trace to the brief
(`docs/phase-records/handoffs/agent-environment/codex-rounds.md`).

- [ ] B1. Every supported way to open and run the artifact is named (HTTP, `file://`, sizes, reduced motion), with the ones the checks cover.
- [ ] Set `delivers: commit` when the round delivers a commit; use `delivers: report` when the round only grades,
      reviews, investigates, or otherwise must not commit.
- [ ] B2. Before requiring equality to a baseline, the baseline is checked for the defect being removed.
- [ ] B3. The Scope keeps its last sentence: an unmet outcome is measured and reported, never worked around.
- [ ] B4. Goal, cause and outcomes only; the approach is left open.
- [ ] B5. No verifier probe, threshold or held-out check, and no `fitway-grader` path.
- [ ] B6. Each outcome aims at one cause and has its own check. A round may group several small causes, related or not, when each
      is verified on its own; split them when one changes what another measures, when one needs a decision or another base, or
      when the brief outgrows one review. (user, 2026-10-14; the rounds that grouped five independent causes graded cleanly)
- [ ] B7. The baseline meets each required outcome under each condition, or that condition is marked "unchanged from
      the baseline"; every command an outcome requires was run on the baseline in that scope first (`git ls-files
      -ci` lists the tracked `.claude/` files the local exclude covers).
- [ ] B8. Each measurable outcome has its intent beside it, so a literal reading that defeats the purpose shows; every outcome is
      literally reachable from the baseline; an allowance ("may trail") states its bound; an equality measured in emulation
      states its noise floor. (user, 2026-10-04; the Intent field since Evaluation B8 and B9, 2026-10-07)
- [ ] B9. An outcome about how a value fits names the widest value it can take, not only the current one: the widest the code can produce, not the widest the current data shows. (A Widest field was not shown to help.)
- [ ] B10. Every file, section, row and decision item the brief names exists at the named HEAD (checker id `brief-references`): `pnpm brief:check <this file>`
      passes against the worktree it names.
- [ ] Every limit the result must keep is an outcome of its own: where the tool may run from, length or size caps,
      no text kept twice, and every live artifact the change can reach still passing (evaluation C3). For a file the
      round deletes or renames, `git grep` its path in the open records (resume files, briefs, packets) first, and
      fix them before launch or name them as in scope (r03 round 3).
- [ ] B11. Launch runs the `REVIEW.md` review when absent (or with `--new-review`) and stops; record every reading as closed or left open with why, and the current brief SHA-256, in its `dispositions.md` before launching.
- [ ] B12. The readings the review keeps returning (`REVIEW.md` §"Recurring readings") are closed before it runs.
- [ ] B13. A timed outcome runs each side three times, alternating, on a quiet machine, and reports every run with the median and
      range, what limits the time, the errors counted, and proof the work ran; more runs only where they could change the
      decision. (user, 2026-10-14; adapted from pstack's `benchmark-checklist`)
- [ ] B14. Before writing an outcome, check whether the code's structure or an existing test already guarantees it.
      If one does, the outcome is that test still passing, named by file and line; if a proof is needed, name the
      test or table it extends and the result expected. (agent-tooling DECISIONS item 16)
- [ ] A test suite that needs a clean tree is run after the commit. A brief whose round adds ladder tests says CI runs them on Windows without Playwright Chromium or ui-forensics, from a checkout of the pushed commit alone with no other branch (`.github/workflows/checks.yml`; F179), so a proof that needs a real browser is a script in the temp folder, run and reported (vf-speed and vf-hold, 2026-10-12: both first pushes failed CI for it).
- [ ] Mark with ` (must change)` each path an outcome requires to change.
- [ ] An outcome that parses, reads, classifies or detects lists the forms its input takes, with their variants.
      (agent-tooling DECISIONS item 14)
- [ ] A new check says what it does when its input is missing (absent file, empty list, no match). (agent-tooling
      DECISIONS item 14)
- [ ] A format the brief writes out (a bullet, heading or ID pattern) is read as exact text: give the real form with its variants, never a shorthand (F178).
- [ ] Every field is a pointer (path and §heading, row IDs, decision numbers); nothing is pasted from a source.
