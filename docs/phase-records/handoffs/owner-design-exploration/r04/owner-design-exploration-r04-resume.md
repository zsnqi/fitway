<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` after `9a7c6726`, 2026-10-13 19:50 +03:00 (findings labelled, DECISIONS 52; nothing running)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-52), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B12 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds now run on DeepSeek V4.1 Flash** through the user's Open Design subscription (WORKING_AGREEMENTS
  §"Delegation", 2026-10-13): the Codex CLI stays the harness; `pnpm codex:round <brief>` launches DeepSeek at `max`
  (`--model gpt-6.1-sol <level>` for GPT). The key is the user-level variable `OPENDESIGN_API_KEY` (never read or
  printed). Every DeepSeek call carries the route in `D:/fitway-temp/opendesign-smoke/route-args.txt`, a catalog the
  launcher builds per run from Codex's cached `gpt-5.5` entry, and hooks off (F151: the Impeccable hook's message
  makes Open Design refuse the request). The pre-launch review is DeepSeek at `max` reading the brief with the files
  its Read first and Decisions lines name (`codex-rounds.md` §"Evaluation: DeepSeek for the brief review").
  deepseek-route merged as `8dd8f8d8` (graded in `9da5739b`: brief 6/6, held-out 11/12; F150-F152).
- **Done earlier on 2026-10-13:** vf-speed merged `ebbfecd6`; vf-hold merged `f2c89624` (F143, F144 fixed; F148, F149
  found). Decision 50: Daily's light tuner goes, after shared-frame merges (it also ends F126). Decision 51: every
  page in the concept before any production move (Settings, Operations and Monitoring, the public crowd page, the
  front-desk screen, sign-in); the move's Product/Spec amendments and Readex Pro are accepted in principle. The
  demo's direction is private: `D:/fitway-private/demo-plan.md` (read it before any demo material).
- **The user's order of work (2026-10-13):** tool and testing fixes come before the next pages, since they make those
  pages faster and better; small design issues nobody sees wait until after the demo; anything visible that would
  make the demo look bad is fixed before it. Findings get two labels: who sees it (the owner on the page, our checks
  slowed, a check we cannot run yet, setup) and its effect on the demo (blocks it, lowers it, waits).
- **Owner screens:** Daily, Reports, Activity log and Access are built on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04, clean at `4352181f`). Previews: eclipse-build (3174), LAN (3180).

## Running now

The two GPT rounds stopped earlier today are not resumed on their threads (a GPT thread does not continue on
DeepSeek); each restarts fresh on DeepSeek, its brief naming what it inherits.

- **shared-frame** (DECISIONS 45), **running on DeepSeek at max since 2026-10-13 20:19** (its turn ended at 20:32 while it waited, F154; resumed
  on its thread at 20:33 with `resume-turn-ended-1.md`) in
  `D:/fitway-temp/codex-round-b041ea52-52cd-4d03-b04e-d70094731ffc`: brief
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-shared-frame-continue-2.md` (`56cb64a0`; it
  now names the incomplete record); review `D:/fitway-temp/brief-review/codex-shared-frame-continue-2-5`, five readings
  all left open with reasons (F153: four launches failed on review sources first). Old run folder
  `D:/fitway-temp/codex-round-c64dae1e-9642-4fe5-895f-dd761f7e71c4`; queue
  `D:/fitway-temp/owner-r04-shared-frame/matrix-vfhold-435.json` at 95 of 228 with one incomplete record. Held-out
  SH1-SH10 `D:/fitway-grader/owner-r04/shared-frame-heldout.md`. When it reports: write `free-for-vf-parallel.txt`,
  grade, record the review's dispositions in `codex-rounds.md`, merge, push.
