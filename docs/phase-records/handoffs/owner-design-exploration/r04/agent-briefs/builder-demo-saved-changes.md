<!-- brief-format: v1 role: builder -->
# Builder brief: changes stay in the demo (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high).

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `a3e3b90a`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/gym.js`, `design-research/owner-composition-exploration-r04/directions/eclipse/access.js`, `design-research/owner-composition-exploration-r04/directions/eclipse/settings.js`, `design-research/owner-composition-exploration-r04/directions/eclipse/activity.js`, and the parts of `design-research/owner-composition-exploration-r04/directions/eclipse/daily.js`, `design-research/owner-composition-exploration-r04/directions/eclipse/reports.js`, `design-research/owner-composition-exploration-r04/directions/eclipse/public.js` that use a level or a percentage.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the page's absolute folder and port 3176; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-saved-changes/`.
- This repository is public. Never read a sketch folder's state file.

## Why

The gym's owner may ask to change something in the demo and watch it land. Today a change in Access or Settings is lost on reload and reaches no other page, and "View in Activity log" opens "This record isn't in this sample." The pages have no server, so the changes stay in the browser that shows them.

## Outcomes

- **O1, a change stays.** Every action that saves in Access and Settings survives a reload and a move between pages, in both languages. Keep it in `localStorage` through one small script the pages load. Store only what the page needs to show; never a password or a code's value, only the fact that it was set. Where storage is refused, the pages work as they do today.
- **O2, the log tells it.** Each saved change appears in Activity under Today at the demo's clock, newest first, with its actor, reason and details in the same form as the records around it; Settings' history and Access' history show it too. "View in Activity log" opens that record. The "isn't in this sample" notice stays only for a link that truly has no record.
- **O3, a new capacity or level limit moves the levels.** On Today, Reports and the public page, each level word, level mark and percentage is worked out from the saved capacity and limits. Counts and charts' readings stay as they are: 70 people are still 70. Example: capacity 150 makes 70 read as 47%, Moderate. The minute export's `capacity_snapshot` for past rows stays as recorded. The public page stays free of any control and never shows the capacity itself.
- **O4, hours stay where they are said.** An hours or business-day change shows in Settings and Activity. It does not redraw any chart or change any page's hours.
- **O5, back to the start.** Any page opened with `?demo=reset` clears the store and drops that parameter from the address. Nothing on screen shows this.
- **O6, an empty store changes nothing.** With nothing stored, each of the six pages renders as at `a3e3b90a`, in every state: prove it with `pnpm verify:owner compare` on those pages at `390x844` and `1440x900`, `ar` and `en`. A stored change never makes a Delayed, Closed, Unavailable, Error or Loading state look live.

## Checks

Drive these with `pnpm verify:owner run` in fresh contexts, `ar` and `en`, `390x844` and `1440x900`, and report what each returned: deactivate Noura, reload, see it, open the log, follow "View in Activity log"; change capacity to 150, then see Today, Reports and public; change the limits, then the same; change Thursday's hours, then see Settings, Activity, and Today unchanged; `?demo=reset` on another page, then all as at the start. Plant one defect to show your driver fails on it. Add a spec row for the store in `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md`'s part that fits, and regenerate `INDEX.md` as its header says. Leave the whole ladder to CI. Commit on this branch.

## Report

Final message, at most 30 lines: the commit; each O with its measure; the absolute path of one sheet of frames of a change landing, Arabic first; what you could not check.
