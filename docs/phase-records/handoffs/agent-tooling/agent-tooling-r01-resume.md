<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `310014a0`, 2026-10-17 10:14 +03:00
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

- **The CLI contract's grade findings** (`owner-direction-builder`, a precise specification): exact product names in
  the script classifier, every start-up failure in C4's form, the contract test probing an unknown option after a
  positional and scanning for private argument loops, the options `measure` and `doctor` read at `57dad1c0` declared
  again with an intentional-refusals record for every other base form now refused, the launcher's help explanations
  carried into the registry, and two cases guarded to fail at their assertions; worktree
  D:/Projects/fitway-worktrees/tooling-cli-contract on `97f61712`, scratch D:/fitway-temp/tooling-cli-contract/builder-2/.
- **The grade is done and recorded** (run D:/fitway-temp/codex-round-2751f7b6-26f9-41ec-8f47-6f7fd2501184;
  `codex-rounds.md` §"agent-tooling-r01: the CLI contract and cli-contract-fix", `rounds.tsv`): 6/12 as graded, six
  real defects (Q6 reproduced by the coordinator through the resolver: `--feature` and `--quiet` refused), Q8 the
  grading brief's wording. CI passed on `97f61712` (measured).
- **The review edits are in `97f61712`** (`owner-direction-builder`): a fixed compatibility table of 148 rows
  (tool-compatibility.json, on `tooling-cli-contract`) checked through each command's own exported options step,
  re-checked by the coordinator against the `57dad1c0` parsers (`ORACLE: 148 rows, 0 mismatches`); it caught a
  regression of `dda8e020` (the survey's default temp root), which the builder restored; one `drift-tree` mapping,
  one fixture copier, no unreachable check; its ladder passed after the commit (`930.76s`, no mutation). One old form
  is now refused rather than read: `main:advance HEAD -- --dry-run`.
- **cli-contract-fix is done** (measured): run D:/fitway-temp/codex-round-e40f5755-2e65-42e0-820e-2822e7541bb4, result
  `dda8e020` ("fix agent CLI contract parsing", 27 files); one registry-driven resolver returning
  `{command, options, positionals, passthrough, fixedArgs}`, 14 private parsers removed, verify-fitway importing the
  contract unconditionally, the five giant files below their `57dad1c0` counts with no comment removed (checked by the
  coordinator), `check:concept-css` one prefix. Its local ladder failed once on F261's K1 timeout and the file passed
  alone; CI decides. The grading brief for the contract with its fix is drafted (Q1-Q12, in the coordinator's
  scratchpad) and gets its HEAD after the builder.
- **The CLI contract round is done** (measured): run D:/fitway-temp/codex-round-58a64b69-6ef3-461d-9ac7-4460520447ce,
  result `cb1cfe65` ("unify agent command contract", 29 files, +2247/-489; first report refused because its ladder
  preceded its commit, the second accepted; ladder after the commit `980.60s`). It reports C1-C5 and L0-L4 PASS and
  22 registered commands. Its Sol diff review (D:/fitway-temp/code-review/cli-contract-1) gave seven blocking
  findings (the shared parser returns no values so every command keeps its own; verify-fitway's silent import
  fallback; fixed arguments declared twice; a cast; dead help code; a duplicated failure formatter; exports without
  callers), and the coordinator added two: the round deleted 26 blank lines from five giant files to stay under the
  ratchet's line (F272), and `check:concept-css` prints `FAIL: ERROR:`. CI on `cb1cfe65` was running at 07:20.
- **main is at `b56aa416`** (measured): CI passed on the coordinator merge (agent-tooling-r01 into the coordinator
  line; `check:tooling-map`, `check:code-health` and `check:repository` passed locally), and `pnpm main:advance
  b56aa416` moved main from `7da16cd9`.
- **The ratchet is integrated** (measured): `agent-tooling-r01` fast-forwarded from `9609525b` to `57dad1c0`, the
  last of the ratchet series: the ratchet, ratchet-fix, ratchet-fix-2 and three fixers (`b3946bc3`, `6ca46c2e`,
  `57dad1c0`). The grade follow-up `57dad1c0` was checked by the coordinator, not re-graded: a corrupt committed
  baseline now stops both commands and leaves the working file byte-identical (reproduced in a fresh repository),
  `survey.mjs` is 1228 lines with its baseline entry falling to match (the Git reader moved to `git-reader.mjs`), and
  the excepted-copy case fails at its assertion on the old code by construction (an optional chain). Its ladder passed
  (`833.20s`, no mutation). Records: `codex-rounds.md` §"agent-tooling-r01: ratchet-fix-2", `rounds.tsv`, F267-F271.

## Next steps

1. **The CLI contract:** check the builder's commit and ladder, then a short Sol re-grade of Q1, Q4, Q5, Q6, Q9 and
   Q10 only (the grading brief's rows, with a `--no-hardlinks` scratch copy), reproduce one row, then merge
   `tooling-cli-contract` into `agent-tooling-r01`, the coordinator line and main.
2. **Then report-fields** (DECISIONS item 9: the claimed-commit field, a machine brief role, structured report rows;
   F265 a candidate; F270, a committed baseline rise CI cannot see, and F272, the giant-file measure counting blank lines, may join a ratchet round), **map upkeep** (F252) and **the
   lighter pickup**. F264 (verify-fitway's caret in forced colours) joins the next verify-fitway round; F269 (test
   suites counted as long functions) waits for a ratchet round.

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
