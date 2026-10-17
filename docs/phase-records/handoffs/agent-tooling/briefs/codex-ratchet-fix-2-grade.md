<!-- brief-format: v1 role: codex -->
# Codex brief: grade ratchet-fix-2 by running these checks (agent-tooling-r01, ratchet-fix-2-grade)

- **Worktree:** `D:/fitway-temp/tooling-ratchet-fix-2-grade/wt`, branch `grade-ratchet-fix-2`, HEAD `6ca46c2e`
- **Milestone:** `agent-tooling-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 2, 5, 6 and 8.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-fix-2.md`, whole: the brief of the result you grade (N1-N4, then four review edits by a fixer in the last commit); your contract is P1-P8 below;
  - `D:/fitway-temp/codex-round-f73f808c-d927-474f-a8bb-facc8041863f/last-message.md`, its G1, G2, G4 and G7 sections: the earlier grade's probes, which you may reuse;
  - `scripts/agent-environment/code-health-baseline.mjs` and `.agents/skills/gardener/code-health-duplication.mjs`, whole.

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
- **This round grades; it fixes nothing.** Keep scripts, scratch copies, plants and logs in
  `D:/fitway-temp/tooling-ratchet-fix-2-grade/`. The round's base is `b3946bc3`; its commits `204ed1dc`, `42fd405a`
  and `4ed45355`; the fixer's commit is the result HEAD. A **scratch copy** is a fresh `git clone -c
  core.longpaths=true` of the result HEAD into your temp folder (F268; the worktree's repository holds every commit
  this brief names). The check's root is its working directory: run the worktree's
  `node D:/fitway-temp/tooling-ratchet-fix-2-grade/wt/scripts/agent-environment/check-code-health.mjs` (or
  `code-health-baseline.mjs`, or `scripts/check-concept-css.mjs`) with the scratch copy as the working directory, or
  give the copy its own `pnpm install --frozen-lockfile --offline`; never link this worktree's `node_modules`
  (DECISIONS item 8). Older history is taken with `git archive` outside every git tree; check each copied file against
  `git show <commit>:` before using it. The worktree has its own install; run single test files, not the whole ladder;
  the coordinator's CI run on the result decides the ladder. Start no preview, compare or Codex process. Make no commit
  outside your scratch copies.

## Goal

The coordinator knows, row by row, whether the delivered fix holds on checks its own run did not make.

## Causes and required outcomes

- **P1. The committed baseline (N1, HR13, HR14).** Outcome: in scratch copies with one planted `as any`: with the
  working baseline deleted, replaced by `{}`, or edited to hold the raised count, `pnpm code-health:baseline` exits
  non-zero naming `typeEscapes` and leaves the working file byte-identical to how you left it; `pnpm check:code-health`
  with the working baseline edited to a count above `HEAD`'s fails naming each raised count; in a scratch repository
  whose `HEAD` holds no baseline, the command writes one and exits 0; with the working baseline deleted, a planted rise
  of each other measure (a suppression, a `TODO`, an 85-line function, a copied 12-line block, one line added to a giant
  file) is refused naming that measure; with `git show HEAD:<baseline path>` failing for a reason other than the
  path's absence at `HEAD` (for example run where no git repository is, or with the baseline's object made unreadable),
  the command exits non-zero and leaves the working baseline unchanged (report what it prints). Intent: a rise goes
  through an exception.
- **P2. Every copy counted (N2, HR15).** Outcome: in scratch copies: a third copy, then a fourth, of a block a file
  already holds twice raises that file's duplication count each time; a second copy in another file raises that
  file's; a copy differing only by inserted blank lines counts, and so does one differing only by indentation or
  trailing whitespace; each of these additions, made alone on a clean copy, makes `pnpm check:code-health` exit 1
  naming that file's duplication; an exception on one copy exempts that copy only (the file's count with the exception
  equals its count with that copy removed). Recompute the conversion yourself: run the
  result's counting over a `git archive` of `b3946bc3` (all four roots) and compare per file and measure with the
  result's committed baseline; every difference is a fall the result's own changes earn (list each) or N3's giant-file
  fall of one; a count above the conversion is a FAIL; outside duplication and giant files no count differs from
  `b3946bc3`'s baseline. Intent: copying a block again is never free, and the rewrite holds no new debt.
- **P3. One line count (N3, HR8, HR16, HR18).** Outcome: the ratchet's giant-file count equals `wc -l` for
  `scripts/agent-environment/codex-round.mjs`, for a CRLF copy of it, for a copy with three trailing blank lines, and
  equals `wc -l` plus one for a copy without its final line break; the gardener's `collectSurveyCodeHealth` and the
  ratchet give equal per-file counts of every measure for every file both scan, on a scope of
  `scripts/agent-environment/` alone and on the gardener's configured scope (report the files compared and every
  difference); the survey's other uses of its `git` reader still get trimmed text: the gardener's test files pass
  (list them and their counts). Intent: one counting path, one answer.
- **P4. One ring counted once (N4, HR7, HR9, HR10, HR17).** Outcome: `scripts/check-concept-css.mjs` on the eclipse
  folder taken from `9619f3ce`, `4cc2db93` and `51d5a783` passes (quote each PASS line), and from `f87906ea` reports
  exactly ten focus-ring findings in `components.css`, one per copy; in scratch concept copies taken from `51d5a783`:
  adding `outline-width: 3px` to `style.css`'s shared ring rule passes; a second rule in `style.css` drawing its own
  ring under another focus selector fails; the shared ring's selector given a second ring under a different `@media`
  condition in `style.css` fails as a second ring; a `components.css` rule drawing a ring under the shared ring's exact
  selector is reported; a ring in longhands outside `style.css` is reported; a copy without `style.css` reports the
  missing ring. Intent: one ring, declared once, passes; every other ring is named.
- **P5. The cases prove the repair (L0).** Outcome: run from the result's test files on `b3946bc3`'s production code
  (`git archive` of `b3946bc3` with the result's test files over it, made a git repository with one commit and given
  its own `pnpm install --frozen-lockfile --offline`), every case the round added fails at an assertion on its N
  outcome, never at a missing module, export, helper, fixture or setup (list each case, its N row and what it
  asserts), and passes on the result. Intent: the cases see the defects.
- **P6. Nothing weakened (L1).** Outcome: across `git diff b3946bc3 HEAD`, no test is removed, skipped, made
  conditional or lost an assertion; every changed test body, matcher, input, fixture, helper and expected value is
  listed with before and after; a change that weakens what a test exercises (a weaker matcher, a narrowed input or
  fixture, an expected value changed for any reason other than N2's or N3's counting or a field the fix added, such as
  each copy's `endLine`) is a FAIL; the earlier grade's PASS rows still hold on the result: rerun its G3 (a fall needs
  the baseline rewritten), G5 (H4's two real cases), G6 (exceptions), G8 (template substitutions) and G9 (one source
  of truth) probes and quote one proving line each. Intent: nothing was loosened to pass.
- **P7. Reports against commands (L2).** Outcome: the round's run folder records a successful `git commit` whose
  result header names its commit and a successful `node scripts/verify.mjs fast` after it with no later commit and no
  tracked write between them; the fixer's ladder log `D:/fitway-temp/tooling-ratchet/fixer-2/ladder.log` ends with the
  fast ladder passing without repository mutation on the result HEAD (quote it); the fixer's commit lies outside the
  run, its parent the round's last commit, and touches only the files
  `D:/fitway-temp/code-review/ratchet-fix-2-1/dispositions.md` names (quote `git diff --name-only`), and restores the
  six comments `42fd405a` deleted (quote each); `pnpm check:code-health` passes on the result;
  `scripts/check-concept-css.mjs` is at most 800 lines by the result's count. Intent: the report rests on what ran.
- **P8. Cost.** Outcome: three runs of `pnpm check:code-health` take at most 15 s each (each, median, range); the
  baseline is at most 100 KB. Intent: the step stays cheap.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C D:/fitway-temp/tooling-ratchet-fix-2-grade/wt status --short` is empty at
  the end, and no commit is made there.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-ratchet-fix-2-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of P1-P8 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
