<!-- brief-format: v1 role: designer -->
# Designer brief: interaction motion across the Owner pages (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009): superseded Owner Paper frames are
reference only. Daily, Reports, Activity log and Access are built on this branch. Today they are almost still: the
only interaction motion is MOT-9's 14 px dialog rise and its scrim fade. The user wants motion in chosen moments that
raise the design's quality and beauty, not motion everywhere (DECISIONS 36). This round designs and builds it once,
for every page, so the remaining screens (Settings, Operations, Monitoring) are built with it.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `54b2737`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 3, 4, 5, 7, 8, 35 and 36 (36 is this round; where it differs from an older item, 36 wins), and "How this
  milestone's rounds run" item 7; `docs/agent-context/WORKING_AGREEMENTS.md` §"Rules and findings". Both files are
  newer on another branch: read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:<path>`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; it binds.
  - `eclipse/README.md` §"Motion" (what moves today, and how it is built with the Web Animations API in `app.js`).
  - `eclipse/DESIGN-SPEC.md` §1.10 (MOT-1…13), §3.5 buttons, §3.9 dialog and bottom sheet, §3.13 the status's
    details and the phone's menu, §3.8 the date picker; navigate the rest with `eclipse/INDEX.md`.
  - Impeccable's `animate` reference, through Impeccable (the one design skill).

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

- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other design or taste skill.
  A local server uses port 3176 only. Frames, videos and scratch go under `D:/fitway-temp/owner-r04-motion/`.

## What the owner should feel, and why

The pages are an instrument: calm, premium, dark glass with one static red light (item 1). Motion here is not
decoration; it answers "did my action take, and what changed?" at the moment the owner acts, and it should make
that moment feel finished and well made. The user's own example: the check in the export's done state («الملف جاهز»)
arriving with a fine animation instead of simply appearing.

The moments the round covers (DECISIONS 36), on every page where they occur:

1. A dialog and the phone's bottom sheet opening and closing (today MOT-9). Why: it is the most frequent change of
   place on these pages, and the owner should see where the dialog came from and where it went.
2. A button going from its label to Working to done (the export, a save, a deactivation, a code change). Why: the
   owner must see the press was taken, that it is in progress, and that it finished, without the button jumping
   size.
3. A done line or a done state appearing (the export's check and «الملف جاهز», Access's done sentences). Why: this is
   the reward of a finished task, and today it just appears.
4. Popovers: the date picker, the header status's details, the phone's menu (today they change at once, MOT-12).
   Why: they open from a control, and the owner should see that link. The chart's readout and marker are not
   popovers; they stay as built (item 5, MOT-5, DO-NOT).
5. «نسخ» becoming «نُسخ» (Access's one-time code view). Why: the owner needs certainty the code was copied, at the
   control they pressed.
6. A row that changes after a deactivation or reactivation (Access). Why: the owner must see what their action did,
   where they did it.

Choose which of these deserve motion and which are better instant, and say why for each; "chosen moments, not
everywhere" is the user's measure, and an instant change done well is a valid answer. If you find a moment the list
misses that would raise the quality, name it and say why; build it only if it fits the limits.

Every moment is designed against its whole range (rounds item 7): Arabic and English (a movement with a direction
mirrors in Arabic), the computer and the phone (a dialog is a bottom sheet there), keyboard and pointer, a fast double
press, an action that fails and offers Retry, a dialog closed mid-animation, and 200% zoom.

## What others found (research digest `D:/fitway-temp/owner-r04-motion-research/REPORT.md`, for you to weigh)

- Models drift to familiar defaults: a fade-and-rise on open, a stagger, a lift on every hover, a bounce, a scale
  from nothing. Practitioners name these as the tell of generic motion; here most are banned anyway.
- Practitioners animate occasional moments and leave frequent or keyboard-driven ones instant; say where you draw
  that line on these pages.
- A movement an owner can interrupt (a dialog closed while it opens, a second press) should continue from where it
  is, not restart or snap.
- Production is React with shadcn on Base UI, which animates mount and unmount through `data-starting-style` /
  `data-ending-style` CSS transitions, with Motion only where CSS cannot do it cleanly; a concept built from
  transitions that map onto that carries over with the least rework. Name any moment that would need more.
- Spring feel and curves need a human eye: state each moment's states and timings so the user can judge them.

## Hard limits

- **Load motion stays banned** (DO-NOT, MOT-1, item 4): the page is complete at first paint; no stagger, rise or
  fade on open; Daily's intro (MOT-10) is unchanged. Nothing here plays without the owner's action, except a done
  state that follows their action.
- **MOT-1's glyph rule holds:** no glyph ever changes opacity; words swap, roll or are uncovered, never faded, and a
  changing number is never cross-faded (DO-NOT). The user rejected the cross-fade. If a moment you believe matters
  cannot be done well within this, do not build it: show why in your report, and it goes to the user.
- **Reduced motion and `?motion=off`** (MOT-11): every change is instant, and the end state is identical to the
  animated one's end state. No layout shift during or at the end of any movement; the page at rest carries no
  leftover inline style, attribute or element (README §"Motion").
- **Truthful states** (item 8): no motion makes stale, loading or failed look live or done; a done state appears only
  after the action really finished in the sample.
- Focus and screen readers: an animation never delays focus moving into or out of a dialog, and never repeats or
  delays an announcement.
- Eclipse's look (item 1), the frame (item 7), DO-NOT in full; existing copy unchanged.

## Files

Write only under `design-research/owner-composition-exploration-r04/directions/eclipse/`: the pages' `.html`, `.css`
and `.js` (not `tuner.js`), the capture scripts (a new `motion-capture.mjs` for this round), `README.md` §"Motion",
and in `DESIGN-SPEC.md` only the rows that describe motion (MOT-*, and rows such as OWN-C1 that
say what moves). Keep the motion in one shared place every page uses, so the remaining screens reuse it. Commit there.

## Frames and video

Render with the worktree's `@playwright/test` at 1440 × 900 and 390 × 844 (and the dialog moments at 768 × 1024),
AR and EN, over HTTP on 3176 and from `file://`, with and without reduced motion. In `D:/fitway-temp/owner-r04-motion/`,
numbered the same in both languages: for each moment, `N-<moment>-<size>-<lang>.webm` recorded in real time, and a
filmstrip PNG of its frames at fixed steps through the movement and 200 ms after it; `R-` the reduced-motion end
states beside the animated ones. Watch every video and inspect every strip; judge each moment on the page as a whole
(does it feel calm and finished, does anything else on the page move or jump); a passing check is not a looked-at
frame.

## Report

For each moment: built or left instant, and why, in one or two lines, with its duration and the frames' names; any
moment you added; anything that reads or feels wrong at any size, language or setting, said plainly, with the rule
that produced it named; where a limit stopped something you think matters; questions you would have asked the user.
The output folder, the files you changed, the commit SHA. At most 50 lines.
