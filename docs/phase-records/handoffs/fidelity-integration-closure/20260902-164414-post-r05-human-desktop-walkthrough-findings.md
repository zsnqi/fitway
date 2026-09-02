# FITWAY post-r05 human desktop walkthrough findings

## Completed

- Recorded the owner's post-r05 desktop walkthrough as new visual-acceptance evidence only.
- Preserved r01 through r05 and the r05 `DONE` closure unchanged as historical evidence.
- No repair, redesign, successor activation, Paper mutation, baseline refresh, test change, or
  product implementation change was performed in this session.

## Exact current state

- Canonical branch/worktree: `main`, `D:/Projects/fitway`; closure parent
  `de286594f36b2edcdd4993e5b3259ada2b06fa9c`; this observation record commit is `SELF`.
- The working tree is clean after this record commit. Nothing was pushed, deployed, tagged,
  released, or externally provisioned.
- The existing desktop demo was healthy when checked and was deliberately left running without a
  restart: Postgres, server, web, and simulator are owned/running; server and web endpoints are
  ready; web route `http://localhost:3101`.
- This record is not a milestone, repair candidate, or approval to implement. A fresh successor
  planning pass is required before any source or visual change.

## Decisions

- Human finding: Staff is currently the strongest routed reference and is very close to accepted
  Paper. It must not be broadly redesigned.
- Human finding: Public is materially weaker than Staff and does not yet read as the same finished
  system. The observed routed page has questionable background-logo treatment, inconsistent
  color/gradient balance, a very thin header, undersized FITWAY/brand mark, and composition,
  spacing, and copy differences from the accepted Paper Public family.
- Human finding: Public, Staff, and Owner branding/header treatment must be inspected as one system.
  The previously supplied intended club logo asset must be reconciled deliberately; continuing an
  arbitrary tiny inline mark is ruled out.
- Human finding: Owner remains materially inconsistent with the accepted Paper system at full-route
  level:
  - Daily Analytics differs substantially in composition, information hierarchy, card structure,
    visible copy, and density.
  - History/Reporting is overly verbose and visually busy; the interface should explain itself
    without excessive explanatory prose.
  - Access does not use the accepted Paper composition/style and has excessive explanation plus weak
    card hierarchy.
  - Audit has similar style/copy problems; form/select controls show poor internal spacing, including
    dropdown indicators too close to edges.
  - Uptime/Operations does not use the accepted Paper composition.
  - Settings is structurally closer but still requires full routed comparison; isolated component
    acceptance is not proof of page fidelity.
  - The maximized desktop route uses viewport space poorly and can leave a large unused black region.
- Human finding: typography, spacing, alignment, hierarchy, and occasional text collision/overlap
  defects must be discovered systematically; the examples above are not an exhaustive defect list.
- Locked visual authority: Paper remains the primary visual and copy reference, but the goal is not
  blind pixel copying. Small improvements are allowed only when they clearly improve usability,
  responsiveness, accessibility, or polish while preserving FITWAY's accepted language and product
  meaning.
- Required investigation: the next session must determine why prior fidelity verification and
  independent review did not expose these full-route discrepancies before proposing repairs.

## Remaining

1. Run a fresh read-only successor planning pass against the live routed demo and repository truth.
2. Compare Public, the shared Public/Staff/Owner brand/header system, and every Owner desktop route
   directly with accepted Paper authority at full-page level; use Staff as a strong implementation
   reference without assuming it governs other families.
3. Produce a systematic defect inventory covering composition, copy, density, viewport use,
   typography, spacing, alignment, hierarchy, controls, collision/overlap, responsiveness, RTL/LTR,
   and accessibility.
4. Audit the previous screenshot matrices, masks, assertions, review artifacts, and review briefs to
   explain the false confidence and propose stronger future acceptance gates.
5. Propose bounded successor slices and verification/review strategy. Do not implement until that
   planning result is reviewed and authority is confirmed.

## Blockers

- No human-only product decision is requested by this record. Implementation is intentionally
  blocked on the fresh read-only planning and failure-analysis pass.
- The findings are human visual-acceptance evidence, not yet a complete defect inventory or an
  implementation specification.

## Verification

- Read-only `pnpm demo:status` on closure parent `de286594f36b2edcdd4993e5b3259ada2b06fa9c`:
  Postgres, server, web, and simulator running; server and web endpoints ready.
- No browser reinspection, screenshot comparison, Paper mutation, automated test suite, or repair
  verification was run in this observation-only session. Those omissions are deliberate and belong
  to the next planning pass.
- The only repository write is this new handoff record; r01-r05 records and `PROJECT_STATE.yaml`
  remain byte-unchanged from the completed closure.

## Recommended next session

Use `plan` mode and remain read-only on product source, Paper, baselines, tests, and the ledger.
Reconcile repository truth, this human walkthrough record, accepted Paper authority, and the healthy
live desktop routes. Diagnose why r05 automated and independent fidelity review produced false
confidence, inventory full-route Public/brand-system/Owner gaps systematically, and return bounded
successor slices with acceptance evidence strong enough to catch the observed discrepancies. Do not
repair, redesign, activate a successor milestone, or modify historical r01-r05 records in that
session.
