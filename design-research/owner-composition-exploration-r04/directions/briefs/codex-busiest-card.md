<!-- brief-format: v1 role: codex -->
# Codex brief: card-1, the phone's busiest-time card (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `bd8bada`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 3, 8, 11, 12, 24 and 26 (26 is this round). That file lives on another branch: read it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full (the
  user's bans); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows GLO-12,
  OWN-D7, OWN-D8, PH-1, PH-3 by row ID. Navigate code with
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
- The pages open two ways, and every outcome holds in each: `index.html` (Daily) and `components.html` (the component
  sheet), each from `file://` and over HTTP, at 1440, 1024, 768, 390 and 320 px, AR (`?lang=ar`, the default) and EN,
  with and without reduced motion. Use port 3176 only; another Codex round works elsewhere on 3177.
- The drawn target, read only: a designer's copy at
  `D:/fitway-temp/owner-r04-busiest-card/design-research/owner-composition-exploration-r04/directions/eclipse/`, opened
  with `?busy=2` (its `index.html` and the variant block in its `style.css`); the designer's notes are
  `D:/fitway-temp/owner-r04-busiest-card/REPORT.md`, "Variant 2". The copy was taken from an older commit: take the
  card's rules from it, not whole files.

## Goal

On the phone, Daily's busiest-time card is the designer's variant 2 with decision 26's words, as the only phone form.

## Causes and required outcomes

- **C1.** At 720 px and below the card is the touch trial's form (the hours beside the name, the average hanging under
  them), which the user rejected. Outcome: at every width from 320 to 720, AR and EN, the card is variant 2 as the copy
  draws it with `?busy=2`: the name with «آخر 7 أيام» / "Last 7 days" at the end of its line, then the hours at the
  start and the average at the far end on the hours' baseline. No URL switch is needed for it, and none is left behind.
- **C2.** The hours write the period short («6–7 م»). Outcome: at 720 px and below the card's hours write it in
  full, «6–7 مساءً», and «صباحًا» where the period is morning, in the visible value and in what a screen reader hears,
  in every state that shows hours. Every other time on Daily, Reports and the sheet, and the card from 721 px up, keeps
  «ص / م». English is unchanged.
- **C3.** The average reads «المعدّل 51». Outcome: at 720 px and below the card's average reads «بمعدّل 51», visible
  and heard. English stays "Average 51".
- **C4.** Outcome: the card keeps one height in every Daily state (live, delayed, offline, no history, closed,
  loading, error) at 390 and 320, AR and EN, and while loading its placeholders sit where the hours and the average
  will stand (PH-1, PH-3).
- **C5.** Outcome: the sheet's busiest-time specimen, if it has one, follows the page at the same widths.

## Limits the result keeps

- **L1.** Every frame from 721 px up, AR and EN, every Daily state, and every Reports frame, equals `bd8bada`. Render
  the baseline from your own `git archive bd8bada` in your temp folder.
- **L2.** At 720 px and below, nothing outside the busiest-time card changes except the positions below it.
- **L3.** No line of the card wraps, overflows, or overlaps another at 320, 360, 390 and 720 px, AR and EN.
- **L4.** `node tools/lint-spec.mjs` and `node tools/check-index.mjs` from the folder pass (both pass at `bd8bada`);
  `node --check` passes on every `.js` and `.mjs` in the folder; `states-capture.mjs` reports no failures.
- **L5.** DESIGN-SPEC rows OWN-D7, OWN-D8 and GLO-12, and any row that states the card's time format, describe what is
  built. INDEX.md is regenerated with the command written at its top.
- **L6.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

You may change, in the folder: `app.js`, `index.html`, `style.css`, `components.js`, `components.html`,
`components.css`, the `*capture.mjs` scripts whose checks the outcomes change, `DESIGN-SPEC.md`, `README.md` and
`INDEX.md`; commit once when done. Everything else is read-only. Add no dependencies. Do not redesign beyond the
outcomes. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.
(r04 B3)

## Report

Each outcome (C1-C5, L1-L6) as PASS or FAIL with the command and the output line that proves it; crops of the card at
390 and 320, AR and EN, live and loading, in `D:/fitway-temp/owner-r04-card-1/crops/`; every frame that differs from
`bd8bada` and why; the files you changed; the commit SHA; anything you could not do; anything an outcome or decision
produces that reads wrong, with the decision named.
