# Frozen Phase 6 edge simulator

This tool sends **simulated development occupancy** only. It has no camera, image, identity, per-person event, or tracking capability.

Provision a disposable development device with `pnpm edge:provision-dev`, store the one-time token in an ignored local secret, then run:

```powershell
py edge/simulator.py --base-url http://localhost:3100 --token-file .local/phase2-edge-device.token --state-file .local/edge-simulator-state.json --seed 42
```

Use `--endpoint-path /api/edge/push` when the base URL is the same-origin Vercel/web URL. Direct local Hono uses the default `/edge/push` path. Normal cadence always comes from each acknowledgement. `--test-cadence` is an explicit QA-only override and announces itself.

Use `FITWAY_EDGE_TOKEN` or `--token-file` so the token is not exposed in shell history or the process list. Useful one-shot controls are `--action once`, `--action replay`, and `--action gap`. Use `--mode rush` for a deterministic busy pattern and `--mode exit-heavy` to exercise floor-at-zero behavior. Health enums and detector FPS are configurable with `--health-process`, `--health-camera`, `--health-feed`, and `--detector-fps`.

The schema-v2 client keeps counting during network, rate-limit, and server failures. Completed minute buckets are written atomically to the local state outbox, retained for up to 48 hours, and drained in batches of 100 as `mode=backfill` before the next `mode=live` payload. Backfill never carries current-count or health authority. The exact in-flight request is persisted before sending and retried unchanged across process restarts until a matching processed/replay acknowledgement settles it. When the server returns `commands_pending`, the simulator persists and applies that command, then replaces the rejected request with the same sequence from the corrected local count before live authority can resume. A 401 stops without printing the token; 429 honors `Retry-After`.

Schema-v2 acknowledgements require `version`, `pushIntervalSeconds`, `timezone`, `businessDayBoundary`, and `weeklySchedule`. Reset remains command-driven through `reset_zero`; the simulator does not compute the reset schedule. Additional keys inside `settings` are tolerated for forward compatibility, while the acknowledgement envelope and every other nested structure remain strict.
