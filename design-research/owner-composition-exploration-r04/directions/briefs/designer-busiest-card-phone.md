<!-- brief-format: v1 role: designer -->
# Designer brief: Daily's busiest-time card on the phone (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). A small design question: draw options; the user picks.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `e1837cf`
  plus this brief's own commit on top of it. Read only: a builder is changing this worktree in parallel. Work in a copy
  of the brief's commit: `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 archive <that commit>
  design-research/owner-composition-exploration-r04/directions/eclipse` unpacked under
  `D:/fitway-temp/owner-r04-busiest-card/`.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 7, 8, 11, 12, 20, 24 and 25 (read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows GLO-12, OWN-D7, OWN-D8,
  PH-1, PH-3, STA-11, STA-12 by row ID. Navigate code with
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

- Write nothing in the worktree: it is read only for this brief, and all your files go under
  `D:/fitway-temp/owner-r04-busiest-card/`. A local server uses port 3176 only. Run Playwright from the worktree's installed `@playwright/test`.

## The question

On the phone (720 px and below) Daily's busiest-time card has not found its form. It holds a title («أكثر الأوقات
ازدحامًا» / "Busiest time"), its basis («آخر 7 أيام» / "Last 7 days"), the hours («6–7 م» / "6–7 PM") and the
average inside in that hour («المعدّل 51» / "Average 51").

- Before the trial (`f5f0e2d`): a full-width card with the hours under the title, half of it empty.
- The trial (`a223c82`, what the copy shows now): the hours beside the title and "Average 51" hanging under the
  hours. It reads badly.
- The coordinator's proposal, title with «آخر 7 أيام · المعدّل 51» on one side and the hours alone on the other: it
  did not convince the user either.

Draw it again with a designer's eye: up to three variants of the card, each judged as a whole composition (its order,
alignment, sizes, spacing and the weight of its parts) and as one card among its neighbours on the page.

**Hard limits:** Eclipse's look (item 1); the user's bans (`DO-NOT.md`); the card keeps its place in the page and the
other cards do not change; the four pieces of content keep their words (propose a wording change in the report,
don't build it); the bare hour range stays isolated left to right (item 24); every target at least 44 px; truthful
states (item 8): in loading, closed, offline and the other states the card stays honest, and its placeholder follows
PH-1 and PH-3. 721 px and up stay exactly as they are. The composition inside the card is yours.

## Frames

Build each variant in the copy behind a switch (for example `?busy=1`), and render with `@playwright/test` at
390 × 844 and 320 × 568, AR and EN, from `file://` and over HTTP on 3176. In `D:/fitway-temp/owner-r04-busiest-card/crops/`:
`0-` the card as it is now, then `1-`, `2-`, `3-` for each variant, each at 390 and 320 in both languages, cropped to
the card with a strip of the cards around it; for each variant one frame of the card in loading and one in closed at
390 AR; and one plain comparison sheet per language at 390, the variants side by side, numbered, with no labels or
measurements on it. Inspect every frame yourself; a passing check is not a looked-at frame. (AGENTS.md)

## Report

For each variant: one or two plain lines on what it does and why it reads well; the files it changes in the copy; its
height against the current card; anything that reads wrong under any state or width. Then which one you would pick and
why, anything a decision or rule produces that reads wrong, with the rule named (WORKING_AGREEMENTS "Rules and
findings"), and the crop folder. At most 40 lines.
