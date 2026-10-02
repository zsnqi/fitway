<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at `fa4efda` plus the commit that adds this file, 2026-10-02 21:30 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/20260923-165000-owner-design-exploration-r04-activation.md` (history, frozen; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Eclipse is the chosen direction. Its latest build is `06e0c41` on `owner-followup-r04-build` (decisions 15-17:
  peak time inline at 721-1023, coverage dot, no «الأعلى» flag), reviewed by the user.
- `4b8a5ff` merged the coordinator's authority documents into the build branch (`DESIGN_GUIDE.md` loading behaviour,
  the design-phase plan in `NEXT-DIRECTION-BRIEF.md`, `DO-NOT.md`), which it had lacked since `8926193`.
- Claude Design is paused (DECISIONS.md, rounds item 5).
- From this file on, resume points are short files in this folder; the activation log is frozen.

## Running now

Nothing for this milestone. Codex works on `agent-environment-r01` in its own worktree.

## Next steps

1. **Navigation aids for Eclipse** (Codex, frozen edits in the build worktree): a generated index from
   `DESIGN-SPEC.md` row IDs and from `app.js`, `components.js` and `reports.js` functions to line numbers; the
   verifier probe kit moved into `eclipse/tools/` with its root, output folder and port taken from environment
   variables and a tested run line; `eclipse/README.md` split into a short contract and a history log (the
   coordinator decides the cut first).
2. **Reports' states (K-02)** in `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md`:
   loading, page-level closed, unavailable, error and the not-current statuses, at 1440, 768 and 390 (320 for K-38),
   AR and EN. K-38 closes with it: at 320 AR «التقارير» overflows its box and moves 25.9 px when the status badge
   changes. A fresh designer, the user picks from exact renders, then a builder or Codex.
3. **Deferred defects 3-8** (Codex, frozen targets): D3, the status box anchor moves 6.5 px at 721 EN (HDR-6);
   D4, `components.html`'s no-readings row uses the caption `--ink-3` style where Daily uses 13.5 px `--ink-2`;
   D5, a single day's «No readings» in an EN table at 721 and up starts at the peak column's left edge; D6, EN
   coverage rows take two lines at 390 and «from 6:00 AM» drops under its label at 320 EN; D7, `components.html`
   has no single-day specimen; D8, `components.html` scrolls sideways at 390 and 768 EN, its header date range
   breaks at 390 and 320, «Open, nobody inside» breaks at 320 EN, and SVG paths log NaN at 320.
4. **The step-4 reviewer**, then the user; the reviewer also looks at Daily at 390 under the "compressed, not
   designed" lens, and any Daily change is the user's call.

## Waiting on the user

Nothing.

## Known risks

- A brief must name each authority document by absolute worktree path; the build branch drifts from the
  coordinator branch whenever only one of them changes. Re-merge before a launch until `pnpm brief:check` exists.
- `NEXT-DIRECTION-BRIEF.md` still says "plain hyphen" for Arabic ranges near line 92; DECISIONS.md item 12 overrides it.
- Port 3174 (`eclipse-build` in the untracked `.claude/launch.json`) is the user's preview; agents use 3173 or
  3176-3179.
- PowerShell: run pnpm without `2>&1` (it wraps stderr as an error), write JSON without a BOM, and wait on long jobs
  with Monitor or a background shell instead of `Start-Sleep`.
- Several builder measurements on `06e0c41` are self-reported. Real-device touch, Firefox and Safari first paint, and
  screen-reader output were never checked.
- Claude Design suspicions left open: its `tokens.css` declares four per-file font families at 400 instead of one
  "Readex Pro"; its DayTable copies defect D4; its README says 36 px rows where the component has 48 px.

## Pointers

- Coordinator worktree: `D:/Projects/fitway-worktrees/owner-design-exploration-r04`, branch `codex/owner-redesign-r04`.
- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, expected HEAD `4b8a5ff`.
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- Earlier briefs: `design-research/owner-composition-exploration-r04/directions/briefs/`.
- The verifier probe kit until step 1 moves it: `D:/fitway-scratch/claude-scratch/f8e879d9-0fb6-4b39-948b-2404e2518cd5/scratchpad/tools/reference/probes/`.
- Local scratch: `D:/fitway-temp/owner-r04/` (the 06e0c41 crops in `build15/`, the Claude Design kit) and `D:/fitway-scratch/`.
- Claude Design system "FITWAY Eclipse": `https://claude.ai/artifact/NKC9SHykzthuxQuHWg4YPn`.
