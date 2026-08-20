# Phase 10 UI/CSV b04 — independent plan v2 review rejection

- Recorded: 2026-08-20 23:40 +03:00.
- Reviewed boundary: `a8f40d400337c3325352963177bde81f4fb319d1..1bc8685`.
- Reviewer: fresh read-only independent Sol/xhigh reviewer with separate specification and workflow/standards axes.
- Result: `REJECT`; implementation remained unopened and repair budget remained `0/2`.

## Findings

1. `FITWAY_PHASE` was bound for the whole ladder even though `verify:fast` rejects phase mode, and `verify:fast` was ordered after broad integration/browser checks instead of before them as `docs/WORKFLOW.md` requires.
2. One run/database/port/artifact identity was defined for both self-verification and the fresh independent verifier, so the second run would not be cleanly distinguishable.
3. A newly mounted `useOwnerDailyAnalytics` observer after successful Daily loading can refetch a stale React Query key (`staleTime: 0`, `refetchOnMount: true`). The plan therefore did not preserve the accepted one-call shared-prerequisite behavior.
4. The lazy-mount wording could omit the initial History `tabpanel`, leaving the History tab's `aria-controls` IDREF unresolved.
5. The ordinary third-recurrence `FAILED_VALIDATION` rule did not explicitly preserve the stricter activation rule: a second material Paper-composition disagreement is `NEEDS_HUMAN`, with no third visual repair.
6. The standalone Playwright command and the mutation-state check were not executable as written.

## Required correction

- Keep both panel shells mounted from first render; lazy-mount only the History reporting subtree.
- Give the reporting wrapper one persistent prerequisite query observer mounted with Daily, pass that result into History and `useOwnerReporting`, and remove the late internal prerequisite observer. Assert exactly one implicit request chain and only one additional chain per deliberate retry.
- Run `verify:fast` first with `FITWAY_PHASE` unset; define distinct exact self and verifier resources; give exact commands and clean-tree assertions.
- Restore the visual exception verbatim alongside the ordinary failure rule.

All v2 premises not listed above were accepted. The v2 plan remains immutable; v3 is a new record.
