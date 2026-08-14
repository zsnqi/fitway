"""Transactional SQLite persistence for the durable FITWAY edge client.

The store holds anonymous aggregates and the exact canonical request bytes, nothing else:
sequence, current count, the open minute accumulator, the highest applied command id, the
last settled request, the in-flight request, and a bounded 2,880-minute aggregate outbox.
No crossing event, no per-person record, no visual capture of any kind, no health history,
no token, and no credential is ever written here.

Every public mutation runs inside one `BEGIN IMMEDIATE` transaction and one commit, so an
abrupt termination recovers to either the exact pre-state or the complete post-state. The
canonical state machine itself lives in `fitway_edge.protocol`; this module only maps that
one authority onto durable rows.
"""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterator

from . import protocol

APPLICATION_ID = 0x46495457
SCHEMA_VERSION = 1
SUPPORTED_SCHEMA_VERSIONS = (1,)
MAX_BUFFERED_MINUTES = protocol.MAX_BUFFERED_MINUTES

_SCHEMA = (
    """
    CREATE TABLE IF NOT EXISTS edge_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        sequence INTEGER NOT NULL CHECK (sequence >= 0),
        count INTEGER NOT NULL CHECK (count >= 0),
        current_minute TEXT NOT NULL,
        current_entries INTEGER NOT NULL CHECK (current_entries >= 0),
        current_exits INTEGER NOT NULL CHECK (current_exits >= 0),
        applied_command_id INTEGER NOT NULL CHECK (applied_command_id >= 0),
        last_request BLOB,
        in_flight_request BLOB
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS edge_outbox (
        minute_start TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        entries INTEGER NOT NULL CHECK (entries >= 0),
        exits INTEGER NOT NULL CHECK (exits >= 0)
    )
    """,
)


class StoreError(RuntimeError):
    """A fail-closed persistence rejection carrying a fixed diagnostic category."""

    def __init__(self, category: str, detail: str = "") -> None:
        self.category = category
        super().__init__(f"{category}: {detail}" if detail else category)


@dataclass(frozen=True)
class StateSnapshot:
    sequence: int
    count: int
    minute: str
    entries: int
    exits: int
    applied_command_id: int
    last_request: bytes | None
    in_flight_request: bytes | None
    buffered_minutes: int


@dataclass(frozen=True)
class PreparedRequest:
    """The exact durable bytes to transmit, plus parsed metadata for validation only.

    `payload` exists so callers can correlate and log categories. It must never be
    serialized again; `body` is the single authority for what goes on the wire.
    """

    body: bytes
    payload: dict[str, Any]
    replayed: bool


@contextmanager
def _translated() -> Iterator[None]:
    try:
        yield
    except sqlite3.OperationalError as failure:
        text = str(failure).lower()
        if "locked" in text or "busy" in text:
            raise StoreError("database_busy") from None
        raise StoreError("database_unavailable") from None
    except sqlite3.DatabaseError:
        raise StoreError("database_corrupt") from None


