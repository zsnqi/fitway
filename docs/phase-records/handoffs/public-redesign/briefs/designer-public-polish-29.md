<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page's `day`, reviewed and polished (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus) at its default effort. Concept-only (ADR-010): the superseded Public
Paper frames, the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `320ba2af`
- **Starting point:** that HEAD, or the Markdown-only commits after it that bring in this brief.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-12.html`, `.css` and `.js`
    at `?design=day`: the page you polish.
  - `D:/fitway-temp/public-redesign-r01-review-28/CRITIQUE.md`: Impeccable's review of it (two isolated assessments,
    the detector and the finish reviewer), with the evidence folders it names.
  - `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketch-27.md` §"Limits" and §"Content and
    switches": the rules and the content, unchanged.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` and
    `design-research/owner-composition-exploration-r04/directions/eclipse/evidence/daily-en-1440x900.png`: the Owner
    pages' family.

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

- `<run>` is `public-redesign-r01-polish-29`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

The user picked `day` from sketch 12 and wants it reviewed and polished, **the computer's layout first**. Impeccable's
reviewers have read it (the critique above): it is authored and in the family, but scores 24/36 with a finish verdict
of `fix`. Make `day` a finished page: answer what the critique found, in your own way.

The critique's findings are findings, not instructions; where you judge one wrong, say why. The ones that matter most:

- **The quietest time left must never contradict now.** When now is the quiet time, the page says so.
- **The computer's layout.** The start column is half empty, the chart's top third is dark, one fact is said three
  times, the day picker stops short. The critique asks whether the computer should be a split at all, or the usual day
  the page itself with the word on it. That is yours to decide.
- **Nothing invites a tap** on an hour or a day.

The user's own notes on sketch 12:

- **The four-step mark beside the level word** does not suit the page as it is. Find a better answer: a different
  mark, or none.
- **The chalk line at the usual on the live column** is clear and needs no key. You may try a motion that shows the
  count running above or below the usual, without changing the page's design.
- The capacity that the count and the percentage reveal together is not a concern now.

Keep what the finish reviewer named: the usual hours in grain with a chalk top, and the one live hour in red light
standing past or short of its chalk usual line.

How you work is yours. Score your result with Impeccable's `critique` before you report.

## Limits

The sketch 12 brief's §"Limits" holds unchanged: identity, truth, privacy, and motion allowed with reduced motion
carrying the same information. English this round, with the `?dir=rtl` mirror kept working. Keep the switches
`?level=`, `?day=` and `?pct=off`; `?design=` may go. List every line of copy you change or add.

## Deliverable

Copy sketch 12 to files whose names start with `public-sketch-13` under
`design-research/owner-composition-exploration-r04/directions/eclipse/` and work there; `week` and `later` may be
removed from the copy. Leave every other `public-*` file, the Owner pages and the shared `style.css` as they are. Set
`window.__sketch = { ready: true }` once the fonts have loaded. Commit at natural checkpoints, with a short notes file
in `D:/fitway-temp/<run>/` saying what is decided and what is left, and commit once at the end.

## Frames

Render every frame with `pnpm verify:owner frames` and lay frames out with `pnpm verify:owner sheet`, as
`D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Public designer
frames" gives them, into `D:/fitway-temp/<run>/`, which the coordinator made with `pnpm run-folder:new`. Run them,
read only, from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to
this worktree's `design-research/owner-composition-exploration-r04/directions/eclipse` folder as an absolute path.
Inspect every frame yourself before reporting; a passing command is not a looked-at frame. (agent-tooling DECISIONS
item 23)

Render under reduced motion, into `D:/fitway-temp/<run>/frames/`: `phone@3` and `desktop@2` at the four levels;
`phone360@3` at Busy; `desktop@2` at Busy with `?pct=off`, with `?day=sat`, and with `?dir=rtl`. Build
`sheet-levels` (the four levels, phone then computer) and `sheet-checks` (the rest). The coordinator renders the
before and after comparison itself.

## Report

At most 40 lines:

- the critique's score for your result, and for each finding in `CRITIQUE.md` what you did, or why not;
- the computer's layout: what it is now and why;
- the level mark's answer, and the motion above or below the usual if you tried one;
- what moves, and how it reads under reduced motion;
- the copy you changed or added;
- the frame and sheet paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
