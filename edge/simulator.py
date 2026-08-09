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
MAX_BUFFERED_MINUTES = 48 * 60
BACKFILL_BATCH_MINUTES = 100
CANONICAL_UTC = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$")
WALL_TIME = re.compile(r"^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9](?:\.[0-9]{1,6})?)?$")
WEEKDAYS = ("sun", "mon", "tue", "wed", "thu", "fri", "sat")
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


def buffer_completed_minute(state: dict[str, Any], minute: dict[str, Any]) -> None:
    retained = [
        item for item in state.get("outbox", [])
        if item.get("minuteStart") != minute["minuteStart"]
    ]
    retained.append(minute)
    retained.sort(key=lambda item: item["minuteStart"])
    state["outbox"] = retained[-MAX_BUFFERED_MINUTES:]


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
    next_sequence = sequence if sequence is not None else state["sequence"] + 1
    acknowledgement = state.get("appliedCommandId") or None
    buffered = state.get("outbox", [])
    if buffered:
        return {
            "schemaVersion": 2,
            "mode": "backfill",
            "sequence": next_sequence,
            "minutes": buffered[:BACKFILL_BATCH_MINUTES],
            "appliedCommandId": acknowledgement,
        }
    return build_live_push(state, next_sequence, health, now)


def build_live_push(
    state: dict[str, Any],
    sequence: int,
    health: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    acknowledgement = state.get("appliedCommandId") or None
    observed = now or utc_now()
    if not state.get("minute"):
        state["minute"] = minute_iso(observed)
    return {
        "schemaVersion": 2,
        "mode": "live",
        "sequence": sequence,
        "observedAt": iso_utc(observed),
        "currentCount": state["count"],
        "minutes": [{
            "minuteStart": state["minute"],
            "count": state["count"],
            "entries": state["entries"],
            "exits": state["exits"],
        }],
        "health": health or {"process": "ok", "camera": "ok", "feed": "ok", "detectorFps": 4.8},
        "appliedCommandId": acknowledgement,
    }


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


def serialize_push(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")


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


def _valid_minute(value: Any) -> bool:
    if not isinstance(value, dict) or set(value) != {"minuteStart", "count", "entries", "exits"}:
        return False
    if not _canonical_utc_timestamp(value.get("minuteStart")) or not value["minuteStart"].endswith(":00.000Z"):
        return False
    for name in ("count", "entries", "exits"):
        number = value.get(name)
        if not isinstance(number, int) or isinstance(number, bool):
            return False
        if number < (-2_147_483_648 if name == "count" else 0) or number > 2_147_483_647:
            return False
    return True


def valid_push(value: Any) -> bool:
    if not isinstance(value, dict) or value.get("schemaVersion") != 2:
        return False
    mode = value.get("mode")
    expected = (
        {"schemaVersion", "mode", "sequence", "observedAt", "currentCount", "minutes", "health", "appliedCommandId"}
        if mode == "live"
        else {"schemaVersion", "mode", "sequence", "minutes", "appliedCommandId"}
    )
    if mode not in {"live", "backfill"} or set(value) != expected:
        return False
    applied = value.get("appliedCommandId")
    if not _safe_positive_integer(value.get("sequence")) or not (
        applied is None or _safe_positive_integer(applied)
    ):
        return False
    minutes = value.get("minutes")
    maximum = 2 if mode == "live" else BACKFILL_BATCH_MINUTES
    if not isinstance(minutes, list) or not 1 <= len(minutes) <= maximum:
        return False
    if not all(_valid_minute(item) for item in minutes):
        return False
    starts = [item["minuteStart"] for item in minutes]
    if starts != sorted(set(starts)):
        return False
    if mode == "backfill":
        return True
    current_count = value.get("currentCount")
    health = value.get("health")
    if (
        not isinstance(current_count, int)
        or isinstance(current_count, bool)
        or not -2_147_483_648 <= current_count <= 2_147_483_647
        or not _canonical_utc_timestamp(value.get("observedAt"))
        or not isinstance(health, dict)
        or set(health) != {"process", "camera", "feed", "detectorFps"}
    ):
        return False
    statuses = {"ok", "degraded", "failed", "unknown"}
    if any(health.get(name) not in statuses for name in ("process", "camera", "feed")):
        return False
    detector_fps = health.get("detectorFps")
    return detector_fps is None or (
        isinstance(detector_fps, (int, float))
        and not isinstance(detector_fps, bool)
        and math.isfinite(detector_fps)
        and detector_fps >= 0
    )


def _valid_weekly_schedule(value: Any) -> bool:
    if not isinstance(value, dict) or set(value) != set(WEEKDAYS):
        return False
    for day in WEEKDAYS:
        hours = value[day]
        if hours is None:
            continue
        if (
            not isinstance(hours, dict)
            or set(hours) != {"open", "close"}
            or not all(
                isinstance(hours.get(name), str) and WALL_TIME.fullmatch(hours[name])
                for name in ("open", "close")
            )
        ):
            return False
    return True


def _valid_acknowledgement_settings(value: Any, schema_version: Any) -> bool:
    if not isinstance(value, dict):
        return False
    required = {"version", "pushIntervalSeconds"}
    if schema_version == 2:
        required.update({"timezone", "businessDayBoundary", "weeklySchedule"})
    if not required.issubset(value):
        return False
    if not _safe_positive_integer(value.get("version")) or not _safe_positive_integer(
        value.get("pushIntervalSeconds")
    ):
        return False
    if schema_version == 1:
        return set(value) == required
    return (
        isinstance(value.get("timezone"), str)
        and bool(value["timezone"].strip())
        and isinstance(value.get("businessDayBoundary"), str)
        and WALL_TIME.fullmatch(value["businessDayBoundary"]) is not None
        and _valid_weekly_schedule(value.get("weeklySchedule"))
    )


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
    schema_version = value.get("schemaVersion")
    valid_reasons = (
        {"processed", "replay", "sequence_gap"}
        if schema_version == 1
        else {"processed", "replay", "sequence_gap", "commands_pending"}
    )
    command_delivery_valid = (
        isinstance(commands, list)
        and (reason in {"processed", "commands_pending"} or commands == [])
        and (reason != "commands_pending" or len(commands) == 1)
    )
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
        and schema_version in {1, 2}
        and isinstance(accepted, bool)
        and reason in valid_reasons
        and accepted == (reason == "processed")
        and isinstance(value.get("highestProcessedSequence"), int)
        and not isinstance(value.get("highestProcessedSequence"), bool)
        and 0 <= value["highestProcessedSequence"] <= MAX_SAFE_INTEGER
        and commands_valid
        and command_delivery_valid
        and _valid_acknowledgement_settings(settings, schema_version)
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


def accept_acknowledgement(
    state: dict[str, Any],
    payload: dict[str, Any],
    acknowledgement: dict[str, Any],
) -> None:
    if not valid_acknowledgement(acknowledgement):
        raise ValueError("Invalid edge acknowledgement")
    reason = acknowledgement["reason"]
    highest = int(acknowledgement["highestProcessedSequence"])
    if reason == "commands_pending":
        if highest != payload["sequence"] - 1:
            raise ValueError("Command-pending acknowledgement does not match the in-flight sequence")
        apply_commands(state, acknowledgement["commands"])
        return
    if reason not in {"processed", "replay"} or highest != payload["sequence"]:
        raise ValueError("Acknowledgement does not settle the in-flight sequence")
    state["sequence"] = highest
    state["lastRequest"] = payload
    if payload.get("mode") == "backfill":
        acknowledged_minutes = {item["minuteStart"] for item in payload["minutes"]}
        state["outbox"] = [
            item for item in state.get("outbox", [])
            if item["minuteStart"] not in acknowledged_minutes
        ]
    if reason == "processed":
        apply_commands(state, acknowledgement["commands"])
    state["inFlightRequest"] = None


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
