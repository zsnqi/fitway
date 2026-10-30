<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, its motion (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `public.css` and `public.js`: the page, live and its five other states (`?state=`).
  - `D:/fitway-temp/public-redesign-r01-states-18/notes.md`: the last designer's notes on the states.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", its first bulleted list only.
  - `DESIGN_GUIDE.md` §"6. Public state grammar", the table and "Loading behaviour".
  - `DESIGN_GUIDE.md` §"10. Interaction and motion".

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

- `<run>` is `public-redesign-r01-motion-19`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. The user accepted the page's
look and asked whether motion could make it feel alive. Decide the page's motion yourself, with Impeccable's `animate`,
then `polish`. What moves, when and how is yours; the limits below are fixed.

Earlier directions were turned down for trying to impress the visitor with too much invention. Motion that only
decorates falls under the same judgment.

## Limits

- **Truth:** motion never makes stale, absent, closed or loading data look live. Whatever signals that the page is
  live runs in the live state only and stops in every other state. A number never passes through values that were
  not readings, unless the reading's final value is what assistive technology hears, once (§10).
- **§10:** no `requestAnimationFrame` and no canvas; under `prefers-reduced-motion: reduce` every motion is instant
  and the page at rest is exactly what it is today. No `transition: all`.
- **Cost:** a visitor's phone runs this page for minutes. Anything that loops without end animates only `transform`
  or `opacity`, and the page does not repaint the whole screen while it loops.
- **At rest:** once each motion has finished, the page looks exactly as it does today, in every state, at every level.
- **Identity and content** as they are: dark; FITWAY red; the light; Readex Pro; no new element or word on the page.

## Deliverable

The motion in `public.css` and `public.js` under
`design-research/owner-composition-exploration-r04/directions/eclipse/` (you may add files there whose names start
with `public-`; leave every `public-sketch-*` file, the Owner pages and the shared `style.css` as they are). Add a way
to see each motion that needs an event, for example `?demo=` switches that change the reading, the level or the state
after a delay; keep `?level=`, `?mark=`, `?state=` and `?arrive=` working. Keep `window.__sketch = { ready: true }`
once the fonts have loaded. Commit at natural checkpoints with a short notes file in `D:/fitway-temp/<run>/` saying
what is decided and what is left, and once at the end.

Checks, all measured and reported:
- Under reduced motion, every state at both sizes is identical to the pixel to the page before this round (render
  the "before" frames first: the six states at Busy, and live at the four levels, phone and computer).
- With motion on, once every motion has settled (or at a loop's resting phase), the same frames match the "before"
  frames; report any difference and why.
- No layout shift during any motion (the layout-shift observer and the boxes of the word, the mark and the count).
- What runs in each non-live state: nothing that signals live.

Render with a node script in the run folder in the style of
`D:/fitway-temp/public-redesign-r01-states-18/` (its serve and capture scripts), Arabic, the phone 390 x 844 at
density 3 and the computer 1440 x 900 at density 2. For each motion, record a short video with Playwright's
`recordVideo` (phone size), saved as `D:/fitway-temp/<run>/video/<motion>.webm`, and build a film strip from it,
`D:/fitway-temp/<run>/strip-<motion>.png`: frames at even times through the motion side by side, each with its time
in ms under it, and the motion's Arabic name in large type at the top. Look at the strips yourself. No capture script
goes in the repository.

## Report

At most 40 lines: each motion in a line or two (what moves, when, how long, why), and what runs in each non-live
state; the reduced-motion and at-rest pixel comparisons; the layout-shift result; the video and strip paths; what you
chose not to animate and why; what is left; any rule that made the motion read wrong, named (WORKING_AGREEMENTS
"Rules and findings"); the files you changed and the commit SHA.
