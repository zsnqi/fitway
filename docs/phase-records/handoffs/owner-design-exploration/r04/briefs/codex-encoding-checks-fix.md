<!-- brief-format: v1 role: codex -->
# Codex brief: the B3 rule for every Codex brief, and a reason for every listed BOM (owner-design-exploration-r04, encoding-checks-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-encoding-checks`, branch `owner-r04-encoding-checks`, HEAD `7965e6c6`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 56 and 62.
- **Read first, only these:**
  - `scripts/agent-environment/check-brief.mjs` lines 95-125 and 880-925;
  - `scripts/agent-environment/check-brief.test.ts` lines 1130-1205;
  - `scripts/verify-repository.mjs` lines 25-115.

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
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`): every test you add passes there.
- **Your temp folder** is `D:/fitway-temp/owner-r04-encoding-checks/`. Another round works in another worktree on
  this machine: start no preview, compare or Codex process of your own. If a verify-fitway test fails in the fast
  ladder, rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L2.

## Goal

Two gaps the grading of `7965e6c6` found are closed: no Codex brief escapes the Scope rule, and no BOM is listed
without a reason.

## Causes and required outcomes

- **F1. A Codex brief with neither Scope nor Report.**
  - **Cause.** `checkBrief` applies `codexScopeProblem` only when the brief has a Report or a Scope section
    (`scripts/agent-environment/check-brief.mjs:909-917`), so a Codex brief with neither passes `brief:check`.
  - **Outcome.** `pnpm brief:check` reports `brief-scope` on every Codex-role brief whose Scope rule fails, whatever
    other sections it has or lacks, a brief with no Scope and no Report included. Test fixtures that are Codex briefs
    without a Scope may gain one so that they keep their other results.
  - **Intent.** A Codex brief cannot reach launch without telling the agent to report an unmet outcome.
- **F2. A listed BOM without a reason.**
  - **Cause.** `assertNoUnexpectedBom` (`scripts/verify-repository.mjs:92-112`) accepts any entry of
    `TRACKED_BOM_EXCEPTIONS` (`:29-60`), so an entry whose reason is empty passes.
  - **Outcome.** `pnpm check:repository` fails, naming the entry, when an entry's reason is empty or only whitespace,
    when two entries name one path, or when an entry's path is not a tracked file that starts with a UTF-8 BOM.
  - **Intent.** Each allowed BOM is a recorded, current decision, and a fixed file leaves the list.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional; `pnpm check:repository` passes on the result; `pnpm brief:check` gives the same exit
  code and FAIL lines as at the HEAD on every brief in
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/`.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/check-brief.mjs` (must change), `scripts/agent-environment/check-brief.test.ts`,
`scripts/verify-repository.mjs` (must change) and `scripts/verify-repository.schema.test.ts`; commit once when done.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the files you changed;
the commit SHA; anything you could not do; any hook message you did not act on.
