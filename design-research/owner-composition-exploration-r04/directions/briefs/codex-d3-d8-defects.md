<!-- brief-format: v1 role: codex -->
# Codex brief: deferred defects D3-D8 (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `cbd7bbc`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 7, 9, 10, 11, 12 and 14.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` row HDR-6 and the TBL rows
  by ID; `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` §"The table, form and dialog system".

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
- A local server uses port 3176 or 3177. The probe kit in `design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/`
  may help; its README says how to run it.

## Goal

Six known defects in Eclipse's header, tables and component sheet are gone, and nothing else changes.

## Causes and required outcomes

Reproduce each defect first and record its before measurement; if one does not reproduce, say so and leave it.

- **D3.** The header's status box moves its anchored edge by about 6.5 px at 721 px wide in English (row HDR-6), on
  the page or pages where it happens. Outcome: at 721, 768 and 1023 EN the anchored edge does not move across the
  statuses and the arrival of data. Since `cbd7bbc` the control keeps one width on both pages from 721 up (decision 14),
  so D3 may no longer reproduce.
- **D4.** `components.html`'s no-readings row uses the caption style (`--ink-3`) where Daily's table uses 13.5 px
  `--ink-2`. Outcome: the specimen renders with Daily's style in both languages.
- **D5.** In an English table at 721 and up, a single day's «No readings» starts at the peak column's left edge.
  Outcome: it sits where the Arabic table puts it, mirrored, at every width from 721 up.
- **D6.** English coverage rows take two lines at 390, and at 320 EN «from 6:00 AM» drops under its label. Outcome:
  at 390 and 320 EN they break where the Arabic rows break, mirrored, and the time stays on its label's line.
- **D7.** `components.html` has no single-day table specimen. Outcome: it renders one, built from the same component
  the pages use, in both languages.
- **D8.** `components.html` scrolls sideways at 390 and 768 EN, its header date range breaks at 390 and 320,
  «Open, nobody inside» breaks at 320 EN, and SVG paths log NaN at 320. Outcome: no sideways scroll at 320, 390,
  768, 1024 and 1440 in either language; the date range and that label each stay on one line at 390 and 320; no
  console error or NaN at any width.

Required unchanged: every frame of Daily (`index.html`) and Reports (`reports.html`, with and without
`?state=...`) except where D3, D5 or D6 change it, at 320, 390, 721, 768, 1024 and 1440, AR and EN. The
pages open over `file://` and HTTP, with motion on and with reduced motion; check both ways.

## Scope

You may change `reports.js`, `reports.css`, `style.css`, `app.js`, `components.html`, `components.js` and
`components.css` in `design-research/owner-composition-exploration-r04/directions/eclipse/`, and regenerate `INDEX.md`
there (`node design-research/owner-composition-exploration-r04/directions/eclipse/tools/build-index.mjs`); commit
once when done. Everything else is read-only. Add no dependencies. Frames and logs go to `D:/fitway-temp/<run>/`.
If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (r04 B3)

## Report

Each defect as PASS, FAIL or NOT REPRODUCED with its before and after measurement; the count of frames compared for
"unchanged" and every frame that differs, with why; the files you changed; the commit SHA; anything you could not do.
