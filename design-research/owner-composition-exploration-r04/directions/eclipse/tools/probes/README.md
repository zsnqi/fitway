# Eclipse verifier probe kit

One maintained entry point, `lib.mjs`, for fresh Playwright Chromium contexts,
screenshots, HTTP variants, font/cache experiments and reusable measurements.
No dependencies are added. Playwright comes from `@playwright/test` through
`createRequire` on the enclosing worktree's `package.json`.

Run from PowerShell anywhere inside any worktree of this repository (Git resolves
that worktree's root; no worktree name is hard-coded):

```powershell
$env:TEMP='D:/fitway-temp'; $env:TMP='D:/fitway-temp'; & 'C:/Program Files/nodejs/node.exe' (Join-Path (& git rev-parse --show-toplevel) 'design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/smoke.mjs')
```

This opens Daily and Reports in Arabic at 1440×900, DPR 1, with reduced motion,
through both `file://` and the kit's server. It writes four named PNGs and
`smoke.json`, runs overflow, Daily geometry and Daily accessibility once each,
then prints one `PASS Eclipse probe kit: ...` line. The accessibility probe
records ARIA snapshots and a changed-label positive control; it is not a WCAG
audit. These measurements and the smoke pass do not constitute visual approval.
Screenshots precede the accessibility probe's three synthetic reading steps.
Server/browser/context cleanup runs on success and failure, cancelling pending
font/script hold timers rather than waiting for their requested duration.

## Configuration

| Environment variable | Default | Meaning |
| --- | --- | --- |
| `PROBE_ECLIPSE` | Eclipse folder two levels above this kit | Absolute source folder; independent of shell cwd |
| `PROBE_OUT` | `D:/fitway-temp/eclipse-probes` | Output folder; absolute overrides recommended |
| `PROBE_PORT` | `3178` | Loopback HTTP port (use 3178 or 3179 in this worktree) |
| `CACHE_CONTROL` | `no-store` | `SRV.cc`: `none` omits the header; other values are sent |
| `PROBE_VARIANTS_ROOT` | unset | Optional parent of extracted variant worktrees: `<root>/<variant>/<Eclipse path relative to worktree>` |

Set `PROBE_OUT` to a distinct `D:/fitway-temp/<run>/` for independent runs.
The kit rejects outputs inside any Git working tree, including `.git` files
in linked worktrees and targets hidden behind existing or dangling
symlinks/junctions. Output names
must remain inside `PROBE_OUT`; `shot()` cannot override its guarded path.
Importing with a forbidden `PROBE_OUT` fails before any output is created.

`startServer({ variants: { base: absoluteEclipseFolder, new: anotherFolder } })`
serves explicit variant folders at `/base/` and `/new/`. `/` and `/current/`
serve `PROBE_ECLIPSE`. `urlOf(variant, query, page)` selects a variant, and
`open(browser, { transport: 'file' | 'http', ... })` selects a transport.
All servers use one implementation; `serve(dir, port, { cache })` is the
Reports-compatible entry point. Bind failures reject instead of hanging. A busy
port exits the smoke run non-zero with one error line naming the port and a
`PROBE_PORT` alternative.

`overflowProbe()` retains the original clipping, class-specific and viewport
checks, and also measures rendered text against every containing element's own
border box. Text spills greater than 1 CSS pixel are named by a unique selector,
with `textOverflow` amounts in CSS pixels for left/right (horizontal writing) or
top/bottom (vertical writing) and `overflow` as the largest amount. RTL text is
measured by its rendered bounds. Results are not capped. Intentional `.sr-only`
text and hidden content are excluded; glyph ascent/descent beyond a tight
line-height is not an inline text spill. Generated pseudo-element text and native
input values do not have DOM text ranges.

`SRV` retains `cond` (`false`, `true`, `lm`, `etag`), `fontHold` (milliseconds,
subset-to-milliseconds map, or `{ afterFp: milliseconds }`), `scriptDelay`,
`hook` (`404`, `hang`, or null), and `fp`. For `afterFp`, call `armFp()` and
resolve its returned binding with the page's first-paint epoch. `newPage()`
also supports Playwright route holds through `fontDelayMs` (number/function).
`fontCache: false` registers a font route, disabling the context HTTP cache.
The `sleep()` export is a font/script simulation delay, not a job monitor.

Harness contract checks (fixtures remain in the output folder):

```powershell
& 'C:/Program Files/nodejs/node.exe' (Join-Path (& git rev-parse --show-toplevel) 'design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/checks.mjs')
& 'C:/Program Files/nodejs/node.exe' (Join-Path (& git rev-parse --show-toplevel) 'design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/overflow-checks.mjs')
```

## Exports (one line each)

- `chromium`: Playwright Chromium from this worktree; font library.
- `WORKTREE`: enclosing worktree resolved from the kit; new configuration helper.
- `E`: absolute configured Eclipse folder; font/Reports configuration merged.
- `ROOT`: alias of `E`; review configuration retained.
- `OUT`: configured guarded output folder; lane accessibility output made portable.
- `FRAMES`: alias of `OUT`; review configuration retained.
- `PORT`: validated `PROBE_PORT`, default 3178; font/review configuration merged.
- `ORIGIN`: loopback HTTP origin; font library.
- `assertOutsideGit(path)`: reject output in any Git tree after resolving links; new guard.
- `outputPath(name)`: prepare a guarded output file within `OUT`; new guard.
- `sha(bytes)`: SHA-256 hex digest; font library.
- `sleep(ms)`: simulated font/script delay; font library.
- `SRV`: mutable server cache, font-hold, delay and hook controls; font library.
- `SERVER_LOG`: HTTP request/status/hold timing records; font library.
- `setServerHook(fn)`: replace the server hook; font library.
- `subsetOf(url)`: extract Readex font subset name; font library.
- `armFp()`: deferred first-paint epoch for font holds; font library.
- `startServer(options)`: shared direct/variant HTTP server; font/review implementations merged.
- `serve(dir, port, options)`: Reports-compatible wrapper of the shared server; Reports library.
- `LOCAL_FONT_RE`: direct/variant local HTTP woff2 matcher; font library expanded.
- `launch(options)`: launch Chromium; font library.
- `warmFonts()`: legacy no-op returning 0 for local fonts; font library.
- `fontSubsets()`: legacy no-op returning an empty object; font library.
- `newPage(browser, options)`: fresh context/page, events and route font holds; font library.
- `urlOf(variant, query, page)`: direct/variant HTTP page URL; font library expanded.
- `Q(lang, state, extra)`: Daily query-string helper; font library.
- `introSettled(page, timeout)`: wait until Daily intro is neither pending nor running; font library.
- `introRunning(page, timeout)`: wait for running/done/off intro state; font library.
- `openReports(browser, url, options)`: open a supplied URL and wait for page/fonts/intro readiness; Reports library.
- `open(browser, options)`: open Daily/Reports via file or HTTP with locale and intro settings; review library.
- `shot(page, name, options)`: screenshot to guarded `OUT/<name>.png`; review library.
- `writeJson(path, value)`: write UTF-8 JSON inside guarded `OUT`; font library.
- `HIDE_PULSE`: CSS hiding the chart ping; font library.
- `holdBySubset(spec)`: route delay callback from a subset map; font library.
- `holdProof(log, spec)`: require an observed adequately held font for every named subset; font library corrected.
- `med(values)`: upper median of non-null/non-NaN numbers; font library.
- `rng(values)`: median and min–max display string; font library.
- `overflowProbe()`: browser-side page-wide text spill plus Reports/Daily clipping/viewport measurement; Reports library extended.
- `geometryProbe()`: browser-side Daily plot, tooltip and top-mark geometry; lane `geom.mjs` extracted.
- `accessibilityProbe(page, options)`: Daily ARIA snapshots, keyboard/readings and label-change control; lane `a11y.mjs` extracted.

## Sources and resolved differences

- Font library: `D:/fitway-temp/fonts-r1-verify/probes/lib.mjs`.
- Reports library: `D:/fitway-scratch/reports/work/probes/lib.mjs`.
- Review library: `D:/fitway-scratch/review/tools/lib.mjs`.
- Lane geometry/accessibility: `D:/fitway-scratch/lane/work/geom.mjs` and `a11y.mjs`.

Conflicts resolved once: `chromium` used different hard-coded package paths;
the enclosing package now wins. Font `ROOT` was a variants workspace whereas
review `ROOT` was an Eclipse folder; `ROOT` now means Eclipse, with optional
`PROBE_VARIANTS_ROOT` retaining extracted-worktree layout. Font `E` was relative
while Reports `E` was absolute; `E` is now absolute and the variant suffix is
derived privately from the kit. Font `PORT` used `PROBE_PORT`/3176 whereas
review used `PORT`/3178; the maintained name is `PROBE_PORT`/3178.
Both `startServer` definitions differed: the font server's controls/logging
win, with the review server's direct-folder URLs and the Reports `serve`
signature supported by the same implementation. Reports `BASE` pointed to a
specific historical extraction; it is omitted in favor of explicit variants.

Behavior tightened while consolidating: all writes are guarded, `open()` and
`openReports()` share readiness/event collection and wait for intro settlement
rather than fixed 120/150 ms pauses. Console messages of every type are collected
(font/Reports behavior wins over review's error-only filter). `fontCache` was
unused in the font source; false now installs a route. `holdProof()` no longer
passes for a missing named subset. Conditional responses only use validators
actually enabled by `cond`. Geometry and accessibility retain the original
measurements as callable exports; their old CLI version/locale/state loops and
cross-version diff aggregation are left to callers. No other one-off scripts
or Python helpers were imported.