class SqliteStateStore:
    """The only writer of durable edge state."""

    def __init__(self, path: str | Path, initial_count: int = 0) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._connection = sqlite3.connect(str(self.path), isolation_level=None, timeout=5.0)
        self._connection.row_factory = sqlite3.Row
        try:
            with _translated():
                self._connection.execute("PRAGMA journal_mode=WAL")
                self._connection.execute("PRAGMA synchronous=FULL")
                self._connection.execute("PRAGMA foreign_keys=ON")
                self._connection.execute("PRAGMA busy_timeout=5000")
                self._initialize(max(0, int(initial_count)))
        except BaseException:
            # A store that cannot open must not leave a handle behind; it fails closed.
            self.close()
            raise

    # -- lifecycle -----------------------------------------------------------------

    def _initialize(self, initial_count: int) -> None:
        application_id = self._connection.execute("PRAGMA application_id").fetchone()[0]
        user_version = self._connection.execute("PRAGMA user_version").fetchone()[0]
        if application_id not in (0, APPLICATION_ID):
            raise StoreError("foreign_database")
        if user_version not in (0, *SUPPORTED_SCHEMA_VERSIONS):
            raise StoreError("unsupported_schema_version")
        self._execute("BEGIN IMMEDIATE")
        try:
            for statement in _SCHEMA:
                self._connection.execute(statement)
            self._connection.execute(
                """
                INSERT OR IGNORE INTO edge_state (
                    id, sequence, count, current_minute, current_entries, current_exits,
                    applied_command_id, last_request, in_flight_request
                ) VALUES (1, 0, ?, '', 0, 0, 0, NULL, NULL)
                """,
                (initial_count,),
            )
            self._commit()
        except BaseException:
            self._rollback()
            raise
        self._connection.execute(f"PRAGMA application_id={APPLICATION_ID}")
        self._connection.execute(f"PRAGMA user_version={SCHEMA_VERSION}")

    def close(self) -> None:
        try:
            self._connection.close()
        except sqlite3.Error:
            pass

    def pragma(self, name: str) -> Any:
        with _translated():
            return self._connection.execute(f"PRAGMA {name}").fetchone()[0]

    # -- transaction plumbing ------------------------------------------------------

    def _execute(self, statement: str, parameters: tuple[Any, ...] = ()) -> sqlite3.Cursor:
        return self._connection.execute(statement, parameters)

    def _commit(self) -> None:
        self._connection.execute("COMMIT")

    def _rollback(self) -> None:
        try:
            self._connection.execute("ROLLBACK")
        except sqlite3.Error:
            pass

    @contextmanager
    def _transaction(self) -> Iterator[None]:
        with _translated():
            self._execute("BEGIN IMMEDIATE")
        try:
            yield
        except BaseException:
            self._rollback()
            raise
        try:
            with _translated():
                self._commit()
        except BaseException:
            self._rollback()
            raise

    # -- reads ---------------------------------------------------------------------

    def _row(self) -> sqlite3.Row:
        row = self._connection.execute("SELECT * FROM edge_state WHERE id = 1").fetchone()
        if row is None:
            raise StoreError("state_row_missing")
        return row

    def _outbox_rows(self) -> list[dict[str, Any]]:
        cursor = self._connection.execute(
            "SELECT minute_start, count, entries, exits FROM edge_outbox ORDER BY minute_start ASC"
        )
        return [
            {
                "minuteStart": item["minute_start"],
                "count": item["count"],
                "entries": item["entries"],
                "exits": item["exits"],
            }
            for item in cursor.fetchall()
        ]

    def _state(self, row: sqlite3.Row) -> dict[str, Any]:
        return {
            "sequence": row["sequence"],
            "count": row["count"],
            "minute": row["current_minute"],
            "entries": row["current_entries"],
            "exits": row["current_exits"],
            "appliedCommandId": row["applied_command_id"],
            "outbox": self._outbox_rows(),
            "lastRequest": None,
            "inFlightRequest": None,
        }

    def snapshot(self) -> StateSnapshot:
        with _translated():
            row = self._row()
            buffered = self._connection.execute("SELECT COUNT(*) FROM edge_outbox").fetchone()[0]
        return StateSnapshot(
            sequence=row["sequence"],
            count=row["count"],
            minute=row["current_minute"],
            entries=row["current_entries"],
            exits=row["current_exits"],
            applied_command_id=row["applied_command_id"],
            last_request=row["last_request"],
            in_flight_request=row["in_flight_request"],
            buffered_minutes=buffered,
        )

    def outbox(self) -> list[dict[str, Any]]:
        with _translated():
            return self._outbox_rows()

    # -- mutations -----------------------------------------------------------------

    def record_sample(self, minute: str, entries: int, exits: int) -> None:
        """Accumulate one aggregate sample, rolling the previous minute into the outbox."""
        if entries < 0 or exits < 0:
            raise StoreError("invalid_sample")
        with self._transaction():
            with _translated():
                row = self._row()
                open_entries = row["current_entries"]
                open_exits = row["current_exits"]
                if row["current_minute"] and row["current_minute"] != minute:
                    self._execute(
                        """
                        INSERT INTO edge_outbox (minute_start, count, entries, exits)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(minute_start) DO UPDATE SET
                            count = excluded.count,
                            entries = excluded.entries,
                            exits = excluded.exits
                        """,
                        (row["current_minute"], row["count"], open_entries, open_exits),
                    )
                    self._trim_outbox()
                    open_entries = 0
                    open_exits = 0
                self._execute(
                    """
                    UPDATE edge_state SET
                        current_minute = ?,
                        current_entries = ?,
                        current_exits = ?,
                        count = ?
                    WHERE id = 1
                    """,
                    (
                        minute,
                        open_entries + entries,
                        open_exits + exits,
                        max(0, row["count"] + entries - exits),
                    ),
                )

    def _trim_outbox(self) -> None:
        self._execute(
            """
            DELETE FROM edge_outbox WHERE minute_start NOT IN (
                SELECT minute_start FROM edge_outbox ORDER BY minute_start DESC LIMIT ?
            )
            """,
            (MAX_BUFFERED_MINUTES,),
        )

    def prepare_request(
        self,
        health: dict[str, Any] | None = None,
        now: datetime | None = None,
        sequence: int | None = None,
    ) -> PreparedRequest:
        """Return the durable request to transmit, persisting its exact bytes before send."""
        with self._transaction():
            with _translated():
                row = self._row()
                durable = row["in_flight_request"]
                if durable is not None:
                    payload = self._parse(durable)
                    return PreparedRequest(body=bytes(durable), payload=payload, replayed=True)
                state = self._state(row)
                payload = protocol.build_next_push(
                    state,
                    sequence if sequence is not None else row["sequence"] + 1,
                    health,
                    now,
                )
                if not protocol.valid_push(payload):
                    raise StoreError("request_invalid")
                body = protocol.serialize_push(payload)
                self._execute(
                    "UPDATE edge_state SET current_minute = ?, in_flight_request = ? WHERE id = 1",
                    (state["minute"], body),
                )
                return PreparedRequest(body=body, payload=payload, replayed=False)

    def settle(
        self,
        acknowledgement: dict[str, Any],
        health: dict[str, Any] | None = None,
        now: datetime | None = None,
    ) -> str:
        """Apply one acknowledgement against the durable in-flight request, or reject it."""
        with self._transaction():
            with _translated():
                row = self._row()
                durable = row["in_flight_request"]
                if durable is None:
                    raise StoreError("no_durable_request")
                payload = self._parse(durable)
                state = self._state(row)
                state["inFlightRequest"] = payload
                buffered_before = {item["minuteStart"] for item in state["outbox"]}
                try:
                    protocol.accept_acknowledgement(state, payload, acknowledgement)
                except ValueError as failure:
                    raise StoreError("acknowledgement_rejected", str(failure)) from None
                reason = acknowledgement["reason"]
                if reason == "commands_pending":
                    corrected = protocol.build_live_push(
                        state, payload["sequence"], health or payload.get("health"), now
                    )
                    if not protocol.valid_push(corrected):
                        raise StoreError("request_invalid")
                    self._execute(
                        """
                        UPDATE edge_state SET
                            count = ?, applied_command_id = ?, current_minute = ?,
                            in_flight_request = ?
                        WHERE id = 1
                        """,
                        (
                            state["count"],
                            state["appliedCommandId"],
                            state["minute"],
                            protocol.serialize_push(corrected),
                        ),
                    )
                    return reason
                surviving = {item["minuteStart"] for item in state["outbox"]}
                for minute_start in sorted(buffered_before - surviving):
                    self._execute(
                        "DELETE FROM edge_outbox WHERE minute_start = ?", (minute_start,)
                    )
                self._execute(
                    """
                    UPDATE edge_state SET
                        sequence = ?, count = ?, applied_command_id = ?, current_minute = ?,
                        last_request = ?, in_flight_request = NULL
                    WHERE id = 1
                    """,
                    (
                        state["sequence"],
                        state["count"],
                        state["appliedCommandId"],
                        state["minute"],
                        bytes(durable),
                    ),
                )
                return reason

    def recover_to_last_request(self, expected_sequence: int) -> PreparedRequest | None:
        """Re-arm the last settled request when the server reports that exact gap."""
        with self._transaction():
            with _translated():
                row = self._row()
                last = row["last_request"]
                if last is None:
                    return None
                payload = self._parse(last)
                if payload.get("sequence") != expected_sequence:
                    return None
                self._execute(
                    "UPDATE edge_state SET in_flight_request = ? WHERE id = 1", (bytes(last),)
                )
                return PreparedRequest(body=bytes(last), payload=payload, replayed=True)

    # -- helpers -------------------------------------------------------------------

    @staticmethod
    def _parse(durable: bytes) -> dict[str, Any]:
        try:
            payload = json.loads(bytes(durable).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise StoreError("durable_request_unreadable") from None
        if not protocol.valid_push(payload):
            raise StoreError("durable_request_invalid")
        return payload
