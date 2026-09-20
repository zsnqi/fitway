# Agent-context architecture migration r01 — M4 closure

- Prepared: 2026-09-20 00:30 +03:00; resumed under explicit human authority at 13:45 +03:00 after the coordinator lease expired while the host was off.
- Stage: M4 active-state and history-transition cutover only. M5 has not started.
- Scope: repository context/state infrastructure only; no Product, Spec, application, UI, visual-authority, screenshot, Paper, dependency, lockfile, or database change.

## Accepted transition

- Active state moves prospectively to schema v2, requires strict packets for every open milestone, constrains `ownerSession`, rejects terminal active records, and permits an empty milestone map.
- The migration milestone remains active with its strict READY packet. The completed Phase 3 clock-flush successor and the two completed M3 read-only rehearsals move to terminal history through three serialized v2 receipts. Closing both rehearsals is explicitly authorized by the M3 closure and each pilot evidence record.
- The genesis active checkpoint contains four records. The verifier now requires every genesis-active id either to remain active or to be removed exactly once; this candidate accounts for three removals and the surviving migration milestone. Post-genesis active additions remain supported by the co-mutable receipt model.
- The pre-M4 history boundary is 318,816 bytes, SHA-256 `8f500211f873c70d76fc20ab0f075a6a01801e448f3863d659a1d594dac0ac59`, and 100 records.
- The final boundary is 327,871 bytes, SHA-256 `cfb5be2612e3f9331a9ecc06df8e14bcdde1b32aad401f4ec194cd6f5d645669`, and 103 records. Every pre-existing byte, key order, and canonical record digest remains unchanged; no history header or prior record was reserialized.
- Genesis receipt SHA-256: `2271a8a4016b080afeb2b26f77ca64c95afeea3120e1cf3aaa29fe8e52c991fe`.
- Phase 3 receipt SHA-256: `3c41a86bc806ed422a5f6156cdb3274704cb77f27fe238332b4aaeebe1141e04`.
- Backend pilot receipt SHA-256: `8d4f780ac06f1f972122e39ea3a1e29a5c8dcfca35b8338950c0c32cdab00b44`.
- Login pilot receipt SHA-256: `8d864d969070bd7873a796b0ab6012839cdc47350733599a8619b86920cfde8e`.
- The genesis bridge pins and validates the latest immutable r08 legacy boundary. Earlier v1 receipts remain preserved provenance rather than being replayed as raw prefixes, because their era legitimately rewrote the history header.

## Verification and review

- Authoritative focused runner: `scripts/verify-repository.schema.test.ts`, `scripts/project-state-history-transition.test.ts`, and `scripts/project-state-history-v2.test.ts` — PASS, 3 files / 41 tests.
- Tracked `scripts/check-agent-context.mjs` — PASS for 8 task classes; expected admitted historical-pointer warnings only; compatibility routing remains active through M4.
- `scripts/verify-repository.mjs` — PASS: 1 active, 103 archived, 3 receipt additions/removals, 0 modified pre-existing records, and a valid dependency union.
- Authoritative focused checker runner: `scripts/check-agent-context.test.ts` — PASS, 1 file / 44 tests.
- Biome — PASS for all eight changed code/schema/test files; no fixes applied. `git diff --cached --check` — PASS.
- Independent Luna Max architecture review initially rejected silent genesis-active disappearance and requested provenance clarification. After the completeness repair and authority review, its second verdict was APPROVE with no blocking M4 defect.
- Independent Luna Max mechanical audit recomputed the raw prefix, all receipt links/boundaries, 100 genesis record digests, three terminal digests, four active checkpoint digests, packet hashes, active/history uniqueness, and dependency resolution.
- The first clean detached replay caught two integration-only defects: the commit hook's receipt formatting changed three downstream receipt hashes, and two `check-agent-context` test fixtures still modeled the pre-v2 frontier. The receipt links and fixtures were repaired, then the affected focused gates were rerun to green.
- Clean detached-checkout authoritative fast replay on behavioral candidate `35705af9c2d336ed62c39ae8412ac098393dca72` — PASS: repository/context/frontier/Biome/type gates, 86 Vitest files / 1,089 tests, and 120 Python simulator tests. The verifier reported `Verification fast passed without repository mutation`, and the checkout remained clean.
- The final commit differs from that fast-verified behavioral candidate only by this closure-evidence update. Clean final-commit context and repository gates, plus unchanged-status evidence, are required after the report-only amend.

## Limitations

- The receipt chain is repository-internal co-mutable provenance. It proves recorded raw-prefix, canonical-digest, packet, active-checkpoint, and chain relationships within the prepared cooperative worktree threat model; it is not external attestation or a sandbox.
- Archived pre-genesis v1 receipts are retained as historical evidence. The strict v2 bridge begins at the latest immutable r08 boundary rather than pretending earlier whole-file-rewrite receipts are append-only prefixes.
- M4 does not flip startup routing. The compatibility-mode message is intentional; M5 remains unstarted.
