<!-- brief-format: v1 role: codex -->
# Codex brief: every review answer read, and a run that ends early resumed (owner-design-exploration-r04, launcher-fixes-2)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-2`, branch `owner-r04-launcher-fixes-2`, HEAD `a14586fe`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47 and 52.
- **Read first, only these:**
  - `docs/agent-context/briefs/REVIEW.md`, whole;
  - `scripts/agent-environment/codex-round.mjs` lines 425-530 and 1011-1211;
  - `scripts/agent-environment/check-brief.mjs` lines 200-290;
  - `scripts/agent-environment/codex-round.test.ts` lines 1-80, 1264-1369 and 1539-1650;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F154, F156 and F157.

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`): every test you add passes there. Tests use
  the fake Codex and `FITWAY_BRIEF_REVIEW_ROOT`; no test or check you run calls Open Design or reads
  `OPENDESIGN_API_KEY`.
- **Your temp folder** is `D:/fitway-temp/owner-r04-launcher-fixes-2/`. Other rounds run compares on this machine:
  start no preview, compare or Codex process of your own.

## Goal

A sound review answer never stops a launch, and a round that ends before its report goes on by itself until it
reports, with every automatic resume on record; an answer the launcher cannot split, or a run that failed, still
stops for the coordinator.

## Causes and required outcomes

- **K1. Every review answer DeepSeek has given is read (F157).**
  - **Cause.** `parseReadings` (`codex-round.mjs:431-526`) reads `### N.` headings only when each reading has an
    outcome label line or the four numbered fields, and its consequence label matches "would go wrong" but not "goes
    wrong"; `D:/fitway-temp/brief-review/codex-vf-parallel-continue-2-1/last.md` (five readings, the outcome IDs in
    the headings, fields "Literal reading", "What goes wrong", "Closing change") stopped a launch on 2026-10-14.
  - **Outcome.** Every `last.md` under `D:/fitway-temp/brief-review/` (16 today; eight are already the fixtures in
    `scripts/agent-environment/fixtures/codex-round-reviews/`, byte for byte) is a fixture there under its folder's
    name, frozen by its hash as the eight are, and the launcher reads each as exactly the readings it
    holds, in order, each the text from its start to the next reading's start; the test's expected readings come from
    each answer's own markup, as the existing real-review test derives them, never from the parser. Every answer the
    existing tests refuse is still refused.
  - **Intent.** A reading is found by its structure, a numbered start with an ID and a body, not by the wording of its
    field labels, which the prompt leaves open; an answer that cannot be split is refused, never guessed.
- **K2. A run that ends before its report resumes on its own (F154).**
  - **Cause.** `execute` (`codex-round.mjs:1115-1183`) returns when `codex exec` exits. DeepSeek ends a turn with a
    message and no tool call while work is unfinished (nine times on 2026-10-13), which closes the run, and the
    coordinator has resumed each by hand with a message.
  - **Outcome.** When `codex exec` exits 0 and its last message is not a report, the launcher resumes the same thread
    with a fixed message and captures it as a resume does today. A report is a last message with a line that names
    one of the brief's outcome or limit IDs together with `PASS` or `FAIL`, or a line starting `STOPPED:`. The message
    says the run ended because a message without a tool call ends it, quotes the first line of that last message, and
    tells the agent to continue toward the brief's outcomes, to wait inside tool calls, and to send a message only as
    its report, or a line `STOPPED: <reason>` when it stops on purpose. At most 10 automatic resumes follow one launch
    or `resume` command; each is appended to `auto-resumes.log` in the run folder with its time, the exit code and the
    first line that triggered it; after the tenth the command exits 1 and says so. A nonzero exit is never resumed
    automatically. The help text states this.
  - **Intent.** An early end costs the run a minute, not the hours until the coordinator sees it; each resume stays
    countable as an intervention, and a crash or a deliberate stop still reaches the coordinator.
- **K3. Tests that fail when their defect returns (F156 with K1 and K2).**
  - **Outcome.** With the fake Codex, tests fail when: any K1 fixture is not read as its readings; K2 does not resume
    a run that ended without a report, or resumes after a report, after a `STOPPED:` line or after a nonzero exit, or
    passes 10; and a review source is read before its place check in `check-brief.mjs` (F156: a planted read ahead of
    the check passed all 170 tests). Each fails with its defect alone put back; report how you checked each.
  - **Intent.** CI guards what the launcher reads and when it resumes.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions; `pnpm brief:check` gives the same
  result as at the HEAD on every brief under `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/`; launch
  and `resume` keep their arguments, files and exit codes apart from K2.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change), `scripts/agent-environment/check-brief.test.ts` and files under `scripts/agent-environment/fixtures/`;
commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for K3, how each test was
shown to fail; the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
At most 30 lines.
