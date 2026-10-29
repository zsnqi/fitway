<!-- brief-format: v1 role: codex -->
# Codex brief: grade the ratchet with its fix by running these checks (agent-tooling-r01, ratchet-grade)

- **Worktree:** `D:/fitway-temp/tooling-ratchet-grade/wt`, branch `grade-ratchet`, HEAD `b3946bc3`
- **Milestone:** `agent-tooling-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 2, 5, 6 and 8.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet.md` and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-fix.md`, whole: the two briefs of the result you grade (H1-H6, then K1-K6, then three review edits by a fixer in the last commit); your contract is G1-G14 below;
  - `scripts/agent-environment/code-health-baseline.mjs` and `scripts/agent-environment/check-code-health.mjs`, whole (the exception form is the one `scripts/agent-environment/code-health-baseline.mjs` parses);
  - `docs/agent-context/README.md`, its line naming `docs/agent-context/CODE_HEALTH_BASELINE.json`.

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
  `D:/fitway-temp/tooling-ratchet-grade/`. The ratchet's base is `fcc8365b`; its commit `7c28d15a`; `e115f646` merges
  a launcher fix into it and lowers one baseline entry; the fix's commit `3f80f091`; the fixer's commit is the result
  HEAD. A **scratch copy** is a fresh `git clone` of the result HEAD into your temp folder (the worktree's repository
  holds every commit this brief names). The check's root is its working directory: run the worktree's
  `node D:/fitway-temp/tooling-ratchet-grade/wt/scripts/agent-environment/check-code-health.mjs` (or
  `code-health-baseline.mjs`) with the scratch copy as the working directory, or give the copy its own
  `pnpm install --frozen-lockfile --offline`; never link this worktree's `node_modules` (DECISIONS item 8). A copy of
  older history is taken with `git archive` outside every git tree; check each copied file against `git show <commit>:`
  before using it. The worktree has its own install; run single test files, not the whole ladder; the coordinator's CI
  run on the result decides the ladder. Start no preview, compare or Codex process. Make no commit outside your
  scratch copies.

## Goal

The coordinator knows, row by row, whether the delivered ratchet holds on checks its own runs did not make.

## Causes and required outcomes

- **G1. The baseline, written once (H1).** Outcome: `pnpm code-health:baseline` run twice in the worktree leaves
  `docs/agent-context/CODE_HEALTH_BASELINE.json` byte-identical to the committed file (report its SHA-256 each time and
  `git status --short`); a fresh clone of the result HEAD made with `core.autocrlf=true` regenerates it byte-identical;
  the files the baseline command scans equal `git ls-files` under `scripts/`, `.agents/skills/`, `apps/` and
  `packages/` filtered to `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.css` and `.html` (report both counts and every
  difference), and every file the baseline lists is among them; no count and no giant file's line count in the result's
  baseline is above its value in `7c28d15a`'s baseline (list every rise and every file new to the baseline; a rise is a
  FAIL); in a scratch copy, a new
  `.cjs` file and a new `.tsx` file, each planted with a suppression, a `TODO` marker, an 85-line function and a
  12-line block copied from an existing file (and the `.tsx` one with `as any`), make the baseline command exit
  non-zero naming each planted file with each planted measure, and leave the baseline unchanged (a rise goes through
  an exception, never a rewrite); with one planted rise, the command still refuses it after the working baseline file
  is deleted, and after it is edited to hold the raised count (H1 names the committed baseline).
  Intent: the debt that exists is written down once, the same everywhere.
- **G2. The ladder holds the line (H2, HR1, HR2, HR5).** Outcome: in scratch copies, one plant each on a clean copy,
  the check exits 1 and its output names the file, the measure, the baseline, the current count, the hits' lines and
  `run pnpm code-health:baseline`: a 12-line block copied from an existing file into a new file under
  `scripts/agent-environment/` (duplication); `as any` added to a file under `apps/web/src` (type escapes); a
  `biome-ignore` comment added to a file (suppressions); a `TODO` marker added (repeated workarounds); an 85-line
  function added to an existing file (long functions); one line added to `scripts/agent-environment/codex-round.mjs`
  (giant-file growth, both line counts named); a third copy, in the same file, of a block that file already counts as
  duplicated (its count rises); the same line added to a file under 800 lines passes. The committed
  `scripts/verify.mjs` runs `pnpm check:code-health` in `fast` with no condition that can skip it (quote the lines).
  Intent: debt cannot rise unseen.
- **G3. Only tightening (H2, HR3).** Outcome: in a scratch copy, deleting one of a listed file's duplicate blocks
  without rewriting the baseline makes the check exit 1 naming the lower count; after `code-health:baseline` it passes
  and that file's entry fell; the same for a listed long function shortened below 81 lines. Intent: a fall is
  committed with the change that earned it.
- **G4. Duplicates of the size agents make (H3, HR8).** Outcome: with the result's scanner, the duplication count of
  `scripts/agent-environment/codex-round.test.ts` at `f2418199` is above its count at `51bf35d9` and at `18c670fc`
  (report all three); for every file both the gardener's code-health collection (`collectCodeHealth`, which the
  gardener's report calls) and the ratchet scan at the result HEAD, the two give the same per-file count of every
  baseline measure (report the number of files compared, how many have a non-zero count, every difference, and the
  function both reach). Intent: one counting path sees copies of the size agents make.
- **G5. Real past cases (H4).** Outcome: in scratch copies of real history, the check with the parent's baseline fails
  on `codex-round.mjs` growing from `81eb36bb` to `42ce5333` (giant-file growth, 2,208 to 2,323 lines) and on
  `f2418199`'s duplicated body against `51bf35d9`'s baseline, naming each; report both outputs and how you built each
  baseline. Intent: each check is proven on a case that happened.
- **G6. Exceptions (H5, K3, HR4, HR11).** Outcome: in a scratch copy, with a planted hit each: an exception dated
  yesterday fails naming its line; one dated next month passes and `pnpm check:code-health --exceptions` lists it with
  file, line, measure, reason and date; one dated 91 days ahead is a finding; dates `2026-02-30` and `2026-2-3`, an
  empty reason and a missing reason are each a finding naming its line; an excepted hit is not counted while its date
  holds. Intent: a deliberate exception is visible and ends.
- **G7. One ring, declared once (H6, K1, K2, HR7, HR9, HR10).** Outcome: `node scripts/check-concept-css.mjs` on
  `design-research/owner-composition-exploration-r04/directions/eclipse/` taken from `f87906ea` reports at least ten
  focus-ring findings in `components.css` (count them), and from `9619f3ce` and from `4cc2db93` passes (quote the
  lines); report its result from `51d5a783` too, without judging it. In scratch concept copies: a focus rule outside
  `style.css` drawn with `outline-width`, `outline-style` and `outline-color` longhands is a finding; so is the same
  ring split across two rules with the same focus selector, and one mixing the shorthand with a longhand; a copy
  without `style.css` reports the missing ring as a finding; a file named `x-style.css`, or a `style.css` in a
  subfolder, does not stand in for it; a second ring declared in `style.css` is a finding. Intent: one ring, kept that
  way.
- **G8. Template substitutions (K4, HR12).** Outcome: in a scratch copy, an 85-line arrow function inside a template
  literal's `${...}` counts as a long function, and a suppression marker, a `TODO` comment and (in a `.ts` file)
  `as any` inside a `${...}` each count; the same marker in the template's own text does not.
  Intent: code inside a template is code.
- **G9. One source of truth (K5, review edit 1).** Outcome: `git grep` over `scripts/` and `.agents/skills/` shows each
  measure's name declared once and the file extensions once, in the gardener's scanner modules, with no list of either
  in `code-health-baseline.mjs` or `check-code-health.mjs` (quote the grep lines; `tooling-map-parser.mjs`'s own set is
  out of scope); `scanSource` takes no extension parameter; neither of those two files holds a threshold, window or
  line normalization of its own (grep for the 800-line, 80-line and duplication-window values and quote the lines).
  Intent: the gardener and the ratchet cannot disagree.
- **G10. Plain parts (K6, review edits 2 and 3).** Outcome: every function `3f80f091` or the result HEAD added or
  changed is at most 80 lines (your own count, listed by file and name); the focus-ring collection is outside
  `lintSources`, the long-function scan and the comment scan outside `script`; the ratchet test's table rows share one
  fixture and vary only the planted measure; `DUPLICATION_WINDOW_LINES` is not exported unless a runtime module reads
  it; `scripts/check-concept-css.mjs` is at most 800 lines as the ratchet counts them. Intent: the ratchet is as plain
  as the code it polices.
- **G11. The fix's cases prove it (ratchet-fix L0).** Outcome: run from the result's test files on `e115f646`'s
  production code (`git archive` of `e115f646` with the result's test files over it, made a git repository with one
  commit and given its own `pnpm install --frozen-lockfile --offline`), every case `3f80f091` added
  fails at an assertion on its K outcome, never at a missing module, export, helper, fixture or setup (list each case,
  its K row and what it asserts), and every such case passes on the result. Intent: the cases see the defects.
- **G12. Nothing weakened (L1 of both briefs).** Outcome: across `git diff fcc8365b HEAD` and `git diff e115f646 HEAD`,
  no test present at `fcc8365b` or at `e115f646` is removed, skipped, made conditional or lost an assertion, and no
  existing assertion's predicate or expected value changed; list each pre-existing test body that changed, and every
  changed fixture, helper or setup those tests use, and judge each (a mechanical adaptation passes; a change that
  reduces what the original assertions exercise fails); no commit since `fcc8365b` changes `.github/`, a
  `vitest*.config.*` file, `scripts/run-vitest.mjs` or a test glob, and each commit's `git diff --name-only` lies
  within its brief's Scope (`e115f646` brings the launcher fix's files from its merge); `parseFastSteps`
  (`.agents/skills/gardener/facts.mjs`) on the committed `scripts/verify.mjs` returns `fcc8365b`'s steps plus the
  code-health step, order kept (report both lists); the gardener's collection keeps its measures (list them at
  `fcc8365b` and at the result), the long-function measure added. Intent: nothing was loosened to pass.
- **G13. Cost and place (L3, L4).** Outcome: three runs of `pnpm check:code-health` in the worktree each take at most
  15 s (report each, the median and range); the baseline is at most 100 KB; `package.json`'s dependency sections and
  `pnpm-lock.yaml` are unchanged since `fcc8365b`; `docs/agent-context/README.md` names the baseline file and both
  commands in one line. Intent: the step is cheap and findable.
- **G14. Reports against commands.** Outcome: the fix's run folder
  `D:/fitway-temp/codex-round-3911ed9e-70c8-440e-960b-77c265e16d07/` records a successful `git commit` whose result
  header names `3f80f091` and a successful `node scripts/verify.mjs fast` after it with no later commit, and no event
  between that commit and the ladder's start writes a tracked file (the tree the ladder ran on is the commit's). The
  ratchet's
  run folder `D:/fitway-temp/codex-round-c8aa5fb0-1f2a-4231-80f0-7c783796af3b/` re-committed one tree under a launcher
  defect (its `turns.jsonl` ends at `7c28d15a` on a resume limit): show that the commit its last successful
  `node scripts/verify.mjs fast` ran after has the same tree as `7c28d15a` (`git rev-parse <commit>^{tree}`) and that no
  later event changed a tracked file. Each report's red runs appear in its events before its commit (say which
  cases). The result
  HEAD lies outside any run: its parent is `3f80f091`, and it changes no test file and no file outside
  `.agents/skills/gardener/code-health-source.mjs`, `.agents/skills/gardener/code-health.mjs`,
  `scripts/agent-environment/code-health-baseline.mjs`, `scripts/check-concept-css.mjs`,
  `docs/agent-context/CODE_HEALTH_BASELINE.json` and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (quote
  `git diff --name-only`). Intent: the reports rest on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C D:/fitway-temp/tooling-ratchet-grade/wt status --short` is empty at the
  end, and no commit is made there.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-ratchet-grade/`. Add no dependencies.
If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G14 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
