<!-- brief-format: v1 role: codex -->
# Codex brief: gardener proposals never reach linked data or cited evidence (agent-environment-r03, round 16)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `edaf626c`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 24.
- **Read first, only these:** `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F100, F103, F104;
  `.agents/skills/gardener/SKILL.md` and the scripts beside it.

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
- Round 17 runs beside this one in `D:/Projects/fitway-worktrees/agent-environment-r03-verify`. If
  `node scripts/verify.mjs fast` fails only in "Verification CLI contracts" on a held port, wait with Monitor until
  3176 and 3177 are free (up to 90 minutes); never stop a process you did not start.
- Never run `git worktree remove`, `git worktree prune`, a removal command a survey proposes, or a generated
  `cleanup.mjs` against this machine's real worktrees or temp folders. Tests that make links, worktrees or folders,
  or delete them, do so only in what they create under `D:/fitway-temp/<run>/` or the OS temp folder.
- A survey writes only under `D:/fitway-temp/`; give each run a fresh `-Out` folder there.

## Goal

Doing what a gardener survey proposes can never delete data outside the item it names, or a folder that any tracked
file cites as evidence; and when the ladder parser cannot read a step, its failure names that step.

## Causes and required outcomes

- **R1. Worktree proposals ignore links (F100).** `classifyWorktrees` (`.agents/skills/gardener/facts.mjs:185`)
  makes any merged, clean, unreferenced worktree a candidate, and the survey proposes `git worktree remove` for it
  (`.agents/skills/gardener/survey.mjs:874-881`). On this machine `git worktree remove` follows a junction: on
  2026-10-10 removing a proposed grading worktree whose `node_modules` was a junction to another worktree's emptied
  that target. Outcome: for a worktree that holds, at any depth, a link (junction, or directory or file symbolic link)
  whose target lies outside that worktree, or whose target is missing, running exactly what the survey proposes, from
  Windows PowerShell 5.1, deletes nothing outside the worktree; such a worktree and each such link are named in the
  report, whether or not its removal is proposed; a worktree whose links point only inside itself (pnpm's own
  `node_modules` layout) is proposed as before; a worktree whose links cannot be read is not proposed; SKILL.md
  states the rule. Intent: a proposal followed to the letter cannot empty another worktree, while ordinary installed
  worktrees stay removable.
- **R2. Folder citations are read only from open records (F104).** `collectRecords`
  (`.agents/skills/gardener/survey.mjs:66`) loads the ledger, the rolling report, resume files, packets, DECISIONS and
  AUDIT pointers, round results and briefs, and `classifyFolders` (`.agents/skills/gardener/facts.mjs:241`) protects
  only folders those cite. `D:/fitway-temp/reports-phone` is cited as round evidence by
  `docs/phase-records/handoffs/owner-design-exploration/20260923-165000-owner-design-exploration-r04-activation.md:4297`
  and `design-research/owner-composition-exploration-r04/directions/briefs/step4-reports-phone-options.md:12`, yet the
  2026-10-09 final survey proposed it (`D:/fitway-temp/gardener-weekly/2026-10-09/survey-final-coordinator/survey.json`).
  Outcome: a temp folder that any tracked file of the checkout cites by path, as `references`
  (`.agents/skills/gardener/facts.mjs:111`) reads a citation (either slash, any letter case, the folder itself or a
  path above or below it), is not proposed, and the report names the citing file and line; text in the rolling
  report's "Folder removal proposals" section still protects nothing, and a prose word that matches a folder name
  still protects nothing; the generated cleanup script applies the same rule when it runs
  (`.agents/skills/gardener/cleanup.mjs:29-44`), so a folder that a tracked file cites after the survey is kept and
  the script names the citation. Intent: no evidence a record points to, open, closed or archived, can be proposed or
  deleted, at survey time or at deletion time.
- **R3. The parser's failure names no step (F103).** `parseFastSteps` (`.agents/skills/gardener/facts.mjs:375`)
  fails every non-literal part of a step with one message, "fastSteps contains a non-literal step; cannot establish
  gate coverage". Outcome: the failure names the step, by its label when the label is a string literal and otherwise
  by its position in the returned array (the message says how positions count), and says which part is not literal.
  Intent: whoever turned the ladder test red finds the step from the message alone.
- **R4. Proven.** Outcome: tests for R1-R3, each failing on `edaf626c` and passing after, run in the fast ladder;
  R1's test makes real junctions, runs the proposed commands on a disposable worktree, and checks a file at the link
  target survives; `node scripts/verify.mjs fast` passes on your committed, clean tree; one survey on your committed
  tree (`.agents/skills/gardener/pass.ps1` with a fresh `-Out`) does not propose `D:/fitway-temp/reports-phone`,
  names its citations, shows `repository unchanged=true`, and its duration is reported. Intent: the repairs are
  shown, not claimed.

## Scope

You may change `.agents/skills/gardener/` and `.claude/skills/gardener/`; commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others,
then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
