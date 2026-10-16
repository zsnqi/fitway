<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `df7994f8`, 2026-10-17 00:28 +03:00
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

- **No Codex round of this milestone runs.** The coordinator's local fast ladder on `9609525b` (F263's second commit,
  committed by the coordinator from the fixer's staged work while the fixer's own ladder ran, so that ladder failed its
  mutation guard at 00:27; 1,866 tests passed in it) runs in D:/Projects/fitway-worktrees/tooling-launcher-ansi, log
  D:/fitway-temp/tooling-launcher-ansi/verify2.log;
  CI runs on `9609525b` (CI passed on `a4593baf`), and CI's rerun of the ratchet's run 38964003198 on `7c28d15a`
  (its first run failed on Windows `0xC0000142` process starts in `codex-round.test.ts`, which the ratchet does not
  touch).
- **The ratchet** delivered `7c28d15a` on `tooling-ratchet` (D:/Projects/fitway-worktrees/tooling-ratchet, run
  D:/fitway-temp/codex-round-c8aa5fb0-1f2a-4231-80f0-7c783796af3b): H1-H6 PASS; baseline
  CODE_HEALTH_BASELINE.json on that branch (217 files; duplication 733 at an 8-line window, type escapes 60,
  suppressions 10, repeated workarounds 8, long functions 324, giant files 34); `pnpm check:code-health` and
  `pnpm code-health:baseline`; H4 proven on codex-round.mjs's growth 2,208 to 2,323 and on fix-3's duplicated body.
  Its commit message is "Ratchet": the round re-committed the same tree ten times under F263 (all ten share tree
  `7a6da90c`). Its Sol diff review (D:/fitway-temp/code-review/ratchet-1/) gave nine blocking findings, all to
  ratchet-fix.
- **F263** (`findings.tsv`): launcher-fixes-6's commit check read Git's header with a line-anchored pattern, and
  PowerShell's terminal escape codes precede it on the same line, so every commit made through PowerShell was
  refused. Fixed on `tooling-launcher-ansi`: `a4593baf` strips the escape codes (a new test file with the real
  recorded output), and `9609525b` moves the reader into a module of its own, commit-header.mjs on that branch, without a
  suppression, after the diff review blocked the `biome-ignore` (D:/fitway-temp/code-review/launcher-ansi-1/);
  `codex-round.mjs` went from 2,323 to 2,316 lines.

## Next steps

1. **F263 to main:** when the local ladder and CI pass on `9609525b`, fast-forward `agent-tooling-r01` to it, merge
   into the coordinator line, wait for CI, `pnpm main:advance`. Implementing rounds wait for this: under the old
   check they loop on claim refusals until the resume limit.
2. **ratchet-fix** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-fix.md`, `df7994f8`, both reviews
   dispositioned, every reading closed): first merge `agent-tooling-r01` (with F263) into `tooling-ratchet`,
   regenerating the code map and the code-health baseline in the merge (codex-round.mjs falls to 2,316 lines; the
   ratchet's tightening rule requires the lower count), set the brief's HEAD to that merge, rerun `brief:check`,
   then launch with the fixed launcher. Held-out rows HR1-HR12 are in the grader's folder.
3. **Grade the ratchet with its fix** (Sol), then merge into `agent-tooling-r01` and on to main.
4. **The CLI contract with `pnpm tools`** (F251; draft at D:/fitway-temp/agent-tooling-drafts/cli-contract-body.md),
   adding the report fields the wave's open readings wait on; then **map upkeep** (F252), then **the lighter pickup**.
   Each later brief drops the prose rules the ratchet now enforces (function and module length, duplication).

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
