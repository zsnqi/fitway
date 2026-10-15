<!-- brief-format: v1 role: codex -->
# Codex brief: a label's text across a line break, an empty part refused, indented readings read as before, new cases failing at their assertions, and bold ID headings read (owner-design-exploration-r04, launcher-fixes-5-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-5`, branch `owner-r04-launcher-fixes-5`, HEAD `4964b95d`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 67 and 70.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs` lines 520-760;
  - `scripts/agent-environment/codex-round.test.ts` lines 1600-1760 and 1860-1900;
  - `D:/fitway-temp/owner-r04-launcher-fixes-5-grade/supplement.log`, whole, and
    `D:/fitway-temp/owner-r04-launcher-fixes-5-grade/g8-negative-corrected.log`, whole (the grader's evidence);
  - `D:/fitway-temp/brief-review/codex-vf-proofs-grade-1/last.md`, whole;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` row F249.

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
- **Your temp folder** is `D:/fitway-temp/owner-r04-launcher-fixes-5/`. Another round works in another worktree on
  this machine: start no preview, compare or Codex process of your own. If a verify-fitway test fails in the fast
  ladder, rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L2.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.

## Goal

The grader's four failures on `4964b95d` are repaired without losing what passed, and a review answer headed by bold
outcome IDs is read.

## Causes and required outcomes

- **T1. A label at a line's end (G1).**
  - **Cause (measured by the grader).** `completeOneLineReading` splits clauses at every line break, so in
    `g1-wrapped.md` with reading 5 wrapped after `Gap:` the label has no text on its own line and the next line has
    no label: the answer is refused.
  - **Outcome.** In a reading whose lines are all at column 0, a line break continues the clause it falls in, so that
    answer, and each of its five readings wrapped at any one label, read as five; a continuation that completes no
    part still leaves the answer refused.
  - **Intent.** Where a reviewer's line wraps never decides whether its answer is read.
- **T2. An empty part (G2).**
  - **Cause (measured).** A label counts when any character follows its separator, so
    `1. V1. Literal reading: x. What goes wrong:. Change: z.` is read.
  - **Outcome.** A labelled part counts only when its text holds a letter or a digit; that answer is refused, and
    every answer the HEAD's tests read still reads.
  - **Intent.** Each of the three parts says something.
- **T3. Readings with indented bodies (G3).**
  - **Cause (measured).** At `4964b95d` every bare numbered reading must carry the three labels, so the inline answers
    of the tests "accepts bare numbered readings with indented bodies and lists" and "accepts readings after a
    multi-paragraph preface", as they were at `5b81b3b7`, are refused; the round added labels to them instead.
  - **Outcome.** Both tests hold their `5b81b3b7` answers again, unchanged, and read them as at `5b81b3b7`
    (`2 [R1,L1]` each): a bare numbered reading followed by an indented body line is read by the rule it had at
    `5b81b3b7`, and the label rule applies to a bare reading whose lines are all at column 0. The 75 review files the
    grader replayed (`supplement.log`) still read to the same counts and IDs.
  - **Intent.** No answer that read before this milestone's parser work is refused now.
- **T4. New cases fail at their own assertions (G8).**
  - **Cause (measured).** Run from the HEAD's test file on `5b81b3b7`'s production code, most new P1, P4 and P5 cases
    throw `ENOENT` reading `turns.jsonl`, `stderr.txt` or `auto-resumes.log` before their outcome assertion, and the
    wrapped-reading case fails its prerequisite on the uncut answer.
  - **Outcome.** Each new case asserts the file or result it reads before reading it, so on `5b81b3b7`'s production
    code every new P1, P2, P4, P5, T1-T3 and T5 case fails at an assertion on its outcome (report each with its line);
    the "complete prose without labels" case is kept as a guard and said to be one.
  - **Intent.** A new case shows the defect, not a missing file.
- **T5. Bold outcome-ID headings (F249).**
  - **Cause (measured).** `D:/fitway-temp/brief-review/codex-vf-proofs-grade-1/last.md` heads each of five readings with
    a bold line naming its ID and no number (`**G9. Title**`), then three labelled bullet lines; `boldStart` needs a
    number or `Reading N`, so the complete answer is refused.
  - **Outcome.** That answer reads as five readings with the IDs G9, G2, G3, G6 and G7 in order, as a test on a copy
    under `scripts/agent-environment/fixtures/codex-round-reviews/`; such a reading needs the three labelled parts in
    its body, and a bold ID line with fewer is refused; more than five such headings are refused.
  - **Intent.** A complete answer is never refused for heading its readings by ID.

## Limits the result keeps

- **L0. New cases prove the repair.** As T4 says, each case you add fails on `5b81b3b7`'s production code at its own
  assertion; report each failing output.
- **L1. Today's behaviour elsewhere.** Every test at `4964b95d` keeps its assertions and still runs, none skipped,
  excluded or made conditional, apart from restoring the two answers T3 names; the predicate at
  `codex-round.test.ts` that filters `events*.jsonl` stays as it is (the coordinator accepted it for `turns.jsonl`);
  everything G4-G7 and G9 of the grade measured still holds; launch, `resume` and the review keep their arguments and
  exit codes.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change) and files under `scripts/agent-environment/fixtures/codex-round-reviews/`; commit once when done.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for T4 each new case and
the line it fails at on the base; the files you changed; the commit SHA; anything you could not do; any hook message
you did not act on.
