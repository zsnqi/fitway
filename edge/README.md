# FITWAY edge

Two programs share one canonical device contract in `fitway_edge/protocol.py`:

- `client.py` — the durable production client with SQLite persistence and Windows lifecycle scripts.
- `simulator.py` — the frozen Phase 6 development simulator and integration fixture.

Neither has any camera, image, identity, per-person event, or tracking capability, and neither may
take on a third-party dependency: both are Python standard library only.

## Durable client

```powershell
py -3 edge/client.py --config C:\ProgramData\FITWAY\config\client.json
py -3 edge/client.py --config C:\ProgramData\FITWAY\config\client.json --check-config
```

`--config` is the only production input. The strict schema-version-1 JSON file rejects unknown keys
and carries the endpoint, the path to a token file of at least 32 bytes, the SQLite path, the fixed
48-hour retention, the counting source, and the process cadence/backoff bounds. Paths inside it
resolve relative to the configuration file itself. `edge/fixtures/client.synthetic.json` is a
template; the token file it names is never committed.

The resource path must be the external `/api/edge/push`. The internal `/edge/push` is accepted only
when the base URL is loopback, and plaintext transport is refused anywhere else. A base URL may not
carry a path, query, fragment, or user information.

This build accepts `source.kind: "synthetic"` only. A configured `rtsp` source is refused with the
named `site_gated_source` error before anything is opened; real capture, calibration, and detection
remain site-gated work under a later scope. Because the source observes nothing, the client honestly
reports `camera` and `feed` health as `unknown` with no detector rate.

State lives in one SQLite database using WAL and `synchronous=FULL`, holding aggregates and the exact
canonical request bytes only: sequence, current count, the open minute accumulator, the highest
applied command id, the last settled request, the in-flight request, and a 2,880-minute outbox. Every
mutation is one `BEGIN IMMEDIATE` transaction and one commit, so an abrupt stop recovers to either the
exact pre-state or the complete post-state. The request bytes are persisted before they are sent and
resent unchanged — byte for byte, never re-serialized — until a correlated processed or replay
acknowledgement settles them. Counting continues through an outage without disturbing those frozen
bytes, and settlement removes only the minutes the settled request actually carried.

Back up the database together with its `-wal` and `-shm` files as one unit, and only while the client
is stopped. Exit codes: `0` clean stop, `2` configuration, `3` authentication, `4` protocol, `5`
durable state, `6` site-gated source.

Diagnostics are fixed event names with an allow-listed set of fields and aggregate health only. No
token, URL, host, request payload, count, SQL, or file content is ever emitted; the endpoint appears
only as its scheme and a loopback/external category.

## Frozen Phase 6 simulator

This tool sends **simulated development occupancy** only. It has no camera, image, identity, per-person event, or tracking capability.

Provision a disposable development device with `pnpm edge:provision-dev`, store the one-time token in an ignored local secret, then run:

```powershell
py edge/simulator.py --base-url http://localhost:3100 --token-file .local/phase2-edge-device.token --state-file .local/edge-simulator-state.json --seed 42
```

Use `--endpoint-path /api/edge/push` when the base URL is the same-origin Vercel/web URL. Direct local Hono uses the default `/edge/push` path. Normal cadence always comes from each acknowledgement. `--test-cadence` is an explicit QA-only override and announces itself.

Use `FITWAY_EDGE_TOKEN` or `--token-file` so the token is not exposed in shell history or the process list. Useful one-shot controls are `--action once`, `--action replay`, and `--action gap`. Use `--mode rush` for a deterministic busy pattern and `--mode exit-heavy` to exercise floor-at-zero behavior. Health enums and detector FPS are configurable with `--health-process`, `--health-camera`, `--health-feed`, and `--detector-fps`.

The schema-v2 client keeps counting during network, rate-limit, and server failures. Completed minute buckets are written atomically to the local state outbox, retained for up to 48 hours, and drained in batches of 100 as `mode=backfill` before the next `mode=live` payload. Backfill never carries current-count or health authority. The exact in-flight request is persisted before sending and retried unchanged across process restarts until a matching processed/replay acknowledgement settles it. When the server returns `commands_pending`, the simulator persists and applies that command, then replaces the rejected request with the same sequence from the corrected local count before live authority can resume. A 401 stops without printing the token; 429 honors `Retry-After`.

Schema-v2 acknowledgements require `version`, `pushIntervalSeconds`, `timezone`, `businessDayBoundary`, and `weeklySchedule`. Reset remains command-driven through `reset_zero`; the simulator does not compute the reset schedule. Additional keys inside `settings` are tolerated for forward compatibility, while the acknowledgement envelope and every other nested structure remain strict.
