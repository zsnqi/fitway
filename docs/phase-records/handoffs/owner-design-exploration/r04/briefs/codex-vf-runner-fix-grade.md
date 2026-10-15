<!-- brief-format: v1 role: codex -->
# Codex brief: grade vf-runner-fix by running these checks (owner-design-exploration-r04, vf-runner-fix-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-vf-runner-fix-grade/wt`, branch `grade-vf-runner-fix`, HEAD `1ff1f9cf`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 66 and 67 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-runner-fix.md`, whole: the brief of the round you grade, which names that round's own worktree, base and W1-W4; your contract is G1-G12 below;
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
- **This round grades; it fixes nothing.** Keep scripts, plants and logs in `D:/fitway-temp/owner-r04-vf-runner-fix-grade/`.
- **The CLI you grade** is the one at your HEAD: `node D:/fitway-temp/owner-r04-vf-runner-fix-grade/wt/.agents/skills/verify-fitway/cli.mjs`.
  The old CLI for comparison is the same folder at `3ac1770a`, taken with `git archive` outside every git tree. Real
  compares use ports 3186-3187 only; never stop a process you did not start; 3174 and 3180 serve the user's preview.
  The concept is the build branch `owner-followup-r04-build`'s folder
  `design-research/owner-composition-exploration-r04/directions/eclipse/` at `23314b3a`, taken with `git archive`
  and extracted outside every git tree. Another grader of the same result may compare on 3176-3177 beside you: a
  pair it holds counts as held for G7.

## Goal

The coordinator knows, row by row, whether the delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. Post-capture proofs held by tests.** Outcome: in a temp copy of the result's CLI, each in turn: (a) delete
  the before rules' proof after the before frame; (b) delete the proof before the after frame; (c) delete the proof
  after it; (d) put back `3ac1770a`'s condition, so any `afterActions` rule skips every before rule's proof beside
  the after frame. Each makes at least one fast-ladder test fail (name it); the unplanted copy passes; and on a fixture item with one
  ended and one unaffected before rule, `summary.json` lists exactly the unaffected rule as proven beside the after
  frame and omits the ended one. Intent: a removed proof never goes unnoticed.
- **G2. An arrival captured, other conditions.** Outcome: Reports `arrive=500` with `state=loading` and an arrival
  rule in the result's declared form, written by you and reading `window.__reports.phase`, English, tablet, 4
  workers, three self compares: EQUAL each time; crop the before frame (the skeleton) and the after frame (the loaded
  page) of one run. Intent: an arrival is checked like any state.
- **G3. The declaration matters.** Outcome: the same item with the arrival declaring no ended rule is a problem
  (the loading proof fails beside the after frame), never EQUAL; and with an extra before rule the arrival does not
  end, made false only after the before frame (a recipe expression that flips on capture, or a fixture), the item
  fails. Intent: an arrival lifts only the proof it names.
- **G4. The full self compare unchanged.** Outcome: a full self compare (every page, `--feature all`, ar and en,
  desktop, tablet and phone, reduced motion, 4 workers, http) with the result's CLI and with `3ac1770a`'s CLI: the
  same item list and the same verdict for every item (both counts and the list of non-EQUAL). Intent: nothing else
  moved.
- **G5. The guide test refuses invented options.** Outcome: each alone in a temp copy of `SKILL.md`, in "## Discover
  and check", "## Compare" and after "## Evidence and advanced tools": (a) `node $cli compare --no-such-flag`; (b)
  `node $cli measure --tool focus --no-such-flag --out x -- --max-stops 40`; (c) `node $cli compare --concept x --
  --no-such-flag`; (d) a table row `` | `--no-such-flag` | x | ``; (e) prose: "After pnpm installs, the measure tool
  arguments take `--no-such-flag`."; (f) `node $cli measure --tool capture --no-such-flag`; (g) one inline span holding two commands, `node $cli
  measure --tool focus --out x -- --max-stops 40; node $cli drive --no-such-flag`. Every one fails the
  guide test. Control: `node $cli measure --tool focus --out x -- --max-stops 40` in a fenced block passes, in every
  section. Intent: no reader meets an option the CLI lacks.
- **G6. Test roots apart.** Outcome: `compare-speed.test.mjs` and `compare-parallel.test.mjs` run at once from two
  separate checkouts of the result (your worktree and a second detached one under your temp folder): all pass; the
  folders they made were under `os.tmpdir()` (traced, for example by a `--require` hook on `mkdtemp` and `mkdir`)
  and disjoint; the resolved real path of every file the runs wrote under a cache folder lies inside that run's
  own folder; none remains after; `git grep fitway-temp` finds nothing in either file. Intent: no run writes
  into another's folder.
- **G7. Ports held.** Outcome: with a listener on each of 3176, 3177, 3186, 3187, 3188 and 3189 and a lease on each
  (`reserveVerificationPorts` in `core.mjs`), `cli.test.mjs`, `timeline-hold.test.mjs` and both compare test files
  pass in full. Intent: a compare on any pair never fails a test run.
- **G8. Limits.** Outcome: `git diff --stat 54cb1ecb HEAD` lists only files under `.agents/skills/verify-fitway/`; no
  test present at `54cb1ecb` is removed, skipped or made conditional, none lost an assertion line, and no existing
  assertion's predicate or expected value changed (list each pre-existing test whose body changed, with the change); each test
  file's count is at least the base's. Intent: nothing was weakened to pass.
- **G9. Declarations refused.** Outcome: a recipe whose arrival declares a wildcard, a `shows` label, or a `when`
  matching no before rule or two, is refused at load with a message, never run with a proof waived. Intent: a
  declaration cannot lift more than it names.
- **G10. The arrival re-proven.** Outcome: with the arrival rule's proof made false just after the after capture
  (a fixture), the item fails. Intent: the after frame is accepted only while the arrival holds.
- **G11. Tool flags are not CLI options.** Outcome: `node $cli drive --forced-colors active` in a fenced block of a
  temp copy of `SKILL.md` fails the guide test. Intent: a flag `help` names only in prose does not count.
- **G12. Two CLI suites at once.** Outcome: two complete runs of `cli.test.mjs` from two checkouts at once both pass;
  during one full run of the four verify-fitway test files, no process listens on, connects to or leases a port in
  3174-3189 (observed, for example by a `--require` hook on `net` listen and connect and on the lease folder, and
  listed per port). Intent: test runs never share a port.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change tracked files only temporarily, for a plant, and restore each before the next; everything you keep goes
in `D:/fitway-temp/owner-r04-vf-runner-fix-grade/`. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G12 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item
or input that failed; each compare's load; anything you could not run.
