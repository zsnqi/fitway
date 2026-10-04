<!-- brief-format: v1 role: codex -->
# Codex brief: fix-3, the fix-2 review's remaining items and decision 29 (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `262b8b5`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 7, 8, 26, 28 and 29 (29 is this round). That file lives on another branch: read it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full (the
  user's bans); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows GLO-12,
  CHT-15, STA-14, OWN-D7, OWN-D8 by row ID. Navigate code with
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

- Your temp folder is `D:/fitway-temp/owner-r04-fix-3/`. You run in the workspace-write sandbox with automatic
  approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm, Vitest,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- The pages open two ways, and every outcome holds in each: `index.html` (Daily), `reports.html` (Reports) and
  `components.html` (the component sheet), each from `file://` and over HTTP, at 1440, 1024, 768, 721, 720, 390 and
  320 px, AR (`?lang=ar`, the default) and EN, with and without reduced motion. Phone checks run in a touch context
  (`hasTouch`, `isMobile`, real CDP touch events) at 390 × 844 and 320 × 568. Use port 3176 only.
- Render every baseline from your own `git archive 262b8b5` of the folder in your temp folder.

## Goal

The last small fixes on Daily and the component sheet before the user tries both pages on a real phone and computer.

## Causes and required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing. Where a cause names a file and line, it is the reviewer's hypothesis: confirm it before you act on it.

- **M1. The computer's average** (decision 29). Cause: from 721 px up the card's foot reads «بمعدّل 51», a phrase cut
  off from the hours above it. Intent: at the foot the average is a label, like «المعتاد 318» on the Entries card
  beside it. Outcome: from 721 px up, in Arabic, the busiest-time card's average reads «المعدّل 51», visible and heard,
  in every state that shows it; its hours keep decision 28's period word; 720 px and below keep «بمعدّل 51» under the
  hours; English is unchanged.
- **M2. The peak's tap area** (decision 29). Cause: on the phone only the drawn ring reads the peak
  (`app.js:1714-1721`), and a tap just beside it reads another stop. Intent: a finger aimed at the ring gets the peak.
  Outcome: at 720 px and below, a tap anywhere inside a circle at least 44 px across centred on the ring reads the
  peak, AR and EN; a tap outside it keeps CHT-15's mapping; a hold and its drag, and the computer's pointer, behave as
  at `262b8b5`.
- **M3. The page moves during a hold** (review finding 5, also at `5b75549`). Cause unknown: a held drag at 320 EN
  that ends at the day's first stop scrolls the page about 10 px. Intent: the page stays still for the whole hold
  (CHT-15). Outcome: during any hold and its drag at 390 and 320, AR and EN, including drags that end at the first and
  the last stop, the page's scroll position does not change. Touch-1's native scroll, flick and pinch from the plot,
  without a hold, stay as they are; if M3 cannot be met without the page's own pan or a cancelled `touchstart`, stop
  and report (B3).
- **M4. One height in every state** (STA-14). Cause: at 320 EN the chart card is 568.5 px in six states and 542.5 px
  in no history. Intent: a state's arrival or change moves nothing. Outcome: the chart card has one height in all
  seven Daily states at every width from 320 to 720, AR and EN, without changing the six states' look; STA-14 states
  the heights that are built, the busiest-time card's phone height included.
- **M5. The sheet's computer specimen** (review finding 1). Cause: from 721 px up the specimen captioned "On a phone"
  still draws the trial form (`components.js:381`, `components.css:414-417`). Intent: every specimen draws what the
  page builds at that width. Outcome: from 721 px up it matches Daily's busiest-time card at the same width; at 720 px
  and below it is unchanged.
- **M6. The sheet's wording** (review finding 7). Outcome: the Arabic caption `band.busy` reads exactly
  «على الجوال: المعدّل تحت الساعات مباشرة» and the English one "On a phone: the average directly under the hours";
  the sheet's English range across noon has the same spaces around its dash as Daily's ("11 AM – 12 PM").

## Limits the result keeps

- **L1.** Every Reports frame equals `262b8b5`. Daily from 721 px up in English equals `262b8b5`; in Arabic only the
  busiest-time card's average differs.
- **L2.** At 720 px and below every Daily frame at rest equals `262b8b5`, except the no-history chart card where M4
  changes its height and the positions below it.
- **L3.** A tap with close, previous and next, Escape, Tab and the keys, the catch-up after a drag, and both slides
  behave as at `262b8b5`, apart from M2 and M3.
- **L4.** `node tools/lint-spec.mjs` and `node tools/check-index.mjs` from the folder pass; `node --check` passes on
  every `.js` and `.mjs` in the folder; `states-capture.mjs` reports no failures.
- **L5.** DESIGN-SPEC rows GLO-12, CHT-15, STA-14, OWN-D7 and OWN-D8 describe what is built. INDEX.md is regenerated
  with the command written at its top.
- **L6.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

You may change, in the folder: `app.js`, `index.html`, `style.css`, `components.js`, `components.html`,
`components.css`, the `*capture.mjs` scripts whose checks the outcomes change, `DESIGN-SPEC.md`, `README.md` and
`INDEX.md`; commit once when done. Everything else is read-only. Add no dependencies. Do not redesign beyond the
outcomes. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.
(r04 B3)

## Report

Each outcome (M1-M6, L1-L6) as PASS or FAIL with the command and the output line that proves it; crops in
`D:/fitway-temp/owner-r04-fix-3/crops/` of the computer card at 721 and 1440 AR, the sheet's specimen at 721 and 1440,
and the 320 EN chart card in every state; for M3 the cause you found; every frame that differs from `262b8b5` and why;
the files you changed; the commit SHA; anything you could not do; anything an outcome or decision produces that reads
wrong, with the decision named.
