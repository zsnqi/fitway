<!-- brief-format: v1 role: codex -->
# Codex brief: a label quoted inside a reading is not a label (owner-design-exploration-r04, launcher-fixes-5-fix-2)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-5`, branch `owner-r04-launcher-fixes-5`, HEAD `34065b3d`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 67 and 70.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs` lines 625-715;
  - `D:/fitway-temp/brief-review/codex-launcher-fixes-5-fix-1/last.md`, whole, and
    `D:/fitway-temp/brief-review/codex-launcher-fixes-5-fix-grade-2/last.md`, whole (two real answers the result refuses);
  - `D:/fitway-temp/owner-r04-launcher-fixes-5-fix-grade/parser-cases.cjs`, whole (the grader's G1-G4 cases).

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
- **Your temp folder** is `D:/fitway-temp/owner-r04-launcher-fixes-5/`. Start no preview, compare or Codex process of
  your own. If a verify-fitway test fails in the fast ladder, rerun that file alone once and report both runs; the
  coordinator's CI run on your commit decides L2.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.

## Goal

A review answer that quotes a label as an example inside its text is read as it was before this milestone's parser
work, and every case the grader passed still holds.

## Causes and required outcomes

- **U1. A quoted label read as a part.**
  - **Cause (measured by the coordinator).** `labelledParts` strips backticks before matching and matches a label
    word anywhere in the text, so a reading that quotes `` `Literal reading: 1` `` or `` `What goes wrong:` `` in its
    prose yields an empty part, and the T2 rule refuses the whole answer: both files above are refused at `34065b3d`,
    while `5b81b3b7` reads them as `5 [T4,T3,T5,T1,T2]` and `5 [G3,G1,G2,G4,G6]`.
  - **Outcome.** Text inside a code span or quotation marks is never a label, and a label counts only where it begins
    a line, a bullet or a clause, as P2 said; both files read as at `5b81b3b7`, with the same trimmed reading text,
    as tests on copies under `scripts/agent-environment/fixtures/codex-round-reviews/`; every case in
    `parser-cases.cjs` gives the result the grader recorded at `34065b3d`, and every review file and fixture the
    grader replayed (`D:/fitway-temp/owner-r04-launcher-fixes-5-fix-grade/`) gives the same count, IDs and trimmed
    reading text as at `34065b3d`, apart from answers refused there only for a quoted label, which match `5b81b3b7`;
    a label word in the middle of a sentence (`the change: small` inside a literal reading) is not a part, tested
    for each of the three labels.
  - **Intent.** A reviewer may quote the labels it discusses without its answer being refused.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add fails on `34065b3d`'s production code at an assertion on the
  reading count or text; report each failing output.
- **L1. Today's behaviour elsewhere.** Every test at `34065b3d` keeps its assertions and still runs, none skipped,
  excluded or made conditional; launch, `resume` and the review keep their arguments and exit codes.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change) and files under `scripts/agent-environment/fixtures/codex-round-reviews/`; commit once when done.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the files you changed;
the commit SHA; anything you could not do; any hook message you did not act on.
