<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `19768edc`, 2026-10-13 03:50 +03:00 (handoff: vf-speed graded and merged; vf-hold stopped mid-measurement at the user's request; the PC shut down for the night)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-48), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md`, and the brief rules B1-B12 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Owner screens.** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04; the shared-frame round's commits run to `4352181f` and on), with
  their motion and CSS rounds done (DECISIONS 36-44). The user reviews on the eclipse-build preview (3174) and the LAN
  preview (3180).
- **Done on 2026-10-13:** vf-speed graded (held-out VS1-VS10 in `D:/fitway-grader/owner-r04/vf-speed-heldout.md`,
  evidence `D:/fitway-temp/owner-r04-vf-speed-grade/`) and merged as `ebbfecd6`, recorded `3faea886`: compares can
  take only the pages a change reaches (`--affected-pages`), kept baseline captures in `D:/fitway-verify-captures`
  (content-keyed, 1.1 GB), bounded connections; F137 fixed (a full compare of 1,224 items, no `ERR_NO_BUFFER_SPACE`).
  The grading found F126 (Daily's Lights chip on the phone, half a pixel apart) now fails full compares at random with
  any CLI, and F147 (kept captures keyed on the whole option set and the baseline port). The codex template gained a
  checklist line: CI runs the ladder without Playwright Chromium or ui-forensics (`14fafda7`; both tool rounds' first
  pushes failed CI for it).
- **Briefs launch through the review.** `pnpm codex:round <brief> <level>` runs the B11 review into
  `D:/fitway-temp/brief-review/<brief file name>-<n>/` and stops; write `dispositions.md` there (`Brief SHA-256: <hash>`,
  then `Reading <n>: closed` or `Reading <n>: left open: <why>`) and run it again (`REVIEW.md` §"Running it"). The brief
  must be committed first. The codex template must stay at 80 lines or fewer (`check-brief.test.ts:761`).
- **Resuming Codex:** `bash D:/fitway-temp/resume-any.sh <run folder> <message file>` resumes on gpt-6.1-sol and falls
  back to gpt-6-sol on "at capacity"; it exits 75 on a usage limit (the user switches the account). When the user is
  away, a limit waits for its reset instead (the user, 2026-10-13): `bash D:/fitway-temp/resume-wait-limit.sh <run
  folder> <message file> [wait-first]` wraps `resume-any.sh`, waits until Codex's "try again at" time plus five
  minutes, and resumes with `D:/fitway-temp/resume-after-limit-wait.md`. Each run folder's `model-switch.md` records
  the events per model.
- **main** is at `3c5c311b` and is fast-forwarded to `23752f84` with this handoff (CI passed on it). The discussion page
  of 2026-10-07 is dropped (the user, 2026-10-13, «اسحب على الصفحة خلاص»; its link no longer opened from this account):
  no more updates to it. access-reason-cap-r01 stays paused by the user.

## Running now

- **vf-hold, stopped mid-measurement** (H1 F143, H2 F144; brief
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-hold.md`, xhigh, worktree
  D:/Projects/fitway-worktrees/owner-r04-vf-hold, clean at `452030fb`, CI green). Its measurement resume (02:11,
  `resume-measure-1.md`) was stopped by the coordinator at 03:47 at the user's request (the PC shut down); the thread
  is intact, the ports file `D:/fitway-temp/owner-r04-ports/free-for-vf-hold.txt` still holds. Done before the stop:
  H1's release plants all DIFFERENT (134 samples, no NOT-HELD), H2's Reports self-run 120 of 120 EQUAL, the 560 ms
  plant DIFFERENT (46 samples, exit 1). **Found at the stop:** in H2's four-page comparison, Access under
  `b7331e09` gave 358 EQUAL and 6 NOT-HELD, but under vf-hold's CLI six PIN-save features timed out (a regression of
  the clock hold, not yet traced). Its last messages: `D:/fitway-temp/codex-round-vf-hold-1/progress-at-stop.md`.
  Held-out rows VH1-VH8 are in `D:/fitway-grader/owner-r04/vf-hold-heldout.md`.
- **shared-frame, paused** (DECISIONS 45, first item): thread `01a12f3c-a486-7681-a1f5-6b12abdbe87a`, run folder
  `D:/fitway-temp/codex-round-ef95d9e6-4736-49f6-8f7e-959e6eee78a8`, continuation brief
  `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/briefs/codex-shared-frame-continue.md`
  (`56ed8da6`, xhigh). Worktree clean at `4352181f`; 21 of 183 queue jobs done, 162 pending in its queue scripts in
  `D:/fitway-temp/owner-r04-shared-frame/`. Its compares call the CLI in this worktree, so it resumes on the merged CLI.
  B11: `D:/fitway-temp/brief-review/shared-frame-*`; base check `D:/fitway-temp/owner-r04-shared-frame-base/summary.txt`;
  held-out SH1-SH10 `D:/fitway-grader/owner-r04/shared-frame-heldout.md`.
- **vf-parallel, ready to launch** (DECISIONS 48; F147): brief `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-parallel.md` (`23752f84`), worktree
  D:/Projects/fitway-worktrees/owner-r04-vf-parallel (same-named branch at `3faea886`, pushed; packages installed).
  Its review (`D:/fitway-temp/brief-review/codex-vf-parallel-1/`) returned five readings, all closed in the brief;
  `dispositions-draft.md` there holds them and waits for the final hash.

## Next steps

The order (the user, 2026-10-12, «موافق»): vf-hold measures and merges, shared-frame resumes on the merged CLI and is
graded, then the parallel-compare round, then `reports.css` and the shared lows.

1. **Resume vf-hold:** run `D:/fitway-temp/resume-any.sh` with the run folder `D:/fitway-temp/codex-round-vf-hold-1` and the message `D:/fitway-temp/codex-round-vf-hold-1/resume-after-stop-1.md`
   in a background shell (the message tells it to trace and fix the PIN-save timeouts with a test, then rerun H2 on
   the four pages under both CLIs and every measurement its fix can change). Then **grade vf-hold** when it reports: its brief rows and VH1-VH8 (VH6-VH7 on the merged line); record it in
   `codex-rounds.md`, `rounds.tsv` and `findings.tsv` (F143, F144); merge it, adding its proposed SKILL.md §"Compare"
   lines (in its report, `last-message.md`); wait for CI.
2. **vf-parallel:** move its worktree's branch to the vf-hold merge, set that HEAD in the brief (its L1 names
   `timeline-hold.test.mjs`, which exists only after the merge; drop that name if vf-hold fails), commit, rename
   `dispositions-draft.md` to `dispositions.md` with the new SHA-256, and launch at xhigh. Its code and tests run
   while shared-frame measures; its measurements wait for `free-for-vf-parallel.txt`.
3. **Resume shared-frame** after the vf-hold merge (`resume-any.sh`; tell it the CLI changed, the cache and
   `--affected-pages` exist, and that F126 can make one to three Daily phone items DIFFERENT on the Lights chip, to be
   rerun once), and grade it on SH1-SH10 and GH7; record both runs, the pause and the model switches in
   `codex-rounds.md`; on a pass push the build branch and tell the user in a line. Then grade and merge vf-parallel.
4. **`reports.css` split** on the shared-frame result (draft `D:/fitway-temp/owner-r04-reports-css-draft/
   codex-reports-css-split-draft.md`, placeholders still open), then **the shared lows**, F126 first (it fails full
   compares at random), F140, and F131, F132, F136. The shared lows' digest: `D:/fitway-temp/shared-lows-prep/REPORT.md`
   (low 1 has no recorded frame: confirm first).
5. **Then Settings**, Operations and Monitoring (rounds items 6 and 8-11 in DECISIONS); later Daily and Reports' last
   round (`#fig-avg`, DECISIONS 30; `D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`; page-only lows) and Access's
   (N1-N7 in Next steps 4 of the 2026-10-05 resume point).
6. **After each resume point,** fast-forward main once CI passes on it (DECISIONS 40).
   Open: F146 (two Vitest cases over the 20 s default on CI: the launcher's and the gardener's H6; each passed on a
   rerun of the failed job).

## Waiting on the user

Nothing.

## Known risks

- **F126** makes a full compare fail at random (one to three Daily phone items on the Lights chip): rerun such an item
  once before reading it as a regression.
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
  commit that last changed this text (it follows `a3957f6f`).
- Grading evidence: `D:/fitway-temp/owner-r04-vf-speed-grade/` (runner `run.mjs`, verdict diff `cmp.mjs`, plants in
  `D:/fitway-temp/owner-r04-vf-speed-grade/plants/`), `D:/fitway-temp/owner-r04-midmotion-fix-grade/`,
  `D:/fitway-temp/owner-r04-gardener-grade/`; held-out rows and plants in `D:/fitway-grader/owner-r04/`; the
  researcher's map of the shared code:
  `D:/fitway-temp/shared-files-map/REPORT.md`; a rewrapping helper that keeps every word:
  `D:/fitway-temp/owner-r04-reports-css-draft/reflow.cjs`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
