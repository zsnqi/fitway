<!-- brief-format: v1 role: builder -->
# Builder brief: the public page's specification, PUBLIC-SPEC.md and DESIGN-SPEC.md §6 (public-redesign-r01)

For a fresh `owner-direction-builder` (Opus, high). Concept-only (ADR-010). You write the specification of a built
page from what it does; you change no page file.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `27758b4e`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `.css`, `.js` and
    `public-copy.js`: the page you specify.
  - `D:/fitway-temp/public-redesign-r01-states-40/NOTES.md` and `D:/fitway-temp/public-redesign-r01-states-40/COPY.md`,
    then `D:/fitway-temp/public-redesign-r01-arabic-39/COPY.md`: how the page works, and every string.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/SETTINGS-SPEC.md` and
    `design-research/owner-composition-exploration-r04/directions/eclipse/spec/settings-1.md`: the shape a page's
    fragment takes (an index file, parts under 40,000 bytes, a table of rows with `Id`, `L`, `Entry`).
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` §"Parts" and
    `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-01-how-to-read.md`: what `L`
    means and how rows cite each other.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-11-staff-public-issues.md`
    §"6. Public": the section you replace.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"5. Public crowd instrument" and
    §"6. Public state grammar"; `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/spec/06-interfaces-and-contracts.md`,
    its public schema and capacity boundary: where the concept differs from v1's contract.

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

- `<run>` is `public-redesign-r01-spec-42`, made by the coordinator with `pnpm run-folder:new`.
- A reading-direction reviewer reads the committed `27758b4e` beside you and writes nothing in this worktree. Change
  no page file (`public.*`, `public-copy.js`, any CSS or JS): a fix round follows you and owns them.

## What to build

1. **`PUBLIC-SPEC.md`** in the Eclipse folder, with its parts in `spec/public-<n>.md`, in SETTINGS-SPEC.md's shape:
   the fragment the coordinator merges as DESIGN-SPEC.md §6. Rows `PUB-<n>` cover, as the page does them: what the
   page answers; the head (the level word, its sizes per width and per language, the facts, the comparison and Live);
   the usual day's card (bars, two-hour bars on long phone days by their busier hour, the fixed hour labels, the
   readout and its held height, today's Now and quietest hour, a picked bar's chalk outline, hover, focus, the drag
   and the keys); the day row and today's mark in each language; the six states, each with what it shows and removes
   and why it cannot read as live; every size (phone, tablet, computer, 320 and 200% zoom); the motion, with values
   (the arrival, the interactions, reduced motion); the font loading; Arabic and English, with time's direction. Each
   row cites its `file:line` evidence and the glossary or family rows it uses (GLO-, DAT-, STA-, LGT- and the like).
   Copy goes in its own part: every string in both languages, the glossary's marked apart from the page's own.
2. **"Product/Spec amendments for the move to production"**, its own section, as SETTINGS-SPEC.md's 4.5.1 does:
   where the concept goes beyond v1's public contract (the percentage, the usual day and its comparison, the count's
   wording, the concept label) and what production needs first. Name each as an amendment to propose, never as
   decided.
3. **DESIGN-SPEC.md §6**: you hold the coordinator's lease for that section only. Replace its "To come" line in
   `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-11-staff-public-issues.md` with a short paragraph pointing at `PUBLIC-SPEC.md` (as §4.5 points at
   SETTINGS-SPEC.md, if it does), and add `PUBLIC-SPEC.md` to `DESIGN-SPEC.md` §"Parts" only if the Parts list names
   other fragments; otherwise leave DESIGN-SPEC.md as it is and say so.

Write what the page does, measured where a number matters (render with `pnpm verify:owner frames --concept <the
Eclipse folder> --page public.html` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell,
port 3176, into `D:/fitway-temp/<run>/`). Where the code and the notes disagree, the code wins; list each disagreement.

Commit once at the end.

## Report

At most 30 lines: the files written and their byte sizes; the row ranges per part; the amendments listed; each
disagreement between code and notes; anything that could not be met as written; the commit SHA.
