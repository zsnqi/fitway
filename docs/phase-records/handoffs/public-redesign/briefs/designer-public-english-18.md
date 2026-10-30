<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, English and a last polish (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `public.css` and `public.js`: the page, its states (`?state=`) and its motion (`?demo=`).
  - `D:/fitway-temp/public-redesign-r01-states-18/notes.md` and `D:/fitway-temp/public-redesign-r01-motion-19/notes.md`: the last two designers' notes.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", its first bulleted list only; §"6. Public state grammar"; §"9. RTL, localization, and time"; §"10. Interaction and motion".
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md` rows GLO-2, GLO-3, GLO-5, GLO-7, GLO-9, GLO-17, and STA-10 to STA-13 for their English words only.

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

- `<run>` is `public-redesign-r01-english-20`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill (`ux-araby` for Arabic copy is allowed). Impeccable's context,
  notes and any file it writes outside the pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. The page is Arabic, live and
in five other states, with its motion. This round does two things:

1. **English.** The page's English, written naturally for itself (GLO-17), left to right, with AM/PM, in every state
   and at every level, the motion following the reading direction. The language button switches between the two;
   `?lang=en` opens English directly.
2. **A last polish of the whole page**, both languages, every state, phone and computer, with Impeccable's `critique`
   and then `polish`. The previous designers left these findings, yours to judge and to act on or leave with a
   reason:
   - on the computer, «تعذّر التحميل» and «لا عدّ حاليًا» set at the level word's size read loud, and Closed,
     Unavailable and Error leave the mark's row empty, so the page loses its ground line;
   - on the phone, Delayed's two staggered foot lines differ from live's single line;
   - Delayed's qualification sits away from the word (dimming, the hatch, «حينها» and the foot status only);
   - a count gaining a digit, and Packed's arrival from Loading, move the count's label 11-15 px (Readex has no
     tabular figures);
   - the count column's rule that keeps the percentage at least 16 px above the mark on the computer is a fitted
     formula in `public.css`; a cleaner mechanism with the same outcome is welcome.

## Limits

- **Accepted, and kept:** the live page's layout, the level word's size (about 40 px on the phone at 390, 90 px on the
  computer at 1440 x 900; one size at every level; «شديد الازدحام» on one line), the mark (the four bars), the
  percentage at least 16 px above the mark, and the motion's choices. How the non-level states set their answer is
  open to your polish.
- **Identity:** dark; FITWAY red; the light; Readex Pro at its real weights.
- **Name:** the brand FITWAY is the gym's name; no other name appears on the page.
- **Truth:** nothing stale, absent, closed or loading looks live; the count is labelled approximate; the level mark
  derives from the level only and its written word is always visible where a level is shown; Western digits and a
  12-hour time in gym time; no personal data; synthetic data only. Motion keeps the limits of §10 (no
  `requestAnimationFrame`, no canvas, instant under reduced motion).
- **Copy:** leave the Arabic words as they are, except where your critique finds a line wrong; list every change and
  every new English line not in the rows above, for the user to review.

## Deliverable

`public.html`, `public.css` and `public.js` under `design-research/owner-composition-exploration-r04/directions/eclipse/`
(you may add files there whose names start with `public-`; leave every `public-sketch-*` file, the Owner pages and the
shared `style.css` as they are). Keep `?level=`, `?mark=`, `?state=`, `?arrive=` and `?demo=` working in both
languages, and `window.__sketch = { ready: true }` once the fonts have loaded. Render the Arabic page before you change
anything (live at four levels and the five states, phone and computer, reduced motion) and report, after, which of
those frames changed and why. Commit at natural checkpoints with a short notes file in `D:/fitway-temp/<run>/` saying
what is decided and what is left, and once at the end.

Render with node scripts in the run folder in the style of `D:/fitway-temp/public-redesign-r01-motion-19/`, the phone
390 x 844 at density 3 and the computer 1440 x 900 at density 2, reduced motion for stills. Save in
`D:/fitway-temp/<run>/frames/` `<lang>-<device>-<state>.png` for both languages, the six states (live at Busy) and
`<lang>-<device>-packed.png`. Build four sheets: `sheet-en-phone.png` and `sheet-en-desktop.png` (the English frames,
each under its English name in large type, live and Packed first) and `sheet-ar-phone.png` and `sheet-ar-desktop.png`
(the Arabic frames after your polish, the same way, in Arabic). Record one English video of the level change and the
first arrival (`video/en-level.webm`, `video/en-arrival.webm`) with a film strip each, as the last round did. No capture
script goes in the repository. Look at your frames yourself.

## Report

At most 40 lines: English in a few lines; the critique's main findings with its scores; what you changed for each
finding above and for the critique, and what you left and why; which Arabic frames changed; the copy changes and the
new English lines; the frame, sheet, video and strip paths; what is left; any rule that made the page read wrong,
named (WORKING_AGREEMENTS "Rules and findings"); the files you changed and the commit SHA.
