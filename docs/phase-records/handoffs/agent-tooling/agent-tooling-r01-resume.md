<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-29 14:15 +03:00
  (both rounds merged and CI-green at `bc6b9464`; the user asked to compact the conversation before the next step)
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (items 1-22; 22 last), `docs/agent-context/WORKING_AGREEMENTS.md`

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

Measured 2026-10-29 14:15. Nothing runs. main `c14fb5d7` (leading-comments, merge `2e6318b2`). The coordinator line
also carries branch-merge-checks (merge `98ce29d3`, its CI repair merge `9b9ce06f`, record
`docs/phase-records/handoffs/agent-tooling/rounds/branch-merge-checks.md`); CI passed on `bc6b9464` (run 40857415956)
and main is not advanced yet, held by the user's pause. The round gives `pnpm code-health:baseline --admit <folder>
--reason "<why>"`, gone citations compared from the merge base with the branch an upstream names, and
`docs/agent-context/LOST_TEMP_EVIDENCE.tsv` (125 rows). Its grade
replayed the trial merge `d2f86a8d` with the tooling merged in (`D:/fitway-temp/code-review/branch-merge-checks-1/GRADE.md`
and its `T*.log`; the throwaway worktree is removed): with the upstream set, the citations pass and the concept folder
admits, once the next point is settled.

- **`NEXT-DIRECTION-BRIEF.md` blocks the admission.**
  `design-research/owner-composition-exploration-r04/directions/NEXT-DIRECTION-BRIEF.md` is outside the giant root
  and stands 73 bytes over main's baseline on `owner-followup-r04-build` (59,178 against 59,105), so `--admit`
  refuses the whole run, as A1 asks. It is r04's file and grew on r04's branch, so it is split by section there (the
  giant-document rule), behind an index that keeps its name, and reaches `public-redesign-r01` through the merge: the
  user approved the split (DECISIONS item 21); not started. Its 14 `##` sections run from line 9 to line 821; no
  record cites its lines by number (22 files name it).
- **The rest of the trial** (`T8.log`): the packet's pinned frame fails, item 19's third problem; and 33 gone
  citations the build's own records hold are counted on unchanged lines, not failed.
- **The concept's specs are split** (`2aa2fc4d`, on `owner-followup-r04-build`, pushed and green, and on
  `public-redesign-r01`): both originals rebuild byte for byte from the concept's new `spec` folder.
- **Done** (item 18): the four rounds; r04's `DECISIONS.md` split into an index and parts (`92a4e9a7`); the round records
  frozen behind `docs/phase-records/handoffs/agent-tooling/ROUNDS.md`; `SPEC.md` split by section into `docs/spec/`
  (`82138b9a`, the user's word); `docs/agent-context/RULE_ENFORCERS.md`; coordinator folders made with
  `pnpm run-folder:new` (`WORKING_AGREEMENTS.md`).

## Next steps

1. `pnpm main:advance bc6b9464` (its CI passed; check that the coordinator line has no newer pushed commit first).
2. **The real merge:** split `NEXT-DIRECTION-BRIEF.md` on `owner-followup-r04-build` (DECISIONS item 21; worktree
   `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, clean at `2aa2fc4d`; `2aa2fc4d`'s spec split is the
   pattern) and merge that into `public-redesign-r01`; set `public-redesign-r01`'s upstream to
   `origin/owner-followup-r04-build`; redo the merge of main (the trial is `d2f86a8d`); run
   `pnpm code-health:baseline --admit design-research/owner-composition-exploration-r04/directions/eclipse --reason
   "<why>"`; pin the build's reference frame (`563e1c83`) in the packet on that branch; run the four checks there.
3. The public page's designer (its own resume point) once step 2 is in.
4. **Measure again** after sessions have used the new tools: `D:/fitway-temp/retro-20261028/measure.mjs`,
   `D:/fitway-temp/retro-20261028/patterns.mjs` and the survey's script count.
5. **Five dated `giantFiles` exceptions until 2026-11-15** (`compare.mjs`, `cli.test.mjs`, `check-brief.test.ts`,
   `check-agent-context.test.ts`, `verify-repository.schema.test.ts`; F290): renew or retire them before that date.
   When `compare.mjs`'s is retired, its purpose line goes on its first line (leading-comments left it out: a
   giant-file exception counts only on line 1).
6. F-rows from the four rounds: the survey's `collectGit` takes about 11 minutes; gone paths print lower-cased; a
   citation stops at a space; the giant measure reads working-tree bytes (a CRLF checkout counts more). From
   2026-10-29: F301 (round8b R7's cleanup EPERM on CI, once) and F302 (a raised test floor counts as inflation
   until the commit).
7. **DECISIONS item 22:** renew or drop the five leases that expired on 2026-10-23 (package.json scripts, README
   map, checks.yml, vitest.config.ts, lefthook.yml; neither round of 2026-10-29 touched them) in `PROJECT_STATE.yaml`;
   then one Codex round: an expired lease on a non-terminal milestone fails `pnpm check:repository`, with F302's fix
   (a raised test floor is not inflation); and the agreement line below, its wording approved.

## Waiting on the user

Nothing. DECISIONS item 22's agreement line, its wording approved by the user on 2026-10-29 («اي موافق»), goes into
`docs/agent-context/WORKING_AGREEMENTS.md` ("Ownership" or the nearest section) as written, after the user's compact:

> When the coordinator of one milestone needs a change in files another milestone owns, and coordinates that
> milestone too, it makes the change as the owning milestone's work: on that milestone's branch, recorded in its
> records, with a line in the requesting milestone's record. It first confirms that no writer is active there (the
> worktree is clean and no session or agent of that milestone is running). It asks the user only where `AGENTS.md`
> already requires it (a locked decision, a material visual-direction change, privacy or security); a change that
> keeps every word and behaviour, shown by the diff or a byte-for-byte rebuild, needs no question. (user, 2026-10-29)

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
