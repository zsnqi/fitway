import json
import random
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from urllib import error

import simulator


FROZEN_SETTINGS = {
    "version": 1,
    "pushIntervalSeconds": 20,
    "timezone": "Asia/Riyadh",
    "businessDayBoundary": "04:00:00",
    "weeklySchedule": {
        "sun": {"open": "06:00:00", "close": "23:00:00"},
        "mon": {"open": "06:00:00", "close": "23:00:00"},
        "tue": {"open": "06:00:00", "close": "23:00:00"},
        "wed": {"open": "06:00:00", "close": "23:00:00"},
        "thu": {"open": "06:00:00", "close": "23:00:00"},
        "fri": {"open": "14:00:00", "close": "23:00:00"},
        "sat": None,
    },
}


def acknowledgement(
    sequence: int,
    *,
    reason: str = "processed",
    commands: list[dict[str, object]] | None = None,
) -> dict[str, object]:
    return {
        "schemaVersion": 2,
        "accepted": reason == "processed",
        "reason": reason,
        "highestProcessedSequence": sequence if reason != "commands_pending" else sequence - 1,
        "commands": commands or [],
        "settings": FROZEN_SETTINGS,
        "serverTime": "2026-07-13T18:25:20.250Z",
    }


class SimulatorTests(unittest.TestCase):
    def test_network_failure_keeps_counting_and_persists_the_completed_minute(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            state_path = Path(folder) / "state.json"
            args = simulator.parser().parse_args([
                "--base-url", "http://127.0.0.1:1",
                "--token", "fixture-token",
                "--state-file", str(state_path),
                "--action", "once",
            ])
            acknowledgement = {
                "schemaVersion": 2,
                "accepted": True,
                "reason": "processed",
                "highestProcessedSequence": 1,
                "commands": [],
                "settings": FROZEN_SETTINGS,
                "serverTime": "2026-07-13T18:25:20.250Z",
            }
            with (
                patch.object(
                    simulator,
                    "utc_now",
                    side_effect=[
                        datetime(2026, 7, 13, 18, 24, 20, tzinfo=timezone.utc),
                        datetime(2026, 7, 13, 18, 25, 20, tzinfo=timezone.utc),
                    ],
                ),
                patch.object(
                    simulator,
                    "send",
                    side_effect=[error.URLError("offline"), (200, acknowledgement, {})],
                ),
                patch.object(simulator.time, "sleep"),
            ):
                self.assertEqual(simulator.run(args), 0)
            saved = simulator.load_state(state_path, 0)
            self.assertEqual(saved["sequence"], 1)
            self.assertEqual(
                [item["minuteStart"] for item in saved["outbox"]],
                ["2026-07-13T18:24:00.000Z"],
            )

    def test_buffers_completed_minutes_and_applies_commands_before_live_resume(self) -> None:
        state = simulator.load_state(Path("does-not-exist"), 2)
        health = {"process": "ok", "camera": "ok", "feed": "ok", "detectorFps": 4.8}
        simulator.record_sample(
            state,
            random.Random(42),
            "normal",
            datetime(2026, 7, 13, 18, 24, 20, tzinfo=timezone.utc),
        )
        simulator.record_sample(
            state,
            random.Random(43),
            "normal",
            datetime(2026, 7, 13, 18, 25, 20, tzinfo=timezone.utc),
        )
        payload = simulator.build_next_push(
            state,
            1,
            health,
            datetime(2026, 7, 13, 18, 25, 20, tzinfo=timezone.utc),
        )
        self.assertEqual(payload["schemaVersion"], 2)
        self.assertEqual(payload["mode"], "backfill")
        self.assertEqual(payload["minutes"][0]["minuteStart"], "2026-07-13T18:24:00.000Z")
        self.assertNotIn("currentCount", payload)

        simulator.accept_acknowledgement(
            state,
            payload,
            {
                "schemaVersion": 2,
                "accepted": True,
                "reason": "processed",
                "highestProcessedSequence": 1,
                "commands": [{
                    "id": 3,
                    "type": "set_count",
                    "targetValue": 4,
                    "issuedAt": "2026-07-13T18:25:19.000Z",
                }],
                "settings": FROZEN_SETTINGS,
                "serverTime": "2026-07-13T18:25:20.250Z",
            },
        )
        self.assertEqual(state["outbox"], [])
        self.assertEqual(state["count"], 4)
        self.assertEqual(state["appliedCommandId"], 3)
        live = simulator.build_next_push(
            state,
            2,
            health,
            datetime(2026, 7, 13, 18, 25, 40, tzinfo=timezone.utc),
        )
        self.assertEqual(live["mode"], "live")
        self.assertEqual(live["currentCount"], 4)
        self.assertEqual(live["appliedCommandId"], 3)

    def test_shared_fixtures_match_the_frozen_phase6_contract(self) -> None:
        live = json.loads(
            (Path(__file__).parent / "fixtures" / "push.json").read_text(encoding="utf-8")
        )
        backfill = json.loads(
            (Path(__file__).parent / "fixtures" / "backfill.json").read_text(encoding="utf-8")
        )
        acknowledgement = json.loads(
            (Path(__file__).parent / "fixtures" / "acknowledgement.json").read_text(encoding="utf-8")
        )
        commands_pending = json.loads(
            (Path(__file__).parent / "fixtures" / "commands-pending.json").read_text(encoding="utf-8")
        )
        self.assertTrue(simulator.valid_push(live))
        self.assertTrue(simulator.valid_push(backfill))
        self.assertTrue(simulator.valid_acknowledgement(acknowledgement))
        self.assertTrue(simulator.valid_acknowledgement(commands_pending))
        self.assertEqual(live["mode"], "live")
        self.assertEqual(backfill["mode"], "backfill")
        self.assertNotIn("currentCount", backfill)

    def test_state_round_trip_and_floor(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            state = simulator.load_state(path, -4)
            self.assertEqual(state["count"], 0)
            state["sequence"] = 7
            state["appliedCommandId"] = 5
            simulator.save_state(path, state)
            self.assertEqual(simulator.load_state(path, 0)["sequence"], 7)
            self.assertEqual(simulator.load_state(path, 0)["appliedCommandId"], 5)
            self.assertEqual(json.loads(path.read_text(encoding="utf-8"))["count"], 0)

    def test_exit_heavy_payload_stays_nonnegative_and_is_contract_shaped(self) -> None:
        state = simulator.load_state(Path("does-not-exist"), 1)
        payload = simulator.build_push(state, random.Random(42), "exit-heavy")
        self.assertEqual(payload["schemaVersion"], 2)
        self.assertEqual(payload["mode"], "live")
        self.assertEqual(payload["sequence"], 1)
        self.assertGreaterEqual(payload["currentCount"], 0)
        self.assertIsNone(payload["appliedCommandId"])
        self.assertEqual(payload["health"]["process"], "ok")

    def test_acknowledgement_validation_rejects_inconsistent_acceptance(self) -> None:
        acknowledgement = {
            "schemaVersion": 1,
            "accepted": True,
            "reason": "processed",
            "highestProcessedSequence": 1,
            "commands": [{
                "id": 2,
                "type": "set_count",
                "targetValue": 7,
                "issuedAt": "2026-07-13T18:24:19.000Z",
            }],
            "settings": {"version": 1, "pushIntervalSeconds": 20},
            "serverTime": "2026-07-13T18:24:20.250Z",
        }
        self.assertTrue(simulator.valid_acknowledgement(acknowledgement))
        self.assertFalse(
            simulator.valid_acknowledgement({**acknowledgement, "reason": "replay"})
        )
        self.assertFalse(
            simulator.valid_acknowledgement(
                {**acknowledgement, "highestProcessedSequence": simulator.MAX_SAFE_INTEGER + 1}
            )
        )
        self.assertFalse(
            simulator.valid_acknowledgement(
                {**acknowledgement, "serverTime": "2026-07-13T18:24:20Z"}
            )
        )
        invalid_command = {
            **acknowledgement,
            "commands": [{**acknowledgement["commands"][0], "issuedAt": "2026-07-13T18:24:19Z"}],
        }
        self.assertFalse(simulator.valid_acknowledgement(invalid_command))
        multiple_commands = {
            **acknowledgement,
            "commands": [
                *acknowledgement["commands"],
                {
                    "id": 3,
                    "type": "reset_zero",
                    "targetValue": None,
                    "issuedAt": "2026-07-13T18:24:20.000Z",
                },
            ],
        }
        self.assertFalse(simulator.valid_acknowledgement(multiple_commands))
        self.assertFalse(
            simulator.valid_acknowledgement({**acknowledgement, "commands": {}})
        )

    def test_v2_acknowledgement_requires_frozen_settings_but_allows_additive_keys(self) -> None:
        value = acknowledgement(1)
        self.assertTrue(simulator.valid_acknowledgement(value))
        additive = {
            **value,
            "settings": {**FROZEN_SETTINGS, "resetBufferMinutes": 30},
        }
        self.assertTrue(simulator.valid_acknowledgement(additive))
        for missing in FROZEN_SETTINGS:
            incomplete = dict(FROZEN_SETTINGS)
            del incomplete[missing]
            self.assertFalse(
                simulator.valid_acknowledgement({**value, "settings": incomplete}),
                missing,
            )
        legacy = {
            **value,
            "schemaVersion": 1,
            "settings": {"version": 1, "pushIntervalSeconds": 20},
        }
        self.assertTrue(simulator.valid_acknowledgement(legacy))
        self.assertFalse(
            simulator.valid_acknowledgement(
                {
                    **legacy,
                    "settings": {**legacy["settings"], "timezone": "Asia/Riyadh"},
                }
            )
        )

    def test_restart_replays_exact_in_flight_request_and_removes_only_its_minutes(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            state_path = Path(folder) / "state.json"
            state = simulator.load_state(state_path, 3)
            start = datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc)
            for offset in range(101):
                simulator.buffer_completed_minute(
                    state,
                    {
                        "minuteStart": simulator.minute_iso(start + timedelta(minutes=offset)),
                        "count": offset,
                        "entries": 1,
                        "exits": 0,
                    },
                )
            exact = simulator.build_next_push(state, 1)
            serialized = simulator.serialize_push(exact)
            state["inFlightRequest"] = exact
            simulator.save_state(state_path, state)
            reloaded = simulator.load_state(state_path, 0)
            self.assertEqual(
                simulator.serialize_push(reloaded["inFlightRequest"]),
                serialized,
            )
            args = simulator.parser().parse_args([
                "--base-url", "http://127.0.0.1:1",
                "--token", "fixture-token",
                "--state-file", str(state_path),
                "--action", "once",
            ])
            sent: list[dict[str, object]] = []

            def settle(_url: str, _token: str, payload: dict[str, object]):
                sent.append(payload)
                return (200, acknowledgement(1, reason="replay"), {})

            with patch.object(simulator, "send", side_effect=settle):
                self.assertEqual(simulator.run(args), 0)
            saved = simulator.load_state(state_path, 0)
            self.assertEqual(sent, [exact])
            self.assertEqual(len(saved["outbox"]), 1)
            self.assertEqual(
                saved["outbox"][0]["minuteStart"],
                simulator.minute_iso(start + timedelta(minutes=100)),
            )
            self.assertIsNone(saved["inFlightRequest"])

    def test_commands_pending_replaces_in_flight_live_with_corrected_same_sequence(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            state_path = Path(folder) / "state.json"
            state = simulator.load_state(state_path, 2)
            live = simulator.build_next_push(
                state,
                1,
                now=datetime(2026, 7, 13, 18, 24, 20, tzinfo=timezone.utc),
            )
            state["inFlightRequest"] = live
            simulator.buffer_completed_minute(
                state,
                {
                    "minuteStart": "2026-07-13T18:23:00.000Z",
                    "count": 2,
                    "entries": 0,
                    "exits": 0,
                },
            )
            simulator.save_state(state_path, state)
            args = simulator.parser().parse_args([
                "--base-url", "http://127.0.0.1:1",
                "--token", "fixture-token",
                "--state-file", str(state_path),
                "--starting-count", "2",
                "--action", "once",
            ])
            command = {
                "id": 8,
                "type": "set_count",
                "targetValue": 4,
                "issuedAt": "2026-07-13T18:24:19.000Z",
            }
            sent: list[dict[str, object]] = []

            def respond(_url: str, _token: str, payload: dict[str, object]):
                sent.append(payload)
                if len(sent) == 1:
                    return (200, acknowledgement(1, reason="commands_pending", commands=[command]), {})
                return (200, acknowledgement(1), {})

            with patch.object(simulator, "send", side_effect=respond):
                self.assertEqual(simulator.run(args), 0)
            self.assertEqual([payload["sequence"] for payload in sent], [1, 1])
            self.assertEqual([payload["mode"] for payload in sent], ["live", "live"])
            self.assertEqual(sent[1]["currentCount"], 4)
            self.assertEqual(sent[1]["appliedCommandId"], 8)
            saved = simulator.load_state(state_path, 0)
            self.assertEqual(saved["sequence"], 1)
            self.assertEqual(len(saved["outbox"]), 1)
            self.assertIsNone(saved["inFlightRequest"])

    def test_commands_pending_must_match_the_in_flight_sequence(self) -> None:
        state = simulator.load_state(Path("does-not-exist"), 2)
        payload = simulator.build_next_push(
            state,
            2,
            now=datetime(2026, 7, 13, 18, 24, 20, tzinfo=timezone.utc),
        )
        command = {
            "id": 8,
            "type": "set_count",
            "targetValue": 4,
            "issuedAt": "2026-07-13T18:24:19.000Z",
        }
        mismatched = acknowledgement(2, reason="commands_pending", commands=[command])
        mismatched["highestProcessedSequence"] = 0
        with self.assertRaisesRegex(ValueError, "in-flight sequence"):
            simulator.accept_acknowledgement(state, payload, mismatched)

    def test_outbox_retains_2880_minutes_and_drains_repeated_100_minute_batches(self) -> None:
        state = simulator.load_state(Path("does-not-exist"), 5)
        start = datetime(2026, 7, 10, 12, 0, tzinfo=timezone.utc)
        for offset in range(simulator.MAX_BUFFERED_MINUTES + 1):
            simulator.buffer_completed_minute(
                state,
                {
                    "minuteStart": simulator.minute_iso(start + timedelta(minutes=offset)),
                    "count": offset,
                    "entries": 1,
                    "exits": 0,
                },
            )
        self.assertEqual(len(state["outbox"]), simulator.MAX_BUFFERED_MINUTES)
        self.assertEqual(
            state["outbox"][0]["minuteStart"],
            simulator.minute_iso(start + timedelta(minutes=1)),
        )

        state["outbox"] = state["outbox"][:205]
        batch_sizes: list[int] = []
        for sequence in range(1, 4):
            payload = simulator.build_next_push(state, sequence)
            batch_sizes.append(len(payload["minutes"]))
            simulator.accept_acknowledgement(state, payload, acknowledgement(sequence))
        self.assertEqual(batch_sizes, [100, 100, 5])
        live = simulator.build_next_push(
            state,
            4,
            now=datetime(2026, 7, 13, 18, 25, 40, tzinfo=timezone.utc),
        )
        self.assertEqual(live["mode"], "live")
        self.assertEqual(live["sequence"], 4)

    def test_applies_ordered_commands_and_reports_the_highest_on_the_next_push(self) -> None:
        state = simulator.load_state(Path("does-not-exist"), 4)
        simulator.apply_commands(state, [
            {
                "id": 2,
                "type": "set_count",
                "targetValue": 11,
                "issuedAt": "2026-07-13T18:24:19.000Z",
            },
            {
                "id": 3,
                "type": "reset_zero",
                "targetValue": None,
                "issuedAt": "2026-07-13T18:24:20.000Z",
            },
        ])
        self.assertEqual(state["count"], 0)
        self.assertEqual(state["appliedCommandId"], 3)
        payload = simulator.build_push(state, random.Random(42), "normal")
        self.assertEqual(payload["appliedCommandId"], 3)


if __name__ == "__main__":
    unittest.main()
