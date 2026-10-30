<!-- brief-format: v1 role: fixer -->
# Fixer brief: the public crowd page, the level's word at 40 px on the phone and 90 px on the computer (public-redesign-r01)

For a fresh `owner-direction-fixer` (Sonnet, high). Concept-only (ADR-010). The target below is frozen: apply it as
written and make no design decision of your own. Where it cannot be met as written, stop and report why.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`,
  `public.css` and `public.js` (all of them, short); and in `D:/fitway-temp/public-redesign-r01-packed-16/`,
  `serve.mjs`, `shots-all.mjs`, `shots-pc.mjs`, `compare-all.mjs` and `compare-pc.mjs`, the coordinator's renders of
  the target (made by injecting CSS at capture time), which you reuse for serving, density and the sheets.

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

- `<run>` is `public-redesign-r01-sizes-17`.
- No design skill is needed; load none.

## What to build

The user finds the level's word too large. Only the word's size changes (and its gap to the mark, which already
follows `--word-fs`); the count, the small type, the mark, the header, the light and the stamp keep their sizes.

1. **The phone (below 1024 px):** every level's word is
   `calc((100vw - 2 * var(--pad)) / 6.131 * 0.7)`, in place of today's `min(...)`: «شديد الازدحام» takes 70 % of the
   column, and all four levels share that size (about 40 px at 390, 36.5 at 360, 74 at 768). The word stays on one
   line, as today.
2. **The computer (1024 px and up):** `--size` becomes `0.67 * 90 / 126.974` (about 0.4749) in place of 0.67, so the
   word is 90 px at 1440 x 900 and keeps today's formula at every other width. Packed sits on one line from 1024 px
   (move `max-inline-size: none; white-space: nowrap` for `.word` from the 1152 px block to the 1024 px block).
3. Update the comments that state the sizes (the header and the blocks you touch) to the new numbers.

## Checks

- Packed on one line, clear of the count column by at least `--col-gap`, at 1024 x 768, 1100 x 800, 1152 x 800,
  1440 x 900, 1920 x 1080, 2560 x 1440 and 3840 x 2160. If it fails at any of them, stop and report the widths and
  gaps; do not change anything else to make it fit.
- The percentage line's bottom at least 12 px above the mark's top at 1024 x 768, 1152 x 800, 1280 x 720,
  1440 x 900 and 1920 x 1080, at Busy and at Packed. Report every value; report a failure, do not fix it.
- On the phone at 360 x 800, 390 x 844 and 768 x 1024: the word's size at each of the four levels (equal at each
  width), Packed on one line, nothing clipped, overlapped or scrolled sideways.
- No console errors. `?level=` and `?mark=` keep working.
- Compare against the coordinator's injected renders and report the differing pixel count (sub-pixel text differences
  are expected; a moved block is not): the phone at 390 x 844 against `D:/fitway-temp/public-redesign-r01-packed-16/frames/all-<level>.png`,
  the computer at 1440 x 900 against `frames/pc-busy-90.png` and `frames/pc-packed-90.png` there.

## Images

Arabic, reduced motion, the phone at density 3, the computer at density 2, as in the scripts above, into
`D:/fitway-temp/<run>/`: `phone-<level>.png` for the four levels at 390 x 844; `computer-busy.png` and
`computer-packed.png` at 1440 x 900; `computer-packed-1024.png` at 1024 x 768.

Two sheets in the style of `compare-all.mjs` and `compare-pc.mjs`: `compare-phone.png`, titled
«الجوال: كلمة المستوى 40px», the four levels right to left «هادئ», «متوسط», «مزدحم», «شديد الازدحام», each named
above its frame; and `compare-computer.png`, titled «الكمبيوتر: كلمة المستوى 90px», Busy and Packed at 1440 x 900 side
by side, each named above. Look at every image yourself: a clipped word, an overlap, a sideways scroll or a console
error is a failure to report, not to hide.

Commit once. No capture script goes in the repository. You change only `public.css` (and `public.js` only if a
comment there states a size).

## Report

At most 15 lines: what you changed; the check results with their numbers; the pixel comparisons; the image paths;
anything that failed; the commit SHA.
