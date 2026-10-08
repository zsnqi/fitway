<!-- brief-format: v1 role: designer -->
# Designer brief: the environment page (agent-environment-r03)

For a fresh `owner-direction-designer` (Opus, xhigh). This is not an Owner page and not a set of options: this
brief replaces the Owner-specific parts of your definition. You design and build one page; the coordinator
reviews your frames and publishes it as a private claude.ai artifact.

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `21765ce4`
- **Writes:** none in the repository; only in the run folder named below.
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md`
  items 12-18.
- **Read first, only these:** the facts file
  `D:/fitway-temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/06eea6dd-7c5b-44ad-b20d-f63072729f39/scratchpad/env-facts/FACTS.md`
  (every fact and number on the page comes from it); the user's request, step 4 of
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/r03/agent-environment-r03-resume.md`
  §"Next steps".

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

- Run `pnpm check:design-context` first. Load the `artifact-design` and `artifact-diagramming` skills before you
  write the page (the page contract: title, colour tokens with light and dark, phone width, allowed script hosts),
  and `ux-araby` for the Arabic. Impeccable is the one design skill; load no other design or taste skill. (AGENTS.md)
- Your run folder is `D:/fitway-temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/06eea6dd-7c5b-44ad-b20d-f63072729f39/scratchpad/env-page/`;
  write nowhere else. Open the page as a file with Playwright; start no server and use no port.

## The open question

The user wants to understand the environment the agents work in, and to see it, not read about it: what each part
is and how the parts connect, what the cleanup changed, how a round travels from brief to `main`, what the gardener
does, and how far each rule is trusted. The user reads Arabic and opens the page on a computer and on a phone.

## Constraints

- The five sections the user approved, in the resume file's step 4, in that order: the map whose parts open on a
  click; before and after in numbers; one round animated from brief to `main` with the real round 5 to 5c example;
  the gardener, what it checks and never touches; the trust ladder with where each part of FITWAY sits.
- Arabic written to ASD-STE100 at about 80%: short sentences, one idea in each, active voice, one word for one
  thing. CI, Codex, commit, branch, skill, Haiku, Sonnet, Opus and other technical names stay in English.
- Diagrams, animation and examples, not text alone. Motion respects reduced-motion settings.
- Only facts from the facts file. Where it says a fact is not confirmed, say so on the page or leave it out.
- Right-to-left page; isolate Latin names and numbers so they keep their order, and check each range rendered.

## Deliverable

One self-contained HTML file, `index.html`, in your run folder. Look at it rendered: on a computer (1440), a tablet
(768) and a phone (390, and 320 checked), in light and dark, and at the animation's key steps. Save the frames in a
folder named frames beside it.

## Report

What each section shows, with its frame paths; any fact you left out and why; any rule or request that made
something read wrong (WORKING_AGREEMENTS "Rules and findings"). At most 40 lines.