- **launcher-fixes** (F150, F152, F153; DECISIONS 47), **running on DeepSeek at max since 2026-10-13 20:37** in
  `D:/fitway-temp/codex-round-fc867eb5-cb40-4189-92b2-d5274b8eb72e`, worktree
  D:/Projects/fitway-worktrees/owner-r04-launcher-fixes (branch `owner-r04-launcher-fixes` from `c97d564e`): brief
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-launcher-fixes.md` (`c30cac54`); review
  `D:/fitway-temp/brief-review/codex-launcher-fixes-1` (readings 2 and 4 closed, 1, 3, 5 left open; 1 is F155). No
  held-out suite yet: write one in `D:/fitway-grader/owner-r04/` before grading.
- **vf-parallel** (DECISIONS 48; F147): brief `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-parallel.md`
  (`00178ec4`); code committed `0fbad66d` in D:/Projects/fitway-worktrees/owner-r04-vf-parallel (pushed); P1-P3 and L1
  unmeasured until `D:/fitway-temp/owner-r04-ports/free-for-vf-parallel.txt` exists; its old run folder
  `D:/fitway-temp/codex-round-c9d939cf-0dbd-4bd8-ab8e-1b9a9eb7828e` holds `resume-ports-free-1.md`. Held-out VP1-VP11
  `D:/fitway-grader/owner-r04/vf-parallel-heldout.md`.

## Next steps

1. **Done:** the open findings carry the two labels (`seen_by`, `demo`; DECISIONS 52): none blocks the demo, all 27
   wait. The page lows outside the table, labelled the same way (all `owner` unless named; recorded at their rounds,
   N1 and N2 re-read in the build's code on 2026-10-13):
   - **lowers** (fix before the demo; they stay with each page's last round, DECISIONS 47): Reports' «معدّل الموجودين»
     card too empty (`#fig-avg`, DECISIONS 30); Access N1, the reset named «تعيين» on the row and «إعادة تعيين» in
     its result; N2, the done line's link opens «هذا السجل غير موجود في هذه العينة.»; N3, the records card sparse at
     1440.
   - **waits:** Access N4 (zero dot at 1x), N5 (721 English pairs wrap), N6 (lone last words), N7 (the code face
     loads on every visit); the Retry ring, OWN-C9's stale ring rule and the rail's ring on Access (keyboard only;
     already in the shared lows before Settings, DECISIONS 47); fix-3's observations 1, 2 and 4 (the components sheet
     only, `setup`).
2. **shared-frame on DeepSeek** (running, above). When it reports: write `free-for-vf-parallel.txt`; grade SH1-SH10
   and GH7; record; merge; push.
3. **vf-parallel on DeepSeek:** brief `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-parallel-continue.md`
   (it folds in `resume-ports-free-1.md`; a fresh launch sends only the brief), reviewed in
   `D:/fitway-temp/brief-review/codex-vf-parallel-continue-1` with dispositions written (reading 1 closed as R2, four
   left open). Launch `pnpm codex:round <brief>` once shared-frame reports and `free-for-vf-parallel.txt` exists, not
   before (all its open work needs the ports). At grading, time the 1-worker command with the CLI at `5493e888`, check
   each rerun's difference mask, and watch the listening ports while compares overlap (the readings left open); grade
   VP1-VP11; merge; CI.
4. **Remove the light tuner** (decision 50); then the **`reports.css` split** (draft
   `D:/fitway-temp/owner-r04-reports-css-draft/codex-reports-css-split-draft.md`); then the **tool fixes** F148, F140,
   F131, F132, F136, F149, F150, F152 (DECISIONS 47).
5. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).
6. After each resume point, fast-forward main once CI passes on it (DECISIONS 40).

## Waiting on the user

Nothing.

## Known risks

- **DeepSeek runs:** start load about 87k tokens (every tool schema; GPT's was about 27k), mostly cached; trimming it
  with a per-run setting is the coordinator's call (WORKING_AGREEMENTS). Open Design Go limits: $10 per 5 hours and
  $30 per 7 days of Design Plan credit, DeepSeek V4.1 Flash counted at half; a with-sources review reads about 1M
  tokens. Open Design names no host and no retention period. A thread whose history holds a hook message cannot resume.
- **F126** makes a full compare fail at random until the tuner goes; **F148** can leave a release sample NOT-HELD:
  rerun such an item once before reading it as a regression.
- **Briefs for refactors** need a limit that the moments still run along their timeline; `--timeline` measures it.
- **Temp junctions:** a grader that links old-CLI `node_modules` removes the link after.
- main has no branch protection; nothing deploys on a push to main. The main checkout D:/Projects/fitway keeps its local
  main at `bbb51709` and an uncommitted one-line AGENTS.md change from 2026-09-06; left untouched.
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9 (DECISIONS 33, 34).
- The preview server sends no cache headers; after a build, hard-reload. Ports: 3174 the user's preview; 3176-3177
  builders, verifiers and Codex; 3178-3179 reviewers and the probe kit; 3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that last changed this text.
- DeepSeek: smoke runs `D:/fitway-temp/opendesign-smoke/`; the round's runs `D:/fitway-temp/codex-round-deepseek-route-1`
  and `-2` (`REPORT.md`); its grading `D:/fitway-temp/owner-r04-deepseek-route-grade/`; review trials
  `D:/fitway-temp/brief-review-trial/l5/` and `D:/fitway-temp/brief-review-trial/l7/`; held-out rows and scoring in `D:/fitway-grader/owner-r04/`.
- Earlier grading evidence: `D:/fitway-temp/owner-r04-vf-hold-grade/`, `D:/fitway-temp/owner-r04-vf-speed-grade/`.
- GPT fallback: `bash D:/fitway-temp/resume-auto.sh <run folder> <message file>` switches saved Codex accounts.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
