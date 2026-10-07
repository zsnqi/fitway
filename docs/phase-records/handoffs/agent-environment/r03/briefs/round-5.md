<!-- brief-format: v1 role: codex -->
# Codex brief: one command launches and resumes a Codex round (agent-environment-r03, round 5)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `7c7a768f`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 7, 13.
- **Read first, only these:**
  - `docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation": today's launch and resume pipelines, by hand.
  - `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md` §"Tools": the row "Codex launch" this round closes.
  - `docs/phase-records/handoffs/agent-environment/brief-failure-causes.md:35-36`: the stop the launch note fixed.
  - `scripts/agent-environment/check-brief.mjs`: the brief checker the launch must run first.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- Never start a real Codex run: you are one. Every test uses a stand-in for the `codex` executable.

## Goal

The coordinator launches a Codex round, and resumes a stopped one, with one short command that checks the brief
first, so no launch is composed by hand.

## Causes and required outcomes

Each launch is a Git Bash pipeline the coordinator types from `docs/agent-context/WORKING_AGREEMENTS.md`
§"Delegation": the launch note, the model, the level, the run folder, the event stream and the last message, and for
a resume a second pipeline with every exec flag before `resume` (audit §"Tools", row "Codex launch"). Three first
launches stopped on the brief's own commit sitting on the named HEAD before the launch note existed
(`docs/phase-records/handoffs/agent-environment/brief-failure-causes.md:35-36`). Nothing in the repository launches
Codex today, so every outcome below is new; the fast ladder passes on the baseline.

- **L1. Launch.** Outcome: one command, given a brief and a reasoning level, runs the brief checker on that brief
  and launches nothing when it fails; takes the worktree and the named HEAD from the brief's Worktree line; prefixes
  the launch note of `docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation", naming the worktree's HEAD, exactly
  when that HEAD is later than the named HEAD; starts `codex exec` with automatic approval review in that worktree,
  with the model and level of the agreements and the note and brief on its standard input; keeps the event stream
  and the last message in a run folder; prints the run folder and the thread id once Codex reports it; and exits
  with Codex's exit code. Intent: the launch is the same every time, and a brief that would stop Codex never launches.
- **L2. Resume.** Outcome: the same command, given a run folder, resumes that run on its thread (the thread id is on
  the first line of its event stream), with every exec flag before `resume`, and writes a new event stream beside
  the earlier ones, never over them. Intent: a run stopped by an exited app or a usage limit continues on its thread
  instead of starting again (`docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation").
- **L3. Refusals before launch.** Outcome: the command launches nothing, and says why in one line, when the target
  worktree has uncommitted changes (`git status --short` not empty), the level is one Codex does not accept, the run
  folder is inside any git working tree (also through a junction or link) or already holds a run, or `codex` is not
  on the path. Intent: Codex always starts from exactly the named HEAD plus the brief, and its evidence never lands
  in a tree.
- **L4. Where it runs.** Outcome: the same command line gives the same launch from PowerShell and from Git Bash,
  from any working directory, with the brief given as an absolute path or from the repository root, with forward or
  back slashes; the brief's bytes reach Codex unchanged (Arabic text, «», CRLF or LF, no BOM added). Intent: the
  coordinator's background shell (Git Bash) and a human's PowerShell launch the same round.
- **L5. Tested.** Outcome: unit tests with a stand-in `codex` cover each outcome above (the refusal on a failing
  brief, the note present and absent, the argument order for launch and resume, each refusal of L3, the bytes of
  L4, the exit code), run in the fast ladder, and `node scripts/verify.mjs fast` passes on your committed, clean
  tree. Intent: the launch command cannot drift from the agreements unnoticed.

## Scope

You may create `scripts/agent-environment/codex-round.mjs` (new) and
`scripts/agent-environment/codex-round.test.ts` (new), and change the `scripts` block of package.json; commit once when done. Everything else is read-only,
including `docs/`, AGENTS.md, CLAUDE.md, `.agents/`, the ledger and the packets (the coordinator updates the
agreements to name the command after this round). Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the command's usage as its help
prints it; the files you changed; the commit SHA; anything you could not do.
