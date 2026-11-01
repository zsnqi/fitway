<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page's `day`, second polish (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus) at its default effort. Concept-only (ADR-010): the superseded Public
Paper frames, the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `e951d2d1`
- **Starting point:** that HEAD, or the Markdown-only commits after it that bring in this brief.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-13.html`, `.css` and `.js`:
    the page you polish.
  - `D:/fitway-temp/public-redesign-r01-review-28/CRITIQUE.md`, its section "After the polish", and the reports it
    names there (`D:/fitway-temp/public-redesign-r01-review-28/a-after/REPORT.md`,
    `D:/fitway-temp/public-redesign-r01-review-28/finish/VERDICT-after.md`): what Impeccable's reviewers found in
    sketch 13.
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

- `<run>` is `public-redesign-r01-polish-30`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

Sketch 13 is the first polish of `day`; the reviewers scored it 28/36 and the finish reviewer still says `fix`. The
user looked quickly and asks for a second polish round. Their notes come first:

- **There is too much text.** Some of it is not needed, such as the line explaining that an hour or a day can be
  picked. Cut the page's words to what a trainee needs to decide when to go; the page should explain itself by its
  form. Say in the report what you cut and why each remaining line earns its place.
- **The level word on the computer has a problem with its place.** The coordinator's reading of
  `D:/fitway-temp/public-redesign-r01-review-28/after-frames/en-desktop-level-packed.png`: the word is pressed into the
  top corner at about the facts' scale, and the facts beside it hang lower than it, so it reads as a label beside the
  numbers rather than as what the page leads with. Find its right place and size on the computer.

Then the reviewers' open points on sketch 13, as findings for you to judge:

- the Today pill is the page's largest chalk area and competes with the red Now hour;
- on short computer screens (1280 x 720) the plot is squat;
- the finish reviewer asks for a light of its own for the live reading, in the family's manner; the last round chose
  not to, because it would cover the corner light and stack two cards;
- on the phone "10 PM" sits about 12 px from "12 AM" on the time axis.

Keep what works and what the reviewers named: the usual hours in grain with a chalk top; the one live hour in red light
standing past or short of its chalk usual line; its grain drifting up when busier and down when quieter; the quietest
time left never contradicting now; one column on the computer with the usual day as the page's body.

How you work is yours. Score your result with Impeccable's `critique` before you report.

## Limits

The sketch 12 brief's §"Limits" holds unchanged: identity, truth, privacy, and motion allowed with reduced motion
carrying the same information. English this round, with the `?dir=rtl` mirror kept working. Keep the switches
`?level=`, `?day=` and `?pct=off`. List every line of copy you remove, change or add.

## Deliverable

Copy sketch 13 to files whose names start with `public-sketch-14` under
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
`phone360@3` at Busy; `desktop@2` at Busy with `?pct=off`, with `?day=sat`, and with `?dir=rtl`; and a 1280 x 720
computer at Busy. Build `sheet-levels` (the four levels, phone then computer) and `sheet-checks` (the rest). The
coordinator renders the before and after comparison itself.

## Report

At most 40 lines:

- the critique's score for your result;
- the text: every line removed, changed or added, and why each remaining line stays;
- the level word on the computer: where it is now and why;
- each reviewer point above: what you did, or why not;
- the frame and sheet paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
