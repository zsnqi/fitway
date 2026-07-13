# Phase 2 edge simulator

This tool sends **simulated development occupancy** only. It has no camera, image, identity, per-person event, or tracking capability.

Provision a disposable development device with `pnpm edge:provision-dev`, store the one-time token in an ignored local secret, then run:

```powershell
py edge/simulator.py --base-url http://localhost:3100 --token-file .local/phase2-edge-device.token --state-file .local/edge-simulator-state.json --seed 42
```

Use `--endpoint-path /api/edge/push` when the base URL is the same-origin Vercel/web URL. Direct local Hono uses the default `/edge/push` path. Normal cadence always comes from each acknowledgement. `--test-cadence` is an explicit QA-only override and announces itself.

Use `FITWAY_EDGE_TOKEN` or `--token-file` so the token is not exposed in shell history or the process list. Useful one-shot controls are `--action once`, `--action replay`, and `--action gap`. Use `--mode rush` for a deterministic busy pattern and `--mode exit-heavy` to exercise floor-at-zero behavior. Health enums and detector FPS are configurable with `--health-process`, `--health-camera`, `--health-feed`, and `--detector-fps`. State writes are atomic and preserve only acknowledged state across Ctrl+C/restart. A 401 stops without printing the token; 429 honors `Retry-After`; network/5xx retries reuse the same sequence.
