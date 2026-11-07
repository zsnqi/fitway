<!-- brief-format: v1 role: designer -->
# Designer brief: the CSS round review's two taste findings (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). This is concept-only work (ADR-009). The independent review of
the CSS round found two things that read wrong. Both are yours to judge and fix. Everything else in the round stays.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `767cd57c`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 41 and 42, and "How this milestone's rounds run" items 7 and 10; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  - `design-research/owner-composition-exploration-r04/directions/briefs/designer-pressed-state.md` §"Hard limits";
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows MOT-1, MOT-11, MOT-20,
    STA-16, TYP-3 and TYP-6.

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
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other design or taste skill.
- Frames, notes and scratch go under `D:/fitway-temp/owner-r04-css-taste/`. Ports 3176-3177 are free; 3174 is the
  user's live preview, leave it running. Keep a short `NOTES.md` there and commit when done (item 10).

## What reads wrong

1. **The held chalk key wears a ring.** Held, the light (chalk) keys show a grey rim about 2 px wide around the face,
   which reads like a focus ring or an outline around the key rather than the key seating. See
   `D:/fitway-temp/owner-r04-css-review/crop-chalk-held.png` (rest on the left, held on the right) and
   `sheet-v11-keys.png` beside it. Outcome: a held chalk key reads as pressed and still live: never as off (the
   previous pass fixed that), and never as ringed or outlined.
2. **Two text sizes side by side in Activity's tools.** The search field's value is now 16 px (item 41, so an iPhone
   does not zoom), while the filter faces beside it stay 13.5 px. On the phone the search sits on its own line
   (`D:/fitway-temp/owner-r04-css-review/v17-pair-activity-find-ar-390.png`). Judge it wherever they share a row or
   sit close: the computer, the tablet and the phone, in both languages. Outcome: the row reads as one set of
   controls. A field's own text stays at least 16 px.

## Limits

- The press's limits all hold (`designer-pressed-state.md` §"Hard limits"): at once on press, no glyph fades, no
  movement under reduced motion or `?motion=off`, nothing else moves, disabled controls show none.
- The release fade stays (item 42).
- Every frame at rest equals `767cd57c`, except where your fix to item 2 needs a change. Name each one.
- In forced colours, held keys keep their edge and readable labels.

## Files

Write only in `design-research/owner-composition-exploration-r04/directions/eclipse/`: the pages' `.css` (not
`tuner.js`); in `DESIGN-SPEC.md` the rows your fix changes (STA-16, TYP-3, a component row); `INDEX.md`, regenerated
with the command at its top.

## Frames

Judge at 1440 × 900 and 390 × 844 in Arabic, with a held mouse (headless Chromium does not show `:active` under an
emulated touch). Hand over, numbered the same in both languages:
- each chalk key kind at rest and held;
- Activity's tools row at 1440, 768 and 390 in Arabic and English, with an empty search field and with a long value.

## Report

- Items 1 and 2: what you changed and why it fits the instrument, with frame names.
- Every rest frame that changed.
- Anything else that reads or feels wrong, with the rule named.
- The output folder, the files you changed, and the commit SHA.

At most 30 lines.
