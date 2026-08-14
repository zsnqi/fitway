"""Durable SQLite state contract for the FITWAY edge client.

Every test uses a disposable per-test temporary directory. No real device, database,
network endpoint, or secret is involved.
"""

import json
import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from fitway_edge import protocol
from fitway_edge.sqlite_store import (
    MAX_BUFFERED_MINUTES,
    SCHEMA_VERSION,
    PreparedRequest,
    SqliteStateStore,
    StoreError,
)

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

HEALTH = {"process": "ok", "camera": "unknown", "feed": "unknown", "detectorFps": None}


def acknowledgement(sequence, *, reason="processed", commands=None):
    return {
        "schemaVersion": 2,
        "accepted": reason == "processed",
        "reason": reason,
        "highestProcessedSequence": sequence if reason != "commands_pending" else sequence - 1,
        "commands": commands or [],
        "settings": FROZEN_SETTINGS,
        "serverTime": "2026-07-13T18:25:20.250Z",
    }


def minute(offset):
    return protocol.minute_iso(
        datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc) + timedelta(minutes=offset)
    )


class StoreTestCase(unittest.TestCase):
    def setUp(self):
        self._folder = tempfile.TemporaryDirectory()
        self.addCleanup(self._folder.cleanup)
        self.path = Path(self._folder.name) / "state" / "edge.sqlite3"

    def store(self, initial_count=0):
        value = SqliteStateStore(self.path, initial_count)
        self.addCleanup(value.close)
        return value

    def preserved(self, store):
        snapshot = store.snapshot()
        return json.dumps(
            {
                "sequence": snapshot.sequence,
                "count": snapshot.count,
                "minute": snapshot.minute,
                "entries": snapshot.entries,
                "exits": snapshot.exits,
                "appliedCommandId": snapshot.applied_command_id,
                "last": None if snapshot.last_request is None else snapshot.last_request.decode(),
                "inFlight": None
                if snapshot.in_flight_request is None
                else snapshot.in_flight_request.decode(),
                "outbox": store.outbox(),
            },
            sort_keys=True,
        )


