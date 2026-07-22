import json
import random
import tempfile
import unittest
from pathlib import Path

import simulator


class SimulatorTests(unittest.TestCase):
    def test_shared_push_fixture_carries_the_phase5_acknowledgement_shape(self) -> None:
        fixture = json.loads(
            (Path(__file__).parent / "fixtures" / "push.json").read_text(encoding="utf-8")
        )
        self.assertEqual(fixture["schemaVersion"], 1)
        self.assertEqual(fixture["appliedCommandId"], 7)
        self.assertNotIn("backfillOnly", fixture)

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
        self.assertEqual(payload["schemaVersion"], 1)
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
