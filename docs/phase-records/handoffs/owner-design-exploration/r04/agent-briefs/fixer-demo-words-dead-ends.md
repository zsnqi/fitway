<!-- brief-format: v1 role: builder -->
# Fixer brief: the demo's words and dead ends (owner-design-exploration-r04)

For a fresh `owner-direction-fixer` (Sonnet, high). Every target and outcome is frozen here. You make no design decisions; where this brief does not fit what you find, stop and report.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `18180f83`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Folder:** `design-research/owner-composition-exploration-r04/directions/eclipse/` (below, "the folder"). Line numbers are from an older commit; find each string by search.
- **Read first, only these:** the lines you change, and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

## Words, Arabic only unless it says so

| # | Where | From | To |
|---|---|---|---|
| W1 | `shared-frame.js`, `access.js`, `activity.js` | «الوصول», «سجل الوصول», on every page: rail, tab bar, page title, the Activity filter, the Access history link | «الحسابات», «سجل الحسابات». English keeps "Access". Words like «مرات الدخول» are not touched. |
| W2 | `settings.js` | «الزحام» everywhere, including «تطبيق تغيير الزحام؟», «لم تُحفظ تغييرات الزحام» | «الازدحام» |
| W3 | `reports.js` | «تصدير بيانات الدقائق» | «تصدير القراءات دقيقة بدقيقة». It must fit its button at 320 x 568 without being cut. If it cannot, stop and report. |
| W4 | `reports.js` sort list | «مرات الدخول الأكثر», «الذروة الأعلى», «المعدّل الأعلى» | «أكثر مرات دخول», «أعلى ذروة», «أعلى معدّل» |
| W5 | `daily.js` details | «فيها قراءة» | «دقائق فيها قراءة» |
| W6 | `daily.js` details, Delayed | «792 من 810 دقيقة» | «792 من 810 دقائق», through the page's `arMin` |
| W7 | `access.js`, `activity.js` | «تعيين كلمة مرور», «إعادة تعيين كلمة مرور نورة», «أُعيد تعيين كلمة مرور نورة» | the one act has one name: the button «تعيين كلمة مرور», the dialog title «تعيين كلمة مرور لـنورة» (the name is the person's, nothing else changes), the done line and the log entry «عُيّنت كلمة مرور لـنورة.» Keep how the name is isolated today. |

## Hour ranges in Arabic start on the right

`NUMS` in `daily.js` and `reports.js` wraps a same-period range in `<bdi dir="ltr">`. Change it so the first number stands on the right in Arabic, in the public page's form: «6 – 7 مساءً», «7 – 8 م», with the dash between thin spaces if the public page has them (`public-copy.js`, `openHours`). English is unchanged. A range never splits across lines. Measured outcome: on Today's busiest-time card, Reports' «الأكثر ازدحامًا» line and a heat tooltip, the first number's x is greater than the second's, at 1440 x 900, 390 x 844 and 320 x 568. Correct any comment or spec row that records the old left-to-right form as deliberate.

## Reports' export dialog

`reports.css`: in the file line of the export dialog only the file name runs left to right; the icon and the row count start on the right in Arabic. English is unchanged.

## Tab titles and meta, both languages

Remove "concept", «مفهوم», "Eclipse", "synthetic", "Exploration" from every `<title>`, every title set by script, and every meta description on the five Owner pages. Public is already clean; leave it.

- Titles: «اليوم · FITWAY», "Today · FITWAY", and the same form for each page.
- Meta description, in each page's HTML and wherever a script sets it: "How busy the gym is, live and over time." and «ازدحام النادي الآن وعلى مدار الأيام.»

## Links that lead nowhere leave the demo

Every element with `data-inert` (rail Monitoring and Sign out, status details Operations `#ops-link`, phone menu `#menu-monitoring` and `#menu-signout`) stops being shown on all five pages, by one rule in the shared stylesheet that holds the rail, covering the rail's `li` too so no gap stays. Keep the markup and scripts. Outcomes, phone and desktop, both languages:

- None of them shows or takes focus, by Tab or by arrow keys inside the phone menu. If arrow keys land on a hidden item, fix the menu's list of items to skip it.
- No separator or heading is left alone where they stood, and the phone menu still opens with what remains. If the phone menu is left with nothing, or the status details look broken, stop and report with a frame.

Correct the spec rows that name these items (`RAI-1`, `MNU-2`, `DESIGN-SPEC.md` line 13 and any others) so they say these are hidden in the demo.

## Reports' range words

- **Weekdays outside a custom range.** A weekday with no date in the chosen range says «خارج الفترة» / "Outside the range", in its row and tooltip, instead of "No readings". A day inside the range with a real gap keeps "No readings", in the same box style. Last 7 and Last 28 days do not change. Make sure the rule means "no date of this weekday in the range": a range partly before the history's first reading must still say what it says today for those dates. If `ofDay` cannot tell them apart, stop and report.
- **The hatch.** The mark "Fewer than 3 days" (PAT-10) applies only when the chosen period has 21 days or more, since a shorter period cannot reach 3 of any weekday and the mark would cover everything. Under 21 days: no hatch in the grid or the phone's bars, no legend key, no such words in a tooltip. Update PAT-10.

## Small items

- **Sample emails.** The default owners in `access.js` become `fahad@nadi-alshamal.sa`, `noura@nadi-alshamal.sa`, `omar.alharbi@nadi-alshamal.sa`. I checked that domain has no registration. Other places that show those three addresses follow. The form's hint `name@example.com` and the `?case=` fixtures stay.
- **Public's percentage.** In `public.js`, a stored capacity below the count no longer gives over 100%: it shows 100%. Nothing else on the page changes.
- **Stale comment.** The comment in `reports.css` above `.rp-trend:not(.lit) > .lamp` promises a light on the "Last 7 days" card. Change it to say this card carries no light, by the user's choice. Do not change the rules.

## Limits

- Compositions, sizes, colours and every number stay. Do not touch `gym.js` or `demo-store.js`.
- `pnpm check:code-health` must pass. `activity.js`, `access.js` and `reports.js` have no room for a new code line, so keep each file's count from growing. Before committing run `pnpm code-health:baseline` and commit the result; if it would raise any baseline, stop and report.
- Regenerate `INDEX.md` the way the folder's tools do and report that its check passes.

## Check and report

Write a small Playwright script under `D:/fitway-temp/owner-r04-words/`, run from PowerShell, with these measured checks in both languages at 390 x 844 and 1440 x 900 unless a row says otherwise, and plant one defect to show it can fail:

- Rendered text and titles of the five pages hold no «الوصول», «الزحام», "concept", «مفهوم», "Eclipse", "synthetic", or `@example.com`.
- The range measurements above, including 320 x 568.
- W3 fits at 320 x 568 (button's text not cut).
- The inert items: not visible; the menu's arrow keys walk only what shows.
- Custom range 15-17 Sep: Sunday, Monday, Friday, Saturday read "Outside the range"; Thursday's gap still reads "No readings"; no hatch. Last 7 days: no hatch, no key. Last 28 days: same hatch cells as `18180f83`, compared by class.
- Public with capacity 50 saved: 100%.
- No page errors.

Then make a sheet with `pnpm -s verify:owner sheet`, Arabic first: Today, Reports, Reports custom range, Reports export dialog, Access, Settings, the open phone menu, at phone and desktop. Look at it yourself. Commit on the branch with one message; do not push; run named checks only, CI runs the ladder. Report in short: commit, each section done or not, measured results, the sheet's path, anything you saw that looks wrong even if the brief does not ask about it, and what you could not check.
