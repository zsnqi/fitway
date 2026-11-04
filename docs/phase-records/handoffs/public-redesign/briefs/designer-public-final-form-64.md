<!-- brief-format: v1 role: designer -->
# Designer brief: the public page's final form (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010). The page now carries the user's notes. This
round finishes it: everything below is the user's own complaint or open question, and the forms are yours. The user is away
from home and judges from pictures, which you make with `pnpm verify:owner frames` and `sheet`.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `db869757`
- The branch may carry Markdown-only record commits on top of `db869757`; the page files are as at `db869757`.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `.css`, `.js`, `public-copy.js` and
    `public-slide.js`: the page, which you change in place.
  - `D:/fitway-temp/public-redesign-r01-carry-63/REPORT.md` and `D:/fitway-temp/public-redesign-r01-carry-63/sheet-phone-c/sheet.png`: where you start.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"6. Public state grammar".
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`, for any motion you change.
  - The `ux-araby` skill (invoke it) for any Arabic string you change.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`
    §"Public designer frames" and §"CLI working loop".

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

- `<run>` is `public-redesign-r01-final-form-64`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Impeccable is the one design skill, with `ux-araby` for Arabic copy; load no other
  design or taste skill. Impeccable's files go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)
- The worktree's verification CLI has no `frames`: run `pnpm verify:owner` from
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04` with `--concept` set to the page's absolute folder. That checkout
  is otherwise read only. Ports 3181 and 3182 are the user's: leave them alone. Use port 3186. `frames` needs a fresh
  empty `--out` folder, and in PowerShell quote `'ar,en'`.
- This repository is public. Never read a sketch folder's state file. Never copy a `usual` array from a sketch folder, and
  never name where the page's demo shape came from, in the page, a comment or a commit message.

## What the user must get, in their words

1. **Arabic on small phones.** Looking at Live at 320: «شكل الصفحة ب العربي صار سيئ طيب اقصد الترتيب». They did not say which
   order they want. They agreed that under about 386 px the two facts take two lines and the numerals stay 34 px. Find what
   reads badly and solve it.
2. **«مباشر» stays put.** They agreed it stands fixed under the percentage and never moves along its line. The carry round
   reports the English stamp still moves 43-104 px, and that Arabic under 386 px and the computer hold it fixed but not under
   the percentage. Make it true in every language and size, or show why it cannot be.
3. **The sentence under «العدد غير متوفر».** «لا نعرض عددًا قديمًا على أنه الحالي»: «مب كويس», «دا كانه شرح». «نعم او تنحدف عادي ف بنشوف وش
   الانسب». They decide from pictures.
4. **The retry.** «جملة تحقق من الاتصال ان تكرر دلك قريبه من مربع اعادة المحاولة»: the sentence is 6 px from the button and the
   button's ring takes 5.
5. **Text sizes and weights, all states.** «نحتاج نراجع احجام النصوص و ايضا سماكة بعض النصوص», «مثل كلمة يفتح شوف كيف مختفيه», «مراجعة بشكل
   عام». «يفتح» at 18 px and heavier they called «ممتاز»: that is the bar for the rest.
6. **The bars still read as a real day.** The user chose 20 bars for how calm and natural they read. The carry round rounded
   the data to the nearest 5, which was the coordinator's call, not theirs, and it left flat runs: Tuesday's peak is four equal
   bars. Start from the page's current arrays, not a sketch's, and adjust them bar by bar so each day has its own believable
   curve. Keep each day's hours, the comparison sentences and the level words true.
7. **The Closed day.** On the quietest hour: «الدائرة واضحة وتكفي اصلا», and the sentence «اهدا ساعة اليوم 2م هادئ عادة» is «طويلة مررره». The
   carry round read that as Closed with no line, the circle alone, and other days' picks still naming the quietest hour in
   words with no circle. Say whether that holds together, and let them choose from pictures where it is a real choice.
8. **The final form: colours, bar motion, English.** They asked for one round on these, with no words of their own on what to
   change. Your judgment, including whether to change nothing. Two things measured: English Friday «11 PM» is 1.4 px from the
   card's edge at 320, and each hour is 16 px wide at 390 under the 24 px the page holds for touch, so say how a finger picks
   an hour.
9. **The head after the label went.** They wanted the head lower, good white space around the brand and the language key, and
   the card a little shorter. With the concept label gone the carry round measures at 390 plot 297 to 320, word +11, card +15,
   and at 430 word +19, card +38. Judge it at each phone size and fix it if the white space or the card no longer reads right.

Where a point is a real choice for the user, give up to three options, each behind a value of one URL switch, off by default;
points 3 and 7 are. Everything else you decide. The switches stay until the user picks.

## Keep

The 20 hourly bars, the live bar's see-through form, the stronger red, «نحو 70 في الصالة», no concept label, the quiet line's
three cases («10 ص هادئ عادةً», «12 ص أقل زحمة عادةً», hidden), Sunday first, ranges from the right, `font-display: optional`,
proportional figures. Reduced motion, one announcement, and no new `requestAnimationFrame` or canvas. Stale, closed, absent or
loading data never looks live.

Check at `320x568`, `360x740`, `390x844`, `430x932`, `768x1024` and `1440x900`, `ar` and `en`, states Live at each level,
Delayed, Closed, Unavailable, Error and Loading. Do not edit the page's specification: list per PUB record what no longer
matches.

## Report

Your final message, under 300 words: the commit SHA on `public-redesign-r01` (commit there, do not push); for each of the nine
points what you did in a line; the options with their switch values and your lean; a sheet path per point the user should see;
the PUB records that no longer match; anything you could not meet. `pnpm check:code-health` and `pnpm check:repository` from
the worktree must pass, with no raised baseline.
