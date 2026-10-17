<!-- brief-format: v1 role: codex -->
# Codex brief: the ratchet's grade findings: the committed baseline, every copy counted, one line count, one ring counted once (agent-tooling-r01, ratchet-fix-2)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-ratchet`, branch `tooling-ratchet`, HEAD `b3946bc3`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5, 6, 7 and 8 of `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet.md` and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-fix.md`, whole: the rounds this fixes; their outcomes and limits still hold;
  - `D:/fitway-temp/codex-round-f73f808c-d927-474f-a8bb-facc8041863f/last-message.md`, its G1, G2, G4 and G7 sections: the grade's measurements;
  - `scripts/agent-environment/code-health-baseline.mjs`, `.agents/skills/gardener/code-health.mjs`, `.agents/skills/gardener/code-health-duplication.mjs`, whole; `.agents/skills/gardener/survey.mjs`, its `git` (which trims every output it returns, for many callers) and `collectSurveyCodeHealth`; `scripts/check-concept-css.mjs`, its focus-ring helpers (`createFocusRingAnalyzer`, `collectFocusRingFindings`).

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
  with no other branch: every test you add passes there, with no file outside the repository and no other commit.
- **Your temp folder** is `D:/fitway-temp/tooling-ratchet/fix-2/`. Start no preview, compare or Codex process of your
  own. Another round runs on this machine: if `scripts/check-agent-context.test.ts` K1 or a verify-fitway test times
  out or fails in the fast ladder (F261), rerun that file alone once and report both runs; the coordinator's CI run on
  your commit decides L2. Link no `node_modules` between folders (DECISIONS item 8); this worktree has its own install.
  A fresh `git clone` of this repository needs `-c core.longpaths=true` (F268).
- **Real history** for N4 and L1 is read with `git archive` into your temp folder, outside every git tree; the
  concept's commits are on branch `owner-followup-r04-build`.
- **Commit once, plainly.** Make one commit for this round with `git commit -m "<message>"`; never `git reset`,
  amend or rewrite commits. If the launcher refuses your report, report the refusal as it stands instead of
  re-committing.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)
- **The ratchet holds you too.** `pnpm check:code-health` runs in the ladder: a count your change lowers is written
  into the baseline with `pnpm code-health:baseline` in the same commit; nothing you add may raise one, apart from
  N2's one rewrite.

## Goal

The ratchet cannot be talked past: it compares with what is committed, sees every added copy, counts lines as the
gardener does, and passes the concept that declares its ring once.

## Causes and required outcomes

- **N1. The committed baseline (grade G1).**
  - **Cause (measured by the grade).** With one planted `as any`, `code-health:baseline` refuses
    (`typeEscapes baseline=0 current=1`), but after the working baseline file is deleted, or edited to hold the raised
    count, it exits 0 and writes `215 files`: it compares with the working file, while H1 names the committed one.
  - **Outcome.** The command compares a rise with the baseline committed at `HEAD` (`git show HEAD:<path>`), whatever
    the working file holds or whether it exists; it writes a first baseline only when `HEAD` has none. Tested with the
    working file deleted and with it inflated.
  - **Intent.** A rise goes through an exception, never a rewrite.
- **N2. Every copy counted (grade G2).**
  - **Cause (measured by the grade).** A third copy, in `.agents/skills/gardener/code-health.test.ts`, of an eight-line
    block that file already shares (places 534 and 547, then 534, 547 and 607) leaves its duplication count at 1 and
    the check passing: a file's count is the number of duplicated blocks it takes part in, not its copies of them.
  - **Outcome.** A file's duplication count is the number of copies of duplicated blocks it holds, so a further copy of
    a block, in the same file or another, raises the count of the file that holds it; the gardener's report and the
    ratchet count it through the same function. The committed baseline is rewritten once in this commit under the new
    count, the one rewrite this measure's change allows: write it with a script in your temp folder that calls the
    modules' own functions, and report the duplication total before and after, the three files whose counts rose most,
    and that no other measure's count changed. Tested with a third copy in one file and a second in another.
  - **Intent.** Copying a block again is never free.
- **N3. One line count (grade G4).**
  - **Cause (measured by the grade).** For the 17 giant files both scan, the gardener's report gives one line fewer than
    the ratchet (for example `codex-round.mjs` 2316 against 2317): the report's Git reader trims the text's end, and the
    ratchet counts the empty piece after a final newline.
  - **Outcome.** The ratchet and the gardener's report read a file's text and count its lines through one path, a
    file that ends in a newline counting as many lines as `wc -l` reports; for every file both scan, their per-file
    counts of every measure are equal when they scan the same set of files (the two scopes' different roots stay). The
    giant-file counts that fall are written with `pnpm code-health:baseline`. Tested with a file with and without a
    final newline, LF and CRLF.
  - **Intent.** One counting path, one answer.
- **N4. One ring counted once (grade G7, F267).**
  - **Cause (measured by the grade and the coordinator).** At `9619f3ce` the eclipse concept's `style.css` declares
    its ring once, in one rule with many selectors and `outline` plus `outline-offset` (lines 92-101), yet
    `scripts/check-concept-css.mjs` reports `style.css:99: focus-ring: expected one focus-ring declaration in
    style.css; found 3`; `4cc2db93` and `51d5a783` fail the same way, and at `f87906ea` each of the ten copies in
    `components.css` is reported twice. K1's merge of longhands counts declarations, not rings.
  - **Outcome.** A focus ring is counted once however many `outline` properties (the shorthand, its longhands,
    `outline-offset`) and selectors its rule, or the rules K1 combines for one selector, carry: the eclipse folder from
    `9619f3ce`, `4cc2db93` and `51d5a783` passes, and from `f87906ea` reports exactly ten focus-ring findings in
    `components.css`, one per copy; K1's longhand cases and K2's cases still hold. Tested on fixtures in the
    repository that model those commits' rules.
  - **Intent.** One ring, declared once, passes.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (N1-N4), runs the public command
  (`pnpm check:code-health`'s or `code-health:baseline`'s entry, or `scripts/check-concept-css.mjs`) on a fixture,
  fails at this HEAD at an assertion on that outcome's behaviour (not at a missing helper, import or fixture), and
  passes unchanged on your result; the cases you commit are the ones you showed failing, and the fast ladder runs them.
  Report each failing output.
- **L1. The earlier outcomes.** H1-H6 and K1-K6 still hold: report each again with the command that shows it, H4's two
  real cases and H6 on the eclipse folder taken from `f87906ea`, `9619f3ce` and `4cc2db93` included; every test at this
  HEAD keeps its assertions and still runs, except an expected count N2 or N3 changes (name each, with before and
  after).
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, `pnpm check:code-health` passes,
  and `git status --short` is empty after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/code-health-baseline.mjs` (must change), `check-code-health.mjs` and their
test, `.agents/skills/gardener/code-health.mjs`, `code-health-source.mjs`, `code-health-duplication.mjs` (must
change), `survey.mjs` (its Git reader only, without growing the file) and their tests, `scripts/check-concept-css.mjs`
(must change) and its test, `docs/agent-context/CODE_HEALTH_BASELINE.json` (rewritten once for N2, then regenerated)
and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (regenerated); commit once when done. Everything else is read-only.
Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the baseline's totals
before and after; the files you changed; the commit SHA; anything you could not do; any hook message you did not act
on.
