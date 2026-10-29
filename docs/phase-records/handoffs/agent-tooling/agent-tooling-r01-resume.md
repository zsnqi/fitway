<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-29 16:48 +03:00
  (lease-ends merged; its CI and `pnpm main:advance` are next)
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

Measured 2026-10-29 16:48. Nothing of this milestone runs; CI runs on the coordinator line's push carrying
`0389ccd2`. main `5575697f` (`pnpm main:advance`, 2026-10-29).

- **lease-ends is merged** (`0389ccd2`, record `docs/phase-records/handoffs/agent-tooling/rounds/lease-ends.md`,
  DECISIONS item 22): `pnpm check:repository` reads each lease's end (`through YYYY-MM-DD`) against `updatedAt`, and
  `updatedAt` must carry the date of the commit that last changed the ledger, so every ledger edit sets `updatedAt` to
  the time of the write, on the day it is committed. F302 is fixed; F303 (a committed baseline is never compared with
  its parent's) is open.
- **The real merge is in** (items 19 and 21), measured: `ef9fa810` split `NEXT-DIRECTION-BRIEF.md` on r04's branch
  as r04's work (nine parts in a `next-direction-brief` folder beside it, the original rebuilt byte for byte;
  recorded in r04's resume point); `public-redesign-r01` fast-forwarded to it, set to track `origin/owner-followup-r04-build`, merged main
  `bc6b9464` with no conflict (`ac0effa7`), then `adabebff`: `pnpm code-health:baseline --admit` for the concept folder
  with its reason (one admission record, 12 files, `NEXT-DIRECTION-BRIEF.md` out of the baseline) and the packet's
  reference frame pinned to `563e1c83`. There `pnpm check:code-health`, `pnpm check:repository` (0 unlisted gone
  citations on changed lines, 33 on unchanged lines, 125 listed), `pnpm check:design-context` and the pre-commit hook
  pass. The CI runs on the two pushes are the record's last rows.
- **DECISIONS item 22, the coordinator's part, done:** two leases renewed through 2026-11-15, three dropped
  (`PROJECT_STATE.yaml`); the agreement line is `WORKING_AGREEMENTS.md` §"Ownership".
- **The concept's specs are split** (`2aa2fc4d`, on `owner-followup-r04-build`, pushed and green, and on
  `public-redesign-r01`): both originals rebuild byte for byte from the concept's new `spec` folder.
- **Done** (item 18): the four rounds; r04's `DECISIONS.md` split into an index and parts (`92a4e9a7`); the round records
  frozen behind `docs/phase-records/handoffs/agent-tooling/ROUNDS.md`; `SPEC.md` split by section into `docs/spec/`
  (`82138b9a`, the user's word); `docs/agent-context/RULE_ENFORCERS.md`; coordinator folders made with
  `pnpm run-folder:new` (`WORKING_AGREEMENTS.md`).

## Next steps

1. **The CI run on `0389ccd2`'s push**; a failure is repaired here. Then `pnpm main:advance` to it.
2. The public page waits on the user (its own resume point): the first round's three directions were set aside on
   2026-10-29, and its rules are being reworked with the user.
3. F303 as a round of its own when a later round touches the ratchet: compare a commit's baseline with its parent's,
   merges included.
4. **Measure again** after sessions have used the new tools: `D:/fitway-temp/retro-20261028/measure.mjs`,
   `D:/fitway-temp/retro-20261028/patterns.mjs` and the survey's script count.
5. **Five dated `giantFiles` exceptions until 2026-11-15** (`compare.mjs`, `cli.test.mjs`, `check-brief.test.ts`,
   `check-agent-context.test.ts`, `verify-repository.schema.test.ts`; F290): renew or retire them before that date.
   When `compare.mjs`'s is retired, its purpose line goes on its first line (leading-comments left it out: a
   giant-file exception counts only on line 1).
6. F-rows from the four rounds: the survey's `collectGit` takes about 11 minutes; gone paths print lower-cased; a
   citation stops at a space; the giant measure reads working-tree bytes (a CRLF checkout counts more). From
   2026-10-29: F301 (round8b R7's cleanup EPERM on CI, once).
7. **The renewed leases end on 2026-11-15** (`package.json` scripts, the README map): renew or drop them then, with
   the giant-file exceptions of step 5.

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
