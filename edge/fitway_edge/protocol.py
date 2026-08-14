"""Canonical FITWAY edge device protocol (schema v2).

Anonymous aggregate numbers only. This module is the single definition of edge request
validation, canonical serialization, acknowledgement correlation, command application, and
request construction. It carries no frame, image, video, per-person, or identity data of
any kind, and it is deliberately free of any third-party dependency.

`edge/simulator.py` and the durable production client both import this module so that the
device contract cannot drift between them.
"""

from __future__ import annotations

import json
import math
import re
from datetime import datetime, timezone
from typing import Any, Callable

MAX_SAFE_INTEGER = 9_007_199_254_740_991
MAX_BUFFERED_MINUTES = 48 * 60
BACKFILL_BATCH_MINUTES = 100
CANONICAL_UTC = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$")
WALL_TIME = re.compile(r"^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9](?:\.[0-9]{1,6})?)?$")
WEEKDAYS = ("sun", "mon", "tue", "wed", "thu", "fri", "sat")

Clock = Callable[[], datetime]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def minute_iso(value: datetime) -> str:
    return iso_utc(value.replace(second=0, microsecond=0))


def _observed(now: datetime | None, clock: Clock | None) -> datetime:
    """Resolve the observation instant lazily so a caller's clock stays authoritative."""
    return now or (clock or utc_now)()


def buffer_completed_minute(state: dict[str, Any], minute: dict[str, Any]) -> None:
    retained = [
        item for item in state.get("outbox", [])
        if item.get("minuteStart") != minute["minuteStart"]
    ]
    retained.append(minute)
    retained.sort(key=lambda item: item["minuteStart"])
    state["outbox"] = retained[-MAX_BUFFERED_MINUTES:]


def build_next_push(
    state: dict[str, Any],
    sequence: int | None = None,
    health: dict[str, Any] | None = None,
    now: datetime | None = None,
    clock: Clock | None = None,
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
    return build_live_push(state, next_sequence, health, now, clock)


def build_live_push(
    state: dict[str, Any],
    sequence: int,
    health: dict[str, Any] | None = None,
    now: datetime | None = None,
    clock: Clock | None = None,
) -> dict[str, Any]:
    acknowledgement = state.get("appliedCommandId") or None
    observed = _observed(now, clock)
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


def serialize_push(payload: dict[str, Any]) -> bytes:
    """The one canonical byte form of a request; durable bytes are never re-serialized."""
    return json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")


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
        and isinstance(schema_version, int)
        and not isinstance(schema_version, bool)
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


def correlated_in_flight_request(
    state: dict[str, Any],
    acknowledgement: dict[str, Any],
) -> dict[str, Any]:
    durable_payload = state.get("inFlightRequest")
    if not valid_push(durable_payload):
        raise ValueError("Missing or invalid durable in-flight request")
    if acknowledgement["schemaVersion"] != durable_payload.get("schemaVersion"):
        raise ValueError("Acknowledgement schema version does not match the in-flight request")
    return durable_payload


def accept_acknowledgement(
    state: dict[str, Any],
    payload: dict[str, Any],
    acknowledgement: dict[str, Any],
) -> None:
    if not valid_acknowledgement(acknowledgement):
        raise ValueError("Invalid edge acknowledgement")
    payload = correlated_in_flight_request(state, acknowledgement)
    reason = acknowledgement["reason"]
    highest = int(acknowledgement["highestProcessedSequence"])
    if reason == "commands_pending":
        if payload.get("schemaVersion") != 2 or payload.get("mode") != "live":
            raise ValueError("Command-pending acknowledgement requires a schema-v2 live request")
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
