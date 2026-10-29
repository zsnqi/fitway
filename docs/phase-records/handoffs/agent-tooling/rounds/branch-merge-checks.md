# agent-tooling-r01: branch-merge-checks: `../briefs/codex-branch-merge-checks.md`, result `2d923ebc` on `tooling-branch-merge-checks` (from `be8985b9`), DeepSeek V4.1 Flash, level `max`; builder `a3e3db45`, coordinator `6d9459cb`; merged `98ce29d3`

- **Scope (agent-tooling DECISIONS items 19-20):** the tooling for merging main into `public-redesign-r01`, which
  integrates into `owner-followup-r04-build`: `pnpm code-health:baseline --admit <folder> --reason` admits a
  `giantRoots` folder's current giant sizes once, on record (A1); a gone citation fails only on a line the branch
  wrote since it left the branch it integrates into (A2); `docs/agent-context/LOST_TEMP_EVIDENCE.tsv` lists the 125
  citations already lost with their cause, and the check accepts them one to one (A3).
- **Brief review** (`D:/fitway-temp/brief-review/codex-branch-merge-checks-1` and `-1-sol`): DeepSeek five readings,
  four closed (admissions kept by every regeneration, rows matched one to one, the list checked in CI too, a hand-set
  value already caught by `compareCodeHealth`) and one left open (the upstream is the coordinator's act and the
  message names the base); Sol two (the goal claimed all three trial failures; the same one-to-one reading), closed.
- **Run** (`D:/fitway-temp/codex-round-6ca4ca88-1285-485d-9afd-b3146f27a003`, start load 324,629): three turns, two
  automatic resumes after the claim check found no record for the A1 and A2 test rows; `pnpm verify:fast` passed in
  909 s before the report.
- **Diff review** (`D:/fitway-temp/code-review/branch-merge-checks-1/`): Sol `xhigh`, four blocking findings, all
  confirmed (the row count kept twice; two identical test generators; a fixture option no caller uses; an unreachable
  null branch).
- **The coordinator's grade on `2d923ebc`** (`GRADE.md` there) replayed the real use: the old trial merge `d2f86a8d`
  with the result merged in, in a throwaway worktree tracking `origin/owner-followup-r04-build`. A plain regeneration
  refuses the concept's grown pages; `--admit` refuses a missing reason and `scripts`, admits the concept folder with
  a full record, passes the check before and after its commit and the pre-commit hook, refuses a second admission,
  and survives a plain regeneration; the citations pass against the upstream's merge base and fail against
  `origin/main` without it. Blocking C1: listed citations still counted as gone on unchanged lines, so the check kept
  printing `already gone on unchanged lines: 125 ... Mark each citation` beside `125 listed`.
- **The builder** (`D:/fitway-temp/tooling-branch-merge-checks/fix-1/BRIEF.md`): `a3e3db45` fixed the five; a planted
  return of the old filter fails its new test. It reported that `pnpm check:code-health` calls a raised test floor in
  the working baseline inflation, so the brief's order (regenerate, check, commit) cannot pass with a floor rise
  (F302). Its temporary revert, first tried from PowerShell with relative .NET paths, rewrote the coordinator's
  `cited-evidence.mjs` with identical bytes (its blob hash equals HEAD's).
- **The coordinator's change** `6d9459cb`: the pass line said `0 unlisted gone citations` beside a warning counting
  33 unlisted on the trial; it now counts unlisted citations on changed and on unchanged lines.
- **Found for the real merge:** the admission refuses while
  `design-research/owner-composition-exploration-r04/directions/NEXT-DIRECTION-BRIEF.md`, outside the giant root,
  stands 73 bytes over main's baseline (59,178 against 59,105); and the packet's pinned frame fails, the third problem
  of item 19.
- **CI repair:** the push of `94a8c560` failed CI (run 40850201319): the test "uses origin/main when a branch tracks
  its own remote copy" ran `git commit` without the fixture's identity, and CI has none; locally the user's global
  identity hid it. Reproduced with an empty global Git configuration, fixed in `f50fe990` (merge `9b9ce06f`), 40/40
  then.
- **Rows:** A1-A3 and K2 met at `6d9459cb`; K1 is the CI run on the push that carries `9b9ce06f`.
