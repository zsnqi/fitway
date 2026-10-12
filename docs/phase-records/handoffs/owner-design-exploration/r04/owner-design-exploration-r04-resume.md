<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `906e9a51`, 2026-10-12 20:25 +03:00 (handoff to a new coordinator session; shared-frame measuring)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-48), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md`, and the brief rules B1-B12 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Owner screens.** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04; the shared-frame round's commits run to `4352181f` and on), with
  their motion and CSS rounds done (DECISIONS 36-44). The user reviews on the eclipse-build preview (3174) and the LAN
  preview (3180).
- **Done on 2026-10-12:** F145 (`b7331e09`: a 120 s per-test timeout, every verify-fitway test file run; the ledger
  leases that `package.json` line); the launch-review round (merged `cf2f8a2a`, recorded `14ecfceb`); DECISIONS 48
  (parallel work, the capacity fallback, a parallel-compare round after vf-speed). F135 was done before (`2e7a29cf`).
- **Briefs now launch through the review.** `pnpm codex:round <brief> <level>` runs the B11 review into
  `D:/fitway-temp/brief-review/<brief name>-<n>/` and stops; write `dispositions.md` there (`Brief SHA-256: <hash>`,
  then `Reading <n>: closed` or `Reading <n>: left open: <why>`) and run it again (`REVIEW.md` §"Running it"). Every
  outcome's command is first run on the base against itself (B7). A brief's measurements must be run: briefs say a
  measurement not run is a FAIL.
- **Resuming Codex:** `bash D:/fitway-temp/resume-any.sh <run folder> <message file>` resumes on gpt-6.1-sol through
  `codex:round` and falls back to gpt-6-sol on the same thread on "at capacity"; it exits 75 on a usage limit, which
  the user clears by switching the account (they switch quickly; four parallel rounds use one in 35-60 minutes). Each
  run folder's `model-switch.md` records which events ran on which model.
- **Measurements queue on one port pair** (the CLI accepts only 3176-3177), so rounds build in parallel and measure one
  at a time. Port exhaustion is not F137's cause (at most 739 of 16,384 dynamic ports in use, 2026-10-12).
- **main** is at `1e437f94`. The discussion page for the user (Arabic, private):
  https://claude.ai/artifact/88rd7XwoWHvnYhqbtxA1dm. access-reason-cap-r01 stays paused by the user.

## Running now

- **shared-frame, second run** (DECISIONS 45, first item): thread `01a12f3c-a486-7681-a1f5-6b12abdbe87a`, run folder
  `D:/fitway-temp/codex-round-ef95d9e6-4736-49f6-8f7e-959e6eee78a8`, continuation brief
  `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/briefs/codex-shared-frame-continue.md`
  (`56ed8da6`, xhigh; the round's brief `codex-shared-frame.md` beside it). The full matrices found and fixed
  four real omissions of the move (`d5c0d101`, `1a87ea72`, `8a0f269b`, `c609022b`) and F1's last copies
  (`8ee417a6`, `4352181f`); at about 20:00 it froze the source and reran F2 and F3 on it. It ends when
  `last-message.md` is newer than `resume-after-limit.md` and its events stop. Its first run, the saved patch and the
  model switches: `model-switch.md` there. B11: `D:/fitway-temp/brief-review/shared-frame-*`; base check
  `D:/fitway-temp/owner-r04-shared-frame-base/summary.txt`; held-out rows SH1-SH10
  `D:/fitway-grader/owner-r04/shared-frame-heldout.md`.
- **vf-speed** (S1 affected pages, S2 kept base frames, S3 F137) and **vf-hold** (H1 F143, H2 F144): briefs in
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/` (`codex-vf-speed.md`, `codex-vf-hold.md`), xhigh,
  worktrees D:/Projects/fitway-worktrees/owner-r04-vf-speed and owner-r04-vf-hold (same-named branches, pushed). Code
  and CI-safe tests are done and CI is green (`bdacf8c1`, `452030fb`); their live measurements were not run, because
  each waits for `D:/fitway-temp/owner-r04-ports/free-for-<round>.txt`. Their turns have ended: each is resumed with
  a message to run its measurements once its file exists. Run folders `D:/fitway-temp/codex-round-vf-speed-1` and
  `codex-round-vf-hold-1`; B11 in `D:/fitway-temp/brief-review/vf-speed-1/` and `D:/fitway-temp/brief-review/vf-hold-1/`.
  vf-hold's report proposes lines for SKILL.md §"Compare" (the coordinator adds them at merge).
