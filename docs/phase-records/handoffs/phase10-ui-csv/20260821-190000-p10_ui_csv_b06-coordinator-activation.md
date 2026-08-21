# Phase 10 UI/CSV b06 — approved CSV prose relocation successor

- Recorded: 2026-08-21 19:00 +03:00.
- Status: `IN_PROGRESS`; one fresh bounded successor, repair budget `0/2`.
- Main activation baseline: `main` at `6571ba7f3ea7b559244e8598387eebd5d8f3e88d`; this activation records `baseCommit: SELF`.
- Branch / worktree / run ID: `codex/phase10-ui-csv-b06` / `D:/Projects/fitway-worktrees/phase10-ui-csv-b06` / `p10_ui_csv_b06`.
- Preserved predecessor: `phase10-ui-csv-b05` remains terminal `FAILED_VALIDATION` at repair `2/2`; candidate `bf44049ae28eace32cd2d1a506f48fd17c4c3f71` is immutable and unintegrated.

## Human decision and exact successor objective

The human approved preserving `csvDescription` and `csvPrivacyNote` unchanged in meaning while moving both out of the CSV control board into appropriate visible section prose immediately beneath the reporting/CSV board pair. This rules out a third b05 repair, hiding or shortening either sentence, redesigning the reporting UI, changing catalogs or semantics, or accepting the extra structural board row as a permanent deviation.

The successor carries `bf44049` non-destructively, removes only that prose row from the export board, places the same two localized messages as section prose after the board pair, and recovers the approved compact two-row board composition. It may close the recorded section-level overflow assertion gap only where that assertion truthfully passes for this same surface without changing product behavior or broadening the fix.

## Route-first selection

- Delegation reason: economy and recoverability for one precise, isolated, reversible implementation stage; the parent retains diff/test review and integration.
- Selected: stable candidate `ox-alpha`, resolved route `opencode/x-preview-f-free`, variant `high`; shared registry revision `2026-08-21.3`, Ox evidence revision `2026-08-21.4`.
- Live preflight: OpenCode `1.18.20`; the route resolves `active` as `Ox Alpha Free (Unlimited)`, reports zero input/output cost, exposes `high`, and remains qualified for supervised bounded repository writes plus shared Playwright browser operations.
- Comparison: native Terra, DeepSeek V4 Pro, and GLM-5.3 are eligible and materially comparable for this precise medium-consequence leaf. None has a concrete task-specific capability, tooling, review-cost, or reliability advantage, so the active temporary Ox availability/economic preference applies. MiniMax M3 is filtered because browser finalization is unqualified and high reporting precision is material.
- Controls: JSON event capture; exact-session no-tool finalization when compact final text is absent, then `opencode export` fallback; no `--auto`; external skill scanning disabled; deny-by-default exact skill allowlist `[]` (no skill body is transmitted); isolated worktree; no worker commit; parent diff and focused-test review before any next writer.

## Ownership, rollback, and constraints

The activation commit is the coordinator rollback boundary. The non-destructive merge of `bf44049` is the carry rollback boundary. The implementation must remain one uncommitted external-worker change until the parent gate accepts and commits it.

Writable source/test files are exactly:

- `apps/web/src/components/owner/reporting/owner-reporting-section.tsx`;
- `apps/web/src/components/owner/reporting/owner-reporting-export.tsx`;
- `apps/web/src/components/owner/reporting/owner-reporting.css`; and
- `tests/browser/phase10-ui-csv.browser.spec.ts`.

The worker may read non-secret repository files and use repository read/write, shell, and the already-qualified shared Playwright browser operations. It must not read or transmit `.env` contents, credentials, personal/private data, secrets, canonical screenshots, or any external path; install or reconfigure tools; delegate; edit Paper; update baselines; touch route/catalog/token/contract/API/database/config/shared state; commit; push; or deploy.

## Acceptance and proportional verification

Pass requires all of the following:

1. Both messages remain rendered once, unchanged through their existing localization keys, in visible section prose directly beneath the board pair; the export board no longer contains `.owner-reporting-board__aside` or any third supporting row.
2. Default-state control boards retain the approved two-row skeleton, geometry, G3 material, equal-height desktop pairing, mobile stacking, EN LTR / AR RTL behavior, and responsive containment already accepted from b05; desktop boards recover `664x131` at 1440 and the focused browser checks record the actual compact mobile geometry at 390 without an extra prose row.
3. Existing fieldset/legend names, labels, `aria-describedby` IDREFs, error/live states, CSV lifecycle, keyboard/focus behavior, 44px targets, copy, and responsive behavior remain intact.
4. The existing nine-width/two-locale responsive test invokes the strict section-level overflow assertion unless fresh evidence proves the recorded assertion is outside this residual; no clipping may be masked by root/body overflow rules.
5. Diff and status contain only the four source/test files above before the worker returns.

Worker self-verification is the smallest sufficient focused set: `git diff --check`; focused reporting Vitest for the three existing reporting test files; workspace type check; focused Chromium `tests/browser/phase10-ui-csv.browser.spec.ts` in both locales and its geometry/a11y paths; and live Playwright geometry at 1440 and 390. Long events, screenshots, and logs remain in the predeclared external evidence directory. Environment-only blockers are escalated without reading `.env` or widening scope.

After the worker barrier, the coordinator independently reads the complete diff, confirms forbidden paths are unchanged, reruns the decisive focused checks, and obtains one fresh read-only independent successor gate covering diff/scope, requirements, EN/AR geometry, accessibility/copy, and the relevant Playwright regression. A passing candidate may then be integrated and recorded under b06 only. Stop after the resulting Phase 10 frontier; do not start S3 or any later stage.

## Blockers

None at activation.