class FirstBootTests(StoreTestCase):
    def test_first_boot_creates_the_durable_aggregate_schema(self):
        store = self.store(initial_count=7)
        self.assertEqual(store.pragma("journal_mode").lower(), "wal")
        self.assertEqual(store.pragma("synchronous"), 2)
        self.assertEqual(store.pragma("foreign_keys"), 1)
        self.assertEqual(store.pragma("user_version"), SCHEMA_VERSION)
        snapshot = store.snapshot()
        self.assertEqual(snapshot.count, 7)
        self.assertEqual(snapshot.sequence, 0)
        self.assertIsNone(snapshot.in_flight_request)
        self.assertIsNone(snapshot.last_request)

    def test_schema_stores_aggregates_only(self):
        store = self.store()
        connection = sqlite3.connect(str(self.path))
        self.addCleanup(connection.close)
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
            )
        }
        self.assertEqual(tables, {"edge_state", "edge_outbox"})
        columns = set()
        for table in tables:
            columns.update(
                row[1].lower() for row in connection.execute(f"PRAGMA table_info({table})")
            )
        for forbidden in (
            "frame",
            "image",
            "video",
            "path",
            "token",
            "identity",
            "person",
            "event",
            "credential",
        ):
            self.assertFalse(
                any(forbidden in name for name in columns), f"{forbidden} in {sorted(columns)}"
            )
        del store

    def test_an_unsupported_newer_schema_fails_closed(self):
        self.store().close()
        connection = sqlite3.connect(str(self.path))
        connection.execute("PRAGMA user_version=99")
        connection.close()
        with self.assertRaises(StoreError) as failure:
            SqliteStateStore(self.path)
        self.assertEqual(failure.exception.category, "unsupported_schema_version")

    def test_a_corrupt_database_fails_closed_without_recreating_state(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_bytes(b"this is not a sqlite database" * 8)
        with self.assertRaises(StoreError) as failure:
            SqliteStateStore(self.path)
        self.assertIn(failure.exception.category, {"database_corrupt", "database_unavailable"})


class SamplingTests(StoreTestCase):
    def test_minute_rollover_buffers_the_previous_minute_and_resets_the_accumulator(self):
        store = self.store(initial_count=2)
        store.record_sample(minute(0), 3, 1)
        store.record_sample(minute(1), 1, 0)
        self.assertEqual(store.outbox(), [
            {"minuteStart": minute(0), "count": 4, "entries": 3, "exits": 1}
        ])
        snapshot = store.snapshot()
        self.assertEqual(snapshot.minute, minute(1))
        self.assertEqual((snapshot.entries, snapshot.exits, snapshot.count), (1, 0, 5))

    def test_repeated_samples_in_one_minute_accumulate_without_buffering(self):
        store = self.store()
        store.record_sample(minute(0), 1, 0)
        store.record_sample(minute(0), 2, 1)
        self.assertEqual(store.outbox(), [])
        snapshot = store.snapshot()
        self.assertEqual((snapshot.entries, snapshot.exits, snapshot.count), (3, 1, 2))

    def test_a_repeated_minute_key_is_idempotent_in_the_outbox(self):
        store = self.store()
        store.record_sample(minute(0), 1, 0)
        store.record_sample(minute(1), 0, 0)
        store.record_sample(minute(0), 5, 0)
        store.record_sample(minute(1), 0, 0)
        self.assertEqual([item["minuteStart"] for item in store.outbox()], [minute(0), minute(1)])

    def test_the_count_floors_at_zero(self):
        store = self.store(initial_count=1)
        store.record_sample(minute(0), 0, 9)
        self.assertEqual(store.snapshot().count, 0)

    def test_the_outbox_is_capped_at_exactly_2880_minutes(self):
        store = self.store()
        for offset in range(MAX_BUFFERED_MINUTES + 5):
            store.record_sample(minute(offset), 1, 0)
        buffered = store.outbox()
        self.assertEqual(len(buffered), MAX_BUFFERED_MINUTES)
        self.assertEqual(buffered[0]["minuteStart"], minute(4))
        self.assertEqual(buffered[-1]["minuteStart"], minute(MAX_BUFFERED_MINUTES + 3))


class DurableRequestTests(StoreTestCase):
    def test_preparing_persists_the_exact_bytes_before_send(self):
        store = self.store(initial_count=3)
        store.record_sample(minute(0), 1, 0)
        prepared = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        self.assertFalse(prepared.replayed)
        self.assertEqual(store.snapshot().in_flight_request, prepared.body)
        self.assertEqual(prepared.body, protocol.serialize_push(prepared.payload))
        self.assertIsNone(store.snapshot().last_request)

    def test_reopening_replays_the_identical_bytes(self):
        store = self.store(initial_count=3)
        store.record_sample(minute(0), 1, 0)
        first = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        store.close()
        reopened = self.store()
        replayed = reopened.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 9, tzinfo=timezone.utc))
        self.assertTrue(replayed.replayed)
        self.assertEqual(replayed.body, first.body)

    def test_backfill_drains_in_100_100_5_batches_before_live(self):
        store = self.store()
        for offset in range(206):
            store.record_sample(minute(offset), 1, 0)
        sizes = []
        for _ in range(3):
            prepared = store.prepare_request(HEALTH, datetime(2026, 7, 14, 12, tzinfo=timezone.utc))
            self.assertEqual(prepared.payload["mode"], "backfill")
            sizes.append(len(prepared.payload["minutes"]))
            store.settle(acknowledgement(prepared.payload["sequence"]), HEALTH)
        self.assertEqual(sizes, [100, 100, 5])
        live = store.prepare_request(HEALTH, datetime(2026, 7, 14, 12, tzinfo=timezone.utc))
        self.assertEqual(live.payload["mode"], "live")
        self.assertEqual(live.payload["sequence"], 4)

    def test_sampling_during_an_outage_never_changes_the_in_flight_bytes(self):
        store = self.store(initial_count=1)
        store.record_sample(minute(0), 1, 0)
        prepared = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        for offset in range(1, 4):
            store.record_sample(minute(offset), 2, 0)
        snapshot = store.snapshot()
        self.assertEqual(snapshot.in_flight_request, prepared.body)
        self.assertEqual(snapshot.count, 8)
        self.assertEqual(len(store.outbox()), 3)
        replay = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 5, tzinfo=timezone.utc))
        self.assertEqual(replay.body, prepared.body)

    def test_settlement_deletes_only_the_requests_own_minutes(self):
        store = self.store()
        for offset in range(3):
            store.record_sample(minute(offset), 1, 0)
        prepared = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 3, tzinfo=timezone.utc))
        self.assertEqual(prepared.payload["mode"], "backfill")
        acknowledged = {item["minuteStart"] for item in prepared.payload["minutes"]}
        for offset in range(3, 6):
            store.record_sample(minute(offset), 1, 0)
        store.settle(acknowledgement(prepared.payload["sequence"]), HEALTH)
        surviving = {item["minuteStart"] for item in store.outbox()}
        self.assertFalse(acknowledged & surviving)
        self.assertEqual(surviving, {minute(2), minute(3), minute(4)})

    def test_last_request_changes_only_on_a_correlated_settlement(self):
        store = self.store(initial_count=2)
        store.record_sample(minute(0), 1, 0)
        prepared = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        self.assertIsNone(store.snapshot().last_request)
        store.record_sample(minute(1), 1, 0)
        self.assertIsNone(store.snapshot().last_request)
        store.settle(acknowledgement(prepared.payload["sequence"]), HEALTH)
        snapshot = store.snapshot()
        self.assertEqual(snapshot.last_request, prepared.body)
        self.assertIsNone(snapshot.in_flight_request)
        self.assertEqual(snapshot.sequence, 1)


