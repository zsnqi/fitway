---
name: verify-fitway
description: Launch, inspect, drive and compare the FITWAY Owner Eclipse concept, with source discovery and observable state proofs. Use for Owner verification and evidence capture.
---

# Verify FITWAY

The concept is a read-only input. Use its `verification-recipes.json`: user paths and observable state/feature
proofs belong beside the concept on the branch that changes it. `--recipes` can point to a coordinator's evidence
copy before that file is committed. Generated maps remain in evidence. Never copy the concept into this checkout.

From the root of whichever repository checkout contains this skill, initialize these PowerShell variables once:

```powershell
$cli = (Resolve-Path '.agents/skills/verify-fitway/cli.mjs').Path
$concept = '<absolute concept folder from the brief>'
$recipes = Join-Path $concept 'verification-recipes.json'
$run = 'D:/fitway-temp/<unique run name>'
$env:TEMP = 'D:/fitway-temp'
$env:TMP = 'D:/fitway-temp'
node $cli help
node $cli list --concept $concept --recipes $recipes --page all
```

After resolving `$cli`, commands work from any shell directory. Plain folders and `git archive` extractions need
no enclosing package.json: Playwright comes from this skill's repository. No new dependencies are installed.
`help` needs only Node. It prints the checkout's `pnpm install --frozen-lockfile` command for discovery and browser tools.
Commands that need an absent dependency print its package name and that install command, without a stack trace.
On this Windows machine run browser commands in PowerShell, with the brief's required escalation for child processes.
Git Bash may rewrite browser paths; use PowerShell for the examples below. All JSON is UTF-8 without a BOM.

## Discover and check

`list --page activity.html` prints feature ids, states, switches, dependencies, user reach and observable proof.
`--page` and `--feature` select one path; language, size, input, motion, transport and colours multiply its frames.
Use `help` for the full command and axis inventory. Every consumer rediscovers the source, including openings and
opener controls, including every `aria-haspopup` value except `false`. Specimens need explicit recipe coverage too.
A source edit alone is not drift. Uncovered openings/openers and vanished recipe selectors/markers fail
with their names and source file/line; repair the recipe or source on the concept branch, then run:

An inert specimen can use `coversOpeners: [{selector, file, marker}]`, where `marker` names its source declaration.
Coverage applies only to that declaration's opener, so a live control with the same classes still fails drift.

Discovery is not yet exhaustive: CSS-only openings and some dynamic or delegated opener relationships remain
unresolved. A drift pass proves coverage of the discovered openings; it does not prove a complete feature census.
`drift-tree` prints `DRIFT SKIP` when no recipe file is found and exits successfully, so the fast ladder can
continue without claiming coverage. Supply the concept's recipe file beside it or use `drift --recipes`.

```powershell
node $cli map --concept $concept --recipes $recipes --out "$run/map"
node $cli drift --concept $concept --recipes $recipes --map "$run/map/verification-map.json"
node $cli doctor --concept $concept --recipes $recipes --tools diff
```

Doctor is read-only and prints `DOCTOR PASS` or the problem and a `FIX:` command. Recipe drift's `FIX` uses
`repair-recipes`, which writes a copy outside the concept: vanished selector/marker recipes are dropped and uncovered
elements get draft entries. Drift with that copy reports drafts to complete; author their user reach and observable
proof, remove `draft`, and check again. A missing recipe file produces a draft skeleton, not recovered knowledge.
Missing standalone inputs without
an authoritative recovery source print `FIX BLOCKED`; not every doctor failure has an automatic repair command.
It checks Chromium, the user's
machine-level ui-forensics skill, the concept probe kit, recipe coverage, and port ownership; `--tools diff` adds
Python/numpy/Pillow. Missing machine-level tools block browser verification in cloud sessions.

## Launch and drive

