<!-- brief-format: v1 role: codex -->
# Codex brief: the code-health ratchet: counts only fall, giant files never grow (agent-tooling-r01, ratchet)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-ratchet`, branch `tooling-ratchet`, HEAD `fcc8365b`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5, 6, 7 and 8 of `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`, item 6 (its bullet "The ratchet");
  - `.agents/skills/gardener/code-health.mjs` (`MEASURES`, `scanScope`, `collectCodeHealth`), `.agents/skills/gardener/code-health-source.mjs` and `.agents/skills/gardener/code-health-duplication.mjs`, whole;
  - `scripts/agent-environment/generate-tooling-map.mjs` and `scripts/agent-environment/tooling-map-parser.mjs`: the paved path for a generated, committed file with a check mode, and for callable ranges;
  - `scripts/verify.mjs`, its fast steps; `scripts/check-concept-css.mjs`, whole.

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


- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch: every test you add passes there, with no file outside the repository.
- **Your temp folder** is `D:/fitway-temp/tooling-ratchet/`. Start no preview, compare or Codex process of your own.
  Another round runs on this machine: if `scripts/check-agent-context.test.ts` K1 or a verify-fitway test times out in
  the fast ladder (F261), rerun that file alone once and report both runs; the coordinator's CI run on your commit
  decides L2. Link no `node_modules` between folders (DECISIONS item 8); this worktree has its own install.
- **Real history** for H3, H4 and H6 is read with `git archive` or `git show` into your temp folder, outside every git
  tree: the launcher's commits are on branch `tooling-launcher-fixes-6`, the concept's on `owner-r04-shared-lows`.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)

## Goal

A change cannot add duplicated code, type escapes, suppressions, overlong functions or lines to a giant file without
the fast ladder naming it, and every count the ladder holds only falls.

## Causes and required outcomes

- **H1. A committed baseline.**
  - **Cause (measured by the coordinator).** The gardener's scanner counts giant files, type escapes, suppressions,
    repeated workarounds and duplicate blocks, but only into its weekly report; nothing stops a change from adding to
    them. Its `scanScope` over the tracked sources of `scripts/`, `.agents/skills/`, `apps/` and `packages/` at this
    HEAD: 378 files, 29 over 800 lines, 60 type escapes in 22 files, 9 suppressions in 3 files, 214 duplicate blocks in
    89 files, in about 1.1 s. Of the 30 blocking findings the day's 9 diff reviews raised, 18 were duplicated code or a
    second path.
  - **Outcome.** One command (`pnpm code-health:baseline`) writes a committed baseline under `docs/agent-context/` that
    holds, for every tracked source file (`.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.css`, `.html`) under those four roots, its count of each measure that is not zero: duplicate
    blocks it takes part in, type escapes, suppressions, repeated workarounds, and functions longer than 80 lines (a new
    measure, counted from the callable ranges `tooling-map-parser.mjs` already finds); and, for a file over the
    giant-file size, its line count. The ratchet and the gardener's report count through the same functions. Two runs
    give byte-identical files whatever the checkout's line endings.
  - **Intent.** The debt that exists is written down once.
