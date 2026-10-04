<!-- brief-format: v1 role: codex -->
# Codex brief: the date picker everywhere, the sheet's date specimens, an owner's name (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-activity`, HEAD `e72e5fe`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 7, 8, 19 and 32 (32's last two bullets are this round). That file lives on another branch: read it with
  `git -C D:/Projects/fitway-worktrees/owner-r04-daily-phone show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full (the
  user's bans); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows FLD-1 to
  FLD-7, PCK-1 to PCK-10, DLG-1 to DLG-6, STA-9, EMP-2, TBL-10, and OWN-A1 to OWN-A10, by row ID. Navigate
  code with `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`; "the folder" below is
  `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- Your temp folder is `D:/fitway-temp/owner-r04-activity-followup/`. You run in the workspace-write sandbox with
  automatic approval review. `git add`, `git commit` and anything that starts child processes with piped output
  (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it: request escalation for them from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- The pages open two ways, and every outcome holds in each: `index.html` (Daily), `reports.html` (Reports),
  `activity.html` (Activity log) and `components.html` (the component sheet), each from `file://` and over HTTP, at
  1440, 1024, 768, 721, 720, 390 and 320 px, AR (`?lang=ar`, the default) and EN, with and without reduced motion.
  Phone checks run in a touch context (`hasTouch`, `isMobile`) at 390 × 844 and 320 × 568. Use port 3176 only.
- Render every baseline from your own `git archive e72e5fe` of the folder in your temp folder.

## Goal

DECISIONS item 32: the date picker (`picker.js`, `picker.css`, PCK-1…10) is the one way to choose dates on every
Owner page, the component sheet shows what the pages build, and an owner's name is one stored string.

## Causes and required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing. Where a cause names a file and line, it is the coordinator's reading: confirm it before you act on it.

- **P1. The minute-data export still asks for typed dates.** Cause: Reports' "Export minute data" dialog
  (`reports.html:315-343`, `reports.js:1835-1900`, `makeField` for `#ef-from` and `#ef-to`) keeps two typed
  day/month/year fields and their hint (FLD-2). This dialog is the minute-data export DECISIONS 32 names;
  Daily has no export of its own (TBL-10). Intent: the owner picks the export's days exactly as they pick Reports'
  custom period, with the same picker, and nothing else about exporting changes. Outcome, AR and EN, at every size
  above:
  - the dialog holds the shared picker (the same `EclipsePicker`, the same look and keyboard as Reports' custom
    period, with Reports' bounds: from the first day with readings to the last full day, at most 366 days), and no
    typed date field or date hint remains in it;
  - it opens on the period the page shows, as it does now, and its first focus stays on the primary action (DLG-3: a
    dialog that asks to confirm focuses its primary);
  - the file line always names the file the current pick would produce, a start alone being a one-day file (PCK-2),
    with DAT-4's line breaks;
  - while the file is being prepared (STA-9) the pick cannot change, so the file made is the one the dialog shows;
  - after a failure (EMP-2) the picked days stay picked; "Done" and "Save" behave as at `e72e5fe`;
  - at 720 px and below it is a bottom sheet (DLG-5); at 320 × 568 and 390 × 844 every part of it and its primary
    action can be reached with the page behind it still, the widest file name and the longest progress line
    included (B9).
- **P2. The component sheet shows typed dates.** Cause: `components.js:737-749` (the field specimens, valued
  "26/08/2026") and `components.js:755-756` (the range and working-export dialog specimens) draw typed date fields
  that no page builds after P1. Intent: every specimen draws what a page builds. Outcome: no specimen on the sheet
  shows a typed date; the field specimens show the one typed field the pages still build (Activity log's reason
  search) in the same states; the dialog specimens show the picker as Reports builds it after P1; the sheet gains the
  picker's own specimens in PCK-6's states (nothing picked, a start only, a range, today, a day that cannot be picked)
  and PCK-8's message, AR and EN, each captioned with its row IDs as the sheet's other specimens are.
- **P3. An owner's name is written once per language.** Cause: `activity.js:249` stores
  `OWNERS = { o1: { ar: "فهد", en: "Fahad" }, o2: { ar: "نورة", en: "Noura" } }`, while the read contract's
  `displayName` is one stored string (`packages/api/src/audit/list.ts`, `auditActorSchema`). Intent: the page shows
  what the log holds. Outcome: each owner account has one name, «فهد» and «نورة», shown identically on the Arabic and
  the English page wherever a name appears (Who, a record's target, the Who filter, screen-reader text), isolated so
  it never reorders the English text around it; the English page's layout at 320 px holds them without a new break.
  The reasons' free text is out of scope: leave it as it is and note in the report anything it now reads against.
- **P4. The specification follows.** Outcome: FLD-2, PCK-1, DLG-3, EMP-2 and the OWN-A rows that name owners describe
  what is built. FLD-2 points to a "§8 Q-PCK" that DESIGN-SPEC.md never had: drop that pointer and say no typed date
  field remains. INDEX.md is regenerated with the command written at its top.

## Limits the result keeps

- **L1.** Daily's frames equal `e72e5fe` at every size, AR and EN.
- **L2.** Reports' frames equal `e72e5fe` with the export dialog closed; its custom-period dialog is unchanged.
- **L3.** Activity log's frames equal `e72e5fe` apart from the owners' names on the English page. Its Who filter
  still lists the two owners and the automatic system only; the front desk appears only as the target of the PIN
  records (ADR-008: it writes no record).
- **L4.** `picker.js` and `picker.css` keep every behaviour PCK-1…10 states on both pages that use them today; if P1
  needs a change in them, both pages' pickers are rechecked.
- **L5.** `node tools/lint-spec.mjs`, `node tools/check-index.mjs` and `node tools/build-index.mjs --check` from the
  folder pass (or from the repository root as INDEX.md's header says); `node --check` passes on every `.js` and
  `.mjs` in the folder; `states-capture.mjs` reports no failures.
- **L6.** One commit on `owner-r04-activity`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

You may change, in the folder: `reports.html`, `reports.js`, `reports.css`, `picker.js`, `picker.css`,
`activity.js`, `components.js`, `components.html`, `components.css`, `style.css`, the `*capture.mjs` scripts whose
checks the outcomes change, `DESIGN-SPEC.md`, `README.md` and `INDEX.md`; commit once when done. Everything else is
read-only (`tuner.js` included). Add no dependencies. Do not redesign beyond the outcomes. If an outcome cannot be
met, do not work around it: finish and measure the others, then stop and report. (r04 B3)

## Report

Each outcome (P1-P4, L1-L6) as PASS or FAIL with the command and the output line that proves it; crops in
`D:/fitway-temp/owner-r04-activity-followup/crops/`, numbered the same in both languages: the export dialog at 1440,
768, 390 and 320 in its idle (period shown), a one-day pick, working, failed and done states; the sheet's field,
dialog and picker specimens at 1440 and 390; Activity log's English page at 1440 and 320 with both owners' records
shown; every frame that differs from `e72e5fe` and why; the files you changed; the commit SHA; anything you could not
do; anything an outcome or decision produces that reads wrong, with the decision named.
