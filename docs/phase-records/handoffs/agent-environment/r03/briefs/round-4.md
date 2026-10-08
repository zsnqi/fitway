<!-- brief-format: v1 role: codex -->
# Codex brief: one verification path for the Owner concept (agent-environment-r03, round 4)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `82c34b0e`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 13, 15; `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 40.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md` §"Tools": the rows this round closes.
  - `docs/phase-records/handoffs/agent-environment/DECISIONS.md:78-85`: where the skill, the CLI and the map live.
  - `C:/Users/Pc Force/.agents/skills/create-verification-skill/SKILL.md`: the method this round follows (pstack, MIT, user-level).
  - `D:/fitway-temp/verification-discussion-20261007/REPORT-4-concept-capture.md`: how the concept is served, captured and measured today, and where its switches live.
  - The concept, read only: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse`, its README.md §"Open and capture" and §"States and how to open it", DESIGN-SPEC.md §"1.11 Breakpoints and navigation", and tools/probes/README.md.
  - `C:/Users/Pc Force/.agents/skills/ui-forensics/SKILL.md`: the measuring tools.
  - `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md:448-452`: the verifier rules G1-G4.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- Ports: 3174 is the user's own preview and 3178-3179 belong to reviewers; either may be running during your round
  and is never yours to stop. Use 3176-3177.

## Goal

An agent that verifies the Owner concept, Claude or Codex, uses one maintained path: a verify-fitway skill that both
tools read, the CLI inside it, a feature map generated from the concept, and a preview that never serves a stale
file. Nobody writes their own server, browser launch or capture loop for a round again.

## Causes and required outcomes

The verification tools were rebuilt every round: 774 round scripts in 57 temp folders, about 45 copies of a server,
about ten ways of importing Playwright, and the same Arabic/English by 390/768/1440 loops written by hand; the
concept's probe kit and the user's ui-forensics skill were adopted by no later round (`docs/phase-records/handoffs/agent-environment/r03/AUDIT.md`
§"What the evidence says"; REPORT-4 §2). The concept's switches and states are spread over its README, spec, capture
headers and page scripts, and briefs went stale against the code: the build's `e74ca061` removed `?done=0` and
`?row=0` (REPORT-4 §4). The user's preview is Python's http.server, which sends no `Cache-Control`, and a stale
reports.js threw after a build until a hard reload (`docs/phase-records/handoffs/owner-design-exploration/r04/owner-design-exploration-r04-resume.md`
§"Known risks"). Nothing in the repository yet does any of what follows, so every outcome below is new; the ladder,
check:repository and Biome pass on the baseline.

- **V1. The skill.** Outcome: a verify-fitway skill whose SKILL.md has frontmatter (`name`, `description`) and the
  sections of create-verification-skill §2 (Launch, Doctor, Drive, Evidence, Cleanup, Helpers), each grounded in this
  repository and the concept, with no placeholder left, in at most 200 lines; detail lives in the map and the CLI's
  help. A second SKILL.md for Claude only points to it: no line of 40 or more characters appears in both. The
  verifier rules G1-G4 are stated once, in the skill (the coordinator replaces them in the Owner DECISIONS with a
  pointer after this round). Intent: an agent that has never seen the concept reads one short file and can launch,
  check and drive any mapped feature without writing a script.
- **V2. The CLI.** Outcome: one CLI inside the skill's folder, invoked as the skill shows, reaches any feature of the
  map the way a user does (a URL switch where the code has one; otherwise the click, tap or key a user uses) in
  each state its switches open (each value of each switch; combinations only when asked), in Arabic (RTL) and
  English (LTR), at every size DESIGN-SPEC.md §1.11 names (1440x900, 1024, 768x1024, 390x844, 320, and 200% zoom at
  1440, which BRK-10 gives the phone frame), with a mouse and with touch (a coarse pointer with touch events, as on
  the user's phone), with reduced motion and with full motion, and over HTTP and `file://`. Each run writes its evidence and a manifest naming every item's feature, state, language, size,
  input, motion and transport. What the probe kit and ui-forensics already measure (overflow, geometry,
  accessibility snapshots, focus order, motion traces, contact sheets, pixel diffs) is called, not copied, and the
  concept folder is an input, so the CLI runs against the build without copying anything from it. Intent: a
  verifier's round script becomes a few CLI calls; a missing check is added to the CLI once, for every later round.