- **H2. The ladder holds the line.**
  - **Outcome.** A fast-ladder step runs `pnpm check:code-health` (an ordinary step, as the code map's) and fails when
    a file's count of a measure is above its baseline (a file the baseline does not list has zero), or a file over the
    giant-file size has more lines than its baseline, printing for each the file, the measure, the baseline and the
    current count, the hits' lines, and `run pnpm code-health:baseline`; it fails too when a count is below its baseline,
    naming it, so the baseline only tightens and the lower count is committed with the change that earned it. It
    passes on your committed tree. Tested in scratch copies with a plant for each measure, a new file, a giant file
    one line longer, and a count that falls without the baseline.
  - **Intent.** Debt only falls.
- **H3. Duplicates the size agents make.**
  - **Cause (measured by the coordinator).** The duplicate window is 10 identical lines. launcher-fixes-6-fix-3 added
    two `it.each` tables with the same body to `scripts/agent-environment/codex-round.test.ts` at `f2418199` (the diff
    review's finding, merged into one table at `18c670fc`); `scanScope` counts 6 duplicate blocks in that file at
    `51bf35d9`, at `f2418199` and at `18c670fc` alike.
  - **Outcome.** The duplication measure counts that body: the file's count at `f2418199` is above its count at
    `51bf35d9` and at `18c670fc`, with the window and line normalization you choose, applied to the gardener's report
    as well. Report the four roots' duplicate total at today's setting and at yours.
  - **Intent.** The check sees copies of the size agents make.
- **H4. Proven on real past cases.**
  - **Outcome.** In scratch copies of real history, the check with the parent's baseline fails (a) on
    `scripts/agent-environment/codex-round.mjs` growing from `81eb36bb` to `42ce5333` (2,208 to 2,323 lines; giant-file
    growth) and (b) on `f2418199`'s duplicated body against `51bf35d9`'s baseline, naming each. Report both outputs.
  - **Intent.** Each check is proven on a case that happened (DECISIONS item 6).
- **H5. Exceptions with a reason and an end.**
  - **Outcome.** A hit can carry an exception on its own line, naming the measure, a reason and an expiry date, in one
    form; an excepted hit is not counted until its date, after which the check fails naming the line; `pnpm
    check:code-health --exceptions` lists every open exception with its file, line, measure, reason and date. Tested.
  - **Intent.** A deliberate exception is visible and ends.
- **H6. The concept's ring is declared once.**
  - **Cause (measured by a diff review and confirmed by the coordinator).** The concept's `components.css` carried ten
    copies of the focus ring outside `style.css` at `f87906ea` until a fixer moved them into the shared rule at
    `9619f3ce`.
  - **Outcome.** `scripts/check-concept-css.mjs` reports a finding for each focus-ring declaration outside the
    concept's `style.css`: an outline with a width, a style and a colour that is not transparent, under a focus
    selector or a specimen's focus class; the folder `design-research/owner-composition-exploration-r04/directions/eclipse/`
    fails at `f87906ea` with those copies named and passes at `9619f3ce` and `4cc2db93`. Tested.
  - **Intent.** One ring, declared once, kept that way.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (H1-H6), fails at this HEAD at an
  assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your
  result; the cases you commit are the ones you showed failing, and the fast ladder runs them. Report each failing
  output.
- **L1. Today's behaviour elsewhere.** Every test at this HEAD keeps its assertions and still runs; the ladder's steps
  keep their order, commands and environment, with the new step added; `parseFastSteps` on the committed
  `scripts/verify.mjs` returns today's nine steps plus the new one (report both lists); the gardener's report keeps its
  measures, with only H3 changing its duplicate counts.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.
- **L3. Cost.** The new step takes at most 15 s on this machine (three runs, median and range); the baseline is at
  most 100 KB; no dependency is added.
- **L4. Where it is found.** `docs/agent-context/README.md` names the baseline file and both commands in one line.

## Scope

You may change `.agents/skills/gardener/code-health.mjs`, `code-health-source.mjs`, `code-health-duplication.mjs` and
their tests, `scripts/verify.mjs` (must change: the step), `package.json` (its `scripts` section only),
`scripts/check-concept-css.mjs` (must change) and its test, `docs/agent-context/README.md` (must change), and
`docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (regenerated); add the baseline command, its check and their test under
`scripts/agent-environment/`, and the baseline under `docs/agent-context/`; change `.agents/skills/gardener/facts.mjs`
only if `parseFastSteps` needs it. Commit once when done. Everything else is read-only; `apps/` and `packages/` are
read, never changed. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the baseline's totals per
measure and root; the files you changed; the commit SHA; anything you could not do; any hook message you did not act
on.
