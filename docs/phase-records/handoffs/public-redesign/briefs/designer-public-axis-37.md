<!-- brief-format: v1 role: designer -->
# Designer brief: fixed hour labels, and a picked bar seen at a glance (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus) at its default effort. Concept-only (ADR-010). A small round on
sketch 16, in place.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `dad1e2a2`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-16.html`, `.css` and `.js`:
    the page you change, in place.
  - `D:/fitway-temp/public-redesign-r01-polish-35/NOTES.md`: how sketch 16's bars, labels, readout and frames work
    (`?hour=` picks an hour for frames).
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`: the motion rules for any interaction you
    change. Read it as a file.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- `<run>` is `public-redesign-r01-axis-37`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Impeccable is the design skill; load no other design or taste skill; its
  files go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)
- A page server for the user's phone runs on port 3181 from this worktree's Eclipse folder; leave it alone and serve
  on your own port.

## What the user decided

The user tried sketch 16 on their phone and likes it. One note: the hour labels under the bars change when a bar is
picked. On Saturday they read 8 AM · 12 PM · 4 PM · 8 PM; picking 6 – 8 PM removes 4 PM and 8 PM and puts
"6 – 8 PM" in their place («ليه ما نثبت عدد الساعات الي يكون مكتوب تحت؟»). The user agreed:

1. **The labels under the bars are fixed for a day.** On every day, size and direction, a pick, hover, focus or drag
   never makes a label appear, disappear or move. Making a label that is already there bolder is allowed. The picked
   time is told by the readout above, which already names it. Today keeps "Now" and the quietest hour left as fixed
   labels of their own, as they are part of today's answer; the rest of today's labels are fixed too. On the computer,
   where every hour has its label, a pick may bold its own label as now.
2. **A picked bar is seen at a glance.** Today a picked bar's lift is faint: only its label told it apart, and that
   label now stays put. Make the picked bar clearly different from its neighbours on the phone and the computer, in
   the page's family (chalk and light; not red, which is the live reading, and not green), without a new element
   that crowds the bars. Hover keeps a lesser version of it on the computer. Reduced motion carries the same
   difference without movement.

Keep everything else in sketch 16: two-hour bars by their busier hour, the readout's held height, the quiet head,
"Fri" with its dot, the drag, the font loading, Brave's arrival from the floor, the switches.

## Frames

Render with `pnpm verify:owner frames` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell,
`--concept` set to this worktree's `design-research/owner-composition-exploration-r04/directions/eclipse` folder as an
absolute path, `--page public-sketch-16.html --languages en`, at Busy, under reduced motion, into
`D:/fitway-temp/<run>/frames/`: `phone@3` and `phone360@3` on Saturday with nothing picked and with 6 PM picked;
`phone@3` today with nothing picked and with 4 PM picked; `desktop@2` on Saturday with 6 PM picked; `desktop@2` with
`?dir=rtl` today with 4 PM picked. Lay them out with `pnpm verify:owner sheet` as `sheet-axis`, unpicked beside picked.
Look at every frame. Prove item 1 by measuring every label's text and box on every phone day at 360 and 390 before
and after picking each bar in turn (none may appear, disappear or move), and measure any interaction you change with
ui-forensics' `C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs` (guide:
`C:/Users/Pc Force/.agents/skills/ui-forensics/references/browser-tools.md`), into `D:/fitway-temp/<run>/motion/`.

Commit once at the end.

## Report

At most 25 lines: the labels per day before and after (the rule you used); what a picked bar and a hovered bar now
look like, and why; the label measurement's result; any motion changed, with its value and measurement; any copy
changed; the frame, sheet and measurement paths; the commit SHA; anything that could not be met as written.
