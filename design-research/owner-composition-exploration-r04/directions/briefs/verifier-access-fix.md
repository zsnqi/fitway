<!-- brief-format: v1 role: verifier -->
# Verifier brief: Access's fix round (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementers'
reports or rationale before recording your own result, and never edit what you verify. (CLAUDE.md) This review
covers reading direction too; there is no separate reading-direction review for this round.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `4637c53`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 11, 12, 32, 33 and 34 (where they differ, the later bullet wins), and "How this milestone's rounds run"
  item 7; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full.
  - The three briefs the round answered, in `design-research/owner-composition-exploration-r04/directions/briefs/`:
    `designer-access-fix.md`, `codex-access-fix.md`, `builder-access-code.md`. Their outcomes and hard limits are
    your baseline.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` §4.4 and the §3 rows it
    names; navigate code with `INDEX.md` in the same folder.
  - The agreed skeleton `D:/fitway-temp/owner-r04-access-skeleton/skeleton-1-1440-ar.png` and the first build's review
    `D:/fitway-temp/owner-r04-access-review/REPORT.md` (what this round set out to fix).
  - `D:/fitway-grader/owner-r04/access-fix-heldout.md`: held-out rows H1-H8 for the Codex part. Grade each.

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

- Write only in `D:/fitway-temp/owner-r04-access-fix-review/`; the coordinator checks `git status` in every worktree
  afterwards. (r04 G5) A local server uses port 3178 only. Render with the worktree's `@playwright/test`; do not
  reuse the implementers' crops as evidence, take your own.

## What was delivered

`78e0bdf..4637c53` (the brief commits excluded): `a0c6c76` the designer (the computer's arrangement, the typed code,
the two-step change, the removal box, rows that stay put); `376c845` Codex (wording, behaviour, arrival by record id
in Activity log, the rail and bar links, §4.4); `4637c53` the builder (the code's monospace face, the copy control
beside it on the computer, the code's case, a double-tap guard, INDEX).

**Already known; do not report as findings:** the published concept lacks `tuner.js`; the Impeccable detector's halo
and stripe flags come from the shared sheets; Activity log's four layout-shift readings under 0.001 at the base.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | Privacy: never shown in any state, DOM, URL, storage or screen-reader text: a code after its one view, a password after its dialog closes, a hash, a session token or list, a staff email; no visitor data; the font and every request stay on the origin | code, DOM, storage, network after each flow |
| V2 | DECISIONS 34 in full, including its last bullets: the agreed arrangement, the typed code (8-16, letters and digits, case kept), the one-time view with copy and «إلغاء التغيير», the two-step change, the optional reason, «يُسجَّل خروج», the removal box at every size, the monospace face, the copy control's place | frames and code per item |
| V3 | Every outcome in the three briefs met, or its gap named | per outcome |
| V4 | Activity log: arrival by record id (known, unknown, after loading), and Access's card and done links land on the record they name; Activity log without `record=` unchanged | frames, focus log |
| V5 | A double tap on «متابعة» never commits a code; a deliberate tap on «حفظتُ الرمز» shows Working at once | touch at 390 and 320, mouse at 1440 |
| V6 | No sideways scroll at 1440, 1024, 768, 721, 390, 360, 320 and 200% zoom, AR and EN, with the longest name, email and code | `scrollWidth` |
| V7 | Every target at least 44 x 44 at every size | measured boxes |
| V8 | Keyboard: Tab order, visible focus everywhere it lands, initial focus in each dialog, focus after done and refusal | key-by-key log |
| V9 | Reading direction: Arabic reads natively right to left and English left to right; Latin codes, emails and names read right in each | frames, measured edges |
| V10 | Wording: natural Arabic and English, DO-NOT and items 11-12 kept; the two pages name each action alike | rendered text |
| V11 | Motion (item 4): complete at first paint; only a dialog's own open and close move | first-paint frame, code |
| V12 | Daily and Reports unchanged apart from the Access link | pixel comparison against `78e0bdf` |
| V13 | Works from `file://` and over HTTP | frames from both |
| V14 | Each changed element read as a whole on the page, at 1440 as much as on the phone, against the skeleton | frames, your judgement |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; H1-H8 each PASS or FAIL with one line; for each
FAIL a hypothesis with `file:line` and a severity (high, medium, low); what you could not run and why; anything that
reads or behaves wrong though it passes its check, with the rule named as the suspect (WORKING_AGREEMENTS "Rules and
findings"); the evidence folder. At most 50 lines.
