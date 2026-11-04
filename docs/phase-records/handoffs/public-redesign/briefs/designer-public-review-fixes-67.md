<!-- brief-format: v1 role: designer -->
# Designer brief: the two reviews' findings on the public page (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010). The page's form stands: this round fixes what two independent
reviews found, and invents no new form beyond what a finding needs. The user is away from home and judges from pictures.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `aad3942d`
- The page files are as at `ba0973c8`.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `public.css`, `public.js`, `public-copy.js` and
    `public-slide.js`: the page, which you change in place.
  - `D:/fitway-temp/public-redesign-r01-review-66/REPORT.md` and `D:/fitway-temp/public-redesign-r01-rtl-66/REPORT.md`: the findings. Their frames
    sit beside them; look at the ones you act on.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"6. Public state grammar".
  - The `ux-araby` skill (invoke it) for any Arabic string you change.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Public designer frames" and
    §"CLI working loop".

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

- `<run>` is `public-redesign-r01-fix-67`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Impeccable is the one design skill, with `ux-araby` for Arabic copy. Impeccable's files go in
  `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)
- The worktree's verification CLI has no `frames`: run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` with
  `--concept` set to the page's absolute folder. That checkout is otherwise read only. Ports 3181 and 3182 are the user's, and 3188 is taken. Use
  port 3186. `frames` needs a fresh empty `--out` folder, and in PowerShell quote `'ar,en'`.
- This repository is public. Never read a sketch folder's state file, never copy a `usual` array from a sketch folder, and never name where the
  page's demo shape came from.

## Your judgment: what the person must get

1. **Text a person outdoors can read (the worst finding).** Status lines at 14-15 px, hours 14, day names 13, the axis 12.9 at weight 500, in every state at
   320-430. The user on these: «مثل كلمة يفتح شوف كيف مختفيه». «يفتح» at 18 px and heavier they called «ممتاز»: that is the bar. Raise what falls short,
   and solve it together with Arabic's day names at 320, whose keys have only 1.3 px of air and whose bold «جمعة» nearly touches its outline, and English's 320
   axis (4.2 px between labels). If the bar cannot be met somewhere, say where and why.
2. **The tablet's head.** At `768x1024` the language key is 14.6 px from the top against 34.5 from the side, the word starts at 95, and the card takes 66-68% of the
   height. The user wants good white space around the brand and key, the head low, the card not tall.
3. **English's two facts** drift apart: 76.5 px between "inside" and "58%" at 390 and 117 at 1440, against Arabic's 21 and 33.
4. **What moves.** Under 844 px tall, state changes move things. `360x740`: word 16-27 px, card 33-63, Loading to Error 9-24. `320x568`: Unavailable's card 84 px, and a
   scroll of 94-107 px that cuts the days. Bring each as near zero as the height allows, and keep the days reachable. Say what remains.
5. **Phones at 200% zoom.** Day names collide and Error's sentence is cut.
6. **Smaller reading faults.** English Delayed at 320-350, where "13 min ago" starts 24 px before "Delayed". Arabic under 378, where the comparison falls last, after «مباشر».
   The retry key that boxes its word. Monday and Wednesday, near twins: give them their own curves, keeping hours, level words and comparisons true.

## Frozen: truth and accessibility

7. A closed gym with `?now=` in or after open hours (`state=closed&now=15`): the line says 6 ص and the circle stands on 1 ص, and Friday has no circle. In Closed, today is always a
   whole day: the line's hour and the circle's bar agree, at any `now`, on every day.
8. `?now=8` keeps the stamp at 7:41 م and says «قريب من المعتاد» beside a bar towering over the usual one. The stamp follows `now`, and the comparison is worked out from the live value against
   that hour's usual, under any `now` and level. The page's default frames keep their words.
9. Unavailable's accessibility tree says "with now at 7 PM" and "7 PM, now" (`public.js:318,741`). No time and no now mark in Unavailable's tree. Check Closed and Error the same way and report.
10. `B.bars.toggleAttribute("aria-hidden", !data)` (`public.js:298`) writes an empty `aria-hidden`, which exposes the 20 buttons. It must truly hide them.
11. `public.html`'s meta description names a sketch and "Concept only". Replace it with one plain sentence on what the page tells a visitor.

## Keep

Not findings, leave them: Arabic's facts part at 375-378 rather than 386, because one line reads well at 378; English Friday's axis ending at 8 PM on phones. Keep the 20 hourly bars, the see-through live
bar, the stronger red, «نحو 70 في الصالة», no concept label, the quiet line's forms («6 ص هادئ عادةً», «12 ص أقل زحمة عادةً», hidden), Unavailable with no sentence, «مباشر» fixed under the percentage
(spread 0), Sunday first, ranges from the right, `font-display: optional`, proportional figures, the bars' motion, reduced motion, one announcement. No new `requestAnimationFrame` or canvas. Stale, closed,
absent or loading data never looks live. No switches this round.

Check at `320x568`, `360x740`, `390x844`, `430x932`, `768x1024` and `1440x900`, `ar` and `en`, states Live at each level, Delayed, Closed, Unavailable, Error and Loading, and another day picked, using
`pnpm verify:owner frames` and `pnpm verify:owner sheet`. Do not edit the page's specification.

## Report

Your final message, under 250 words: the commit SHA on `public-redesign-r01` (commit there, do not push); each numbered point in a line with before and after sizes; two sheet paths for the user (Arabic phone states, English and tablet); anything
you could not meet. `pnpm check:code-health` and `pnpm check:repository` from the worktree must pass, with no raised baseline.
