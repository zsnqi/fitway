# Batch 01A integration record

- Status: `DONE`
- Activation commit: `49870cecde23a614d4f518fb0c88e6d1c56bce36`
- Reviewed implementation head: `49518ec00978886196405ec87924b91e354f0960`
- Coordinator evidence commit: `SELF`
- Integrated at: `2026-07-16T15:12:54+03:00`
- Push: none

## Candidate ranges and ownership

| Slice | Reviewed range | Candidate tip | Ownership result |
| --- | --- | --- | --- |
| `phase9-analytics-domain` | `49870cec...7ead2a9` (`90aded1`, `7ead2a9`) | `7ead2a9839495b94eca4d21bfc98833d20069a26` | PASS: seven additive owned files; no schema, migration, router, UI, configuration, or existing-file edit |
| `phase4-auth` | `49870cec...a6f5ab4` (`4d000d3`, `39df11a`, `a6f5ab4`) | `a6f5ab4c4b521592f01c579d8528ff30b699ca0f` | PASS: all 25 files were owned or explicitly leased; migrations `0000`/`0001`, UI, public/occupancy code, dependencies, and root manifests were unchanged |

Analytics integrated first at merge commit
`7d29e1a5dd3c34197fb714d9619ac47f3c2d9201`. Auth integrated second at merge commit
`4730921c182e64f8963d47a3178f4f07b04945ee`. There were no merge conflicts.

## Coordinator verification

| Gate | Run ID / resource | Result |
| --- | --- | --- |
| Analytics focused | `p9_analytics_b01_coord01`; DB `fitway_integration_p9_analytics_b01_coord01`; port `22641`; `pnpm verify:phase --phase phase9-analytics-domain` | PASS: 19 unit files / 80 tests, focused Postgres 1/1, types, Biome, simulator, repository invariants, mutation guard |
| Auth focused | `p4_auth_b01_coord01`; DB `fitway_integration_p4_auth_b01_coord01`; port `11532`; `pnpm verify:phase --phase phase4-auth` | PASS: 23 unit files / 92 tests, real HTTP/Postgres 1/1, types, Biome, simulator, repository invariants, mutation guard |
| Full integration | `batch01a_full_coord02`; DB `fitway_integration_batch01a_full_coord02`; port `13785`; `pnpm verify:full` | PASS: 23 unit files / 92 tests, 3 integration files / 11 tests, 3 simulator tests, web/server production builds, 14 Playwright functional/accessibility/visual tests, mutation guard |

All Playwright output, report, and review paths were isolated below
`output/playwright/<run-id>`. Canonical screenshots were read-only. The unavailable in-app Browser
was not used; repeatable repository Playwright, Axe, and deterministic screenshot assertions
supplied the browser, accessibility, and visual evidence.

## Full-gate repair history

The first full run, `batch01a_full_coord01`, stopped at the server declaration build because the
declaration plugin did not eagerly prepare the newly expanded workspace auth sources. Unit and
static gates before that build had passed. Tight reproduction with `pnpm --filter server build`
showed that source declarations exported `AuthService` correctly and isolated the failure to the
monorepo declaration-generation mode. Two source-resolution hypotheses were tested and discarded.

The coordinator added only `dts: { eager: true }` to `apps/server/tsdown.config.ts`, the installed
plugin's documented monorepo mode, in commit
`49518ec00978886196405ec87924b91e354f0960`. The focused server build then passed twice with all
source-level experiments removed, and the complete fresh full run passed.

## Fresh independent review

- Standards: PASS with zero hard findings. Nonblocking notes were duplicated staff/owner login
  transport flow, unused `findPrincipalById`, and contract-driven schedule mapping duplication in
  the isolated analytics repository.
- Spec: PASS with no blocking or important finding. Auth satisfies SPEC 359-412 and ADR-002;
  analytics satisfies SPEC 586-600 and ADR-004; public schema v2 remains capacity-, percentage-,
  identity-, and history-free.
- The coordinator build repair affects declaration scheduling only and introduces no product or
  runtime behavior.

## Lease release and next dependency

All auth schema/migration/context/router/server-entry leases are released. Analytics held no
shared lease. Candidate branches and handoffs remain provenance, but neither slice owns active
files after integration.

The next safe execution batch is Batch 01B with `phase4-health` only. Auth and migration `0002`
are now integrated, satisfying its dependency. Before activation, the coordinator must define an
exact health contract and allocate migration `0003`, auth-aware API/server integration points, and
the edge transaction/repository lane. `phase4-staff-web` still waits for health and the real
`staff.operationalSnapshot`; `phase8-alert-evaluator` also waits for health. No next worktree is
created by this integration record.
