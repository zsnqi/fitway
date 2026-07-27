# phase5-staff-ui retry human visual verdict

- Status: `NEEDS_HUMAN` — human interactive review completed, but visual approval is withheld
  pending a bounded staff UX and visual refinement pass.
- Base commit / candidate commit: `a7a7f64c099503fcf9a8dd84091061a4e577a03e` /
  `67feb9673e48ab9651479afce8ff23595f2aeb35`.
- Branch / worktree / run ID: `work/phase5-staff-ui-b03-retry` /
  `D:/Projects/fitway-worktrees/phase5-staff-ui-retry` / `p5_staff_b03_retry`.
- Review environment: the disposable web service on port `20645` and API service on port
  `3100` were stopped after the review. The registered disposable database remains
  `fitway_integration_p5_staff_b03_retry`; it is not a production resource.

## Human verdict

The command lifecycle behavior appeared functional, but the staff experience is **not approved**
for the current candidate. The next pass needs cohesive UX and visual refinement, followed by a
fresh human visual review. This verdict does not authorize a redesign or changes to locked product,
data, privacy, security, or lifecycle semantics.

Observed review feedback:

- Current-reading metrics feel visually disconnected and poorly balanced.
- Excess empty space and an overly long desktop actions column make the layout feel mobile-like.
- Several operational labels and descriptions are technical, unclear, repetitive, or unnecessary
  for staff.
- Recent-command history is too verbose and exposes implementation-oriented language.
- Header hierarchy, edge alignment, and scroll behavior need review.
- RTL/LTR switching needs visual-continuity evaluation.
- Login background mark, copy density, and card lighting need refinement.
- Some decorative controls appear interactive without having an action.

## Candidate and evidence preserved

- Candidate implementation remains `67feb9673e48ab9651479afce8ff23595f2aeb35`; no production
  implementation files changed during the review closeout.
- Prior focused validation evidence remains preserved: formatting, types, focused DTO/repository/
  hook tests, disposable-Postgres lifecycle-read proof, and the seven Playwright scenarios all
  passed as recorded in `20260727-214545-p5_staff_b03_retry-blocked.md`.
- No remaining gates were run, no canonical screenshots were updated, no coordinator state was
  changed, and nothing was integrated or pushed.

## Required resume boundary

A coordinator must allocate a bounded UI refinement pass before this candidate can return to human
visual review. It must preserve server-authoritative lifecycle rows and the frozen private/public
boundaries, avoid a material visual-direction change without explicit approval, and retain the
existing automated evidence until fresh relevant checks are deliberately scheduled. Do not mark
the phase or aggregate `DONE` from this handoff.
