<!-- brief-format: v1 role: builder -->
# Fixer brief: the verifier's findings on the accepted public page and its specification (public-redesign-r01)

For a fresh `owner-direction-fixer` (Sonnet). The targets are frozen; make exactly these edits and decide no design.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `ccf059e3`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/public.js` lines 150-160, 330-335, 712-716, 759-762, and `isLive`; the rows named below in `design-research/owner-composition-exploration-r04/directions/eclipse/PUBLIC-SPEC.md` and its parts `design-research/owner-composition-exploration-r04/directions/eclipse/spec/public-1.md` to `design-research/owner-composition-exploration-r04/directions/eclipse/spec/public-4.md`; `D:/fitway-temp/public-redesign-r01-verify-70/REPORT.md`, the findings you apply.

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

## The decision

Locked rule: stale data never looks live. The verifier found Delayed's spoken hour and figure still say "now" beside a 13-minute-old reading, while its picture shows no Now label. The coordinator's call: "now" goes from Delayed's spoken names, so eye and ear agree. The picture does not change. The rest are corrections to the specification's rows; the page is the fact.

## Causes and required outcomes

- **N1.** `public.js:333` and `:761` pass `namesNow()` as the "now" argument of `T.hourName` and `T.chartName`, and `namesNow` is true in Delayed. Outcome: those two "now" arguments use `isLive()`, and `public.js:714` uses `isLive()` too. `namesNow` stays only for the third argument of `T.hourName` (the quiet hour still left), renamed `carriesTime`. Comments at lines 155-156 and 331-332 say this, in the same number of lines. No line number may move; no pixel may change.
- **N2.** Rows PUB-7 and PUB-66 say "Right now" in Live and Delayed. Outcome: Live alone; "Crowd" / «الازدحام» in every other state.
- **N3.** PUB-145 and any row that says Delayed speaks "now" (search the four parts for it). Outcome: they say Delayed's spoken hour and figure carry no "now", citing `public.js:333`, `:761`. PUB-145's reason for the English gap becomes "Quieter than usual", the wider, 161.11 px against 150.5.
- **N4.** `PUBLIC-SPEC.md` lines 4 and 16 say the page stands unchanged at `c4d804a5`. Outcome: the page's picture stands as accepted at `62adb061`; its spoken names changed after, at `43dad5f8` and this commit, with no line moved; `file:line` means this commit. Add the source code `V70`, `D:/fitway-temp/public-redesign-r01-verify-70/`, to the Sources table.
- **N5.** PUB-34: its one-line widths become: at 7:28, Arabic from 366 px and English from 440; a wider clock takes more, and «12:28 ص» takes two lines at 390 (`V70`). PUB-17: "12 AM" stands from 375 px in Arabic. PUB-37: sentence to card reaches 54.11 px at Arabic 360 x 740, where the other gaps cap at 32.
- **N6.** PUB-144's not-met list is short. Outcome: it adds the language link 16 px and wordmark 13-14 px at all five sizes; the hour labels' least gap, 5.96 px at English 360 and 7.74 at Arabic 360; and Arabic's picked name is not bold under 346 px, rather than at 320 alone. Air 2.62 stays as 2.61-2.62.
- **N7.** Known and not fixed. Outcome: section 6.12 lists these under one line, "the verifier's, left as the concept stands": the stale comments `public-copy.js:18`, `42`, `87`, `108`, `public.js:233`, `236`, `public.css:302-303`; Loading's nameless h1 and its tree reading "About inside full" (`public.js:265-266`); after the ceiling into Error, the polite region keeps "Loading how busy it is" (`public.js:202`); at `?pct=off` the stamp keeps the percentage's column; the meta description's static "right now" in all states (`public-copy.js:78`, `138`).

## Limits

Nothing else in the page changes: not a pixel, not a string in `public-copy.js`, no other state. Do not fix what N7 lists. Row numbers stay stable.

## Verification

Run `pnpm verify:owner run --script D:/fitway-temp/public-redesign-r01-verify-71/spoken.mjs --concept <the Eclipse folder's absolute path> --out <a new folder named spoken in the run folder> --port 3176` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, and read `result.json` there. It must show "now" or «الآن» in Live and in no other state's region, figure or hour names. Then `pnpm check:repository` in the worktree. Leave the ladder to CI.

Commit once with the message `fix(public): Delayed no longer speaks now; the specification follows the verifier`. Do not push.

## Report

Final message: the commit, one line per outcome, the check's lines for Live and Delayed in both languages, anything you left and why. Run folder: `D:/fitway-temp/public-redesign-r01-verify-71/`.
