# Batch 03 command integration and UI continuation

- Status: `READY`
- Integrated command-domain commit: `4211b172bcfbb50b30f3f38a400287e5d12bdf7e`
- Coordinator activation commit: `SELF`
- Activated / lease expiry: `2026-07-22T15:10:00+03:00` /
  `2026-07-24T15:10:00+03:00`

`phase5-command-domain` is `DONE` after exact-range integration and fresh focused/full validation.
The `phase-5` and `phase-9` aggregates remain incomplete.

The historical Phase 9 `NEEDS_HUMAN` record is preserved and superseded. Timezone authority is
the effective append-only settings row; a private companion transport supplies settings-version
mappings while `DailyAnalytics` and public v2 remain unchanged. Router lane B transfers only to
the Phase 9 retry.

The two UI slices are activated but unlaunched on this same coordinator activation commit. They
are safe in parallel because neither owns shared catalogs, StaffShell, shared staff styles or
messages, navigation, or route-tree generation. Phase 9 owns `/admin`, owner-local presentation,
private time-context transport, and lane B. Phase 5 staff owns `/staff` command presentation and
feature-local messages/styles. Integrate one candidate at a time with focused post-merge checks.
