<!-- brief-format: v1 role: codex -->
# Codex brief: hover only where hover exists, rings and edges in high contrast, 16 px text fields (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `58433873`
- **Milestone:** `owner-design-exploration-r04`. Decisions: item 41 and "How this milestone's rounds run" items 3
  and 9 in `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/briefs/css-round-spec.md`
  §"Implementation Decisions", the paragraphs Hover gating, Focus rings, Forced colours, Full screen and edges, and
  Field text; in the folder below, `DESIGN-SPEC.md` rows FOC-1 to FOC-3, TYP-3 and TYP-6; `DESIGN_GUIDE.md` §"8.
  Responsive contract". "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- **Your temp folder** is `D:/fitway-temp/owner-r04-css-round/`. You run in the workspace-write sandbox with
  automatic approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- **Tools.** Run these read-only from the coordinator's worktree `D:/Projects/fitway-worktrees/owner-design-exploration-r04`
  at `befbec5f`. Never edit them.
  - The concept CSS check: `node <that worktree>/scripts/check-concept-css.mjs <the folder>`. On the base it reports
    87 findings: `ungated-hover` 76 and `outline-without-ring` 11.
  - The verify-fitway CLI: `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`, guide in its `SKILL.md`.
    `--colors forced` renders Windows high contrast, and `measure --tool focus --colors forced` measures every Tab
    stop. Use ports 3176-3177 only. If one is held by a process you did not start, never stop it.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop 1440×900, tablet,
  phone 390×844 and 320 wide; motion on, reduced, and `?motion=off`.
- **The base** is the folder at `58433873`, from your own `git archive`. Port 3174 is the user's live preview of
  this worktree; leave it running.

## Goal

On a phone a tap leaves no hover colour. In Windows high contrast every Tab stop, control edge and selected state
stays visible. On an iPhone the page uses the full screen and keeps clear of the notch and home indicator, and
tapping a text field does not zoom. With a mouse in normal colours, nothing looks different except the text inside
text fields.

## Causes and required outcomes

- **C1. Hover applies on every device.**
  - **Cause.** On the base, 76 hover rules sit outside a hover media query: `style.css` 22, `reports.css` 20,
    `components.css` 13, `access.css` 9, `activity.css` 9, `picker.css` 3. Only `style.css:844`, `activity.css:139`
    and `picker.css:56,66` are gated, and `picker.css:45` undoes one hover for touch.
  - **Outcome.**
    - The check reports 0 `ungated-hover`.
    - With a mouse, every element a hover rule targets shows, when hovered, the base's computed colour, background,
      border and shadow.
    - In a touch context (`hover: none`), none of them shows a hover style after a tap.
    - Both hold on every page, in both languages, at desktop and phone.
  - **Intent.** No colour sticks after a finger lifts, and mouse users see no change. The gate is `hover: hover` alone
    (the spec).
- **C2. Outline removals the check cannot prove.**
  - **Cause.** The check lists 11 rules: `style.css:113,217,1120`, `reports.css:618,678`, `activity.css:78,103`,
    `components.css:47,460,467` and `picker.css:53`. On the base in forced colours, at 1440×900 in English and
    390×844 mobile in Arabic, every Tab stop of the five pages measured a ring with one exception: the sheet's heat
    cell `#heat td.cx-hc` (stop 21) reads low-contrast in both languages (`D:/fitway-temp/owner-css-base-focus/`).
  - **Outcome.**
    - The check reports 0 `outline-without-ring`. **Allowance:** a removal may stay only on an element that is never
      a Tab stop (a programmatic focus target with `tabindex="-1"`). Name each such removal in the report with its
      evidence.
    - In forced colours, `measure --tool focus` reports no failed stop on the five pages, in both languages, at
      those two sizes. The heat cell is included.
    - In normal colours each focused stop looks as at the base.
  - **Intent.** A keyboard user in high contrast always sees where they are, and the check can guard rings from now
    on.
