<!-- brief-format: v1 role: codex -->
# Codex brief: the launcher reads every sound review answer, waits for every brief's outcomes, and guards its inputs (owner-design-exploration-r04, encoding-launcher)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-encoding-launcher`, branch `owner-r04-encoding-launcher`, HEAD `945c07b5`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 56 and 62.
- **Read first, only these:**
  - `docs/agent-context/briefs/REVIEW.md`, whole;
  - `scripts/agent-environment/codex-round.mjs` lines 440-705 and 1144-1172;
  - `scripts/agent-environment/codex-round.test.ts` lines 1-170 and 1690-1725;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F110, F118, F156, F162, F169, F170 and F174;
  - `docs/phase-records/phase-05-staff-paper-adoption.md` §"Verification", its first paragraph.

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
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`), where `TEMP` is an 8.3 short path: every
  test you add passes there. Tests use the fake Codex and `FITWAY_BRIEF_REVIEW_ROOT`; no test or check you run calls
  Open Design or reads `OPENDESIGN_API_KEY`.
- **Your temp folder** is `D:/fitway-temp/owner-r04-encoding-launcher/`. Another round works in another worktree on
  this machine: start no preview, compare or Codex process of your own. If a verify-fitway test fails in the fast
  ladder, rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L2.

## Goal

The launcher reads every sound review answer the reviews have produced, waits for the report of every brief it
launches, and refuses inputs the shell or the environment has already damaged, with each fix held by a test.

## Causes and required outcomes

- **E1. Bare numbered readings (F169).**
  - **Cause.** `parseReadings` (`scripts/agent-environment/codex-round.mjs:547-583`) has no start for a bare `1. R1 text`
    line, so an answer of such readings with indented bodies, with or without an indented list, is "cannot be read
    as readings"; `a6ad0ae4` read it.
  - **Outcome.** Readings that start `N.` or `N)` at the line's start (at most three spaces), numbered in sequence from
    1, each naming an outcome or limit ID and each with an indented body, are read as exactly those readings, whatever
    lists their bodies hold; an answer whose starts cannot be told apart from its bodies' list items is still refused.
  - **Intent.** The bare form a model writes most often never stops a launch, and an ambiguous answer still does.
- **E2. A preface (F162).**
  - **Cause.** The bold and numbered-bold starts count only when the first one is at the answer's first character
    (`codex-round.mjs:578-581`), so the vf-fixes review answer, `D:/fitway-temp/brief-review/codex-vf-fixes-1/last.md`,
    is refused for its first line.
  - **Outcome.** An answer whose readings, in any form the launcher reads, follow prose of one or more lines or
    paragraphs that holds no reading start and no outcome or limit ID is read as those readings, the prose part of
    none; that file is read as its five readings, and so is a fixture whose preface spans several lines. Prose before
    the first start that names an ID is still refused.
  - **Intent.** A sound answer with a sentence before its list is read; a reading hidden in prose is never dropped.
- **E3. A silent read in the copy path fails a test (F156).**
  - **Cause.** `copyReviewSources` (`codex-round.mjs:683-703`) is tested for read order with a repository source only;
    a read of an absolute source placed ahead of its `reviewSourcePlan` call, its error ignored, passes every test.
  - **Outcome.** With a silent read of the source's bytes inserted in `copyReviewSources` ahead of `reviewSourcePlan`,
    at least one test fails because it observed the bytes being read before the source's place was decided (an
    observed read, never a check of the source text), for each kind of
    source the launcher accepts (a repository file at the named HEAD, a file in the launcher's checkout, an absolute
    file outside both) and for each read route (asynchronous, synchronous, stream); with it removed, all pass. Report
    each kind and route with the failing test's name.
  - **Intent.** CI notices any read of a review source before its place is checked, on every path that copies one.
- **E4. A brief whose outcomes the launcher cannot see (F170).**
  - **Cause.** `outcomeIdsFromBrief` (`codex-round.mjs:585-603`) takes IDs only under two exact headings, and
    `isReport` (`:626-631`) counts any last message as a report when it found none, so the tuner-removal continue run
    (`docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-tuner-removal-continue.md`) ended on a
    progress line unresumed.
  - **Outcome.** For every brief in `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/`, the IDs the
    launcher waits for are the IDs that start a bullet as `- **X1.**` (capital letters, then digits) outside the
    environment block; a brief with none is refused before its review starts, the message saying why. Report each
    brief's IDs.
  - **Intent.** No run ends on a progress line without an automatic resume because of how its brief was headed.
- **E5. Git Bash rewriting a typed message.**
  - **Cause.** Git Bash rewrites an argument that looks like a POSIX path before a native program receives it
    (`/api` became `C:/Program Files/Git/api` in Phase 5); `resume <folder> --message <text>` passes the rewritten
    text to Codex as the coordinator's words.
  - **Outcome.** When the launcher runs under Git Bash, `--message` is refused before Codex starts, the message naming
    `--message-file`, since the text it receives may already be rewritten; a `--message-file` text reaches Codex byte
    for byte; outside Git Bash nothing changes.
  - **Intent.** A message reaches the agent as it was typed, or not at all.
- **E6. `TEMP` and `TMP` for Codex (F110, F118).**
  - **Cause.** The launcher passes its own environment to Codex (`codex-round.mjs:1144-1172`); an 8.3 short `TEMP`
    broke a test (F110) and a `TEMP` under `D:/fitway-temp` broke another (F118).
  - **Outcome.** Each of `TEMP` and `TMP` is expanded to its long path and resolved to its real path; a launch or
    resume whose value then equals or lies inside the real `D:/fitway-temp` is refused before the review or Codex
    starts, naming the variable, whatever its case, slashes, short names, junctions or `..`; a sibling such as
    `D:/fitway-temp-logs` is not refused; a value with an 8.3 short segment reaches Codex as its long path; any other
    value reaches it unchanged.
  - **Intent.** Codex's temporary files never land where the gardener inventories, and its tools see long paths.
- **E7. A test's timeout on a slower runner (F174).**
  - **Cause.** "removing the marker keeps launch and resume behavior exactly as before"
    (`codex-round.test.ts:1709-1725`) took 26.4 s on main's CI against its 20 s timeout, while the same commit passed;
    it takes about 5.4 s on this machine, so that runner was about five times slower.
  - **Outcome.** Each test in `codex-round.test.ts` whose local median over three runs exceeds 1 s has a timeout of at
    least eight times that median, or its median falls below an eighth of its timeout; report each such test with its
    three runs and timeout, and the machine's load while timing (another round may be running).
  - **Intent.** A runner five times slower than this machine, with margin, fails no test whose work is unchanged.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs (none skipped,
  excluded or made conditional, and the file runs at least as many tests as at the HEAD); every review answer the existing
  tests and fixtures accept or refuse keeps that result, except where E1 or E2 now reads it; launch, `resume` and the
  review keep their arguments, files and exit codes except the refusals E4 to E6 add.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change) and files under `scripts/agent-environment/fixtures/codex-round-reviews/`; commit once when done.
Everything else is read-only, `check-brief.mjs` and its test included. Add no dependencies. If an outcome cannot be
met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for E3, each source kind
and read route with the failing test's name; for E4, each brief's IDs; the files you changed; the commit SHA;
anything you could not do; any hook message you did not act on.
