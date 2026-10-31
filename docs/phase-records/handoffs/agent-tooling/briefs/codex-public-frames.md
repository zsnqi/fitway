<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: the verification CLI renders and lays out the frames a public designer brief asks for (agent-tooling-r01, round public-frames)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-public-frames`, branch `tooling-public-frames`, HEAD `b7487053`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 16
  and 23.
- **Read first, only these:**
  - `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketch-25.md:105-128`: what the last public
    designer brief asked to render, and the sheets it asked for.
  - `.agents/skills/verify-fitway/map.mjs:300-330` and `:378-389`: the page readiness signal and the size table.
  - `.agents/skills/verify-fitway/drive-plan.mjs`: the axes, state cases, context options and planned captures.
  - `.agents/skills/verify-fitway/runner.mjs:150-300`: drive's capture loop (a fresh context per item, readiness and
    fonts, the frame's file stem, the language and direction check).
  - `.agents/skills/verify-fitway/drive-command.mjs` and `.agents/skills/verify-fitway/cli.mjs:535-605`: how a command
    resolves `--concept` or `--ref`, runs the doctor, and writes its output folder.
  - `.agents/skills/verify-fitway/capture-records.mjs:1-10`: the file-safe name helper.
  - `scripts/agent-environment/tool-registry.mjs:140-165`, `:277-296` and `:410-434`, and
    `scripts/agent-environment/tool-help-notes.mjs:83-135`: how `verify:owner` commands, options and passthrough
    arguments are registered.
  - `.agents/skills/verify-fitway/SKILL.md:80-101`, `:322-341` and `:350-380`: the drive commands, the evidence
    rules, the location map and how a change to this tool is proved.
  - `.agents/skills/verify-fitway/output-manifest.test.mjs`, `.agents/skills/verify-fitway/drive-plan-boundary.test.mjs`
    and `.agents/skills/verify-fitway/run-page-context.test.mjs`: the tests a size, context or output change extends.
  - `docs/agent-context/briefs/CODE_REVIEW.md`: D1-D8, which the diff is reviewed against.

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

- `<run>` is `codex-round-public-frames`, made for you with `pnpm run-folder:new`. Never delete or change anything
  under `D:/fitway-temp` outside the run folder.
- Use the preview port pair 3188-3189 (`--port 3188`); other sessions use the other pairs. Never stop a port's owner.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Node's test runner, Playwright, Node scripts that run git) fail
  inside it: request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

Every public designer round since sketch 8 wrote its own server, capture, sheet and crop scripts (ten for sketch 11,
`D:/fitway-temp/public-redesign-r01-sketch-25`), because the CLI could not render what the brief asked for. Measured
on sketch 11 at `938087a4`: `pnpm verify:owner list` finds the page, its readiness and its switches `chart`, `dir`,
`level` and `pct`; `drive --states 'chart=line&level=quiet,...'` plans the combinations but fails every frame
without a recipe state proof per value; drive refuses a page whose direction differs from its language (the
`?dir=rtl` mirror check); the size table has no 360 x 780 and every frame is density 1; `measure --tool sheet` draws
captions at 15 px. After this round a designer renders a list of query combinations at a 360 x 780 phone, a 390 x 844
phone at density 3 and a 1440 x 900 computer at density 2, and builds a sheet of chosen frames, each under its name in
large type, with `pnpm verify:owner` commands alone, and `SKILL.md` gives those commands (DECISIONS item 23).

## Causes and required outcomes

- **P1.** The size table (`map.mjs:381-388`) has no 360 x 780 phone. Outcome: it gains `phone360`, 360 x 780, and every
  command that reads sizes accepts it; the six existing sizes and their dimensions are unchanged. Check: extend
  `drive-plan-boundary.test.mjs` so `drive --sizes phone360` plans a 360 x 780 item and the table holds the seven
  sizes. Intent: the narrow phone the public page is designed for is a named size, not a hand-set viewport.
- **P2.** No command sets a device density: `contextOptions` (`drive-plan.mjs:39-58`) passes none, so every frame is
  density 1. Outcome: the new `frames` command (P3) reads `--sizes` as a comma list of `<size>` or
  `<size>@<density>`, where the density is a whole number from 1 to 4 and a size without one is density 1, and its
  frames' contexts get that density: a frame's PNG is its CSS width and height times the density (times the zoom for
  `zoom`). Refused, each naming the value and the form: an unknown size (naming the sizes), `phone@0`, `phone@5`,
  `phone@1.5`, `phone@x`, `phone@`, `@3`, `phone@3@2`, and the same size twice in one call (`phone@3,phone@2`).
  `drive` and `compare` keep reading `--sizes` as today and refuse `phone@3` as today. Check: plan tests for every
  form above (accepted and refused), and `run-page-context.test.mjs` extended so a context built for a frame at
  `phone@3` holds a device scale factor of 3 and one at `desktop` holds 1. Intent: a phone frame is as sharp as the
  phone shows it, and drive's and compare's verdicts and caches are untouched.
- **P3.** Drive is the verification command: it claims a state only with a recipe proof, so it cannot render a page
  whose states have none. Outcome: `pnpm verify:owner frames (--concept <folder>|--ref <commit>) --page <page>
  --languages <list> --sizes <list> [--states ...] [--query ...] [--inputs ...] [--motions ...] [--transports ...]
  [--colors ...] [--recipes <file>] [--port <port>] [--session <launch-folder>] [--out <folder>]` captures, for
  every state (read by `stateCases`, so `chart=line&level=quiet,chart=dots&level=packed` is two states and an
  unknown switch is refused as drive refuses it) times language, size, input, motion, transport and colours, one
  viewport frame in a fresh context built as drive builds one, after the page's readiness signal and its fonts, as
  drive waits for them. `--motions` defaults to `reduce`, `--transports` to `http`, `--colors` to `normal`, and
  `--inputs` to `touch` for a size at most 720 CSS px wide and `mouse` above (drive's `mobile` bound). It claims no
  state or feature proof, needs no recipe entry for the page, and does not fail on uncovered openings or openers
  (the page still needs its readiness signal). A frame's file is `<language>-<size>-<state>.png`, the state written
  as `capture-records.mjs`' `safe` writes drive's state name (`en-phone-chart-line-level-quiet.png`,
  `en-desktop-default.png`), with `-<input>`, `-<motion>`, `-<transport>` or `-<colours>` added for each of those
  axes given more than one value in the call; names never collide. The output folder's `manifest.json` (written as
  every command's is) lists each frame: file, page, URL, state, language, size, CSS width and height, density,
  PNG width and height, input, motion, transport, colours, readiness, and the page's `lang`, direction and pointer
  as found; a language or direction differing from the axis is recorded, never refused (`?dir=rtl` is a design
  check). It prints one line per frame naming its file, and a summary that says no state proof was claimed. Console
  errors are recorded; an uncaught page error marks that frame and makes the command exit 1 after saving every
  frame. Reuse drive's planning, context, readiness and screenshot code rather than writing a second capture loop
  (D1 of `CODE_REVIEW.md`). Check: plan and naming tests (node's test runner, no browser) over a map fixture: two
  states times two sizes give four uniquely named frames with their densities; a second input adds the input to
  every name; an unknown switch is refused; and `output-manifest.test.mjs` extended so `frames` through
  `fake-cli.mjs` writes its command provenance as every command does. Intent: a designer gets exactly the frames a
  brief lists, sharp and named, without a recipe and without a script.
- **P4.** `measure --tool sheet` (ui-forensics, the user's machine-level skill, not changed here) has no caption size,
  so each round wrote its own sheet script. Outcome: `pnpm verify:owner sheet --out <folder> [--title <text>] --
  <label>=<png> ... [--row <label>=<png> ...]` writes `<folder>/sheet.png`: the frames in rows (each `--row` after
  `--` starts a new one), each frame under its label, the label set at 40 CSS px or larger, white on a dark ground,
  each frame drawn at its CSS width (its PNG width divided by the density the `frames` manifest in the PNG's folder
  records for that file; a PNG no such manifest lists is drawn at its PNG width), never scaled to fit, frames in a
  row aligned at their tops, rows one under another, the sheet itself at density 1. A label is the text before the
  first `=` and the path the rest; an empty label, a missing or unreadable PNG and a token without `=` are refused
  before rendering, each named; an Arabic label is kept as written. The folder's `manifest.json` lists each frame
  with its label, path, PNG size, density, the CSS width it was drawn at, and the label's computed font size as the
  browser rendered it. Check: layout tests without a browser (density read from a `frames` manifest and the
  fallback; the row split; each refusal), and the rendered values in P6. Intent: the user and the designer read
  every frame's name at a glance, at the size the device shows it.
- **P5.** `SKILL.md` describes Owner verification only, so a designer brief had no commands to name. Outcome:
  `pnpm verify:owner help` and `pnpm tools` list `frames` and `sheet` with their usage, options, defaults and exit
  codes from the registry; `SKILL.md` gains a section, linked from the location map, giving a public-page designer
  the exact PowerShell commands from the checkout root: `pnpm run-folder:new` for the run folder, `frames` with
  `--concept` (the designer's working folder) and with `--ref`, for a list of query combinations at `phone@3`,
  `phone360@3` and `desktop@2`, and `sheet` for chosen frames in rows, with where each writes. The location map
  gains the new files and the "Proving a change to this tool" table names the tests that prove each. Check:
  `skill-navigation.test.mjs` and `scripts/agent-environment/tool-contract.test.ts` pass, and a new
  `skill-navigation.test.mjs` case finds both command names in the new section. Intent: a coordinator can copy the
  commands into a designer brief and a designer can run them as written.
- **P6.** No ladder test can run a browser (CI has neither Playwright Chromium nor ui-forensics,
  `.github/workflows/checks.yml`), so the real proof is a run, made with the commands themselves. Outcome: in
  `D:/fitway-temp/<run>/`, using only `pnpm verify:owner` commands (no script file in the run folder), on
  `--ref 938087a4`, page `public-sketch-11.html`, language `en`: the frames `designer-public-sketch-25.md:114-121`
  lists (charts `line` and `dots` at `level=quiet` and `level=packed` on `phone@3`; each chart at `level=busy` on
  `desktop@2`; on `chart=line` the four levels on `phone@3` and `desktop@2`, and `level=busy` on `phone360@3`, with
  `pct=off` on `phone@3` and with `dir=rtl` on `phone@3`), then the sheets of `:123-127` (`compare` takes
  `public-sketch-10.html` at `chart=lit` from the same ref). Report the commands as run, the frame count, each size's PNG size (expected 1170 x 2532, 1080 x 2340 and
  2880 x 1800), `pnpm verify:owner diff-folders` or the manifests' pixel hashes showing `chart=line` and
  `chart=dots` frames differ, the `dir=rtl` frame's recorded direction, and from each sheet's manifest the smallest
  label font size and each frame's drawn width (390, 360 or 1440). Look at one sheet yourself and say what it shows.
  Intent: the commands in `SKILL.md` produce, on the real page, what a designer brief asks for.
- **K1.** Everything else stays: `drive`, `compare`, `measure` and `run` keep their options, verdicts, file names and
  caches, and every existing test passes unchanged; `pnpm test:verification`, `pnpm check:verification-map` and
  `pnpm verify:owner drift-tree` pass; `pnpm verify:fast` passes after the commit. The concept and every file under
  `design-research/` stay as they are.
- **K2.** No check, ratchet, test floor or limit is loosened. No file under a dated giant-file exception
  (`cli.test.mjs`, `compare.mjs`) grows, and no file passes the giant-file line by this round
  (`tool-registry.mjs` is near it: put new entries beside `ownerTailCommands` in `tool-help-notes.mjs` or a new
  module). New cases go in new or small test files. Raised floors and any fall are recorded with
  `pnpm code-health:baseline`, each named in the commit message; `pnpm check:tooling-map` passes (regenerate with
  `pnpm map:tooling`).

## Scope

You may change `.agents/skills/verify-fitway/**` (`map.mjs`, `drive-plan.mjs`, `cli.mjs` and `SKILL.md` must change;
new modules and tests beside them), `scripts/agent-environment/tool-registry.mjs`,
`scripts/agent-environment/tool-help-notes.mjs` and a new module beside them for the two commands' entries (one of
them must change), `scripts/agent-environment/tool-compatibility.json` if the contract test asks for it, and
`docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and `docs/agent-context/CODE_HEALTH_BASELINE.json` (both
regenerated). Commit once when done. Everything else is read-only. Add no dependencies.

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it: the axes and states are `drive-plan.mjs`', the context and readiness are drive's (`runner.mjs`), the
file-safe name is `capture-records.mjs`', the output folder and its manifest are `core.mjs`', the concept and `--ref`
extraction are `concept-source.mjs`', the options are the registry's, and a PNG's size is read where the tool
already reads one. Your diff is reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list
before you start. (agent-tooling DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of P1, P2, P3, P4, P5, P6, K1 and K2. A PASS command must
match a command started after the last edit inside the worktree, and its output must be one line the command printed.
Outside the block, also list the files you changed and anything you could not do.
