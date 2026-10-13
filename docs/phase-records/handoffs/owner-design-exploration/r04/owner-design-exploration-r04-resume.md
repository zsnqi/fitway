<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-14 00:55 +03:00 (handoff: the user asked for fresh sessions; nothing running; vf-parallel stopped on `f3601821` with a fresh brief)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-54), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B12 with `docs/agent-context/briefs/REVIEW.md`

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
- **Done on the evening of 2026-10-13:** launcher-fixes merged as `47d233b2` (6/6, held-out 9/10; F150, F152, F153 fixed; F156 the test gap).
- **shared-frame** reported at 22:19: 237 of 237 jobs, every F3 difference inside F126 (69 samples) or F148 (21), one
  F126 item DIFFERENT after its rerun (Daily's tuner chip, `tuner-speed-reset`, English phone, 1 ms), no code change
  (result `4352181f`). DeepSeek cannot view images, so no frame was looked at by the model. Graded so far: SH5, SH10
  (folder only, its history file and evidence folder unchanged) and GH7 pass; SH4 partial (the four pages define the frame
  once; `components.js` keeps its own copy of three frame words from the base, outside the brief's cause). SH1-SH3 and
  SH6-SH9 need compares: run them after vf-parallel merges, on a pair it frees, with 4 workers; then the coordinator
  looks at the F126 item's captures, records the round, merges, pushes.
- **The environment block** in every brief template says a message without a tool call ends the run (`0361d77e`), a
  mitigation of F154, not a proven fix (the replay's brief said so and it still ended early seven times).
- **Claude Code on DeepSeek works** through Open Design's Anthropic route (DECISIONS 53): `--bare`, auto permission
  mode, `deepseek-v4.1-flash[1m]` for a 1M window (the model's own; without the suffix Claude Code gives an unknown
  model 200k), and `CLAUDE_CODE_MAX_OUTPUT_TOKENS=128000` (its default for an unknown model is 32K). A local echo
  server showed it sends `output_config.effort` and adaptive thinking with display omitted (hence the empty thinking
  blocks); three low and three max runs suggest the level reaches DeepSeek. Launch scripts run under the user's
  allow rule for the launch scripts in the cc- folders under D:/fitway-temp, in this worktree (DECISIONS 53).

## Running now

Nothing. Both DeepSeek runs were stopped at about 00:44 on 2026-10-14 at the user's request (DECISIONS 54), their
process trees killed and the ports free; each left a `STOPPED-2026-10-14.md` with its state.

DeepSeek ends runs early with a message and no tool call, under Codex and Claude Code alike (F154; nine times on
2026-10-13): when a launcher exits, read its last message before treating it as a report, and resume on the thread
with a message naming where it stopped (`resume-turn-ended-*.md` and `message.md` beside each run are the form). The
replay's `D:/fitway-temp/cc-replay-deepseek-route-2-auto/launch.sh` resumes on its own until a report; the Codex launcher does not yet.

## Next steps

1. **vf-parallel in a fresh Codex session** (DECISIONS 54): brief
   `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-parallel-continue-2.md` on `f3601821`
   (it reads `D:/fitway-temp/owner-r04-vf-parallel/STOPPED-2026-10-14.md`). Run its review (`pnpm codex:round
   <brief>`), dispositions, launch, and run nothing else on the machine while it times P2. Then grade VP1-VP11
   (`D:/fitway-grader/owner-r04/vf-parallel-heldout.md`) with the checks the first review left open (time the 1-worker
   command with the CLI at `5493e888`, check each rerun's difference mask, watch the listening ports while compares
   overlap); merge; CI. On `0fbad66d`, under load, P2 was 1.91x (self) and 2.11x (result against base).
2. **shared-frame's compares** (SH1-SH3, SH6-SH9) on the merged CLI with 4 workers on a free pair; the F126 item's
   captures; record the round in `codex-rounds.md` (graded so far under State); merge `4352181f`'s round record; push.
3. **The Claude Code replay** (DECISIONS 53): resume session `33b78d33-32c0-4382-9cee-06544d23d9ed` with
   `D:/fitway-temp/cc-replay-deepseek-route-2-auto/launch.sh`, or restart fresh from `4a151786` for a clean count;
   then grade DR1-DR12 against Codex's 6/6 and 11/12, counting each resume as an intervention (seven so far,
   `D:/fitway-temp/cc-replay-deepseek-route-2/STOPPED-2026-10-14.md`). Never run it while another round times.
4. **Remove the light tuner** (decision 50); then the **`reports.css` split** (draft
   `D:/fitway-temp/owner-r04-reports-css-draft/codex-reports-css-split-draft.md`); then the **tool fixes** F148, F140,
   F131, F132, F136, F149 and F156 (DECISIONS 47); F154's harness side (an automatic resume when a run ends without
   its report) is worth a launcher change if the environment line does not stop it.
5. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).
6. After each resume point, fast-forward main once CI passes on it (DECISIONS 40).

## Waiting on the user

Nothing.

## Known risks

- **DeepSeek runs:** start load about 87k tokens (every tool schema; GPT's was about 27k), mostly cached; trimming it
  with a per-run setting is the coordinator's call (WORKING_AGREEMENTS). Open Design credit is not a constraint
  (the user, 2026-10-13: run in parallel without weighing it, DECISIONS 53). Open Design names no host and no
  retention period. A thread whose history holds a hook message cannot resume.
- **F126** makes a full compare fail at random until the tuner goes; **F148** can leave a release sample NOT-HELD:
  rerun such an item once before reading it as a regression.
- **Briefs for refactors** need a limit that the moments still run along their timeline; `--timeline` measures it.
- **Temp junctions:** a grader that links old-CLI `node_modules` removes the link after.
- main has no branch protection; nothing deploys on a push to main. The main checkout D:/Projects/fitway keeps its local
  main at `bbb51709` and an uncommitted one-line AGENTS.md change from 2026-09-06; left untouched.
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9 (DECISIONS 33, 34).
- The preview server sends no cache headers; after a build, hard-reload. Ports: 3174 the user's preview; 3176-3177
  builders, verifiers and Codex; 3178-3179 reviewers and the probe kit; 3180 the LAN preview.

- **Timed outcomes need a quiet machine:** run no other round, ladder or replay while a round times (vf-parallel's
  P2 timings on 2026-10-13 ran beside the Claude Code replay, DECISIONS 54).

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that last changed this text.
- DeepSeek: smoke runs `D:/fitway-temp/opendesign-smoke/`; the round's runs `D:/fitway-temp/codex-round-deepseek-route-1`
  and `-2` (`REPORT.md`); its grading `D:/fitway-temp/owner-r04-deepseek-route-grade/`; review trials
  `D:/fitway-temp/brief-review-trial/l5/` and `D:/fitway-temp/brief-review-trial/l7/`; held-out rows and scoring in `D:/fitway-grader/owner-r04/`.
- Earlier grading evidence: `D:/fitway-temp/owner-r04-vf-hold-grade/`, `D:/fitway-temp/owner-r04-vf-speed-grade/`.
- GPT fallback: `bash D:/fitway-temp/resume-auto.sh <run folder> <message file>` switches saved Codex accounts.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
