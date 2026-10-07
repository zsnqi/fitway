<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `8561bd1`, 2026-10-03 15:42 +03:00; `owner-followup-r04-build` at `41a6f7c`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261003-121251-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **D3-D8 run 4** finished after the account switch: `e6db2e4`, graded 5 of 8 held-out
  (`docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`, "D3-D8 run 4"). Two failures trace to the
  brief, one to the code, so the next Eclipse defect round runs at `xhigh`.
- **Decisions 14 and 15 are built** at `41a6f7c` (brief `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/briefs/builder-d14-d15.md` on the
  build branch). The coordinator looked at the error sentences at 390 and 320 and Daily's 1024 EN header.
- **Step-4 review** (`design-research/owner-composition-exploration-r04/directions/briefs/verifier-step4-k02-d3-d8-d14-15.md`, evidence in
  `D:/fitway-temp/owner-r04-step4-review/`): no blocker or major. Minor: at 320 EN, Delayed, Reports' badge sits
  2.89 px from the title under a classic scrollbar (`.rp[data-frame] .head` grid in Eclipse's reports.css, K-38 block near
  line 666). Daily at 390 reads as the desktop page stacked: the user's call, frame grid-daily390.png there, sent.
- **Decision 16** (English tables do not copy Arabic) is recorded; its options A and B are not drawn yet.
- **Copy round done**, sheets sent to the user: `D:/fitway-temp/owner-r04-copy-round/sheets/` (1 the line, 2 the
  usual day, 3 the other rows); exact texts in `D:/fitway-temp/owner-r04-copy-round/work/options.mjs`. Recommended:
  the line option 1, the usual day option 1. D6 is the coordinator's pick (delegated, decision 16): R2, "805 of 823
  min" and "Open, empty".
- **`rtl-ltr-reviewer`** definition added (`8561bd1`) and listed in `CLAUDE.md`; it loaded in this session.

## Running now

Nothing. The English-tables designer was stopped before it drew anything (the user's Claude limit was near).

## Next steps

1. **Relaunch the English-tables designer** (`owner-direction-designer`) from
   `design-research/owner-composition-exploration-r04/directions/briefs/designer-en-tables-direction.md` (`817938f`).
   First delete everything in `D:/fitway-temp/owner-r04-en-tables/` except its `src` folder (the stopped run's leftovers). Send
   the user the numbered sheets (A: Peak column only; B: every column).
2. **Record the user's picks in DECISIONS.md**, then **one build round** (fresh `owner-direction-builder`) on the build
   worktree from `41a6f7c`:
   - decision 16 as picked;
   - the copy picks for the line and the usual day, and D6's R2, from that options.mjs, including the no-history form
     and the component sheet's legend name (components.js lines 99 and 198);
   - K5: the component sheet's single-day specimen takes its day cell from the pages' component, and fits the card
     at 320;
   - Daily's reserved status width held at the day's widest time (`renderReserve`; coordinator decision, it fits:
     283.2 px at 1024 EN, header still one line);
   - the step-4 minor: the badge's clearance from the title at 320 EN.
3. **After the build:** a fresh `owner-direction-verifier-high` and `rtl-ltr-reviewer` side by side, then the user.

## Waiting on the user

- The line and the usual day: a pick, or agreement with the recommendations.
- Whether Reports' other heavy explanations (export description, «يلزم 14 يومًا · القراءات منذ…», export failure,
  and the legend «معدّل كل 30 دقيقة» reading as one average per half hour) go into a copy round now or later.
- Daily at 390: keep it, or open a phone design round.
- Option A or B for English tables, once drawn.

## Known risks

- A check that measures a rule passes a page that reads wrong: the step-4 reviewer passed D5 as "0 px from the
  mirror". Run `rtl-ltr-reviewer` on every layout, table or copy round.
- At 320 EN "No readings · 18 min" stays two lines with any label; the same shape decision 13 accepted for Arabic.
- Reports EN shows a CLS of about 0.0005 after a retry (from `cbd7bbc`).
- NEXT-DIRECTION-BRIEF.md still says "plain hyphen" for Arabic ranges; DECISIONS.md item 12 overrides it.
- Ports: 3174 is the user's preview; 3176-3177 for builders, verifiers and Codex, 3178-3179 the probe kit's.
- Real-device touch, Firefox and Safari first paint, and screen-reader output were never checked.
- Codex: `resume` takes `--approve-for-me` only on `exec` before the subcommand (codex-rounds.md, run 4). The auto
  mode classifier refused reading a running round's output files; read the result after the harness reports the exit.

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, expected HEAD `41a6f7c`.
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`; held-out checks in `D:/fitway-grader/owner-r04/`.
