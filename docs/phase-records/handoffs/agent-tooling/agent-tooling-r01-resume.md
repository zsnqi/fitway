<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `f15a4441`, 2026-10-17 03:14 +03:00
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

- **ratchet-fix-2's two brief reviews** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-fix-2.md`,
  N1-N4 from the grade's four real defects): DeepSeek in D:/fitway-temp/brief-review/codex-ratchet-fix-2-1 (log
  D:/fitway-temp/tooling-ratchet/fix-2-launch-1.log) and Sol `xhigh` in `codex-ratchet-fix-2-1-sol`, both started
  about 03:13. Held-out rows HR13-HR18 appended to D:/fitway-grader/agent-tooling/ratchet-heldout.md. After the
  dispositions it launches on DeepSeek `max` in `tooling-ratchet` (at `b3946bc3`, clean).
- **The ratchet's grade is done and recorded** (run D:/fitway-temp/codex-round-f73f808c-d927-474f-a8bb-facc8041863f;
  `codex-rounds.md` §"agent-tooling-r01: the ratchet, ratchet-fix and the review fixer", `rounds.tsv`, F267-F269):
  7/14 as graded, held-out 10/12; four real defects (a deleted or edited working baseline lets a rise through; a third
  copy in one file is not counted; the gardener and the ratchet count lines one apart; the concept's one shared ring
  counts as three, reproduced by the coordinator) and three rows of the grading brief's wording. Not merged.
- **CI on `b3946bc3`** was running (pushed 03:00); CI on `3f80f091` passed (measured).
- **The CLI contract is ready to launch** (`docs/phase-records/handoffs/agent-tooling/briefs/codex-cli-contract.md`, C1-C5
  and L0-L4; its HEAD line still names `b3946bc3`): both reviews done and dispositioned (DeepSeek five readings closed,
  Sol three closed and one left open by narrowing the goal to failures to start), worktree
  D:/Projects/fitway-worktrees/tooling-cli-contract (branch `tooling-cli-contract` at `b3946bc3`, its own install).
  Held-out rows CC1-CC11 in D:/fitway-grader/agent-tooling/cli-contract-heldout.md. The coordinator's measurement of
  every command's `--help` and unknown-option answers at `b3946bc3`: D:/fitway-temp/tooling-cli-contract/baseline.txt.
- **The ratchet-fix review edits are in `b3946bc3`** (`owner-direction-fixer`, frozen edits; the diff checked by the
  coordinator): one extension list in `code-health-source.mjs` (`isSourceFile`), `script` 52 lines with
  `scanComments` 49, `lintSources` 52 with `collectRuleFindings` 36; baseline 215 to 214 files and long functions 324
  to 322. `scripts/check-concept-css.mjs` is 799 lines by `wc -l`, 800 as the ratchet counts.
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

1. **ratchet-fix-2:** disposition both reviews, launch, then its Sol diff review, fixer, and a grade of N1-N4 with
   HR13-HR18 (and HR7, HR8 again); the coordinator reproduces at least one row.
2. **Merge** `tooling-ratchet` into `agent-tooling-r01`, then the coordinator line (`check:tooling-map`,
   `check:repository`), then main through `pnpm main:advance` after CI.
3. **Launch the CLI contract** from that integration commit (it waits for ratchet-fix-2, which changes files it
   touches): move `tooling-cli-contract` to it, set the brief's HEAD
   line, rewrite both dispositions' `Brief SHA-256`, and run `pnpm codex:round
   docs/phase-records/handoffs/agent-tooling/briefs/codex-cli-contract.md max` (output to a log); then its diff review,
   fixer and grade (CC1-CC11).
4. **Then report-fields** (DECISIONS item 9: the claimed-commit field, a machine brief role, structured report rows;
   F265 a candidate), **map upkeep** (F252) and **the lighter pickup**. F264 (verify-fitway's caret in forced colours)
   joins the next verify-fitway round. `scripts/check-concept-css.mjs` sits at the giant-file line: the next change
   that grows it splits it.

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
  limited until 05:17 on 2026-10-17, ryshyjhad85 current since 02:57; `node D:/fitway-temp/codex-accounts.mjs list` shows
  them, and `D:/fitway-temp/resume-auto.sh <run> D:/fitway-temp/resume-after-limit.md limit-first` switches and resumes.
- Never commit in a worktree where a fixer may still be running: a commit during its ladder trips the mutation guard
  (2026-10-17, F263's second commit).
- A fresh `git clone` of this repository on drive D needs `-c core.longpaths=true`: without it the checkout stops on
  `visual-direction-gate/` evidence paths ("Filename too long", measured 2026-10-17); grading briefs that ask for a
  clone should say so.
- Never pipe `pnpm codex:round` through `head`: a closed pipe can stop the launcher; write its output to a log file.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/agent-tooling-r01, branch agent-tooling-r01, expected HEAD the commit that
  last changed this text on the coordinator line.
- Coordinator: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
