<!-- brief-format: v1 role: verifier -->
# Verifier brief: Settings, the whole screen in arrangement ج (owner-design-exploration-r04)

For a fresh `owner-direction-verifier` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `c7e9438f`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 4, 7, 8, 11, 12, 16, 23, 35, 41, 49, 75, 78, 79, 80 and 82, and "How this milestone's rounds run" item 11.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/briefs/designer-settings.md`: the brief the round
    answered; its "Hard limits", "The whole range" and "Frames" are what you verify.
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows STA-10, STA-14, DLG-1…3,
    MOT-9, MOT-13 and §1.9 (focus rings), for the shared behaviour the page must match.
  - `.agents/skills/verify-fitway/SKILL.md`: the verifier rules G1-G4 and its CLI; use it instead of your own scripts
    where it covers the check.
  - Arrangement ج as the user chose it: `D:/fitway-temp/owner-r04-settings-skeleton/skeleton-c-1440-ar.png` and
    `skeleton-c-1440-crowd-edit-ar.png`.

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
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- Write only in `D:/fitway-temp/owner-r04-settings-verify/`; the coordinator checks `git status` in every worktree
  afterwards. (r04 G5) Serve over HTTP on port 3191 only. Read the implementers' `SETTINGS-SPEC.md`, the round's
  NOTES.md and crops only after your own result is recorded.

## What was delivered

`f100c5fd..c7e9438f` on the build branch (parts 1-3 of the brief above; `5253d95f` was arrangement ب and is
superseded): `settings.html`, `settings.css`, `settings.js`, `settings-capture.mjs` and `SETTINGS-SPEC.md` under
`design-research/owner-composition-exploration-r04/directions/eclipse/`. The page's review switches are listed in its
own code (`?state=`, `?edit=`, and the range and refusal switches); find them there.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | The page is arrangement ج: four cards in two columns from 1024 (the crowd and the business day; the hours and the history with reasons), and «تعديل» opens that card's window over the page; on the phone each opens a bottom sheet | frames at 1440, 1024 and 390, AR |
| V2 | No sideways scroll and no clipped or overlapping text at 1440, 1024, 768, 390 and 320, and at 200% zoom of 1440, AR and EN, at rest, with each window open, and in each state | scrollWidth against clientWidth per frame; overlap and clip probe |
| V3 | Every target is at least 44 × 44 px, in every window and sheet | measured boxes, smallest named |
| V4 | The page behind a window moves 0 px when it opens and when it closes, at 1440, 1024 and 390 | card boxes before, open, after |
| V5 | Loading arrives into the page with the cards, titles, slots and header moving at most 0.5 px and layout shifts summing to 0, at 1440, 768 and 390, AR and EN (item 82; STA-10, STA-14) | boxes before and after the arrival; layout-shift observer |
| V6 | People per level equal `bandFor`'s count (`packages/api/src/occupancy/bands.ts`) for capacity 1, 7, 120 and the contract's largest, with limits at their tightest and widest, and read "up to" | your own computation against the page's text |
| V7 | Times are 12-hour with ص/م; a percentage in Arabic sits in an LTR isolate; English does not copy Arabic's geometry (item 16); the wording and range rules hold (items 11, 12, 23) | DOM and frames, AR and EN |
| V8 | Saving goes through a confirmation listing each change from → to with an optional reason (240 characters); working, done and each refusal the contract can return are drawn; the conflict view shows saved values beside the typed ones and names no one (item 78); nothing is merged silently | each step's frame at 1440 and 390 |
| V9 | Closing a window or leaving the page with typed changes asks first; with nothing typed it closes at once | keyboard run (Escape, ×, cancel), navigation |
| V10 | Focus: each window traps focus and returns it to its «تعديل»; rings as the shared components draw them (item 75, §1.9); a dialog's buttons start where its text starts (item 35) | Tab run with ring crops |
| V11 | Field text is 16 px (item 41); motion is complete at first paint, with no intro and no digit roll; only a dialog's or sheet's own open and close move (item 4) | computed styles; frames at first paint |
| V12 | Nothing looks live and nothing is lit beyond the page wash (item 8); no visitor or per-visitor data anywhere; no off-origin request | frames; network log |
| V13 | The whole range from the brief renders without breaking: capacity 1 and the largest, every day closed, one day closed, opening equal to closing, past midnight, the bounds of the business day and the buffer, a history with none, one and many records, a reason at 240 characters | crops to each element with a strip of its neighbours |
| V14 | `file://` loads the page with fonts and no console error; the console is clean over HTTP in every state | console logs |
| V15 | 1440 and 1024 do not look empty or unfinished, at rest or with a window open; 390 does not feel cramped | your judgement on named frames, said plainly |
| V16 | Arabic and English each read as their native reader reads them: start edges, alignment of values, order of label and value, measured RTL and LTR edges (item 79: this review replaces the reading-direction reviewer) | measured edges per card, AR and EN |

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line`;
what you could not run and why; anything that reads or behaves wrong though it passes its check or meets its rule,
with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"). Name each frame you looked at; save
your frames under `D:/fitway-temp/owner-r04-settings-verify/frames/`. At most 50 lines.
