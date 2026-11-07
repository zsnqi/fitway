<!-- brief-format: v1 role: designer -->
# Designer brief: Settings skeleton, second pass on the user's two points (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009). The first skeleton's proposal 1 was
liked by the user apart from two points, which they confirmed in the coordinator's words (2026-10-17). Revise the
skeleton to answer them; keep everything else of proposal 1. No page is changed in this step.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `e17824ef`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only: write nothing in the worktree.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 7, 8, 33 and 49 (the coordinator line's copy; the build branch's copy predates item 49).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/briefs/designer-settings-skeleton.md`
  (the first brief, whose question still stands); `D:/fitway-temp/owner-r04-settings-skeleton/REPORT.md` (the first
  designer's report); `D:/fitway-temp/owner-r04-settings-skeleton/skeleton.html` and its PNGs; and
  `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`.

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

- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other design or taste skill.
  A local server uses port 3190 only. Copy the first skeleton to `D:/fitway-temp/owner-r04-settings-skeleton/v1/`
  before you change anything, then write the revision as `D:/fitway-temp/owner-r04-settings-skeleton/skeleton.html`
  with its PNGs in that folder (replacing the first ones).

## The user's two points

1. **The page moves while an owner edits.** The page is two rows of two cards. When «تعديل» opens one card, only that
   card grows: its neighbour in the row stays short and leaves a large empty space under it (at 1024, editing the hours
   leaves about 300 px empty under the crowd card on the right; at 1440, editing the crowd leaves it under the hours),
   and the whole second row is pushed down, so the page shifts under the owner's eyes. The arrangement must stay
   steady and balanced while any one card is edited, at 1440, 1024 and 390.
2. **1440 looks empty even without editing.** Inside each card the values sit at the right and «تعديل» at the far
   left, with an empty middle; the cards end near y 716 of 900, leaving the bottom empty; «يوم العمل» is stretched to
   match the log card's height. At 1440 the page must not look empty or unfinished.

The answer is yours: the arrangement, where editing happens, how the cards share the width. Keep proposal 1's content,
dialogs, wording and phone order unless a change is needed to answer these two points, and say what changed and why.
Show the page at 1440, 1024 and 390 at rest, and while editing the crowd and while editing the hours at each of 1440
and 1024 (and the hours at 390), so the user sees the page hold still; keep the dialog frames.

## Output

The revised `skeleton.html`, self-contained (inline CSS, no external requests, no scripts), in Arabic, with one line of
plain caption per frame, and its PNGs. Inspect your own frames, and measure each edit frame against its rest frame:
report how far each card that is not being edited moves, and the largest empty area left in each frame.

## Report

What changed and why, in at most eight plain lines; the measurements above; what you would still decide during the
build. At most 30 lines.
