<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page's `day`, fourth polish (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus) at its default effort. Concept-only (ADR-010): the superseded Public
Paper frames, the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `1593df75`
- **Starting point:** that HEAD, or the Markdown-only commits after it that bring in this brief.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-15.html`, `.css` and `.js`:
    the page you polish.
  - `D:/fitway-temp/public-redesign-r01-review-31/reader-after/REPORT.md`: what a reader with no context understood
    from sketch 15's frames.
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`: the motion rules for interactions, as in the
    last round (the precedence below). Read it as a file.
  - `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketch-27.md` §"Limits" and §"Content and
    switches": the rules and the content, unchanged.

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

- `<run>` is `public-redesign-r01-polish-35`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

The user likes sketch 15. Three notes from them and the zero-context reader, each to be seen by eye before it is
decided. Where a note says "behind a switch", keep the current behaviour as one value so the user can compare.

- **Picking an hour with a finger on another day.** On the phone, a day other than today can have many open hours:
  Saturday runs 8 AM to 12 AM, sixteen bars in about 340 px, each hour about 21 px wide. The user's words: it is hard
  to pick one hour with a finger because there are so many bars («صعب ب اصبعه يختار ساعه معينة بسبب كثرة
  الاعمدة»). Dragging the finger across the bars already moves the pick (`public-sketch-15.js:343-355`), but nothing
  says so, and the user decided against a tap cue. Behind `?hours=`, draw `1` (as now) and `2`: on the phone, a day
  whose open hours would make a bar too narrow to pick shows one bar per two hours, wide enough to tap, and its
  readout names the two-hour span. Today stays hourly, with its Now. The computer stays hourly. Where the threshold
  falls, how a span reads, and how the quietest and busiest sentence fits it are yours. If you find a better answer to
  the user's problem than `2`, draw it as a third value and say why.
- **The live head above another day's chart.** When another day is picked, the head ("Busy", the count, the
  percentage, "Live · 7:41 PM") stays above "A usual Saturday", and the reader took "Busy" to describe Saturday.
  Behind `?head=`, draw `keep` (as now) and `quiet`: when another day is picked, the head steps back (for example a
  little dimmer) so it reads as now, not as that day, and comes back when today is picked. It must stay a live reading
  that is read at a glance: it never looks stale, closed or absent. The user did not follow the idea in words and wants
  to see it.
- **"Today" where Fri should be.** The day row reads Mon, Tue, Wed, Thu, Today, Sat, Sun, and the reader looked for
  Friday. Make today's button read "Fri", like the others, with a small white dot under it that marks today; not red
  and not green, which the page uses for the live reading. Its width then matches the others. This one is decided, no
  switch; `?dir=rtl` mirrors it.

Keep everything else as sketch 15 has it, including the font loading (`font-display: swap` with the sized fallback
faces, `1593df75`) and the bars' arrival from the floor, which must still rise in Brave
(`C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe`): every new bar's style must be below the
floor before its height is set (`var(--u, 0)`, `2c911cb1`). The interactions you add or change follow
`STANDARDS.md`'s values; the arrival keeps its character and length; reduced motion carries the same information
without spatial movement.

How you work is yours. Score your result with Impeccable's `critique` before you report.

## Limits

The sketch 12 brief's §"Limits" holds unchanged: identity, truth, privacy, and motion allowed with reduced motion
carrying the same information. English this round, with the `?dir=rtl` mirror kept working. Keep the switches
`?level=`, `?day=`, `?pct=off` and `?grain=`, and add `?hours=` and `?head=`. List every line of copy you remove,
change or add.

## Deliverable

Copy sketch 15 to files whose names start with `public-sketch-16` under
`design-research/owner-composition-exploration-r04/directions/eclipse/` and work there. Leave every other `public-*`
file, the Owner pages and the shared `style.css` as they are. Set `window.__sketch = { ready: true }` once the fonts
have loaded. Commit at natural checkpoints, with a short notes file in `D:/fitway-temp/<run>/` saying what is decided
and what is left, and commit once at the end.

## Frames

Render every frame with `pnpm verify:owner frames` and lay frames out with `pnpm verify:owner sheet`, as
`D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Public designer
frames" gives them, into `D:/fitway-temp/<run>/`, which the coordinator made with `pnpm run-folder:new`. Run them,
read only, from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to
this worktree's `design-research/owner-composition-exploration-r04/directions/eclipse` folder as an absolute path.
Inspect every frame yourself before reporting; a passing command is not a looked-at frame. (agent-tooling DECISIONS
item 23)

Render under reduced motion, into `D:/fitway-temp/<run>/frames/`, at Busy:

- `sheet-hours`: `phone@3` and `phone360@3` with `?day=sat`, once per `?hours=` value, and one frame per value with
  an hour picked (the picked hour's readout showing).
- `sheet-head`: `phone@3` and `desktop@2` with `?day=sat`, once per `?head=` value, and today for reference.
- `sheet-days`: `phone@3`, `phone360@3` and `desktop@2` on today, and `desktop@2` with `?dir=rtl`, showing the day
  row.

Measure each finger target you changed (its width and height at 390 and 360) and each interaction you changed with
ui-forensics' `C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs` (its guide is
`C:/Users/Pc Force/.agents/skills/ui-forensics/references/browser-tools.md`), into `D:/fitway-temp/<run>/motion/`.

## Report

At most 40 lines:

- the critique's score for your result;
- `?hours=`: each value, the threshold and why, the finger targets measured;
- `?head=`: what `quiet` does and why it still reads as live;
- the day row: what changed;
- each motion you added or changed, with the `STANDARDS.md` value and the measurement;
- every line of copy removed, changed or added;
- the frame, sheet and measurement paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
