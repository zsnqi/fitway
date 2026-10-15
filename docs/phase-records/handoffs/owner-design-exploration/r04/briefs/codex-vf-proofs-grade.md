<!-- brief-format: v1 role: codex -->
# Codex brief: grade vf-proofs by running these checks (owner-design-exploration-r04, vf-proofs-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-vf-proofs-grade/wt`, branch `grade-vf-proofs`, HEAD `0eafd08c`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 67 and 72 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-proofs.md`, whole: the brief of the round you grade, which names that round's own worktree, base and S1-S2; your contract is G1-G9 below;
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
- **This round grades; it fixes nothing.** Keep scripts, plants and logs in `D:/fitway-temp/owner-r04-vf-proofs-grade/`.
- **The CLI you grade** is the one at your HEAD. The base CLI is the same folder at `5b81b3b7`, taken with
  `git archive` outside every git tree. Real compares use ports 3186-3187 only; never stop a process you did not
  start; 3174 and 3180 serve the user's preview. The concept is `owner-followup-r04-build`'s folder
  `design-research/owner-composition-exploration-r04/directions/eclipse/` at `23314b3a`, taken with `git archive`
  and extracted outside every git tree; recipe copies you plant live beside it. Two other rounds run on this machine.

## Goal

The coordinator knows, row by row, whether the delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. The build branch's recipes unchanged.** Outcome: the concept's recipes load and `list` gives the same items
  with the HEAD's CLI and the base CLI (diff the outputs); a self compare of Access's `language` feature, ar, wide,
  gives the same status and `afterFrameProof` with both CLIs. Intent: a recipe without feature `ends` runs as before.
- **G2. Feature ends lifts one rule.** Outcome: in a copy of the recipes where Access's `language` feature drops
  `changesState` and declares `ends` naming one before rule that applies to its item, the copy loads; with that rule
  planted true before the action and false after it, the item passes, its `afterFrameProof` omits that rule and
  holds every other before rule that applies; a copy whose `ends` names a
  `when` no before rule has is refused at load; a copy with `changesState` and `ends` together is refused. The same
  lift holds for a second plant on another page (Reports' `page-retry`, ending `{state: "error"}`). Intent: a
  declaration lifts only what it names, on any feature.
- **G3. A surviving rule is checked.** Outcome: in such a copy, each of two planted before rules with different
  `when` values that apply to the item, are not ended, hold before the action and are false after it, planted one at
  a time, fails that item with a message naming that rule's `shows`. Intent: a state that should survive the action is proved beside the after frame.
- **G4. Several inputs.** Outcome: a feature declaring `ends` whose items differ only in actions, one whose items
  differ only in inputs, and one differing in both are each refused at load (three plants). Intent: one declaration never covers items it does not hold for.
- **G5. Moments named.** Outcome: a planted failing rule at each of the four moments gives a message holding that
  moment's token and none of the other three, the rule's `shows`, `when`, language and kind (before or
  `afterActions`), and Playwright's timeout
  text; the run's JSON item problems hold the same text; two applying rules sharing one `shows` with different
  `when`, the second failing, give a message with the second's `when` and not the first's. Intent: a failure is read
  without a rerun.
- **G6. Nothing else moved.** Outcome: a self compare of every item of each of the four pages, ar and en, wide and
  phone,
  passes with both CLIs and gives the same JSON apart from timing fields and paths (report each page's item count). Intent: passing runs read as before.
- **G7. The repair proven.** Outcome: each new S1-S2 test case fails on `5b81b3b7`'s production code at its own
  behavioural assertion, never at load, import, collection or setup (copy the result's test file onto a base archive
  and run it; list each case, its result and the failing assertion). Intent: the new cases see the
  defects.
- **G8. Limits.** Outcome: `git diff --stat 5b81b3b7 HEAD` lists only files under `.agents/skills/verify-fitway/`; no
  test present at `5b81b3b7` is removed, skipped or made conditional, none lost an assertion line, and no existing
  assertion's predicate or expected value changed (list each pre-existing test whose body changed, with the change);
  each test file's count is at least the base's; every pre-existing helper or fixture the diff changes is listed with
  its change and why the tests that use it still check what they checked. Intent: nothing was weakened to pass.
- **G9. Report against commands, and the inventory.** Outcome: the result's commit exists and is your HEAD; the
  round's run folder (`D:/fitway-temp/codex-round-2c7cab40-1cba-4527-b9ad-13e4eb9fe35b/`) records the `git commit`
  and the `node scripts/verify.mjs fast` run its report names, with their exit statuses quoted from the events; the
  report's list of `changesState` features per page, by feature id, and of the before rules per page, by canonical
  `when`, equals your own list from the concept's recipes (diff them). Intent: the
  report rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change tracked files only temporarily, for a plant, and restore each before the next; everything you keep goes
in `D:/fitway-temp/owner-r04-vf-proofs-grade/`. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G9 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; each compare's load; anything you could not run.
