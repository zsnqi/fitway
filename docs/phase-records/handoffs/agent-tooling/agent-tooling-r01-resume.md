<!-- handoff-format: resume-point-v1 -->
# agent-tooling-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-11-05 (item 26: round lesson-commands merged, `c80cc042`)
- **Standing decisions:** `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (items 1-26; 26 last; 25 on in `docs/phase-records/handoffs/agent-tooling/decisions/025-040.md`), `docs/agent-context/WORKING_AGREEMENTS.md`

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
- **Item 23 in force** (the user, 2026-10-31): hand-made run folders and hand-built capture scripts are fixed at the
  root in two side-by-side rounds; the public page's sketch 12 brief is the first to render through the CLI.

## Running now

**Round lesson-commands is merged** (`c80cc042`, DECISIONS item 26, record
`docs/phase-records/handoffs/agent-tooling/rounds/lesson-commands.md`): `pnpm wait` and `pnpm decision`. Open from it: F312, F313.
`docs/agent-context/briefs/ENVIRONMENT.md` does not mention `pnpm wait` yet: changing that block touches every brief template, so it is left for a decision.

**Round working-tools is merged** (`a66e5955`, DECISIONS item 24, record
`docs/phase-records/handoffs/agent-tooling/rounds/working-tools.md`): `pnpm verify:owner serve`, free sizes,
`frames --actions` and `--clip`, `run`'s `ready` and `shot`, `measure --page` and `--args-file`, SKILL.md §"CLI
working loop", and `pnpm brief:check` refusing a designer, builder or verifier brief that points at raw tools. CI run
41403907289 passed on `68b2c20d`, and `pnpm main:advance` moved main there on 2026-11-02; the public page's session
was told the round is in.

Before it, measured 2026-10-31 23:56: main `9a81a355` (`pnpm main:advance`, after CI run
41238840993 passed; the run before it, 41238198065, failed on a `frames` test that needed ui-forensics, repaired in
`9a81a355`).

- **evidence-gate is merged** (`b482e0b3`, `docs/phase-records/handoffs/agent-tooling/rounds/evidence-gate.md`): the pre-commit job `staged-evidence` refuses a
  line a commit adds that cites a gone temp path, or a folder made after 2026-11-01T00:00+03:00 with no
  `run-folder:new` manifest, launcher `run.json` or review `review.json` tied to it; each message names
  `pnpm run-folder:new`. `pnpm brief:check` and the same job refuse a designer brief asking for hand-built capture
  scripts or for frames without a `pnpm verify:owner` command.
- **public-frames is merged** (`d8433c72`, `docs/phase-records/handoffs/agent-tooling/rounds/public-frames.md`): `pnpm verify:owner frames` and `sheet`,
  `phone360`, `<size>@<density>`; `SKILL.md` §"Public designer frames" holds the commands a designer brief copies.

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

1. The public page's next session merges main into `public-redesign-r01` before its sketch 12 brief, so
   `pnpm verify:owner frames` exists in its worktree; the commands a designer brief carries are `SKILL.md`
   §"Public designer frames".
2. **After 2026-11-01T00:00+03:00, once:** make a folder by hand under `D:/fitway-temp`, cite it on a staged line, and
   see the commit refused (the post-cutoff path is proved by tests only so far).
3. The public page is run by its own session (`public-redesign-r01`'s resume point); this milestone does not touch its
   paths or worktree.
4. F303 as a round of its own when a later round touches the ratchet: compare a commit's baseline with its parent's,
   merges included.
5. **Measure again** after sessions have used the working-tools commands: `D:/fitway-temp/retro-20261102-nav/`
   (`measure-periods.mjs` with a new period from `a66e5955`, and `p2-tools.mjs`), against item 24's numbers.
6. **Five dated `giantFiles` exceptions until 2026-11-15** (`compare.mjs`, `cli.test.mjs`, `check-brief.test.ts`,
   `check-agent-context.test.ts`, `verify-repository.schema.test.ts`; F290): renew or retire them before that date.
   When `compare.mjs`'s is retired, its purpose line goes on its first line (leading-comments left it out: a
   giant-file exception counts only on line 1).
7. F-rows from the four rounds: the survey's `collectGit` takes about 11 minutes; gone paths print lower-cased; a
   citation stops at a space; the giant measure reads working-tree bytes (a CRLF checkout counts more). From
   2026-10-29: F301 (round8b R7's cleanup EPERM on CI, once). From 2026-10-31: F307 (`sheet` needs `-- --` under
   pnpm), F308 (the sheet title is small); F309 fixed (`f5198aa3`). From 2026-11-02: F310 (an unquoted
   script path with a space passes the brief rule), F311 (the designer phrase rule still refuses the repository's own
   `node scripts/...`), F312 (`frames` reported PASS for a frame whose stylesheet failed to load,
   `ERR_NO_BUFFER_SPACE`, and `run` measured that unstyled page; clean on re-run; public-redesign item 60).
8. **The renewed leases end on 2026-11-15** (`package.json` scripts, the README map, `lefthook.yml`): renew or drop them then, with
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
