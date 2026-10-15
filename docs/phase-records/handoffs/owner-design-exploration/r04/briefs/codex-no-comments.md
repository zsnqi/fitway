<!-- brief-format: v1 role: codex -->
# Codex brief: a report-only reading of the tool code's comments by pstack's rules (owner-design-exploration-r04, no-comments)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-no-comments`, branch `owner-r04-no-comments`, HEAD `c699d3fb`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 56.
- **Read first, only these:**
  - `D:/fitway-temp/owner-r04-no-comments/source/comment-sicko.md`, whole: the rules (pstack, MIT, Lauren Tan, from the cursor plugins repository at `ce649c03`);
  - `D:/fitway-temp/owner-r04-no-comments/source/no-comments-SKILL.md`, whole: how its findings are judged.

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

- You run in the workspace-write sandbox with automatic approval review. Anything that starts child processes with
  piped output fails inside it: request escalation for it from the first attempt, with a one-line justification.
- **Your temp folder** is `D:/fitway-temp/owner-r04-no-comments/`. Start no preview, compare or Codex process of your own.
- **The rules, not the voice.** Apply the rules' keep-list and `MUST KILL` flags as written, in plain words; do not
  take up their persona. The `/how` and `/why` skills they name are not installed: read the nearby code and the
  repository's history (`git log`, `git blame`) instead, and say which you used.

## Goal

The coordinator holds a list of every comment in the tool code that pstack's rules would delete or keep, and every
symbol they would mark `MUST KILL`, each checked against the code, to decide what becomes a finding.

## Causes and required outcomes

- **N1. Every comment judged.**
  - **Outcome.** For every comment in the non-test `.mjs` files of `.agents/skills/verify-fitway/` and
    `scripts/agent-environment/` at the HEAD, one row in `D:/fitway-temp/owner-r04-no-comments/comments.tsv`: file,
    line, the comment's first 80 characters, and `keep` with the keep-list clause that saves it or `delete` with the
    reason; counts per file in the report.
  - **Intent.** The trial measures what the rules would do to our code before anyone adopts them.
- **N2. Each `MUST KILL` checked.**
  - **Outcome.** For every symbol the rules would mark `MUST KILL`, one row in
    `D:/fitway-temp/owner-r04-no-comments/must-kill.tsv`: file, line, symbol, the one-line reason, the reshape that
    would make the comment unneeded (rename, extract, type or rearchitecture), and whether reading the code confirms
    the reason (`confirmed`, `refuted` with why, or `unclear`).
  - **Intent.** A flag the code does not bear out never becomes a finding.

## Limits the result keeps

- **L1. Nothing tracked changes.** No file in the worktree changes and no commit is made; `git status --short` is
  empty at the end.
- **L2. Truthful rows.** Every row's file and line exist at the HEAD and its quoted text matches the file.

## Scope

You may change nothing tracked; write only in your temp folder; make no commit. Add no dependencies. If an outcome
cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

N1, N2, L1 and L2 each as PASS or FAIL with the command and the output line that proves it; the counts of keeps,
deletes and `MUST KILL` flags by file, with confirmed, refuted and unclear; anything you could not do; any hook
message you did not act on.