class MutationSafetyTests(StoreTestCase):
    def _armed(self):
        store = self.store(initial_count=5)
        store.record_sample(minute(0), 1, 0)
        prepared = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        return store, prepared

    def test_an_invalid_acknowledgement_leaves_every_field_byte_identical(self):
        store, _ = self._armed()
        before = self.preserved(store)
        with self.assertRaises(StoreError):
            store.settle({"schemaVersion": 2, "reason": "processed"}, HEALTH)
        self.assertEqual(self.preserved(store), before)

    def test_a_cross_version_acknowledgement_cannot_settle(self):
        store, _ = self._armed()
        before = self.preserved(store)
        legacy = {
            **acknowledgement(1),
            "schemaVersion": 1,
            "settings": {"version": 1, "pushIntervalSeconds": 20},
        }
        with self.assertRaises(StoreError) as failure:
            store.settle(legacy, HEALTH)
        self.assertEqual(failure.exception.category, "acknowledgement_rejected")
        self.assertEqual(self.preserved(store), before)

    def test_a_mismatched_sequence_cannot_settle(self):
        store, _ = self._armed()
        before = self.preserved(store)
        with self.assertRaises(StoreError):
            store.settle(acknowledgement(9), HEALTH)
        self.assertEqual(self.preserved(store), before)

    def test_settling_without_a_durable_request_is_refused(self):
        store = self.store()
        with self.assertRaises(StoreError) as failure:
            store.settle(acknowledgement(1), HEALTH)
        self.assertEqual(failure.exception.category, "no_durable_request")

    def test_a_failure_before_commit_leaves_the_exact_pre_state(self):
        store, _ = self._armed()
        before = self.preserved(store)
        with patch.object(store, "_commit", side_effect=sqlite3.OperationalError("injected")):
            with self.assertRaises(Exception):
                store.record_sample(minute(1), 4, 0)
        self.assertEqual(self.preserved(store), before)
        store.record_sample(minute(1), 4, 0)
        self.assertNotEqual(self.preserved(store), before)

    def test_a_settlement_failure_before_commit_leaves_one_coherent_endpoint(self):
        store, prepared = self._armed()
        before = self.preserved(store)
        with patch.object(store, "_commit", side_effect=sqlite3.OperationalError("injected")):
            with self.assertRaises(Exception):
                store.settle(acknowledgement(prepared.payload["sequence"]), HEALTH)
        self.assertEqual(self.preserved(store), before)
        store.settle(acknowledgement(prepared.payload["sequence"]), HEALTH)
        after = store.snapshot()
        self.assertEqual(after.sequence, 1)
        self.assertEqual(after.last_request, prepared.body)
        self.assertIsNone(after.in_flight_request)


