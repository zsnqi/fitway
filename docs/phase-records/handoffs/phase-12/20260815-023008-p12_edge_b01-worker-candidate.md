# Phase 12 durable edge client b01 worker candidate

- Status: `READY_FOR_INTEGRATION`. Not merged, not pushed, not `DONE`. `PROJECT_STATE.yaml`, the
  verification profile, and every path outside the lease are untouched.
- Base commit / candidate commit: activation `b18690b4551d780143c65f806b4c45527a61bc8d`; the final
  source commit is `26f8e30` and the candidate head is this documentation-only commit directly on
  top of it, which is the tip of `work/phase12-edge-client-b01`.
- Branch / worktree / run ID: `work/phase12-edge-client-b01`;
  `D:/Projects/fitway-worktrees/phase12-edge-client`; `p12_edge_b01`.
- Owned paths / shared leases used: this new worker handoff under the owned handoff glob, plus the
  Phase 12 edge protocol-spine shared lease. Lease re-checked before every shared edit and observed
  valid through `2026-08-20T20:08:41+03:00`. Every changed path is inside the eighteen leased paths;
  no other path in the repository was read for write or modified.
- Formal validation repair attempts consumed: `0/2`.

## Stage commits

| Commit | Stage |
| --- | --- |
| `5c896dc` | Stage 1 — canonical protocol extraction into `fitway_edge.protocol` |
| `dbe7947` | Stage 2 — strict config, synthetic source, transactional SQLite store, `EdgeRuntime` |
| `26f8e30` | Stage 3 — Windows install/watchdog/uninstall scripts and the operations runbook |

Each stage is independently revertible in that order.

## Decisions made

- The extraction moved only shared pure contract logic. `simulator.py` keeps its CLI, its disposable
  JSON state file, and its `utc_now`/`send`/`time` patch surfaces, so the eighteen accepted tests
  observe identical behaviour. Protocol request builders take an optional caller clock, which keeps
  the simulator's patched clock authoritative and preserves the original lazy call counts.
- `next_flow` now lives once, in `fitway_edge.sources`, and the simulator imports it, so the client
  and the simulator cannot diverge on synthetic flow (`SPEC.md` module design: one rule in one
  place).
- The store maps the canonical `protocol.accept_acknowledgement` result onto rows rather than
  re-deciding anything. Minute deletion is derived from the difference between the outbox before and
  after that canonical call, which is why minutes accumulated after prepare survive settlement.
- `last_request` is persisted as the original durable bytes, never a re-serialization.
- Health is reported as `process=ok`, `camera=unknown`, `feed=unknown`, `detectorFps=null`. A
  synthetic source observes nothing, and reporting `ok` would assert a site capability this build
  does not have (`SPEC.md` operational-health freeze permits `unknown`; `detectorFps` may be null).
- The Scheduled Task principal uses `S4U` logon, so no password is stored anywhere and none can leak
  into a plan. The README records that the principal needs "Log on as a batch job".
- `--check-config` exists because the update runbook requires a configuration and schema
  compatibility self-check before the manifest swap. `--max-steps` is a bounded QA/self-test control
  that announces itself on standard error; neither accepts a secret.

## Changes by file

| Path | Change |
| --- | --- |
| `edge/fitway_edge/__init__.py` | New package marker; standard library only. |
| `edge/fitway_edge/protocol.py` | New canonical seam: schema-v2 validation, canonical serialization, acknowledgement correlation, command application, request construction. |
| `edge/fitway_edge/config.py` | New strict fail-closed configuration loader with the frozen URL seam and secret-free diagnostics. |
| `edge/fitway_edge/sources.py` | New synthetic counting source, canonical `next_flow`, and the named `SiteGatedSourceError` for `rtsp`. |
| `edge/fitway_edge/sqlite_store.py` | New transactional store: WAL, `synchronous=FULL`, aggregate-only schema, exact durable bytes, 2,880-minute outbox. |
| `edge/fitway_edge/runtime.py` | New `EdgeRuntime`, `UrllibTransport`, exit categories, allow-listed diagnostics. |
| `edge/client.py` | New production CLI: `--config`, `--check-config`, `--max-steps`. |
| `edge/fixtures/client.synthetic.json` | New configuration template; names a token file that is never committed. |
| `edge/simulator.py` | Now a thin CLI/state adapter importing the shared protocol and flow. |
| `edge/test_simulator.py` | Eighteen accepted tests unchanged; six protocol parity tests added. |
| `edge/test_sqlite_store.py` | New durable-state contract tests. |
| `edge/test_client.py` | New configuration, source, runtime, transport, CLI, and privacy tests. |
| `edge/test_windows_lifecycle.py` | New plan-only and disposable-supervisor lifecycle tests. |
| `edge/windows/install.ps1` | New task and ACL planner/installer with `-PlanOnly`. |
| `edge/windows/run.ps1` | New singleton watchdog with bounded restart and process-tree stop. |
| `edge/windows/uninstall.ps1` | New data-preserving stop/remove with `-PlanOnly` and `-StopOnly`. |
| `edge/windows/README.md` | New layout, install, watchdog, update, rollback, and uninstall runbook. |
| `edge/README.md` | Documents the durable client alongside the frozen simulator. |

