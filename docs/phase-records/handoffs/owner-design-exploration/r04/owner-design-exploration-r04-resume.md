<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `00178ec4`, 2026-10-13 10:25 +03:00 (vf-hold graded and merged; vf-parallel launched; shared-frame resumed on the merged CLI; the Settings questions asked)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-49), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md`, and the brief rules B1-B12 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Owner screens.** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04; the shared-frame round's commits run to `4352181f` and on), with
  their motion and CSS rounds done (DECISIONS 36-44). The user reviews on the eclipse-build preview (3174) and the LAN
  preview (3180).
- **Done on 2026-10-13:** vf-speed merged as `ebbfecd6` (recorded `3faea886`): `--affected-pages`, kept baseline
  captures in `D:/fitway-verify-captures`, bounded connections, F137 fixed. vf-hold resumed after the night, fixed the
  PIN-save timeouts it found (`55a97093`) and delivered `7c8418fb`; graded VH1-VH8 all pass
  (`D:/fitway-temp/owner-r04-vf-hold-grade/`), merged as `f2c89624`, recorded `5493e888`: the timeline holds a press's
  release and the page's clocks (F143, F144 fixed; NOT-HELD on the base 37 to 0 over the four pages). Found: F148 (an
  SVG icon's edge in a scaling button varies one or two levels in a release's first 21 ms, so a sample can be
  NOT-HELD) and F149 (`--inputs keyboard` presses Enter, which never shows a press). Settings research digest:
  `D:/fitway-temp/owner-r04-settings-questions/REPORT.md` (10 settings, 8 conflicts C1-C8, questions Q1-Q10; its key
  citations checked by the coordinator).
- **Briefs launch through the review.** `pnpm codex:round <brief> <level>` runs the B11 review into
  `D:/fitway-temp/brief-review/<brief file name>-<n>/` and stops; write `dispositions.md` there (`Brief SHA-256: <hash>`,
  then `Reading <n>: closed` or `Reading <n>: left open: <why>`) and run it again (`REVIEW.md` §"Running it"). The brief
  must be committed first. The codex template must stay at 80 lines or fewer (`check-brief.test.ts:761`).
- **Resuming Codex:** `bash D:/fitway-temp/resume-auto.sh <run folder> <message file> [limit-first]` (from
  2026-10-13, the user: switch accounts automatically). It wraps `resume-any.sh` (gpt-6.1-sol, falling back to
  gpt-6-sol on "at capacity"); on a usage limit it switches to the next saved Codex account that is not limited and
  resumes at once, and with every account limited it waits for the earliest reset. Accounts: the user signs in to each
  once and runs `node D:/fitway-temp/codex-accounts.mjs save`; `list` shows them (profiles beside `auth.json` in
  `~/.codex/accounts/`; the Codex app shares the sign-in). Signing out revokes the account's saved token (401
  `token_revoked`, tested 2026-10-13), so accounts are added without signing out, through
  `D:/fitway-temp/codex-add-account.sh` (run with bash) (device code in a separate CODEX_HOME, opened in a private window). `resume-wait-limit.sh` (wait only) and the hand-over
  watcher `handover-to-auto.sh` are what the two runs started before it use. Each run folder's `model-switch.md` logs
  every account, model and wait.
- **main** is at `23752f84`; fast-forward it to this text's commit once CI passes on it. The discussion page
  of 2026-10-07 is dropped (the user, 2026-10-13, «اسحب على الصفحة خلاص»; its link no longer opened from this account):
  no more updates to it. access-reason-cap-r01 stays paused by the user.

## Running now

- **shared-frame, a fresh session** (DECISIONS 45, first item) since 14:50: brief
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-shared-frame-continue-2.md` (`d17164bb`, xhigh;
  review `D:/fitway-temp/brief-review/codex-shared-frame-continue-2-1/`, readings 1-4 closed, 5 left open), run folder
  `D:/fitway-temp/codex-round-c64dae1e-9642-4fe5-895f-dd761f7e71c4`. It continues from `4352181f` and the old
  session's records (95 of 228 jobs). The old thread below grew to about 48 MB and got "at capacity" or 503 on both
  models from 13:54, so its retries were stopped. The old session, resumed at 10:16 with `resume-after-pause-1.md` through
  `D:/fitway-temp/resume-wait-limit.sh` (it waits out a usage limit): thread `01a12f3c-a486-7681-a1f5-6b12abdbe87a`,
  run folder `D:/fitway-temp/codex-round-ef95d9e6-4736-49f6-8f7e-959e6eee78a8`, continuation brief
  `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/briefs/codex-shared-frame-continue.md`
  (`56ed8da6`, xhigh), worktree clean at `4352181f` at the resume. The message: the CLI changed (vf-speed, vf-hold),
  rerun the F3 timeline jobs finished before the pause, F2's finished ordinary compares stay valid, rerun an F126 or
  F148 item once and report an F148 sample NOT-HELD on the result side only for the coordinator. It holds 3176-3177
  (`D:/fitway-temp/owner-r04-ports/shared-frame-measuring.txt`). B11: `D:/fitway-temp/brief-review/shared-frame-*`;
  base check `D:/fitway-temp/owner-r04-shared-frame-base/summary.txt`; held-out SH1-SH10
  `D:/fitway-grader/owner-r04/shared-frame-heldout.md`.
