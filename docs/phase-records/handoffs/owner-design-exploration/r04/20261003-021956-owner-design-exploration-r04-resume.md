<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `47c44ba` plus the commit that adds this file; `owner-followup-r04-build` at `2d1da25`; 2026-10-03 02:19 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261002-235032-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **K-02 decided** (DECISIONS.md item 14): option A, with option C's error state; pending counts the partial day;
  the header status control keeps one width from loading to arrival, and Daily gets the same fix. Not built yet.
- **K-02 arrival fixes** in all three options (`1a4b497`, an Opus builder): the status control is as wide as the
  widest status from 721 up; the error state paints complete in its first frame; A's and B's peak placeholders sit
  where the text lands; «قبل … دقيقة» uses Daily's rule. Reports without `option` and Daily unchanged.
  Independent review of the options: V1-V4, V6, V7 pass; V5's failures are what `1a4b497` fixed.
- **Comparison page** for the user: https://claude.ai/artifact/BswYQ6ad1D7B6m6RMAyPoy (frames of `1a4b497`, built
  from `D:/fitway-temp/owner-r04-k02-fix/frames/`). The user found the earlier contact sheets too small to read;
  show options as full-resolution frames on such a page, not as composite sheets.
- **Navigation done:** nav-4 (probe kit finds any text past its box; run line and busy-port message; `let`
  functions indexed) and nav-5 (README contract cleaned; a lost "200 ms" restored in `1282434`). `owner-r04-nav`
  merged into the build (`0723f3b`), INDEX.md regenerated (`b65e2b7`). Graded in codex-rounds.md (this folder).
- **The environment tools are on this branch** (agent-environment-r01 merged, `47c44ba`): `pnpm brief:check`,
  `pnpm handoff:new`, the brief templates in `docs/agent-context/briefs/`. Not yet merged into the build branch.

## Running now

Nothing. Codex's D3-D8 round was stopped near its five-hour limit before it committed; its partial diff is saved,
unverified, at `D:/fitway-temp/codex-runs/owner-d3-d8/run3/partial-unverified.patch` (written by PowerShell with a
BOM; reference only, do not apply it as is). The build tree was restored clean at `2d1da25`.

## Next steps

1. **Merge this branch into `owner-followup-r04-build`** first: it brings the brief tools and replaces the build
   branch's stale `PROJECT_STATE.yaml`, whose expired lease made Codex stop.
2. **Ask the user the two open K-02 items** (DECISIONS.md item 14) in one message, then brief an
   `owner-direction-builder`: build A with C's error state, remove options B and C and the `option` switch, give
   Daily's header status control the same one-width fix, and show the user exact frames on a comparison page.
3. **Deferred defects D3-D8** (Codex): rerun the brief
   `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/briefs/codex-d3-d8-defects.md`
   after step 2, with its HEAD updated and B7 rechecked; D3 may already be gone after the status-control
   fix. Held-out checks: `D:/fitway-grader/owner-r04/d3-d8-heldout.md`.
4. **The step-4 reviewer**, then the user; the reviewer also looks at Daily at 390 under the "compressed, not
   designed" lens, and any Daily change is the user's call.

## Waiting on the user

- C's error sentence with the year once, as the header writes it: «تعذّر تحميل القراءات من 26 أغسطس إلى 22 سبتمبر 2026».
- Whether the status control's extra width is acceptable where it shows (hover and focus; for "Closed" in English
  about 60 px of empty space inside the outline: `D:/fitway-temp/owner-r04-k02-fix/crops/focus.png`).

## Known risks

- Launch Codex with the note in `docs/agent-context/WORKING_AGREEMENTS.md`: the brief's own commit sits on the HEAD
  it names, and Codex rightly stops on it. Point it at this branch's ledger while the build branch's copy is stale.
- Codex was at 96% of its five-hour window at 01:45; it resets at 05:13 +03:00 on 2026-10-03. Read `rate_limits`
  before each launch.
- NEXT-DIRECTION-BRIEF.md still says "plain hyphen" for Arabic ranges; DECISIONS.md item 12 overrides it.
- Ports: 3174 is the user's preview; 3176-3177 for builders and verifiers, 3178-3179 the probe kit's.
- Real-device touch, Firefox and Safari first paint, and screen-reader output were never checked.
- Claude Design suspicions left open: four per-file font families in its tokens.css; its DayTable copies D4; its
  README says 36 px rows where the component has 48 px.

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, expected HEAD `2d1da25`.
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- K-02 reviews: `D:/fitway-temp/owner-r04-k02-verify/` (V1-V7); the fix's frames and crops: `D:/fitway-temp/owner-r04-k02-fix/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`; held-out checks in `D:/fitway-grader/owner-r04/`.
- Old Codex-app worktrees were moved to `D:/codex-worktrees-archive/` (git repaired; run `pnpm install` before using one).
