<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: main's checks pass a long-lived branch's merge without loosening (agent-tooling-r01, round branch-merge-checks)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-branch-merge-checks`, branch `tooling-branch-merge-checks`, HEAD `853111c2`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 16,
  19 and 20.
- **Read first, only these:**
  - `scripts/agent-environment/code-health-ratchet.mjs:490-571` and `scripts/agent-environment/code-health-baseline.mjs`:
    how the baseline is written, what it refuses, and the inflation check.
  - `.agents/skills/gardener/cited-evidence.mjs` and `scripts/verify-repository.mjs:216-255`: the gone-citation audit
    and its messages.
  - `D:/fitway-temp/retro-20261028/gone-evidence/REPORT.md` §2A and §2B: how each lost path went.
  - `docs/agent-context/briefs/CODE_REVIEW.md`: D1-D8, which the diff is reviewed against.

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

- `<run>` is `codex-round-branch-merge-checks`. Never delete or change anything under `D:/fitway-temp` outside the run
  folder; checks on real folders read them only.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

Main's tooling is merged into `public-redesign-r01`, a branch that lives for weeks and integrates into
`owner-followup-r04-build`, not into main. A trial merge failed three checks that work on main. This round gives the
tooling for two of them, with nothing loosened: the concept's current page sizes can enter the baseline once, on
record; a gone citation fails on the branch that writes it; and the citations already lost are explained once, in one
list. The third, the packet's pinned frame, is a line the coordinator changes on that branch, and the coordinator then
redoes the merge there with the upstream set and the admission run (DECISIONS item 19); neither is this round's work.

## Causes and required outcomes

- **A1.** Main's baseline holds an older copy of the concept folder (`giantRoots` names
  `design-research/owner-composition-exploration-r04/directions/eclipse`), and the build branch has no baseline, so
  every page the build grew is a rise `refusedChanges` refuses (`code-health-ratchet.mjs:552-571`): the trial merge
  could not regenerate the baseline (DECISIONS item 19). Outcome: `pnpm code-health:baseline --admit <folder> --reason
  "<why>"` admits a folder the committed baseline names in `giantRoots`: it writes the current `giantFiles` and
  `giantDocuments` value of every file under that folder, new files and rises included, and records the admission in
  the baseline file (the folder, the date, the reason, and each admitted file with its old and new value). Without
  `--admit`, and for every file outside the folder and every other measure with it, the command refuses what it
  refuses today. A folder not in `giantRoots`, a folder the baseline already holds an admission for (the message names
  that admission's date and reason), and a missing or empty reason are refused, each with a message that names the
  cause. Every later regeneration, with or without `--admit`, keeps the admissions already recorded. The option is in
  the tools registry, so `--help` lists it. The commit holding the admission passes the pre-commit hook.
  `pnpm check:code-health` passes before and after that commit: a value the new admission names and that equals the
  file's current measure is not working-baseline inflation, while a value raised by hand in the same baseline still
  is; a later rise in an admitted file fails as any rise does. A baseline value that differs from the current measure,
  admitted or not, already fails the check, which reports every difference (`compareCodeHealth`,
  `code-health-ratchet.mjs:490-530`); that stays. Check: beside H3 in
  `scripts/agent-environment/code-health-ratchet.test.ts:193`, a fixture with a concept page baselined at 801 lines
  grown to 900 is refused without `--admit`; admitted with a reason, the baseline holds 900 and its admission names the
  date, the reason and 801 to 900; the check passes before and after the commit; growth to 901 then fails; a fall to
  850 followed by a plain `pnpm code-health:baseline` keeps the admission, and a second admission of the folder is
  still refused; admitting `scripts` is refused; a `scripts/` file raised by one line in the same run is still refused;
  a `scripts/` value raised by hand in the admitted baseline is reported as inflation. Intent: the concept's pages
  enter once with a reason anyone can read, and no other file, and no later growth, gets through the same door.
- **A2.** The gone-citation audit diffs the working tree against `origin/main` (`cited-evidence.mjs:45-48`). On a
  branch that integrates elsewhere every branch-only line counts as changed: 33 old citations in the concept's briefs
  failed the trial merge. It also counts a line main changed after the branch left it. Outcome: a line counts as
  changed when the current branch wrote it, committed since the merge base of `HEAD` and the branch it integrates
  into, or not committed yet. The branch it integrates into is the upstream when the upstream is another branch (as
  `public-redesign-r01` will track `origin/owner-followup-r04-build`); it is `origin/main` when there is no upstream,
  when `HEAD` is detached, or when the upstream is the branch's own remote copy (`codex/owner-redesign-r04` tracks
  `origin/codex/owner-redesign-r04`, and a pushed line there is still the branch's own). The check's message names
  the base it compared against. Check: extend `.agents/skills/gardener/cited-evidence.test.ts` (its fixture is
  `checkout-test-fixture.mjs`): on a branch tracking another branch, a gone citation that branch already held is
  counted, not failed, and one the branch writes fails naming its line; on a branch tracking its own remote copy, a
  gone citation pushed there but absent from `origin/main` fails; with no upstream the result is today's; a line
  `origin/main` changed after the fork is not counted as the branch's. Intent: a gone citation fails on the branch
  that writes it, wherever that branch integrates.
- **A3.** 125 citations of 102 distinct `D:/fitway-temp` paths are gone at this HEAD, most from frozen round logs and
  from briefs whose SHA-256 other records cite, so marking each line `(gone: <why>)` would change frozen records and
  break those hashes; today the check reprints the count on every run and no loss is explained (DECISIONS item 20).
  Outcome: one tracked list, `docs/agent-context/LOST_TEMP_EVIDENCE.tsv` (new), has one row for each gone citation the
  audit finds at this HEAD: the path, the record and line that cite it, and its cause, one of: the 2026-10-24 prune
  (it kept files by extension and size without reading citations), `remove-worktrees.ps1`, another grading-worktree
  removal, absent before the prune, a documentation example that never existed, or cause not found. The cause is the
  one the report's §2A or §2B gives for that path or a folder above it; the five citations in
  `.agents/skills/gardener/CLEANUP.md`, `.agents/skills/gardener/SKILL.md`, `.agents/skills/verify-fitway/SKILL.md`
  and `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` are documentation examples; any other path the report
  does not cover is "cause not found", never a guess. Rows and citations match one to one: a row accepts one gone citation of its path in its
  record, whatever line that citation is on now, so a record that cites a listed path more often than rows name it
  has the extra citations unlisted; the list's own lines are not citations. `pnpm check:repository` accepts a listed
  citation; a gone citation no row accepts keeps today's behaviour, and the fix it prints names the list beside
  `(gone: <why>)`. The check fails, naming the row, on a malformed row, a cause outside the six, or a row whose record
  no longer cites its path as often as rows name it, whether or not `D:/fitway-temp` exists (CI has none), and, when
  it exists, on a listed path that exists again. No other record changes. Check: extend
  `.agents/skills/gardener/cited-evidence.test.ts`: a listed citation on a changed line passes; the same path cited by
  a record no row names fails; a second citation of a listed path in the same record, on a changed line, fails; a
  listed path that exists fails naming the row; a row whose record dropped the citation fails naming the row, with
  the fixture temp root absent too. On the result, `pnpm check:repository` prints 0 unlisted gone citations and the
  listed count, 125 unless a citation went or came back during the round, which the report then names. Intent: every
  loss is explained once, and nothing new hides behind the list.
- **K1.** The audit's other behaviour (fixture temp roots, the `(gone:` mark, the count on unchanged lines, and "not
  checked" for the existence of paths when `D:/fitway-temp` is absent, as in CI) and the baseline's refusals stay as
  they are; the existing tests in `cited-evidence.test.ts` and `code-health-ratchet.test.ts` pass unchanged.
  `pnpm verify:fast` passes after the commit.
- **K2.** No giant-file, ratchet, test floor or check limit is loosened, and this round admits nothing: the
  committed baseline gains no admission. A fall is recorded with `pnpm code-health:baseline`, each change named in the
  commit message; `pnpm check:tooling-map` passes (regenerate with `pnpm map:tooling`).

## Scope

You may change, for A1, `scripts/agent-environment/code-health-baseline.mjs` (must change),
`scripts/agent-environment/tool-registry.mjs` (must change), `scripts/agent-environment/code-health-ratchet.mjs` and
the modules they import; for A2 and A3, `.agents/skills/gardener/cited-evidence.mjs` (must change),
`scripts/verify-repository.mjs` and the new `docs/agent-context/LOST_TEMP_EVIDENCE.tsv` (new); the test files of all
of these; and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and `docs/agent-context/CODE_HEALTH_BASELINE.json` (both
regenerated). Commit once when done. Everything else is read-only. Add no dependencies.

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it: the citation matcher is the audit's, the option parser is the tool contract's, and the Git fixture is
`checkout-test-fixture.mjs`. Your diff is reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that
list before you start. (agent-tooling DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of A1-A3 and K1-K2. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list the files you changed and anything you could not do.
