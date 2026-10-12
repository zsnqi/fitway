<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `1e437f94`, 2026-10-12 08:41 +03:00 (step 1 and the gardener's list done; the
  shared-frame round running)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-47), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md`, and the brief rules B1-B12 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Owner screens.** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04, HEAD `32c1edcb`, the shared-frame brief on `7e28c713`), with
  their motion and CSS rounds done and Daily in its own files (DECISIONS 36-44). The user reviews on the
  eclipse-build preview (3174) and the LAN preview (3180).
- **Step 1 is done.** `compare --timeline` (F139) is merged (`ad9ea85f`): a sample is not held only when two
  same-side captures differ, and the real defect is caught on every moment it broke. Graded in `codex-rounds.md`
  §"midmotion-compare-fix". F119, F122, F130, F139, F141 and F142 are fixed. Still open for the verify-fitway round:
  F126 (Daily's drive frame alternates in the tuner chip), F143 (a pressed control's release is not held in its first
  200 ms, the rail's tiles under touch included), F144 (the page's real clock is not held: the export's timers are
  never comparable), F145 (the CLI suite has no per-test timeout; a stuck hold hangs it).
- **The gardener's shared-file list (F135) is done**, merged as `2e7a29cf` after one fix round (§"gardener-shared-files"
  and §"gardener-shared-files-fix"): shared means loaded by two or more pages, the components sheet excluded; at
  `7e28c713` the concept's boundary breaks are 11, all in `reports.css`, and the first weekly reading starts a new
  baseline. Held-out GH7 (the shared frame script appears in the list) is graded on the shared-frame result.
- **Briefs.** Before a Codex launch, Codex at max reviews the brief alone (B11, `REVIEW.md`); dispositions sit beside
  each review in `D:/fitway-temp/brief-review/<brief>-<n>/dispositions.md` and go into the round's record at grading.
  Every outcome's command is first run on the base against itself (B7).
- **main** is at `1e437f94`. The discussion page for the user (Arabic, private):
  https://claude.ai/artifact/88rd7XwoWHvnYhqbtxA1dm.
- access-reason-cap-r01 stays paused by the user (its own handoff says how to resume).

## Running now

- **The shared-frame round** (DECISIONS 45, first item): brief
  `design-research/owner-composition-exploration-r04/directions/briefs/codex-shared-frame.md` on the build branch
  (`32c1edcb`, xhigh), Codex thread `01a12ea0-d183-79f2-a924-d8800a524a53`, run folder
  `D:/fitway-temp/codex-round-017636a2-29af-44dd-b050-5468cfbdf5c7`, ports 3176-3177. Its B11 reviews:
  `D:/fitway-temp/brief-review/shared-frame-1/` and `-2/`. Its base check (every outcome's command, the base against
  itself): `D:/fitway-temp/owner-r04-shared-frame-base/summary.txt`. Held-out rows SH1-SH10:
  `D:/fitway-grader/owner-r04/shared-frame-heldout.md`.

## Next steps

The user's instructions for the night (2026-10-12) still hold: continue without them; a Codex usage limit is waited
out in the background and the run resumed on its thread; accounts are the user's.

1. **Grade the shared-frame round** on SH1-SH10 and GH7 with the merged CLI; on a pass, update INDEX-facing records,
   report its close to the user in a line (DECISIONS 45), push the build branch, and record it in `codex-rounds.md`.
2. **Then `reports.css` split** (DECISIONS 45, second item), its brief written from
   `D:/fitway-temp/shared-files-map/REPORT.md` §4 and §6, through B11 and a base check.
3. **Then, in DECISIONS 47's order, before Settings:** the shared lows (each checked with the mid-motion compare), the
   verify-fitway round (F131, F132, F136, F137 with F126 and F143-F145; the launch command running the B11 review;
   affected-page compares and reused base frames), F140.
4. **Then Settings**, Operations and Monitoring (rounds items 6 and 8-11 in DECISIONS).
5. **Daily and Reports' last round:** Reports' «معدّل الموجودين» card (`#fig-avg`, DECISIONS 30), fix-3's findings
   (`D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`), the page-only lows (DECISIONS 47).
6. **Access's last round:** N1-N7 in Next steps 4 of the 2026-10-05 resume point.
7. **After each resume point,** fast-forward main once CI passes on it (DECISIONS 40) and update the discussion page.

## Waiting on the user

Nothing.

## Known risks

- **Codex usage limits** stop runs often; each resumes on its thread (`pnpm codex:round resume <run folder>`).
- **Briefs for refactors** need a limit that the moments still run along their timeline; `--timeline` now measures it.
- **Long compares** can run out of Windows sockets (`ERR_NO_BUFFER_SPACE`, F137) and then fail a script load; briefs
  allow one rerun of such an item until the verify-fitway round fixes it.
- main has no branch protection (a private repository on GitHub's free plan); nothing found deploys on a push to main.
  The main checkout D:/Projects/fitway keeps its local main at `bbb51709` and an uncommitted one-line AGENTS.md change
  from 2026-09-06; it was left untouched.
- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9; carry it to the
  later ADR with every Product/Spec amendment the concept made (DECISIONS 33, 34).
- The preview server (Python's http.server) sends no cache headers; after a build a stale script can throw until a
  hard reload; the verify-fitway launch serves with no-store.
- Ports: 3174 is the user's preview; 3176-3177 builders, verifiers and Codex; 3178-3179 reviewers and the probe kit;
  3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that adds this text (parent `1e437f94`).
- Merged round worktrees, to remove with their branches once their node_modules links are checked:
  D:/Projects/fitway-worktrees/owner-r04-midmotion (`owner-r04-midmotion`) and
  D:/Projects/fitway-worktrees/owner-r04-gardener (`owner-r04-gardener`).
- Grading evidence: `D:/fitway-temp/owner-r04-midmotion-fix-grade/`, `D:/fitway-temp/owner-r04-gardener-grade/`; held-out
  rows and plants in `D:/fitway-grader/owner-r04/`; the researcher's map of the shared code:
  `D:/fitway-temp/shared-files-map/REPORT.md`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