- **vf-parallel, running** (DECISIONS 48; F147), launched 10:12 at xhigh: brief
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-parallel.md` (`00178ec4`, HEAD `5493e888`,
  one rerun allowed for F148 after the review), run folder `D:/fitway-temp/codex-round-c9d939cf-0dbd-4bd8-ab8e-1b9a9eb7828e`,
  thread `01a1341e-0ea2-7a71-8f60-73849e2670f7`, worktree D:/Projects/fitway-worktrees/owner-r04-vf-parallel. Its code
  and tests run now; its measurements wait for `D:/fitway-temp/owner-r04-ports/free-for-vf-parallel.txt`, which the
  coordinator writes when shared-frame's compares end. A usage limit on it: resume with `resume-wait-limit.sh` and
  `wait-first` when the user is away.

## Next steps

The order (the user, 2026-10-12, «موافق»): shared-frame finishes on the merged CLI and is graded, vf-parallel measures
and is graded, then `reports.css` and the shared lows, then Settings.

1. **When shared-frame reports:** write `free-for-vf-parallel.txt`; grade shared-frame on SH1-SH10 and GH7; record both
   runs, the pause and the model switches in `codex-rounds.md`; on a pass push the build branch and tell the user in a
   line.
2. **When vf-parallel reports:** grade it (write its held-out rows before its measurements land, in
   `D:/fitway-grader/owner-r04/`), record, merge, wait for CI.
3. **`reports.css` split** on the shared-frame result (draft `D:/fitway-temp/owner-r04-reports-css-draft/
   codex-reports-css-split-draft.md`, placeholders still open), then **the shared lows**: F126 and F148 first (render
   instabilities that make compares fail or INCOMPLETE at random), F140, F131, F132, F136, F149. The shared lows' digest:
   `D:/fitway-temp/shared-lows-prep/REPORT.md` (low 1 has no recorded frame: confirm first, now possible with the
   release held).
4. **Then Settings** on DECISIONS item 49: the skeleton (rounds item 8), then the one-pass build; then Operations and Monitoring (rounds items 6 and 8-11 in DECISIONS); later Daily
   and Reports' last round (`#fig-avg`, DECISIONS 30; `D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`; page-only lows)
   and Access's (N1-N7 in Next steps 4 of the 2026-10-05 resume point).
5. **After each resume point,** fast-forward main once CI passes on it (DECISIONS 40).
   Open: F146 (two Vitest cases over the 20 s default on CI: the launcher's and the gardener's H6; each passed on a
   rerun of the failed job).

## Waiting on the user

Nothing. The Settings questions Q1-Q10 were answered on 2026-10-13 (DECISIONS item 49: the user agreed with every
recommendation).

## Known risks

- **F126** makes a full compare fail at random (one to three Daily phone items on the Lights chip), and **F148** can
  leave a timeline sample NOT-HELD in a release's first 21 ms on an icon's edge: rerun such an item once before
  reading it as a regression.
- **Briefs for refactors** need a limit that the moments still run along their timeline; `--timeline` now measures it.
- **Codex** is 0.162.1 since 2026-10-12; GPT-6.1 Sol's catalog default context is 500k (max 872k); the user's
  `config.toml` pins neither the context nor the compaction limit (backups `D:/fitway-temp/codex-config-backup-20261012*.toml`).
- **Temp junctions:** the grading's old-CLI copies linked `node_modules` into a worktree; both junctions were removed
  on 2026-10-13. A grader that needs the old CLI again links it and removes the link after.
- main has no branch protection (a private repository on GitHub's free plan); nothing found deploys on a push to main.
  The main checkout D:/Projects/fitway keeps its local main at `bbb51709` and an uncommitted one-line AGENTS.md change
  from 2026-09-06; it was left untouched.
- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9; carry it to the
  later ADR with every Product/Spec amendment the concept made (DECISIONS 33, 34).
- The preview server (Python's http.server) sends no cache headers; after a build a stale script can throw until a hard
  reload; the verify-fitway launch serves with no-store.
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers and the probe kit;
  3180 the LAN preview; vf-parallel proposes 3186-3189 for two more compare pairs.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that last changed this text (it follows `00178ec4`).
- Grading evidence: `D:/fitway-temp/owner-r04-vf-hold-grade/` (runner `run.mjs`, queues, plants, recipes),
  `D:/fitway-temp/owner-r04-vf-speed-grade/` (runner `run.mjs`, verdict diff `cmp.mjs`, plants in
  `D:/fitway-temp/owner-r04-vf-speed-grade/plants/`), `D:/fitway-temp/owner-r04-midmotion-fix-grade/`,
  `D:/fitway-temp/owner-r04-gardener-grade/`; held-out rows and plants in `D:/fitway-grader/owner-r04/`; the
  researcher's map of the shared code:
  `D:/fitway-temp/shared-files-map/REPORT.md`; a rewrapping helper that keeps every word:
  `D:/fitway-temp/owner-r04-reports-css-draft/reflow.cjs`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
