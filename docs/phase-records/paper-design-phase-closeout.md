# Paper design phase closeout and authority reconciliation

- Status: `RECORDED` — documentation and coordinator state only
- Date: 2026-08-06
- Branch / worktree: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry`
- Base commit: `6cc6d6a59b39d97efd299099dcadeefc45b13838`
- Decision record: [ADR-007](../adr/ADR-007-paper-visual-source-of-truth.md)
- Preserved source: [the closing Paper handoff](../archive/handoffs/HANDOFF-paper-design-phase-close-20260805.md)

A design phase ran in Paper and closed on 2026-08-05 with four approved production families. The
repository never recorded it, so ADR-006's theme snapshot and the Paper file were both current
visual authorities at once. The HUS-2 repository audit found the contradiction; Hussein resolved
it on 2026-08-06. This slice writes the resolution into the repository and restores repository
verification. **It implements no production family and approves no candidate.**

## What was decided

Paper is the visual source of truth. The approved system is
`09 — FITWAY FINAL SYSTEM — G3 ADAPTIVE GLASS + OWNER ANALYTICS` in Paper file
`FITWAY UX Exploration` (`01KYPX5AF950XZVVDD88B6J7QB`, `Page 1`). The four approved CURRENT
families are `OWNER DAILY ANALYTICS`, `STAFF MONITORING`, `LOGIN`, and `PUBLIC CROWD BOARD`
`PRODUCTION SET — CURRENT`. Paper supersedes ADR-006 for visual composition only; the repository
remains authoritative for behavior. ADR-007 carries the full statement — this record does not
restate it.

## What this slice changed

**Coordinator state.** `pnpm check:repository` failed on the expired `phase5-staff-ui` lease.
Renewed `leaseExpiresAt` to `2026-08-13T21:00:00+03:00` with a matching heartbeat and
`sharedLeases` "exclusive through" date, repointed `handoff` at the human-visual-verdict record,
and corrected an `ownerSession` that still read "UI work unlaunched" under five candidate
commits. Status stayed `READY`; no gate, owned path, forbidden path, or lease scope moved.

**Authority.** Added ADR-007; marked ADR-006 superseded in part with its decision body preserved
unedited; added the `paperAuthority` block to the approval manifest outside its hash-verified
sections; pointed `DESIGN_GUIDE.md`, `AGENTS.md`, and `README.md` at ADR-007 instead of
restating the split.

**Documentation.** Four untracked root files were migrated so none remains a competing
authority. See [the archive migration table](../archive/README.md) for the classification of
each and where its content went.

**Scope note for the closeout diff review.** `PROJECT_STATE.yaml` and
`visual-direction-gate/**` are in this branch's `forbiddenPaths`. Editing them here was
explicitly human-authorized for this reconciliation and for nothing else.

## Preserved open questions

None of these is resolved here. Each belongs to a later bounded slice.

1. **Five files outside `phase5-staff-ui` ownedPaths and shared leases.** Commit `6cc6d6a`
   touched `apps/web/src/components/staff/messages.ts`,
   `apps/web/src/components/staff/operational-snapshot-view.tsx`,
   `apps/web/src/components/staff/staff.css`, `apps/web/src/i18n/messages/ar.ts`, and
   `apps/web/src/i18n/messages/en.ts`. Four of the five are named in `forbiddenPaths`. They are
   **not** retroactively authorized; the question waits for a review of their exact diff in the
   Phase 5 closeout.
2. **`pnpm verify:fast` cannot pass on this branch.** `apps/server/src/command-repository.test.ts`
   (added by `67feb96` under the slice's shared lease) imports `packages/db` at module scope, so
   `packages/env` validation throws without `DATABASE_URL`. It passes under
   `SKIP_ENV_VALIDATION=1`. Pre-existing and independent of this slice; owned by phase5-staff-ui.
3. **The registered `phase5-staff-ui` verification profile omits the leased integration file.**
   `scripts/verify.mjs` lists no `integrationFiles` for the slice, so
   `apps/server/src/phase5-staff-recent-commands.integration.test.ts` runs only when invoked
   directly. Recorded in the blocked handoff and still true.
4. **Whether the approved Paper Staff family omits command controls.** The archived surface
   inventory asserts a commands panel and reset confirmation dialog are "never to be built".
   `SPEC.md` story 14 and its correction/reset contracts, `PHASES.md` Phase 5,
   `DESIGN_GUIDE.md` §11, and the integrated `phase5-command-domain` all say otherwise, so the
   document loses. But if the approved Paper Staff production genuinely has no command surface,
   that is a real Paper-versus-Spec product conflict and therefore `NEEDS_HUMAN`. No Paper
   inspection was performed in this session.
5. **The per-surface Paper-versus-`DESIGN_GUIDE.md` conflict list does not exist.** ADR-007
   records the authority order, not a diff. Establishing which guide sections, tokens, or
   manifest entries an approved Paper family materially conflicts with is implementation-phase
   work.

## Verification

`pnpm check:repository` passes. `pnpm verify:fast` clears repository invariants, Biome, and type
checks, then stops at item 2 above. No application, test, screenshot, Paper, or asset file was
changed by this slice.
