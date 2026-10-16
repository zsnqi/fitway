<!-- brief-format: v1 role: codex -->
# Codex brief: grade launcher-fixes-6 by running these checks (agent-tooling-r01, launcher-fixes-6-grade)

- **Worktree:** `D:/fitway-temp/tooling-launcher-fixes-6-grade/wt`, branch `grade-launcher-fixes-6`, HEAD `493c0adf`
- **Milestone:** `agent-tooling-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 2 and 5.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6.md`, whole: the brief of the result you grade; your contract is G1-G9 below;
  - `scripts/agent-environment/codex-round.mjs`, `commitCandidates` and `reportClaimFailures`;
  - `scripts/agent-environment/new-handoff.mjs`, `createResumePoint`.

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
  piped output (pnpm, Vitest, Node scripts that run git) fails inside it: request escalation for it from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** Keep scripts, scratch repositories, plants and logs in
  `D:/fitway-temp/tooling-launcher-fixes-6-grade/`. The base is `c286c4c9`; take any base copy with `git archive`
  outside every git tree, and check each copied file against `git show <commit>:` before using it. Call the result's
  `reportClaimFailures` (or the launcher's real claim path) from your own driver on scratch repositories you make;
  start no real Codex round, and never run `handoff:new` on this worktree's ledger: copy the repository for it. The
  worktree's `node_modules` is a junction to the round's root install only, so run single test files, not the whole
  ladder; the coordinator's CI run on the result decides the ladder.
- **The claim scratch repository** for G1-G6: a base commit B, then two later commits C1 and C2 (HEAD = C2) with real
  changes, a clean tree, the launch HEAD recorded as B, and run events holding one successful `git commit` and one
  successful `node scripts/verify.mjs fast` after it, in the launcher's events format.

## Goal

The coordinator knows, row by row, whether the delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. A cited base.** Outcome: a report line "Base commit B (for comparison); commit C2." with B as its full 40-hex SHA and C2 as its SHA gives no
  commit failure; so does "Compared with B at base; HEAD after commit: C2" with C2 abbreviated to its first 7 hex; and so does "Commit: C2; base: B", the base cited after. Intent:
  history may be cited, in any order.
- **G2. The wrong commit.** Outcome: a report naming only "Commit: C1" (with its SHA) is refused, and the failure names C1 and the
  HEAD. Intent: a claim must be the HEAD.
- **G3. A commit that does not exist.** Outcome: a report naming only a fabricated 12-hex SHA on a commit line is
  refused "no such commit object" (F242 kept). Intent: as G2.
- **G4. No commit.** Outcome: with HEAD reset to B and the brief requiring a commit, a report naming B is refused as the
  launch HEAD. Intent: as G2.
- **G5. Other refusals kept.** Outcome: a report naming C2 with a dirty tree is refused as not clean; with no
  successful `git commit` in the events it is refused; with the only successful `verify.mjs fast` before the commit and
  a PASS claimed for an outcome that names the ladder it is refused; a report naming
  C2 with HEAD moved to a commit of another branch that does not descend from B is refused naming both; a report naming
  an empty commit (`git commit --allow-empty` on top of B as HEAD) is refused. Intent: the repair loosened nothing else.
- **G6. Hashes that are not commits.** Outcome: a report naming C2 and also a 64-hex SHA-256 on a line with "HEAD" is
  accepted. Intent: a brief's hash cited beside the commit does not block it.
- **G7. A new milestone's first resume point.** Outcome: in a copy of the repository whose ledger names a new milestone
  with a packet and a handoff file that does not exist (its directory absent), `pnpm handoff:new --milestone <id>`
  exits 0 both with `--dir <a new directory>` and without it, the file exists and equals `docs/agent-context/HANDOFF_TEMPLATE.md`'s template block with the milestone substituted,
  apart from the As of line and the branch and SHA it fills, the ledger's
  `handoff` names it, and `pnpm context:show --milestone <id>` prints it; a second run changes only the As of line
  (byte compare otherwise); each refusal of the base still holds: an id not in the ledger ("Unknown active
  milestone"), a milestone without a packet, an invalid packet, and `--dir` naming a file. Intent:
  opening a milestone needs no hand-made file.
- **G8. The repair proven, nothing weakened.** Outcome: run from the result's test files on `c286c4c9`'s production
  code, every case added since `c286c4c9` fails at an assertion on its outcome, never at a missing module, export,
  helper, fixture or setup (list each case and what it asserts), and passes unchanged on the result, inside the fast
  ladder's unit-test run the events record; `git diff --name-only c286c4c9 HEAD` is exactly
  `scripts/agent-environment/codex-round.mjs`, `codex-round.test.ts`, `new-handoff.mjs` and `new-handoff.test.ts` (with
  `resume-point.mjs` allowed); no test present at `c286c4c9` is removed, skipped, made conditional or lost an assertion,
  and no existing assertion's predicate or expected value changed (list each pre-existing test body that changed).
  Intent: the cases see the defects and nothing was loosened to pass.
- **G9. Report against commands.** Outcome: the result's commit exists and is your HEAD; the round's run folder
  (`D:/fitway-temp/codex-round-c7addb2e-0a77-44df-be1a-eba8a1a3fe8d/`) records the `git commit` whose output names
  `493c0adf` and a `node scripts/verify.mjs fast` run after it with exit 0, with no later commit, quoted from the events;
  the report's red runs (four V1 and three V2 failures) appear in the events before the commit. Intent: the report
  rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-launcher-fixes-6-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of G1-G9 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
