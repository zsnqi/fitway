# agent-tooling-r01: working-tools: `../briefs/codex-working-tools.md`, result `ca0e12da` on `tooling-working-tools` (from `f5198aa3`), DeepSeek V4.1 Flash, level `max`; builder `91a6a0d5`; merged `a66e5955`

- **Scope (agent-tooling DECISIONS item 24):** `pnpm verify:owner serve` (W1); free sizes `<width>x<height>[@d]` in
  `frames` and `run`'s `newPage` (W2); `frames --actions` and `--clip` (W3); `run`'s `ready` and `shot` with one
  concept (W4); `measure --page` serving the concept itself, with `--args-file` (W5); the SKILL section "CLI working
  loop", the designer, builder and verifier templates, and `pnpm brief:check` refusing a designer, builder or
  verifier brief that names a ui-forensics script path, runs a script or starts a server of its own, or tells the
  agent to serve without `serve` (W6); the real proof on sketch 16 at `0fad27b9` (W7).
- **Measured before the round** (item 24, `D:/fitway-temp/retro-20261102-nav/`): since item 23, `shot.mjs` run 57
  times, own servers 18, ui-forensics called directly 54, against `measure --tool` and `run` twice each.
- **Brief reviews** (`D:/fitway-temp/brief-review/codex-working-tools-1` and `-1-sol`), nine readings, all closed:
  copied wrappers and `python -m http.server` not refused (closed: any script run or server start outside
  `run --script`); a server instruction exempted by a mention elsewhere (closed: per line); fenced commands outside
  the rule (closed: prose and fenced alike); `--lan` printing origins without binding (closed: W7 requests through a
  LAN origin); a spec file keeping its own target URL (closed: refused with `--page`); run scripts re-building their
  infrastructure (closed for the SKILL example and W7's script); the label record without font weight (closed).
- **Run** (`D:/fitway-temp/codex-round-6619e26e-2b88-48d8-b1f7-c2ae89942576`, start load 333,998): three automatic
  resumes; every row PASS but W7, failed only because the model cannot view images; `pnpm verify:fast` passed;
  `D:/fitway-temp/codex-round-working-tools/W7.md`.
- **Diff review** (`D:/fitway-temp/code-review-working-tools-1/`): Sol `xhigh`, six blocking findings, all
  confirmed: `shot` repeating the PNG save, the roles listed in three files, a second port validator in `serve`, two
  first-port helpers, a repeated idle-timeout descriptor, a clip padding parameter every caller fixed.
- **The coordinator's grade on `ca0e12da`** (`GRADE.md` there): 197 verification tests and 39 brief-rule tests pass;
  the coordinator looked at W7's frames (the phone tap and the 1280 x 720 click outline the 6 PM bar in chalk, the
  click bolds its label, both clipped to the day card) and the motion trace (the outline's opacity 0 to 1, settled
  161.7 ms, ease). Four planted defects each fail a test; a fifth (`serve` passing `lan: false`) failed none (C2).
  C1: SKILL's `run ... -- <args>` failed under pnpm ("unexpected argument alpha"). C3: the new rule refused the fix
  brief's own lines naming `serve-command.mjs`, `serve --port` and `node scripts/run-vitest.mjs`.
- **The builder** (`owner-direction-builder`, `D:/fitway-temp/tooling-working-tools-fix-1/BRIEF.md`): `91a6a0d5`, all
  nine; `saveViewport` shared by `frames` and `shot`, `DESIGN_WORK_ROLES` once, the registry holds `serve --port`'s
  range, `firstPortPair` in `core.mjs`, one idle-timeout descriptor, a fixed clip padding, the `run` line written
  `-- --` (proved: `result.json` holds `["alpha","beta"]`), a test for `serve --lan` (fails with the planted
  `lan: false`, re-checked by the coordinator), and the serve-guidance check reading prose with code masked, tracked
  repository scripts allowed. 199 verification tests, 49 brief-rule tests, `pnpm verify:fast` passed.
- **Integration:** merged `a66e5955`; on the merged tree `pnpm check:tooling-map`, `check:code-health`,
  `check:repository` and `check:agent-context` pass.
- **Rows:** W1-W6, K1 and K2 met at `91a6a0d5`; W7 met with the coordinator's look at the frames. Open: F310, F311.
