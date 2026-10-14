<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04`, 2026-10-14 11:15 +03:00 (handoff: the user starts a fresh session; nothing running; vf-parallel delivered `70cf9180` and is mid-grading)
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261007-103955-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 40-57), `docs/phase-records/handoffs/agent-environment/DECISIONS.md` (items 15, 19 and 29: the tools and the recipes), `docs/agent-context/WORKING_AGREEMENTS.md` (§"Delegation" changed on 2026-10-13), and the brief rules B1-B13 with `docs/agent-context/briefs/REVIEW.md`

## State

- **Codex's rounds run on DeepSeek V4.1 Flash** through the user's Open Design subscription (WORKING_AGREEMENTS
  §"Delegation"): `pnpm codex:round <brief>` runs the pre-launch review, stops for dispositions, then launches
  DeepSeek at `max` with hooks off (F151). The key is the user-level `OPENDESIGN_API_KEY` (never read or printed).
- **The user's order of work (2026-10-13):** tool and testing fixes before the next pages; small design issues nobody
  sees wait until after the demo; anything visible that would make the demo look bad is fixed before it. Findings
  carry `seen_by` and `demo` labels (decision 52). The demo's direction is private: `D:/fitway-private/demo-plan.md`.
- **Owner screens:** Daily, Reports, Activity log and Access on owner-followup-r04-build (worktree
  D:/Projects/fitway-worktrees/owner-followup-r04-s04, clean at `4352181f`). Previews: eclipse-build (3174), LAN (3180).
- **vf-parallel delivered `70cf9180`** on `owner-r04-vf-parallel` (`0fbad66d` parallel compares, `f3601821` fewer
  manifest rewrites, `70cf9180` compare skips the language sheets, about 59 s of serial work, which R5's breakdown
  found; F158 the SKILL.md line it left stale). Codex's report: every outcome PASS; P2 medians of three on a quiet
  machine, base against itself 917 s with 1 worker and 360 s with 4, result against base 922 s and 366 s, with kept
  captures 500 s and 221 s; the CLI at `5493e888` took 1,083 s. One F154 resume (`resume-turn-ended-1.md`).
- **vf-parallel's grading so far** (`D:/fitway-temp/owner-r04-vf-parallel-grade/queue.progress`; held-out rows
  `D:/fitway-grader/owner-r04/vf-parallel-heldout.md`): the coordinator's own timing, alone, `5493e888` with 1 worker
  1,136.6 s against `70cf9180` with 4 workers 375.0 s, the same 1,224 verdicts (3.0x). VP1, VP2, VP3, VP5, VP6, VP8,
  VP9 and VP10 pass (VP3 Activity: 8 problem items whose error text differs, the same verdicts). Open:
  - **VP4:** Activity's `g-dates-release` at 1 ms is NOT-HELD with 4 workers in `vp4-4` and its one rerun, EQUAL in
    `vp4-1`; two pixels at (831,98) on both sides, F148's calendar icon, also seen with 1 worker in vf-hold's VH1.
    Next: three alternating runs with 1 and 4 workers (B13) to see whether 4 workers raise its rate.
  - **VP7:** both writers started together (4 workers each, kept captures on, fresh baseline `D:/fitway-temp/owner-r04-vf-parallel-grade/concepts/vp7`) gave
    DIFFERENT on Reports `page`, `state=loading`, Arabic, desktop, reduced motion; the reader that reused their kept
    bundle and the cache-off run were EQUAL. Next: look at that item's frames and region in `D:/fitway-temp/owner-r04-vf-parallel-grade/runs/vp7-w1` and
    `D:/fitway-temp/owner-r04-vf-parallel-grade/runs/vp7-w2`; a load-sensitive capture of the loading state would fail P2's intent.
  - **VP11** not run: scope (`git diff --stat 5493e888 70cf9180`), the SKILL.md hunks only in §"Compare" and its port
    lines, recipe counts, CI on the pushed and the merged commit.
- **The pstack reading (decision 56):** nothing installed; `correct`'s method adopted, `benchmark-checklist` folded
  into B13 (three runs, more only where they could change the decision), B6 loosened (small causes may share a round
  when each has its own outcome and check), one report-only `no-comments` trial on the tool code.
- **Windows Update restarted the machine at 06:36** during grading (F159; the user's setting, never an agent's).

## Running now

Nothing. The user's Codex desktop app is open (its own `codex.exe` processes); nothing of the coordinator's runs.

DeepSeek ends runs early with a message and no tool call (F154; again on vf-parallel at 01:49): when a launcher exits,
read its last message before treating it as a report, and resume on the thread with a message naming where it
stopped (the `resume-turn-ended-1.md` beside vf-parallel's run folder is the form) until launcher-fixes-2's automatic resume lands.

## Next steps

1. **Finish vf-parallel's grading:** VP4 and VP7 as above, VP11; then record the round in `codex-rounds.md` and
   `rounds.tsv` (Codex's report is `D:/fitway-temp/codex-round-5baafff1-b258-4fcb-ae90-79f9d26e340d/last-message.md`;
   tokens 90.7M input, 90.0M cached, 129k output; start load 89,495), merge `owner-r04-vf-parallel`, push, CI.
2. **Then in parallel, each on its own pair or worktree:**
   - **launcher-fixes-2:** brief `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-launcher-fixes-2.md` (`c609e08b`), review
     `D:/fitway-temp/brief-review/codex-launcher-fixes-2-1` dispositioned for that hash; worktree
     `D:/Projects/fitway-worktrees/owner-r04-launcher-fixes-2` at `a14586fe` needs `pnpm install` first; held-out
     `D:/fitway-grader/owner-r04/launcher-fixes-2-heldout.md`.
   - **shared-frame's compares:** run `D:/fitway-temp/owner-r04-shared-frame-grade/queue.sh` with bash (SH1-SH3, SH6-SH8 on
     the merged CLI, 4 workers, pair 3186-3187; its SH6 recipes and the SH8 rail plant are beside it); SH9 with the
     probe kit; the F126 item's captures; record the round; merge its record (the build branch is already at `4352181f`).
   - **access-reason-cap-r01:** its blocker is gone (`eb87d094` removed the frontier check) and main never touched its
     files since `312bd861`. Merge `origin/main` into `claude/busy-bartik-858366` keeping main's ledger, start the
     `fitway-phase2-postgres` container, rerun its unit, integration and fast-ladder tests, an independent review,
     then merge; update its resume file and the ledger (coordinator).
3. **The tuner round** (decision 50) after shared-frame's grading: draft
   `D:/fitway-temp/owner-r04-tuner-removal-draft/codex-tuner-removal.md` (fill its HEAD, CLI, pair and environment
   block; review; it adds `.impeccable/config.json` at the build branch's root to the owned paths, F140). The live
   moments the tuner alone starts (a new reading, reset, crowd level up and down) stay reachable by a key press under a
   URL switch, nothing visible without it (coordinator, reported to the user on 2026-10-14).
4. **The other tool rounds before Settings:** the `reports.css` split (draft
   `D:/fitway-temp/owner-r04-reports-css-draft/codex-reports-css-split-draft.md`); the verify-fitway fixes F131,
   F132, F136, F148, F149 and F158 with a test pinning SKILL.md's claims to the CLI; the encoding round of decision 56
   (BOM check, the launcher's `MSYS_NO_PATHCONV` and `TEMP` guards, a B3 check, `CLAUDE.md`'s agent table against the
   definitions; each check proven on its real past mistake; and decision 57's outcome-and-limit count in `brief:check`
   with its threshold from the past rounds, then B6, B8 and B13 unfolded); the shared lows (decision 47); the `no-comments`
   report-only trial; the Claude Code replay (DECISIONS 53, `D:/fitway-temp/cc-replay-deepseek-route-2/STOPPED-2026-10-14.md`).
5. **Then the pages** (decisions 49 and 51): Settings (skeleton, then one pass), Operations and Monitoring, the public
   crowd page, the front-desk screen, sign-in; then the demo materials (private plan).
6. Fast-forward main once CI passes on this resume point's commit (DECISIONS 40).

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
- **Test leftovers:** 26 empty `.port-49xxx-lease` folders from 2026-10-13 in `D:/fitway-verify-captures`; check whether
  `70cf9180`'s suite still leaves them.
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
