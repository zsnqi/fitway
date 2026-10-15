<!-- brief-format: v1 role: codex -->
# Codex brief: the guide's exemption ends at any separator, tests probe no verification port, and ended rules read per language (owner-design-exploration-r04, vf-runner-fix-2)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-runner-ds`, branch `owner-r04-vf-runner-ds`, HEAD `1ff1f9cf`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 66 and 67.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/cli.test.mjs` lines 3424-3530 and 3580-3640;
  - `.agents/skills/verify-fitway/cli.mjs` lines 252-380;
  - `.agents/skills/verify-fitway/core.mjs` lines 236-262 and 365-400;
  - `.agents/skills/verify-fitway/state-rules.mjs`, whole;
  - `.agents/skills/verify-fitway/runner.mjs` lines 105-160;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F183 and F239.

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
  starts child processes with piped output (pnpm, Playwright, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch, without Playwright Chromium or ui-forensics, and with a system temp folder in its short 8.3
  form (`C:UsersRUNNER~1...`): every test you add passes there.
- **Your temp folder** is `D:/fitway-temp/owner-r04-vf-runner-fix-2/`. Start no compare; ports 3174 and 3180 serve
  the user's preview: never stop a process you did not start. If a verify-fitway test fails in the fast ladder, rerun
  that file alone once and report both runs.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.

## Goal

An option after a shell separator in the guide is always checked, the tests never touch a verification port even
when it is free, and an arrival's ended rule is read per language as the runner reads rules.

## Causes and required outcomes

- **Y1. A separator written onto a token (F239).**
  - **Cause.** `measureExemptRanges` (`cli.test.mjs:3437-3471`) ends a `measure` command's exemption only at `;`,
    `&&`, `||` or `|` standing as a whole token, so in one code span `... -- --max-stops 40; node $cli drive
    --no-such-flag` exempts the second command's invented option.
  - **Outcome.** The exemption ends at a separator however it is written: `;`, `&&`, `||` or `|` alone, at the end
    or start of a token, or inside one (`40;`, `40&&`, `;node`, `a|b`), in an inline span and in a fenced line; an
    option after it is checked like any other; every form the V5 test refuses at the HEAD is still refused, and
    every form it accepts is still accepted, each kept as a case of that test.
  - **Intent.** Only a token the CLI hands to its tool unread is exempt, never the next command's.
- **Y2. A verification port probed by a test (F183).**
  - **Cause.** A command the tests expect to fail runs `doctor`, whose fix suggestion probes the default pair with
    `portAvailable` (`cli.mjs:358`, `core.mjs:246-254`), so with 3176-3177 free one run of `cli.test.mjs` listens on
    3176 dozens of times; with the pair held the lease check refuses first, so a run with the ports held never shows
    it.
  - **Outcome.** With every port in 3174-3189 free, one full run of the four verify-fitway test files listens on,
    connects to and leases no port in that range, observed by a hook on `net` loaded into every Node process the
    run starts; the same run with each verification pair held as a compare holds it (a listener and its lease)
    still passes in full; outside the tests a failing `doctor` still prints its `FIX` line naming a free pair, as
    at the HEAD; a test-only seam may stop the probe but never changes which port a command binds or reports.
  - **Intent.** A test run neither fails because a round holds a pair nor takes a pair a round is about to use.
- **Y3. Ended rules and languages.**
  - **Cause.** `state-rules.mjs:48-60` counts the before rules an `ends` entry names across languages, while the
    runner selects rules per language (`runner.mjs:110-112`), so a page with one `state=loading` rule for `ar` and
    one for `en` refuses an arrival that ends `{state: "loading"}` as matching several rules.
  - **Outcome.** That recipe loads, and an item in each language lifts only its own language's rule beside the after
    frame; two before rules with the same `when` that would both apply to one item (the same language, or one with
    no `language`) are still refused; every refusal the HEAD's tests check still holds.
  - **Intent.** A declaration names one rule per item, the way the runner chooses rules.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional, the helpers and fixtures they use keep what they check (a change to one is reported
  with the outcome that needed it), and the suite runs at least as many tests as at the HEAD.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `.agents/skills/verify-fitway/cli.test.mjs` (must change), `.agents/skills/verify-fitway/state-rules.mjs`
(must change), `.agents/skills/verify-fitway/cli.mjs`, `.agents/skills/verify-fitway/core.mjs`,
`.agents/skills/verify-fitway/SKILL.md` and other files under `.agents/skills/verify-fitway/`; commit once when done.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for Y1 each separator
form you tested and its result; for Y2 the hook's per-port counts with the ports free and the result with them held;
the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
