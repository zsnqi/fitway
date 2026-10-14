<!-- brief-format: v1 role: codex -->
# Codex brief: the record checkers report exactly what is wrong (agent-environment-r03, round 28)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r28`, branch `agent-environment-r03-r28`, HEAD `8275d1c7`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 17, 20.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F003, F007, F051, F052, F053;
  - the code and tests each row names, and nothing else unless a row leads you there.

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
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

Each repository record check fails only on a real fault, reports every fault of its kind in one run, and has a test
that would notice if it stopped doing so.

## Causes and required outcomes

- **K1. A test compares the ledger with itself (F003).**
  - **Cause.** `scripts/check-agent-context.test.ts:609-632` compares the parsed ledger's milestones with a second
    parse of the same file; only its `result.ok` assertion guards anything.
  - **Outcome.** The test asserts the live registry against a value it did not derive from the same parse, and fails
    when the check loses a milestone or reports a wrong one.
  - **Intent.** A test that cannot fail is replaced by one that can.
- **K2. A filename pattern is read as an unfilled placeholder (F007).**
  - **Cause.** `scripts/agent-environment/resume-point.mjs:23-31` says angle-bracket filename patterns are valid, but
    its placeholders are matched anywhere, so "Name files `<branch>-resume.md`" fails as an unfilled `<branch>`.
  - **Outcome.** A placeholder inside a filename or path pattern (any `<name>` joined to other path characters, such
    as `<branch>-resume.md`, `briefs/<round>.md` or `D:/fitway-temp/<run>/`) passes; the template's bare filler
    (`<branch>` on its own, and each other entry of that list standing alone) still fails.
  - **Intent.** A resume point can describe a naming pattern; an unfilled template field is still caught.
- **K3. Prose tokens are claimed as paths (F051).**
  - **Cause.** `scripts/verify-repository.mjs:147-162` treats any token with a `/` or a trailing `.ext` before `: ` as
    a path, so "and/or" and "v1.2" in a scope line would be claimed.
  - **Outcome.** In a scope line, prose tokens are never claimed: slashed words (and/or, RTL/LTR, read/write)
    and version strings (`v1.2`, `1.2.3`). Every scope line in `PROJECT_STATE.yaml` and `PROJECT_STATE_HISTORY.yaml`
    claims exactly the same paths as before.
  - **Intent.** Ownership checks see the paths a scope names and nothing else.
- **K4. One bad task class gives two failure lines (F052).**
  - **Cause.** `scripts/check-agent-context.mjs:946-949` reports a bad task class and skips the packet, so `:980-983`
    adds "active packet metadata points to no packet" for the same packet; the test at
    `scripts/check-agent-context.test.ts:598` uses `toContain`, so it does not notice.
  - **Outcome.** A packet with a bad task class gives exactly one failure line, and the test asserts the exact set of
    lines.
  - **Intent.** One fault, one message.
- **K5. The supersession checks stop at the first fault (F053).**
  - **Cause.** `fail` throws (`scripts/verify-repository.mjs:20-22`), so the `supersededBy` checks (`:136-141` and
    `:438-444`) report only the first misplaced `supersededBy` when there are several.
  - **Outcome.** A ledger and history with two or more misplaced `supersededBy` fields report every one of them in
    one run, each with its milestone, and the command still exits non-zero.
  - **Intent.** A reader fixes every fault of a kind from one run.
- **K6. Proof.**
  - **Outcome.** Each of K1-K5 has a test run by the fast ladder that fails on `bb637f1f` and passes after.
    `pnpm check:repository` and `pnpm check:agent-context` pass on the real records, and `node scripts/verify.mjs
    fast` passes on your committed, clean tree.
  - **Intent.** Each fix is shown to fail when its defect is planted.

## Scope

You may change `scripts/check-agent-context.mjs`, `scripts/check-agent-context.test.ts`,
`scripts/agent-environment/resume-point.mjs`, `scripts/agent-environment/resume-point.test.ts`,
`scripts/verify-repository.mjs` and `scripts/verify-repository.schema.test.ts`, and add fixtures beside them; commit
once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around
it: finish and measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 25 lines.
