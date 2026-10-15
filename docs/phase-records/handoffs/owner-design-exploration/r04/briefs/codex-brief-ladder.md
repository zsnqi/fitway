<!-- brief-format: v1 role: codex -->
# Codex brief: the rows a brief names checked, and the ladder's failed step timed and named (owner-design-exploration-r04, brief-ladder)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-brief-ladder`, branch `owner-r04-brief-ladder`, HEAD `5b81b3b7`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 67 and 70.
- **Read first, only these:**
  - `scripts/agent-environment/check-brief.mjs` lines 438-491 and 657-826;
  - `scripts/agent-environment/check-brief.test.ts` lines 888-988;
  - `scripts/verify.mjs` lines 320-465;
  - `scripts/repository-fingerprint.mjs`, whole;
  - `docs/agent-context/briefs/codex.md` §"Coordinator checklist (delete before launch)";
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F234 and F246.

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
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch: every test you add passes there, with no file outside the repository.
- **Your temp folder** is `D:/fitway-temp/owner-r04-brief-ladder/`. Two other rounds work in other worktrees on this
  machine: start no preview, compare or Codex process of your own. If a verify-fitway test fails in the fast ladder,
  rerun that file alone once and report both runs; if the two Git Bash tests in `codex-round.test.ts` fail with `sed`
  or `dirname` not found, that is F237, another round's: report it and go on. The coordinator's CI run decides L2.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.

## Goal

A brief that names a row which does not exist fails `brief:check` like a missing decision item, and a failed ladder
step shows how long it ran, when, and which step changed the repository.

## Causes and required outcomes

- **Q1. Rows a brief names (F234).**
  - **Cause (measured).** `validateReferences` (`check-brief.mjs:657-826`) checks a named file's lines, § headings
    and decision items (`citedDecisionItems`, `check-brief.mjs:438-449`), but not rows, though checklist B10 lists
    them: launcher-fixes-4's brief named row F182 at a HEAD where it did not exist yet, and passed.
  - **Outcome.** A code-span path followed by `row <ID>` or `rows <IDs>` (IDs joined by commas and `and`, or a range
    `F156-F160`, each bare, each in backticks, or the whole list in one code span as the template writes it) has each
    named row checked in that file: in a `.tsv` a row is a line whose first field is the ID, in Markdown a table row
    whose first cell is the ID; a file inside the named worktree is read at the brief's named HEAD, as the review
    copies it, and an absolute path outside it where it points; a missing row is reported as `brief-references`
    naming the ID, the file and the HEAD. Tests cover one row, a list, a range, each spelling, a missing row in each
    form and file kind, a row present only in the command repository, and a row present in the working copy but not
    at the named HEAD. Every brief under
    `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/` that passes at the HEAD and names only rows
    that exist in its worktree still passes; report any that now fail and why.
  - **Intent.** A brief cannot send an implementer to a row that is not there.
- **Q2. A failed ladder step (F246).**
  - **Cause (measured).** `runStep` (`verify.mjs:332-361`) prints `<== label (Ns)` only when a step passes, no line
    carries a clock time, and the mutation guard (`verify.mjs:431-448`) fingerprints only before and after the whole
    run, so it prints `git status` without naming the step that changed the repository.
  - **Outcome.** Every step's start and end line carries the local clock time with offset, and a failed step prints
    its end line with its duration and exit code or signal before the run stops; the repository is fingerprinted
    after each step, and when a fingerprint changes the ladder prints at once that step's label and the
    `git status --short` of that moment, so the first mutation stays named even if a later step undoes it. The final
    `FAILED_VALIDATION: <message>` line and every exit code stay as at the HEAD. A test runs `node scripts/verify.mjs`
    itself in a subprocess with stand-in steps (one that passes, one that fails, one that writes an untracked file,
    one that removes it again) and checks its output and exit code; a fast run on your tree reports how many seconds
    the added fingerprints took.
  - **Intent.** A failed ladder can be diagnosed from its own output, without rerunning it.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add fails on the HEAD's code with your production change
  reverted; report each failing output.
- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional, the helpers and fixtures they use keep what they check, and the suite runs at least
  as many tests as at the HEAD; `pnpm verify:fast`, `verify:phase` and `verify:full` keep their steps, order,
  arguments and environment, and `brief:check` keeps every other check and its arguments.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/check-brief.mjs` (must change), `scripts/agent-environment/check-brief.test.ts`
(must change), `scripts/verify.mjs` (must change), files under `scripts/agent-environment/fixtures/` and a new test
file for the ladder under `scripts/`; commit once when done. Everything else is read-only. Add no dependencies. If
an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for Q1 each form tested
and the briefs' result; for Q2 the stand-in run's lines and the fingerprints' added seconds; the files you changed;
the commit SHA; anything you could not do; any hook message you did not act on.