- **Prepared:** the tool digest `D:/fitway-temp/verify-fitway-round-prep/REPORT.md` (with the port measurement); the
  shared lows' digest `D:/fitway-temp/shared-lows-prep/REPORT.md` (low 1 has no recorded frame: confirm first); the
  `reports.css` draft `D:/fitway-temp/owner-r04-reports-css-draft/codex-reports-css-split-draft.md`.

## Next steps

The user (2026-10-12): the rounds after the current Codex run go to a new coordinator session; continue without them;
accounts are theirs. The order they agreed: finish shared-frame, then vf-speed, then the parallel-compare round, then
`reports.css` and the shared lows.

1. **When shared-frame ends:** write `D:/fitway-temp/owner-r04-ports/shared-frame-result.txt` (its result SHA), grade it
   on SH1-SH10 and GH7 with the merged CLI, record both runs, the model switches and every B11 disposition in
   `codex-rounds.md`; on a pass push the build branch and report its close to the user in a line (DECISIONS 45).
2. **vf-speed:** write `free-for-vf-speed.txt` once no other compare runs, resume its thread to run S1-S3 and L1, grade,
   merge. Then vf-hold the same way (`free-for-vf-hold.txt`).
3. **The parallel-compare round** (DECISIONS 48): a port pair per round and one compare over several workers.
4. **`reports.css` split** on the shared-frame result, then **the shared lows**, F140, and F131, F132, F136, F126.
5. **Then Settings**, Operations and Monitoring (rounds items 6 and 8-11 in DECISIONS); later Daily and Reports' last
   round (`#fig-avg`, DECISIONS 30; `D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`; page-only lows) and Access's
   (N1-N7 in Next steps 4 of the 2026-10-05 resume point).
6. **After each resume point,** fast-forward main once CI passes on it (DECISIONS 40) and update the discussion page.
   Open: F146 (a launcher test at 28.4 s against 20 s on CI run 38250368308); F110's edge test failed once on CI
   timing (run 38273918030) and passed on a rerun.

## Waiting on the user

Nothing.

## Known risks

- **Briefs for refactors** need a limit that the moments still run along their timeline; `--timeline` now measures it.
- **Codex** is 0.162.1 since 2026-10-12 (the user updated it); GPT-6.1 Sol's catalog default context is 500k (max
  872k), and the user's `config.toml` no longer pins 400k (backup `D:/fitway-temp/codex-config-backup-20261012.toml`).
  Its `model_auto_compact_token_limit = 350000` was removed too, at the user's request (backup `-b.toml` beside it).
- **Long compares** can fail with `ERR_NO_BUFFER_SPACE` (F137); briefs allow one rerun of such an item until vf-speed merges.
- main has no branch protection (a private repository on GitHub's free plan); nothing found deploys on a push to main.
  The main checkout D:/Projects/fitway keeps its local main at `bbb51709` and an uncommitted one-line AGENTS.md change
  from 2026-09-06; it was left untouched.
- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9; carry it to the
  later ADR with every Product/Spec amendment the concept made (DECISIONS 33, 34).
- The preview server (Python's http.server) sends no cache headers; after a build a stale script can throw until a hard
  reload; the verify-fitway launch serves with no-store.
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers and the probe kit;
  3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that adds this text (parent `906e9a51`).
- The merged round worktrees owner-r04-midmotion and owner-r04-gardener and their branches were removed on 2026-10-12
  (links checked first; none pointed outside them).
- Grading evidence: `D:/fitway-temp/owner-r04-midmotion-fix-grade/`, `D:/fitway-temp/owner-r04-gardener-grade/`; held-out
  rows and plants in `D:/fitway-grader/owner-r04/`; the researcher's map of the shared code:
  `D:/fitway-temp/shared-files-map/REPORT.md`; a rewrapping helper that keeps every word:
  `D:/fitway-temp/owner-r04-reports-css-draft/reflow.cjs`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
