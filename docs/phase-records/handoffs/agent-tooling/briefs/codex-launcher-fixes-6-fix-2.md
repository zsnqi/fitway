<!-- brief-format: v1 role: codex -->
# Codex brief: commands read as a shell reads them, and the claim found on any line (agent-tooling-r01, launcher-fixes-6-fix-2)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-launcher-fixes-6`, branch `tooling-launcher-fixes-6`, HEAD `81eb36bb`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5, 6 and 8 of `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (the coordinator line; this branch's copy is behind).
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6-fix.md`, whole: the round this fixes; its outcomes and limits still hold;
  - `D:/fitway-temp/codex-round-a111cb6d-448c-49cf-80d4-280652ec0596/last-message.md`, whole: the grade, rows G1 and G11;
  - `scripts/agent-environment/codex-round.mjs`, `commitCandidates`, `unwrapCommand`, `unmaskedCommand`, `isCommitCommand`, `isFastLadderCommand` and `commitRecordFailures`.

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
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)

## Goal

A real commit or ladder run counts however a shell would run it, an echo or a masked status never does, and a report's
commit is found on whatever line it stands.

## Causes and required outcomes

- **X1. Real commands refused (grade G11).**
  - **Cause (measured by the grader and reproduced by the coordinator).** `isCommitCommand` requires the unwrapped text
    to begin `git commit`, and `unmaskedCommand` refuses any `;`, `&` or `|` in the text, quoted or not, so `git -C
    <worktree> commit -m x`, `git commit -m "fix; tests"` and `git add -A && git commit -m x` do not count.
  - **Outcome.** A command is read as the shell that ran it would split it (quotes respected, for PowerShell
    `-Command` and `bash -lc` wrappers as today): a `git` invocation whose subcommand is `commit`, after any global
    options (`-C <path>`, `-c <name>=<value>`, `--no-pager`), counts when it is the last command of its chain, so that its status is the event's: commands
    before it joined by `&&`, `;` or a newline are fine; `||` or `|` touching it, or any command after it, make it not
    count; `--dry-run` and `--help` never count. The ladder is read the same way and counts only with its exact arguments
    (`node scripts/verify.mjs fast` or `pnpm verify:fast`, nothing appended that filters or selects tests). Tests cover `git -C <worktree> commit`,
    `git -c user.name=x commit`, a quoted `;` and `|` in a message, `git add -A && git commit`, `git add -A; git commit`, `git commit && echo x`
    (refused), and every case W2 already covers.
  - **Intent.** The record of what ran is what ran, for every way an agent writes it.
- **X2. A commit named in its subject (grade G11).**
  - **Cause (measured).** `commitRecordFailures` accepts the last commit when its output contains the HEAD's first
    seven characters anywhere, so a commit whose subject mentions them passes.
  - **Outcome.** The commit's identity is read only from the first line of the commit's output that is Git's result
    header (`[<branch> <abbreviated sha>]` or
    `[<branch> (root-commit) <abbreviated sha>]`) and compared with the worktree HEAD; a subject containing the HEAD's
    prefix under another commit's header is refused. Tested.
  - **Intent.** The commit that ran is the commit claimed.
- **X3. A claim on a line without "commit" (grade G1).**
  - **Cause (measured).** `commitCandidates` takes candidates only from lines naming "commit" or "HEAD" when any exist, so
    a report with "Base commit: B" on one line and "Delivered revision: C2" on another misses C2 and is refused.
  - **Outcome.** A report is accepted when any SHA it names, on any line, resolves to the worktree HEAD (the other
    conditions holding); a report naming no SHA that resolves to the HEAD is refused as at this HEAD. Tested with the
    multi-line form.
  - **Intent.** A report may say its commit in its own words.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (X1-X3), fails at this HEAD at an
  assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your
  result; the cases you commit are the ones you showed failing, and the fast ladder runs them; each clause of X1-X3
  has at least one red case and one refusal guard. A case that guards a
  refusal kept from this HEAD is named a guard and may pass at this HEAD. Report each failing output.
- **L1. The earlier outcomes.** Every outcome and limit of `codex-launcher-fixes-6.md` and `codex-launcher-fixes-6-fix.md`
  still holds (report each again), and every test at this HEAD keeps its assertions and still runs; no helper of the
  claim check exceeds 60 lines.
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
