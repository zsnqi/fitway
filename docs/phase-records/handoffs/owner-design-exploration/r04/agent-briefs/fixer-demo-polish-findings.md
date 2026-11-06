<!-- brief-format: v1 role: builder -->
# Fixer brief: the six-page check's findings (owner-design-exploration-r04)

For a fresh `owner-direction-fixer` (Sonnet, high). Every change below is frozen; make no other.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `bac01253`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** in `design-research/owner-composition-exploration-r04/directions/eclipse/`, `reports.js` lines 1464-1490, `gym.js` lines 13-36 and 60-88, `access.js` lines 60-75, `activity.js` lines 68-80 and 305-315, `shared-frame.js` lines 10-25; then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the folder's absolute path and port 3176; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-polish-fix/`.
- This repository is public. Never read a sketch folder's state file.

## The changes

1. **The export's band follows the row's own record.** `reports.js` line 1485 prints `BAND[levelOf(c)]`, so after the owner saves a new capacity or limits a past row reads, for example, `value,31,2,0,quiet,120,5,live`: 31 of 120 at 25% is Moderate. Each row's band comes from the capacity and limits recorded for that row (`GYM.RECORDED`; the limits have stood since version 1, `gym.js` line 63), the way `capacity_snapshot` already does. Change the comment at lines 1467-1468 to say so. With nothing saved the file is byte-for-byte as at `bac01253`.
2. **One shape in the log.** Every log entry is a verbal noun («تعطيل حساب نورة»), but the password entry is a sentence. In `access.js` line 70 and `activity.js` line 75 «عُيّنت كلمة مرور لـ${n}» becomes «تعيين كلمة مرور لـ${n}», keeping how the name is isolated. The done line at `access.js` line 180 stays as it is. English is unchanged.
3. **One word for the gym.** The pages call it «الصالة»; the meta description at `shared-frame.js` line 18 says «ازدحام النادي الآن وعلى مدار الأيام.». It becomes «ازدحام الصالة الآن وعلى مدار الأيام.», wherever that sentence is set. English is unchanged.
4. **No "sample" on screen.** `activity.js` line 311 «هذا السجل غير موجود في هذه العينة.» / "This record isn't in this sample." becomes «هذا السجل غير متاح.» / "This record isn't available.", with its style and placement unchanged.

Spec rows in the concept's `DESIGN-SPEC.md`, its parts, or `SETTINGS-SPEC.md` that quote a changed string or say the export's band follows the saved levels say the new form; regenerate `INDEX.md` as its header says.

## Limits

- Nothing else changes: no layout, no other word, no number. `pnpm verify:owner compare` against `bac01253` on `index`, `reports`, `activity`, `access` and `settings` at 390x844 and 1440x900, ar and en, shows differences only where the four changes are.
- `pnpm check:code-health` passes with no raised baseline; `access.js`, `activity.js` and `reports.js` must not grow in code lines.
- Commit once on this branch; do not push. CI runs the ladder.

## Check and report

From your own runs: the export after saving capacity 150 and limits 20/40/55, counting rows whose band disagrees with `capacity_snapshot` and the recorded limits (expect 0), and the same with nothing saved against `bac01253` (byte-equal); the log line, meta and missing-record text as rendered in ar and en, with one frame each; the compare result. Plant one defect to show your export count can fail. Final message, at most 20 lines: the commit, each change with its measure and frame path, the spec rows changed by id, anything you could not do.