- **V3. The feature map.** Outcome: one command generates, from a concept folder's code and spec, a map of every
  page and every feature a user reaches on it (dialogs, sheets, popovers, menus, the tuner): for each, the URL
  switches the code reads and the values it handles, the page's readiness signal, how a user reaches the feature,
  how the CLI drives it, and what end state proves it works (create-verification-skill §3's four questions). A
  drift check fails, naming the page, switch, feature or selector and its source line, when the code reads a switch
  the map lacks, or the map names a page, switch, feature or selector the code no longer has. The map's committed
  copy belongs beside the concept, on the branch that changes the concept (DECISIONS item 15: nothing from the build
  enters main), and the CLI takes the map's location as an input that defaults to that copy: this round writes the
  build's map into its evidence folder, runs the drift check there and drives the build with it (V7), and the
  coordinator commits it on the build branch. The fast ladder runs the drift check on every map committed in the
  tree (main has none yet, so the step finds none there and passes). Intent: the map tells the truth about the code
  beside it, so a dropped switch is caught by a check before a brief names it.
- **V4. The preview.** Outcome: one command in the skill serves a concept folder so that every response (pages,
  scripts, styles, fonts, images, JSON, a 404, a HEAD request, a URL with a query string) carries
  `Cache-Control: no-store`; it binds the loopback address unless asked for the LAN (the user's phones use port
  3180), never serves a file outside the folder, takes its port as an argument, fails at once with one line naming
  a busy port, and leaves nothing listening after it stops. Intent: after an edit, a plain reload never runs an
  older script; the coordinator then points the user's machine-local launch configuration at it instead of Python.
- **V5. Doctor and cleanup.** Outcome: the doctor is read-only and exits non-zero, naming the cause and its fix,
  when Playwright's Chromium is missing, ui-forensics is missing (the user's machine-level skill, absent in cloud
  sessions), Python or the image tools' packages are missing (only for the tools that need them), the concept folder
  lacks the probe kit, the map it is given is missing or stale, or the CLI's port is held by a process it did not
  start. Cleanup stops only what the CLI started, never by process name, also after a run that failed or was
  interrupted; the evidence survives it at the location the skill names. Intent: an agent runs the doctor first whenever anything looks off,
  and no run strands a server or a browser or touches the user's preview.
- **V6. Evidence outside the repository.** Outcome: before writing anything, the CLI refuses an output folder inside
  any git working tree (this one, the build's, any linked worktree, also when reached through a junction or link);
  by default it writes to a fresh folder under `D:/fitway-temp/`; and its runs leave `git status --short` unchanged
  in this worktree and in the build's. Intent: evidence never dirties a tree or reaches a commit.
- **V7. Proven end to end, from both shells.** Outcome: following only the skill, you run launch, doctor, one mapped
  feature in both languages at the three designed sizes with a mouse and with touch, then cleanup, against the
  build's concept folder, from PowerShell and from Git Bash (whose path conversion rewrites arguments that start with
  `/`), each from a working directory outside any repository; the two runs' manifests agree on every item, and the
  evidence still exists after cleanup. Intent: the skill is a deliverable, not a draft (create-verification-skill
  §4), and neither the shell nor the folder an agent happens to be in changes anything.
- **V8. Tested.** Outcome: unit tests for the CLI's parts that need no browser (map generation on a small fixture
  concept, the drift check with a planted mismatch each way, the output-folder refusal, the preview's header on each
  response type and its refusal of a path outside the folder) run in the fast ladder, and `node scripts/verify.mjs fast`
  passes on your committed, clean tree. Intent: CI keeps the paved path from rotting.

## Scope

You may create `.agents/` (new), `.agents/skills/` (new), `.agents/skills/verify-fitway/` (new) and
`.claude/skills/verify-fitway/` (new), and change `scripts/verify.mjs`, the `scripts` block of package.json,
vitest.config.ts and biome.json; commit once when done. `.claude/` is in the local git exclude: add the new file
there with `git add -f`. Everything else is read-only, including the concept folder and the rest of the build
worktree, the ui-forensics and create-verification-skill folders, AGENTS.md, CLAUDE.md, `docs/`, the ledger, the
packets, `apps/`, `packages/` and `edge/`. Add no dependencies. If an outcome cannot be met, do not work around it:
finish and measure the others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the CLI's commands as its help
prints them; the map's regenerate and drift-check commands and the drift check's result on the build; the evidence
folder of the end-to-end runs; what in create-verification-skill did not fit this repository and what you did
instead; the files you changed; the commit SHA; anything you could not do.
