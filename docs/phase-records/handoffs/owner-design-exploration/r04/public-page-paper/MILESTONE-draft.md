# public-redesign-r01: the milestone, as proposed

> **Draft for the user's acceptance** (owner-design-exploration-r04 DECISIONS items 90 (P7) and 96 (2)). On acceptance
> the coordinator adds the ledger entry below to `PROJECT_STATE.yaml`, writes the task packet
> `docs/phase-records/task-packets/public-redesign-r01.yaml` (task class `visual-authority-change`, the r04 packet's
> shape) and the first resume point with `pnpm handoff:new`, and narrows r04's owned paths in the same commit. Nothing
> here is in force before then.

## What it is for

The public crowd page redesigned in the Eclipse concept's style, concept-only, for the demo (DECISIONS item 84: Settings,
then the public page, then the demo's polish). Production, the canonicals, Paper and the shipped public page stay as
they are until a separate promotion.

## What it must deliver (the user's answers, item 90)

- Dark («الثيم اصلا داكن»), Readex Pro, built from Eclipse's §1 foundations; its rows recorded in `DESIGN-SPEC.md` §6.
- The count's label «داخل الصالة الآن · تقريبًا» / "Inside now · approx." (GLO-2); Packed is «شديد الازدحام».
- No verdict line; no typical-day chart for now.
- The demo's states (loading, fresh, stale, closed, unavailable, error) on one page with a hidden switch that lives
  in the concept and the demo page only.
- The last update absolute while live, absolute with its age when stale; the stale threshold as the accepted Spec
  amendment sets it.
- The level mark replacing the 28 bars is picked by the user by eye from several forms the round draws (Eclipse's
  four-bar badge with its word among them), with the old signal's accessibility rules.
- Digits roll only when a new live reading arrives: never on opening, never while stale or closed, never under
  reduced motion. Any other motion (an intro, the level mark's own) is decided by watching it.
- The frame: no Owner rail, bar or header; the brand, the language switch, the gym's name as fixed text, and
  «إعادة المحاولة» in the error state only.
- No canvas, WebGL, `requestAnimationFrame` loops or video; one check that the page runs smoothly on the phone the
  demo is shown on (the measured budget on a slow phone waits until after the demo).
- The markup that costs nothing for screen readers (the accessible name, decorative parts hidden, one announcement of
  a new reading); testing with a real screen reader waits for production, where `SPEC.md`'s acceptance keeps it.
- Arabic RTL and English LTR, each composed for its reader; 320-1440 px with no sideways scroll.

## How it runs

The r04 way (its DECISIONS "How this milestone's rounds run"): a skeleton first, shown to the user (rounds item 8);
then the design round, a fresh `owner-direction-designer` and an `owner-direction-verifier`, split into parts so no
designer's context grows large (rounds item 10); errors fixed before the user sees the page (rounds item 11); the user
accepts by eye. The same coordinator session runs it beside r04.

## Where the work lives (a choice for the user)

**Recommended: in Eclipse's folder on the build branch.** The page is built from the same sheet as the Owner pages, so
its files sit beside them (`public.html`, `public.css`, `public.js`, `PUBLIC-SPEC.md`, `public-capture.mjs` in
`design-research/owner-composition-exploration-r04/directions/eclipse/`), using `shared.css`, the fonts and the
shared frame's foundations directly. r04 gives those paths up, and `DESIGN-SPEC.md` §6 is written through a
coordinator lease from r04. The rounds run in a worktree of their own off `owner-followup-r04-build`, merged into it
by the coordinator.

*Other way:* a folder of its own (`design-research/public-redesign-r01/`), cleaner ownership, but it copies or
reaches into Eclipse's shared files, and a copied sheet drifts.

## The ledger entry (proposed)

```yaml
  public-redesign-r01:
    status: IN_PROGRESS
    objective: >-
      Redesign the public crowd page, concept-only, in the Eclipse concept's style from its shared foundations, as the
      user decided (owner-design-exploration-r04 DECISIONS item 90): present it for the user's acceptance by eye, and
      leave production, canonical, Paper and the shipped public page unchanged.
    taskPacket: docs/phase-records/task-packets/public-redesign-r01.yaml
    dependencies:
      - owner-design-exploration-r04 (Eclipse's shared foundations, DESIGN-SPEC.md §1)
    ownerSession: <the coordinator session at opening>
    branch: public-redesign-r01 (rounds), integrated into owner-followup-r04-build
    worktree: D:/Projects/fitway-worktrees/public-redesign-r01
    baseCommit: <owner-followup-r04-build at opening>
    ownedPaths:
      - design-research/owner-composition-exploration-r04/directions/eclipse/public.html, public.css, public.js,
        PUBLIC-SPEC.md and public-capture.mjs
      - docs/phase-records/handoffs/public-redesign/**
      - docs/phase-records/task-packets/public-redesign-r01.yaml
      - docs/adr/ADR-010-public-composition-authority-supersession.md (as accepted)
      - the accepted amendments' lines of FITWAY_PRODUCT.md, DESIGN_GUIDE.md and SPEC.md, and the `public` row of
        docs/design/VISUAL_AUTHORITY_STATUS.md (applied once, at opening)
    forbiddenPaths:
      - apps/** and packages/** production code, copy, behavior and data semantics
      - tests/browser/** including canonicals and screenshots
      - visual-direction-gate/**, approval manifests and pinned hashes
      - every other Eclipse file (r04's), except DESIGN-SPEC.md §6 under the lease below
      - PROJECT_STATE.yaml and PROJECT_STATE_HISTORY.yaml (coordinator only)
      - the agent tooling (agent-tooling-r01's)
    sharedLeases:
      - "design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md, §6 Public only, a
        coordinator lease from owner-design-exploration-r04"
    gates:
      unit: NOT_REQUIRED
      integration: NOT_REQUIRED
      browser: PENDING
      accessibility: PENDING
      visual: PENDING
      independentReview: PENDING
```
