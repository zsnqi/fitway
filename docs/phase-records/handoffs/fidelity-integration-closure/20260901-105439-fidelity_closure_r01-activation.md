# FITWAY fidelity/integration closure r01 activation

- Status: `IN_PROGRESS`.
- Base commit: `8f5ff99a9e48722a9cb44b6124833099f3704f42`.
- Branch/worktree/run ID: `codex/fidelity-integration-closure`,
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`,
  `fidelity_closure_r01`.
- Authority: primary Codex coordinator; one repository writer at a time.
- Push, deployment, release/tag, external provisioning, presentation capture, and owner-facing PDF:
  excluded.

## Objective and authority

Close the repository-wide visual/integration gap against the accepted rendered Paper families and
their later accepted Owner successors while preserving repository-owned behavior, privacy,
security, accessibility, authorization, and data semantics.

Locked human decisions:

- `brand/fitway-logo.png` is the intended FITWAY club/product mark. Mounted Public, Login, Staff,
  and Owner branding must use that asset where the accepted header calls for the club mark; the
  legacy inline wordmark/circle-slash treatment is not protected by old Paper frames or historical
  visual claims.
- Paper controls the visible Owner Daily Analytics composition. The accepted three-summary-metric
  design does not retain the old visible fourth Coverage card. The underlying coverage and other
  analytics DTO semantics remain unchanged and available where the accepted product uses them.
- Existing canonical screenshot baselines may be replaced when stale, and new full-route
  baselines may be added, under this explicit human authorization. Promotion remains serialized
  and must be independently reviewed.

Paper evidence was read directly from `FITWAY UX Exploration` / Page 1. Governing families are
`PUBLIC CROWD BOARD PRODUCTION SET — CURRENT`, `LOGIN PRODUCTION SET — CURRENT`,
`STAFF MONITORING PRODUCTION SET — CURRENT`, and
`OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT`, with accepted Reporting, Access, Uptime, and
Settings successors recorded by their existing coordinator DONE records. Audit uses its accepted
Phase 11 composition. Paper nodes and approved originals remain read-only.

## Scope and stages

1. Public route: replace the stale mounted composition with the current Paper Public family while
   preserving real occupancy states, freshness, privacy, accessibility, and locale semantics.
2. Login and Staff: retain the accepted implementations, apply the official logo, prove every
   mounted state from a fresh build/runtime, and remove or isolate only confirmed orphaned Staff UI.
3. Owner: align the mounted `/admin` shell, navigation, hierarchy, Daily Analytics, Reporting,
   Audit, Uptime/Health, Access, and Settings composition to the accepted Paper system without
   changing their contracts or authorization behavior.
4. Evidence: add durable full-route visual coverage for Public, Login, Staff, Daily, History,
   Audit, Uptime, Access, and Settings across applicable desktop/mobile and Arabic/English states;
   supersede stale baselines without rewriting their historical records.
5. Closure: rebuild and exercise the desktop demo, run the full guarded verification ladder, run
   independent rendered and source/semantic review, integrate to canonical `main`, and record the
   successor terminal state.

Each stage is one revertible commit; reverting that commit returns the prior routed family without
altering data contracts. Canonical baseline promotion is a separate serialized commit after the
routed candidate freezes. Historical DONE and terminal records are never edited; this successor
qualifies their prior visual-closure claims as evidence about their then-current candidates only.

## Preselected verification

- Repository freeze: candidate freeze check plus repository invariants, format/lint, types, and
  `pnpm verify:fast`.
- Routed behavior: focused unit/component checks and real Playwright routes for Public, Login,
  Staff, and every Owner section/state.
- Visual/accessibility: Paper render comparison, Arabic RTL and English LTR, 1440 desktop and 390
  mobile everywhere applicable, plus 768/320/200% reflow where the authority or shared shell
  requires it; keyboard, focus, target size, reduced motion, names, live regions, and overflow.
- Full gate: `pnpm verify:full` with a unique run ID, disposable database, run-owned output, and
  mutation guard.
- Desktop demo: fresh `prepare`, `reset`, `start`, unmocked `verify`, `stop`, restart, and cleanup;
  no credential persistence.
- Independent review: one rendered-route/Paper axis and one source/behavior/security/accessibility
  axis, both read-only; reviewers do not repair.

## Stop conditions

Stop only for a genuinely new Product/Spec conflict, security/privacy ambiguity, missing external
prerequisite, lease expiry, or two failed repairs of the same gate. No current human-only decision
is open. The Paper labels on later Owner candidates do not reopen their existing coordinator DONE
acceptance records.

