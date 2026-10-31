<!-- brief-format: v1 role: codex delivers: report -->
# Codex brief: capture Google Maps' Popular Times on a gym's page (public-redesign-r01, round popular-times-26)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-design-exploration-r04`, branch `codex/owner-redesign-r04`, HEAD `75459f4a`
- **Milestone:** `public-redesign-r01`. Decisions: `docs/phase-records/handoffs/public-redesign/DECISIONS.md` item 34
  (in `docs/phase-records/handoffs/public-redesign/decisions/021-040.md`).
- **Read first, only these:**
  - `docs/phase-records/handoffs/public-redesign/decisions/021-040.md` item 34, the bullet on Google Maps' Popular
    Times: why this capture exists (a reference for the feature and its principle, never its look).
  - `docs/phase-records/handoffs/public-redesign/public-redesign-r01-resume.md` §"Next steps", step 0.2: what the
    capture holds.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. Opening Google Maps needs the
  network: request escalation for the browser run with the same justification.

## Goal

The coordinator can see, from frames and short videos alone, how Google Maps presents Popular Times on a gym's page:
the usual day, the live reading against it, switching weekdays, and the motion, in Arabic and in English, on a computer
and a phone width.

## Causes and required outcomes

- **P1. The gym.** The coordinator has never seen Popular Times first-hand (item 34), and a reading shows live only
  while the place is open. Outcome: one gym in Riyadh whose Google Maps page shows Popular Times, preferably one open
  24 hours so a live reading is on screen at capture time; the report names it and its Maps URL. If no gym tried shows
  a live reading, capture one without it and say so. Intent: frames of the feature as a trainee meets it, with the live
  hour present where Google offers it.
- **P2. The usual day and the live hour.** Outcome: for each of Arabic (`hl=ar`) and English (`hl=en`), at a computer
  size (1440x900) and a phone size (390x844), a frame of the Popular Times block on today's weekday, with the live
  reading and any sentence beside it ("busier than usual" or its Arabic) legible, plus one frame of the whole place
  panel so the block is seen in its context. Intent: the coordinator reads the hierarchy, the words and the direction
  time runs in each language from the frames.
- **P3. Switching days.** Outcome: in each language, at the computer size, a frame for at least three other weekdays
  chosen through the page's own day control, and one frame of the control open. Intent: how a visitor picks a day and
  how the day's shape changes.
- **P4. Motion.** Outcome: in each language, at the computer size, a short video (Playwright's own recording, under
  30 seconds) that opens the place, brings Popular Times into view, hovers or taps across several hours, and switches
  days. Intent: the coordinator judges what moves, how, and what a hover or tap reveals.
- **P5. The record.** Outcome: a `REPORT.md` in the run folder with the gym, its URL, the local capture time, every
  file with one line on what it shows, the exact visible text of the block in each language (copied from the page),
  and anything you could not capture and why. Intent: the frames are found and read without guessing.
- **L1. No wall is passed.** Outcome: no CAPTCHA, "unusual traffic" page, sign-in prompt or bot check is solved,
  bypassed or retried around; if one appears, stop the browser work, keep what was captured, and report `STOPPED:`
  with a frame of the wall. A cookie or consent page may be answered only with its reject or decline choice. Intent:
  item 34 forbids passing a wall; the coordinator then looks in the user's own Chrome instead.
- **L2. Nothing is signed in or stored beyond the run.** Outcome: a fresh browser context with no saved profile, no
  Google account, no stored state written outside the run folder. Intent: the capture leaves no trace on the machine
  and carries no account.

## Scope

You may write only inside the run folder `D:/fitway-temp/public-redesign-r01-popular-times-26/` (made for you); the
repository is read-only and you make no commit. You may use the repository's installed Playwright and its Chromium.
Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Add one row for every outcome and limit ID the brief defines (P1-P5, L1, L2). A PASS command must be one you ran, and
its output must be one line the command printed. Outside the block, list the files you wrote and anything you could
not do.
