<!-- brief-format: v1 role: codex -->
# Codex brief: fix-1, decisions 21-24 and the review's defects (owner-design-exploration-r04, round 1)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `e675f1e`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 3, 8, 11, 12, 14, 16, 19, 21, 22, 23, 24. That file lives on another branch: read it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full (the
  user's bans); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows TBL-1,
  TBL-9, TBL-12, HDR-6, GLO-4 by row ID. Navigate code with
  `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`; "the folder" below is
  `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- The pages open three ways, and every outcome holds in each: `index.html` (Daily), `reports.html` (Reports) and
  `components.html` (the component sheet), each from `file://` and over HTTP, at 1440, 1024, 768, 390 and 320 px, AR
  (`?lang=ar`, the default) and EN, with and without reduced motion. The folder's capture scripts serve HTTP on 3173
  and 3176; a designer works from a copy elsewhere on 3178. Use 3173, 3176 or 3177 only.

## Goal

Eclipse carries the user's decisions 21-24 and is free of the defects two reviews found at `f193046`.

## Causes and required outcomes

- **F1 (decision 21).** `reports.js:154` writes the empty period's sentence with both dates in full, so the month and
  year repeat. Outcome, AR and EN, on Reports and the sheet's specimen (`components.js:144` and its English twin): a
  period inside one month names the month and year once, across months of one year names the year once, as decision
  21 gives; a one-day period reads «لا قراءات في 22 سبتمبر 2026» / "No readings on 22 Sep 2026" (coordinator
  wording, following item 14's one-day form). Words first, no dash (DO-NOT).
- **F2 (decision 22).** At 721-1023 px the peak's time in Reports' day table sits nearer the next column's figure than
  its own (the slot from `reports.js:37-53` and the column widths at those sizes). Outcome, AR and EN, every row,
  every width from 721 to 1023: the distance from the time to the next column's figure is larger than the distance from
  the time to its own figure, each measured between the nearest edges of the two texts. The room comes from the Notes
  column: no other column gets narrower, and no text overflows its cell. Widths of 1024 and up, and 720 and below,
  are unchanged from `e675f1e`. Report every cell whose number of lines changes.
- **F3 (decision 23).** `reports.js:32-53` lines Arabic peak times up only when a peak has three digits, so a one-digit
  peak among two-digit ones puts its time out of line. Outcome: in Arabic the peak times share one edge whenever the
  column's figures differ in width; an Arabic table whose figures all have one width is unchanged from `e675f1e`.
  English unchanged.
- **F4.** `widestMinute()` (`app.js:707-722`) measures every minute of the day before Daily's first paint, and again
  on `fonts.ready` (`app.js:2925`): first paint comes later than at `41a6f7c`, and the load has a long task `41a6f7c`
  does not have. Outcome: Daily's first paint and long tasks at load are as at `41a6f7c`, under a no-store cache header and with no cache header; the status slot keeps the width it has at `e675f1e` and stays constant through
  the day; Daily's header stays on one line at 1024, 1200 and 1279 EN.
- **F5 (decision 24).** Reports' status slot (`reports.js:821-825`, the `.hb-res` copies) holds statuses whose times
  are fixed, so a live status at another time of day could change its width. Outcome: from 721 px the slot holds the
  widest status any time of day can show, as Daily's does after F4, at the same cost to first paint as F4 allows.
- **F6.** The sheet's Table text (`components.js:70` AR, `:168` EN) says numbers share the right edge in both languages
  and leans on tabular figures, which `reports.js` (comment above `fitSlots`) says change nothing in Readex Pro.
  Outcome: the text states what decision 16 built, in each language, with no claim the code contradicts.
- **F7.** The sheet's "Last 7 days" specimen wraps its whole range in one `bdi` (`components.js:89`), so «16 – 22
  سبتمبر» reads in the opposite order to Reports' `#trend-meta`; its caption (`components.js:92` and `:190`, `short`)
  keeps the wording decision 19 retired. Outcome: the range renders in the same visual order as Reports', AR and EN,
  and the caption uses decision 19's line.
- **F8.** At 768 EN the sheet's chart specimen puts its legend on a second row under the title, while Daily at 768
  keeps "View details" on the title's row. Outcome: at every width the specimen's header lays out as Daily's chart
  header does at that width, AR and EN.
- **F9.** At 320 EN with a classic (non-overlay) scrollbar the sheet scrolls 3 px sideways: the Delayed header-status
  specimen gets none of the narrow rule `reports.css:683-695` gives Reports' own header. Outcome: no sideways scroll on
  the sheet from 320 to 390 px, AR and EN, classic and overlay scrollbars.
- **F10.** The chart's text equivalent (`app.js:1675` and `:1683`, and their English twins) puts a dash inside a
  sentence («لا قراءات من 2:14 م – 2:31 م»), which DO-NOT bans. Outcome: no sentence a screen reader hears on Daily or
  Reports has a dash range inside it; a span inside a sentence reads «من … إلى …» / "from … to …" (decision 11, item
  8). A range that stands alone as a value keeps its dash (item 12).

## Limits the result keeps

- **L1.** Every frame of Daily (every state `states-capture.mjs` covers), Reports (no `?state=` and every state) and
  the sheet equals `e675f1e` at 1440, 1024, 768, 390 and 320, AR and EN, except where F1-F10 change it. Render the
  baseline from your own `git archive e675f1e` in your temp folder; list every frame that differs and why.
- **L2.** What reads the folder still passes: `node tools/lint-spec.mjs` and `node tools/check-index.mjs` from the
  folder (both pass at `e675f1e`); `node --check` on every `.js` and `.mjs` in the folder; `states-capture.mjs` reports
  no failures. DESIGN-SPEC rows the outcomes change (at least TBL-1, TBL-12, HDR-6 and K-02's entry) state what is
  built; INDEX.md is regenerated with the command written at its top.
- **L3.** No console error and no sideways scroll on any page at any of the five widths, AR and EN, classic and
  overlay scrollbars (the baseline's only failure is F9's).
- **L4.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

You may change, in the folder: `app.js`, `reports.js`, `components.js`, `index.html`, `reports.html`,
`components.html`, `style.css`, `reports.css`, `components.css`, the `*capture.mjs` scripts whose checks the outcomes
change, `DESIGN-SPEC.md`, `README.md` and `INDEX.md`; commit once when done. Everything else is read-only. Add no
dependencies. Do not redesign beyond the outcomes. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (r04 B3)

## Report

Each outcome (F1-F10, L1-L4) as PASS or FAIL with the command and the output line that proves it; for F2 the two
distances per width, AR and EN; for F4 first paint and long tasks against `41a6f7c`; every frame that differs from
`e675f1e` and why; the files you changed; the commit SHA; anything you could not do; anything an outcome or decision
produces that reads wrong, with the decision named.
