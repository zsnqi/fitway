<!-- brief-format: v1 role: designer -->
# Designer brief: the pressed state, and the two lists that zoom an iPhone (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). This is concept-only work (ADR-009): the superseded Owner Paper
frames are reference only. You design and build in one pass (rounds items 6 and 9). The user sees the finished
round on both their phones (items 7 and 11). The pressed state's form is yours, within the limits below (the user,
2026-10-10).

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `691d62d5`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 36, 41 and "How this milestone's rounds run" items 7, 9, 10 and 11.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/briefs/css-round-spec.md`
    §"Implementation Decisions": the paragraphs "The pressed state" and "Field text" ("The two lists");
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`, in full;
  - in the folder below, `DESIGN-SPEC.md` rows MOT-1, MOT-11, MOT-18, BTN-1, FOC-1 to FOC-3, FOC-8 and SAFE-1;
  - in the folder below, `README.md` §"Motion".

  "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other design or taste skill.
- **Render from `file://` only.** Another round holds ports 3176-3177. Frames, notes and scratch go under
  `D:/fitway-temp/owner-r04-pressed/`.
- Commit at natural checkpoints, and keep a `NOTES.md` there: what is decided, built and left (item 10).

## What the owner should feel, and why

Today nothing shows that a control was pressed (the concept has no pressed state). On a phone, the only sign was the
hover colour that stuck after a tap, and the previous round removed that. The owner should see at once, under the
finger or the mouse, that the press landed, so they never tap twice. The page is an instrument: calm, premium, dark
glass with one static red light (item 1). The press should feel like part of it, not a generic web effect.

Every control that does something when pressed is in scope: buttons, links, tabs, segments, chips, rail and tab-bar
items, rows that open something, dialog actions, the date picker's days, and the two lists. This covers Daily,
Reports, Activity log, Access and the components sheet. Inventory them first.

Draw the press against its whole range (rounds item 7):
- Arabic and English;
- the computer and the phone;
- every control's states (current or selected, open, Working);
- a fast double tap;
- forced colours;
- reduced motion.

## Hard limits

- **Timing.** The pressed state appears at pointer down or touch start, with no delay, so a fast tap still shows it.
- **No fading glyphs.** No glyph changes opacity (MOT-1).
- **Movement.** A small shrink is allowed. Under reduced motion and `?motion=off` the press is colour or light only,
  with no movement (MOT-11).
- **Nothing else moves.** No layout shift. A control's neighbours do not move.
- **Excluded controls.** A disabled control shows no press: where it explains why it is off, the explanation is the
  response. The charts' plots and the light tuner get no press.
- **No vibration.** On any device.
- **Keyboard.** No added script. Space gives the pressed state where the browser does it natively.
- **Tap highlight.** The browser's tap highlight is removed only where your pressed state replaces it.
- **iPhone.** Safari has applied `:active` on touch only when the page listens for touch. This is general knowledge,
  not verified here, and the user's iPhone try will prove it. Make sure the page meets that condition.
- **The two lists.** Activity's person filter (`activity.css:79`) and Reports' sort list (`reports.css:620`) are
  13.5 px. On an iPhone, tapping either must never zoom the page.
  - Their form is yours: 16 px text, or the native list kept at 16 px under a control that looks as it does today.
  - Check the widest option text the code can produce in both languages: the longest owner name in the person list,
    and every sort label.
- **What the previous round settled stays.** Hover still applies only where hover exists, and in forced colours the
  rings, edges and selected states hold (FOC-8). The concept CSS check (`node
  D:/Projects/fitway-worktrees/owner-design-exploration-r04/scripts/check-concept-css.mjs <the folder>`) still
  reports only its two named allowances.
- **Frames at rest.** Every frame at rest, with nothing pressed, looks exactly as it does at `691d62d5`. The two
  lists are the only exception.
- **The rest of the concept.** Eclipse's look (item 1), DO-NOT in full, and the existing copy, unchanged.

## Files

Write only in the folder:
- the pages' `.css` and `.js`, not `tuner.js`;
- `README.md` §"Motion";
- in `DESIGN-SPEC.md`: one MOT row and one state row for the press, the type and component rows of the two lists,
  and MOT-18 if it changes;
- `INDEX.md`, regenerated with the command at its top.

Keep the press in one shared place every page uses, so Settings and the remaining screens reuse it.

## Frames

- **What you judge** (item 10). Judge the press at 1440 × 900 and at 390 × 844 in Arabic, with a held mouse (the
  button down over the control) and with a tap. Headless Chromium does not apply `:active` while an emulated touch is
  held (the coordinator's probe), so a touch frame that shows no press is not evidence either way.
- **What you hand over.** For each kind of control, frames at rest and held, numbered the same in both languages, in
  your output folder. Render English and the other sizes as end states only; the verifier and the user's phones cover
  the rest.

## Report

- The press: its form, its timing, and why it fits this instrument.
- The inventory: each kind of control, with its frames.
- The two lists: how they stop the zoom, with frames at their widest option.
- Anything that reads or feels wrong at any size, language or setting, said plainly, with the rule that produced it
  named.
- Where a limit stopped something you think matters.
- Questions you would have asked the user.
- The output folder, the files you changed, and the commit SHA.

At most 40 lines.
