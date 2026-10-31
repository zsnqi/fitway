<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, a sketch of the narrowed direction (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page, the earlier rounds' pages and the generated images below are reference only, never a reason to
accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `c9ea5e1cc5e41cf6ccec9ec2e49c1674e83f03a0`
- **Starting point:** that HEAD, the merge that brought in this brief, or the commit after it that names it here.
  `public.css` and `public.js` there hold round 3's unfinished, unverified edit; read them for the identity only.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.css`: the identity to reuse, namely
    its colour tokens, its two `@font-face` rules for Readex Pro and the red light (`--ramp`, `--glow`). Read
    `public.html` only to see how they are wired. Do not edit either.
  - The four generated images in `D:/fitway-temp/public-redesign-r01-imagegen-21/`: `B4.webp` (the base), `B3.webp`
    (the count and the percentage), `A2.webp` (the bars), `A3.webp` (a glow to beat). They are AI drafts. Their
    typeface is not Readex Pro, and their sizes are not measurements.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", its first bulleted list only, and §"9. RTL, localization, and
    time".

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

- `<run>` is `public-redesign-r01-sketch-22`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. The user generated ten
mockups and narrowed the direction from them. Build that direction as a real page, so the user can judge it in a
browser. This is still the directions stage, so build **English only**, on the **phone and the computer**, and the
**live state at Busy only**.

- **The order** starts from B4. The level word "Busy" leads, large, in FITWAY red. The count follows, then the
  percentage, today's curve, the best time, and the open and Live line. The count and the percentage sit side by side
  as in B3. If you find a better order, make it and say why.
- **The curve** is drawn as bars, one per half hour from 6:00 AM to 1:00 AM. The bars up to now are today's readings,
  in a plain grey. The last stretch before now is deep red, and the bar at "Now" is FITWAY red. After "Now", the usual
  Friday continues faintly. A2 is closer to this than B2: the user disliked B2's grey ramp. This is not binding; judge
  it in the page.
- **The glow** is yours to design. The user found B3's glow bad and A3's nearly better, and expects the team to do much
  better. The lead idea is the light rising from the "Now" bar, so the bar itself reads as the source. It must never
  become a stage spotlight or an equalizer. Build three to five glow ideas, switchable with `?light=`:
  - `corner`: the page's current red light from the top corner, unchanged;
  - `now`: the light rising from the "Now" bar;
  - your own ideas, each with a short value name.

  Open on the one you think best.

## Limits

- **Identity:** dark; FITWAY red; the light; Readex Pro at its real weights; the FITWAY wordmark and logo as
  `public.html` draws them.
- **Content, synthetic:** level Busy; 70 inside, labelled approximate; 58% full; open until 1:00 AM; Live, last reading
  7:41 PM; today's bars to 7:41 PM; the usual Friday after it; "Usually quieter after 10 PM". The page must still read
  whole when the gym's owner turns the percentage off, so check it with `?pct=off`.
- **Truth:** nothing after "Now" may look like a reading; the usual day is visibly a usual day, and labelled one. The
  green Live dot appears only beside Live. The level's written word is always visible. Use Western digits and a
  12-hour time. No personal data.
- **Arabic comes later, but build for it now.** In Arabic, time runs right to left, and the bars, "Now" and the light
  mirror with it. Place everything from the inline-start edge and by minutes since opening, so that `dir="rtl"`
  mirrors the page without a redesign. No glow idea may depend on one reading direction.
- **Motion:** none this round. The page renders still, and under reduced motion it is identical.
- **Copy:** use the English the page already has where it fits (`public.js`, its `en` block). List every new English
  line for the user to review.

## Deliverable

Files whose names start with `public-sketch-8` under
`design-research/owner-composition-exploration-r04/directions/eclipse/` (an `.html`, a `.css`, and a `.js` only if
you need one). Leave `public.html`, `public.css`, `public.js`, every other `public-*` file, the Owner pages and the
shared `style.css` as they are. Set `window.__sketch = { ready: true }` once the fonts have loaded. Support
`?light=`, `?pct=off` and `?dir=rtl` (the mirror check only; English words stay). Commit at natural checkpoints, with
a short notes file in `D:/fitway-temp/<run>/` saying what is decided and what is left, and commit once at the end.

Render with node scripts in the run folder in the style of `D:/fitway-temp/public-redesign-r01-motion-19/`: the phone
at 390 x 844, density 3, and the computer at 1440 x 900, density 2, both under reduced motion. Save in
`D:/fitway-temp/<run>/frames/`:

- `en-phone-<light>.png` and `en-desktop-<light>.png` for every light;
- `rtl-phone-<light>.png` for every light, the mirror check;
- `en-phone-pctoff.png` and `en-desktop-pctoff.png` on your default light.

Build three sheets, each frame under its light's name in large type:

- `sheet-phone.png`, every light on the phone;
- `sheet-desktop.png`, every light on the computer;
- `compare.png`: your default page on the phone beside `B4.webp`, `B3.webp`, `A2.webp` and `A3.webp`.

No capture script goes in the repository. Look at your frames yourself.

## Report

At most 40 lines:

- the order you chose, and why it differs from B4 if it does;
- each light idea in a line, and your pick with the reason;
- how the bars read, and what you did about the grey;
- how the page holds without the percentage, and whether the mirror check holds for each light;
- the new English lines;
- the frame and sheet paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
