# FITWAY fidelity/integration closure r05 repair-1 candidate

## Completed

- Preserved terminal r01 through r04 history and every accepted r04 Public, Staff, Login, Owner,
  accessibility, reflow, timing, and official-logo change.
- Corrected only the TanStack observer timing defect: `refetchOnMount` now permits the first
  already-added observer (`count === 1`) and suppresses later in-page observers (`count > 1`).
- Added the missing browser proof using live SPA routing: after Daily settles, the test advances
  beyond the 60-second stale window, leaves `/admin` until every Owner observer unmounts, returns
  through browser history without replacing the root QueryClient, and proves exactly one second
  Daily/time-context pair.
- Retained and reran the independent late-observer suppression and failed-reconnect cached-draft
  preservation proofs.

## Exact current state

- Branch/worktree/run lineage: `codex/fidelity-integration-closure`,
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`,
  `fidelity_r05_repair1_*`.
- r05 base `6036de9a86f8c826bd64ae45be90830a8c920b94`; activation commit
  `7cd07d3`; repair-1 candidate commit `SELF` after the freeze below.
- Canonical `main` remains `8f5ff99a9e48722a9cb44b6124833099f3704f42`. Nothing is pushed,
  deployed, tagged, released, or externally provisioned.
- r05 is `VALIDATING` with repair count `1/2`.

## Decisions

- The observer-count predicate follows the installed TanStack implementation, which subscribes the
  observer before `shouldFetchOnMount` evaluates the callback. The first observer therefore has
  count `1`; every lazy section observer has count greater than `1`.
- The remount proof mocks the real owner session and Staff transport error while navigating through
  the production SPA links; it does not use full reload, destroy the QueryClient, call query APIs
  directly, or fabricate observer state.
- No visual source, canonical image, Product/Spec/ADR, schema, migration, server, edge, security,
  privacy, or unrelated product behavior changed.

## Remaining

1. Freeze and commit this exact r05 candidate.
2. Run fresh `pnpm verify:full` with a new exact disposable database and isolated browser resources.
3. Run fresh independent Standards, Spec, and rendered Paper/accessibility reviews on the exact
   r05 commit.
4. Fast-forward the accepted candidate into canonical `main`, revalidate and leave running the
   desktop synthetic demo for manual walkthrough, record terminal successor closure, and leave
   canonical `main` clean.

## Blockers

- None.

## Verification

- Focused lifecycle triad passed `3/3` in `6.1s`: no late-observer duplicate, exactly one stale
  full-route remount refresh, and cached draft preservation after failed stale reconnect.
- Complete Settings browser slice passed `20/20` in `22.0s`, including English/Arabic,
  desktop/mobile, keyboard, 200-percent reflow, axe, and canonical routed states.
- `pnpm verify:fast` passed without repository mutation: repository invariants, Biome `504` files,
  all workspace types/build, `572/572` unit tests, and `117/117` simulator tests.
- r04 full verification is preserved as historical evidence only; r05 will run a fresh full gate.

## Recommended next session

Continue in `verify` mode on this exact candidate. Do not broaden the repair or reuse r04's full
result as r05 acceptance.
