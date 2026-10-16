<!-- brief-format: v1 role: codex -->
# Codex brief: the ratchet's review findings: rings in longhand, strict exceptions, template functions, one source of truth (agent-tooling-r01, ratchet-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-ratchet`, branch `tooling-ratchet`, HEAD `7c28d15a`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5, 6, 7 and 8 of `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet.md`, whole: the round this fixes; its outcomes and limits still hold;
  - `D:/fitway-temp/code-review/ratchet-1/last.md`, whole: the diff review's nine findings;
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/agent-context/briefs/CODE_REVIEW.md`, §"The two axes";
  - `scripts/agent-environment/code-health-baseline.mjs`, `.agents/skills/gardener/code-health-source.mjs`, `.agents/skills/gardener/code-health-duplication.mjs` and `scripts/check-concept-css.mjs` (its `lintSources` and the focus-ring helpers), whole.

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
  Another round runs on this machine: if `scripts/check-agent-context.test.ts` K1 or a verify-fitway test times out or
  fails in the fast ladder (F261), rerun that file alone once and report both runs; the coordinator's CI run on your
  commit decides L2. Link no `node_modules` between folders (DECISIONS item 8); this worktree has its own install.
- **Commit once, plainly.** Make one commit for this round with `git commit -m "<message>"`; never `git reset`,
  amend or rewrite commits. The launcher reads Git's result header from the commit's output; if it refuses your
  report, report the refusal as it stands instead of re-committing.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)
- **The ratchet holds you too.** `pnpm check:code-health` runs in the ladder: a count your change lowers is written
  into the baseline with `pnpm code-health:baseline` in the same commit; nothing you add may raise one.

## Goal

The ratchet's checks catch every form of what they name, its parts are as plain as the code it polices, and the
gardener and the ratchet count from one source.

## Causes and required outcomes

- **K1. A ring written in longhand (review 1).** Outcome: a focus rule outside the concept's `style.css` that draws
  the ring through `outline-width`, `outline-style` and `outline-color` longhands (in any mix with the shorthand), the
  declarations combined over every rule with the same focus selector, is a finding, as the shorthand is. Tested, a
  split across two rules included.
- **K2. A concept without `style.css` (review 2).** Outcome: the ring check names the concept folder's own
  `style.css` by its exact path, runs when that file is missing, and reports the missing ring as a finding; a file
  that only ends in `style.css`, or one in a subfolder, does not stand in for it. Tested with both.
- **K3. Strict exceptions (review 3).** Outcome: the exception marker is found first and its fields read after, so
  an exception whose date is not a real calendar date (for example `2026-02-30` or `2026-2-3`) or whose reason is
  empty or missing is a finding naming its line. Tested.
- **K4. Template substitutions (review 4).** Outcome: only a template literal's own text is masked; its `${...}`
  substitutions are scanned for every measure, so a long function or a suppression marker inside one counts. Tested
  with both.
- **K5. One source of truth (review 5).** Outcome: the measure names and file extensions are declared once, in the
  gardener's scanner, and both the scanner's own dispatch and the baseline's counting and validation read them there;
  neither holds a list of its own (`git grep` shows it).
- **K6. Plain parts (reviews 6, 7, 8, 9).** Outcome: the focus-ring collection and validation leave `lintSources` for
  a helper of their own; the AST long-function scan and its line accounting leave `script` for a helper of their own;
  the ratchet test's table rows share one clean fixture and vary only the planted measure; `DUPLICATION_WINDOW_LINES`
  is private unless another runtime module (not a test) reads it. No function you touch exceeds 80 lines.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (K1-K4), runs the public command
  (`scripts/check-concept-css.mjs` or `pnpm check:code-health`'s entry) on a fixture, fails at this HEAD at an
  assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your
  result; the cases you commit are the ones you showed failing, and the fast ladder runs them. Report each failing
  output.
- **L1. The earlier outcomes.** H1-H6 and every limit of `codex-ratchet.md` still hold (report each again, H4's two
  real cases included); every test at this HEAD keeps its assertions and still runs.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, `pnpm check:code-health` passes,
  and `git status --short` is empty after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/code-health-baseline.mjs` (must change), its check and test,
`.agents/skills/gardener/code-health-source.mjs` (must change), `code-health-duplication.mjs`, `code-health.mjs` and
their tests, `scripts/check-concept-css.mjs` (must change) and its test, `docs/agent-context/CODE_HEALTH_BASELINE.json`
(regenerated) and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (regenerated); commit once when done. Everything else
is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others,
then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the baseline's totals
before and after; the files you changed; the commit SHA; anything you could not do; any hook message you did not act
on.
