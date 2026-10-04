<!-- brief-format: v1 role: designer -->
# Designer brief: the average on the phone's busiest-time card (owner-design-exploration-r04)

For a fresh `owner-direction-designer-max` (Opus, max), at the user's request. A small design question: draw options;
the user picks.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `ad7e351`
  plus this brief's own commit on top of it. Read only. Work in a copy of the brief's commit:
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 archive <that commit>
  design-research/owner-composition-exploration-r04/directions/eclipse` unpacked under
  `D:/fitway-temp/owner-r04-busiest-average/`.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 7, 8, 11, 12, 24, 25, 26 and 27 (read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows GLO-12, OWN-D7, OWN-D8,
  PH-1, PH-3 by row ID. Navigate code with
  `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write nothing in the worktree; all your files go under `D:/fitway-temp/owner-r04-busiest-average/`. A local server
  uses port 3176 only. Run Playwright from the worktree's installed `@playwright/test`.

## The question

On the phone (720 px and below) Daily's busiest-time card reads: the name with «آخر 7 أيام» / "Last 7 days" at the end
of its line, then the hours at the start («6–7 مساءً» / "6–7 PM") and «بمعدّل 51» / "Average 51" at the far end, on the
hours' baseline (item 26). The review found that the average reads as part of «آخر 7 أيام» above it, which shares its
muted type and its end edge, and not as part of the hours it describes. The user wants the average to belong to the
hours, and asks you to propose the form that reads right.

The answer must also hold the longest hour forms, which today run into the average at 320-390 px: «11 صباحًا – 12 ظهرًا»
/ "11 AM – 12 PM", and the noon hour «12–1 ظهرًا» (item 27; build these words in your copy, with «ظهرًا» for the noon
hour as item 27 says).

Draw up to three variants, each judged as a whole composition (order, alignment, sizes, spacing, the weight of its
parts) and as one card among its neighbours on the page. The card's place, its name and «آخر 7 أيام» may move inside
the card if your variant needs it; say so.

**Hard limits:** Eclipse's look (item 1); the user's bans (`DO-NOT.md`); the card keeps its place in the page and the
other cards do not change; the words are item 26's and item 27's (propose a wording change in the report, don't build
it); the bare hour range stays isolated left to right (item 24); truthful states (item 8), with the loading placeholder
following PH-1 and PH-3; one card height in every Daily state at a given width; nothing wraps, overflows or overlaps at
320, 360, 390 and 720 px, AR and EN, with the longest hour form. 721 px and up stay exactly as they are.

## Frames

Build each variant in the copy behind a switch (for example `?avg=1`), and render with `@playwright/test` at
390 × 844, 360 × 780 and 320 × 568, AR and EN, from `file://` and over HTTP on 3176. In
`D:/fitway-temp/owner-r04-busiest-average/crops/`: `0-` the card as it is now, then `1-`, `2-`, `3-` for each variant,
each at 390 and 320 in both languages, cropped to the card with a strip of the cards around it; for each variant the
card with «11 صباحًا – 12 ظهرًا» / "11 AM – 12 PM" at 320 and 390, and in loading and closed at 390 AR; and one plain
comparison sheet per language at 390, the variants side by side, numbered, with no labels or measurements on it.
Inspect every frame yourself; a passing check is not a looked-at frame. (AGENTS.md)

## Report

For each variant: one or two plain lines on what it does and why the average now reads as the hours'; the files it
changes in the copy; its height against the current card; anything that reads wrong under any state or width. Then
which one you would pick and why; anything a decision or rule produces that reads wrong, with the rule named
(WORKING_AGREEMENTS "Rules and findings"); and the crop folder. At most 40 lines.
