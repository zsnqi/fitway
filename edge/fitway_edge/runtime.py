"""The durable FITWAY edge runtime: one store, one counting source, one transport.

The runtime samples aggregate directional deltas, finalizes minutes, persists the exact
canonical request bytes before sending them, replays those exact bytes after any
interruption, and lets only a correlated acknowledgement settle them.

Privacy rules enforced here, not merely intended:

- the transport sends the durable bytes as-is and never re-serializes a parsed request;
- diagnostics carry fixed event names, an allow-listed set of field names, and aggregate
  health categories only. No token, no URL, no host, no request payload, no count, no SQL,
  and no file content is ever emitted;
- the endpoint appears in diagnostics only as its scheme and a loopback/external category.

This build reports `camera` and `feed` health as `unknown` with no detector rate, because a
synthetic source observes nothing. Claiming `ok` would assert an on-site capability that
remains gated.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable
from urllib import error, request

from . import protocol
from .sqlite_store import SqliteStateStore, StoreError

EXIT_OK = 0
EXIT_CONFIG = 2
EXIT_AUTHENTICATION = 3
EXIT_PROTOCOL = 4
EXIT_STATE = 5
EXIT_SOURCE = 6

SYNTHETIC_HEALTH: dict[str, Any] = {
    "process": "ok",
    "camera": "unknown",
    "feed": "unknown",
    "detectorFps": None,
}

ALLOWED_LOG_FIELDS = frozenset({
    "attempt",
    "bufferedMinutes",
    "category",
    "delaySeconds",
    "endpoint",
    "host",
    "mode",
    "minutes",
    "outcome",
    "process",
    "replayed",
    "scheme",
    "sequence",
    "source",
    "status",
})

MAX_RETRY_AFTER_SECONDS = 300


class TransportUnavailable(RuntimeError):
    """The request could not be delivered; the durable in-flight bytes stay armed."""


class RuntimeStopped(RuntimeError):
    """A terminal process outcome carrying a fixed category and a process exit code."""

    def __init__(self, category: str, exit_code: int) -> None:
        self.category = category
        self.exit_code = exit_code
        super().__init__(category)


@dataclass(frozen=True)
class TransportResponse:
    status: int
    body: dict[str, Any] | None
    headers: dict[str, str] = field(default_factory=dict)


class UrllibTransport:
    """Standard-library transport. It transmits the durable bytes and nothing else."""

    def post(self, url: str, token: str, body: bytes, timeout: float) -> TransportResponse:
        call = request.Request(
            url,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        try:
            with request.urlopen(call, timeout=timeout) as response:
                return TransportResponse(
                    status=response.status,
                    body=self._decode(response.read()),
                    headers=dict(response.headers),
                )
        except error.HTTPError as failure:
            return TransportResponse(
                status=failure.code,
                body=self._decode(failure.read()),
                headers=dict(failure.headers),
            )
        except (error.URLError, TimeoutError, OSError) as failure:
            raise TransportUnavailable(type(failure).__name__) from None

    @staticmethod
    def _decode(raw: bytes) -> dict[str, Any] | None:
        try:
            value = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None
        return value if isinstance(value, dict) else None


class EdgeRuntime:
    """Owns one durable store, one counting source, and one transport."""

    def __init__(
        self,
        config,
        store: SqliteStateStore,
        source,
        transport,
        clock: Callable[[], datetime] = protocol.utc_now,
        sleep: Callable[[float], None] = time.sleep,
        emit: Callable[[str], None] | None = None,
    ) -> None:
        self._config = config
        self._store = store
        self._source = source
        self._transport = transport
        self._clock = clock
        self._sleep = sleep
        self._emit_line = emit or (lambda line: print(line, flush=True))
        self._token = config.credentials.read_token()
        self._cadence = config.process.push_interval_seconds
        self._backoff = config.process.minimum_backoff_seconds
        self._stopped = False
        self.emit("started", source=config.source.kind, **config.endpoint.describe())

    # -- diagnostics ---------------------------------------------------------------

    def emit(self, event: str, **fields: Any) -> None:
        """Emit one privacy-safe diagnostic line. Unknown field names are a programming error."""
        unknown = sorted(set(fields) - ALLOWED_LOG_FIELDS)
        if unknown:
            raise ValueError(f"disallowed diagnostic field: {unknown[0]}")
        parts = [self._clock().isoformat(timespec="milliseconds"), event]
        parts.extend(f"{name}={fields[name]}" for name in sorted(fields))
        line = " ".join(parts)
        if self._token and self._token in line:
            line = line.replace(self._token, "<redacted>")
        self._emit_line(line)

    # -- lifecycle -----------------------------------------------------------------

    def request_stop(self) -> None:
        self._stopped = True

    def close(self) -> None:
        try:
            self._source.close()
        finally:
            self._store.close()

    # -- sampling ------------------------------------------------------------------

    def sample(self, now: datetime | None = None) -> None:
        """One aggregate sample. Never touches the frozen in-flight request bytes."""
        observed = now or self._clock()
        snapshot = self._store.snapshot()
        entries, exits = self._source.sample(snapshot.count)
        self._store.record_sample(protocol.minute_iso(observed), entries, exits)

    def wait(self, seconds: float) -> None:
        """Sleep in sample-interval slices so counting continues through any wait."""
        remaining = float(seconds)
        interval = max(1, self._config.source.sample_interval_seconds)
        while remaining > 0 and not self._stopped:
            slice_seconds = min(interval, remaining)
            self._sleep(slice_seconds)
            remaining -= slice_seconds
            self.sample()

    def _backoff_wait(self) -> None:
        delay = min(self._backoff, self._config.process.maximum_backoff_seconds)
        self.emit("retry_scheduled", delaySeconds=delay)
        self.wait(delay)
        self._backoff = min(self._backoff * 2, self._config.process.maximum_backoff_seconds)

    # -- one attempt ---------------------------------------------------------------

    def step(self) -> str:
        now = self._clock()
        self.sample(now)
        prepared = self._store.prepare_request(SYNTHETIC_HEALTH, now)
        self.emit(
            "request_prepared",
            mode=prepared.payload["mode"],
            sequence=prepared.payload["sequence"],
            minutes=len(prepared.payload["minutes"]),
            replayed=prepared.replayed,
        )
        try:
            response = self._transport.post(
                self._config.endpoint.url,
                self._token,
                prepared.body,
                self._config.endpoint.request_timeout_seconds,
            )
        except TransportUnavailable:
            self.emit("transport_unavailable", sequence=prepared.payload["sequence"])
            self._backoff_wait()
            return "network_retry"
        return self._handle(prepared, response, now)

    def _handle(self, prepared, response: TransportResponse, now: datetime) -> str:
        status = response.status
        if status in (401, 403):
            self.emit("stopped", category="authentication", status=status)
            raise RuntimeStopped("authentication", EXIT_AUTHENTICATION)
        if status == 429:
            delay = self._retry_after(response.headers)
            self.emit("rate_limited", delaySeconds=delay)
            self.wait(delay)
            return "rate_limited"
        if status >= 500:
            self.emit("server_unavailable", status=status)
            self._backoff_wait()
            return "server_retry"
        if status >= 400:
            self.emit("stopped", category="request_rejected", status=status)
            raise RuntimeStopped("request_rejected", EXIT_PROTOCOL)
        acknowledgement = response.body
        if not isinstance(acknowledgement, dict) or not protocol.valid_acknowledgement(
            acknowledgement
        ):
            self.emit("stopped", category="acknowledgement_invalid")
            raise RuntimeStopped("acknowledgement_invalid", EXIT_PROTOCOL)
        reason = acknowledgement["reason"]
        highest = int(acknowledgement["highestProcessedSequence"])
        if reason == "sequence_gap":
            expected = highest + 1
            recovered = self._store.recover_to_last_request(expected)
            if recovered is None:
                self.emit("stopped", category="sequence_gap_unrecoverable", sequence=expected)
                raise RuntimeStopped("sequence_gap_unrecoverable", EXIT_STATE)
            self.emit("sequence_gap_recovered", sequence=expected)
            return "sequence_gap_recovered"
        if reason == "replay" and highest != prepared.payload["sequence"]:
            self.emit("stopped", category="replay_ahead", sequence=highest)
            raise RuntimeStopped("replay_ahead", EXIT_STATE)
        try:
            outcome = self._store.settle(acknowledgement, SYNTHETIC_HEALTH, now)
        except StoreError as failure:
            self.emit("stopped", category=failure.category)
            raise RuntimeStopped(failure.category, EXIT_PROTOCOL) from None
        self._cadence = int(acknowledgement["settings"]["pushIntervalSeconds"])
        self._backoff = self._config.process.minimum_backoff_seconds
        snapshot = self._store.snapshot()
        self.emit(
            "request_settled",
            outcome=outcome,
            sequence=prepared.payload["sequence"],
            mode=prepared.payload["mode"],
            bufferedMinutes=snapshot.buffered_minutes,
        )
        return "commands_pending" if outcome == "commands_pending" else "settled"

    @staticmethod
    def _retry_after(headers: dict[str, str]) -> int:
        try:
            delay = int(headers.get("Retry-After", "1"))
        except (TypeError, ValueError):
            delay = 1
        return max(1, min(delay, MAX_RETRY_AFTER_SECONDS))

    # -- bounded loop --------------------------------------------------------------

    def run(self, max_steps: int | None = None) -> int:
        steps = 0
        try:
            while not self._stopped and (max_steps is None or steps < max_steps):
                outcome = self.step()
                steps += 1
                if outcome == "settled" and not self._stopped:
                    self.wait(self._cadence)
        except RuntimeStopped as stop:
            return stop.exit_code
        except StoreError as failure:
            self.emit("stopped", category=failure.category)
            return EXIT_STATE
        self.emit("stopped", category="shutdown")
        return EXIT_OK
