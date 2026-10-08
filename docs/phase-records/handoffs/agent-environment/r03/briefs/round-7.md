<!-- brief-format: v1 role: codex -->
# Codex brief: a permanent gardener (agent-environment-r03, round 7)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `2bb94d24`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 17.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/DECISIONS.md:86-96`: what the gardener is and is not.
  - `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md` §"What the evidence says" and §"Gardener": the sediment it
    keeps away and where its report goes.
  - `docs/agent-context/WORKING_AGREEMENTS.md` §"Starting a task": the housekeeping the coordinator does without asking.
  - `C:/Users/Pc Force/.agents/skills/maintain-verification-skill/SKILL.md`: the closest existing pass (pstack, MIT).
  - `.agents/skills/verify-fitway/SKILL.md` and `.claude/skills/verify-fitway/SKILL.md`: the skill-and-pointer layout.

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
- Another Codex round works in D:/Projects/fitway-worktrees/agent-environment-r03 on the verification path at the same
  time; leave that worktree, its ports (3176-3177) and its files alone, and do not depend on its CLI's commands.

## Goal

After this phase, nothing keeps the environment clean but a person remembering to. A gardener does it: a skill both
tools read, a read-only survey it starts from, and a record the coordinator sees at startup.

## Causes and required outcomes

None existed (DECISIONS item 16): maintain-verification-skill keeps only a verification map honest, and CI blocks only
regressions of rules already encoded. The phase's audit found 774 round scripts, 82 GB of leftovers, 4 dead worktree
registrations, 15 merged branches, checks run twice or only locally, and rules kept in 3 to 5 homes (AUDIT §"What the
evidence says"); nothing would have found them sooner.

- **G1. The skill.** Outcome: a gardener skill (frontmatter, at most 200 lines) with DECISIONS item 16's five classes as
  its fixed checklist (a correction seen twice; drift; sediment; gate gaps; rules nothing needs), a pass's procedure
  (survey, choose at most one bounded change, verify it, report), its limits (never product semantics, design
  decisions, or evidence a record points to; policy removals and anything it may not do go to the coordinator as
  proposals), its triggers (weekly, a milestone closing, a review repeating a known finding class), and the three
  outcomes of a pass (clean, changed, blocked); a second SKILL.md for Claude only points to it. Intent: Claude or Codex
  runs a pass from the skill alone, and two passes on the same state reach the same outcome.
- **G2. The survey.** Outcome: one read-only command, invoked as the skill shows, that writes a report outside the
  repository and lists, with the evidence for each: worktree registrations whose folder is missing; worktrees whose
  branch is merged into main with nothing uncommitted; local and remote branches merged into main that no open record
  names (ledger, resume files, briefs, packets); top-level folders of D:/fitway-temp with size and age that no open
  record names; `package.json` checks the fast ladder does not run, and ladder steps that run one check twice; every
  `check:*` script of package.json that fails, and brief:check on each open brief (one a milestone's resume file or
  ledger entry names as running or next); and lines of 40 or more characters kept in more than one rule home (AGENTS.md,
  docs/WORKFLOW.md, WORKING_AGREEMENTS.md, the brief templates) or naming a path that no longer exists. It changes
  nothing anywhere. Intent: a pass spends judgment only on what the facts flag.
- **G3. Deleting safely.** Outcome: a pass deletes nothing on the machine itself: for folders it writes a script for the
  user to run that deletes each listed folder with a method that reaches long paths and names ending in a dot
  (rmdir /s /q with the \\?\ prefix; a folder named "evidence." on 2026-10-07 defeated ordinary paths), continues past
  one failure and reports it, and never touches a folder outside D:/fitway-temp, a worktree with uncommitted changes, or a file an open
  record names. Git housekeeping the agreements allow (merged branches, dead registrations) the pass may do itself and
  report. Intent: the user decides what leaves the machine, as in the 2026-10-07 cleanup.
- **G4. The record.** Outcome: each pass replaces one rolling report in the repository (date, outcome, the survey's
  findings, the change made or proposed, what waits for the coordinator); the ledger schema accepts one `gardener`
  entry (the last pass's date, outcome and report path) and check:repository validates it. The coordinator writes the
  ledger line itself. Intent: the coordinator sees at startup when the last pass ran and whether something waits.
- **G5. Tested.** Outcome: unit tests for the survey's parts that need no machine state (classifying branches,
  worktrees and folders from fixtures; duplicate-rule and dead-path detection; gate gaps from a fixture ladder) run in
  the fast ladder's unit-test step as it is (the ladder and package.json stay unchanged), and `node scripts/verify.mjs fast`
  passes on the committed, clean tree. Intent: the survey's judgment of what is sediment cannot drift unseen.

## Scope

You may create `.agents/skills/gardener/` (new) and `.claude/skills/gardener/` (new), and change
`docs/schemas/project-state.schema.json`, `scripts/verify-repository.mjs` and `scripts/verify-repository.schema.test.ts`;
commit once when done. The rolling report's path is yours to name in the skill; the first pass creates it. Everything else is read-only, including the ledger. Add no dependencies. If an
outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the survey's report on this machine
today; the files you changed; the commit SHA; anything you could not do.
