<!-- brief-format: v1 role: codex -->
# Codex brief: remove the picked-against variants and the trial switches (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `2996d7a`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 36, 37, 38 and 39 (39 is this round), and "How this milestone's rounds run" items 9 and 11; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; in the
  folder below, `README.md` §"Motion" and `DESIGN-SPEC.md` rows MOT-14 to MOT-19 and OWN-C15. Navigate code with
  `INDEX.md`. "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- Your temp folder is `D:/fitway-temp/owner-r04-variants-removal/`. You run in the workspace-write sandbox with
  automatic approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- The pages open two ways, and every outcome holds in each: `index.html` (Daily), `reports.html`, `activity.html`,
  `access.html` and `components.html`, each from `file://` and over HTTP, at 1440, 768, 390 and 320 px, AR (`?lang=ar`,
  the default) and EN, with motion, with `prefers-reduced-motion: reduce`, and with `?motion=off`. Phone checks run in
  a touch context at 390 x 844 and 320 x 568. Use port 3176 only.
- Render every baseline from your own `git archive 2996d7a` of the folder in your temp folder, and load the baseline's
  pages with `?done=0` (Reports) and `?row=0` (Access): that is the as-built behaviour this round keeps.

## Goal

The user compared the variants on the live site and kept both moments as built (DECISIONS item 39): the export's done
state `?done=0` and Access's row `?row=0`. The trial switches (MOT-19) were a working tool for that comparison only.
Remove what lost, so the concept carries one behaviour per moment and no comparison scaffolding.

## Required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing.

- **R1. One export done state.** Variants 1 and 2 of MOT-16 (the mark starting with the settling; the calendar copy cut
  away by the moving edge) are removed from the code, with whatever exists only for them (the cut window, its riders'
  plan, their CSS). What every variant shares stays: the settle on one main-thread frame clock (`809aa09`) and the
  narrow sheet's file line kept below the calendar and clipped clear of the actions (`b6d6a5c`), wherever they apply
  to the as-built moment. Outcome: every frame of the export's done moment equals the baseline's `?done=0` within the
  noise you measure between two baseline captures, at every size and language above, at 1x.
- **R2. One row change.** Access's option 1 (the change held until the window's close has ended) is removed, with the
  owners card's and records card's hold copies. Outcome: every frame of a deactivation and a reactivation, and of the
  records card's arrival (MOT-17, MOT-18, OWN-C15) in every case `motion-capture.mjs` covers, equals the baseline's
  `?row=0` within that noise.
- **R3. No switches.** The trial switch, its storage, its URL parameters and its styles are removed from every page.
  A stored choice from before, or an old link with `?done=` or `?row=`, loads the page as built, silently. Pages at
  rest equal the baseline loaded with the parameter (which shows no switch) within that noise.
- **R4. The words and the tools follow.** `DESIGN-SPEC.md` (MOT-16, MOT-17, MOT-19 and any row that names a variant,
  the switch or `?done`/`?row`), README §"Motion" and `motion-capture.mjs` (moments 9 and 10, and moment 11's row
  options) describe and capture only what remains; MOT-19 is removed or marked retired with a one-line pointer to
  DECISIONS item 39, whichever keeps `lint-spec` and the index valid. The spec's history of what was tried may stay
  as one sentence.

## Limits the result keeps

- **L1.** Every other page and moment is untouched: their frames equal the baseline within its noise.
- **L2.** Reduced motion and `?motion=off` are instant with the same end state; nothing left over at rest, including
  after Escape at 40 and 150 ms and a second Export within the moment.
- **L3.** `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`, the full
  `motion-capture.mjs` and `node --check` on every `.js` and `.mjs` pass as at the baseline or better.
- **L4.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

Write only in the folder: its `.js` (not `tuner.js`), `.css`, `.html`, `.mjs`, `DESIGN-SPEC.md`, `README.md`
§"Motion" and its capture lines, and `INDEX.md` regenerated with the command at its top.

## Report

Each outcome PASS or FAIL with its measure; what you removed, in a short list; any literal text that contradicted its
intent; files changed; the commit SHA. At most 25 lines.
