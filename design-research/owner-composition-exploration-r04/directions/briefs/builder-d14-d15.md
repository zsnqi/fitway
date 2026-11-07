<!-- brief-format: v1 role: builder -->
# Builder brief: decisions 14 (two error sentences) and 15 (no concept label) (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). Both decisions are made; build exactly them.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `e6db2e4`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 3, 7, 11, 12, 14, 15.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows GLO-15, CHP-2, CHP-9,
  HDR-3, HDR-4, HDR-6, OWN-R2, K-02, K-10 by row ID. Navigate code with
  `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write frames only in `D:/fitway-temp/owner-r04-d14-15/`. A local server uses port 3177 only; 3176 is in use by
  another agent that reads, never writes, this worktree's history. (r04 G5)

## Causes and required outcomes

- **R1 (item 14).** `paintError` in `reports.js` always writes the period as two dates, «من … إلى …», so a one-day
  period names its date twice and a period inside one month names the month twice. Outcome, in what the page shows
  and in what it announces:
  - one day: «تعذّر تحميل قراءات 22 سبتمبر 2026» / "Couldn't load readings for 22 Sep 2026";
  - inside one month: «تعذّر تحميل القراءات من 16 إلى 22 سبتمبر 2026» / "Couldn't load readings from 16 to 22 Sep 2026";
  - across months of one year, and across two years: unchanged from `e6db2e4`.

  The sentence stays words-first with no dash (DO-NOT.md; decision 11). Open the cases with `?state=error` plus
  `&from=2026-09-22&to=2026-09-22`, `&from=2026-09-16&to=2026-09-22`, and no period (the default 28 days). The
  two-year form cannot be opened (the history starts in August 2026); keep its code path as it is.
- **R2 (item 15).** The concept label «مفهوم استكشافي · بيانات افتراضية» / "Exploration concept · synthetic data" is
  drawn in the header of Daily (`index.html`) and Reports (`reports.html`) and in the component sheet's header
  specimens and its own GLO-15 specimen (`components.js`). Outcome: no Eclipse screen shows it, at any width, in
  either language, in any state, and the component sheet has no specimen of it. Nothing is left where it stood: no
  empty row or gap in the phone header, none under the status at 721-1023 px. At 1024 EN, Daily's header has the
  status alone on the title's line, as 1024 AR has it today (decision 15). Every script that measured the label
  (`states-capture.mjs` and any other capture script) still runs. The pages' `<meta name="description">` and
  document titles stay: they take no room on the page.

Required unchanged: every frame of Daily (every state its capture covers), Reports (no `?state=`, and every state) and
`components.html` equals `e6db2e4`, except where R1 and R2 change it, at 1440, 1024, 768, 390 and 320, AR and EN.
Render the baseline from your own copy of `e6db2e4` in your temp folder (`git archive`). List every frame that differs
and why.

Do not change Daily's reserved status width (`renderReserve` in `app.js`). Its comment gives the label as the reason it
follows the last reading's time instead of the day's widest time; measure and report whether a slot held at 10:00 PM
would now keep Daily's 1024 EN header on one line.

Update the DESIGN-SPEC rows named above, and any other row or `README.md` line that names the label, to what is built
(GLO-15 removed by decision 15; K-02 gains the two sentence forms). Regenerate INDEX.md with the command written at its
top.

## Frames

Render with the repository's `@playwright/test`, over HTTP from port 3177 and from `file://`, at 1440, 1024, 768,
390 and 320, AR and EN. Save one first-screen PNG per frame at device scale 2 as
`D:/fitway-temp/owner-r04-d14-15/frames/<daily|reports|components>/<NN-state>-<width>-<ar|en>.png` (the component
sheet as a full page), and Reports' error state for the three periods as `…/reports/07-error-<1d|month|28d>-<width>-<ar|en>.png`.
Crop the header at 1024 and 768 and at 390, AR and EN, on Daily and Reports, before and after, into
`D:/fitway-temp/owner-r04-d14-15/crops/`. Inspect every frame yourself before reporting; a passing check is not a
looked-at frame. (AGENTS.md)

## Scope

You may change, in `design-research/owner-composition-exploration-r04/directions/eclipse/`: `reports.js`, `app.js`,
`components.js`, `index.html`, `reports.html`, `components.html`, `style.css`, `reports.css`, `components.css`, the
`*capture.mjs` scripts that read the label, `DESIGN-SPEC.md`, `README.md` and `INDEX.md`; commit once when done. Do not
redesign beyond the decisions; report anything that seems to need it. (CLAUDE.md)

## Report

R1 and R2 each PASS or FAIL with evidence; the 10:00 PM measurement; the frame and crop folders; every frame that
differs from `e6db2e4` and why; the files you changed; the commit SHA; anything you could not do. At most 40 lines.
