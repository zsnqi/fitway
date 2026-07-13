import json
import random
import tempfile
import unittest
from pathlib import Path

import simulator


class SimulatorTests(unittest.TestCase):
    def test_state_round_trip_and_floor(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "state.json"
            state = simulator.load_state(path, -4)
            self.assertEqual(state["count"], 0)
            state["sequence"] = 7
            simulator.save_state(path, state)
            self.assertEqual(simulator.load_state(path, 0)["sequence"], 7)
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
            "commands": [],
            "settings": {"version": 1, "pushIntervalSeconds": 20},
            "serverTime": "2026-07-13T18:24:20.250Z",
        }
        self.assertTrue(simulator.valid_acknowledgement(acknowledgement))
        self.assertFalse(
            simulator.valid_acknowledgement({**acknowledgement, "reason": "replay"})
        )


if __name__ == "__main__":
    unittest.main()
