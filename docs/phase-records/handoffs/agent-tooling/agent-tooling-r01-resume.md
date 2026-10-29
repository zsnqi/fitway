<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-29 03:07 +03:00 (three
  rounds' fixes with builders; the concept's specs being split)
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

Measured 2026-10-29 03:07. main `8398bd72` (code-map-index merged and recorded in
`docs/phase-records/handoffs/agent-tooling/rounds/code-map-index.md`).

- **Three rounds ended and are with `owner-direction-builder`s**, each from a frozen brief that first merges main
  `8398bd72` into its branch. Each round's review folder `D:/fitway-temp/code-review/<round>-1/` holds Sol's
  findings (`last.md`), `dispositions.md` and the coordinator's `GRADE.md`; the brief is
  `D:/fitway-temp/tooling-<round>/fix-1/BRIEF.md`:
  - cited-evidence: result `564625f5`; merge `b5d46db4` and fix `9bc4911c` in, items 8 (the prune walked the real
    temp root for over 28 minutes) and 9 (the capture-name pattern took phrases) running;
  - evidence-home: result `52fb52af`; fix running;
  - run-and-ref: result `1c218aa6`; fix running. Its change to the read-only `tool-contract.mjs` stays (disposition 1)
    and its record names the departure.
  For each when it reports: check its commits and tests, then the merge, its record file beside `code-map-index.md`, push, CI and
  `pnpm main:advance`. run-and-ref and evidence-home both change `tool-registry.mjs` and `tool-help-notes.mjs`:
  merge one, then resolve the other against it.
- **The concept's specs are being split** by an `owner-direction-fixer` on branch `concept-spec-split` (worktree
  `D:/Projects/fitway-worktrees/concept-spec-split`, from `fedbdb6d`; brief `D:/fitway-temp/concept-spec-split/BRIEF.md`).
  When it is verified, fast-forward `owner-followup-r04-build` and `public-redesign-r01` to it and push the build branch.
- **Done** (item 18): compare-fullpage and code-map-index merged and recorded; r04's `DECISIONS.md` split into an
  index and parts (`92a4e9a7`); the round records frozen behind `docs/phase-records/handoffs/agent-tooling/ROUNDS.md`;
  `SPEC.md` split by section into `docs/spec/` (`82138b9a`, the user's word); `docs/agent-context/RULE_ENFORCERS.md`
  (112 rules, 64 written only).

## Next steps

1. Each builder's report: verify, merge, record, push, CI, `pnpm main:advance` (as in "Running now").
2. The four merged: add the coordinator's rule to `WORKING_AGREEMENTS.md` that coordinator folders are made with
   `pnpm run-folder:new` (evidence-home's H2).
3. **Finding 3's concept specs:** after the split is verified and on the build branch, merge main into
   `public-redesign-r01` once H3 is in main and run `pnpm code-health:baseline` there. The concept's `HISTORY.md`
   (134 KB), `README.md` (89 KB) and `INDEX.md` (76 KB) stay over the line, baselined; the page scripts are not split
   now (accepted pages; the ratchet stops their growth).
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
