<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-28 22:00 +03:00 (the
  compare fix merged; the retro's four rounds drafted, not launched)
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (items 1-17; 17 last), `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Opened by the coordinator on 2026-10-16 under r04's decision 73 (DECISIONS item 1, `c286c4c9`). The tool paths r04
  held moved here (F253); the packet is `docs/phase-records/task-packets/agent-tooling-r01.yaml`.
- The coordinator of owner-design-exploration-r04 coordinates this milestone too, from the r04 worktree, where the
  ledger lives. Rounds merge into the coordinator line as `merge(agent-tooling): <round>` (as `dbf9b683` did), then
  main through `pnpm main:advance`.
- Every brief has two reviews, DeepSeek (the launcher) and GPT-6.1 Sol `xhigh` in `<review folder>-sol` (r04
  decision 66), and every result a Sol diff review (`docs/agent-context/briefs/CODE_REVIEW.md`; Opus when Sol stalls,
  r04 decision 100) whose blocking findings an `owner-direction-builder` applies from a frozen brief before the grade.
- **Item 16 in force:** before writing an outcome, check whether the code's structure or an existing test already
  guarantees it, and name the test (checklist B14 in `docs/agent-context/briefs/codex.md`).
- **Item 17 in force:** the retro's four findings are fixed at the root, each finding's fixes as layers built
  together, before the public page's designer starts (r04 decision 102).

## Running now

Nothing runs (measured 2026-10-28 22:00). main `8c41282f`; the coordinator line is ahead (decisions 16-17 and the
briefs below), for `pnpm main:advance` once its CI passes.

- **compare-fullpage merged** (`a5e6b5b6`, its builder's `5e6f7268`; record in r04's `codex-rounds.md`), with
  `SKILL.md` saying a size difference carries `sizes`, not a region. main waits on its CI for `pnpm main:advance`.
- **The retro's four rounds, drafted** (`2b68c6cf`; HEADs set at launch, no review yet). Evidence:
  `D:/fitway-temp/retro-20261028/` (`D:/fitway-temp/retro-20261028/report.txt`, `D:/fitway-temp/retro-20261028/scripts-classified/REPORT.md`, `D:/fitway-temp/retro-20261028/gone-evidence/REPORT.md`).
  - `docs/phase-records/handoffs/agent-tooling/briefs/codex-run-and-ref.md`, finding 1 and part of 4: `run --script`, `--ref`/`--baseline-ref`, `rewrite`,
    `diff-folders`, `manifest.json` in output folders, and `SKILL.md`'s "Where things live" and "Proving a change to
    this tool" with a test.
  - `docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map-index.md`, finding 4: the map becomes one line per file and stops drifting on line moves.
  - `docs/phase-records/handoffs/agent-tooling/briefs/codex-cited-evidence.md`, finding 2:
    - a prune that keeps every cited file;
    - removing a worktree refuses when it holds a cited untracked file;
    - gone citations are listed by the survey and by `check:repository` on changed lines;
    - the survey counts the scripts in each new run folder.
  - `docs/phase-records/handoffs/agent-tooling/briefs/codex-evidence-home.md`, findings 2-4: `evidence:keep`, the `run.json` fields and `run-folder:new`, the
    `giantDocuments` measure with the concept joining `giantFiles`, and a check of the rule-to-enforcer table.
  - The rule-to-enforcer table is not written. A sonnet-researcher drafting it from the repository stopped at the
    session limit (`D:/fitway-temp/retro-20261028/rule-enforcers/`, if anything was saved). The table goes into
    `docs/agent-context/README.md` §"Which check enforces each rule", checked by the coordinator, before evidence-home
    launches.
- **Earlier rounds:** belonging-check is merged (`dbf9b683`). loading-check is delivered and graded (`9fc29e91`,
  `D:/fitway-temp/tooling-loading-check-grade/`), not merged: its defects are listed there, and CI's
  `check:verification-map` waits on Settings' recipes, the user's call. base-run waits until after the demo, with edits
  uncommitted in `tooling-base-run` over `c0e12373`.

## Next steps

1. **`pnpm main:advance`** to the coordinator line once its CI passes.
2. **Launch the four rounds** from the merged line. For each: create a worktree (`tooling-run-and-ref`,
   `tooling-code-map-index`, `tooling-cited-evidence`, `tooling-evidence-home`, each with its own install), set its
   HEAD, run `pnpm brief:check`, then the launcher's DeepSeek review and a Sol review, record the dispositions, and
   launch. All four run side by side: their files are disjoint apart from the regenerated map and baseline, and
   `package.json` in evidence-home. Then each: the commit and ladder checked against its events, a Sol diff review,
   a builder, the coordinator's grade with planted defects, and the merge.
3. **Finding 3's specs** (on `public-redesign-r01`, after main is merged into it):
   - split `DESIGN-SPEC.md` (283 KB; 189 of its 191 lines over 400 characters are table rows; §3 82 KB, §4 73 KB) and
     `SETTINGS-SPEC.md` (78 KB, one 42-row table) by section into files a reader opens one at a time;
   - `DESIGN-SPEC.md` becomes the index and keeps its `##` headings, which briefs cite;
   - the concept's spec scripts in its tools folder (lint-spec, build-index, check-index; on the build branch) read
     the parts, and the content is shown preserved;
   - `pnpm code-health:baseline` on that branch once evidence-home's H3 is in;
   - the concept's page scripts are not split now (record why: accepted pages; the ratchet stops their growth).
4. **Repair the gone citations** with `(gone: <why>)` once cited-evidence's check lists them.
5. **Measure again:** rerun `D:/fitway-temp/retro-20261028/measure.mjs` and `D:/fitway-temp/retro-20261028/patterns.mjs`, and the survey's script
   count after the next rounds. Then the public page's designer (its own resume point).
6. **Five dated `giantFiles` exceptions until 2026-11-15** (`compare.mjs`, `cli.test.mjs`, `check-brief.test.ts`,
   `check-agent-context.test.ts`, `verify-repository.schema.test.ts`; F290): renew or retire them before that date.

## Waiting on the user

Nothing.

## Known risks

- **CI takes 27-28 min** on Windows; a push cancels the branch's running CI run, so batch pushes while waiting on a
  run `main:advance` needs.
- **Session limits stop subagents and side sessions**; resume one with a message after its reset, and check its last
  commit and report first.
- The risks in r04's resume point apply here too: DeepSeek reports can claim steps that never ran (check the commit
  and ladder against the events), grading briefs name the round's brief by its absolute coordinator path, timed work
  needs a quiet machine (B13), and node_modules junctions are unlinked before `git worktree remove`.
- A busy machine fails the local fast ladder on `scripts/check-agent-context.test.ts` K1, at its 20 s timeout (F261);
  CI on the same commit decides.
- Sol reviews run with `codex exec ... - < prompt.md` from Bash: PowerShell 5.1 pipes the prompt as ASCII; `node
  D:/fitway-temp/codex-accounts.mjs list` shows the accounts.
- Never commit in a worktree where a fixer may still be running: a commit during its ladder trips the mutation guard.
- A fresh `git clone` on drive D needs `-c core.longpaths=true` (`visual-direction-gate/` paths).
- Never pipe `pnpm codex:round` through `head`: a closed pipe can stop the launcher; write its output to a log file.
- Real-browser grade scripts open contexts through ui-forensics' `newContext` with drive's `contextOptions`; plain
  Playwright ignores the `zoom` option (G1's first oracle did).

## Pointers

- Coordinator: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected
  HEAD the commit that last changed this text.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
