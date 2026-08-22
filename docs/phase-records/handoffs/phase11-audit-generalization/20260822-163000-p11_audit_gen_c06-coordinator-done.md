# Phase 11 audit generalization — S4 integrated and DONE

- Status: `DONE`. Slice B integrated; the milestone is complete across both slices.
- Integrated commit: `8fef4ec8d2a59b45c041d529e35ba8506de7e3b8`.
- Slice base: `da2abc7`. `main` fast-forwarded from `da2abc7` to the integrated tip; the candidate
  was a strict descendant, so integration is linear and no merge commit exists.
- Slice A remains recorded at `e6c14b56e2adf93cde3361f54d0f913b880da74d`.
- Repair attempts consumed by the c06 repair: 1 of 2.

## What closed the milestone

The c05 stop was an authority conflict, not a validation failure: the effective-count filter select
truncated its default option label at most required widths, the human-approved AR desktop canonical
baseline itself rendered that truncation, and every available fix crossed human visual authority.

The human approver resolved it on 2026-08-22 by choosing option 2 — repair the composition,
preserve the approved EN/AR meaning and behavior, and permit serialized replacement of the affected
canonical baselines after verification. c06 executed exactly that: layout only, no locale string
changed, both owned baselines replaced in one serialized pass on the locked Windows/Chromium
toolchain after the repair was green.

## Independent verification

Fresh verifier, run ID `v11e_audit_gen_r1`, a session that did not produce the candidate.
Verdict: **PASS**, no blocking findings.

The verification was not a re-reading of the candidate record. It reran the full ladder from a clean
run ID and its own disposable database, measured all 90 select-option geometries itself with a DOM
span probe rather than trusting the candidate's canvas measurement, and — decisively — restored the
pre-repair CSS in a live page and ran the candidate's own assertion against it. That negative
control returned 30 overruns in English and 24 in Arabic, reproducing the c05 values to the
hundredth of a pixel, and confirmed the measurement font resolves to `13px Cairo` in all 90 samples
rather than silently falling back to a default. The assertion added by this repair is therefore not
vacuous, which is the exact failure mode the c05 verifier found in the assertion it replaced.

Measured result on the integrated commit: zero overruns across 18 locale x width combinations, every
paired select rendering at exactly its intrinsic width, zero document/body/audit overflow at all 18,
and a minimum partner control of 82px x 44px.

Scope: 31 files, 30 inside `ownedPaths`. Exactly 2 of 12 canonical baselines changed, both owned.
`git diff 70b8bad..8fef4ec` over `messages.ts` is empty — 73 keys per locale, full parity.

## Coordinator rulings on the verifier findings

- **`PROJECT_STATE.yaml` appears in the diff and is named in this phase's `forbiddenPaths`
  ([minor], correctly flagged rather than assumed).** Ruled not a defect. That entry scopes worker
  sessions; `AGENTS.md` and `docs/WORKFLOW.md` assign the file exclusively to the coordinator, and
  the owning session for c06 was the coordinator. The diff changes only `updatedAt` and this
  milestone's own block. The verifier was right to flag it rather than decide it.
- **The 72px partner-control floor is unguarded by any test ([significant]).** Accepted as tracked
  debt, not repaired. The behaviour is correct and measured — 82px x 44px minimum — and the
  acceptance criteria fixed before the work covered select labels only. Repairing it after a PASS
  verdict would invalidate the verified candidate and buy a second full verification round for a
  non-blocking item. Recorded below so the next session that edits this file closes it.
- **The Phase 2 public-live browser assertion is load-flaky ([significant]).** Confirmed
  pre-existing and outside this slice: `apps/server/src/phase2.integration.test.ts:788` was last
  modified at `a0a2739` on 2026-08-11, the candidate touches no public-live file, and the isolated
  re-run passed 9/9 while the full re-run passed complete. c05 disclosed the identical failure on a
  different candidate and run ID; the c06 candidate record did not carry that disclosure forward
  because the coordinator's own first `verify:full` happened to pass. Recorded as repository debt.
- **At 200% zoom the shell header collides and the skip link overlays a stat card ([minor]).**
  Confirmed outside this slice — no shell file is in the diff. The audit section itself reflows with
  no overflow. Recorded as `phase11-shell` debt against the `phase-11` aggregate.
- The remaining minor findings (label-completeness test hardcoding eleven actions, the arrow-lane
  assertion sampling only the first select, the 44px assertion checking height only, and the
  `verify:phase` profile omitting the generalization integration file) are accepted as recorded and
  unrepaired. The first is mitigated by the union type: `messages[entry.action]` and
  `messages[action]` index it, so `tsc` enforces completeness and type checks pass. The last
  concerns `scripts/verify.mjs`, which is coordinator-owned and was correctly untouched by the
  slice; the file it omits passes under `verify:full`.

## Tracked debt carried out of this milestone

1. `apps/web/src/components/owner/audit/owner-audit.css:85` — the `minmax(72px, 1fr)` partner floor
   has no assertion. The next session that edits the audit filter composition should extend the
   width sweep in `tests/browser/phase11-audit.browser.spec.ts` to measure partner-control inline
   size, not only select option fit.
2. `apps/server/src/phase2.integration.test.ts:788` — a 5000ms locator wait on the public live count
   that fails under load. Two independent sessions have now hit it on unrelated candidates. It
   belongs to whichever session next has authority over that file.
3. `phase11-shell` 200% zoom: header collision and skip-link overlay. Carried to the `phase-11`
   aggregate acceptance milestone.
4. `scripts/verify.mjs` — the `phase11-audit` profile does not run
   `apps/server/src/phase11-audit-generalization.integration.test.ts`. Coordinator-owned; the file
   passes under `verify:full` (17 files / 98 tests).
5. The Arabic target-column microcopy calque noted by the c05 verifier. A content matter; no
   authority currently specifies a replacement.

## Canonical baseline provenance

Replaced under the 2026-08-22 human authorization, serialized, on the locked toolchain:

- `owner-audit-ar-desktop-1440x900.png`
  `983755EFF3EDCF4C76A61295D502FA7C2DBC0B38B9C0964E23723803F70AFDBD`
  to `B07D3EB32C088C624B72BA42C362C144CDFCEB144421C78F7B00EAE05DA9FEBF`
- `owner-audit-en-mobile-390x844.png`
  `F5AF4DEF1BA8217E7340604219DF8E01CC5293BD7E2C49102680519F4A421F3C`
  to `10B7C3DB7A6789A90D94DEB2AF15869EB6EC0B0A88EEBB40E20E1D3C0DC3FA1D`

Both were verified by opening them, not by hash alone: each renders the composition the candidate
produces, with no clipped label.

## Preserved history

The c03, c04, and c05 terminal records and candidate `e42b6c4` are untouched. `git diff --check
da2abc7..e42b6c4` still exits 2, as the c05 record states; the integrated range exits 0.

## What this unblocks

`phase11-access` (S5) and `phase11-settings` (S6). The governance audit contract those slices need —
`buildAccessAuditEntry` and `buildSettingsAuditEntry` in `packages/api/src/audit/governance.ts`,
over migration 0007 — is now integrated and independently verified. The Owner lane is released.

## Not verified

- Chromium on Windows only; the repository defines no other engine.
- No manual screen-reader pass; axe reports no serious or critical violations in either locale.
- The widened governance DTO has no end-to-end write path yet, because the access and settings
  writers are S5 and S6 and do not exist. It is exercised through unit, integration, and mocked
  browser fixtures only.
