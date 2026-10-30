<!-- brief-format: v1 role: fixer -->
# Fixer brief: the public crowd page, the accepted switches become the page (public-redesign-r01)

For a fresh `owner-direction-fixer` (Sonnet, high). Concept-only (ADR-010). The target below is frozen: apply it as
written and make no design decision of your own. Where it cannot be met as written, stop and report why.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`,
  `public.css` and `public.js` (all of them, short); and `D:/fitway-temp/public-redesign-r01-size-13/shots.mjs` and
  `compare2.mjs`, the last renders, which you reuse for the way of opening the page, the pixel density and the
  comparison sheet.

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

- `<run>` is `public-redesign-r01-default-15`.
- No design skill is needed; load none.

## What to build

1. **Before editing**, render the "before" frames from the page as it is (Arabic, reduced motion, densities as in
   `shots.mjs`): the computer at 1440 x 900 and 1152 x 800 with `?p1&p2&p3&size=67`, at all four levels, into
   `D:/fitway-temp/<run>/before/`.
2. **Make the page without switches render what `?p1&p2&p3&size=67` renders today**, with one change on the phone
   (below). Remove the switches `p1`, `p2`, `p3`, `p1m` and `size` from `public.js`, and their classes from
   `public.css`, folding each rule into the page's own rules. `?level=` and `?mark=` keep working as they do.
3. **The phone (below 1024 px):** every level's word gets
   `min(<its size a third smaller, as size67 gives today>, (100vw - 2 * var(--pad)) / 6.131)`, the cap `?p1m` gives
   Packed today, now at all four levels, so the four share one size at every width. Packed sits on one line
   (`max-inline-size: none; white-space: nowrap`), as under `?p1m`. The word's gap to the mark follows the word's
   size, as `--gap-word` does today.
4. **Checks.** The computer at 1440 x 900 and 1152 x 800, all four levels, without switches, must match the "before"
   frames pixel for pixel; report the result. At 390 x 844, 360 x 800 and 768 x 1024, measure the word's font size at
   each level (all four equal at each width) and that Packed is one line with nothing clipped, overlapped or scrolled
   sideways. No console errors.

## Images

Render at Busy and at Packed, without switches: the phone at 390 x 844 (density 3) and the computer at 1440 x 900
(density 2), into `D:/fitway-temp/<run>/<device>-<level>.png`; also the phone at Quiet and Moderate.

Then one comparison image in the style of `compare2.mjs` (Arabic headings, the dark ground, density 2),
`compare-phone.png`, titled «الجوال: كلمة المستوى أصغر، وشديد الازدحام بسطر واحد»: the four phone levels side by
side, right to left «هادئ», «متوسط», «مزدحم», «شديد الازدحام», each named above its frame. Look at every image
yourself: a clipped word, an overlap, a sideways scroll or a console error is a failure to report, not to hide.

Commit once. No capture script goes in the repository. You change only `public.css` and `public.js`.

## Report

At most 15 lines: what you changed; the computer's pixel comparison; the phone word's size at each width and level;
the image paths; anything that failed; the commit SHA.
