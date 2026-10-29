# ADR-010: Public composition authority is superseded for redesign

- Status: Accepted by human decision (owner-design-exploration-r04 DECISIONS item 98)
- Date: 2026-10-28
- Supersedes ADR-007 in part, limited to Public composition authority; follows ADR-009's pattern for the `public`
  surface
- Amended 2026-10-29: the redesign's tie to Eclipse narrowed to FITWAY's identity
  (`docs/phase-records/handoffs/public-redesign/DECISIONS.md` items 3 and 4)

## Context

Until this ADR the public crowd page was under Paper composition authority: `docs/design/VISUAL_AUTHORITY_STATUS.md` (§"Register",
row `public`, `ACCEPTED_PAPER_AUTHORITY`), ADR-007, and `DESIGN_GUIDE.md` §15 item 7. On 2026-10-27 the user said the
old public page's design is bad and that the page will be redesigned
(`docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 90). Item 90 framed the redesign as the
public page in the Eclipse concept's style, built from the same sheet as the Owner pages; on 2026-10-29 the user
narrowed that to FITWAY's identity (public-redesign DECISIONS item 3). The user asked the
coordinator to write an ADR that makes Paper reference-only for the public page, as ADR-009 did for Owner (item 90,
P7, «اي»), and to see it, the amendments and the milestone before any design.

## Decision

1. **The current Public visual composition is not approved as the design to preserve.** The surface is `public`.
2. **The previous Public composition authority is superseded.** The Public Paper compositions (the route authority
   manifest's `surfaces.public`, area `PUBLIC CROWD BOARD PRODUCTION SET — CURRENT`), their accepted canonical routed
   screenshots and the accepted-case authority mappings are superseded as composition authority. They remain
   immutable provenance and comparison references only. They must not constrain the redesign, must not be cited as
   acceptance authority, and must not be used to reject a redesign for differing from them.
3. **No Public composition authority is in force** until a new concept is approved through the concept-selection
   gate and the perceptual-promotion gate in `docs/WORKFLOW.md` ("Design work: authority, concepts, and perceptual
   gates"). The per-surface state is recorded in `docs/design/VISUAL_AUTHORITY_STATUS.md`.
4. **The redesign carries FITWAY's identity.** Dark, FITWAY red, the light (Eclipse's lights, as the gym's own), and
   Readex Pro at real weights only; the Owner pages' rules (Eclipse `DESIGN-SPEC.md` §1) are a reference for that
   identity only. It records its own rows in Eclipse's §6 and runs as its own milestone, not as part of the Owner
   exploration.
5. **Login and Staff composition authority under ADR-007 is unaffected**, and so is ADR-009 for the Owner surfaces.
   Paper remains the visual source of truth for every surface where ADR-007 applies and no supersession is recorded.

## What remains binding

Nothing in this ADR changes behavior, semantics, or non-visual contracts. In particular:

- `FITWAY_PRODUCT.md` and `SPEC.md` behavior, data semantics, privacy and security remain binding: no visitor
  identity, image, video, frame, biometric or per-visitor data; the capacity-free public contract; the public cache
  and privacy rules of ADR-005; the six operational states and their truthfulness (stale, absent, closed or loading
  data never looks live).
- Western digits, the 12-hour clock in gym time, Arabic RTL as the default with English LTR, the responsive matrix
  320-1440 with no document-level horizontal overflow, and the accessibility baseline remain binding.
- The accessibility rules the 28-bar section carries hold for whatever level mark replaces it: one accessible name,
  decorative parts hidden, no numeric ARIA, progression in reading direction, the signal from `band` only, the
  written label visible.
- The lightweight rule holds from the start: no canvas, WebGL, `requestAnimationFrame` loops or video.
- A state switch for the demo exists only in the concept and the demo page and never ships (`SPEC.md`'s
  "Implementation authority and fidelity contract": mockup-only content must not ship).
- Where the redesign needs a look-line of `FITWAY_PRODUCT.md`, `DESIGN_GUIDE.md` or `SPEC.md` to change (the 28-bar
  signal, Cairo, the static atmosphere, "live data do not animate", the count's label, the stale gap), the change is
  an amendment the user accepts line by line; this ADR does not change those lines by itself. Until an amendment is
  applied, the shipped page keeps the line as written.
- Approval and promotion remain separate: no baseline, canonical, manifest or authority hash is regenerated, promoted
  or silently changed by this ADR or by the redesign. Canonical promotion remains a separate serialized action
  requiring explicit human approval.

## Copy handling

Wording that exists only in superseded Public frames becomes reference, not authority. Copy required or locked by
`FITWAY_PRODUCT.md`, `SPEC.md` or the message catalogs remains binding unless an accepted amendment changes it (the
count's label, item 90: «داخل الصالة الآن · تقريبًا» / "Inside now · approx.", replacing `العدد التقريبي`).

## Canonical screenshots

Until an approved redesign replaces them through the separate human-approved promotion pass, the existing Public
canonical files remain regression evidence of the current implementation. They are not design authority and cannot
reject a redesign for differing from them.

## Consequences

- `docs/design/VISUAL_AUTHORITY_STATUS.md`, row `public`: "Public composition redesign authorized — composition
  authority vacant; prior composition and canonicals reference-only (ADR-010)".
- `DESIGN_GUIDE.md` §15 item 7 ("Paper still governs Public") is amended to name ADR-010.
- Future sessions must not cite the superseded Public Paper frames or the Public canonical screenshots as Public
  composition authority.
- The redesign's milestone owns the Public concept; its packet's visual fields resolve the surface status.

## References

- Decision record: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 90, 96, 97 and 98;
  `docs/phase-records/handoffs/public-redesign/DECISIONS.md` items 3 and 4
- Line sort of the three files: `D:/fitway-temp/owner-r04-public-rules-sort/REPORT.md` (provenance only)
- ADR-007 (`docs/adr/ADR-007-paper-visual-source-of-truth.md`), ADR-009
  (`docs/adr/ADR-009-owner-composition-authority-supersession.md`)
- Per-surface register: `docs/design/VISUAL_AUTHORITY_STATUS.md`
