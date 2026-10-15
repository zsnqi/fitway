<!-- brief-format: v1 role: codex -->
# Codex brief: the B3 Scope rule for every Codex brief (owner-design-exploration-r04, scope-rule)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-scope-rule`, branch `owner-r04-scope-rule`, HEAD `699c111f`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 56 and 62.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` row F180;
  - `scripts/agent-environment/check-brief.mjs` lines 95-125 and 900-920;
  - `scripts/agent-environment/codex-round.test.ts` lines 395-415;
  - `scripts/agent-environment/path-tokens.test.ts` lines 80-110.

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
  with no other branch: every test you add passes there.
- **Your temp folder** is `D:/fitway-temp/owner-r04-scope-rule/`. Start no preview, compare or Codex process of your own.

## Goal

No Codex brief passes `brief:check` without the Scope that tells the agent to report an unmet outcome.

## Causes and required outcomes

- **S1. A Codex brief with neither Scope nor Report (F180).**
  - **Cause.** `checkBrief` applies `codexScopeProblem` only when the brief has a Report or a Scope section
    (`scripts/agent-environment/check-brief.mjs:908-917`), so a Codex brief with neither passes.
  - **Outcome.** `pnpm brief:check` reports `brief-scope` as a FAIL and exits nonzero on every Codex-role brief whose
    Scope rule fails, whatever other sections it has or lacks, one with no Scope and no Report included, and one whose
    sentence sits in an indented code block; a test proves each case.
  - **Intent.** A Codex brief cannot reach launch without the B3 sentence.
- **S2. The fixtures that are Codex briefs.**
  - **Cause.** The Codex brief fixtures built in `codex-round.test.ts` (about line 407) and `path-tokens.test.ts`
    (about line 90) have no Scope section, so S1 alone fails the tests that use them.
  - **Outcome.** Each such fixture gains a Scope section ending with the B3 sentence and changes in nothing else, and
    every test that uses it keeps its assertions and its result.
  - **Intent.** The fixtures look like the briefs the launcher really receives.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional; `pnpm brief:check` gives the same exit code and FAIL lines as at the HEAD on every
  brief in `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/`.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/check-brief.mjs` (must change), `scripts/agent-environment/check-brief.test.ts`,
`scripts/agent-environment/codex-round.test.ts` (must change) and `scripts/agent-environment/path-tokens.test.ts`
(must change); commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met,
do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the files you changed;
the commit SHA; anything you could not do; any hook message you did not act on.
