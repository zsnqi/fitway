<!-- brief-format: v1 role: codex -->
# Codex brief: only real citations protect temp folders (agent-environment-r03, round 16b, repair 1)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `e0d00b5a`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 24.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/r03/briefs/round-16.md`
  §"Causes and required outcomes" (R2, your round 16); `.agents/skills/gardener/SKILL.md` and the scripts beside it.

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
- No other round runs beside this one.
- Never run `git worktree remove`, `git worktree prune`, a removal command a survey proposes, or a generated
  `cleanup.mjs` against this machine's real worktrees or temp folders. Tests that make links, worktrees or folders,
  or delete them, do so only in what they create under `D:/fitway-temp/<run>/` or the OS temp folder, with their own
  temp root.
- A survey writes only under `D:/fitway-temp/`; give each run a fresh `-Out` folder there.

## Goal

The survey again proposes the temp folders nobody cites, while a folder any tracked text file cites stays protected,
and a cleanup of a whole proposal list finishes in minutes.

## Causes and required outcomes

- **R5. Binary files and drive-root text protect every folder.** Round 16's citation sources are every tracked file,
  read as UTF-8 text (`.agents/skills/gardener/survey.mjs:62-66`, `:176`), and `references`
  (`.agents/skills/gardener/facts.mjs:111-161`) lets a cited ancestor protect a folder, reading `/d/` as `d:/`.
  Tracked PNG and zip files contain byte runs such as `/d/`, so on `e0d00b5a` a survey of `D:/fitway-temp` proposed
  0 of 852 folders; the survey of `edaf626c` proposed 38
  (`D:/fitway-temp/r03-r16-baseline/survey-base-2/survey.json`). Outcome: a file Git treats as binary is never a
  citation source; a citation of the temp root or of any path above it (a drive root such as `D:/`, `d:/` or `/d/`)
  protects no folder; a citation of the folder or of a path below it still protects it, with every R2 rule of
  round 16 unchanged. On this machine, a survey of `D:/fitway-temp` proposes every folder that survey of `edaf626c`
  proposed, except each one a tracked text file cites at or below its path or that changed since, and the survey
  names each exception with its reason; `reports-phone`, `fonts-verify` and `fonts-r1-verify` stay protected, each
  with its citations. Intent: the survey finds sediment again, and only evidence is protected.
- **R6. Cleanup re-reads every tracked file per folder.** `.agents/skills/gardener/cleanup.mjs:29-37` collects the
  records and every tracked file's citations again for each folder; on `e0d00b5a` a cleanup of 4 folders took about
  3 minutes. Outcome: one cleanup run reads the tracked files' citations at most once, and a folder that a tracked
  text file cites after the survey is still kept, with the citation named. Intent: a 30-folder cleanup takes
  minutes, not an hour, and still never deletes newly cited evidence.
- **R7. Proven.** Outcome: tests for R5 and R6, each failing on `e0d00b5a` and passing after, run in the fast ladder;
  round 16's tests still pass; `node scripts/verify.mjs fast` passes on your committed, clean tree; one survey on your
  committed tree (`.agents/skills/gardener/pass.ps1` with a fresh `-Out`) shows its proposed folders against the 38
  of `edaf626c`, each exception with its reason, `repository unchanged=true`, and its duration. Intent: the repair is
  shown on this machine's real temp root, not only on fixtures.

## Scope

You may change `.agents/skills/gardener/` and `.claude/skills/gardener/`; commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others,
then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