- **C3. No forced-colours rules.**
  - **Cause.** The concept has none. Under forced colours an edge drawn as a box-shadow disappears (for example
    `reports.css:613`), and a state shown only by a background can too.
  - **Outcome.** In forced colours, on every page at desktop and phone in both languages:
    - every control and field shows a visible edge;
    - every current or selected state stands apart from its siblings: the current rail and tab-bar item, the chosen
      segment and period, the picker's chosen days, an expanded disclosure;
    - disabled controls stand apart from enabled ones;
    - the charts' plots keep their drawn colours, and text takes the system colours.
  - **Intent.** A high-contrast user can operate every control and read every state, and the charts stay readable
    without a redraw. This is the minimum level the user chose.
- **C4. The page never opts into the full screen.**
  - **Cause.** The viewport meta on line 5 of `index.html`, `reports.html`, `activity.html`, `access.html` and
    `components.html` lacks `viewport-fit=cover`, so on an iPhone the insets the CSS already uses stay zero
    (`style.css:978-980,1007,1010,1033`, `reports.css:500`). Chromium 149's CDP
    `Emulation.setSafeAreaInsetsOverride` applies insets even without the meta, which the coordinator checked, so it
    measures layout but not the meta.
  - **Outcome.**
    - Every page's meta adds `viewport-fit=cover` and keeps the rest.
    - With insets emulated at 390×844 (bottom 34), the tab bar, the menu and every dialog's buttons sit above the
      bottom inset.
    - At 844×390 (left and right 47, bottom 21), no text or control box starts inside a side inset, in either
      language.
    - Side insets stay physical left and right (DESIGN_GUIDE §8).
    - With no insets, frames match the base.
  - **Intent.** Nothing sits under the notch, a cutout or the home indicator. A phone turned sideways is no worse
    than today; its layout stays out of scope (K-36).
- **C5. Text fields are 15 px, and an iPhone zooms on them.**
  - **Cause.** `reports.css:352-366` sets `.field-input` to 15 px. That covers Activity's reason search, every Access
    field and the reason textarea (`access.js:939,948`), and the sheet's search specimen. The sheet's `.cx-input`
    specimens take the body role (`components.css:193`).
  - **Outcome.**
    - Every input and textarea on the five pages, and every text-field specimen on the sheet, shows 16 px text in both
      languages.
    - Inputs stay 44 px high.
    - At 320, 390 and 1440, each field's widest value (its `maxlength` in the code, in Arabic and in English) shows
      without clipped glyphs and without overlapping the field's icons (the search clear button, the password eye).
    - `DESIGN-SPEC.md` records the field size in TYP-3's body row and TYP-6.
    - The two select lists stay as they are: Activity's person filter (`activity.css:78`) and Reports' sort list.
  - **Intent.** Tapping a text field never zooms the page and nothing else moves. The two lists belong to the
    designer.

## Limits the result keeps

- **L1. Normal colours unchanged except inside text fields.** In normal colours, with no insets and a mouse at rest,
  `compare` against the base on every page, in both languages, at desktop, tablet and phone (reduced motion), shows
  EQUAL. The only exception is an item whose differences all lie inside text fields.
- **L2. The designer's part is untouched.** No pressed state, no tap-highlight change, and the two lists keep their
  look.
- **L3. The check is clean.** It reports 0 findings in total, apart from C2's named allowance.
- **L4. Motion and recipes behave as at the base.** Motion, reduced motion and `?motion=off` behave as at the base,
  and the CLI's `drift` passes on the folder's recipes.
- **L5. The index is current.** `INDEX.md` is regenerated with the command at its top, and `--check` passes.

## Scope

You may change, in the folder: the six CSS files, line 5 of the five HTML files, `DESIGN-SPEC.md` (TYP-3's body row,
TYP-6, and one row each for forced colours and the safe areas if you add them), and `INDEX.md`. Commit once when
done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish
and measure the others, then stop and report.

## Report

For each outcome and limit, PASS or FAIL, with the command and the output line that proves it. Then:
- C2's remaining allowances, if any;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
