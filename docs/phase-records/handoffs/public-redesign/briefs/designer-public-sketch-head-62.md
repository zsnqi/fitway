<!-- brief-format: v1 role: designer -->
# Designer brief: the phone's head comes down, in the notes sketch (public-redesign-r01, item 61)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010). Work in a throwaway sketch outside the
repository; the user judges by eye and picks. Nothing here reaches the page until the user says «خلصت».

- **Worktree:** `D:/Projects/fitway-worktrees/owner-design-exploration-r04`, branch `codex/owner-redesign-r04`, HEAD `c6b1f55a`
- You run commands from that worktree and change no file in it; commit nothing. The one place you write besides your run
  folder is the sketch below, which this brief names in place of the worktree in the Environment's first line.
- **The sketch, which you change in place:** `D:/fitway-temp/public-redesign-r01-sketch-62/` (`public.html`, `.css`, `.js`,
  `public-copy.js`). A frozen copy stays at `D:/fitway-temp/public-redesign-r01-sketch-61/`; never edit that one.
- The round ran before this folder's move on 2026-11-04, when the working copy had another name; its contents moved unchanged, so the records cite a folder with provenance.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - The sketch's files above, and `D:/fitway-temp/public-redesign-r01-sketch-62/STATE.md` for its switches. That file holds private
    figures: never copy them into your report.
  - `D:/fitway-temp/public-redesign-r01-sketch-61/REPORT.md`, findings F4 and F5 only.
  - `.agents/skills/verify-fitway/SKILL.md` §"Public designer frames" and §"CLI working loop", in the worktree.

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

- `<run>` is `public-redesign-r01-sketch-head-62`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other design or taste skill.
  Impeccable's files go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)
- Port 3182 serves this same sketch folder to the user's phone: leave that server alone; your edits reach it on reload.
  The verification commands accept ports 3176, 3186 or 3188 only; use 3186. `frames` needs a fresh empty `--out`
  folder, and in PowerShell quote `'ar,en'`.
- Render with `pnpm verify:owner frames --concept D:/fitway-temp/public-redesign-r01-sketch-62 --page public.html` from the worktree.
  The sketch's current form is the query `state=live&level=packed&hours=1&type=1&shape=h&audit=1`.

## What the user wants, in their words

On the phone, about the card: «اعتقد نقدر نقصرها شوي بحيث ... النصوص الي فوق ... تقدر تنزل شوي وتترك مساحة بيضاء ممتازة
للشعار حق النادي فوق و خيار تغيير اللغة».

So a person opening the page on a phone sees the club's brand and the language key with good white space around them,
the head (the level word and the facts under it) lower on the screen, and the card a little shorter to make that room.
The user chose the 20 bars at the page's full height for how calm they read, so the card gives up "a little", and the
bars must still read as they do now.

## Outcomes

1. **The head comes down on the phone.** Build what you judge right, and if you see more than one honest answer, give up
   to three, each behind a value of one new URL switch (`air=`), off by default, so the user can compare them on their own
   phone. The form and the amounts are yours; there is no target number.
2. **Weigh it against F5.** F5 moved the key inward and tightened key to word from 41.3 to 33.7 px of ink at 390. Say
   whether F5's corner stays as it is in your answer.
3. **Closed and Unavailable stop holding Live's height on the phone.** The user agreed: the hole under their last row goes,
   and the card moves once on a state change. This one is decided, so it applies behind `audit=1`, without options. Delayed
   and Loading keep the hold. `hold()` writes the height inline.
4. **Say what happens at each size,** measured: top of the word, top of the card, height of the plot, whether the page
   scrolls, whether the concept label is on the first screen. Report before and after.

Sizes: `320x568`, `360x740`, `390x844`, `430x932`, in `ar` and `en`. States to look at: Live at `level=packed` and
`level=moderate`, Closed, Unavailable, Loading. The tablet and the computer do not change at all; prove it with one frame
pair each.

## Measured for you (the coordinator, on the frozen sketch, Live at Packed)

| Size, language | Key bottom | Word top | Sub bottom | Card top | Plot height | Page height |
| --- | --- | --- | --- | --- | --- | --- |
| 320x568 ar | 56 | 80 | 270 | 296 | 150 | 733 |
| 360x740 ar | 56.2 | 80 | 271.3 | 297.3 | 236 | 778 |
| 390x844 ar | 57.5 | 91.1 | 247.9 | 279 | 320 | 844 |
| 390x844 en | 57.5 | 87.5 | 229.5 | 257 | 320 | 844 |
| 430x932 ar | 59.4 | 134.2 | 292.4 | 366.6 | 320 | 932 |

Two traps, measured in a trial the coordinator threw away:

- `fitted()` leaves the concept label's height out of what it measures, so while the plot is under its ceiling it takes the
  label's room too and the label falls below the fold. A larger gap above the word alone left 390x844 at a 318 px plot and
  882 px of page: the head moved and the card did not get shorter.
- `.sign`'s rows are sized with its height indefinite while `fitting`, so a minimum on one `fr` row can raise the other
  through their ratio (a 30 px floor with `2fr` and `1fr` gave 60 px above the word at every height).

## Keep

Everything else on the page stays as it is: no copy, colours, bars or switch values change. Reduced motion, one announcement
and no `requestAnimationFrame` or canvas stay. Arabic time runs right to left.

## Report

Your final message, under 300 words: what you built and each `air=` value in a line; the before and after table; a sheet
path for each option, Arabic and English at 390x844 next to the current form, and a sheet of the states at 320 and 360; your
lean with its reason; anything you could not meet. Files stay uncommitted in the sketch folder.
