<!-- brief-format: v1 role: codex -->
# Codex brief: the motion round's measurable lows (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `285dd84`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 36, 37 and 38, and "How this milestone's rounds run" items 9 and 11. That file lives on another branch: read
  it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; the
  motion review `D:/fitway-temp/owner-r04-motion-review/REPORT.md` (F2, O3, O4); in the folder below, `README.md`
  §"Motion" and `DESIGN-SPEC.md` rows BTN-9, MOT-9, MOT-11, MOT-14 and MOT-19. Navigate code with `INDEX.md`. "The
  folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Your temp folder is `D:/fitway-temp/owner-r04-motion-lows/`. You run in the workspace-write sandbox with automatic
  approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- The pages open two ways, and every outcome holds in each: `index.html` (Daily), `reports.html`, `activity.html`,
  `access.html` and `components.html`, each from `file://` and over HTTP, at 1440, 768, 390 and 320 px, AR
  (`?lang=ar`, the default) and EN, with motion, with `prefers-reduced-motion: reduce`, and with `?motion=off`. The
  trial switches (MOT-19: Reports `?done=0|1|2`, Access `?row=0|1`) stay at 0 for every check except where an
  outcome names them. Phone checks run in a touch context at 390 × 844 and 320 × 568. Use port 3176 only.
- Render every baseline from your own `git archive <HEAD>` of the folder in your temp folder.

## Goal

Three low findings the motion review measured, and two lines the records round left untrue, none with taste in them, so the round the user sees has no known error
left (rounds item 11). The look, the timings and every moment's choreography stay as they are.

## Causes and required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing. Where a cause names a file and line, it is the review's reading at `0c43c90`: confirm it at the HEAD above
before you act.

- **M1. A label's position does not move at rest** (review F2, part). Cause: the review measured «نسخ» / "Copy" on
  Access's code view about 2 px off its place at `54b2737`, from the label stack MOT-14 added. Intent: holding a
  button's labels in one cell keeps its width while it runs; it must not move its words or icon. Outcome: at rest,
  before and after the press, every button MOT-14 changed has its label and icon centred in it as at `54b2737`
  (within 0.5 px), at every size and language above.
- **M2. The widths MOT-14 gives are written down** (review F2, part). Cause: a button that holds several labels is as
  wide as its widest one at rest (Daily's English "Try again" about 34 px wider, its cell holding "Trying again…";
  «تم» / "Done" 12 / 8.5 px wider); the spec names this only for the export button. Intent: BTN-9 chose a button
  that does not change size while it runs; the coordinator keeps that, so these widths are not a defect but must be
  recorded. Outcome: no width changes; BTN-9 or MOT-14 names every button whose rest width is set by a longer label
  it holds, with the label that sets it.
- **M3. No dead animation** (review O3). Cause: `components.css` about 248-249 still runs `cx-rise` / `cx-fade` on the
  component sheet's live dialog, under `motion.js`'s own opening. Intent: one source of motion per moment, as on the
  pages. Outcome: the sheet's live dialog and its scrim move only through `motion.js`; its frames during and after
  opening and closing equal what the pages' dialogs do by MOT-9; no unused keyframes remain in the folder's CSS.
- **M4. The page scrolls again when its window closes** (review O4). Cause: the closing ghost keeps
  `#dlg-export[open]`, so `html:has(#dlg-export[open]) { overflow: hidden }` (`reports.css` about 379) holds the scroll
  lock about 220 ms after the window has been closed. Intent: once the owner has closed the window, the page is
  theirs again, as it was before motion (at `54b2737` the lock lifted on the close). Outcome: the scroll lock lifts on
  the frame the window is closed, by every way out, for every dialog on every page that locks scroll; the folding
  ghost still draws as it does now; no layout shift at the close beyond what `54b2737` had.

- **M5. Two lines that the records round made untrue** (the records round's designer). Cause: at `285dd84` a new
  access record arrives with motion (MOT-17, MOT-18, OWN-C15), but `DESIGN-SPEC.md` OWN-C9 still says the record tops
  the records card at once, and `README.md` "Open and capture" lists `--size=d,t,p,z` without the `l` (1024) size that
  `motion-capture.mjs` now takes. Intent: the spec and README describe what the pages do. Outcome: both lines agree
  with the code at the HEAD above; no other row's meaning changes.

## Limits the result keeps

- **L1.** Every page's frames at rest equal the HEAD above, apart from M1's sub-pixel moves.
- **L2.** Every moment's frames during its movement equal the HEAD above (the trial switches' variants included),
  apart from M3's sheet dialog and M4's lock.
- **L3.** Reduced motion and `?motion=off` are instant with the same end state; nothing left over at rest.
- **L4.** `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check` and
  `motion-capture.mjs` pass as at the HEAD above or better (a check that fails there is reported, not fixed);
  `node --check` passes on every `.js` and `.mjs` in the folder.
- **L5.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

Write only in the folder: its `.css`, `.js` (not `tuner.js`), `.html`, `DESIGN-SPEC.md` (BTN-9, MOT-14, OWN-C9 and any row M3
or M4 makes untrue), `README.md` §"Motion" if it describes what changed and its "Open and capture" line (M5), and `INDEX.md` regenerated with the command
at its top.

## Report

Each outcome PASS or FAIL with its measure; any literal text that contradicted its intent; files changed; the commit
SHA. At most 30 lines.
