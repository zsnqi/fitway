<!-- brief-format: v1 role: verifier -->
# Verifier brief: the public page against what the user asked for (public-redesign-r01)

For a fresh `owner-direction-verifier` (Opus, high), and a fresh `rtl-ltr-reviewer` on the same page. Review independently: read no
designer, builder or fixer report and no other reviewer's output, and never edit what you review. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `ba0973c8`
  (the coordinator may add a Markdown-only record commit on top; review `ba0973c8`)
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `public.css`, `public.js`, `public-copy.js`
    and `public-slide.js` at `ba0973c8`: the page under review.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"5. Public crowd instrument", §"6. Public state
    grammar" (with "Loading behaviour") and §"9. RTL, localization, and time".
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`: the interactions' motion values.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Public designer frames" and
    §"CLI working loop".
- The page's specification is knowingly behind the page and gets rewritten after this review.
  Do not read it and do not report that it differs. One line of `DESIGN_GUIDE.md` §6 is knowingly changed by the user's word: Unavailable
  no longer needs a sentence explaining old data; its "Remove count, band, level mark, and timestamp" still holds.

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

- The worktree's verification CLI has no `frames`: run `pnpm verify:owner` from
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04` with `--concept` set to the page's absolute folder. That checkout is
  otherwise read only. Ports 3181 and 3182 are the user's. The verifier uses port 3176, the reading-direction reviewer port 3186.
  `frames` needs a fresh empty `--out` folder, and in PowerShell quote `'ar,en'`.
- This repository is public. Never read a sketch folder's state file.
- The `ui-forensics` skill is allowed for measuring; `impeccable` is not needed.

## What the user must have, in their words where they gave them

Check at `320x568`, `360x740`, `390x844`, `430x932`, `768x1024` and `1440x900`, `ar` and `en`, states Live at each level, Delayed,
Closed, Unavailable, Error, Loading, and another day picked (`state=live&day=wed`, and the page's other switches).

1. **Reading order on small phones.** «شكل الصفحة ب العربي صار سيئ طيب اقصد الترتيب». Under about 386 px the two facts take two lines
   and the numerals stay 34 px.
2. **«مباشر»** stands fixed under the percentage and never moves along its line, in every language, size, level and Loading.
3. **Unavailable** has its word and no sentence under it. No count, band, level mark or time, in the visual and the accessibility trees.
4. **Retry:** the sentence is not crowded by the button or its ring.
5. **Text sizes and weights, all states.** «مثل كلمة يفتح شوف كيف مختفيه». «يفتح» at 18 px and heavier is what they called «ممتاز»: the bar
   for the rest. Nothing small or thin that a person outdoors would miss.
6. **The 20 bars read as a real day**, calm and natural, each day its own curve with no flat neighbours. Each day's hours, level words and
   comparison sentences stay true of the page's own data.
7. **A whole day** (Closed, today before opening, another day picked) carries the circle and one short line, «6 ص هادئ عادةً» in form. Today
   open has three cases: «10 ص هادئ عادةً», «12 ص أقل زحمة عادةً», or hidden with no circle. The line's hour and the circle's bar must always
   agree, and be true of the data.
8. **Head and white space.** Good white space around the brand and the language key, the head low, the card not tall. No concept label anywhere.
9. **A finger picks an hour.** English Friday's last hour keeps clear of the card's edge at 320. Try it with touch: tap, slide, the step keys.
10. **Keep:** the see-through live bar, the stronger red, «نحو 70 في الصالة», Sunday first, ranges from the right, `font-display: optional`,
    proportional figures, reduced motion, one announcement.
11. **Truth.** Stale, closed, absent or loading data never looks live. Nothing about visitors is stored or sent.

Also measure, since nobody has: 200% zoom; a fallback font if the page's web font does not load (Android's Arabic); the bars' motion in real
time on a day change; keyboard order and focus at each state; whether any state change moves the word or the card, at each size; whether the
page scrolls at each size and what that cuts. Say the page's text contrast where it is lowest.

## Report

Your final message, under 300 words. Findings only, worst first: what a person sees, the size, language and state, file:line, a frame path in
your run folder, and whether it breaks a numbered point above or is your own judgment. Then one line per numbered point that holds. Mark what you
could not check. Fix nothing and recommend no form.
