<!-- brief-format: v1 role: codex -->
# Codex brief: a resume message arrives exactly as written (agent-environment-r03, round 26)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r26`, branch `agent-environment-r03-r26`, HEAD `7bd07f7d`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 7, 13.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs` and `scripts/agent-environment/codex-round.test.ts`;
  - `docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation" (the paragraph on a run that stopped mid-change);
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` row F114.

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
- Never start a real Codex run: prove the resume path with a stand-in for the `codex` executable placed first on
  `PATH` for the test, as the existing tests do.

## Goal

The coordinator can resume a stopped Codex run with any message text, from any of this machine's shells, and Codex
receives that text exactly.

## Causes and required outcomes

- **M1. A message with double quotes is split.**
  - **Cause.** `pnpm codex:round -- resume <folder> --message $m` takes the text as one native argument
    (`scripts/agent-environment/codex-round.mjs:44-60`). Windows PowerShell 5.1 splits a native argument at its double
    quotes, so the parser sees more than four arguments and refuses with `expected resume <folder> [--message
    <text>]` (F114).
  - **Outcome.** A resume message reaches the stand-in byte for byte, whichever way the coordinator sends it from
    Windows PowerShell 5.1, Git Bash and PowerShell 7 (when installed), for a text holding double and single quotes,
    a backslash before a quote, Arabic with «», a `$` sign, and several lines. The way that works in all of them is
    named in the command's `--help` and in the Delegation paragraph above, and the existing `--message` form keeps
    working where it worked.
  - **Intent.** A resume never fails, or sends a changed text, because of the shell it was typed in.
- **M2. Planted controls and proof.**
  - **Outcome.** Tests run by the fast ladder, each failing on `7bd07f7d` and passing after, cover each kind of text
    in M1 through the supported way, and a refusal with a clear message when that way names a file that is missing or
    empty. `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** The exact delivery is shown to fail when it is planted wrong.

## Scope

You may change `scripts/agent-environment/codex-round.mjs`, `scripts/agent-environment/codex-round.test.ts`, any new
fixture beside them, and the one paragraph of `docs/agent-context/WORKING_AGREEMENTS.md` named above; commit once
when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it:
finish and measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 20 lines.
