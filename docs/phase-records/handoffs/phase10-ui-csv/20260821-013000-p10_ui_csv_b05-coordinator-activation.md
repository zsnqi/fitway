# Phase 10 UI/CSV b05 — coordinator activation

- Recorded: 2026-08-21 01:30 +03:00.
- Status: `IN_PROGRESS`; implementation is not authorized until the b05 plan receives a fresh independent PASS.
- Main activation baseline: `main` at `4136580502e3b76ff2a1a9f3056669666e9c028c`; the activation commit records `baseCommit: SELF`.
- Planned branch / worktree / run ID: `codex/phase10-ui-csv-b05` / `D:/Projects/fitway-worktrees/phase10-ui-csv-b05` / `p10_ui_csv_b05`.
- Preserved predecessor: `codex/phase10-ui-csv-b04` remains immutable at `cd4c0fbddf5563cd351a3b2ac7af9e248304d1aa`.
- Fresh source-repair budget: `0/2`; concurrent writers: `0`.

## Human authorization and locked fidelity requirements

The 2026-08-21 human instruction authorizes exactly one fresh bounded b05 successor. The settled direction remains repair to approved Paper, not superseding Paper. In addition to the terminal b04 findings, b05 must:

1. preserve the approved right-side alignment of the Arabic Analytics heading/layout;
2. use the canonical approved FITWAY Cairo Arabic font system from authoritative design/system sources and accepted implementation, not the apparent `system-ui` / synthetic-weight inconsistency in one Analytics Paper mobile specimen;
3. remove the unintended very thin History/navigation-content edge when it is not part of the canonical system treatment; and
4. synchronize heatmap visual selection with the applicable roving DOM/keyboard focus model.

These requirements rule out editing Paper, changing canonical baselines, adding a local font family, changing copy/data/URL semantics, or integrating the rejected b04 candidate unchanged.

## Current authoritative Paper evidence

- File `FITWAY UX Exploration` (`01KYPX5AF950XZVVDD88B6J7QB`), Page 1, area `OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT` (`17YY-0`), token hash `3b0faca3`.
- A fresh read-only render on 2026-08-21 reconfirmed the desktop, 390 mobile, 320, and 200% specimens.
- Desktop heading/local-switch row: `1344x68`; the `160x44` seam is at inline end. Arabic keeps the heading block at the physical/right reading start.
- Mobile seam: `350x44`, full content width beneath the heading.
- Desktop control boards: two equal `664x131` G3 material boards with `16px` gap, `16px 18px` padding, `16px` radius, `blur(22px) saturate(114%)`, approved gradient/edge, and inset lift.
- Mobile control boards: stacked `358px` surfaces with `16px` padding, `28px` radius, `blur(18px) saturate(112%)`, approved mobile gradient/edge/lift.
- The mobile Arabic specimen reports `system-ui` at weight 800 for its heading, while ADR-007 leaves typography/token rules in force and `DESIGN_GUIDE.md`, the approved theme source, and production globals require self-hosted Cairo at real weights 400/500/600/700. The repository authority therefore governs this explicit human typography requirement.

## Carry-forward and writable boundary

- Create b05 from the activation commit, then merge the complete immutable b04 candidate at `cd4c0fb` non-destructively. The b04 ref and records do not move.
- The merge commit is the carry rollback boundary. After it lands, inherited backend/API/contracts/tests and all other paths outside b05 ownership are frozen.
- Repair ownership is limited to reporting components, the reporting hook/tests, the Phase 10 browser spec, and b05 records. The exclusive route lease permits only the Owner Analytics heading-row/local-switch composition in `apps/web/src/routes/admin.tsx`.
- No migration, schema, API contract, repository, catalog, global token, canonical screenshot, Paper, root configuration, or unrelated phase change is authorized.

## Required plan, verification, and closure

1. After the exact carry merge, author a bounded b05 plan against the actual candidate and current Paper render. It must state rollback, exact focus semantics, the expanded-disclosure width check, and test assertions for `document.activeElement`.
2. Obtain a fresh independent read-only plan-review PASS before assigning one authoritative implementation writer.
3. Self-verify focused component/hook tests, type/build, `verify:fast`, run-unique disposable Phase 10 integration, focused Playwright, and `verify:phase --phase phase10-ui-csv`.
4. Complete the UI polish loop across 320/360/390/721/768/820/1024/1200/1440 in English LTR and Arabic RTL, including expanded disclosure, keyboard/focus, reduced motion, 200% reflow, accessibility, and document/content overflow.
5. Obtain a fresh read-only rendered Paper fidelity comparison and a separate fresh independent candidate review. Neither may repair the candidate.
6. On PASS, integrate b05 to `main`, mark b05 `DONE`, release leases, and continue with authoritative S3. A genuinely new material visual disagreement or authority conflict is `NEEDS_HUMAN`.

## Blockers

None. Next stage: commit this coordinator activation, create the isolated b05 worktree, and perform the non-destructive carry merge.
