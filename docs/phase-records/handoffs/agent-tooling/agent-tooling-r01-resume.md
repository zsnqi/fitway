<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `fb9f4dd0`, 2026-10-17 02:43 +03:00
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Opened by the coordinator on 2026-10-16 under r04's decision 73 (DECISIONS item 1, `c286c4c9`). The tool paths r04
  held moved here (F253); the packet is `docs/phase-records/task-packets/agent-tooling-r01.yaml`.
- The coordinator of owner-design-exploration-r04 coordinates this milestone too, from the r04 worktree, where the
  ledger lives; this milestone's branch `agent-tooling-r01` is the integration branch for its rounds and merges into
  the coordinator line, then main through `pnpm main:advance`.
- From 2026-10-16 every brief has two reviews, DeepSeek (the launcher) and GPT-6.1 Sol `xhigh` in `<review folder>-sol`
  (r04 decision 66's rule applied, `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`
  §"Evaluation: both reviewers, decision 66's rule applied"), and every result a Sol diff review
  (`docs/agent-context/briefs/CODE_REVIEW.md`) whose blocking findings a mechanical fixer applies before the grade.
- **The first wave is integrated and on main.** `agent-tooling-r01` holds the code map (`e080324d`) and
  launcher-fixes-6 (`18c670fc`), merged at `cd1001ed` with the map regenerated (48 files, 618 callables, 488 without a
  covering test; CI passed); the coordinator line merged it at `fcc8365b`, and `pnpm main:advance` moved main from
  `3cde7a07` to `fcc8365b`. The coordinator's launcher now carries the fixes of F255, F257 and F258 (marked fixed in
  `findings.tsv`): a new milestone's first resume point,
  graders exempt from the claim check (grading briefs no longer need the no-SHA workaround), commands read as a shell
  reads them (quotes, escapes and comments in one scanning loop), and a commit found on any line. F256 (the events carry
  no working directory) stays open.
- **Grades of the wave** (records in the run folders): code-map's last Sol grade
  D:/fitway-temp/codex-round-56a3b941-033d-43b0-946c-6878da89f738 (14 PASS; G10 and G15 the grading brief's wording, the
  coordinator reproduced the committed N cases failing at their assertions); launcher's last Sol grade
  D:/fitway-temp/codex-round-2a25aa90-95dc-4236-9cb0-f00491e17389 (14 PASS; G9 the grading brief's wording on a table
  merge; the coordinator reproduced G13, quote state only in `shellScan`). Readings left open across the wave wait for
  the CLI contract's report fields (a claimed commit, a brief role, structured rows).
- **Data for the ratchet (measured 2026-10-16).** The day's 9 Sol diff reviews (D:/fitway-temp/code-review/) gave 30
  blocking findings: D1 duplicated code 14, D7 a second path 4, D3 dead code 4, D2 speculative generality 3, D5 growth
  out of proportion 3, D4 and D6 one each; 18 of 30 (60%) are duplication or a second path, which a check can catch
  before any review. Examples: the focus ring copied ten times in `components.css`, two shell tokenizers, two
  import-binding readers.

## Running now

- **The ratchet's grade, at its two brief reviews** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-grade.md`, committed `fb9f4dd0`; G1-G14 over
  H1-H6, K1-K6, the review edits and the held-out rows HR1-HR12): the launcher's DeepSeek review in
  D:/fitway-temp/brief-review/codex-ratchet-grade-1 (log D:/fitway-temp/tooling-ratchet-grade/launch-1.log) and Sol
  `xhigh` in `codex-ratchet-grade-1-sol`, both started about 02:40. The grading checkout is
  D:/fitway-temp/tooling-ratchet-grade/wt (branch `grade-ratchet` at `b3946bc3`); it still needs its own
  `pnpm install --frozen-lockfile --offline` before the grade launches.
- **The review fixer's ladder** (`owner-direction-fixer`, medium) runs on `tooling-ratchet` after its commit
  `b3946bc3` ("one extension list; script and lintSources under 80 lines"): the diff matches the frozen edits
  (checked by the coordinator); the baseline fell by two long functions; `scripts/check-concept-css.mjs` is 799 lines
  by `wc -l`, 800 as the ratchet counts (the giant-file line is over 800). Not pushed yet.
- **ratchet-fix's Sol diff review** (D:/fitway-temp/code-review/ratchet-fix-1) gave three blocking findings, all
  checked against `3f80f091` and dispositioned in its `dispositions.md`: `scanSource`'s extension parameter every
  caller filled alike (D2), `script` at 98 lines and `lintSources` at 87 against K6's 80 (D5; ratchet-fix's report
  had claimed K6). CI on `3f80f091` was still running at 02:42.