`--port` accepts only **3176 and 3177**. 3174 and 3178-3185 belong to other previews. A listener on any address is busy;
never stop its owner. A run without `--session` starts and closes its own preview. Explicit launch is optional:

Every preview stops after **30 minutes without a request** and frees its port; requests renew that timeout.
An expired session needs a fresh launch before doctor or drive can use it. Cleanup accepts the launch folder
or its `session.json` file and reports an expired preview as already stopped. A nonexistent path fails.
For isolated lifecycle tests, `launch --isolated-port <49152-65535>` uses a separate high port;
`--port` still accepts only 3176 or 3177. `--idle-timeout-ms <1-1800000>` shortens the idle bound for tests.

```powershell
node $cli launch --concept $concept --port 3176 --out "$run/launch"
try {
  node $cli doctor --concept $concept --recipes $recipes --session "$run/launch"
  node $cli drive --concept $concept --recipes $recipes --session "$run/launch" --page index.html --feature status --languages ar,en --sizes desktop,tablet,phone --inputs mouse --motions reduce --transports http --out "$run/status"
} finally {
  node $cli cleanup --session "$run/launch"
}
```

Every preview response sends `Cache-Control: no-store`; `--cache none` tests the no-header route. `--lan` makes an
explicit preview reachable on the LAN on an allocated port; use its printed network-interface URL on another device.
Session identity authenticates cleanup; retain
`session.json` privately. Cleanup after a refused launch or a previously cleaned session is safe and retains evidence.

A `FRAME PASS` requires the requested state's visible proof and the feature's action/result proof. Unsupported
state combinations with no proof fail explicitly. Dependent switches are applied with the recipe default or refused
with the source reason. `NOT-REACHABLE` means the recipe says the feature is absent by design and proves that absence
(for example status details while loading); it is neither a pass nor a failure. `PROBLEM` names a measuring tool's
error. Each item's findings survive, and the run continues. Overall failure still has a manifest and frames.

Use source-supported switches or real user actions. Read-only readiness/state observations are allowed; internal
setters do not prove a user flow. Each item uses a fresh context, waits for readiness/fonts and Daily intro settlement.
Touch uses a coarse pointer and actual taps. `--probes daily` adds the concept's geometry/accessibility measurements.
`hold:<selector>` presses the selector at its centre and keeps the primary
mouse button or touch contact down until a matching `release` action (or item
cleanup). Use `hold` before a capture or motion trigger, and always release it
before the next item. Keyboard input refuses held presses. A held manifest
records the selector, input, press-to-capture time, and classification:
`pressed style shown while held` means the rendered style changed (including
pointer-event changes), `pressed style exists but emulated touch does not show
it` means a matching `:active` rule exists but the touch frame did not change,
and `no pressed style` means neither is present. Emulated touch does not show
`:active`; prove that state with a mouse hold and on a device.
`--inputs keyboard` reaches action targets with Tab and activates with Enter; `focus:` also traverses with Tab,
never sets focus. `press:` sends the named key, `type:` types with keys, and native `select:` uses Home/ArrowDown/Enter.
For roving controls or a different activation key, recipes can supply `keyboardActions` with `press:` and `focus:`
steps. Each key's before/after focused element is recorded in the full item JSON, with initial/final focus.
`FRAME KEYBOARD-UNREACHABLE` fails the run and names the target and focus stop after a repeated Tab cycle or bounded
sequence. Unsupported pointer actions require authored keyboard steps. Inspect the recorded sequence before claiming reach.
The drive summary counts keyboard-unreachable items separately from problems, names each item, and still fails.
Tab evidence names the move and its focus destination; activation evidence retains the requested action.
`--states all` sweeps discovered switch values and recipe samples; use explicit states or query for a narrower claim.

These two tasks demonstrate finding the feature and applying its state:

