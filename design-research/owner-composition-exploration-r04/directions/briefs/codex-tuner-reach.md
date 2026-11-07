<!-- brief-format: v1 role: codex -->
# Codex brief: the light tuner within reach on every screen (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `ad8f80c2`
- **Milestone:** `owner-design-exploration-r04`. Decisions: "How this milestone's rounds run" items 3 and 9 in
  `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show HEAD:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; in the
  folder below, `README.md` §"Light tuner" and `HISTORY.md` §"Moving the tuner". Navigate code with `INDEX.md`.
  "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- Your temp folder is `D:/fitway-temp/owner-r04-tuner-reach/`. You run in the workspace-write sandbox with automatic
  approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- The tuner loads on `index.html` (Daily) only. It opens from `file://` and over HTTP (port 3176 only), in Arabic
  (`?lang=ar`, the default) and English (`?lang=en`), with motion, with `prefers-reduced-motion: reduce` and with
  `?motion=off`. Measure at 1440 x 900, 1024 x 768, 768 x 1024, 390 x 844 and 320 x 568, the last three in a touch
  context, and every outcome holds at every width from 320 up, not only at those five. Render the baseline from your
  own `git archive ad8f80c2` of the folder in your temp folder, with no stored tuner spot.

## Goal

The tuner, a working tool the user also opens on the phone and the tablet, can be reached, opened and used by tap and
by keyboard on every screen, without covering the page's own controls.

## Causes and required outcomes

- **T1.** The unit's default spot is a fixed 452 px in from the inline-start edge (`style.css:1139-1140`), and
  `place()` keeps only a stored spot inside the viewport (`tuner.js:299-306`). On the phone the toggle lies wholly
  off the screen in both languages, yet Tab still focuses it. Outcome: with no stored spot, the closed toggle lies
  wholly inside the viewport at every width; a tap at its centre lands on it; Tab focuses it inside the viewport.
  Intent: the user can find and press the tool on any screen, by finger or by keyboard.
- **T2.** The panel is 544 px wide (`style.css:1158-1159`) and opens from the toggle's spot without being kept inside
  the viewport, so it runs off the screen on the tablet and the phone. Outcome: the open panel lies wholly inside the
  viewport at every width and adds no horizontal scroll to the page; every control in it can be reached by Tab and by
  scrolling within the panel, and its focused control is inside the viewport. Intent: each light and motion setting
  can be changed on the phone, not only seen.
- **T3.** At 768 px the toggle covers the page's header status button (`#ops-btn`). Outcome: at every width and at
  every scroll position of the page, no page control's box overlaps the closed toggle's box. Intent: the tool never
  takes a tap meant for the page.

## Limits the result keeps

- **L1.** Where the default spot fits today (1440 and 1024), the toggle and the open panel sit where they sit at the
  baseline: their boxes equal the baseline's to the pixel, closed and open, in both languages.
- **L2.** Moving still works as `README.md` §"Light tuner" describes: dragging by the toggle or the header (never
  pressing the button), the grip's arrows, Shift and Home, the header's double-click, and a stored spot from any
  earlier screen size loads inside the viewport. Escape closes the panel and returns focus to the toggle.
- **L3.** The page under the tuner is unchanged: every frame with `?tuner=0` equals the baseline's, and no other page
  changes. The tool keeps its look: its colours, dashed toggle and type.
- **L4.** `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check` (run from
  the repository root with the folder's path) and `node --check` on every changed `.js` pass, as at the baseline.
- **L5.** One commit, its message ending in your own attribution line; not pushed; `git status --short` then empty.

## Scope

You may change, in the folder, `tuner.js`, the light-tuner block of `style.css`, `README.md` §"Light tuner", and
`INDEX.md` regenerated with the command at its top; commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Report

Each outcome and limit PASS or FAIL with the command and output line that prove it; where the toggle sits on the
phone and the tablet; files changed; the commit SHA; anything you could not do. At most 25 lines.
