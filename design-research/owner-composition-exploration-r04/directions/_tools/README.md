# Verification tools for the Owner r04 directions

These are helper scripts from the coordinator and the independent verifier for Eclipse Round 6 and Round 7
step 1. They are committed so that cloud sessions, which see only committed files, can reuse them.

- **Concept tooling only:** they are not production code, tests, or authority.
- **Biome:** Biome excludes this folder, with the rest of `directions/`.
- **Their results:** a script's output is evidence only when the session that runs it has confirmed the tool is
  sound (with a positive or negative control), and has looked at what it produced.

## Before use: paths are hard-coded for the original Windows machine

Most scripts were written on Windows. They contain absolute paths:

- `file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/...` for the page;
- `C:/Users/PCFORC~1/AppData/Local/Temp/claude/...` for scratchpads and the pre-motion reference copy;
- an absolute import of `node_modules/@playwright/test/index.mjs`.

Adapt them before running:

- **Page:** resolve it from the repository, for example
  `new URL("../../eclipse/index.html", import.meta.url).href`.
- **Playwright:** import it bare, as `import { chromium } from "@playwright/test"`. That resolves from the
  repository's `node_modules`.
- **Paths:** pass output and baseline folders as arguments.

## The pixel baseline depends on the machine

`eclipse/evidence/pre-motion-hashes.json` and the reference PNGs were rendered on Windows by Chromium, through
Playwright 1.61. Linux renders fonts differently, so a cloud session **cannot** reproduce those hashes. There:

1. Render the previous commit and the new work in the **same** environment. For example, check out the previous
   commit's `eclipse/` into a scratch folder with `git worktree` or `git show`.
2. Compare those two renders with each other, not with the Windows PNGs.
3. Treat `eclipse/capture.mjs`'s static guard, which compares against `pre-motion-hashes.json`, as valid only on
   the original machine. Do not let a cloud run rewrite `eclipse/evidence/` just because the platform differs.

## Contents

- **`coordinator-r6/`:** the coordinator's Round 6 tools.
  - `static.mjs` + `compare.py` render the 23 still frames in several modes and compare them pixel for pixel.
  - `hover.mjs` measures the marker centre from the DOM against the SVG paths, sampled every 0.2 px. It also
    checks the tooltip value against the axis, pointer snapping, keyboard order, and whether the glide stays
    on the curve. It uses the Round 6 DOM (`.sg-mark`, `.sg-core`).
  - `motion.mjs` checks the first paint, the animations at load, the digit roll (no glyph opacity), the bars,
    delayed, and the header chip.
  - `video.mjs` + `frames.py` + `marks.py` record with Playwright `recordVideo` at 25 fps, with CDP slow
    motion, and decode the video into strips with OpenCV.
  - `fp-probe.mjs` shows that the motion-on first paint equals the still frame only after network idle,
    because a font subset arrives late.
- **`verifier-r7a/`:** the verifier's Round 7 step-1 tools, updated for the marker-form DOM (`geom7.mjs`,
  `glide7.mjs`, `static7.mjs`, `switch7.mjs`, `live7.mjs`, `pulse7.mjs`, `perf7.mjs`, `unchanged7.mjs`,
  `video7.mjs`).
  - It also has circle-fit geometry on rendered pixels (`geom_px.py`) and a control that shifts the marker by
    1 px (`ctl_perturb.py`).
- **`CHECKLIST-r7a.md`:** the checklist the verifier received for Round 7 step 1. Use it as a template, and
  replace its Windows scratchpad paths.

## Known pitfalls

- Use `colorScheme: "dark"` and fresh browser contexts.
- The VP8 video from Playwright ramps up in quality over about the first 2 s, and blips at frames 128–129.
  Neither comes from the page.
- In Git Bash on Windows, `/api` in arguments is mangled into a path. Use PowerShell there.
- On Linux, Python needs `opencv-python-headless`, `numpy`, and `pillow`.
