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
On this Windows machine run browser commands in PowerShell, with the brief's required escalation for child processes.
Git Bash may rewrite browser paths; use PowerShell for the examples below. All JSON is UTF-8 without a BOM.

## Discover and check

`list --page activity.html` prints feature ids, states, switches, dependencies, user reach and observable proof.
`--page` and `--feature` select one path; language, size, input, motion and transport multiply its frames.
Use `help` for the full command and axis inventory. Every consumer rediscovers the source, including openings and
opener controls. A source edit alone is not drift. Uncovered openings and vanished recipe selectors/markers fail
with their names and source file/line; repair the recipe or source on the concept branch, then run:

Discovery is not yet exhaustive: CSS-only openings and some dynamic or delegated opener relationships remain
unresolved. A drift pass proves coverage of the discovered openings; it does not prove a complete feature census.

```powershell
node $cli map --concept $concept --recipes $recipes --out "$run/map"
node $cli drift --concept $concept --recipes $recipes --map "$run/map/verification-map.json"
node $cli doctor --concept $concept --recipes $recipes --tools diff
```

Doctor is read-only and prints `DOCTOR PASS` or the problem and a `FIX:` command. Missing standalone inputs without
an authoritative recovery source print `FIX BLOCKED`; not every doctor failure has an automatic repair command.
It checks Chromium, the user's
machine-level ui-forensics skill, the concept probe kit, recipe coverage, and port ownership; `--tools diff` adds
Python/numpy/Pillow. Missing machine-level tools block browser verification in cloud sessions.

## Launch and drive

Only **3176 and 3177** are accepted. 3174 and 3178-3185 belong to other previews. A listener on any address is busy;
never stop its owner. A run without `--session` starts and closes its own preview. Explicit launch is optional:

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
explicit preview reachable on the LAN on an allocated port. Session identity authenticates cleanup; retain
`session.json` privately. Cleanup after a refused launch or a previously cleaned session is safe and retains evidence.

A `FRAME PASS` requires the requested state's visible proof and the feature's action/result proof. Unsupported
state combinations with no proof fail explicitly. Dependent switches are applied with the recipe default or refused
with the source reason. `NOT-REACHABLE` means the recipe says the feature is absent by design and proves that absence
(for example status details while loading); it is neither a pass nor a failure. `PROBLEM` names a measuring tool's
error. Each item's findings survive, and the run continues. Overall failure still has a manifest and frames.

Use source-supported switches or real user actions. Read-only readiness/state observations are allowed; internal
setters do not prove a user flow. Each item uses a fresh context, waits for readiness/fonts and Daily intro settlement.
Touch uses a coarse pointer and actual taps. `--probes daily` adds the concept's geometry/accessibility measurements.
`--states all` sweeps discovered switch values and recipe samples; use explicit states or query for a narrower claim.

These two tasks demonstrate finding the feature and applying its state:

```powershell
node $cli list --concept $concept --recipes $recipes --page activity.html
node $cli drive --concept $concept --recipes $recipes --page activity.html --feature page --query 'case=long' --languages ar --sizes narrow --inputs mouse --motions reduce --transports http --port 3176 --out "$run/activity-long"
node $cli list --concept $concept --recipes $recipes --page reports.html
node $cli drive --concept $concept --recipes $recipes --page reports.html --feature export-open --languages en --sizes phone --inputs touch --motions reduce --transports http --port 3176 --out "$run/reports-export"
```

Activity's `case=long` needs `record`; this build's recipe applies `record=1001` and checks the visible long-name
record and arrival focus. If another build has no default, supply `--query 'case=long&record=<valid id>'`.

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
JSON retains actions, readiness, geometry, overflow, ARIA and errors. Before/after/error frames and language sheets
remain after cleanup. Capture downloads when a feature claims them. Personally inspect exact named rendered frames
at the required sizes and languages; logs/hashes do not establish visual quality or human acceptance.

`measure --tool focus|motion|a11y|probe|perf|capture|sheet|diff --out <folder> -- <tool arguments>` delegates to
ui-forensics. Read that tool's help for advanced measurements. Extend this path when an adapter is missing instead
of writing another server, launcher or capture loop. The concept is synthetic; preserve privacy and data semantics.

Verifier rules (one canonical statement):

- G1: Keep cap checks at least 30 ms from the cap: 50, 150, 250 and 600 ms.
- G2: Detect a removed pre-intro frame by holding fonts until first paint +50 ms and +100 ms.
- G3: Run load checks under no-store and under no cache header.
- G4: Run every movement check until at least 500 ms after `endedAt`.
