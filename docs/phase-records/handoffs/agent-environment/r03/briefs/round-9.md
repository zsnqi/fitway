<!-- brief-format: v1 role: codex -->
# Codex brief: verify-fitway reaches by keyboard and finds every opener (agent-environment-r03, round 9)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `d05b9ec9`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 19.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/DECISIONS.md:78-85` and `:127-135`: where the tools live, and
    what the code derives against what the recipe file holds.
  - `docs/phase-records/handoffs/agent-environment/codex-rounds.md:279-309`: how round 6's verification path was
    graded.
  - `.agents/skills/verify-fitway/SKILL.md` and the CLI beside it: round 6's path, which this round corrects.
  - The concept, read only: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse`,
    with its `verification-recipes.json` (branch `owner-followup-r04-build`, `6df156bd`).

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
- Ports: 3174 is the user's preview and 3178-3185 may be in use; never stop a process you did not start. Use 3176-3177.
- Another Codex round works in D:/Projects/fitway-worktrees/agent-environment-r03-gardener on the gardener at the same
  time; leave that worktree and its files alone.

## Goal

An agent can ask verify-fitway for a feature by keyboard, a new opener in the concept fails drift by name, a stale
recipe file has a command that moves it forward, and the output an agent reads is short and true.

## Causes and required outcomes

Round 6 delivered the path (`8e520995`); its grading left three rows partial and found output faults
(codex-rounds.md:288-305). The CSS-only tooltip stays a recipe entry (DECISIONS item 19).

- **K1. Keyboard is an input.** `runner.mjs:148` takes only mouse and touch, so Access's PIN dialog in Arabic at 768
  by keyboard cannot be asked for. Outcome: drive and compare take keyboard as an input; such an item reaches its
  feature with key presses only, and its evidence records the focused element at each step; a feature no key
  sequence reaches is reported as not reachable by keyboard, naming where focus stopped, never as a pass. Intent: a
  verifier proves keyboard reach instead of assuming it.
- **K2. Every opener is discovered.** `discover.mjs:442-450` finds openers through `aria-controls` only, so a new button
  with `aria-haspopup="menu"` passes drift. Outcome: an element whose `aria-haspopup` is anything but `false` is an
  opener; drift fails naming its file and line when no recipe covers it; the build at `6df156bd` passes drift with
  any recipe additions this round writes into its evidence folder (the coordinator commits them on the build
  branch). Intent: an opener added next month fails a check by name; no rule that quiets the components page's
  specimens may also quiet a live opener.
- **K3. A stale recipe file has a way forward.** `cli.mjs:252-264` answers a recipe drift with a `map` command that
  repeats the drift errors. Outcome: for a stale recipe file the doctor prints a command that writes a repaired copy
  outside the concept: recipes whose selector or marker is gone are dropped, and each uncovered element gets an entry
  marked as a draft; drift with that copy names only the drafts still to complete; the concept folder is unchanged.
  Intent: an agent never loops between doctor and map.
- **K4. Short, true output.** `compare` prints the whole diff map JSON; diff image names carry no state or feature;
  the port refusal names `0.0.0.0` for a listener on `::`; `launch --lan` prints `http://0.0.0.0:3176`
  (`cli.mjs:377`); `help` in a clone without node_modules fails with a raw module error. Outcome: compare prints one
  line per item and a summary, the full record staying in its file; diff image names carry feature, state, language,
  size and input; the refusal names the address actually held; `launch --lan` prints an address another device on
  the network can open; `help` works without node_modules and names the install step for the commands that need it.
  Intent: an agent spends its context on frames, not on parsing.
- **K5. Proven.** Outcome: following only the skill, you drive Access's PIN dialog in Arabic at 768 by keyboard;
  round 6's W7 commands (`docs/phase-records/handoffs/agent-environment/r03/briefs/round-6.md` W7) still pass; unit tests for K1-K4 that need no browser
  (`aria-haspopup` discovery with a planted opener, the repaired recipe both ways, the address naming) run in the fast
  ladder's unit-test step; `node scripts/verify.mjs fast` passes on your committed, clean tree. Intent: the
  corrections are shown, not claimed.

## Scope

You may change `.agents/skills/verify-fitway/` and `.claude/skills/verify-fitway/`; commit once when done. Everything
else is read-only, including the concept folder and the rest of the build worktree. Add no dependencies. If an outcome
cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the path of any recipe additions in
your evidence; the files you changed; the commit SHA; anything you could not do.
