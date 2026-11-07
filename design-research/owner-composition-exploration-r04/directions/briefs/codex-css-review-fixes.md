<!-- brief-format: v1 role: codex -->
# Codex brief: the CSS round review's mechanical findings (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `41821f38`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 41 and 42, and "How this milestone's rounds run" items
  3, 9 and 11 in `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/briefs/css-round-spec.md`
  §"Solution" and §"Implementation Decisions"; in the folder below, `DESIGN-SPEC.md` rows FOC-1 to FOC-3, FOC-8 and
  SAFE-1. "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- **Your temp folder** is `D:/fitway-temp/owner-r04-css-fixes/`. Set `PROBE_OUT` to a folder inside it before you
  run the folder's tools. You run in the workspace-write sandbox with automatic approval review. `git add`, `git
  commit` and anything that starts child processes with piped output (pnpm, Playwright, Node scripts that run git)
  fail inside it: request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **Tools.** Run these read-only from the coordinator's worktree `D:/Projects/fitway-worktrees/owner-design-exploration-r04`
  at `b95376b6` or later. Never edit them.
  - The concept CSS check: `node <that worktree>/scripts/check-concept-css.mjs <the folder>`.
  - The verify-fitway CLI: `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`, guide in its `SKILL.md`.
    `--colors forced` renders Windows high contrast; `measure --tool focus --colors forced` measures every Tab stop.
    Its held-press capture is not reliable with a mouse yet; this round needs none. Use ports 3176-3177 only. If one is
    held by a process you did not start, never stop it.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop 1440×900, 1024×768,
  tablet 768, phone 390×844, 320 wide, and 844×390 sideways; motion on, reduced, and `?motion=off`.
- **The base** is the folder at the HEAD above, from your own `git archive`. Port 3174 is the user's live preview of
  this worktree; leave it running.

## Goal

The independent review of the CSS round (`58433873..b2b2f4c1`) found four mechanical defects, and the designer who
fixed its taste findings (`41821f38`) left a stale paragraph. Fix each one, and change nothing else. B6 (one cause
per round) is relaxed on purpose: the five causes are independent and graded separately.

## Causes and required outcomes

- **D1. A region that takes focus by script paints a ring in high contrast.**
  - **Cause.** The CSS round turned `outline: none` into `2px solid transparent` on regions that only script focuses
    (they get `tabindex="-1"` and are never a Tab stop). Forced colours paints that outline. Seen: after "Try again"
    on Daily and Reports, the figures region (`#cards`, `style.css:1127`, `reports.css:695`) gets a 2 px outline in
    the system's text colour, by mouse and by keyboard; at `58433873` there was none.
  - **Outcome.**
    - In forced colours, no region that script focuses paints an outline or ring when it takes focus, on any page, in
      Arabic and English, at desktop and phone.
    - Every Tab stop still shows its ring in forced colours (`measure --tool focus --colors forced` reports no failed
      stop on the five pages, in both languages, at 1440×900 and 390×844).
    - In normal colours nothing changes.
    - The concept CSS check reports each such region as a named programmatic-target allowance, beside `.cx-main` and
      `.fw-pop[tabindex="-1"]`, and nothing else. Name every allowance in the report with its evidence that it is never
      a Tab stop.
  - **Intent.** A region never shows the ring (the code's own note; FOC-1 is for controls), in high contrast too.
- **D2. Activity's person list shows its ring on a mouse press.**
  - **Cause.** Pressing Activity's person list (`activity.css:81`) with the mouse shows the focus ring. Reports' sort
    list (`reports.css:626`), drawn the same way, did not in the review's run. It was the same at `691d62d5`, before
    the press. The designer of `41821f38` saw the ring under and after a mouse press on Activity's list.
  - **Outcome.**
    - A mouse press or a tap on either list, and choosing an option with the mouse, shows no focus ring.
    - Reaching either list with Tab shows its ring, in normal and forced colours, in both languages.
    - Each list's choice still takes effect (the person filter filters, the sort sorts).
  - **Intent.** The ring means keyboard focus, the same on both lists (FOC-1, FOC-2).
- **D3. The desktop dialog's height cap divides by a length.**
  - **Cause.** `reports.css:730-734` caps `.dlg-panel` from 721 px with a `calc()` that divides by the
    smaller of 1 and the summed vertical insets over `1px`: typed division by a length, and division by zero with no insets. An engine without typed
    CSS arithmetic drops the whole declaration, so a dialog on an iPhone held sideways (844 × 390 with a bottom inset)
    would lose its cap.
  - **Outcome.**
    - No `calc()` in the folder divides by a length or can divide by zero.
    - In Chromium, at 1024×768 and 1440×900 with no insets, every dialog's computed size and position equal the base.
    - At 844×390 with insets left and right 47 and bottom 21, every dialog fits the viewport inside the insets and its
      body scrolls, in both languages.
  - **Intent.** The cap does not depend on a CSS feature some browsers lack; the no-inset layout stays as it is.
- **D4. The long-name recipe's Arabic is question marks.**
  - **Cause.** In the folder's `verification-recipes.json`, the proof for Activity's long names (`case=long`, about
    line 1566) matches `'???? ??? ??? ????'` instead of the Arabic long name, so the Arabic run passes only through the
    English branch of the expression.
  - **Outcome.**
    - The proof holds the real Arabic long name, the one Activity renders in Arabic, read back from the file.
    - The CLI's `drive --page activity.html --feature page --query case=long --languages ar` passes on the Arabic name
      alone, and the CLI's `drift` passes on the folder's recipes.
  - **Intent.** The Arabic run proves the Arabic page.

- **D5. The README describes the held chalk key as it was.**
  - **Cause.** In the folder's `README.md` §"Motion", the paragraph on the chalk key (about lines 648-649) still
    describes the 2 px edge and 12 px inward fall that `41821f38` replaced; `DESIGN-SPEC.md` STA-16 describes the
    current press.
  - **Outcome.** That paragraph says what STA-16 says about the held chalk key at the HEAD; nothing else in `README.md`
    changes.
  - **Intent.** The README and the spec describe the same press.

## Limits the result keeps

- **L1. Nothing else changes.** In normal colours, mouse at rest, no insets, reduced motion, `compare` against the base
  on every page and the components sheet, in both languages, at desktop, tablet and phone, shows EQUAL.
- **L2. The press is untouched.** No rule of the press (`DESIGN-SPEC.md` MOT-20, STA-16) changes, and every control's
  held look equals the base's.
- **L3. The checks pass.** The concept CSS check reports only named allowances; in the folder `node tools/lint-spec.mjs`,
  `node tools/check-index.mjs` and `node tools/build-index.mjs --check` pass, and `node --check` passes on every script.
- **L4. The index is current.** `INDEX.md` is regenerated with the command at its top if anything it lists changed.

## Scope

You may change, in the folder: the CSS files, the pages' `.js` only where D2 needs it, `verification-recipes.json`,
`README.md` (D5's paragraph only), `DESIGN-SPEC.md` (FOC-8 or SAFE-1 if a fix changes what they say) and `INDEX.md`. Commit once when done. Everything
else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report.

## Report

For each outcome and limit, PASS or FAIL, with the command and the output line that proves it. Then:
- the named allowances;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
