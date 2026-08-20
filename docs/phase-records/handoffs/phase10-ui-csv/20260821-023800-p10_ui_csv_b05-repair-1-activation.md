# Phase 10 UI/CSV b05 — repair 1 activation

- Recorded: 2026-08-21 02:38 +03:00.
- Candidate: `aef8f14f24adfdefa176a99419fdb6bedc3b0498` on `codex/phase10-ui-csv-b05`.
- Status: `IN_PROGRESS`; validation repair attempt `1/2`.
- Repair writer route: OpenCode Go / DeepSeek V4 Pro, variant `high`, one bounded external leaf writer.
- External-processing authority: `docs/phase-records/handoffs/coordinator/20260821-021800-fitway-external-worker-authorization.md`; no secret, credential, `.env`, private-data, or trace material is in scope.

## Failed gate and control

The exact b05 self ladder passed focused Vitest `43/43`, workspace types, repository invariants,
Biome, fast verification (`61` files / `447` unit tests and `117` simulator tests), focused Phase 10
integration `10/10`, and focused Chromium `5/5`. The marked Phase 10 profile then passed its unit,
simulator, integration, and `28/30` browser checks but failed the two frozen Phase 11 Arabic desktop
canonical element screenshots:

- audit: `6039` pixels, ratio `0.01`;
- health: expected `1344x850`, actual `1344x849`, `8387` pixels, ratio `0.01`.

The same focused two-test command failed identically twice at b05 and passed `2/2` at immutable b04
`cd4c0fb` in the same current environment. No snapshot or frozen sibling source changed.

## Independent diagnosis and repair boundary

The route-first v1.4.1 comparison selected the newly authorized external route because this was a
source-only, non-secret, deterministic, bounded diagnosis with no Paper or native-only tool need;
the external and native candidates were materially comparable. The read-only V4 Pro worker found
Stage 1 `13992d3` first responsible: the new `operations-page-heading__copy` wrapper stopped the
canonical direct-child eyebrow and description rules from matching. The Arabic heading therefore
acquired default paragraph margins/size and an inline description, shifting frozen daily sections to
a fractional vertical origin and changing element-screenshot rasterization. Stage 2 `10a064a` was
exonerated.

Repair 1 may edit only:

- `apps/web/src/components/owner/reporting/owner-reporting.css`, restoring the canonical scoped
  eyebrow/description styles inside the analytics copy wrapper; and
- `tests/browser/phase10-ui-csv.browser.spec.ts`, adding computed-style assertions at the actual
  regression seam.

No route, Phase 11 file, global token, Paper node, canonical screenshot, package/config, contract,
schema, migration, API, data semantic, or copy may change. The decisive gate is the frozen two-test
control plus the full focused b05 Chromium spec, focused reporting Vitest, types, diff/clean-tree
checks, followed by the complete self ladder. A second source recurrence may consume attempt `2/2`;
a third is terminal `FAILED_VALIDATION`.
