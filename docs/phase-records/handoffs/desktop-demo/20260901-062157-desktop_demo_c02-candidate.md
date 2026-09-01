# Desktop demo candidate 2

- Status: `CANDIDATE` — focused repair and author verification complete; independent re-review
  pending.
- Base commit: `5ebb22998a9e65b8f9fa751d66edc55e13f4bf4e`.
- Failed candidate: `c2a58f9882e9dcd434a86a3f4abaf364078d554c`.
- Branch / worktree / run ID: `codex/desktop-demo` /
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration` /
  `desktop_demo_c02`.
- Repair budget: `1/2` focused candidate repairs used.

## Independent candidate-1 findings

The fresh read-only reviewer rejected candidate 1 for two blocking defects:

1. The generated history and fingerprint were anchored to the current hour, so two resets could
   differ within one Riyadh business day.
2. Interactive credential variables were inherited by helper child processes, and the live
   Playwright proof retained traces on failure, contradicting the documented no-persistence
   boundary.

The reviewer also noted that prepare deferred migrations and port checks, status did not verify
process ownership or endpoint readiness, and the documented Owner-password range omitted its
128-character maximum.

## Focused repair

- The generated history is now anchored to the fixed 04:00 Riyadh opening minute for the selected
  business day. A regression test compares profiles at widely separated hours of the same day.
- Interactive credentials are taken once and immediately removed from the CLI environment.
  Docker, taskkill, application services, simulator, capture helpers, and Owner Chromium receive
  sanitized environments. A pure guard and unit test prove the removal contract.
- The isolated verification runner receives credentials explicitly. Each worker captures and
  removes them before Chromium launches with an explicitly sanitized environment, and the CLI
  forces `--trace=off` for the credential-bearing live proof.
- Prepare now validates both application loopback ports and applies reviewed migrations. Status
  verifies every live PID's command marker and reports server/web readiness. Documentation now
  states the real 12-128 character Owner-password constraint.

No product, schema, migration, application UI, production authorization, LAN/TLS/firewall,
deployment, GitHub, release/tag, presentation, screenshot, or PDF behavior changed.

## Candidate-2 evidence

- Focused guard/profile tests: `2` files / `5` tests PASS.
- Same Riyadh business day guarded resets: identical fingerprint
  `61c8858efa9f961e4dcb67981c7e47f2419b7009013aa31e6fb7ca5f0987951c`.
- Lifecycle: clean PASS; prepare PASS including reviewed migrations and loopback port checks; reset
  PASS; start PASS; ownership/readiness status PASS; stop PASS with profile preserved; clean PASS.
- Unmocked live Chromium after repair: `3/3 PASS` covering Public, Staff, Owner, 401 redirect, and
  server-side 403 authorization. Trace capture was disabled.
- Runtime persistence scan after live proof: no synthetic Owner password or Staff PIN found in any
  `.local/demo` artifact; no trace archive existed.
- Cleanup proof: `.local/demo` absent; exact named Compose volume/network/container absent; no
  listeners on 3100, 3101, or 55432.
- `pnpm verify:fast` with complete process-local synthetic server environment: repository
  invariants PASS; Biome `501` files PASS; workspace types/build PASS; Vitest `73` files / `571`
  tests PASS; Python simulator `117` tests PASS; mutation guard PASS; exit `0`.
- `git diff --check`: PASS.

## Re-review request

Review the immutable candidate-2 commit against the base and candidate-1 findings. Confirm
same-business-day determinism, child/browser credential containment, trace disabling, prepare and
status semantics, lifecycle safety, real architecture/auth reuse, evidence coherence, and operator
documentation. Do not edit or repair the candidate.
