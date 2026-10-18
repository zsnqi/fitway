<!-- brief-format: v1 role: designer -->
# Designer brief: Settings, the whole screen in one pass, arrangement ب (owner-design-exploration-r04)

For a fresh `owner-direction-designer` at effort `max` (a whole Owner screen in one pass; r04 "How this milestone's
rounds run" item 6). Concept-only (ADR-009): superseded Owner Paper frames are reference only. The user chose the
arrangement (DECISIONS item 77, ب); this round builds that one version of the screen as a finished page. A review
follows, then the user sees it. No options round.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `873e03fc`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 11, 12, 16, 23, 35, 41, 49, 75, 76, 77 and 78, and "How this milestone's rounds run" items 6, 7, 10
  and 11 (the coordinator line's copy; the build branch's copy predates items 49 and 76-78);
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/agent-context/WORKING_AGREEMENTS.md` §"Rules and findings".
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; it binds.
  - `D:/fitway-temp/owner-r04-settings-questions/REPORT.md`: the data contract, the refusals and the questions item 49
    answered. Its recommendations are a researcher's; item 49 holds what the user decided.
  - `D:/fitway-temp/owner-r04-settings-skeleton/REPORT.md` (all three passes) and
    `D:/fitway-temp/owner-r04-settings-skeleton/skeleton.html` with its PNGs: proposal ب is the arrangement to build;
    the phone, the 390 sheets and the dialogs are the ones the user kept from the second pass
    (`D:/fitway-temp/owner-r04-settings-skeleton/v2/`).
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` §1, §2, §3 and §4.4
    (Access, the nearest sibling). Navigate code with `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`;
    `access.html`, `access.css` and `access.js` are the closest working example of the frame, the dialogs, a form, a
    reason field and the states.

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

- Run `pnpm check:design-context` and `pnpm context:show --milestone owner-design-exploration-r04` first. Impeccable
  is the one design skill; load no other design or taste skill. (AGENTS.md)
- A local server uses port 3190 only (other rounds hold 3174-3189). Frames, notes and scratch go under
  `D:/fitway-temp/owner-r04-settings/`.
- Commit at natural checkpoints (the page at rest, then the editor, then the dialogs and states), each with a short
  `D:/fitway-temp/owner-r04-settings/NOTES.md` saying what is decided and what is left, so a fresh designer can take
  over from the last commit if you are cut off (rounds item 10).

## The question

Settings is the owner's page for the five values that shape the gym and the visitors' page: capacity, the three
crowd-level limits, the weekly hours, the end of the business day and the reset buffer. Build it as one finished
screen in Eclipse's language, in arrangement ب: all five values on one sheet (5/12) beside a panel (7/12) that shows
the settings log with its reasons and becomes the editor on «تعديل», with the label «قيد التعديل» on the value being
edited. The owner opens it, understands at a glance what each value does, changes one without wading through the rest,
and trusts that nothing reaches the visitors' page by accident.

The user's answers are DECISIONS items 49, 77 and 78: the optional reason (240 characters) and the log naming each
change from → to; the confirmation before saving; each crowd level in people beside its percentage, computed from
capacity the way `bandFor` counts (`packages/api/src/occupancy/bands.ts`: a level holds every count whose percent is at
or under its limit, so 24% of 120 reads "up to 28 people"; item 49's "up to 29" is only an example's shape); a
value that looks like a mistake accepted with a plain sentence under its field; 12-hour times with ص/م; «توقيت الرياض»
beside the hours and no other technical value; leaving with unsaved changes asks first; the conflict view shows what is
saved now beside the owner's typed changes, names no one, and nothing is merged silently. Everything the skeleton
reports left open is yours: what the other «تعديل» buttons do while one value is edited, when «اليوم التالي» shows,
whether the confirmation keeps the people lines, the done sentence and its link, what «إغلاق» leaves in the editor, the
log's count and its wording for hours, the warning sentences, and one line per day at 1024 in Readex Pro. Decide them
and say why.

## Hard limits

- Truthful data: synthetic data generated from the contract in the questions report; the log's entries carry the
  reason only where one was given. No visitor or per-visitor data anywhere. The page never looks live (item 8, D1);
  the frame's status stays as the frame has it (item 7).
- Anything beyond the contract (the reason, the log's from → to): list each in the report and in the spec fragment as
  a Product/Spec amendment (item 51 records the user's acceptance in principle).
- Eclipse's look (item 1), the frame (item 7), the wording and range rules (items 11, 12, 23), English that does not
  copy Arabic's geometry (item 16), a dialog's buttons where its text starts (item 35), 16 px field text (item 41),
  focus rings as the shared components draw them (item 75 and DESIGN-SPEC §1.9), DO-NOT in full. Every target 44 px.
  No sideways scroll at any width. A percentage in Arabic sits in an LTR isolate. Motion (item 4): complete at first
  paint, no intro, no digit roll; a dialog's or sheet's own open and close only.
- The cards not being edited do not move when a value enters or leaves edit, at any width (the skeleton measured 0 px;
  keep it). 1440 and 1024 do not look empty or unfinished, at rest or in edit; 390 does not feel cramped.
- Copy: Arabic first, then English, both written for the reader, not translated (`ux-araby` may be loaded for copy;
  it is not a design skill). Propose a wording you think a decision gets wrong in the report; don't build it.

## The whole range (rounds item 7)

Draw every element against its whole range before you settle it: capacity from 1 to the contract's largest; limits at
their tightest and widest (strictly rising); every day closed, one day closed, opening equal to closing, hours past
midnight; the business day's end and the buffer at their bounds; a log with no entries, one, and many, with and
without reasons, a reason at 240 characters; every warning sentence; the confirmation with one change and with all
five; working, done, each refusal the contract can return, the conflict view, leaving with unsaved changes; the
states Loading and Error (first load); AR and EN; touch on the phone (every sheet and dialog as the phone shows it).
Put the states behind switches (for example `?state=loading`).

## Frames

Render with the worktree's `@playwright/test` at 1440 × 900 and 390 × 844 in Arabic, over HTTP on 3190. You judge the
page there (rounds item 10); English, 768, 1024, 320, 200% zoom and `file://` are rendered by the verifier, though
the page must work in each. In `D:/fitway-temp/owner-r04-settings/crops/`: `1-` the page at rest at each size; `2-`
each value in edit; `3-` each state; `4-` the range cases above, cropped to the element with a strip of its
neighbours; `5-` the phone's flows step by step (every sheet and dialog). Inspect every frame yourself and judge each
element as a whole composition and as one part of the page; a passing check is not a looked-at frame. (AGENTS.md;
DECISIONS item 25 lesson)

## Files

Write only new files under `design-research/owner-composition-exploration-r04/directions/eclipse/`: `settings.html`,
`settings.css`, `settings.js`, `settings-capture.mjs`, and `SETTINGS-SPEC.md`, the spec fragment the coordinator
merges as DESIGN-SPEC §4.5 (rows in DESIGN-SPEC's form, with new component rows marked for §3). New shared components
live in `settings.css` for now; say which belong in the shared sheets. Do not edit `style.css`, the shared component
and script files, `DESIGN-SPEC.md`, `INDEX.md`, or any other page; the rail and bar links are wired at integration.
Commit there.

## Report

The composition in a few plain lines and how it answers the owner's question; each open point above and what you
decided; each new component and why; what is lit and why; each state and action in one line; the amendments beyond
the contract; anything that reads wrong at any width, state or language, said plainly; any decision or rule that made
something read wrong, named (WORKING_AGREEMENTS "Rules and findings"); questions you would have asked the user. The
crop folder, the files you changed, each commit SHA. At most 60 lines.
