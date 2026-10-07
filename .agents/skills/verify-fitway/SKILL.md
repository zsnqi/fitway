---
name: verify-fitway
description: Launch, check and drive the FITWAY Owner Eclipse concept with a maintained CLI and source-generated map. Use for Owner browser verification and evidence capture.
---

# Verify FITWAY

Use this path for Owner concept verification. The concept is an input; never copy it into this checkout.
The current build lives at `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse`.
The helper lives beside this file at `cli.mjs`; invoke Node with its absolute Windows path from either shell.
Resolve this skill's enclosing checkout, rather than assuming the build or the current working directory owns it.
Read `node D:/Projects/fitway-worktrees/agent-environment-r03/.agents/skills/verify-fitway/cli.mjs help` for commands and axes.

## Launch

From PowerShell, including outside a repository:

```powershell
$cli = 'D:/Projects/fitway-worktrees/agent-environment-r03/.agents/skills/verify-fitway/cli.mjs'
$concept = 'D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse'
node $cli map --concept $concept --out D:/fitway-temp/verify-owner-map
node $cli launch --concept $concept --port 3176 --out D:/fitway-temp/verify-owner-launch
```

`LAUNCH PASS` names the ready URL and session folder. Every preview response sends `Cache-Control: no-store`.
Loopback is the default. For the user's phone preview, the coordinator can explicitly use `--lan --port 3180`.
3174 and 3178–3179 belong to others; use 3176–3177 here. Busy ports fail; never terminate their owners.
The launch folder's `session.json` authenticates doctor and cleanup; keep it private and retain it until cleanup.

## Doctor

```powershell
node $cli doctor --concept $concept --map D:/fitway-temp/verify-owner-map/verification-map.json --session D:/fitway-temp/verify-owner-launch
```

Run this read-only check whenever anything looks off. It names a missing Chromium, ui-forensics, probe kit,
map drift or foreign port and its fix. `--tools diff` additionally checks Python 3.10+, numpy and Pillow.
Cloud sessions without the user's machine-level ui-forensics cannot perform this browser verification.
Doctor does not install packages, regenerate files or start a browser/server.

## Drive

```powershell
node $cli drive --concept $concept --map D:/fitway-temp/verify-owner-map/verification-map.json --session D:/fitway-temp/verify-owner-launch --feature status --languages ar,en --sizes desktop,tablet,phone --inputs mouse,touch --motions reduce --transports http --out D:/fitway-temp/verify-owner-evidence
```

Read the generated map's page, switches, feature reach/actions and observable proof before selecting a feature.
Map location defaults to `verification-map.json` beside the concept; this round's map stays in evidence until
the coordinator commits it on the build branch. Regenerate with `map`; check with `drift --concept ... --map ...`.
`drift-tree` is in the fast ladder and checks maps in this checkout; a checkout with no maps passes explicitly.
State `all` sweeps each switch value independently. `--query 'state=loading&arrive=500'` requests a combination.
Open text/numeric domains use representative samples; supply other values explicitly with `--query`.
The CLI rejects unmapped switches. Do not restore retired trial switches in briefs or verification scripts.
Sizes include desktop, boundary, tablet, phone, narrow and zoom. Zoom models 1440 at 200%, 720 CSS pixels.
Touch enables a coarse pointer and actual touch events. Motion and transport axes accept reduce/full and http/file.
Each frame gets a fresh context and waits for its page's readiness, fonts and Daily intro settlement.
`--probes daily` calls the concept's chart geometry and accessibility probes after capturing the user action.
Use user actions or URL switches supported by the code. Do not use internal setters to prove a user flow.
Responsive features have separate map entries where their paths differ; select their applicable widths.
`--page all --feature all` sweeps every recipe at its applicable widths; failures remain in the manifest.
The current English phone tuner button lies outside its viewport. Its real tap fails; report the finding and
retain the frame rather than forcing the action. The concept is read-only in this tooling worktree.

In Git Bash use the same quoted Windows `D:/...` paths and quoted query strings:

```bash
cli='D:/Projects/fitway-worktrees/agent-environment-r03/.agents/skills/verify-fitway/cli.mjs'
concept='D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse'
node "$cli" help
node "$cli" launch --concept "$concept" --port 3176 --out D:/fitway-temp/verify-owner-bash-launch
trap 'node "$cli" cleanup --session D:/fitway-temp/verify-owner-bash-launch' EXIT
node "$cli" doctor --concept "$concept" --map D:/fitway-temp/verify-owner-map/verification-map.json --session D:/fitway-temp/verify-owner-bash-launch
node "$cli" drive --concept "$concept" --map D:/fitway-temp/verify-owner-map/verification-map.json --session D:/fitway-temp/verify-owner-bash-launch --feature status --languages ar,en --sizes desktop,tablet,phone --inputs mouse,touch --motions reduce --transports http --out D:/fitway-temp/verify-owner-bash-evidence
```

No `/api`-style selector/path arguments need to cross the shell; mapped actions are dispatched inside Node.
For additional measurements, `measure --tool ... --out ... -- <tool arguments>` calls ui-forensics directly.
Give `measure` the feature and axis options too; its manifest records them alongside the delegated tool's evidence.
Use its help for focus order, motion traces, performance, accessibility, geometry, contact sheets and pixel diffs.
Never build another server, browser launcher or capture loop for a round; add a missing adapter here once.

## Evidence

Default output is a fresh `D:/fitway-temp/verify-fitway-*`. Explicit output must be absolute and outside every
Git working tree, including linked worktrees and junction aliases. Refusal happens before output is written.
The CLI saves before/after PNGs, action logs, measured geometry/overflow, ARIA snapshots, per-frame JSON,
contact sheets and `manifest.json`, with feature/state/language/size/input/motion/transport on every frame.
Inspect the exact named frames yourself at the required sizes and languages; logs and hashes are not visual acceptance.
Capture the action and result; verify side effects such as downloads when the feature claims them.
This concept uses synthetic data. Preserve privacy and data semantics; do not capture a visitor or a real secret.
Keep acceptance thresholds and held-out checks outside this tooling, in the coordinator's grader.

Verifier rules (one canonical statement):

- G1: Keep cap checks at least 30 ms from the cap: 50, 150, 250 and 600 ms.
- G2: Detect a removed pre-intro frame by holding fonts until first paint +50 ms and +100 ms.
- G3: Run load checks under no-store and under no cache header.
- G4: Run every movement check until at least 500 ms after `endedAt`.

## Cleanup

```powershell
node $cli cleanup --session D:/fitway-temp/verify-owner-launch
```

Cleanup authenticates the exact process started by launch and confirms its port stopped. It never kills by name.
Drive closes its browsers and any server it started on success, failure or interruption. An explicitly launched
preview belongs to its session: run cleanup in your shell's finally/trap after a failed or interrupted workflow too.
Cleanup retains all evidence. Confirm the manifest and frames still exist after it.

## Helpers

`cli.mjs` is the command entry; its sibling modules and IPC worker are private implementation details.
No new dependencies are installed. Playwright resolves from the input concept's checkout, independent of shell cwd.
Browser contexts/actions/screenshots/sheets use ui-forensics; concept measurements use its existing probe kit.
The CLI's `measure` command delegates advanced checks to the installed tools rather than copying them.
Use `/maintain-verification-skill` to review recipes and regenerate the map when the concept changes.