- **ratchet-fix is done** (measured): DeepSeek V4.1 Flash `max`, run
  D:/fitway-temp/codex-round-3911ed9e-70c8-440e-960b-77c265e16d07, result `3f80f091` on `tooling-ratchet`
  ("Fix code-health ratchet review findings", 10 files, +556/-409). Turn 1 was refused because its fast ladder ran
  before its commit; turn 2 reran the ladder on the commit (`811.24s`, no mutation) and the report was accepted at
  02:30. It reports K1-K6, H1-H6 and L0-L2 PASS; baseline 217 to 215 files, duplication 733 to 731.
- How it got here: the ratchet delivered `7c28d15a` on `tooling-ratchet` (run
  D:/fitway-temp/codex-round-c8aa5fb0-1f2a-4231-80f0-7c783796af3b): H1-H6 PASS; baseline CODE_HEALTH_BASELINE.json on
  that branch (217 files; duplication 733 at an 8-line window, type escapes 60, suppressions 10, repeated
  workarounds 8, long functions 324, giant files 34); `pnpm check:code-health` and `pnpm code-health:baseline`; H4
  proven on codex-round.mjs's growth 2,208 to 2,323 and on fix-3's duplicated body. Its commit message is "Ratchet":
  the round re-committed the same tree ten times under F263. Its Sol diff review
  (D:/fitway-temp/code-review/ratchet-1/) gave nine blocking findings, all in ratchet-fix. CI passed on `7c28d15a` on
  its rerun (the first failed on Windows `0xC0000142` process starts). `e115f646` merges F263's fix into
  `tooling-ratchet` with the code map regenerated and the baseline lowered for codex-round.mjs (2,324 to 2,317 lines,
  the tightening rule); `check:code-health` passed and CI passed on it (measured).
- **F263 is fixed and on main** (measured): `a4593baf` strips terminal escape codes before reading Git's commit
  header, and `9609525b` moves the reader into commit-header.mjs without a suppression (diff review
  D:/fitway-temp/code-review/launcher-ansi-1/); the local fast ladder passed on `9609525b` (1,866 tests, no
  mutation) and CI too; `agent-tooling-r01` fast-forwarded to it, the coordinator line merged it at `7da16cd9`, and
  `pnpm main:advance` moved main from `fcc8365b` to `7da16cd9`.

## Next steps

1. **When the fixer's ladder passes:** push `tooling-ratchet` (`b3946bc3`), watch its CI, install the grading
   checkout, disposition both brief reviews (`Reading N: closed|left open: <why>` and the brief's SHA-256 in each
   folder's `dispositions.md`), and launch the grade: `pnpm codex:round
   docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-grade.md xhigh --model gpt-6.1-sol` (output to a log).
2. **Read the grade**, reproduce at least one row (decision 67), record it (`codex-rounds.md`, `rounds.tsv`), then
   merge `tooling-ratchet` into `agent-tooling-r01`, the coordinator line (`check:tooling-map`, `check:repository`)
   and main through `pnpm main:advance` after CI.
3. **The CLI contract with `pnpm tools`** (F251; draft at D:/fitway-temp/agent-tooling-drafts/cli-contract-body.md),
   adding the report fields the wave's open readings wait on; then **map upkeep** (F252), then **the lighter pickup**.
   Each later brief drops the prose rules the ratchet now enforces (function and module length, duplication).
4. **verify-fitway's caret in forced colours** (F264, found by r04's fix-2 grade): Playwright's caret hiding does not
   hold there, so timeline samples on a focused field read NOT-HELD; it joins the next verify-fitway round. F265 (a
   round's edit after its last measurement passes the claim check) is a candidate for the CLI contract's report
   fields. `scripts/check-concept-css.mjs` sits at the giant-file line: the next change that grows it splits it.

## Waiting on the user

Nothing.

## Known risks

- The risks in r04's resume point apply here too: DeepSeek reports can claim steps that never ran (check the commit
  and ladder against the events), grading briefs name the round's brief by its absolute coordinator path, timed work
  needs a quiet machine (B13), and node_modules junctions are unlinked before `git worktree remove`.
- A busy machine fails the local fast ladder on `scripts/check-agent-context.test.ts` K1, at its 20 s timeout (F261);
  CI on the same commit decides.
- Sol reviews run with `codex exec ... - < prompt.md` from Bash: PowerShell 5.1 pipes the prompt as ASCII. Three Sol
  accounts take turns: on 2026-10-16/17 hhmam1435, ryshyjhad85 and smhsdxsz5h each reached a limit; hhmam1435 is
  current since 00:14 on 2026-10-17 (smhsdxsz5h free at 02:26); `node D:/fitway-temp/codex-accounts.mjs list` shows
  them, and `D:/fitway-temp/resume-auto.sh <run> D:/fitway-temp/resume-after-limit.md limit-first` switches and resumes.
- Never commit in a worktree where a fixer may still be running: a commit during its ladder trips the mutation guard
  (2026-10-17, F263's second commit).
- Never pipe `pnpm codex:round` through `head`: a closed pipe can stop the launcher; write its output to a log file.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-tooling-r01, branch agent-tooling-r01, expected HEAD the commit that
  last changed this text on the coordinator line.
- Coordinator: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
