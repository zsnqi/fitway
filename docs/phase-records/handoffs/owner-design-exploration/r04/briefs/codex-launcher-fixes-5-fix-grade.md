<!-- brief-format: v1 role: codex -->
# Codex brief: grade launcher-fixes-5-fix by running these checks (owner-design-exploration-r04, launcher-fixes-5-fix-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-launcher-fixes-5-grade/wt`, branch `grade-launcher-fixes-5`, HEAD `34065b3d`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 67 and 72 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-launcher-fixes-5.md`, whole, and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-launcher-fixes-5-fix.md`, whole: the two briefs of the result you grade (P1-P5 at `4964b95d`, T1-T5 on top); your contract is G1-G8 below;
  - `D:/fitway-temp/owner-r04-launcher-fixes-5-grade/grade.cjs` and `D:/fitway-temp/owner-r04-launcher-fixes-5-grade/supplement.cjs`, whole: the first grade's probes, which you may reuse.

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
- **This round grades; it fixes nothing.** Keep scripts, plants and logs in
  `D:/fitway-temp/owner-r04-launcher-fixes-5-fix-grade/`. The base launcher is the same files at `5b81b3b7`, taken
  with `git archive` outside every git tree. Run the launcher's review step and reading parser on copies only; start
  no real Codex round. The worktree's `node_modules` is a junction to the round's root install only, so run the
  launcher's test file, not the whole ladder; the coordinator's CI run on the result decides the ladder.

## Goal

The coordinator knows, row by row, whether the delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. Wrapped readings.** Outcome: `D:/fitway-temp/owner-r04-launcher-fixes-4-grade/g1-wrapped.md` with reading 5
  wrapped after `Gap:` reads as five; with reading 1 wrapped after `What goes wrong:` reads as five; with reading 2
  wrapped at a space inside its literal reading reads as five; each with the same reading text as unwrapped apart
  from the line break; reading 3's continuation indented two spaces reads as five; a blank line inside reading 3 is
  refused; `1. V1 literal reading;` then column-0 `V2 risk.` is refused. Intent: layout never decides.
- **G2. Empty parts.** Outcome: one-line readings whose "What goes wrong" part is `.`, `—`, `**`, `3` or `V2` are each
  refused, and `What goes wrong: the 3 ports` reads; `**1. V1**` followed by the bullets `Literal reading: x`,
  `What goes wrong: .` and `Change: z` is refused; the first grade's G2 rows (`supplement.log`) give the same results
  apart from the empty part, now refused. Intent: each part says something, in every form.
- **G3. Nothing lost.** Outcome: the `5b81b3b7` texts of the inline answers of "accepts bare numbered readings with
  indented bodies and lists" and "accepts readings after a multi-paragraph preface" read `2 [R1,L1]` with the result's
  parser; every fixture at `5b81b3b7` and every `last.md` under `D:/fitway-temp/brief-review/` that the base parser
  reads gives the same count, IDs and trimmed reading text with the result's parser (list each). Intent: no answer
  that read before is refused or changed.
- **G4. Bold ID headings.** Outcome: `D:/fitway-temp/brief-review/codex-vf-proofs-grade-1/last.md` reads as G9, G2,
  G3, G6, G7; the same with one reading's "What goes wrong" bullet removed is refused; six such readings are
  refused; `D:/fitway-temp/brief-review/codex-launcher-fixes-4-1-sol/last.md` gives its result with both parsers
  (report it). Intent: a complete answer headed by IDs is read.
- **G5. The claim checks and timeline kept.** Outcome: the first grade's G5, G6 and G7 probes (`grade.cjs claims`
  and `reportonly`) give the same results at `34065b3d` as they gave at `4964b95d`. Intent: the fix lost nothing.
- **G6. The repair proven.** Outcome: run from the result's test file on `5b81b3b7`'s production code, every case
  added since `5b81b3b7` except those the fix brief names as guards fails first at an assertion on its outcome, never
  at a check that a file exists or that a call did not throw, nor with `ENOENT`; list each case, its line and what it
  asserts. Intent: the cases see the defects.
- **G7. Limits.** Outcome: `git diff --stat 5b81b3b7 HEAD` lists only `REVIEW.md` (inside §"Prompt"),
  `codex-round.mjs`, `codex-round.test.ts` and fixtures under `scripts/agent-environment/fixtures/codex-round-reviews/`;
  no test present at `5b81b3b7` is removed, skipped or made conditional, none lost an assertion line, and no existing
  assertion's predicate or expected value changed apart from the `events*.jsonl` filter the coordinator accepted
  (list each pre-existing test or helper whose body changed, with the change); the test file's count is at least the
  base's. Intent: nothing was weakened to pass.
- **G8. Report against commands.** Outcome: the result's commit exists and is your HEAD; the round's run folder
  (`D:/fitway-temp/codex-round-cef21179-08e8-41aa-836e-66afd664cb18/`) records the `git commit` and a
  `node scripts/verify.mjs fast` run after it, with their exit statuses quoted from the events. Intent: the report
  rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change tracked files only temporarily, for a plant, and restore each before the next; everything you keep goes
in `D:/fitway-temp/owner-r04-launcher-fixes-5-fix-grade/`. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G8 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
