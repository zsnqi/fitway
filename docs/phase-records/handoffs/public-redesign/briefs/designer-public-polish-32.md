<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page's `day`, third polish (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus) at its default effort. Concept-only (ADR-010): the superseded Public
Paper frames, the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `2b449fef`
- **Starting point:** that HEAD, or the Markdown-only commits after it that bring in this brief.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-14.html`, `.css` and `.js`:
    the page you polish.
  - `D:/fitway-temp/public-redesign-r01-review-31/motion-before/REPORT.md`: a motion review of sketch 14 against
    Emil Kowalski's rules, with measurements.
  - `D:/fitway-temp/public-redesign-r01-review-31/reader-before/REPORT.md`: what a reader with no context understood
    from sketch 14's frames (`D:/fitway-temp/public-redesign-r01-review-31/coordinator/reader-frame-map.txt` maps its
    image names to states).
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`: the motion rules you work to, under the
    precedence below. Read it as a file.
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

- `<run>` is `public-redesign-r01-polish-32`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the
  design skill; its `animate` reference is yours for the motion. This round, as a trial the user agreed, you also work
  to `STANDARDS.md` for motion only, under the precedence below; load no other design or taste skill. Impeccable's
  context, notes and any file it writes outside the pages go in `D:/fitway-temp/<run>/`, never in the repository.
  (AGENTS.md; the user's trial)

## The question

The user tried sketch 14 on their computer. The design and the motion are right («التصميم ممتاز ... وحتى الانميشين
ممتاز»). Polish it a third time on their notes:

- **Picking the Now hour repeats the head.** The card's readout then says "7 PM: busy now, busier than usual", which
  the level word and "Busier than usual" already say. Make the readout say something the head does not, or nothing
  new, when Now is picked.
- **The bars' grain is too strong** («الاعمدة قوية مره»). Lighten the grain in the bars; the page's and the card's
  grain stay. Offer two or three strengths behind a `?grain=` switch, your pick as the default, so the user chooses
  by eye. Keep the bars reading as the family's grain with a chalk top, not as flat grey.
- **The hover track is disliked.** On the computer a hovered hour shows a faint full-height track behind it
  (`public-sketch-14.css:315-317`), which the user reads as a shadow behind the bar and does not like. Find another
  hover answer that says the hour can be picked.
- **The motion, polished, not changed.** Work to `STANDARDS.md` with this precedence, the user's decision:
  - **The arrival** (the usual hours rising with their stagger, the live hour, the readout) keeps its character and
    its length; the user's taste outranks any rule. Fix only its defects.
  - **The interactions** (hover, picking an hour by pointer, touch, arrows or Escape, picking a day and the bars
    moving to it, the readout changing, the live hour's running motion) follow `STANDARDS.md`'s values.
  - **Reduced motion** carries the same information without spatial movement.
- The motion review's and the reader's findings are findings for you to judge, not instructions; say what you did
  with each that matters. Outside this round: where the levels' thresholds fall (data semantics, not the page's), the
  frames' fixed 7:41 PM (the frames' clock), and the concept label's place. The reader did not know whether the bars
  can be tapped; the user decided against a tap cue, so leave it.
- The levels are `?level=quiet|moderate|busy|packed`.

Keep what the user and the reviewers named: the usual hours in grain with a chalk top; the one live hour in red light
standing past or short of its chalk usual line; its grain drifting up when busier and down when quieter; the quietest
time left never contradicting now; one column on the computer with the usual day as the page's body. And keep the
user's answers: "Quietest time left" keeps its words; the picked day stays outlined; no tap cue on the phone; the
live reading gets no light of its own; today's closing time stays in the card's "Open 1 PM – 1 AM".

How you work is yours. Score your result with Impeccable's `critique` before you report.

## Limits

The sketch 12 brief's §"Limits" holds unchanged: identity, truth, privacy, and motion allowed with reduced motion
carrying the same information. English this round, with the `?dir=rtl` mirror kept working. Keep the switches
`?level=`, `?day=` and `?pct=off`, and add `?grain=`. List every line of copy you remove, change or add.

## Deliverable

Copy sketch 14 to files whose names start with `public-sketch-15` under
`design-research/owner-composition-exploration-r04/directions/eclipse/` and work there. Leave every other `public-*`
file, the Owner pages and the shared `style.css` as they are. Set `window.__sketch = { ready: true }` once the fonts
have loaded. Commit at natural checkpoints, with a short notes file in `D:/fitway-temp/<run>/` saying what is decided
and what is left, and commit once at the end.

## Frames

Render every frame with `pnpm verify:owner frames` and lay frames out with `pnpm verify:owner sheet`, as
`D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Public designer
frames" gives them, into `D:/fitway-temp/<run>/`, which the coordinator made with `pnpm run-folder:new`. Run them,
read only, from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to
this worktree's `design-research/owner-composition-exploration-r04/directions/eclipse` folder as an absolute path.
Inspect every frame yourself before reporting; a passing command is not a looked-at frame. (agent-tooling DECISIONS
item 23)

Render under reduced motion, into `D:/fitway-temp/<run>/frames/`: `phone@3` and `desktop@2` at the four levels;
`phone360@3` at Busy; `desktop@2` at Busy with `?pct=off`, with `?day=sat`, and with `?dir=rtl`; a 1280 x 720
computer at Busy; and `phone@3` and `desktop@2` at Busy for each `?grain=` strength. Build `sheet-levels` (the four
levels, phone then computer), `sheet-grain` (the strengths side by side) and `sheet-checks` (the rest). Measure the
interactions you changed with ui-forensics' `C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs`
(its guide is `C:/Users/Pc Force/.agents/skills/ui-forensics/references/browser-tools.md`), into
`D:/fitway-temp/<run>/motion/` (its self-test may write to `D:/Temp/ui-forensics-selftest`). The coordinator renders the before and after comparison itself.

## Report

At most 40 lines:

- the critique's score for your result;
- the Now readout, the grain strengths and your default, and the hover: what each is now and why;
- the motion: each motion you changed, from what to what, with the `STANDARDS.md` value and the measurement; the
  arrival's defects you fixed;
- the motion review's and the reader's findings: what you did, or why not;
- every line of copy removed, changed or added;
- the frame, sheet and measurement paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
