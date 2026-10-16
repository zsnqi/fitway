<!-- brief-format: v1 role: codex -->
# Codex brief: grade launcher-fixes-6 and its fix by running these checks (agent-tooling-r01, launcher-fixes-6-fix-grade)

- **Worktree:** `D:/fitway-temp/tooling-launcher-fixes-6-fix-grade/wt`, branch `grade-launcher-fixes-6-fix`, HEAD `9b89acd1`
- **Milestone:** `agent-tooling-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 2 and 5.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6.md`, whole, and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-launcher-fixes-6-fix.md`, whole: the two briefs of the result you grade (V1-V2, then W1-W5 on top); your contract is G1-G13 below;
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
  `D:/fitway-temp/tooling-launcher-fixes-6-fix-grade/`. The base is `c286c4c9`; take any base copy with `git archive`
  outside every git tree, and check each copied file against `git show <commit>:` before using it. Call the result's
  `reportClaimFailures` (or the launcher's real claim path) from your own driver on scratch repositories you make;
  start no real Codex round, and never run `handoff:new` on this worktree's ledger: copy the repository for it. The
  worktree has its own install; run single test files, not the whole ladder; the coordinator's CI run on the result
  decides the ladder.
- **Your report names no commit by its SHA and holds no hexadecimal word of seven or more characters:** call commits
  "the result HEAD", "the base", "C1", "C2" and so on, and name folders without their hash parts. The coordinator's
  launcher still carries F258, which this result fixes, and would refuse a grader's report. You make no commit outside
  your own scratch repositories under your temp folder, and run no ladder.
- **G1-G6 and G11 drive the claim check as for an implementing brief** (a brief whose Scope says "commit once when
  done"), since the result exempts grading briefs (W1).
- **The claim scratch repository** for G1-G6: a base commit B, then two later commits C1 and C2 (HEAD = C2) with real
  changes, a clean tree, the launch HEAD recorded as B, and run events holding one successful `git commit` and one
  successful `node scripts/verify.mjs fast` after it, in the launcher's events format.

## Goal

The coordinator knows, row by row, whether the delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. A cited base.** Outcome: a report line "Base commit B (for comparison); commit C2." with B as its full 40-hex SHA and C2 as its SHA gives no
  commit failure; so does "Compared with B at base; HEAD after commit: C2" with C2 abbreviated to its first 7 hex; and so does "Commit: C2; base: B", the base cited after; and so does a multi-line report with "Base commit: B" on
  one line and "Delivered revision: C2" on another (a line without "commit" or "HEAD"). Intent:
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
  C2 with HEAD moved to a commit of another branch that does not descend from B is refused naming both, and so is a
  report naming that unrelated HEAD itself, with otherwise valid events (an ancestry refusal naming it and B); a report naming
  an empty commit (`git commit --allow-empty` on top of B as HEAD) is refused. Intent: the repair loosened nothing else.
- **G6. Hashes that are not commits.** Outcome: a report naming C2 and also a 64-hex SHA-256 on a line with "HEAD" is
  accepted. Intent: a brief's hash cited beside the commit does not block it.
- **G7. A new milestone's first resume point.** Outcome: in a copy of the repository whose ledger names a new milestone
  with a packet and a handoff file that does not exist (its directory absent), `pnpm handoff:new --milestone <id>`
  exits 0 both with `--dir <a new directory>` and without it, the file exists and equals `docs/agent-context/HANDOFF_TEMPLATE.md`'s template block with the milestone substituted,
  apart from the As of line and the branch and SHA it fills, the ledger's
  `handoff` names it, and `pnpm context:show --milestone <id>` prints it; a second run changes only the As of line
  (byte compare otherwise), and a second run after you add distinctive lines to the file keeps them byte for byte
  apart from the As of line, with and without `--dir`; each refusal of the base still holds: an id not in the ledger ("Unknown active
  milestone"), a milestone without a packet, an invalid packet, and `--dir` naming a file. Intent:
  opening a milestone needs no hand-made file.
- **G8. The repair proven, nothing weakened.** Outcome: run from the result's test files on `c286c4c9`'s production
  code, every case added since `c286c4c9` fails at an assertion on its outcome, never at a missing module, export,
  helper, fixture or setup (list each case and what it asserts), and passes unchanged on the result, inside the fast
  ladder's unit-test run the events record; `git diff --name-only c286c4c9 HEAD` is exactly
  `scripts/agent-environment/codex-round.mjs`, `codex-round.test.ts`, `new-handoff.mjs` and `new-handoff.test.ts` (with
  `resume-point.mjs` allowed); no test present at `c286c4c9` is removed, skipped, made conditional or lost an assertion,
  and no existing assertion's predicate or expected value changed; list each pre-existing test body that changed and
  judge it, and every changed shared helper, setup, mock or fixture builder those tests use: a mechanical adaptation
  (an import, a helper's name) passes, a change that reduces the production behaviour the original assertions exercise,
  or a change to its setup, mocks, fixtures or
  control flow fails unless a W outcome required it.
  Intent: the cases see the defects and nothing was loosened to pass.
- **G9. Report against commands.** Outcome: your HEAD is the result; the two rounds' run folders
  (`D:/fitway-temp/codex-round-c7addb2e-0a77-44df-be1a-eba8a1a3fe8d/` and
  `D:/fitway-temp/codex-round-63f07391-335b-4dd8-9d6d-e1d9386c7893/`) each record a successful `git commit` and a
  `node scripts/verify.mjs fast` run after it with exit 0 and no later commit; each run's last turn in `turns.jsonl`
  records that round's commit as its head (the second run's being your HEAD); each report's red runs appear in its
  events before its commit and name cases added by that round (say so, without SHAs).
- **G10. Graders are not refused (W1).** Outcome: with your own driver, a grading brief (its Scope without "commit once
  when done") whose report names the launch HEAD and says PASS on an outcome naming `verify.mjs fast`, with no commit
  or ladder in the events, gets no claim failure; the same report under an implementing brief is refused as at the
  base. Intent: graders are never pushed to commit.
- **G11. Real commands only (W2).** Outcome: in G1's scratch repository, events whose only commit is `echo git commit`
  (in a PowerShell `-Command` wrapper and a `bash -lc` wrapper), `git commit --dry-run`, or `git commit -m x || true`
  after a failed commit are refused; a real `git commit` whose output names a commit other than the HEAD is refused, including one whose
  subject line contains the HEAD's abbreviated SHA (the refusal must rest on the commit ID in Git's result header); a
  real commit naming the HEAD's abbreviated SHA in either wrapper is accepted, and so are a real `git -C <worktree>
  commit -m x` and a real `git commit -m "fix; tests"` (report each); the same for the ladder, with an echo of
  the ladder's command refused and `pnpm verify:fast` accepted. Intent: the record is what ran.
- **G12. One reason per refusal (W3).** Outcome: a report naming only the launch HEAD gets the same failure lines as at
  the base (compare the texts). Intent: no added line.
- **G13. Plain parts (W4, W5).** Outcome: `reportClaimFailures` and its helpers are each at most 60 lines (your own
  count); `new-handoff.test.ts` starts a process through one helper only (`git grep` there for every `node:child_process`
  API: `spawn`, `spawnSync`, `exec`, `execSync`, `execFile`, `execFileSync`, `fork`);
  `git diff --name-only` from the base to your HEAD lists only `codex-round.mjs`, `codex-round.test.ts`,
  `new-handoff.mjs` and `new-handoff.test.ts` under `scripts/agent-environment/` (with `resume-point.mjs` allowed).
  Intent: the fix kept scope and shape. Intent: the report
  rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-launcher-fixes-6-fix-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of G1-G13 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
