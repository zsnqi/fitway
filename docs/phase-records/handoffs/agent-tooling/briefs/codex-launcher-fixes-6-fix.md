<!-- brief-format: v1 role: codex -->
# Codex brief: the claim check only where a commit is asked, by commands that ran, in plain parts (agent-tooling-r01, launcher-fixes-6-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-launcher-fixes-6`, branch `tooling-launcher-fixes-6`, HEAD `493c0adf`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5 and 6 of `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (the coordinator line; this branch's copy is behind).
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6.md`, whole: the round this fixes; its outcomes and limits still hold;
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/agent-context/briefs/CODE_REVIEW.md`, §"The two axes";
  - `D:/fitway-temp/code-review/launcher-fixes-6-1/last.md`, whole: the review's findings 1-4;
  - `D:/fitway-temp/codex-round-a2f0ef9b-6d16-401c-9554-271ec3365d99/auto-resumes.log`, whole: a grader refused by the claim check (F258);
  - `scripts/agent-environment/codex-round.mjs`, `briefRequiresCommit`, `commitCandidates` and `reportClaimFailures`.

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

A grader's report is never refused for naming the commit it graded, a commit or ladder counts only when a real command
ran it, and the claim check reads as a few plain steps.

## Causes and required outcomes

- **W1. Graders refused (F258).**
  - **Cause (measured).** The commit checks run whenever a report names a hex word on a commit or HEAD line, and the
    ladder check whenever a PASS outcome's text names the fast ladder; a grading report names the commit it graded
    (the launch HEAD) and quotes the round's ladder, so the code-map grader was refused twice and then made a commit
    and ran the ladder to satisfy the check.
  - **Outcome.** The commit and ladder checks apply only to an implementing brief, recognised by its Scope's "commit
    once when done" (every implementing brief carries it from the template; no grading brief does); for any other brief a report may name any commit and
    quote any ladder without a claim failure. Tests: a grading brief (no commit SHA asked) whose report names the launch
    HEAD and says PASS on an outcome naming `verify.mjs fast` is accepted; an implementing brief keeps every refusal.
  - **Intent.** The check holds implementers to their claims and never pushes a grader to commit.
- **W2. Text taken for a command (F257).**
  - **Cause (inferred from the regexes).** The commit and ladder records are found by matching `git ... commit` and
    `verify.mjs fast` anywhere in a command's text, so `echo git commit` would count.
  - **Outcome.** A commit counts only from a command whose program is `git` with `commit` as its subcommand (through
    the shell wrappers Codex uses: `powershell.exe -Command '...'`, `bash -lc '...'`), and the ladder only from a
    command that runs `node scripts/verify.mjs fast` or `pnpm verify:fast`; tests show `echo git commit` and an echo of the ladder's command
    do not count, and each wrapper form of a real command does. The recognised invocation counts only when its own
    status is the event's (no `||`, `;` or a later command that can mask it) and it can make a commit (`--dry-run` and
    `--help` do not count), and the last counted commit's output names the worktree HEAD's abbreviated SHA.
  - **Intent.** The record of what ran is what ran.
- **W3. The launch-HEAD refusal unchanged (review 1).**
  - **Outcome.** A report naming the launch HEAD as its commit gets the same failure lines as at `c286c4c9`, with no
    added empty-diff line.
  - **Intent.** One reason per refusal.
- **W4. A function one reader can hold (review 2).**
  - **Outcome.** `reportClaimFailures` only gathers failures from named helpers (candidate resolution, lineage and diff,
    the commit record, the ladder record), none over 60 lines, with the same failures for every case the tests cover.
  - **Intent.** The next change to the check touches one helper.
- **W5. The tests' own duplicates (review 3 and 4).**
  - **Outcome.** `new-handoff.test.ts` starts the command through one helper everywhere, and `openableFixture` returns
    only what a caller reads.
  - **Intent.** One paved path in the tests too.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (W1-W5), fails at this HEAD at an
  assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your
  result; the cases you commit are the ones you showed failing, and the fast ladder runs them. W4 and W5 are shown by
  line counts and the unchanged test results. Report each failing output.
- **L1. The round's own outcomes.** Every outcome and limit of `codex-launcher-fixes-6.md` still holds (report each
  again), and every test at this HEAD keeps its assertions and still runs.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change), `scripts/agent-environment/new-handoff.test.ts` (must change) and
`scripts/agent-environment/new-handoff.mjs`; commit once when done. Everything else is read-only. Add no dependencies.
If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the helpers' line counts;
the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
