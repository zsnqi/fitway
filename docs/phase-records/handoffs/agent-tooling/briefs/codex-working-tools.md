<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: the verification CLI serves, shoots and measures what design agents now hand-build (agent-tooling-r01, round working-tools)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-working-tools`, branch `tooling-working-tools`, HEAD `f5198aa3`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 16,
  23 and 24.
- **Read first, only these:**
  - `D:/fitway-temp/public-redesign-r01-axis-37/work/shot.mjs`, `D:/fitway-temp/public-redesign-r01-axis-37/work/serve.mjs`
    and `D:/fitway-temp/public-redesign-r01-axis-37/work/measure-labels.mjs`: what the last designer built by hand.
  - `D:/fitway-temp/public-redesign-r01-polish-35/motion/scripts/run-tool.mjs`: the wrapper rounds copy to call
    ui-forensics without shell quoting.
  - `.agents/skills/verify-fitway/cli.mjs:340-400`, `:615-700` and `:735-745`: `launch`'s preview, `_serve`,
    `measure` and `run`.
  - `.agents/skills/verify-fitway/core.mjs:190-240` and `:420-440`: `preview` and the port pairs.
  - `.agents/skills/verify-fitway/frame-plan.mjs` and `.agents/skills/verify-fitway/frames-command.mjs`: frame sizes,
    densities and the capture of one frame.
  - `.agents/skills/verify-fitway/run.mjs`: `run`'s preview, browser and `newPage`.
  - `.agents/skills/verify-fitway/measure-arguments.mjs`: what `measure` refuses in a tool's arguments.
  - `.agents/skills/verify-fitway/SKILL.md:163-186`, `:320-345`, `:356-366` and `:374-413`: public frames, `run`,
    `measure`, the location map and how a change to this tool is proved.
  - `scripts/agent-environment/tool-registry.mjs:340-380` and `scripts/agent-environment/tool-help-notes.mjs:40-140`:
    how `verify:owner` commands and options are registered.
  - `scripts/agent-environment/designer-brief.mjs`, `scripts/agent-environment/check-brief.mjs:30-60`,
    `scripts/agent-environment/check-staged-evidence.mjs:60-90` and `scripts/agent-environment/brief-format.mjs`:
    the brief rule this round extends and where it runs.
  - `docs/agent-context/briefs/designer.md`, `docs/agent-context/briefs/builder.md` and
    `docs/agent-context/briefs/verifier.md`: the brief templates.
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

- `<run>` is `codex-round-working-tools`, made for you with `pnpm run-folder:new`. Never delete or change anything
  under `D:/fitway-temp` outside the run folder.
- Use the preview port pair 3188-3189 only; other sessions use the other pairs, and a page server for the user's
  phone runs on 3181. Never stop a port's owner.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Node's test runner, Playwright, Node scripts that run git) fail
  inside it: request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

After item 23, official frames and sheets come from `pnpm verify:owner frames` and `sheet`, but design agents still
build their working tools by hand (DECISIONS item 24, measured over every Claude session since 2026-10-31 20:15
UTC): a screenshot script that taps, clicks or hovers before the shot at a free size such as 1280 x 720 (`shot.mjs`,
run 57 times), a static server of their own (18 times; `_serve` is undocumented and briefs said "serve on your own
port"), and ui-forensics called directly (54 times) or through a copied `run-tool.mjs`, against `measure --tool`
used twice and `run` twice. `measure` reaches a page only through a launched preview on a port pair, `run`'s
`newPage` takes only mapped sizes and no density, and frames take no action. After this round a design agent
serves a concept for a phone, shoots a page after a tap, click, hover, focus or key at a mapped or free size,
measures motion on a concept page, and writes a looping check as a `run` script, each with `pnpm verify:owner`
commands alone, and briefs that point anywhere else are refused.

## Causes and required outcomes

- **W1.** Serving a concept by hand is easier than finding `_serve`, which `launch` uses internally and no document
  names. Outcome: `pnpm verify:owner serve (--concept <folder>|--ref <commit>) --port <port> [--lan]
  [--idle-timeout-ms <ms>]` serves the concept read-only with `Cache-Control: no-store` through the existing
  `preview`, prints `READY <origin>`, and with `--lan` binds an interface the local network reaches, as `preview`'s
  `lan` option does, and prints each LAN origin it serves on (W7 proves a request through one); it serves until it
  is stopped, or for the given idle time when `--idle-timeout-ms` is passed; `--ref` extracts the commit's concept as `frames` does. The
  port is any whole number from 1024 to 65535; a port with a listener on any address is refused naming the port,
  and the listener is never stopped. `_serve` keeps working exactly as `launch` calls it. Check: a test that `serve`
  on a free high port answers a request for a concept file with status 200 and the no-store header and that a busy
  port is refused; registry and help list `serve`. Intent: the user's phone server and an agent's working server
  are one documented command.
- **W2.** Free sizes need a script. Outcome: `frames --sizes` accepts, beside `<size>` and `<size>@<density>`,
  `<width>x<height>` and `<width>x<height>@<density>` (whole CSS pixels, width 240-3840, height 240-2400, density
  1-4), named `<width>x<height>` in file names and the manifest; every refusal `parseFrameSizes` makes today stays,
  and a free size outside those bounds, a non-integer side or a duplicate of another size's dimensions is refused
  naming the value and the forms. `run`'s `newPage({ size })` accepts the same four forms, and its context gets the
  density (`newPage({ size: "phone@3" })` gives a device scale factor of 3, `newPage({ size: "phone" })` 1, as
  today). Check: plan tests for each accepted and refused form, and `run-page-context.test.mjs` extended for a free
  size with a density. Intent: any size a design question needs is one argument.
- **W3.** A frame cannot show a page after an interaction, so agents write `shot.mjs`. Outcome: `frames` takes
  `--actions '<step>;<step>…'`, applied to every frame of the call, in order, after the page's readiness and fonts
  and before the shot, where a step is `click=<css>`, `tap=<css>`, `hover=<css>`, `focus=<css>`, `press=<key>` or
  `wait=<ms>` (0-5000); a step splits at its first `=`, so `click=.slot[data-h="18"]` works. `tap` on a frame whose
  input is not touch, a selector matching nothing, and an unknown step fail that frame naming the step, as an
  uncaught page error does today. `--clip <css>` shoots the first match's box widened by 8 CSS px on each side and
  kept inside the viewport, instead of the viewport; no match fails the frame. The manifest records each frame's
  actions and clip. Without `--actions` and `--clip`, every frame, file name and manifest field is as today. Check:
  plan tests for each step's parsing and refusal; the real run in W7. Intent: the working shots of a round are
  `frames` calls.
- **W4.** A looping check (every bar picked in turn, labels read before and after) is a script, and `run` is its
  place, but agents re-wrote the server, browser and readiness wait instead. Outcome: `run` works with one concept
  (`--concept` or `--ref`, no baseline) on the default pair, as it may today, and its script also receives
  `ready(page)`, which waits for the page's readiness signal and fonts as `frames` waits, and `shot(page, file,
  { clip })`, which writes a PNG into `out` as `frames` shoots one. W6's example and W7's script take their pages,
  browser, server, readiness and shots from the run context alone: no import of Playwright or ui-forensics, no child
  process and no server of their own. Check: `run-page-context.test.mjs` or a new small
  test covers `ready` and `shot` through the fake harness; the real run in W7. Intent: a looping check is the loop
  alone.
- **W5.** Measuring motion needs a launched preview on a port pair, so agents serve their own page and call
  ui-forensics directly. Outcome: `measure --tool <tool> (--concept <folder>|--ref <commit>) --page <page> [--query
  <key=value&…>] --out <folder> [--args-file <json>] [-- <tool arguments>]` serves the concept itself on `--port`
  (default 3176; a port pair's first port) for the call, passes the tool `--url` set to the served page with the
  query, and stops the server after; `--args-file` holds a JSON array of strings appended to the tool's arguments
  unchanged (no shell quoting), and a JSON value that is not an array of strings is refused. Every refusal
  `measure-arguments.mjs` makes stays and applies to the file's arguments too, and so does a tool `--url` beside
  `--page`, and so does a `--spec` or `--frames` file whose target URL is not the served page. Without `--page`,
  `measure` is as today. Check: tests for the argument assembly (the tool receives the served page's URL with the
  query) and each refusal; the real run in W7. Intent: motion and the other ui-forensics measurements are one CLI command with the page served
  for them.
- **W6.** Briefs and templates point agents at raw tools. Outcome: (a) `SKILL.md` gains a section after "Public
  designer frames", linked from the location map, giving the exact PowerShell commands from the checkout root for
  W1-W5, in one fenced block whose only placeholders are written `<...>`, with an example `run` script of at most
  15 lines that picks each of a page's buttons in turn and records a selector's text and box; the help of `serve`,
  `frames`, `run` and `measure` comes from the registry. (b) `docs/agent-context/briefs/designer.md`, `builder.md`
  and `verifier.md` name `pnpm verify:owner serve` for a server, `frames --actions` and `--clip` for working shots,
  `measure --page` for motion and `run` for a check no command makes. (c) `pnpm brief:check`, and the pre-commit
  job that runs the designer rule on staged briefs, refuse a brief of role `designer`, `builder` or `verifier`
  whose text outside the environment block, prose and fenced commands alike: (i) names a path inside ui-forensics'
  scripts folder (`C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/`, in any spelling of it; its references
  folder of guides stays allowed); (ii) runs a script file with `node`, `python` or `py`, or starts a server
  (`python -m http.server`, `npx serve`, a server file such as `serve.mjs`), other than the script of a
  `pnpm verify:owner run --script <file>` command; or (iii) has a line that tells the agent to serve a page or to
  choose a port to serve on without `pnpm verify:owner serve` on that same line. Each message names the command to
  use; `role: codex` briefs are not checked by this rule, and every existing designer-rule case keeps its result.
  Check: `skill-navigation.test.mjs` finds the new commands in the new section; `designer-brief.test.ts` or a new
  test covers each new refusal (a fenced direct ui-forensics call among them), an allowed guide path in the
  references folder, a `run --script` command allowed, a builder and a verifier brief, and a codex brief left
  alone. The rule runs where the designer rule runs (one brief under `brief:check`, the briefs a commit adds under
  the hook), so briefs committed before it are not judged again. Intent: the easy path in a brief is the CLI, and
  the hard one is refused.
- **W7.** No ladder test runs a browser (CI has neither Playwright Chromium nor ui-forensics), so the real proof is a
  run with the commands of W6's fenced block as written, only their `<...>` placeholders filled, on `--ref
  0fad27b9`, page `public-sketch-16.html`, language `en`, into `D:/fitway-temp/<run>/`: (1) `serve --lan` on port
  3189, one request for the page through a printed LAN origin (not loopback) answered 200, then stopped; (2) `frames` at `phone@3` and `1280x720@1` with
  `--states 'level=busy&day=sat'`, once as loaded and once with `--actions 'tap=.slot[data-h="18"]'` on `phone@3`
  and `click=.slot[data-h="18"]` on `1280x720@1` (two calls, since a tap needs touch), each also with `--clip` on the
  chart card; (3) a `run` script in the run folder that, at `phone@3` on Saturday, picks each `.slot` in turn and
  records each hour label's text, box, computed font weight and whether its bar is the picked one, before and after
  each pick, using `ready` and `shot` for one frame;
  (4) `measure --tool motion` with `--page`, `--query 'level=busy&day=sat'` and `--args-file`, tracing the picked
  bar's outline element (read the page's CSS at that ref to choose it) after a click on `.slot[data-h="18"]`.
  Write `D:/fitway-temp/<run>/W7.md` with the commands as run, each frame's PNG size (expected 1170 x 2532 and 1280 x
  720, smaller where clipped), whether the picked and unpicked frames differ (pixel hashes), the label records'
  count, whether any label's text or box changed, which labels changed weight and whether each was the picked
  bar's, and the motion trace's verdict line. Look at the frames
  yourself and say what they show. Intent: the commands produce, on the real page, what the last designer built by
  hand.
- **K1.** Everything else stays: `drive`, `compare`, `launch`, `frames` without the new options, `sheet`, `measure`
  without `--page`, and `run` keep their options, verdicts, file names and caches, and every existing test passes
  unchanged; `pnpm test:verification`, `pnpm check:verification-map` and `pnpm verify:owner drift-tree` pass;
  `pnpm verify:fast` passes after the commit. The concept and every file under `design-research/` stay as they are.
- **K2.** No check, ratchet, test floor or limit is loosened. No file under a dated giant-file exception
  (`cli.test.mjs`, `compare.mjs`, `check-brief.test.ts`) grows, and no file passes the giant-file line by this round
  (`tool-registry.mjs` is near it: put new entries beside the `frames` and `sheet` entries in `tool-help-notes.mjs`
  or a new module). New cases go in new or small test files. Raised floors and any fall are recorded with
  `pnpm code-health:baseline`, each named in the commit message; `pnpm check:tooling-map` passes (regenerate with
  `pnpm map:tooling`).

## Scope

You may change `.agents/skills/verify-fitway/**` (new modules and tests beside the files they serve),
`scripts/agent-environment/tool-registry.mjs`, `scripts/agent-environment/tool-help-notes.mjs` and a new module
beside them for command entries, `scripts/agent-environment/designer-brief.mjs`, its test and a new module beside
it, `scripts/agent-environment/check-brief.mjs` and `scripts/agent-environment/check-staged-evidence.mjs` only to call
the extended rule, `docs/agent-context/briefs/designer.md`, `builder.md` and `verifier.md`,
`docs/agent-context/RULE_ENFORCERS.md` (one row for the extended rule),
`scripts/agent-environment/tool-compatibility.json` if the contract test asks for it, and
`docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and `docs/agent-context/CODE_HEALTH_BASELINE.json` (both
regenerated). Commit once when done. Everything else is read-only. Add no dependencies.

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse
or extend it: sizes are `frame-plan.mjs`' `parseFrameSizes`, the context is drive's `contextOptions`, readiness and
the viewport shot are `frames`', the server is `core.mjs`' `preview`, the concept and `--ref` extraction are
`concept-source.mjs`', the capture lifecycle is `capture-lifecycle.mjs`', the options are the registry's, and the
brief's environment block is masked as `designer-brief.mjs` masks it. Your diff is reviewed against
`docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before you start. (agent-tooling DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of W1, W2, W3, W4, W5, W6, W7, K1 and K2. A PASS command must
match a command started after the last edit inside the worktree, and its output must be one line the command
printed. Outside the block, also list the files you changed and anything you could not do.
