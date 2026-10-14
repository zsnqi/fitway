<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-14 13:35 +03:00 (access-reason-cap-r01 closed DONE at `bfc23713`; launcher-fixes-2 and shared-frame's compares running)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-58), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds run on DeepSeek V4.1 Flash** through the user's Open Design subscription (WORKING_AGREEMENTS
  §"Delegation"): `pnpm codex:round <brief>` runs the pre-launch review, stops for dispositions, then launches
  DeepSeek at `max` with hooks off (F151). The key is the user-level `OPENDESIGN_API_KEY` (never read or printed).
- **The user's order of work (2026-10-13):** tool and testing fixes before the next pages; small design issues nobody
  sees wait until after the demo; anything visible that would make the demo look bad is fixed before it. Findings
  carry `seen_by` and `demo` labels (decision 52). The demo's direction is private: `D:/fitway-private/demo-plan.md`.
- **Owner screens:** Daily, Reports, Activity log and Access on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04, clean at `4352181f`). Previews: eclipse-build (3174), LAN (3180).
- **vf-parallel is merged** (`4910963a`; record in `codex-rounds.md` §"vf-parallel", row in `rounds.tsv`): port pairs,
  up to 4 workers per compare and kept captures per item (F147 fixed); the full compare 3.0x faster with 4 workers
  (coordinator's timing alone, 1,136.6 s against 375.0 s, the same 1,224 verdicts). Brief 12/12, held-out 10/11:
  VP4 partial on F148 (NOT-HELD in 5 of 5 runs with 4 workers, 2 of 4 with 1). New: F160 (Reports' and Access's
  loading proofs capture inside the 300 ms skeleton window, a false DIFFERENT under load; one kept reserve frame
  holds the skeleton), F161 (the tests' leftover lease folders).
- **access-reason-cap-r01 is DONE** (integrated `bfc23713`, closed `446bb9fa`): restarted by the coordinator, main
  merged in, the review's carry-over findings fixed after one added criterion (`b62594d3`); its resume file lists the
  follow-ups for the move to production (the password-reset form's pending Cancel among them).
- **The pstack reading (decision 56):** nothing installed; `correct`'s method adopted, `benchmark-checklist` folded
  into B13 (three runs, more only where they could change the decision), B6 loosened (small causes may share a round
  when each has its own outcome and check), one report-only `no-comments` trial on the tool code.
- **Windows Update restarted the machine at 06:36** during grading (F159; the user's setting, never an agent's).

## Running now

- **launcher-fixes-2** on DeepSeek, run folder `D:/fitway-temp/codex-round-caa1d3ee-9a68-4d12-be7a-d0448811e86c`
  (worktree `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-2`, from `a14586fe`).
- **shared-frame's compares** on 3186-3187 (`D:/fitway-temp/owner-r04-shared-frame-grade/queue.sh`, progress in
  `queue.progress`), then `control.sh` (the tuner items, base against itself and result against base, twice).
  Classifier: `node D:/fitway-temp/owner-r04-shared-frame-grade/sf-classify.mjs <run>...` (a difference is F126 when
  every cluster is the Daily Lights chip's 119x28 box, its "Lights" text or noise inside it). SH1 so far: Daily and Reports
  have no DIFFERENT outside the chip and the tuner panel; the touch press at 1 ms is NOT-HELD on base and result alike
  (the whole pressed control, not F148's icon edge; a finding when the round is recorded).

DeepSeek ends runs early with a message and no tool call (F154; again on vf-parallel at 01:49): when a launcher exits,
read its last message before treating it as a report, and resume on the thread with a message naming where it
stopped (the `resume-turn-ended-1.md` beside vf-parallel's run folder is the form) until launcher-fixes-2's automatic resume lands.

## Next steps

1. CI on this resume point's commit, then fast-forward main to it.
2. **In parallel, each on its own pair or worktree:**
   - **launcher-fixes-2:** when it reports, read its last message (F154), then grade it with
     `D:/fitway-grader/owner-r04/launcher-fixes-2-heldout.md`; record and merge.
   - **shared-frame's compares:** when `queue.sh` and `control.sh` finish, classify SH2, SH3 and SH6-SH8 the same way,
     read the control, run SH9 with the probe kit, look at the F126 item's captures; record the round (with the touch
     press finding) and merge its record (the build branch is already at `4352181f`).
3. **The tuner round** (decision 50) after shared-frame's grading: draft
   `D:/fitway-temp/owner-r04-tuner-removal-draft/codex-tuner-removal.md` (fill its HEAD, CLI, pair and environment
   block; review; it adds `.impeccable/config.json` at the build branch's root to the owned paths, F140). The live
   moments the tuner alone starts (a new reading, reset, crowd level up and down) stay reachable by a key press under a
   URL switch, nothing visible without it (coordinator, reported to the user on 2026-10-14).
4. **The other tool rounds before Settings:** the `reports.css` split (draft
   `D:/fitway-temp/owner-r04-reports-css-draft/codex-reports-css-split-draft.md`); the verify-fitway fixes F131,
   F132, F136, F148 (checked with 4 workers), F149, F158, F160 and F161 with a test pinning SKILL.md's claims to the
   CLI; the encoding round of decision 56
   (F129 twice: K1 checks the frontier against the packets, and main moves only through a command that refuses a commit
   without a green CI run; BOM check, the launcher's `MSYS_NO_PATHCONV` and `TEMP` guards, a B3 check, `CLAUDE.md`'s agent table against the
   definitions; each check proven on its real past mistake; and decision 57's outcome-and-limit count in `brief:check`
   with its threshold from the past rounds, then B6, B8 and B13 unfolded); the shared lows (decision 47); the `no-comments`
   report-only trial. The Claude Code replay is deferred (DECISIONS 58); its worktree
   `D:/Projects/fitway-worktrees/owner-r04-cc-replay` (uncommitted launcher edits, not needed) can be removed once
   its `node_modules` is checked for a junction and unlinked first.
5. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).

## Waiting on the user

Nothing. Optional, the user's call: Windows Update's active hours or a pause on nights when rounds run (F159).

## Known risks

- **DeepSeek runs:** start load about 89k tokens, mostly cached; Open Design credit is not a constraint (DECISIONS 53).
  A thread whose history holds a hook message cannot resume.
- **F126** makes a full compare fail at random until the tuner goes; **F148** can leave a release sample NOT-HELD:
  rerun such an item once before reading it as a regression.
- **Timed outcomes need a quiet machine** (B13): no other round, ladder or replay beside them.
- **Temp junctions:** the vf-parallel grader's link `D:/fitway-temp/owner-r04-vf-parallel-grade/cli-5493e888/node_modules` was removed; relink it to time the old
  CLI again, then remove it (never with a recursive delete).
- **Test leftovers (F161):** every verify-fitway suite run leaves empty `.port-<port>-lease` folders in
  `D:/fitway-verify-captures` (713 so far); harmless to verdicts, and its fix clears them.
- main has no branch protection; nothing deploys on a push to main. The main checkout D:/Projects/fitway keeps its local
  main at `bbb51709` and an uncommitted one-line AGENTS.md change from 2026-09-06; left untouched.
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to DESIGN_GUIDE.md §9 (DECISIONS 33, 34).
- Ports: 3174 the user's preview; 3176-3177, 3186-3187 and 3188-3189 the verification pairs (the CLI refuses others
  and a busy pair); 3178-3179 reviewers and the probe kit; 3180 the LAN preview.

## Pointers

- Worktree: D:/Projects/fitway-worktrees/owner-design-exploration-r04, branch codex/owner-redesign-r04, expected HEAD the
  commit that last changed this text.
- pstack reading (decision 56): GitHub cursor/plugins at `ce649c03` and michael-denyer/pstack-claude at `94f5ce95`;
  the coordinator's copies of the skills it read are in the session scratchpad only, so read them again upstream.
- Grading evidence: `D:/fitway-temp/owner-r04-vf-parallel-grade/`, earlier `D:/fitway-temp/owner-r04-vf-hold-grade/`
  and `D:/fitway-temp/owner-r04-vf-speed-grade/` (the `7e28c713` and `4352181f` extracts).
- GPT fallback: `bash D:/fitway-temp/resume-auto.sh <run folder> <message file>` switches saved Codex accounts.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
