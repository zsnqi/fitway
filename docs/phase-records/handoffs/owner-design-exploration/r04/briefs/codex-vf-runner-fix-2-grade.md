<!-- brief-format: v1 role: codex -->
# Codex brief: grade vf-runner-fix-2 by running these checks (owner-design-exploration-r04, vf-runner-fix-2-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-vf-runner-fix-2-grade/wt`, branch `grade-vf-runner-fix-2`, HEAD `a8791d1a`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 66 and 67 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-runner-fix-2.md`, whole: the brief of the round you grade, which names that round's own worktree, base and Y1-Y3; your contract is G1-G9 below;
  - `.agents/skills/verify-fitway/SKILL.md` at your HEAD, the CLI's guide.

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

- You run in the workspace-write sandbox with automatic approval review. Anything that starts child processes with
  piped output (pnpm, Playwright, Node scripts that run git) fails inside it: request escalation for it from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** Keep scripts, plants and logs in `D:/fitway-temp/owner-r04-vf-runner-fix-2-grade/`.
- **The CLI you grade** is the one at your HEAD. The base CLI is the same folder at `1ff1f9cf`, taken with
  `git archive` outside every git tree. Real compares use ports 3186-3187 only; never stop a process you did not
  start; 3174 and 3180 serve the user's preview. The concept is `owner-followup-r04-build`'s folder
  `design-research/owner-composition-exploration-r04/directions/eclipse/` at `23314b3a`, taken with `git archive`
  and extracted outside every git tree. For G3, run with nothing holding 3174-3189: check with `netstat` first and
  report it.

## Goal

The coordinator knows, row by row, whether the delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. Attached separators.** Outcome: each alone in a temp copy of `SKILL.md`, in "## Compare" and after "## Evidence
  and advanced tools", inline and in a fenced line: `node $cli measure --tool focus --out x -- --max-stops 40;node
  $cli drive --no-such-flag`; the same with `40 &&node`, `40|node`, `--a||node $cli compare --no-such-flag` and
  `40 & node $cli drive --no-such-flag`; and the prose line "After pnpm installs, the measure tool arguments take
  --no-such-flag.". Every one fails the guide test. Controls that pass: `node $cli measure --tool focus --out x --
  --max-stops 40 --forced-colors active` and `node $cli measure --tool focus --out x -- --pattern 'a|b;c' --max-stops
  40`. Intent: only a token handed to the tool unread is exempt.
- **G2. Nothing lost.** Outcome: every plant the V5 test refused at `1ff1f9cf`, and the seven plants of
  `D:/fitway-temp/owner-r04-vf-runner-fix-opus/vf5/plants.mjs`, are still refused in all three sections; the base's
  accepted controls still pass. Intent: the repair narrows nothing.
- **G3. No verification port touched.** Outcome: with 3174-3189 free, a `--require` hook on `net` listen and connect,
  loaded into every Node process through `NODE_OPTIONS`, over one run of the four verify-fitway test files: zero
  listens and connects in 3174-3189 (list per port), and the run passes in full; a planted `listen(3176)` in a throwaway
  script under the same hook is counted. Intent: a test run takes no pair a round may use.
- **G4. Pairs held.** Outcome: with a listener and a lease (`reserveVerificationPorts` in `core.mjs`) on each of
  3176, 3177, 3186, 3187, 3188 and 3189, the four files pass in full. Intent: a held pair fails no test.
- **G5. Real use unchanged.** Outcome: outside the tests, `doctor` with `--port 3176` while a foreign listener holds
  3176 prints a `FIX` line naming a free port of a verification pair, as the base CLI does (run both). Intent: the
  seam changes tests only.
- **G6. Ended rules per language.** Outcome: `D:/fitway-temp/owner-r04-vf-runner-fix-opus/vf9/lang_split.json`
  loads (`list` exits 0); a self compare of Reports `arrive=500&state=loading` with it, ar and en, tablet, 4 workers,
  http: EQUAL, and each item's `afterFrameProof` omits its own language's loading rule; a copy with a second `en`
  loading rule is refused as matching several; a copy whose only loading rule is `en`, with the arrival rule set to
  `language: "ar"`, is refused. Intent: a declaration names one rule per item.
- **G7. The repair proven.** Outcome: each new Y1-Y3 test case fails on `1ff1f9cf`'s production code (copy the result's
  test file onto a base archive and run it; list each case and its result). Intent: the new cases see the defects.
- **G8. Limits.** Outcome: `git diff --stat 1ff1f9cf HEAD` lists only files under `.agents/skills/verify-fitway/`;
  no test present at `1ff1f9cf` is removed, skipped or made conditional, none lost an assertion line; each test
  file's count is at least the base's. Intent: nothing was weakened to pass.
- **G9. Report against commands.** Outcome: the result's commit exists, is your HEAD, and the round's run folder
  (`D:/fitway-temp/codex-round-c1f77b90-e1f5-4a2f-9bc6-18f52852356c/`) records a `git commit` and a
  `node scripts/verify.mjs fast` run after the last code change. Intent: the report rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change tracked files only temporarily, for a plant, and restore each before the next; everything you keep goes
in `D:/fitway-temp/owner-r04-vf-runner-fix-2-grade/`. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G9 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; each compare's load; anything you could not run.
