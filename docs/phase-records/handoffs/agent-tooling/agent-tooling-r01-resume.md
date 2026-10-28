<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-28 22:36 +03:00 (three
  of the retro's rounds running; evidence-home under review)
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (items 1-18; 18 last), `docs/agent-context/WORKING_AGREEMENTS.md`

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

Measured 2026-10-28 22:36. main `8c41282f`; the coordinator line is ahead and unpushed past `f79adba4`, whose CI run
(`40752311394`) `pnpm main:advance` waits on; push the rest after it.

- **Three of the retro's rounds run on DeepSeek `max`** from `f79adba4`, each brief reviewed by DeepSeek and Sol
  `xhigh` with dispositions in `D:/fitway-temp/brief-review/codex-<round>-1` and `-1-sol` (`22d42ef6`):
  - run-and-ref (`D:/Projects/fitway-worktrees/tooling-run-and-ref`, run `D:/fitway-temp/codex-round-run-and-ref`);
  - cited-evidence (`D:/Projects/fitway-worktrees/tooling-cited-evidence`, run `D:/fitway-temp/codex-round-cited-evidence`);
  - code-map-index (`D:/Projects/fitway-worktrees/tooling-code-map-index`, run `D:/fitway-temp/codex-round-code-map-index`).
  For each when it ends: the commit and ladder against its events, a Sol diff review, a builder, the coordinator's
  grade with planted defects, the merge, and its record as a file in a `rounds` folder beside `ROUNDS.md`.
- **evidence-home's brief is under review** (worktree `D:/Projects/fitway-worktrees/tooling-evidence-home` from
  `7930c80b`): DeepSeek's reading is in, Sol's runs in `D:/fitway-temp/brief-review/codex-evidence-home-1-sol`. Then
  dispositions and the launch.
- **Done this session** (item 18): compare-fullpage merged and recorded; r04's `DECISIONS.md` split into an index and
  parts (`92a4e9a7`); the round records frozen behind `docs/phase-records/handoffs/agent-tooling/ROUNDS.md`; `SPEC.md` split by
  section into `docs/spec/` (`82138b9a`, the user's word); `docs/agent-context/RULE_ENFORCERS.md` (112 rules, 64 written only).

## Next steps

1. `pnpm main:advance` to `f79adba4` once its CI passes; then push the line and advance again after its CI.
2. evidence-home: dispositions, launch; then each round's review, builder, grade and merge.
3. **Finding 3's concept specs** (on `public-redesign-r01`, after main is merged into it): split `DESIGN-SPEC.md`
   (283 KB) and `SETTINGS-SPEC.md` (78 KB) by section behind `DESIGN-SPEC.md` as the index, keeping its `##`
   headings; the concept's spec scripts (lint-spec, build-index, check-index, on the build branch) read the parts;
   the content shown preserved; `pnpm code-health:baseline` there once H3 is in. The concept's page scripts are not
   split now (accepted pages; the ratchet stops their growth).
4. After the four merge: a one-sentence leading comment for each mapped file the new map shows without one.
5. **Repair the gone citations** with `(gone: <why>)` once cited-evidence's check lists them.
6. **Measure again:** rerun `D:/fitway-temp/retro-20261028/measure.mjs` and `D:/fitway-temp/retro-20261028/patterns.mjs`
   and the survey's script count; then the public page's designer (its own resume point).
7. **Five dated `giantFiles` exceptions until 2026-11-15** (`compare.mjs`, `cli.test.mjs`, `check-brief.test.ts`,
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
- Codex evaluations: `docs/phase-records/handoffs/agent-tooling/ROUNDS.md` (the index; a new round is its own file in a
  `rounds` folder beside it).
