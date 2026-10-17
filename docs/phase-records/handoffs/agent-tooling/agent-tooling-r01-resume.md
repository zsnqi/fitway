<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at `d95e2ee2`, 2026-10-17 14:40 +03:00
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (items 1-10), `docs/agent-context/WORKING_AGREEMENTS.md`

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

- **The CLI contract's grade builder** (`owner-direction-builder`, in the coordinator session): `1085b6fc` holds the
  six grade findings (exact product names in the classifier, C4 lines across the start-up failures, probes after
  positionals and a source scan of entry modules, measure/doctor/drive options declared again with 26 intentional
  refusals, the launcher's 21 help explanation lines in a help-notes module, the two old-code cases at their
  assertions). Its local ladder failed twice on per-test timeouts only (round16b R6 at 60 s; round15 G2, round16 R1
  and new-handoff V2 at 20 s), each file passing alone; it is pushed and its CI was in progress at 13:30. Accepted by
  the coordinator: `context:show` with no `--milestone` is now refused (it silently picked the first open milestone),
  recorded among the intentional refusals.
- **Its Sol diff review** (D:/fitway-temp/code-review/cli-contract-grade-builder-1, dispositions there) gave three
  blocking findings: a `tool-contract:` comment exempting code from the source scan, the registry and verify-fitway's
  cli.mjs both validating the same ranges, and a second required-option path for compare's `--baseline` (R20 V2 may
  gain `--baseline` for compare only). The coordinator added five: check:agent-context's unknown milestone in the C4
  form, `--timeline-times` and compare's `--session` in the C4 form, measure's spec-serve refusal before it creates a
  folder, a subcommand's own usage after a missing value, and the gardener SKILL.md's order. The builder committed
  them as `47f18b0e`; its report never reached the coordinator (it ran in the earlier coordinator session). The
  coordinator checked the commit against the dispositions (the `tool-contract:` comment gone from the tree,
  `--baseline` among compare's required options with only R20 V2 changed, cli.mjs's own range checks removed; the five
  giant files under their 57dad1c0 counts) and pushed it at 14:06; CI run 39027454092 was in progress at 14:40.
- **The coordinator's reproduction** (D:/fitway-temp/tooling-cli-contract-regrade/probe-ccr4.mjs, against
  `57dad1c0`'s owner parser): through the resolver and the owner options step, `doctor --quiet true --transports`,
  `measure --feature --states --languages --sizes --inputs --motions --transports` and `drive --timeline
  --timeline-times --tools --quiet` give the values the old parser gave.
- **The re-grade is running:** brief
  `docs/phase-records/handoffs/agent-tooling/briefs/codex-cli-contract-regrade.md` (`4774dace`, then `d95e2ee2`; Q1, Q4, Q5,
  Q6, Q9 and Q10 at `47f18b0e`, Q4 and Q5 widened by the diff review's fixes); both brief reviews in
  D:/fitway-temp/brief-review/codex-cli-contract-regrade-1 (DeepSeek) and `-1-sol` (Sol `xhigh`), dispositions there
  (seven readings closed, three left open with reasons); launched at 14:35 as run
  D:/fitway-temp/codex-round-56efe90d-e5b2-4caa-94dd-e1f468486afa (Sol `xhigh`), log
  D:/fitway-temp/tooling-cli-contract-regrade/launch-2.log. Held-out rows CCR1-CCR6 in
  D:/fitway-grader/agent-tooling/cli-contract-heldout.md; grading worktree D:/fitway-temp/tooling-cli-contract-regrade/wt
  on branch `regrade-cli-contract`, installed, at `47f18b0e`.
- **The grade is done and recorded** (run D:/fitway-temp/codex-round-2751f7b6-26f9-41ec-8f47-6f7fd2501184;
  `codex-rounds.md` §"agent-tooling-r01: the CLI contract and cli-contract-fix", `rounds.tsv`): 6/12 as graded, six
  real defects (Q6 reproduced by the coordinator through the resolver: `--feature` and `--quiet` refused), Q8 the
  grading brief's wording. CI passed on `97f61712` (measured).
- **Earlier in the series** (records: `codex-rounds.md` §"agent-tooling-r01: the CLI contract and cli-contract-fix",
  `rounds.tsv`): the contract `cb1cfe65` (run codex-round-58a64b69-...), cli-contract-fix `dda8e020` (run
  codex-round-e40f5755-...), the review builder `97f61712` (a fixed compatibility table of 148 rows, re-checked by the
  coordinator against the `57dad1c0` parsers with 0 mismatches); CI passed on all three. One old form is refused on
  purpose: `main:advance HEAD -- --dry-run`.
- **main is at `b56aa416`** (measured), with the ratchet series integrated (`57dad1c0` the last of it; records
  `codex-rounds.md` §"agent-tooling-r01: ratchet-fix-2", F267-F271).

## Next steps

1. **The CLI contract:** wait for CI run 39027454092 and the re-grade's report; reproduce one row; record the grade
   in `codex-rounds.md` and `rounds.tsv`; a FAIL that is a real defect goes to a builder on `tooling-cli-contract`
   with a Sol diff review; when it holds, merge `tooling-cli-contract` into `agent-tooling-r01`, the coordinator line
   and main through `pnpm main:advance`.
2. **Then, by DECISIONS item 10** (the user, 2026-10-17): a ratchet round whose giant-file measure counts code lines
   only (not blank or comment lines; F272), then a round that splits the giant files into modules
   (`scripts/agent-environment/codex-round.mjs`, `.agents/skills/gardener/survey.mjs`,
   `scripts/check-agent-context.mjs`, `scripts/agent-environment/check-brief.mjs` and the others over the line); briefs
   keep the "move code, never delete text" line until both are in.
3. **Then report-fields** (DECISIONS item 9: the claimed-commit field, a machine brief role, structured report rows;
   F265 a candidate; F270, a committed baseline rise CI cannot see, may join a ratchet round), **map upkeep** (F252)
   and **the lighter pickup**. F264 (verify-fitway's caret in forced colours) joins the next verify-fitway round;
   F269 (test suites counted as long functions) waits for a ratchet round.

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
