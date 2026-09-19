# Agent-context architecture migration r01 — M3 closure

Date: 2026-09-19 19:55 +03:00

## Verdict

M3 is complete. The backend and Login rehearsal tasks exercised DRAFT, READY, update/hash,
independent-review, stale/missing-packet failure, and closure/history rules without changing product,
application, product-test, visual-authority, screenshot, or historical bytes. M3 did add and repair
context-validator tests. Actual packet closure remains serialized with the v2 history transition in
M4.

## Integrated candidate

- Lifecycle infrastructure: `7e79de90c52adb60127b3dfd57c88013985bbfc1`.
- Draft pilots: `95bbc14`.
- Fixture isolation: `115421033b559523f2f98c2266be29f8b56d1bd9`.
- Bounded startup validation: `6647739df04488060607d6b8c909001878a8e8ed`.
- READY promotion and initial receipts: `ba3b6e8dca704663c84413744e742e16b4cb7853`.

## Fresh-agent acceptance

- Backend: PASS from a clean detached worktree with no inherited conversation. The agent used
  `context:show`, opened no history or visual corpus, selected every critical source, expanded only
  role/DTO conditionals, ran 4/4 unit and 7/7 disposable-Postgres integration tests, and left Git
  clean.
- Login: PASS from a separate fresh Luna Max session. The agent used `context:show`, selected every
  critical Product/Spec/design/visual source, expanded only ADR-007, skipped ADR-009 and history,
  verified base ancestry and packet hash, independently inspected the exact Arabic desktop frames,
  and left Git clean. Coordinator-recorded host Playwright/design checks remained clearly labeled.
- Normal startup discovery read only the route registry, active state, and selected packet before
  deliberate source expansion. Repository-wide `check-agent-context` mechanically audits history,
  but that parse is validator work and was not agent reasoning context.

## Verification

- Focused lifecycle/discovery suites: PASS, including independently reviewed 51-test lifecycle and
  11-test bounded-discovery coverage.
- Tracked `check-agent-context`: PASS for 8 task classes; the parent migration remains the single
  documented compatibility-mode milestone until M5.
- Repository invariants: PASS at READY commit `ba3b6e8dca704663c84413744e742e16b4cb7853`.
- Authoritative fast, run `agent_context_m3_fast_ready_r03`: PASS, 85 files / 1073 tests plus 120
  Python tests, clean mutation guard.
- Authoritative full, run `agent_context_m3_full`: PASS, 85 files / 1073 unit tests, 120 Python
  tests, 19 files / 133 integration tests, build, and 176 browser/accessibility cases (173 passed,
  3 skipped), clean mutation guard.
- Full-run harness repair: the first invocation correctly refused a shared application/test DB.
  The accepted rerun used separate disposable databases in one dedicated container. The synthetic
  ignored `.env` and container were removed after PASS.

## Preserved limitations

- The pilots are read-only rehearsals and do not prove behavior outside their named paths.
- No visual promotion or English-mobile approval occurred.
- Existing `AGENTS.md` broad-startup requirements remain through M4; the startup route flips only in
  M5 and broad-document removal occurs only after the M6 responsibility map.
- Historical pointer exceptions and the parent compatibility warning are existing compatibility
  state, not fresh-agent context or acceptance evidence.

## Next action

Proceed to M4: introduce prospective active-state v2, create the reviewed history genesis, archive
the existing phase3 DONE milestone through the new receipt chain, then close/archive the two pilots
through v2 transitions. Preserve every pre-existing history record byte-for-byte and keep legacy
receipt support during the compatibility window.
