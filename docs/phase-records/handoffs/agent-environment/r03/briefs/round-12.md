<!-- brief-format: v1 role: codex -->
# Codex brief: the gardener's pass survives its own ledger entry (agent-environment-r03, round 12)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `70bc51c1`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 19.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/codex-rounds.md`, the section on round 8b (result e0fcb90e, level
    high).
  - `docs/WORKFLOW.md` §"Active ledger and closed history" (its last paragraph): how the weekly pass and the
    coordinator's ledger entry follow each other.
  - `.agents/skills/gardener/SKILL.md` and the scripts beside it.

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
- Never run a cleanup script on real folders of `D:/fitway-temp`; test it on folders you create under your run folder.
- Other rounds run beside this one in other worktrees. The fast ladder's contract tests bind ports 3176-3177: if they
  are taken when you run the ladder, wait with Monitor until both are free (up to 90 minutes) instead of reporting a
  failure; never stop a process you did not start. (round 8: H10 failed on a held port)

## Goal

The weekly pass's cleanup proposal still runs after the coordinator records the pass, an old unmerged worktree is
named for review without stopping the rest of the pass, and the pass's own location is set in one place.

## Causes and required outcomes

- **G1. The ledger entry breaks the handed-over script.** `survey.mjs:64-80` hashes the whole of `PROJECT_STATE.yaml`,
  and `cleanup.mjs:29-37` refuses ("Open records changed; run a fresh survey") once the coordinator writes the
  `gardener` entry the pass asks for. Outcome: a change to the ledger's `gardener` entry alone leaves the script
  runnable; any other change to an open record still stops it, and the message names the record that changed.
  Intent: the order the workflow prescribes cannot void the proposal the user reviews.
- **G2. A flagged worktree blocks every pass.** `facts.mjs:155-160` flags an unmerged worktree older than the minimum
  age and `survey.mjs:783-790` turns any flag into the outcome `blocked`, shown only as a JSON field. Outcome: the
  report has a section "Worktrees awaiting review" naming each such worktree's path, branch, last commit date and
  status; such a worktree alone does not make the outcome `blocked` (the outcome keeps the ledger's values, the
  `gardener` entry in `docs/schemas/project-state.schema.json`, which this round does not change), the console line
  says how many worktrees await the coordinator's review, and the rest of the pass (proposals, script, checks)
  completes. Intent: one old worktree does not hide the week's other findings.
- **G3. The weekly worktree's path lives in two places.** `facts.mjs:141` compares against
  `d:/projects/fitway-worktrees/gardener` while `scripts/agent-environment/gardener-weekly.ps1:8` defaults its
  `-Worktree`. Outcome: one source holds the path, and a pass started from another worktree path is still recognised
  as the weekly pass and never proposes its own removal. Intent: moving the schedule is one edit.
- **G4. The skill omits the rerun after the ledger entry.** `docs/WORKFLOW.md` (its paragraph above) has the
  coordinator rerun the final survey after the entry; `.agents/skills/gardener/SKILL.md:155-159` does not say so.
  Outcome: the skill's closing steps match the workflow's order. Intent: an agent reading only the skill does it.
- **G5. Proven.** Outcome: tests for G1-G3 that need no machine state run in the fast ladder's unit-test step, each
  failing on `70bc51c1`; one pass on disposable folders shows G1 (script runnable after a `gardener`-entry edit, refused
  after another record's edit); `node scripts/verify.mjs fast` passes on your committed, clean tree. Intent: the
  repairs are shown, not claimed.

## Scope

You may change `.agents/skills/gardener/`, `.claude/skills/gardener/` and
`scripts/agent-environment/gardener-weekly.ps1`; commit once when done. Everything else is read-only, including the
ledger and `docs/WORKFLOW.md`. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
