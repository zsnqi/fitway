# Phase 10 UI/CSV b05 — independent plan review rejection

- Recorded: 2026-08-21 01:55 +03:00.
- Reviewed commit: `c83475f`.
- Route: fresh native Codex reviewer, Terra / high, read-only.
- Verdict: `REJECT`; no implementation is authorized.
- Tree: untouched and clean after review.

## Findings

1. **Blocking:** plan v1 omitted the coordinator-owned `pnpm verify:full` gate required before the integrated b05 milestone may be marked `DONE`. Candidate verification does not replace the post-integration/full-batch gate.
2. **Significant:** the self/verifier Playwright ports and directories were named but the exact `FITWAY_PLAYWRIGHT_*` environment assignments were missing, so the configuration would derive different ports from the run IDs.
3. **Minor:** the focused integration and Playwright steps were descriptive rather than exact commands.

## Accepted portions

The reviewer found the ownership/freeze, two-stage rollback, Paper/repository authority split, Arabic alignment and Cairo exception, G3 board/containment repair, heatmap active-element contract, and ordinary terminal rules otherwise bounded and responsive to the carried defects.

## Required correction

Preserve plan v1 unchanged. Plan v2 must be standalone, add a third coordinator run identity and explicit post-integration `verify:full`/rollback boundary, provide all browser environment assignments including snapshot/webserver handling, and state the exact integration and Chromium commands. Obtain a fresh independent rereview before implementation.
