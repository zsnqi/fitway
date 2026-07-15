# Phase 3 record — Schedule-aware public state

- Status: `DONE`
- Integrated commit: `ab4126dd30598a916ca2aa2e6f8b815a21d86bba`
- Commit date: 2026-07-13 (Asia/Riyadh)
- Original message: `feat: implement phase 3 schedule-aware public state`

## Accepted outcome

Phase 3 delivered append-only schedule settings, configured gym timezone, per-weekday and
past-midnight semantics, closed override, next opening, automatic closed/open transition,
localized Arabic/English gym time, Western digits, and cache behavior that does not leave the
public page closed past the next transition.

Closed removes count and crowd data instead of presenting frozen values as live. Phase 3 time,
schedule, and effective-settings semantics are prerequisites for Phases 4, 7, 9, and 11.

## Historical verification

The superseded handoff reports the following at the accepted commit:

- `pnpm check` — pass
- `pnpm check-types` — pass
- production web build — pass
- `pnpm test` — 67 tests passed
- `pnpm test:integration` — 9 tests passed
- `pnpm test:browser` — 6 tests passed
- `pnpm test:simulator` — 3 tests passed
- `git diff --check` — pass

It also reports seven manual scenarios passing: closed with active occupancy, past-midnight
open, next opening, Thursday-to-Friday transition, Friday midnight, localized gym time, and
automatic closed-to-open without reload. This is preserved historical evidence, not a claim
that those exact commands were rerun while creating this record.

The original handoff is retained at
`docs/archive/handoffs/HANDOFF_PHASE3_TO_VISUAL_DIRECTION_GATE-20260713.md`.
