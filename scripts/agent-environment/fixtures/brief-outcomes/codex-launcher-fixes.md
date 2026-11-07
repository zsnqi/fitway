<!-- brief-format: v1 role: codex -->
# Codex brief: the review's sources, checked before launch and read safely (owner-design-exploration-r04, launcher-fixes)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes`, branch `owner-r04-launcher-fixes`, HEAD `c97d564e`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47 and 52.
- **Read first, only these:**
  - `docs/agent-context/briefs/REVIEW.md`, whole;
  - `scripts/agent-environment/codex-round.mjs` lines 550-720 and 860-905;
  - `scripts/agent-environment/check-brief.mjs` lines 150-420;
  - `scripts/agent-environment/codex-round.test.ts` lines 449-745 (the review tests);
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F150, F152 and F153.

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
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`): every test you add passes there. Tests use
  the fake Codex and `FITWAY_BRIEF_REVIEW_ROOT`; no test or check you run calls Open Design or reads
  `OPENDESIGN_API_KEY`.
- **A message ends the run.** Any message you write without a tool call is your final one and closes the session,
  stopping whatever you started. Wait on tests inside a tool call, and write a message only once, as the Report. (F154)
- **Your temp folder** is `D:/fitway-temp/owner-r04-launcher-fixes/`. Another round runs Codex and its compares on
  this machine now: start no preview, compare or Codex process.

## Goal

A brief that `pnpm brief:check` passes never stops its review on a source, and no file outside the places the review
allows reaches Open Design, however its path is written or linked.

## Causes and required outcomes

- **A1. Sources refused before they are read (F152).**
  - **Cause.** `sourceBytes` reads an absolute source (`codex-round.mjs:649-664`) before `sourceTarget` checks that it
    lies under `D:/fitway-temp` (`:631-644`), and that check compares `path.resolve` results, which follow no junction
    or symbolic link.
  - **Outcome.** An absolute review source is accepted only when its real path, every junction and symbolic link on
    it resolved, lies under the real path of `D:/fitway-temp` (or of A3's checkout); any other is refused, naming it,
    before a byte of it is read. A repository source that is a symbolic link at the named HEAD is refused.
  - **Intent.** What reaches Open Design is decided by where a file really is, not by how its path is spelled.
- **A2. brief:check finds what the review would refuse (F153).**
  - **Cause.** `check-brief.mjs` resolves a brief's paths against the worktree's files on disk, while the review takes
    every backticked path-like name on the brief's "Read first" and "Decisions" lines (`namedReviewSources`,
    `codex-round.mjs:592-614`) and reads a repository path at the named HEAD and an absolute one only under the temp
    folder. On 2026-10-13 one brief passed `brief:check` four times and stopped at the review each time, on a relative
    path written from a folder, a file named "beside" another, an absolute path in another checkout, and a bare
    `SKILL.md`.
  - **Outcome.** `pnpm brief:check` on a brief with `role: codex` reports as `FAIL` every name the review would refuse
    (missing at the named HEAD, a directory, outside the allowed places, a credentials file by its name, two names
    that map to one copied file), each with its line, all in one run, from the same code the review uses to collect
    and resolve its sources, and the launcher's first gate, which runs that check, stops on them before any review
    folder is made. A name the review would accept passes. The review itself refuses nothing that check passed, except
    a credentials file found by its content.
  - **Intent.** The review's source rules are checked when the brief is written, not discovered one launch at a time.
- **A3. The coordinator's committed files by their absolute path.**
  - **Cause.** A brief cannot name a file in the checkout the launcher runs from (the verify-fitway skill), since the
    review reads repository paths from the target worktree and absolute paths only under the temp folder.
  - **Outcome.** An absolute review source inside the Git checkout the launcher runs from is read as that file
    committed at that checkout's HEAD, and is refused, naming it, when it is untracked or its working copy differs from
    HEAD. A launch refuses, naming it, any repository source the review read that differs between the brief's named
    HEAD and the worktree's HEAD at launch (the brief checker allows later Markdown-only commits). `REVIEW.md`
    §"Running it" states the three places a source may come from.
  - **Intent.** Only committed files of this public repository and the temp folder's files reach Open Design, and the
    review reads the same text the implementer will read.
- **A4. Tests that fail when their defect returns (F150).**
  - **Outcome.** `codex-round.test.ts` and `check-brief.test.ts` gain tests, using the fake Codex, that fail when a
    repository source is copied from the working copy instead of the named HEAD; when DeepSeek accepts `medium` or
    `xhigh`; and when any single refusal of A1, A2 or A3 is removed. Each fails with its defect alone put back; report
    how you checked each. Every existing test keeps its assertions.
  - **Intent.** CI guards what the review sends and what the launcher accepts.

## Limits the result keeps

- **L1. Today's briefs still pass.** `pnpm brief:check` gives the same result as at the HEAD on every brief under
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/` that names only sources the review reads today,
  and a brief whose review ran without a source error since 2026-10-13 still passes. No rule or exception in the
  checker or the launcher depends on a brief's folder or file name.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change), `scripts/agent-environment/check-brief.mjs` (must change), `scripts/agent-environment/check-brief.test.ts`
(must change), `docs/agent-context/briefs/REVIEW.md` (must change) and files under
`scripts/agent-environment/fixtures/`; commit once when done. Everything else is read-only. Add no dependencies. If an
outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for A4, how each test was
shown to fail; the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
At most 30 lines.
