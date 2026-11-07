<!-- brief-format: v1 role: designer -->
# Designer brief: Settings skeleton, third pass, new computer arrangements (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009). The user looked at the second skeleton
and does not like its computer arrangement; they liked the first one better, apart from the two problems the second
pass was asked to solve. They want new arrangements that are genuinely good, and they give you the freedom to decide
the structure: merge, split or regroup the cards, or anything else you judge best. No page is changed in this step.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `4ac4cb9b`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only: write nothing in the worktree.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 7, 8, 33 and 49 (the coordinator line's copy; the build branch's copy predates item 49).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/briefs/designer-settings-skeleton.md`
  (the first brief, whose question still stands); `D:/fitway-temp/owner-r04-settings-skeleton/REPORT.md` (both earlier
  designers' reports); `D:/fitway-temp/owner-r04-settings-skeleton/v1/skeleton.html` with its PNGs (the first
  skeleton) and `D:/fitway-temp/owner-r04-settings-skeleton/skeleton.html` with its PNGs (the second);
  `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`; and the built sibling page
  `design-research/owner-composition-exploration-r04/directions/eclipse/access.html` rendered at 1440 in Arabic.

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
  A local server uses port 3190 only. Copy the second skeleton (`skeleton.html` and its PNGs) to
  `D:/fitway-temp/owner-r04-settings-skeleton/v2/` before you change anything, then write this pass as
  `D:/fitway-temp/owner-r04-settings-skeleton/skeleton.html` with its PNGs in that folder (replacing the second ones).

## What the user said about the second skeleton (2026-10-17, their words)

- On the whole computer arrangement: «الترتيب الجديد احسه مب كويس مره الي قبل كان كويس ولكن ايه كان عليه ملاحظات ف هل
  نقدر نطلع ب هيكل جديد او اقتراحات ممتازة يعني ؟» (the new arrangement is not good; the earlier one was good but had
  its problems; can we come up with a new structure or excellent proposals?)
- On the crowd card's row of levels: «هنا شكل الصف الخانات حق النسبة مب كويسة» (the percentage cells in the row do
  not look good).
- On «يوم العمل»: «البطاقة دي محتواها قليل ب النسبة لحجم البطاقة» (too little content for the card's size).
- Kept, in their words «ممتازة» or with no notes: the phone (one column, the log as a button under the title, editing
  in a bottom sheet over a page that stays put), the confirmation before saving at 390, and the dialogs at 1440
  (confirmation, leaving with unsaved changes, the second owner's view).

The two problems of the first skeleton still have to be solved, in whatever arrangement you propose: the page must
not move or leave empty holes while any one card is edited, and 1440 must not look empty or unfinished, at rest or
in edit. The percentage cells must read well, and no card may be much larger than what it holds.

## The ask

Two or three computer arrangements (1440 and 1024), each genuinely different from the others in structure, not
variants of one idea, and each one you would stand behind. Start from what made the first skeleton good, and say in a
line what that was. You may regroup the five values and the log however you judge best. Keep item 49's content and
wording, the phone and the dialogs as they are; change them only where your arrangement truly needs it, and say what
and why. Say which proposal you would choose and why, in a line.

For each proposal show 1440 and 1024 at rest, and while editing the crowd and while editing the hours at each width.
Show the phone and the dialogs once, as kept. Measure each edit frame against its rest frame: how far each card that
is not being edited moves, and the largest empty area in each frame; report where each width's page ends against the
fold (900 at 1440, 768 at 1024).

## Output

`skeleton.html`, self-contained (inline CSS, no external requests, no scripts), in Arabic, each proposal lettered
(أ، ب، ج) with one line of plain caption per frame, and its PNGs. Inspect your own frames.

## Report

Each proposal in at most six plain lines: what sits where and why; what made the first skeleton good; your choice;
the measurements above; what you would still decide during the build. At most 40 lines.
