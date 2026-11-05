<!-- brief-format: v1 role: verifier -->
# Verifier brief: the accepted public page and its specification (public-redesign-r01)

For a fresh `owner-direction-verifier` (Opus, high). Review independently: read no designer, builder or fixer report, and never edit what you review. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `43dad5f8`
  (a Markdown-only record commit may sit on top; review `43dad5f8`)
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `design-research/owner-composition-exploration-r04/directions/eclipse/public.css`, `design-research/owner-composition-exploration-r04/directions/eclipse/public.js`, `design-research/owner-composition-exploration-r04/directions/eclipse/public-copy.js`, `design-research/owner-composition-exploration-r04/directions/eclipse/public-slide.js`, `design-research/owner-composition-exploration-r04/directions/eclipse/public-ink.js`: the page.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/PUBLIC-SPEC.md`, `design-research/owner-composition-exploration-r04/directions/eclipse/PUBLIC-RULES.md`, and the four parts `design-research/owner-composition-exploration-r04/directions/eclipse/spec/public-1.md` to `design-research/owner-composition-exploration-r04/directions/eclipse/spec/public-4.md`: the specification under check.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument" and §"6. Public state grammar".
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Public designer frames" and §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the page's absolute folder and port 3176; that checkout is otherwise read only. `frames` needs a fresh empty `--out` folder under `D:/fitway-temp/public-redesign-r01-verify-70/`.
- This repository is public. Never read a sketch folder's state file.

## What is settled

The user accepted this page by eye on 2026-11-05. You do not judge its taste, and you do not reopen its composition: Unavailable's blank band and its missing sentence are the user's word, and AMD-P7 proposes the guide's matching line. The specification is written from the page, so where they differ the page is the fact and the row is the fault, unless the page breaks a rule below.

## What to check

- **V1, no reading claims live outside Live.** Locked rule: stale, absent, closed or loading data never looks live. Check Delayed, Unavailable, Closed, Error and Loading at `390x844` and `1440x900`, `ar` and `en`, in both the rendered frame and the accessibility tree, including aria-labels and live regions. Report each "now", "Right now", «الآن» or green Live and what it refers to.
- **V2, the fix round's last commits do what they claim.** `94e134d1`, `920a08dc`, `62adb061`, `43dad5f8`: read each diff, then check its effect at `320x568`, `390x844`, `768x1024`, `ar` and `en`: anything else they moved, and Error's key standing clear of the words above and below it.
- **V3, the specification matches the page.** Choose 30 rows yourself across the four parts, weighted to the states, sizes and copy, and check each against its cited `file:line` and against a frame or measure where it gives a number. Every string in the copy part against `public-copy.js`. Each row marked Gone is really gone from the code.
- **V4, the not-met list is true and complete.** The rows that list what is not met or what reads oddly: confirm each by measure, and add any you find at `320x568`, `360x740`, `390x844`, `768x1024`, `1440x900`.
- **V5, nothing private.** The specification, the rules page and the page name no outside source for the demo data and hold no visitor data. Every `AMD-P` row is a proposal and none reads as decided.

## Report

Final message, at most 40 lines: a verdict per V (PASS, FAIL or PARTIAL); each finding as a hypothesis with `file:line`, the frame or measure that shows it, and the concrete result; the rows you checked by id; what you could not check. Never repair anything. Run folder: `D:/fitway-temp/public-redesign-r01-verify-70/`.