Frozen cloud/device fixtures `edge/fixtures/{push,backfill,acknowledgement,commands-pending}.json`
are byte-identical. No dependency was added; every module is Python standard library only.

## Validation commands and results

| Command | Result |
| --- | --- |
| `py -3 -m unittest discover -s edge -p test_*.py` | PASS — `Ran 117 tests`, `OK` (18 accepted + 6 parity + 27 store + 39 client + 27 lifecycle) |
| `py -3 -m py_compile edge/simulator.py edge/client.py edge/fitway_edge/{__init__,config,protocol,runtime,sqlite_store,sources}.py edge/test_{simulator,client,sqlite_store,windows_lifecycle}.py` | PASS — exit `0` |
| `pnpm exec vitest run packages/api/src/offline packages/api/src/edge-push.test.ts packages/api/src/occupancy/engine.test.ts apps/server/src/openapi.test.ts` | PASS — `Test Files 4 passed (4)`, `Tests 17 passed (17)`, exit `0` |
| `powershell -NoProfile -Command "[void][scriptblock]::Create(...)"` for the three lifecycle scripts | PASS — exit `0` |
| `pnpm verify:fast` | PASS — 40 unit files / 204 tests, 117 Python tests, "passed without repository mutation" |
| `pnpm verify:phase` with `FITWAY_RUN_ID=p12_edge_b01`, `TEST_DATABASE_URL=...fitway_integration_p12_edge_b01`, `FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p12_edge_b01`, `FITWAY_PHASE=12` | PASS — 204 unit, 117 Python, Phase 12 integration `Test Files 1 passed (1)`, `Tests 5 passed (5)`, "passed without repository mutation" |
| `git diff --check` / `git diff --cached --check` | PASS — exit `0`, no output |
| `git diff --name-status b18690b..HEAD` | 19 paths, all inside the lease plus the owned handoff glob |
| `git diff --name-only --cached` | empty |
| `git status --short --branch` | clean on `work/phase12-edge-client-b01` |

The `pnpm exec vitest` ladder entry ran green from PowerShell in this session; the previously
recorded `pnpm exec vitest --version` anomaly did not recur and consumed no repair attempt. The
disposable database `fitway_integration_p12_edge_b01` was created before the phase run through the
container `fitway-phase2-postgres`; no other database was targeted.

## Privacy and product invariants, and how they were proved

- **No frame/image/video/identity path.** `test_client.PackagePrivacyTests` parses every module in
  the package plus `client.py`, strips the documentation header so prose cannot mask code, and
  asserts that the executable source contains none of `cv2`, `opencv`, `ultralytics`, `torch`,
  `numpy`, `pillow`, `imread`, `imwrite`, `videocapture`, `frame`, `.jpg`, `.png`, `.mp4`. A second
  test asserts that every import root is standard library. `test_simulator.ProtocolParityTests` runs
  the same vocabulary check over the protocol seam.
- **Aggregate-only persistence.** `test_sqlite_store.FirstBootTests` asserts the schema is exactly
  `edge_state` and `edge_outbox` and that no column name contains `frame`, `image`, `video`, `path`,
  `token`, `identity`, `person`, `event`, or `credential`.
- **No secret in diagnostics.** `EdgeRuntime.emit` rejects any field name outside a fixed allow-list
  and redacts the token defensively. `DiagnosticPrivacyTests` drives an outage, a rate limit, a
  server failure, a command-pending correction, and a settlement, then asserts the emitted text
  contains no token, `Bearer`, `://`, host, token filename, `SELECT`, `sqlite`, `currentCount`, or
  `targetValue`. Config `describe()` and `repr` expose only scheme plus a loopback/external category.
- **No secret on the command line or in the task.** `CommandLineTests` asserts the CLI accepts only
  `config`, `check-config`, and `max-steps`. `InstallPlanTests` asserts the rendered plan contains no
  token, `password`, `rtsp`, `://`, or `bearer`, and `ScriptSyntaxTests` asserts no lifecycle script
  contains such a literal.
- **`rtsp` is refused before anything opens.** `create_source` raises `SiteGatedSourceError`
  (`category=site_gated_source`); the CLI exits `6`, and the test asserts no state directory was
  created.

## Site-gated acceptances explicitly NOT claimed

Real RTSP capture, ROI/line calibration, detector or tracker accuracy, hardware suitability, Windows
task permissions under the real principal on the real edge PC, remote-support security, and physical
reboot, update, or power-cut recovery. No real Scheduled Task was registered at any point; the
installer was exercised only through `-PlanOnly` and the watchdog only against disposable child
process trees in temporary directories. `edge/windows/README.md` and this record name those gates.

## Remaining work or exact blocker

None inside this scope. Stages 1, 2, and 3 are complete and green. The candidate awaits independent
verification, then coordinator integration.

## Exact resume command

```powershell
Set-Location 'D:/Projects/fitway-worktrees/phase12-edge-client'
git log --oneline -4
```

## Stop/escalation conditions

Those in `AGENTS.md`, `docs/WORKFLOW.md`, the live Phase 12 ledger, and the approved plan. A
Product/Spec conflict, a privacy or security ambiguity, or unleased shared-file work is immediately
`NEEDS_HUMAN`. A third recurrence of the same gate failure is terminal `FAILED_VALIDATION`.
