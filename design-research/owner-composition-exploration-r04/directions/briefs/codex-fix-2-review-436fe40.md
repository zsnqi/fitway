<!-- brief-format: v1 role: codex -->
# Codex brief: fix-2, the review of 436fe40 and decisions 27-28 (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `5b75549`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 8, 11, 12, 24, 26, 27 and 28 (27 and 28 are this round). That file lives on another branch: read it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full (the
  user's bans); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows GLO-12,
  CHT-15, STA-14, OWN-D7, OWN-D8, PH-1, PH-3 by row ID. Navigate code with
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

- Your temp folder is `D:/fitway-temp/owner-r04-fix-2/`. You run in the workspace-write sandbox with automatic
  approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm, Vitest,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- The pages open two ways, and every outcome holds in each: `index.html` (Daily), `reports.html` (Reports) and
  `components.html` (the component sheet), each from `file://` and over HTTP, at 1440, 1024, 768, 721, 720, 390, 360
  and 320 px, AR (`?lang=ar`, the default) and EN, with and without reduced motion. Phone checks run in a touch
  context (`hasTouch`, `isMobile`, real CDP touch events) at 390 × 844 and 320 × 568. Use port 3176 only.
- The drawn target for K1, read only: a designer's copy at
  `D:/fitway-temp/owner-r04-busiest-average/design-research/owner-composition-exploration-r04/directions/eclipse/`,
  opened with `?avg=1` (the `[data-avg="1"]` rules in its `style.css`); the designer's notes are
  `D:/fitway-temp/owner-r04-busiest-average/REPORT.md`. Take the card's rules from it, not whole files. Its smaller
  320 px size (`fitBusiest`) and its review switches (`?avg`, `?busy`, `?busyavg`) are not built (decision 28).
- Render every baseline from your own `git archive 5b75549` of the folder in your temp folder.

## Goal

Daily's busiest-time card takes its decided form and period words at every width, the held reading on the phone keeps
up with the finger, a tap on the peak's ring reads the peak, and the review's small defects are gone.

## Causes and required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing. Where a cause names a file and line, it is the reviewer's hypothesis: confirm it before you act on it.

- **K1. The phone card's form** (decision 28). Cause: at 720 px and below the average stands at the card's far end,
  under «آخر 7 أيام», and reads as part of it. Intent: the average reads as the hours'. Outcome: at 720 px and below,
  AR and EN, the average stands directly under the hours on their start edge, in caption type, as the copy draws it;
  the name and «آخر 7 أيام» keep their line; one card height in every Daily state (live, delayed, offline, no
  history, closed, loading, error) at a given width, with the loading placeholders in the hours' and the average's
  slots (PH-1, PH-3).
- **K2. One period word per hour range** (decision 28, with 26). Cause: `hourRange` (`app.js:231`, and its own copy at
  `components.js:270`) names the period of each end, so a range across noon or midnight carries two words, and the
  computer's card still reads «6–7 م» / «المعدّل 51». Intent: the card says when the busiest hour is in one natural
  word. Outcome: the busiest-time card, at every width, in Arabic, visible and heard, writes one word chosen by the
  hour the range ends at, as decision 28's table says, for every one-hour slot the open day allows (6 AM to 1 AM),
  and reads «بمعدّل» before the average; the sheet's busiest specimen follows the same rule. Every other time on Daily,
  Reports and the sheet keeps «ص / م»; English is unchanged everywhere.
- **K3. Every hour fits** (B9). Cause: at `5b75549` «11 صباحًا – 12 مساءً» and the midnight form run into the average
  at 320-390 px. Intent: no busiest hour can break the card. Outcome: at 320, 360, 390, 720, 721, 768, 1024 and 1440,
  AR and EN, with each of the widest slots («10–11 صباحًا», «11–12 ظهرًا», «10–11 مساءً», «11–12 ليلًا»; "11 AM – 12 PM",
  "11 PM – 12 AM") and a three-digit average, the hours stay on one line at the card's normal size and nothing
  overlaps, wraps or leaves its card. Inject the slots by any means that leaves nothing in the folder.
- **K4. The held reading keeps up** (decision 27). Cause: after the hold, each reported move advances the reading at
  most one stop (`app.js:1877`), and nothing catches up when the finger stops; a drag at normal speed leaves it 7 stops
  behind at 390 and 10 at 320. Intent: the reading stays with the finger; any trail is a brief visual follow, never a
  lasting gap. Outcome: after the hold, in drags at 500 and 1000 px per second, AR and EN, at 390 and 320, the reading
  moves through each stop between it and the finger's stop (each shown for at least one frame), never passes the
  finger's stop, and is on the finger's stop within 250 ms of the finger's last movement; a slow drag still visits all
  40 stops in order. Kept from touch-1: the page scrolls, flicks and pinches natively from the plot, does not scroll
  during a hold, and has no pan or fling of its own.
- **K5. Resizing during the intro** (review F2). Cause: `endIntro` (`app.js:2866`) restores markup saved at the
  intro's start (`app.js:2851`) after `fillBusiest` (`app.js:897`) wrote the narrow form. Intent: the card always
  speaks the form of the width it is shown at. Outcome: after a window crosses 720 px either way at any moment of the
  intro, the card shows and speaks that width's form, AR and EN.
- **K6. A tap on the peak's ring** (decision 27). Cause: on the phone a tap takes the stop by equal shares of the
  plot (CHT-15), so a tap on the peak's ring at 390 reads 7:00 PM. Intent: tapping what you see reads what you tapped.
  Outcome: at 720 px and below a tap whose point lands on the peak's ring reads the peak (6:29 PM), AR and EN; every
  other tap keeps CHT-15's mapping. The computer's pointer is unchanged from `5b75549`.
- **K7. The sheet's number gaps** (review F7). Cause: «آخر 7 أيام» in the busiest specimen and the button «عرض آخر 28
  يومًا» sit in flex containers that space each word (`components.js:86`, `:146`). Intent: each reads as one phrase.
  Outcome: the spaces around the number equal those of the same words on Daily and Reports, AR and EN.
- **K8. The sheet's stale caption.** Cause: the busiest specimen's caption still says "On a phone: the hours beside
  the title" (`components.js:203`, and its Arabic). Outcome: both languages describe the card as built.

## Limits the result keeps

- **L1.** Every Reports frame equals `5b75549`. Daily from 721 px up in English equals `5b75549`; in Arabic only the
  busiest-time card's words and their places inside the card differ.
- **L2.** At 720 px and below, nothing outside the busiest-time card changes except the positions below it.
- **L3.** A hold, a tap with close, previous and next, Escape, Tab and the keys, and both slides (above the bar and
  from the top) behave as at `5b75549`, apart from K4 and K6.
- **L4.** `node tools/lint-spec.mjs` and `node tools/check-index.mjs` from the folder pass (both pass at `5b75549`);
  `node --check` passes on every `.js` and `.mjs` in the folder; `states-capture.mjs` reports no failures.
- **L5.** DESIGN-SPEC rows GLO-12, CHT-15, OWN-D7, OWN-D8 and any row that states the card's time format describe what
  is built. Report, without fixing, whether STA-14's heights match what is built at 320 EN. INDEX.md is regenerated
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

Each outcome (K1-K8, L1-L6) as PASS or FAIL with the command and the output line that proves it; crops of the card at
390, 320 and 721, AR and EN, live and loading, and with the widest slots, in `D:/fitway-temp/owner-r04-fix-2/crops/`;
the drag measurements for K4; every frame that differs from `5b75549` and why; the files you changed; the commit SHA;
anything you could not do; anything an outcome or decision produces that reads wrong, with the decision named.
