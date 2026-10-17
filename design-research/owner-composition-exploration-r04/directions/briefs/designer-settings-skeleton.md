<!-- brief-format: v1 role: designer -->
# Designer brief: Settings, the arrangement as a skeleton first (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009). Settings is a new Owner page, the next in
item 51's order. Before its one-pass build the user sees the arrangement you propose, in plain blocks, at the computer
and the phone, with its dialogs (item 8). No page is changed in this step.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `51d5a783`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only: write nothing in the worktree.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 7, 8, 33, 49 and 76 (the coordinator line's copy; the build branch's copy predates items 49 and 76).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `D:/fitway-temp/owner-r04-settings-questions/REPORT.md` (the data contract and the questions item 49 answered); the
  built sibling page `design-research/owner-composition-exploration-r04/directions/eclipse/access.html` (with
  `access.css` and `access.js`) rendered at 1440 and 390 in Arabic; and Access's skeleton,
  `D:/fitway-temp/owner-r04-access-skeleton/skeleton.html`, as the form this step takes.

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
  A local server uses port 3190 only (other rounds hold 3174-3189). Everything you make goes under
  `D:/fitway-temp/owner-r04-settings-skeleton/`.

## The question

Settings holds the owner's five editable values: capacity, the three crowd-level limits (quiet, moderate, busy, in
percent, strictly rising), the weekly hours (each day closed, or open and close), the end of the business day, and the
reset buffer. Item 49 settles what the page says and does: an optional reason of at most 240 characters; a confirmation
before saving that lists each change from → to, since a saved value reaches the visitors' page at once; each crowd
level also read in people beside its percentage, from capacity; a value that looks like a mistake accepted with a plain
sentence under its field; times entered in 12 hours with ص/م; «توقيت الرياض» beside the hours as their unit and no
other technical value on the page; leaving with unsaved changes asks first; when two owners save at once, the second
sees what the other saved and keeps their own typed changes in view to apply again.

What must hold: an owner who opens the page understands at a glance what each value does to the gym and to the
visitors' page, and can change one without wading through the rest; the page does not look empty or unfinished at
1440 and 1024, and does not feel cramped at 390; it stays in Eclipse's frame (item 7) beside Today, Reports, Activity
log and Access; Arabic reads as an Arabic page, not a translation. The composition is yours (item 33).

Propose the arrangement you would build, as a simple skeleton: plain blocks with short labels, no colour work, no
finished components. One proposal you stand behind; a second only if it is genuinely different and you cannot
choose between them. Show the page at 1440, 1024 and 390, and these dialogs or states at 1440 and 390: the
confirmation before saving, leaving with unsaved changes, and the second owner's view after another owner saved.
Say in plain words what each block is and why the arrangement answers the question.

## Output

One small HTML file, `D:/fitway-temp/owner-r04-settings-skeleton/skeleton.html`, self-contained (inline CSS, no
external requests), in Arabic, each proposal numbered (1, 2) with one line of plain caption per frame; and PNGs of it in
the same folder. Inspect your own frames.

## Report

Each proposal in at most six plain lines: what sits where and why. What you would still decide during the build.
At most 30 lines.
