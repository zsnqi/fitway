<!-- brief-format: v1 role: codex -->
# Codex brief: a wrapped reading read, a reading known by its labels, the Git Bash tests in the sandbox, and a report checked against its run (owner-design-exploration-r04, launcher-fixes-5)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-5`, branch `owner-r04-launcher-fixes-5`, HEAD `5b81b3b7`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 67 and 70.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs` lines 574-667, 743-790, 1318-1348 and 1423-1524;
  - `scripts/agent-environment/codex-round.test.ts` lines 2514-2660 and 3073-3260;
  - `docs/agent-context/briefs/REVIEW.md` §"Prompt";
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F235, F236, F237, F242 and F245;
  - `D:/fitway-temp/owner-r04-launcher-fixes-4-grade/g1-wrapped.md`, whole.

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
- **Your temp folder** is `D:/fitway-temp/owner-r04-launcher-fixes-5/`. Two other rounds work in other worktrees on
  this machine: start no preview, compare or Codex process of your own. If a verify-fitway test fails in the fast
  ladder, rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L2.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.

## Goal

A complete review answer is never refused for its layout and a non-reading is never read; the launcher's own tests
pass inside Codex's sandbox; and a round's report is accepted only when the commit and ladder it claims happened in
its run, with every turn's timeline kept in the run folder.

## Causes and required outcomes

- **P1. A one-line reading wrapped onto a second line (F235).**
  - **Cause (measured by the grader).** In `g1-wrapped.md` reading 3 puts its literal reading on the numbered line and
    the rest on the next line at column 0; `bareStart` (`codex-round.mjs:595-606`) judges the numbered line alone,
    finds it incomplete and requires an indented body, so `readingsFromStarts` refuses the whole answer.
  - **Outcome.** `g1-wrapped.md` reads as exactly five readings with the IDs V1, V1, L1, V3 and V2, reading 3 holding
    both of its lines, as a test that runs the launcher's own review step on a copy under
    `scripts/agent-environment/fixtures/codex-round-reviews/`. A reading's lines up to the next start, blank line or
    end are judged together as one reading, by P2's rule, whether the continuation is at column 0 or indented, so a
    continuation that does not complete the three parts leaves the answer refused; the same answer with reading 3
    cut after its first line is still refused.
  - **Intent.** How a reviewer wraps a line never decides whether its answer is read.
- **P2. A one-line reading decided by keywords (F236).**
  - **Cause (measured by the coordinator's probe).** `completeOneLineReading` (`codex-round.mjs:574-593`) passes a line
    whose clauses merely contain one keyword each, so `V1 literal reading; V2 risk; V3 change.` and
    `V1 reading: as written. The risk is a gap. Change it.` are read as readings.
  - **Outcome.** A one-line reading counts as complete only when, besides its ID, it holds three labelled parts:
    the literal reading, what goes wrong and the change, each label (any wording the tests at the HEAD accept,
    bold or not) standing at the start of a clause, followed by `:` or a dash, and followed by text of its own, in
    any order. Both lines above are refused, and so is a complete reading written without labels; every answer the
    existing tests and fixtures read still reads the same. REVIEW.md §"Prompt" asks the reviewer to label the three
    parts in exactly those words (`Literal reading:`, `What goes wrong:`, `Change:`).
  - **Intent.** A reading is recognised by its parts, not by words that happen to appear, and the reviewer is asked
    for the form the parser reads.
- **P3. The Git Bash tests inside Codex's sandbox (F237).**
  - **Cause (reported by two rounds, not traced).** Two Git Bash tests in `codex-round.test.ts` fail in a round's local
    fast ladder with `sed` and `dirname` not found and Git's pnpm module missing, while CI passes them. Coordinator's
    reading (inferred): the failing two run `pnpm` through Git Bash (lines 3073-3260), and the sandbox's `PATH` or
    profile lacks what the user's own shell has.
  - **Outcome.** Run the two tests inside your sandbox before changing anything and report the missing piece with the
    command that shows it. Then they pass inside your sandbox in your fast ladder and on CI, with the same
    assertions, each still running every launcher form it runs at the HEAD. If the missing piece lies outside the
    repository and the tests cannot supply it themselves without loosening what they check, stop on P3 and report.
  - **Intent.** A round's local ladder fails only for a real fault, so L2 can be read from the round's own run.
- **P4. A report's claims checked against its run (F242).**
  - **Cause (measured).** `isReport` (`codex-round.mjs:764-769`) accepts any message that names every outcome ID beside
    PASS or FAIL; vf-runner-fix's resume reported commit `68e863793e6f` (no such object) and L2 PASS with no
    `git commit` and no `verify.mjs` command in its events.
  - **Outcome.** Before a final message is accepted, with or without a `STOPPED:` line, the launcher checks its
    claims against the worktree and every events file of the run. When the brief asks for a commit (its Report names
    the commit SHA), the report names one, and it exists, equals the worktree's HEAD, differs from the launch HEAD,
    follows a `git commit` that completed with exit code 0 in this run, and the tree is clean; a `STOPPED:` report
    naming no commit passes this check. When the report marks PASS an outcome or limit whose text in the brief names
    `verify.mjs fast` or `verify:fast`, however that line is worded, a fast-ladder command completed with exit code 0
    after the last successful `git commit`. A failed check is not accepted: the run resumes automatically with a
    message naming each failed claim and what was found, counted and logged like any automatic resume. Tests cover
    the evidence's case, a report-only brief naming no commit, a `STOPPED:` report with a false PASS, and each check
    alone.
  - **Intent.** A report that claims steps which never ran never reaches the coordinator as a finished round.
- **P5. Each turn's timeline in the run folder (F245).**
  - **Cause (measured).** Run folders record no turn's start, end or duration, keep only the launch HEAD, leave the
    exit code and stop reason on the console (`codex-round.mjs:1493-1524`), and inherit Codex's stderr
    (`codex-round.mjs:1321`).
  - **Outcome.** Every turn (launch, manual resume, automatic resume) appends one JSON line to `turns.jsonl` in the
    run folder: start and end with offset, duration, exit code, stop reason (report accepted, STOPPED, no report,
    claim check failed, non-zero exit, resume limit), the worktree HEAD at its end and its events file; Codex's
    stderr is also kept in the run folder per turn while still shown on the console. A failed write is printed
    and never changes the exit code. Tests check the lines for a launch with one automatic resume.
  - **Intent.** A round's timeline and outcome can be read from its folder alone, without file times.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add for P1, P2, P4 and P5 fails on the HEAD's code with your
  production change reverted; report each failing output.
- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional, the helpers and fixtures they use keep what they check (a change to one is reported
  with the outcome that needed it), and the suite runs at least as many tests as at the HEAD; launch, `resume` and the
  review keep their arguments and exit codes.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change), `docs/agent-context/briefs/REVIEW.md` (its §"Prompt" only) and files under
`scripts/agent-environment/fixtures/codex-round-reviews/`; commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for P3 the missing
piece and the command that showed it; for P4 each check with its test; the files you changed; the commit SHA;
anything you could not do; any hook message you did not act on.
