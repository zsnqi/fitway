<!-- brief-format: v1 role: fixer -->
# Fixer brief: the public crowd page, two smaller sizes of the level's word (public-redesign-r01)

For a fresh `owner-direction-fixer` (Sonnet, high). Concept-only (ADR-010). The target below is frozen: apply it as
written and make no design decision of your own. Where it cannot be met as written, stop and report why.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`,
  `public.css` and `public.js` (all of them, short); and
  `D:/fitway-temp/public-redesign-r01-share-12/shots.mjs` and `compare.mjs`, the coordinator's last renders, which you
  reuse for the way of opening the page, the pixel density and the comparison sheet.

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

- `<run>` is `public-redesign-r01-size-13`.
- No design skill is needed; load none.

## What to build

The user finds the level's word («هادئ», «متوسط», «مزدحم», «شديد الازدحام») too large, at every size. Add one switch,
`?size=75` and `?size=67`, read by `public.js` and set on `.page` (for example a class or a custom property). It
scales the level's word to 75 % or 67 % of the size it has today, at every screen size and every level, with or without
the other switches. It also scales the word's own gap to the mark (`--gap-word`), so the word keeps its spacing. It
changes nothing else: the count's size, the mark, the small type, the header, the light and the stamp keep their
sizes, even where today they are computed from the word (keep those on the unscaled value). The page without
`?size` must render exactly as today: compare its frames against
`D:/fitway-temp/public-redesign-r01-share-12/phone-packed.png` and `computer-packed-two-lines.png` (same switches,
same density) pixel for pixel and report the result. If the mark's line moves when the word is smaller, that is
expected; report how far it moves at 390 x 844 and 1440 x 900.

## Images

All with `?p2&p3` on and `p1` off, Arabic, reduced motion, the computer at 1440 x 900 and density 2, the phone at
390 x 844 and density 3, as in `shots.mjs`. For each size (today, 75, 67) render the phone and the computer at Busy and
at Packed, into `D:/fitway-temp/<run>/<device>-<level>-<size>.png` (`size` one of `100`, `75`, `67`).

Then build two comparison images in the style of `compare.mjs` (Arabic headings, the dark ground, density 2):

- `compare-phone.png`: three columns headed «الحجم الحالي», «أصغر بالربع», «أصغر بالثلث» (right to left), two rows,
  «مزدحم» and «شديد الازدحام», each row named at its side.
- `compare-computer.png`: the same three columns and two rows, for the computer.

Title each «حجم كلمة المستوى على الجوال» / «حجم كلمة المستوى على الكمبيوتر». Look at every image yourself: a clipped
word, an overlap, a sideways scroll or a console error is a failure to report, not to hide.

Commit once. No capture script goes in the repository. You change only `public.css` and `public.js`.

## Report

At most 15 lines: what you changed; the no-`size` comparison result; how far the mark's line moves at each size on the
phone and the computer; the two comparison image paths; anything that failed; the commit SHA.
