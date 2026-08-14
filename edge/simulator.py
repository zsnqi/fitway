#!/usr/bin/env python3
"""Fitway Phase 2 simulated development occupancy client (anonymous numbers only).

The device contract itself lives in `fitway_edge.protocol`; this module is only the
command-line adapter, the disposable JSON state file, and the synthetic flow generator.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import signal
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib import error, request

from fitway_edge import protocol
from fitway_edge.protocol import (
    BACKFILL_BATCH_MINUTES,
    CANONICAL_UTC,
    MAX_BUFFERED_MINUTES,
    MAX_SAFE_INTEGER,
    WALL_TIME,
    WEEKDAYS,
    accept_acknowledgement,
    apply_commands,
    buffer_completed_minute,
    iso_utc,
    minute_iso,
    serialize_push,
    valid_acknowledgement,
    valid_push,
)

DEFAULT_RESOURCE_PATH = "/edge/push"
STOP = False

_correlated_in_flight_request = protocol.correlated_in_flight_request


def utc_now() -> datetime:
    return protocol.utc_now()


def load_state(path: Path, starting_count: int) -> dict[str, Any]:
    if not path.exists():
        return {
            "sequence": 0,
            "count": max(0, starting_count),
            "minute": "",
            "entries": 0,
            "exits": 0,
            "appliedCommandId": 0,
            "outbox": [],
            "inFlightRequest": None,
        }
    value = json.loads(path.read_text(encoding="utf-8"))
    outbox = value.get("outbox", [])
    if not isinstance(outbox, list):
        raise ValueError("Simulator outbox must be a list")
    in_flight = value.get("inFlightRequest")
    if in_flight is not None and not valid_push(in_flight):
        raise ValueError("Simulator in-flight request is invalid")
    return {
        "sequence": max(0, int(value["sequence"])),
        "count": max(0, int(value["count"])),
        "minute": str(value.get("minute", "")),
        "entries": max(0, int(value.get("entries", 0))),
        "exits": max(0, int(value.get("exits", 0))),
        "appliedCommandId": max(0, int(value.get("appliedCommandId", 0))),
        "outbox": outbox[-MAX_BUFFERED_MINUTES:],
        "lastRequest": value.get("lastRequest"),
        "inFlightRequest": in_flight,
    }


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary = tempfile.mkstemp(prefix=path.name, dir=path.parent, text=True)
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as stream:
            json.dump(state, stream, separators=(",", ":"), sort_keys=True)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def next_flow(rng: random.Random, mode: str, count: int) -> tuple[int, int]:
    if mode == "exit-heavy":
        return (0, rng.randint(1, 3))
    if mode == "rush" or rng.random() < 0.1:
        entries = rng.choices([0, 1, 2, 3, 4], weights=[20, 30, 25, 18, 7])[0]
        exits = rng.choices([0, 1, 2], weights=[55, 35, 10])[0] if count else 0
        return entries, exits
    entries = rng.choices([0, 1, 2, 3], weights=[65, 25, 8, 2])[0]
    exits = rng.choices([0, 1, 2], weights=[70, 25, 5])[0] if count else 0
    return entries, exits


def record_sample(
    state: dict[str, Any],
    rng: random.Random,
    mode: str,
    now: datetime | None = None,
) -> None:
    observed = now or utc_now()
    minute = minute_iso(observed)
    if state.get("minute") and state["minute"] != minute:
        buffer_completed_minute(state, {
            "minuteStart": state["minute"],
            "count": state["count"],
            "entries": state["entries"],
            "exits": state["exits"],
        })
        state["entries"] = 0
        state["exits"] = 0
    state["minute"] = minute
    entries, exits = next_flow(rng, mode, state["count"])
    state["entries"] += entries
    state["exits"] += exits
    state["count"] = max(0, state["count"] + entries - exits)


def build_next_push(
    state: dict[str, Any],
    sequence: int | None = None,
    health: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    return protocol.build_next_push(state, sequence, health, now, utc_now)


def build_live_push(
    state: dict[str, Any],
    sequence: int,
    health: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    return protocol.build_live_push(state, sequence, health, now, utc_now)


def build_push(
    state: dict[str, Any],
    rng: random.Random,
    mode: str,
    sequence: int | None = None,
    health: dict[str, Any] | None = None,
) -> dict[str, Any]:
    now = utc_now()
    record_sample(state, rng, mode, now)
    return build_next_push(state, sequence, health, now)


def send(url: str, token: str, payload: dict[str, Any], timeout: float = 15) -> tuple[int, dict[str, Any], dict[str, str]]:
    body = serialize_push(payload)
    call = request.Request(url, data=body, method="POST", headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json", "Accept": "application/json"
    })
    try:
        with request.urlopen(call, timeout=timeout) as response:
            return response.status, json.loads(response.read()), dict(response.headers)
    except error.HTTPError as failure:
        try:
            value = json.loads(failure.read())
        except (json.JSONDecodeError, UnicodeDecodeError):
            value = {"error": "http_error"}
        return failure.code, value, dict(failure.headers)


def run(args: argparse.Namespace) -> int:
    state_path = Path(args.state_file)
    state = load_state(state_path, args.starting_count)
    rng = random.Random(args.seed)
    url = args.base_url.rstrip("/") + args.endpoint_path
    cadence = args.test_cadence if args.test_cadence is not None else 20
    if args.test_cadence is not None:
        print("TEST-ONLY cadence override active; acknowledgement timing is intentionally bypassed.")
    recovery_payload = None
    health = {
        "process": args.health_process,
        "camera": args.health_camera,
        "feed": args.health_feed,
        "detectorFps": args.detector_fps,
    }
    if args.action == "replay":
        payload = state.get("lastRequest")
        if not payload:
            print("No acknowledged request is saved for replay.", file=sys.stderr)
            return 2
        state["inFlightRequest"] = payload
        save_state(state_path, state)
    elif args.action != "gap" and state.get("inFlightRequest") is not None:
        payload = state["inFlightRequest"]
    else:
        expected = state["sequence"] + 1
        payload = build_push(state, rng, args.mode, expected, health)
        if args.action == "gap":
            recovery_payload = payload
            payload = {**payload, "sequence": expected + 1}
        state["inFlightRequest"] = payload
        save_state(state_path, state)
    backoff = 1.0
    while not STOP:
        try:
            status, acknowledgement, headers = send(url, args.token, payload)
        except (error.URLError, TimeoutError, OSError) as failure:
            print(f"Network failure for sequence {payload['sequence']}: {type(failure).__name__}; retrying.")
            time.sleep(min(30, backoff) + rng.random())
            record_sample(state, rng, args.mode)
            save_state(state_path, state)
            backoff = min(30, backoff * 2)
            continue
        if status == 401:
            print("Device authentication failed; check the local development token.", file=sys.stderr)
            return 3
        if status == 429:
            delay = max(1, int(headers.get("Retry-After", "1")))
            print(f"Rate limited at sequence {payload['sequence']}; retrying after {delay}s.")
            time.sleep(delay)
            record_sample(state, rng, args.mode)
            save_state(state_path, state)
            continue
        if status >= 500:
            time.sleep(min(30, backoff) + rng.random())
            record_sample(state, rng, args.mode)
            save_state(state_path, state)
            backoff = min(30, backoff * 2)
            continue
        if status >= 400:
            print(f"Push rejected with HTTP {status}: {acknowledgement.get('error', 'invalid response')}", file=sys.stderr)
            return 4
        if not valid_acknowledgement(acknowledgement):
            print("Server returned an invalid acknowledgement; stopping without advancing state.", file=sys.stderr)
            return 4
        try:
            payload = _correlated_in_flight_request(state, acknowledgement)
        except ValueError:
            print("Server returned an invalid acknowledgement; stopping without advancing state.", file=sys.stderr)
            return 4
        reason = acknowledgement.get("reason")
        highest = int(acknowledgement.get("highestProcessedSequence", -1))
        if payload.get("mode") == "backfill":
            detail = f"backfill_minutes={len(payload['minutes'])}"
        else:
            detail = f"count={payload['currentCount']} entries={payload['minutes'][0]['entries']} exits={payload['minutes'][0]['exits']}"
        print(f"sequence={payload['sequence']} outcome={reason} highest={highest} {detail}")
        if reason == "commands_pending":
            accept_acknowledgement(state, payload, acknowledgement)
            payload = build_live_push(state, payload["sequence"], health)
            state["inFlightRequest"] = payload
            save_state(state_path, state)
            backoff = 1.0
            continue
        if reason == "processed" or (reason == "replay" and highest == payload["sequence"]):
            accept_acknowledgement(state, payload, acknowledgement)
            save_state(state_path, state)
        elif reason == "replay":
            print("Replay acknowledgement is ahead of the saved request; reconcile disposable simulator state.", file=sys.stderr)
            return 5
        elif reason == "sequence_gap":
            expected = highest + 1
            if recovery_payload and recovery_payload["sequence"] == expected:
                payload = recovery_payload
                recovery_payload = None
                state["inFlightRequest"] = payload
                save_state(state_path, state)
                continue
            last_request = state.get("lastRequest")
            if isinstance(last_request, dict) and last_request.get("sequence") == expected:
                payload = last_request
                state["inFlightRequest"] = payload
                save_state(state_path, state)
                continue
            print(f"Sequence gap requires request {expected}; reconcile or reset this disposable simulator state.", file=sys.stderr)
            return 5
        if args.action != "run":
            return 0
        settings = acknowledgement.get("settings", {})
        if args.test_cadence is None:
            cadence = int(settings["pushIntervalSeconds"])
        deadline = time.monotonic() + cadence
        while not STOP and time.monotonic() < deadline:
            time.sleep(min(0.2, deadline - time.monotonic()))
        record_sample(state, rng, args.mode)
        payload = build_next_push(state, health=health)
        state["inFlightRequest"] = payload
        save_state(state_path, state)
        backoff = 1.0
    save_state(state_path, state)
    print(f"Stopped simulated development occupancy at sequence {state['sequence']} count {state['count']}.")
    return 0


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description="Send simulated development occupancy to Fitway.")
    value.add_argument("--base-url", required=True)
    value.add_argument("--endpoint-path", default=DEFAULT_RESOURCE_PATH)
    value.add_argument("--token", help="Manual-QA compatibility only; prefer FITWAY_EDGE_TOKEN or --token-file")
    value.add_argument("--token-file", help="Path to an ignored file containing the raw token")
    value.add_argument("--seed", type=int, default=42)
    value.add_argument("--starting-count", type=int, default=0)
    value.add_argument("--state-file", default=".local/edge-simulator-state.json")
    value.add_argument("--mode", choices=["normal", "rush", "exit-heavy"], default="normal")
    for name in ("process", "camera", "feed"):
        value.add_argument(
            f"--health-{name}",
            choices=["ok", "degraded", "failed", "unknown"],
            default="ok",
        )
    value.add_argument("--detector-fps", type=float, default=4.8)
    value.add_argument("--action", choices=["run", "once", "replay", "gap"], default="run")
    value.add_argument("--test-cadence", type=float)
    return value


if __name__ == "__main__":
    def stop(_signum: int, _frame: Any) -> None:
        global STOP
        STOP = True
    signal.signal(signal.SIGINT, stop)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, stop)
    argument_parser = parser()
    arguments = argument_parser.parse_args()
    cli_token_used = bool(arguments.token)
    arguments.token = arguments.token or (
        Path(arguments.token_file).read_text(encoding="utf-8").strip()
        if arguments.token_file
        else os.environ.get("FITWAY_EDGE_TOKEN")
    )
    if cli_token_used:
        print("Warning: --token is for canonical local Manual QA compatibility; environment/token-file is safer.", file=sys.stderr)
    if not arguments.token:
        argument_parser.error("set FITWAY_EDGE_TOKEN or provide --token-file")
    if not math.isfinite(arguments.detector_fps) or arguments.detector_fps < 0:
        argument_parser.error("--detector-fps must be non-negative")
    sys.exit(run(arguments))
