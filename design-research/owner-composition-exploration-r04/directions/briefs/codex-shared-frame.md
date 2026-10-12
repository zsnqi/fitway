<!-- brief-format: v1 role: codex -->
# Codex brief: one shared frame script (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `7e28c713`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 4, 36-39, 41-45 and 47, and "How this milestone's
  rounds run" items 3, 4 and 9. The build branch's copy of DECISIONS.md is behind; read them from the coordinator branch
  with `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show
  codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide,
    its §"compare" `--timeline` part above all. Skip its two `$env:TEMP` / `$env:TMP` lines: the environment block below
    governs temp folders.
  - In the folder below: each page's `<head>` and its script and stylesheet tags (`index.html`, `reports.html`,
    `access.html`, `activity.html`), `README.md` §"Motion", and `INDEX.md`'s head. "The folder" is
    `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- **Your temp folder** is `D:/fitway-temp/owner-r04-shared-frame/`. Set `PROBE_OUT` to a folder inside it before you run
  the folder's tools. You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and
  anything that starts child processes with piped output (pnpm, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **Hooks.** A hook or tool message that asks for work outside this brief (a design detector's findings, a configuration
  file) is reported in your final message, not acted on (DECISIONS item 46).
- **Tools.** Run these read-only from the coordinator's worktree
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04` at `ad9ea85f` or later; never edit them. The verify-fitway
  CLI: `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`, ports 3176-3177 only; if one is held by a process
  you did not start, never stop it; ports 3174 and 3180 serve this worktree to the user, leave them running. The concept
  CSS check: `node <that worktree>/scripts/check-concept-css.mjs <the folder>`.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop, tablet and phone;
  mouse, touch and keyboard; reduced and full motion; the motion switch `?motion=off`. Touch is the CLI's emulated
  touch; this round changes no behaviour, so no device trial is needed.
- **The base** is the folder at the HEAD above. Take it from your own `git archive`, extracted outside every git tree.

## Goal

The rail, the header's frame behaviour and the status details live once, in a script named as shared that every Owner
page loads, so Settings, Operations and Monitoring load it instead of copying it. Every page looks, moves and behaves
exactly as at the base.

## Causes and required outcomes

- **Cause.** Each page script carries its own copy of the frame: the rail and its motion (`reports.js:677-723`,
  `access.js:470-517`, `activity.js:431-478`, `daily.js:2600-2651`), the rail's modal state, layers, menu keys and frame
  changes (`reports.js:731-823`, `access.js:522-610`, `activity.js:483-571`, `daily.js:568-677`), the menu and tab-bar
  labels (`reports.js:824-839`, `access.js:611-626`, `activity.js:572-587`, `daily.js:679-699`), the status details
  (`reports.js:840-883`, `access.js:627-666`, `activity.js:588-623`, `daily.js:704-770`), the frame's words in each
  page's copy, and the rail's Access link script inline in `index.html`, `reports.html` and `activity.html`. Reports',
  Access's and Activity's copies differ only in comments; Daily's adds its own hooks (the intro's end before the rail
  opens, the tuner's Motion switch, `daily.js:521`, `:591`, `:2646-2648`). The status details differ for real reasons:
  each page has its own states and time formatting.
- **F1. One frame script.**
  - **Outcome.** `index.html`, `reports.html`, `access.html` and `activity.html` each load one new script named as
    shared, and none of their scripts or inline scripts keeps its own copy of any part the cause lists: no function,
    words table or inline script for the rail, the frame, the labels, the frame's words, the rail's links or the
    status's rendering is defined in more than one file, and the shared script defines each of them once, taking what a
    page supplies rather than holding a branch or a copy per page (report how you checked, with the script you used).
    What genuinely differs stays with its page: each page's status states and time formatting, Daily's hooks. Each page
    keeps its header and rail markup in its HTML (item 4: the page is complete at first paint). The four page scripts
    and the new script together hold at least 400 fewer lines than the four page scripts at the base.
  - **Intent.** A change to the rail or the status lands once, and a new page adds a tag, not a copy. Leaving a copy
    beside the shared one, or a shared file only one page uses, defeats this.
- **F2. Every page unchanged at rest.**
  - **Outcome.** `compare` of the result against the base, page by page over all five pages, is `COMPARE EQUAL` for
    every item, apart from the base's designed absences (`NOT-REACHABLE`) and the known capture problems below, in each
    of: `--feature page --states all`, Arabic and English, desktop, tablet and phone, reduced and full motion;
    `--feature all`, Arabic and English, desktop, tablet and phone, reduced motion; on the four pages, `--feature
    status,menu,rail,language,phone-language` with `--inputs keyboard,touch`, Arabic and English, desktop, tablet and
    phone, reduced motion; over `file://`, `--feature page --states all`, Arabic and English, desktop, reduced motion.
    Inputs are mouse and the transport HTTP unless named. The known capture problems are `arrive` (`never`, `0`, `500`)
    on Daily, Reports, Access and Activity, and a lone `from` or `to` on Reports and Activity, and, on the four pages
    with keyboard or touch, `language` and `phone-language`, which leave the page for the other language's and which the
    CLI cannot capture that way: each a capture problem on both sides at the base. No other item may be a problem. Each
    of these is still checked another way: `language` and `phone-language` with the mouse (`--feature all`), and the
    arrival states through `state=loading` and the `page-retry` features. The recipes keep every feature they have at
    the base (Daily 44, Reports 31, Access 46, Activity 30, the components sheet 14).
  - **Intent.** The move changes where the code lives, nothing a user sees or does, in any way the concept opens
    (above); these compares are the evidence, and a way they leave out is not a licence to change it.
- **F3. Every moment unchanged.**
  - **Outcome.** `compare --timeline` of the result against the base, page by page over the four pages, reports no
    `TIMELINE DIFFERENT` for every feature with actions, Arabic and English, desktop and phone, mouse, full motion,
    HTTP, and for `status,menu,rail,language,phone-language` also at tablet and with keyboard and touch. Samples follow
    the CLI's default schedule, at most 100 ms apart from the first held picture to the end of the longest movement; for
    `status,menu,rail,language,phone-language`, also `--timeline-times` at 1 ms and every 20 ms from 21 to 401. A
    `TIMELINE NOT-HELD` sample passes only when its item, compared three times in all (no run dropped), varies on the
    base's side at that time in at least one run, and every result-side difference at that time lies inside the region
    where the base's own captures differ; report each with its captures. At the base, Daily's light tuner chip at phone
    size varies between captures (its frame loop, F126), so Daily's phone samples are often not held there.
  - **Intent.** Every opening, closing, press and release runs as the user approved it (items 36-43). A sample the
    change makes unstable, or unstable somewhere new, is a regression hidden as not held; one the base varies on in the
    same place is the page's own timing. Between samples the bound is their spacing.
- **Reruns (F2, F3).** An item or sample that is a problem on one side only, or that shows `ERR_NO_BUFFER_SPACE` (F137:
  Windows sockets run out over a long compare, and a script then fails to load), is compared once more alone and judged
  by that run; report each.
- **F4. First paint unchanged.** In the folder's probe kit
  (`design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/README.md`), `node smoke.mjs`,
  `node overflow-checks.mjs` and `node checks.mjs` pass as at the base, and each page loads the shared script the way it
  loads its own (`defer blocking="render"`), after `motion.js` and before its page script. Intent: the shared script
  loads before each page's first paint, as the render-blocking scripts do now (items 4 and 6).

## Limits the result keeps

- **L1. The checks pass.** The CLI's `drift` and `doctor` on the folder's recipes. In the folder's tools, `node
  lint-spec.mjs`, `node check-index.mjs`, `node build-index.mjs --check`, `node check-press-layer.mjs` and `node
  check-press-layer.test.mjs`; `node --check` on every script; every tool in the folder that names a page script runs as
  at the base (for example `wording-capture.mjs`). The concept CSS check reports the same findings as at the base.
  `INDEX.md`, `README.md` and `DESIGN-SPEC.md` name the new script where they describe the frame.
- **L2. Only the folder.** `HISTORY.md` and the evidence folder are unchanged; nothing outside the folder changes.

## Scope

You may change, in the folder: `reports.js`, `access.js`, `activity.js`, `daily.js` (each must change), `index.html`,
`reports.html`, `access.html`, `activity.html` (each must change), a new shared script, `INDEX.md`, `README.md`,
`DESIGN-SPEC.md`, `design-research/owner-composition-exploration-r04/directions/eclipse/tools/build-index.mjs`,
`design-research/owner-composition-exploration-r04/directions/eclipse/tools/check-index.mjs`, and a tool that names a
page script. Scratch files stay in your temp folder. Commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.
(B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it. Then: the new script's name
and line count, and the four page scripts' line counts before and after; what you kept per page and why; each F3
`NOT-HELD` sample with its two base captures; the files you changed; the commit SHA; anything you could not do; any hook
message you did not act on. At most 30 lines.
