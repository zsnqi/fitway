# Phase 10 UI/CSV b05 — repair 2 activation

- Recorded: 2026-08-21 03:25 +03:00.
- Candidate: `4e991ce714be454409a612b812214216554e82b7` on `codex/phase10-ui-csv-b05`.
- Status: `IN_PROGRESS`; final validation repair attempt `2/2`.
- Failed gate: fresh independent Paper fidelity review; integration has not begun.
- Repair writer route: native Codex, Terra / high, one bounded leaf writer.

## Finding and retained passes

The exact self ladder passed focused Vitest `43/43`, workspace types, repository invariants,
Biome, fast verification (`61` files / `447` unit tests and `117` simulator tests), focused Phase 10
integration `10/10`, focused Chromium `5/5`, the marked Phase 10 profile `30/30`, and the mutation
guard. A fresh read-only fidelity reviewer then rejected only the reporting/CSV control-board
density. Candidate boards are roughly `350px` high at desktop and `300–420px` on mobile, while
current Paper renders compact direct G3 surfaces at `664x131px` on desktop and `358x183px` /
`358x198px` on mobile.

The same reviewer independently confirmed that the heading/tab seam, approved right-side Arabic
heading, inherited Cairo 400–700, removed History hairline, labelled-region-only horizontal scroll,
narrow containment, synchronized heatmap selection/roving tabindex/DOM focus, and frozen daily
siblings all pass. Repair 2 must preserve those results and every repository-owned string,
description, privacy note, error, range action, lifecycle, state, and accessibility relationship.

## Current Paper measurement and bounded repair

Read-only Paper file `01KYPX5AF950XZVVDD88B6J7QB`, Page 1, current reporting area `17YY-0`,
token hash `3b0faca3`, was re-read after the rejection. The approved desktop boards use a `22px`
heading/metadata row, `12px` gap, and one `63px` field/action row inside `16px 18px` padding. The
approved mobile boards keep the two date fields side by side in a `63px` row and place the action in
a `44px` row inside `16px` padding. This is a content-flow and density repair, not permission to set
a brittle fixed board height, truncate localized copy, remove controls, hide privacy information,
or copy the Paper mobile typography anomaly.

Repair 2 may edit only:

- `apps/web/src/components/owner/reporting/owner-reporting-section.tsx`;
- `apps/web/src/components/owner/reporting/owner-reporting-export.tsx`;
- `apps/web/src/components/owner/reporting/owner-reporting.css`; and
- `tests/browser/phase10-ui-csv.browser.spec.ts` for exact default-state density/flow regression
  coverage.

Use the smallest semantic restructure and logical CSS needed to place headings/metadata, paired
date fields, actions, hints, and privacy copy in the compact approved flow. Preserve all form,
fieldset, legend, label, IDREF, error/live-state, abort/download, focus, and 44px target behavior.
No route, heatmap implementation, message catalog, global token, Paper node, canonical screenshot,
package/config, contract, API, database, migration, data semantic, or other milestone path may
change.

## v1.4.1 route-first result and terminal rule

The native and newly authorized OpenCode Go / DeepSeek V4 Pro routes were compared before writer
assignment. Although either can perform bounded repository edits, this repair is materially coupled
to fresh live Paper hierarchy, JSX, and computed-style inspection under the FITWAY Paper workflow.
Those native-only tools and current session evidence are a concrete material advantage, so native
Terra / high is selected. The durable external-processing authorization remains active for future
eligible comparable work.

The writer produces one independently revertible Repair 2 commit, then the coordinator reruns the
focused checks, complete b05 self ladder, fresh Paper fidelity review, and a separate fresh candidate
verification. This is the final source-repair allowance: a third source recurrence is terminal
`FAILED_VALIDATION`; environment-only failures do not consume another attempt.
