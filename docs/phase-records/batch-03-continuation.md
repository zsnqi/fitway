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

## Phase 5 staff UI retry continuation — 2026-07-27

Human adjudication authorizes a private staff-or-owner `staff.recentCommands` read leaf. It must
return the server-authoritative `pending | applied | superseded` lifecycle status verbatim together
with the existing lifecycle timestamps and superseding-command reference. `deliveredAt` remains
metadata, never a status. This leaves the frozen operational snapshot, command-domain contracts,
migrations, edge/OpenAPI surfaces, and public payloads unchanged.

`phase5-staff-ui` is reactivated as an unlaunched retry from the current integrated main. The
corrected UI implementation is preserved from `a39475058172f9e1a54e9f6e630d60ae15fc319a` and
`01b014d52b6f3dc135ad80ab012f3dec6625e86a`; the latter removes local lifecycle inference. A
scoped, expiring private-read lease and a unique verification profile are registered in its retry
handoff and ledger. No backend read leaf or UI binding is started by this coordinator activation;
the leaf must first be implemented and verified under that lease, then the UI may consume only its
returned status.
