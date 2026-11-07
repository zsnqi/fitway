<!-- brief-format: v1 role: designer -->
# Designer brief: Access on a computer, the arrangement as a skeleton first (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009). A light step before Access's fix
round: the user wants to see the arrangement you propose for the computer in plain blocks before anything is built.
No page is changed in this step.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `6ec9591`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only: write nothing in the worktree.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 7, 33 and 34, read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; the
  built page `design-research/owner-composition-exploration-r04/directions/eclipse/access.html` (with `access.css`,
  `access.js`) rendered at 1440 and 1024; `D:/fitway-temp/owner-r04-access-review/s-rest-1440.png`.

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

- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other design or taste skill.
  A local server uses port 3176 only. Everything you make goes under `D:/fitway-temp/owner-r04-access-skeleton/`.

## The question

On a computer (1024 px and up) Access's first build stretches each card across the content: a person's name sits at
one edge and its actions about 1000 px away, and half the screen stays empty below two short cards. The removal
buttons without a box («تعطيل الرمز», «تعطيل الحساب») read oddly there, though the user likes them on the phone.
What must hold: a person and their actions read as one; the page does not look empty or unfinished; it stays in
Eclipse's frame (item 7); the phone stays as it is. The content changes with item 34: the front-desk code may be
generated or typed by the owner, with a copy control in its one-time view, and the reason is optional.

Propose the arrangement you would build, as a simple skeleton: plain blocks with short labels, no colour work, no
finished components. One proposal you stand behind; a second only if it is genuinely different and you cannot
choose between them. Say in plain words what each block is and why the arrangement answers the question.

## Output

One small HTML file, `D:/fitway-temp/owner-r04-access-skeleton/skeleton.html`, self-contained (inline CSS, no
external requests), showing each proposal at 1440 and at 1024 in Arabic, numbered (1, 2), with one line of plain
caption each; and PNGs of it in the same folder. Inspect your own frames.

## Report

Each proposal in at most five plain lines: what sits where and why. What you would still decide during the build.
At most 25 lines.
