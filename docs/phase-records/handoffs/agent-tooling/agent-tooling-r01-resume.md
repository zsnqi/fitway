<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-29 10:40 +03:00
  (leading-comments launched; branch-merge-checks' brief in its two reviews)
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (items 1-20; 20 last), `docs/agent-context/WORKING_AGREEMENTS.md`

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

Measured 2026-10-29 10:40. main `45e4635f`: the retro's four rounds (code-map-index, evidence-home, run-and-ref,
cited-evidence) are merged, each recorded beside `docs/phase-records/handoffs/agent-tooling/rounds/code-map-index.md`.

- **leading-comments** (worktree `D:/Projects/fitway-worktrees/tooling-leading-comments` from `ac337544`) is running
  on DeepSeek at `max`, launched 10:33 from `7c564947`: run folder
  `D:/fitway-temp/codex-round-6933ecc9-8094-4f89-a4d3-ee592dbd9625`, thread `01a18694-4ee1-7711-b373-a738fd628d94`,
  launcher log `D:/fitway-temp/launch-logs/leading-comments-launch.log`. Sol's two readings (existing comments that do
  not say what the file is for; `!` or `?` inside the first sentence) are closed in the brief, dispositions in
  `D:/fitway-temp/brief-review/codex-leading-comments-1-sol` (the Codex account `smhsdxsz5h` was limited until 10:49,
  so `hhmam1435` is current).
- **branch-merge-checks** (DECISIONS items 19-20; worktree `D:/Projects/fitway-worktrees/tooling-branch-merge-checks`
  at `853111c2`, installed): the brief `docs/phase-records/handoffs/agent-tooling/briefs/codex-branch-merge-checks.md`
  (`c6377e26`) is in DeepSeek's review (`D:/fitway-temp/brief-review/codex-branch-merge-checks-1`) and Sol's
  (`...-1-sol`). It launches after leading-comments merges, because that round adds lines at the top of the files
  this one changes: fast-forward the worktree to the merge, move the brief's HEAD and line numbers, write the new hash
  in both dispositions. On the base, `pnpm check:repository` counts 125 gone citations (102 distinct paths), all on
  unchanged lines, and `pnpm check:code-health` passes. Two shapes the coordinator settled in the brief: the base a
  gone citation is compared against is the upstream only when the upstream is another branch (a pushed line on
  `codex/owner-redesign-r04` is still the branch's own), from the merge base; and a second admission of a folder is
  refused, so the door cannot become a standing exception.
- **The concept's specs are split** (`2aa2fc4d`, on `owner-followup-r04-build`, pushed and green, and on
  `public-redesign-r01`): both originals rebuild byte for byte from the concept's new `spec` folder.
- **Done** (item 18): the four rounds; r04's `DECISIONS.md` split into an index and parts (`92a4e9a7`); the round records
  frozen behind `docs/phase-records/handoffs/agent-tooling/ROUNDS.md`; `SPEC.md` split by section into `docs/spec/`
  (`82138b9a`, the user's word); `docs/agent-context/RULE_ENFORCERS.md`; coordinator folders made with
  `pnpm run-folder:new` (`WORKING_AGREEMENTS.md`).

## Next steps

1. leading-comments: when it exits, the diff review, fix, grade, merge and record.
2. **branch-merge-checks:** close both reviews' readings, then launch it once step 1 is merged; then the review, fix,
   grade, merge and record. Then set `public-redesign-r01`'s upstream to `origin/owner-followup-r04-build`, redo the
   merge of main (the trial is `d2f86a8d`), admit the concept's giant files, pin the build's reference frame
   (`563e1c83`) in the packet on that branch, and run the four checks there.
3. The public page's designer (its own resume point) once step 2 is in.
4. **Measure again** after sessions have used the new tools: `D:/fitway-temp/retro-20261028/measure.mjs`,
   `D:/fitway-temp/retro-20261028/patterns.mjs` and the survey's script count.
5. **Five dated `giantFiles` exceptions until 2026-11-15** (`compare.mjs`, `cli.test.mjs`, `check-brief.test.ts`,
   `check-agent-context.test.ts`, `verify-repository.schema.test.ts`; F290): renew or retire them before that date.
6. F-rows from the four rounds: the survey's `collectGit` takes about 11 minutes; gone paths print lower-cased; a
   citation stops at a space; the giant measure reads working-tree bytes (a CRLF checkout counts more).

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
