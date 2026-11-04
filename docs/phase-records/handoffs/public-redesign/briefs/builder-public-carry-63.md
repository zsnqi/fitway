<!-- brief-format: v1 role: builder -->
# Builder brief: the notes sketch becomes the page (public-redesign-r01, items 61 and 62)

For a fresh `owner-direction-builder` (Opus, high). Concept-only (ADR-010). The user has seen everything in the sketch and
said «خلصت»; this round moves it onto the page and applies what they decided. No new design: where something below needs
taste, leave it as it is and name it in your report, for the design round after you.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `6c2f67d9`
- The branch may carry Markdown-only record commits on top of `6c2f67d9`; the page files are as at `6c2f67d9`.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - The page: `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `public.css`, `public.js`,
    `public-copy.js`, `public-slide.js`, which you change in place.
  - The sketch, read only: `D:/fitway-temp/public-redesign-r01-sketch-62/`, the same five files. It is the page with about
    230 changed lines. Its `STATE.md` lists its switches.
  - `D:/fitway-temp/public-redesign-r01-sketch-61/REPORT.md`: what each audit fix behind `audit=1` does.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`
    §"Public designer frames" and §"CLI working loop".
  - The `ux-araby` skill (invoke it) for any Arabic string you change.

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

- `<run>` is `public-redesign-r01-carry-63`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Port 3182 and 3181 serve the user's phone: leave those servers alone. The
  verification commands accept ports 3176, 3186 or 3188 only; use 3186. `frames` needs a fresh empty `--out` folder, and
  in PowerShell quote `'ar,en'`.

## Privacy, read this before anything else

This repository is public. The sketch's `STATE.md` holds raw figures that must never enter it, and neither must the sketch's
`usual` arrays as they stand, which are those figures times 0.8. Outcome 2 replaces them. Never copy `STATE.md`'s figures
into a file, a commit message or your report, and never name their source in the page or its comments.

## Outcomes

1. **The sketch's chosen form is the page's only form.** The page renders by default what the sketch renders with
   `hours=1&type=1&shape=h&audit=1&air=b`: 20 hourly bars, the audit's fixes, `past=a`, the live bar's see-through form, no
   tick, the stronger red, the head brought down on the phone with `air=b`, Closed and Unavailable releasing the hold on the
   phone. Carry the code over and delete the turned-down branches and their switches: two-hour bars, `shape=g`, `tick`,
   `bars`, `mark` other than the kept one, `past` b and c, `air` a and c, `stamp`. `audit` and `air` stop being conditions.
   Remove `head` and `grain` too, keeping their current defaults. Keep `state`, `level`, `day`, `hour`, `today`, `now`,
   `lang`, `arrive` and `pct`. Name in the report any other switch you keep and why.
   **Proof:** before outcomes 2 and 3, render the page and the sketch at its query in `ar` and `en` at `320x568`, `390x844`,
   `768x1024` and `1440x900`, states Live at Packed, Moderate and Busy, Closed, Unavailable, Error and Loading, and show
   `pnpm verify:owner diff-folders` EQUAL or name every difference.
2. **Demo data rounded.** Every `usual` value becomes the sketch's value rounded to the nearest 5. Keep the opening hours as the
   sketch has them. Say what the rounding changed on screen, for example where the comparison or the quiet hour moved.
3. **What the user decided, in their words:**
   - The label: «مفهوم استكشافي ما يحتاج لان اصلا انا بقول لصاحب النادي وكلنا نعرف انه بس ديمو». Remove the whole concept label,
     both languages, at every size. «نحو 70 في الصالة» stays.
   - Remove the shadda from «تعذّر», «تحقّق» and «تكرّر».
   - The quiet line says only: a quiet hour left, «10 ص هادئ عادةً»; none quiet but one lighter than this hour, «12 ص أقل زحمة
     عادةً»; none lighter, the line is hidden. Never «لاحقًا» or «الآن». The sketch hard-codes the second one in `public.js`:
     move it to `public-copy.js`, with its English. The quietest hour of a whole day is named only by its circle.
   - Check these hold on the page and fix any that does not: the week starts on Sunday in both languages; every time range reads
     from the right in Arabic; `font-display: optional`; proportional figures stay; «مباشر» stands fixed under the percentage and
     does not move along its line; the hours under the bars start at the opening hour and never fall mid-bar.
4. **The page's code stays within the repository's limits:** `public.js` and `public.css` meet the code-health check
   (`pnpm check:code-health`), with no raised baseline. Split a file if needed, as `public-slide.js` was.

Do not edit `PUBLIC-SPEC.md` or the `spec/` parts: list instead, per PUB record, what no longer matches. A later round writes them.

## Keep

Everything not named here. Reduced motion, one announcement, no `requestAnimationFrame` or canvas. Tablet and computer change
only where outcome 1 or 3 says.

## Report

Your final message, under 300 words: the commit SHA on `public-redesign-r01` (commit there, do not push); the proof's result;
what the rounding changed; each switch left; the PUB records that no longer match; anything you left for the design round;
a sheet path showing Live, Closed, Unavailable and Error on the phone in both languages. Run `pnpm check:code-health` and
`pnpm check:repository` from the worktree and give their results.