class CommandTests(StoreTestCase):
    def test_commands_pending_corrects_the_count_and_replaces_the_same_sequence(self):
        store = self.store(initial_count=2)
        store.record_sample(minute(0), 0, 0)
        prepared = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        self.assertEqual(prepared.payload["mode"], "live")
        outcome = store.settle(
            acknowledgement(
                1,
                reason="commands_pending",
                commands=[{
                    "id": 8,
                    "type": "set_count",
                    "targetValue": 4,
                    "issuedAt": "2026-07-13T12:00:19.000Z",
                }],
            ),
            HEALTH,
            datetime(2026, 7, 13, 12, 0, 40, tzinfo=timezone.utc),
        )
        self.assertEqual(outcome, "commands_pending")
        snapshot = store.snapshot()
        self.assertEqual(snapshot.count, 4)
        self.assertEqual(snapshot.applied_command_id, 8)
        self.assertEqual(snapshot.sequence, 0)
        corrected = json.loads(snapshot.in_flight_request)
        self.assertEqual(corrected["sequence"], prepared.payload["sequence"])
        self.assertEqual(corrected["currentCount"], 4)
        self.assertEqual(corrected["appliedCommandId"], 8)

    def test_a_restart_between_a_command_and_the_resend_keeps_the_corrected_bytes(self):
        store = self.store(initial_count=2)
        store.record_sample(minute(0), 0, 0)
        store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        store.settle(
            acknowledgement(
                1,
                reason="commands_pending",
                commands=[{
                    "id": 8,
                    "type": "reset_zero",
                    "targetValue": None,
                    "issuedAt": "2026-07-13T12:00:19.000Z",
                }],
            ),
            HEALTH,
            datetime(2026, 7, 13, 12, 0, 40, tzinfo=timezone.utc),
        )
        corrected = store.snapshot().in_flight_request
        store.close()
        reopened = self.store()
        resend = reopened.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 9, tzinfo=timezone.utc))
        self.assertTrue(resend.replayed)
        self.assertEqual(resend.body, corrected)
        reopened.settle(acknowledgement(1), HEALTH)
        self.assertEqual(reopened.snapshot().count, 0)
        self.assertEqual(reopened.snapshot().applied_command_id, 8)

    def test_ordered_commands_apply_ascending_and_persist(self):
        store = self.store(initial_count=4)
        store.record_sample(minute(0), 0, 0)
        prepared = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        store.settle(
            acknowledgement(
                prepared.payload["sequence"],
                commands=[{
                    "id": 2,
                    "type": "set_count",
                    "targetValue": 11,
                    "issuedAt": "2026-07-13T12:00:19.000Z",
                }],
            ),
            HEALTH,
        )
        self.assertEqual(store.snapshot().count, 11)
        self.assertEqual(store.snapshot().applied_command_id, 2)
        follow_up = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 1, tzinfo=timezone.utc))
        self.assertEqual(follow_up.payload["appliedCommandId"], 2)
        store.settle(
            acknowledgement(
                follow_up.payload["sequence"],
                commands=[{
                    "id": 1,
                    "type": "reset_zero",
                    "targetValue": None,
                    "issuedAt": "2026-07-13T12:00:01.000Z",
                }],
            ),
            HEALTH,
        )
        self.assertEqual(store.snapshot().count, 11, "a superseded command must not re-apply")
        self.assertEqual(store.snapshot().applied_command_id, 2)


class SequenceRecoveryTests(StoreTestCase):
    def test_a_sequence_gap_rearms_the_last_settled_request(self):
        store = self.store(initial_count=1)
        store.record_sample(minute(0), 1, 0)
        first = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        store.settle(acknowledgement(1), HEALTH)
        store.record_sample(minute(1), 1, 0)
        store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 1, 30, tzinfo=timezone.utc))
        recovered = store.recover_to_last_request(1)
        self.assertIsInstance(recovered, PreparedRequest)
        self.assertEqual(recovered.body, first.body)
        self.assertEqual(store.snapshot().in_flight_request, first.body)

    def test_an_unmatched_gap_is_not_recoverable(self):
        store = self.store()
        store.record_sample(minute(0), 1, 0)
        store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        self.assertIsNone(store.recover_to_last_request(7))

    def test_a_replay_settles_the_identical_request(self):
        store = self.store(initial_count=1)
        store.record_sample(minute(0), 1, 0)
        prepared = store.prepare_request(HEALTH, datetime(2026, 7, 13, 12, 0, 30, tzinfo=timezone.utc))
        self.assertEqual(store.settle(acknowledgement(1, reason="replay"), HEALTH), "replay")
        self.assertEqual(store.snapshot().last_request, prepared.body)
        self.assertIsNone(store.snapshot().in_flight_request)


if __name__ == "__main__":
    unittest.main()
