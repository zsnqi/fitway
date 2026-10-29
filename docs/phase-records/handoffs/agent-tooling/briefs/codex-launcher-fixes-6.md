<!-- brief-format: v1 role: codex -->
# Codex brief: a cited base commit is not the commit claim; handoff:new opens a new milestone (agent-tooling-r01, launcher-fixes-6)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-launcher-fixes-6`, branch `tooling-launcher-fixes-6`, HEAD `c286c4c9`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 1 and 5.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs`, `commitCandidates` and `reportClaimFailures` (from line 1049 to 1240);
  - `scripts/agent-environment/new-handoff.mjs`, `createResumePoint`;
  - `docs/agent-context/HANDOFF_TEMPLATE.md` §"Writing one";
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F242, F254 and F255.

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
- **Your temp folder** is `D:/fitway-temp/tooling-launcher-fixes-6/`. Start no preview, compare or Codex process of
  your own. If a verify-fitway test fails in the fast ladder, rerun that file alone once and report both runs; the
  coordinator's CI run on your commit decides L2.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit. Cite any
  other commit (the base, for comparison) freely: that is what V1 repairs.

## Goal

The launcher refuses a report only for a commit claim that does not match the work, and a new milestone's first
resume point is made by the command meant to make it.

## Causes and required outcomes

- **V1. A cited commit taken as the claim (F254).**
  - **Cause (measured).** `commitCandidates` collects every 7-64 hex word on a line naming "commit" or "HEAD", and
    `reportClaimFailures` takes the first that resolves as the claim, so a report that cites the base commit before its
    own is refused as "not worktree HEAD"; ladder-seam's report was resumed six times for it.
  - **Outcome.** The commit check accepts a report when a SHA it names (full, or an abbreviation of at least 7 hex
    digits) resolves to the worktree HEAD and that HEAD descends from the launch HEAD, whatever other commits it cites
    and in whatever order; when commits it names resolve but none to the worktree HEAD, it refuses with a failure that names them and the HEAD; every other refusal
    of the check stays as at the HEAD: no SHA names an existing commit, the claimed commit equals the launch HEAD, no
    successful `git commit` in the run's events, a tree not clean after the commit, and the fast-ladder order check.
    A HEAD that does not descend from the launch HEAD (the worktree reset to another branch's commit) is refused,
    naming both, and so is a HEAD whose diff against the launch HEAD is empty. Tests cover a base cited before the HEAD, an abbreviation of the HEAD beside a full base SHA, an
    existing commit that is not the HEAD named alone, a HEAD that does not descend from the launch HEAD, an empty commit, and the F242
    case (a SHA that names no commit, alone).
  - **Intent.** A report is refused for claiming work that did not happen, never for citing history.
- **V2. handoff:new cannot open a milestone (F255).**
  - **Cause (measured by the coordinator).** With the ledger naming a new milestone whose handoff file does not exist
    yet, `pnpm handoff:new --milestone <id> --dir <dir>` fails `Missing repository path: <file>` before it reaches the
    template, though its usage and `HANDOFF_TEMPLATE.md` say it creates the file when absent.
  - **Outcome.** For a milestone in the ledger with its task packet, whose handoff file (and its directory) does not
    exist yet, the command creates it from the template block, with `--dir` and without it (then in the directory the
    ledger's handoff path names), exits 0 and prints the path; afterwards the ledger's `handoff` names the created file
    and `pnpm context:show --milestone <id>` prints it; a second run changes only the As of line; every refusal
    at the HEAD stays (an unknown milestone, a milestone without a packet, an invalid packet, `--dir` naming a file).
    Tests cover each case by running the command as a process on a scratch repository the test makes.
  - **Intent.** Opening a milestone needs no hand-made file.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (V1 or V2), fails on the HEAD's
  production code at an assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes
  unchanged on your result; the cases you commit are the ones you showed failing, and the fast ladder runs them.
  Report each failing output.
- **L1. Today's behaviour elsewhere.** Every test at the HEAD keeps its assertions and still runs, none skipped,
  excluded or made conditional; every fixture file at the HEAD stays byte for byte; launch, `resume`, the review and
  `handoff:new` keep their arguments, output for the cases above and exit codes.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/new-handoff.mjs`
(must change), their tests `codex-round.test.ts` and `new-handoff.test.ts` beside them (must change), and
`scripts/agent-environment/resume-point.mjs` only if V2 needs it; commit once when done. Everything else is read-only.
Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the files you changed;
the commit SHA; anything you could not do; any hook message you did not act on.
