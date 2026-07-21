#!/usr/bin/env python3
"""Fitway Phase 2 simulated development occupancy client (anonymous numbers only)."""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import re
import signal
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error, request

DEFAULT_RESOURCE_PATH = "/edge/push"
MAX_SAFE_INTEGER = 9_007_199_254_740_991
CANONICAL_UTC = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$")
STOP = False


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def minute_iso(value: datetime) -> str:
    return iso_utc(value.replace(second=0, microsecond=0))


def load_state(path: Path, starting_count: int) -> dict[str, Any]:
    if not path.exists():
        return {
            "sequence": 0,
            "count": max(0, starting_count),
            "minute": "",
            "entries": 0,
            "exits": 0,
            "appliedCommandId": 0,
        }
    value = json.loads(path.read_text(encoding="utf-8"))
    return {
        "sequence": max(0, int(value["sequence"])),
        "count": max(0, int(value["count"])),
        "minute": str(value.get("minute", "")),
        "entries": max(0, int(value.get("entries", 0))),
        "exits": max(0, int(value.get("exits", 0))),
        "appliedCommandId": max(0, int(value.get("appliedCommandId", 0))),
        "lastRequest": value.get("lastRequest"),
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


def build_push(
    state: dict[str, Any],
    rng: random.Random,
    mode: str,
    sequence: int | None = None,
    health: dict[str, Any] | None = None,
) -> dict[str, Any]:
    now = utc_now()
    minute = minute_iso(now)
    if state["minute"] != minute:
        state["minute"], state["entries"], state["exits"] = minute, 0, 0
    entries, exits = next_flow(rng, mode, state["count"])
    state["entries"] += entries
    state["exits"] += exits
    state["count"] = max(0, state["count"] + entries - exits)
    return {
        "schemaVersion": 1,
        "sequence": sequence if sequence is not None else state["sequence"] + 1,
        "observedAt": iso_utc(now),
        "currentCount": state["count"],
        "minutes": [{
            "minuteStart": minute,
            "count": state["count"],
            "entries": state["entries"],
            "exits": state["exits"],
        }],
        "health": health or {"process": "ok", "camera": "ok", "feed": "ok", "detectorFps": 4.8},
        "appliedCommandId": state.get("appliedCommandId") or None,
    }


def send(url: str, token: str, payload: dict[str, Any], timeout: float = 15) -> tuple[int, dict[str, Any], dict[str, str]]:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
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


def _safe_positive_integer(value: Any) -> bool:
    return (
        isinstance(value, int)
        and not isinstance(value, bool)
        and 0 < value <= MAX_SAFE_INTEGER
    )


def _canonical_utc_timestamp(value: Any) -> bool:
    if not isinstance(value, str) or not CANONICAL_UTC.fullmatch(value):
        return False
    try:
        parsed = datetime.strptime(value, "%Y-%m-%dT%H:%M:%S.%fZ")
    except ValueError:
        return False
    return iso_utc(parsed.replace(tzinfo=timezone.utc)) == value


def _valid_command(value: Any) -> bool:
    if not isinstance(value, dict) or set(value) != {"id", "type", "targetValue", "issuedAt"}:
        return False
    command_type = value.get("type")
    target = value.get("targetValue")
    target_valid = (
        command_type == "set_count"
        and isinstance(target, int)
        and not isinstance(target, bool)
        and 0 <= target <= 2_147_483_647
    ) or (command_type == "reset_zero" and target is None)
    if not target_valid or not _safe_positive_integer(value.get("id")):
        return False
    return _canonical_utc_timestamp(value.get("issuedAt"))


def valid_acknowledgement(value: Any) -> bool:
    if not isinstance(value, dict):
        return False
    settings = value.get("settings")
    reason = value.get("reason")
    accepted = value.get("accepted")
    commands = value.get("commands")
    commands_valid = (
        isinstance(commands, list)
        and len(commands) <= 1
        and all(_valid_command(item) for item in commands)
    )
    if commands_valid:
        ids = [item["id"] for item in commands]
        commands_valid = ids == sorted(set(ids))
    return (
        set(value) == {
            "schemaVersion",
            "accepted",
            "reason",
            "highestProcessedSequence",
            "commands",
            "settings",
            "serverTime",
        }
        and value.get("schemaVersion") == 1
        and isinstance(accepted, bool)
        and reason in {"processed", "replay", "sequence_gap"}
        and accepted == (reason == "processed")
        and isinstance(value.get("highestProcessedSequence"), int)
        and not isinstance(value.get("highestProcessedSequence"), bool)
        and 0 <= value["highestProcessedSequence"] <= MAX_SAFE_INTEGER
        and commands_valid
        and (accepted or commands == [])
        and isinstance(settings, dict)
        and set(settings) == {"version", "pushIntervalSeconds"}
        and isinstance(settings.get("version"), int)
        and not isinstance(settings.get("version"), bool)
        and 0 < settings["version"] <= MAX_SAFE_INTEGER
        and isinstance(settings.get("pushIntervalSeconds"), int)
        and not isinstance(settings.get("pushIntervalSeconds"), bool)
        and 0 < settings["pushIntervalSeconds"] <= MAX_SAFE_INTEGER
        and _canonical_utc_timestamp(value.get("serverTime"))
    )


def apply_commands(state: dict[str, Any], commands: list[dict[str, Any]]) -> None:
    last_applied = int(state.get("appliedCommandId", 0))
    for command in commands:
        if not _valid_command(command):
            raise ValueError("Invalid edge command")
        command_id = int(command["id"])
        if command_id <= last_applied:
            continue
        if command["type"] == "set_count":
            state["count"] = int(command["targetValue"])
        else:
            state["count"] = 0
        last_applied = command_id
    state["appliedCommandId"] = last_applied


def run(args: argparse.Namespace) -> int:
    state_path = Path(args.state_file)
    state = load_state(state_path, args.starting_count)
    rng = random.Random(args.seed)
    url = args.base_url.rstrip("/") + args.endpoint_path
    cadence = args.test_cadence if args.test_cadence is not None else 20
    if args.test_cadence is not None:
        print("TEST-ONLY cadence override active; acknowledgement timing is intentionally bypassed.")
    recovery_payload = None
    candidate_state = state
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
    else:
        expected = state["sequence"] + 1
        candidate_state = dict(state)
        payload = build_push(candidate_state, rng, args.mode, expected, health)
        if args.action == "gap":
            recovery_payload = payload
            payload = {**payload, "sequence": expected + 1}
    backoff = 1.0
    while not STOP:
        try:
            status, acknowledgement, headers = send(url, args.token, payload)
        except (error.URLError, TimeoutError, OSError) as failure:
            print(f"Network failure for sequence {payload['sequence']}: {type(failure).__name__}; retrying.")
            time.sleep(min(30, backoff) + rng.random())
            backoff = min(30, backoff * 2)
            continue
        if status == 401:
            print("Device authentication failed; check the local development token.", file=sys.stderr)
            return 3
        if status == 429:
            delay = max(1, int(headers.get("Retry-After", "1")))
            print(f"Rate limited at sequence {payload['sequence']}; retrying after {delay}s.")
            time.sleep(delay)
            continue
        if status >= 500:
            time.sleep(min(30, backoff) + rng.random())
            backoff = min(30, backoff * 2)
            continue
        if status >= 400:
            print(f"Push rejected with HTTP {status}: {acknowledgement.get('error', 'invalid response')}", file=sys.stderr)
            return 4
        if not valid_acknowledgement(acknowledgement):
            print("Server returned an invalid acknowledgement; stopping without advancing state.", file=sys.stderr)
            return 4
        reason = acknowledgement.get("reason")
        highest = int(acknowledgement.get("highestProcessedSequence", -1))
        print(f"sequence={payload['sequence']} outcome={reason} highest={highest} count={payload['currentCount']} entries={payload['minutes'][0]['entries']} exits={payload['minutes'][0]['exits']}")
        if reason == "processed":
            state = candidate_state
            state["sequence"] = highest
            state["lastRequest"] = payload
            apply_commands(state, acknowledgement["commands"])
            save_state(state_path, state)
        elif reason == "replay" and highest == payload["sequence"]:
            state = candidate_state
            state["sequence"] = highest
            save_state(state_path, state)
        elif reason == "replay":
            print("Replay acknowledgement is ahead of the saved request; reconcile disposable simulator state.", file=sys.stderr)
            return 5
        elif reason == "sequence_gap":
            expected = highest + 1
            if recovery_payload and recovery_payload["sequence"] == expected:
                payload = recovery_payload
                recovery_payload = None
                continue
            last_request = state.get("lastRequest")
            if isinstance(last_request, dict) and last_request.get("sequence") == expected:
                candidate_state = state
                payload = last_request
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
        candidate_state = dict(state)
        payload = build_push(candidate_state, rng, args.mode, health=health)
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