```powershell
node $cli list --concept $concept --recipes $recipes --page activity.html
node $cli drive --concept $concept --recipes $recipes --page activity.html --feature page --query 'case=long' --languages ar --sizes narrow --inputs mouse --motions reduce --transports http --port 3176 --out "$run/activity-long"
node $cli list --concept $concept --recipes $recipes --page reports.html
node $cli drive --concept $concept --recipes $recipes --page reports.html --feature export-open --languages en --sizes phone --inputs touch --motions reduce --transports http --port 3176 --out "$run/reports-export"
node $cli list --concept $concept --recipes $recipes --page access.html
node $cli drive --concept $concept --recipes $recipes --page access.html --feature pinChange --languages ar --sizes tablet --inputs keyboard --motions reduce --transports http --port 3176 --out "$run/access-pin-keyboard"
```

Activity's `case=long` needs `record`; this build's recipe applies `record=1001` and checks the visible long-name
record and arrival focus. If another build has no default, supply `--query 'case=long&record=<valid id>'`.

`--colors normal,forced` adds the colours axis to drive and compare; omitting it selects normal.
Forced requires ui-forensics **1.2.0 or later** (use `--forensics <copy>` until installed).
Every forced item records the computed body background and Canvas palette colour and refuses a mismatch.
Each manifest item and FRAME line names normal or forced. Normal keeps its existing filenames;
forced filenames add `-forced`, so mixed runs cannot overwrite frames.

## Compare

Extract the requested baseline revision once outside all git trees, then give its concept folder to `compare`.
The baseline can use the same recipe file with `--baseline-recipes`, or its own adjacent recipe file. Both sides
run the same items and axes. Differences are captured again in fresh contexts before the final exact pixel result;
no tolerance is added. Each differing item has a region, diff JSON and images in `comparison.json`.

```powershell
$baseline = '<absolute extracted concept folder>'
node $cli compare --concept $concept --baseline $baseline --recipes $recipes --baseline-recipes $recipes --page index.html --feature page --states 'state=live,state=delayed,state=nohistory,state=loading,state=closed,state=unavailable,state=error' --languages ar,en --sizes desktop,tablet,phone --inputs mouse --motions reduce --transports http --port 3176 --baseline-port 3177 --out "$run/daily-compare"
```

`COMPARE EQUAL` and `COMPARE DIFFERENT` name each item; capture/probe problems and designed absence are separate
results. A difference or problem makes the command fail. Inspect its frames and diff images, including the repeats.

## Evidence and advanced tools

Output must be an absolute folder outside every git tree, including links and junction aliases. File names carry
feature/state/language/size/input/motion/transport. Read `summary.json` or the item's `*-summary.json` first; full
JSON retains actions, readiness, geometry, overflow, ARIA, errors and each keyboard focus step.
Each summary retains `proof` for the reached state and `featureProof` for the successfully reached feature result.
Compare prints one line per item and a summary; full diff measurements remain in `comparison.json` and the named diff JSON files.
Before/after/error frames and language sheets remain after cleanup. Capture downloads when a feature claims them.
Personally inspect exact named rendered frames
at the required sizes and languages; logs/hashes do not establish visual quality or human acceptance.

`measure --tool focus|motion|a11y|probe|perf|capture|sheet|diff --out <folder> -- <tool arguments>` delegates to
ui-forensics. `measure --colors forced` passes `--forced-colors active`; tool arguments can supply it directly.
Forced requests in tool arguments and frame/probe matrices also require 1.2.0 before delegation. Read that tool's help for advanced measurements. Extend this path when an adapter is missing instead
of writing another server, launcher or capture loop. The concept is synthetic; preserve privacy and data semantics.

Verifier rules (one canonical statement):

- G1: Keep cap checks at least 30 ms from the cap: 50, 150, 250 and 600 ms.
- G2: Detect a removed pre-intro frame by holding fonts until first paint +50 ms and +100 ms.
- G3: Run load checks under no-store and under no cache header.
- G4: Run every movement check until at least 500 ms after `endedAt`.
