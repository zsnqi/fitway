<!-- brief-format: v1 role: codex -->
# Codex brief: escaped quotes and comments read as a shell reads them (agent-tooling-r01, launcher-fixes-6-fix-3)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-launcher-fixes-6`, branch `tooling-launcher-fixes-6`, HEAD `51bf35d9`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5, 6 and 8 of `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (the coordinator line; this branch's copy is behind).
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6-fix-2.md`, whole: the round before; its outcomes and limits still hold;
  - `D:/fitway-temp/tooling-launcher-fixes-6-fix-2-grade/report.md`, whole: the grade of that round, rows G11 and G14;
  - `scripts/agent-environment/codex-round.mjs`, `shellTokens`, `unwrapCommand`, `commandParts`, `lastCommandPart`, `isGitCommitCommand`, `isCommitCommand` and `isFastLadderCommand`.

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
  coordinator's CI run on your commit decides L2. Link no `node_modules` between folders (DECISIONS item 8).
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)

## Goal

A command's quotes, escapes and comments are read as the shell that ran it reads them, in one place.

## Causes and required outcomes

- **Y1. Escaped quotes (grade G11).**
  - **Cause (measured by the grader, confirmed by the coordinator in the code).** `commandParts` ends a quoted span at
    the next matching quote character even when it is escaped, while `shellTokens` honours the escape, so
    `git commit -m "a \"; b | c"` in the bash wrapper, and the same message with PowerShell's backtick-escaped quote in
    the PowerShell wrapper, split at the `;` and are refused ("no successful git commit command").
  - **Outcome.** Quoting and escaping are decided in one place that both the part splitter and the word tokenizer use,
    with the rules of the shell that ran the command: inside double quotes a backslash escapes the next character in
    bash, a backtick escapes the next character in PowerShell, and single quotes keep every character literal in both.
    Those two commands count as commits, while `\;` in the PowerShell wrapper escapes nothing (a backslash is literal
    there); every case X1 and the earlier rounds cover keeps its result. Tested in both wrappers.
  - **Intent.** A commit message's quotes and separators never decide whether its commit counts.
- **Y2. Comments (grade G14).**
  - **Cause (measured by the grader).** `echo ok # ; git commit -m x` and `echo ok #` followed by `&&` and the ladder
    count as a commit and a ladder run in both wrappers, though nothing after the `#` runs.
  - **Outcome.** An unquoted `#` that begins a word starts a comment running to the end of its line, in bash and in
    PowerShell; nothing in a comment counts as a command, and a command before it keeps its own reading. A `#` inside
    quotes or inside a word (`git commit -m "fix #12"`, `a#b`) stays text. Tested in both wrappers, including a
    commented-out commit whose echoed output holds a result header naming the HEAD.
  - **Intent.** A comment never counts as a run.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (Y1-Y2), fails at this HEAD at an
  assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your
  result; the cases you commit are the ones you showed failing, and the fast ladder runs them. A case that guards a
  result kept from this HEAD is named a guard and may pass at this HEAD. Use the test file's `invokeClaim` helper for
  claim cases. Report each failing output.
- **L1. The earlier outcomes.** Every outcome and limit of `codex-launcher-fixes-6.md`, `codex-launcher-fixes-6-fix.md`
  and `codex-launcher-fixes-6-fix-2.md` still holds (report each again), with the coordinator's reading of X1 that a
  commit after `;` or a newline counts when it is the last command; every test at this HEAD keeps its assertions and
  still runs, and no test helper, fixture, setup or mock body at this HEAD changes (what you need is added new); no helper of the claim check exceeds 60 lines, and no second loop tracks quotes.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change) and
`scripts/agent-environment/codex-round.test.ts` (must change); commit once when done. Everything else is read-only.
Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the files you changed; the
commit SHA; anything you could not do; any hook message you did not act on.
