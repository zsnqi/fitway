<!-- brief-format: v1 role: builder -->
# Fixer brief: the code review's four blocking findings on round ci-speed (agent-tooling-r01)

For a fresh `owner-direction-fixer` (Sonnet). The targets are frozen; make exactly these edits.

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-ci-speed`, branch `tooling-ci-speed`, HEAD `a13bdca9`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` item 27.
- **Read first, only these:** `scripts/agent-environment/check-staged-giant-files.mjs` (all);
  `scripts/agent-environment/code-health-ratchet.mjs` lines 485-540; `scripts/agent-environment/codex-round-test-support.ts`
  lines 680-695 and 785-805; `scripts/agent-environment/codex-round-real-review-support.ts` (all);
  `scripts/agent-environment/codex-round-report-support.ts` (all); the call sites each outcome names.

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

## The decision

Round ci-speed split `codex-round.test.ts` into twenty files and taught the pre-commit hook to lower the code-health
baseline. Its diff review (GPT-6.1 Sol, `D:/fitway-temp/code-review-ci-speed-1/last.md`) found four blocking
findings; the coordinator checked each against the code and accepted all four
(`D:/fitway-temp/code-review-ci-speed-1/dispositions.md`).

## Causes and required outcomes

- **R1.** `touchedGiantChanges` in `check-staged-giant-files.mjs` (from line 113) rebuilds the change records that
  `compareCodeHealth` in `code-health-ratchet.mjs` already builds. Outcome: `touchedGiantChanges` is gone; its callers
  use `compareCodeHealth`'s result filtered to the staged paths and to the `giantFiles` and `giantDocuments` measures,
  mapping its field names where they differ. The hook's behaviour is unchanged: `check-staged-code-health.test.ts`
  and `check-staged-giant-files` tests pass as they do at `a13bdca9`.
- **R2.** Across the split test files, calls such as `expect(refused(f, result, "…")).toMatchObject({ status: 1 })`
  and `expect(reviewRefused(…)).toMatchObject(…)` repeat what the helper asserts. At `684342b1` the helpers returned
  nothing and were called bare. Outcome: every such call is the bare call again (`refused(f, result, "…");`), and
  `refused` and `reviewRefused` in `codex-round-test-support.ts` no longer return a value. Where a wrapper also checked
  something the helper does not (any field other than `status`), keep that check as its own `expect` on `result`.
- **R3.** The helper in `codex-round-real-review-support.ts` returns a summary recomputed from values it has just
  asserted, so its callers can assert them again. Outcome: the helper returns nothing, and its callers in
  `codex-round-real-review-parsing.test.ts` and `codex-round-real-review-parsing-rest.test.ts` call it bare, dropping
  only the assertions on the returned summary that repeat the helper's own. If a caller asserts a value the helper does
  not, move that one assertion into the helper.
- **R4.** `reportClaimFixture()` in `codex-round-report-support.ts` only renames module functions. Outcome: it is gone;
  `codex-round-report-descendants.test.ts`, `codex-round-report-evidence.test.ts` and
  `codex-round-shell-evidence.test.ts` import the functions they use directly, under their exported names.

## Limits

- The full test names stay exactly as they are: `pnpm exec vitest list --json=<run>/after.json` over
  `scripts/agent-environment/codex-round*.test.ts` gives the same multiset of names as
  `D:/fitway-temp/code-review-ci-speed-1/original-test-names.json` (262 names), the eight `skipIf` conditions stay,
  and no assertion that checks something the helpers do not is removed.
- Change nothing else: not `lefthook.yml`, not `check-pre-push.mjs`, not the document rules, not the brief.
- If a rename or removal changes `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`, regenerate it with
  `pnpm map:tooling`; never edit it by hand. `pnpm check:code-health` passes with no raised baseline.

## Verification

Run, from the worktree: the name comparison above (report the counts and any difference);
`pnpm exec vitest run --maxWorkers=3 scripts/agent-environment/check-staged-code-health.test.ts scripts/agent-environment/repository-document-rules.test.ts`
and the twenty `codex-round*.test.ts` files with `--maxWorkers=3` (report passed and total);
`pnpm check:repository`, `pnpm check:code-health`, `pnpm check:tooling-map`. Do not run the ladder and do not run
`lefthook`; CI runs the ladder on the push.

Commit once on `tooling-ci-speed` with the message `fix(agent-tooling): the review's four findings on ci-speed`.
Do not push.

## Report

Final message, at most 15 lines: the commit, one line per outcome with the files changed, each command above with its
result, the line counts added and removed, anything you left and why. Run folder:
`D:/fitway-temp/tooling-ci-speed-fix-1/`.
