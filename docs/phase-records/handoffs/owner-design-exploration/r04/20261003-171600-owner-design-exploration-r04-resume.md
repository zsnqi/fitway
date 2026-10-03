<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this file, 2026-10-03 17:16 +03:00; `owner-followup-r04-build` at `41a6f7c`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261003-154200-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **The user picked every open option** (DECISIONS.md items 16-20, all 2026-10-03): English tables option B,
  figures flush on the edge, with Arabic's peak times aligned too (16); no explanation of the line (17); the usual day
  (18); copy round 2 (19); a phone design round for Daily (20). D6's shorter English labels are the coordinator's
  delegated pick, R2 (16).
- **New working agreement:** "Rules and findings" in `docs/agent-context/WORKING_AGREEMENTS.md`: a problem or
  observation is never let pass because the work meets a rule. Every Owner definition and the verifier, designer and
  builder templates carry it.
- **`rtl-ltr-reviewer`** (`.claude/agents/rtl-ltr-reviewer.md`) is available in sessions.
- **The decision page** for the user: https://claude.ai/artifact/VKg8eHqmBg8LJdSVeeBBM2 (source and crops in this
  session's scratchpad, `D:/fitway-temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/edb06240-7e52-4367-958c-e36223b639c4/scratchpad/decisions/`).
  Ask the user one question at a time this way: only what changes, numbered, the recommendation marked.
- Built and reviewed at `41a6f7c` (step-4 review: no blocker or major); nothing of items 16-19 is built yet.

## Running now

Nothing.

## Next steps

1. **One build round** (fresh `owner-direction-builder`) on the build worktree from `41a6f7c`, brief written from
   DECISIONS.md items 16-19 and these sources:
   - item 16: `D:/fitway-temp/owner-r04-en-tables/optB/` (changes to `reports.css`, `reports.js`, `components.css`,
     `components.js`, `style.css`; the slot is measured after fonts load, `EclipseTables.fitSlots`), and
     `D:/fitway-temp/owner-r04-en-tables/work/capture.mjs` for the Arabic check. Arabic's three-digit peak time
     alignment is new work; `alignDayNoneRows` is no longer needed in English;
   - items 17-18 and D6's R2: `D:/fitway-temp/owner-r04-copy-round/work/options.mjs` and its option folders;
   - item 19: `D:/fitway-temp/owner-r04-copy-round-2/opt/<item>-<option>/` (1-3, 2-4, 3-2, 4-1) plus the new "Last 7
     days" line;
   - K5: the component sheet's single-day specimen takes its day cell from the pages' component and fits the card at
     320;
   - Daily's reserved status width held at the day's widest time (`renderReserve`; coordinator decision);
   - the step-4 minor: Reports' badge clearance from the title at 320 EN, Delayed, with a classic scrollbar.
2. **After the build:** a fresh `owner-direction-verifier-high` and `rtl-ltr-reviewer` side by side, then the user.
3. **Daily's phone design round** (DECISIONS.md item 20): a fresh `owner-direction-designer` draws numbered options
   for Daily at 390 (and 320 checked), AR and EN, from a snapshot of the build so it can run beside step 1; its
   observations are in item 20. Then the decision page, then a builder for the pick.

## Waiting on the user

Nothing.

## Known risks

- A check that measures a rule passes a page that reads wrong: the step-4 reviewer passed D5 as "0 px from the
  mirror". Run `rtl-ltr-reviewer` on every layout, table or copy round.
- At 320 EN "No readings · 18 min" stays two lines with any label; the same shape decision 13 accepted for Arabic.
- Option B leaves Average about 25 px after the peak time at 768 EN: tight but readable.
- Reports EN shows a CLS of about 0.0005 after a retry (from `cbd7bbc`).
- NEXT-DIRECTION-BRIEF.md still says "plain hyphen" for Arabic ranges; DECISIONS.md item 12 overrides it.
- Ports: 3174 is the user's preview; 3176-3177 for builders, verifiers and Codex, 3178-3179 the probe kit's.
- Real-device touch, Firefox and Safari first paint, and screen-reader output were never checked.
- The next Eclipse defect round for Codex runs at `xhigh` (codex-rounds.md, "D3-D8 run 4").

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, expected HEAD `41a6f7c`.
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`; held-out checks in `D:/fitway-grader/owner-r04/`.
