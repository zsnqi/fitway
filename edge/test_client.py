"""Configuration, source, runtime, transport, and CLI contract for the edge client.

Every test uses a disposable temporary directory, a synthetic token that is not a real
credential, and either an injected transport or an OS-assigned loopback port. No real
endpoint, device, or secret is involved.
"""

import ast
import io
import json
import re
import tempfile
import threading
import unittest
from contextlib import redirect_stdout, redirect_stderr
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import client
from fitway_edge import config as config_module
from fitway_edge import protocol, runtime as runtime_module, sources, sqlite_store
from fitway_edge.config import ConfigError, load_config
from fitway_edge.runtime import (
    EXIT_AUTHENTICATION,
    EXIT_CONFIG,
    EXIT_OK,
    EXIT_PROTOCOL,
    EXIT_SOURCE,
    EXIT_STATE,
    EdgeRuntime,
    TransportResponse,
    TransportUnavailable,
)
from fitway_edge.sources import SiteGatedSourceError, create_source
from fitway_edge.sqlite_store import SqliteStateStore

TOKEN = "synthetic-edge-token-for-tests-0123456789abcdef"

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


def _executable_source(path):
    """The module source without its documentation header, so prose cannot mask real code."""
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source)
    first = tree.body[0] if tree.body else None
    skipped = (
        first.end_lineno
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant)
        else 0
    )
    return "\n".join(source.splitlines()[skipped:])


def base_document(_replace=None, **overrides):
    document = json.loads(
        (Path(__file__).parent / "fixtures" / "client.synthetic.json").read_text(encoding="utf-8")
    )
    for section, values in (_replace or {}).items():
        document[section] = values
    for section, values in overrides.items():
        if isinstance(values, dict):
            document[section] = {**document.get(section, {}), **values}
        else:
            document[section] = values
    return document


class FakeClock:
    def __init__(self, start):
        self.now = start

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now = self.now + timedelta(seconds=float(seconds))


class FakeTransport:
    def __init__(self, responses):
        self._responses = list(responses)
        self.sent = []

    def post(self, url, token, body, timeout):
        self.sent.append({"url": url, "token": token, "body": body, "timeout": timeout})
        value = self._responses.pop(0) if self._responses else TransportResponse(200, None)
        if isinstance(value, BaseException):
            raise value
        return value


class EdgeTestCase(unittest.TestCase):
    def setUp(self):
        self._folder = tempfile.TemporaryDirectory()
        self.addCleanup(self._folder.cleanup)
        self.root = Path(self._folder.name)
        (self.root / "device.token").write_text(TOKEN, encoding="utf-8")

    def write_config(self, _replace=None, **overrides):
        path = self.root / "client.json"
        path.write_text(json.dumps(base_document(_replace, **overrides)), encoding="utf-8")
        return path

    def loopback_config(self, port, **overrides):
        endpoint = {
            "baseUrl": f"http://127.0.0.1:{port}",
            "resourcePath": "/edge/push",
            "requireTls": False,
        }
        endpoint.update(overrides.pop("endpoint", {}))
        return self.write_config(endpoint=endpoint, **overrides)


class ConfigTests(EdgeTestCase):
    def test_the_resolved_url_is_the_frozen_external_seam(self):
        config = load_config(self.write_config())
        self.assertEqual(config.endpoint.url, "https://fitway.example.com/api/edge/push")
        self.assertEqual(config.endpoint.host_category, "external")

    def test_a_trailing_slash_base_url_joins_deterministically(self):
        config = load_config(self.write_config(endpoint={"baseUrl": "https://fitway.example.com/"}))
        self.assertEqual(config.endpoint.url, "https://fitway.example.com/api/edge/push")

    def test_relative_paths_resolve_against_the_configuration_file(self):
        config = load_config(self.write_config())
        self.assertEqual(config.credentials.token_file, (self.root / "device.token").resolve())
        self.assertEqual(
            config.state.sqlite_path, (self.root / "state" / "edge-state.sqlite3").resolve()
        )

    def test_the_internal_resource_path_is_loopback_only(self):
        loopback = load_config(
            self.write_config(
                endpoint={
                    "baseUrl": "http://127.0.0.1:3100",
                    "resourcePath": "/edge/push",
                    "requireTls": False,
                }
            )
        )
        self.assertEqual(loopback.endpoint.url, "http://127.0.0.1:3100/edge/push")
        self.assertEqual(loopback.endpoint.host_category, "loopback")
        with self.assertRaises(ConfigError) as failure:
            load_config(self.write_config(endpoint={"resourcePath": "/edge/push"}))
        self.assertEqual(failure.exception.category, "resource_path_not_permitted")

    def test_an_arbitrary_resource_path_is_refused(self):
        for candidate in ("/api/edge/push?token=x", "/api/edge/push#x", "/anything", "/api/edge/push/"):
            with self.subTest(candidate=candidate):
                with self.assertRaises(ConfigError) as failure:
                    load_config(self.write_config(endpoint={"resourcePath": candidate}))
                self.assertEqual(failure.exception.category, "resource_path_not_permitted")

    def test_a_base_url_may_not_carry_a_path_query_fragment_or_user_information(self):
        for candidate in (
            "https://fitway.example.com/base",
            "https://fitway.example.com/?a=b",
            "https://fitway.example.com/#a",
            "https://user:secret@fitway.example.com",
        ):
            with self.subTest(candidate=candidate):
                with self.assertRaises(ConfigError) as failure:
                    load_config(self.write_config(endpoint={"baseUrl": candidate}))
                self.assertEqual(failure.exception.category, "invalid_value")

    def test_plaintext_transport_is_refused_outside_loopback(self):
        with self.assertRaises(ConfigError) as failure:
            load_config(
                self.write_config(endpoint={"baseUrl": "http://fitway.example.com", "requireTls": False})
            )
        self.assertEqual(failure.exception.category, "insecure_transport")
        with self.assertRaises(ConfigError) as tls_failure:
            load_config(self.write_config(endpoint={"baseUrl": "http://127.0.0.1:3100"}))
        self.assertEqual(tls_failure.exception.category, "insecure_transport")

    def test_unknown_and_missing_keys_fail_closed(self):
        with self.assertRaises(ConfigError) as unknown:
            load_config(self.write_config(extra=1))
        self.assertEqual(unknown.exception.category, "unknown_key")
        with self.assertRaises(ConfigError) as nested:
            load_config(self.write_config(source={"unexpected": 1}))
        self.assertEqual(nested.exception.category, "unknown_key")
        document = base_document()
        del document["state"]["retentionHours"]
        path = self.root / "client.json"
        path.write_text(json.dumps(document), encoding="utf-8")
        with self.assertRaises(ConfigError) as missing:
            load_config(path)
        self.assertEqual(missing.exception.category, "missing_key")

    def test_the_schema_version_and_retention_are_fixed(self):
        with self.assertRaises(ConfigError) as version:
            load_config(self.write_config(schemaVersion=2))
        self.assertEqual(version.exception.category, "unsupported_schema_version")
        with self.assertRaises(ConfigError) as retention:
            load_config(self.write_config(state={"retentionHours": 24}))
        self.assertEqual(retention.exception.category, "invalid_value")

    def test_an_unreadable_or_short_token_fails_closed(self):
        (self.root / "device.token").write_text("short", encoding="utf-8")
        with self.assertRaises(ConfigError) as short:
            load_config(self.write_config())
        self.assertEqual(short.exception.category, "token_too_short")
        (self.root / "device.token").unlink()
        with self.assertRaises(ConfigError) as missing:
            load_config(self.write_config())
        self.assertEqual(missing.exception.category, "token_unreadable")

    def test_no_diagnostic_or_description_can_disclose_the_token(self):
        config = load_config(self.write_config())
        rendered = " ".join([
            repr(config),
            repr(config.credentials),
            json.dumps(config.describe(), sort_keys=True),
        ])
        self.assertNotIn(TOKEN, rendered)
        self.assertNotIn("fitway.example.com", json.dumps(config.describe()))
        self.assertEqual(
            config.describe()["endpoint"], {"scheme": "https", "host": "external"}
        )
        self.assertEqual(config.credentials.read_token(), TOKEN)

    def test_a_malformed_or_absent_configuration_fails_closed(self):
        path = self.root / "client.json"
        path.write_text("{not json", encoding="utf-8")
        with self.assertRaises(ConfigError) as broken:
            load_config(path)
        self.assertEqual(broken.exception.category, "config_not_json")
        with self.assertRaises(ConfigError) as absent:
            load_config(self.root / "absent.json")
        self.assertEqual(absent.exception.category, "config_unreadable")


class SourceTests(EdgeTestCase):
    def test_the_synthetic_source_is_deterministic_for_a_seed(self):
        first = create_source(load_config(self.write_config()).source)
        second = create_source(load_config(self.write_config()).source)
        self.assertEqual(
            [first.sample(5) for _ in range(20)], [second.sample(5) for _ in range(20)]
        )

    def test_an_rtsp_source_returns_a_named_site_gate_error(self):
        config = load_config(self.write_config({"source": {"kind": "rtsp"}}))
        self.assertEqual(config.source.kind, "rtsp")
        with self.assertRaises(SiteGatedSourceError) as failure:
            create_source(config.source)
        self.assertEqual(failure.exception.category, "site_gated_source")
        self.assertEqual(failure.exception.kind, "rtsp")

    def test_an_rtsp_source_may_only_carry_an_opaque_site_object(self):
        config = load_config(
            self.write_config({"source": {"kind": "rtsp", "site": {"anything": "opaque"}}})
        )
        self.assertEqual(config.source.kind, "rtsp")
        with self.assertRaises(ConfigError):
            load_config(self.write_config({"source": {"kind": "rtsp", "seed": 1}}))


class RuntimeTestCase(EdgeTestCase):
    def build(self, responses, **overrides):
        path = self.write_config(**overrides)
        config = load_config(path)
        store = SqliteStateStore(config.state.sqlite_path, config.source.initial_count)
        self.addCleanup(store.close)
        source = create_source(config.source)
        transport = FakeTransport(responses)
        clock = FakeClock(datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc))
        self.lines = []
        edge = EdgeRuntime(
            config,
            store,
            source,
            transport,
            clock=clock,
            sleep=clock.advance,
            emit=self.lines.append,
        )
        return edge, store, transport, clock


class RuntimeTests(RuntimeTestCase):
    def test_a_bounded_run_settles_and_advances_the_sequence(self):
        edge, store, transport, _ = self.build([TransportResponse(200, acknowledgement(1))])
        self.assertEqual(edge.run(max_steps=1), EXIT_OK)
        self.assertEqual(len(transport.sent), 1)
        snapshot = store.snapshot()
        self.assertEqual(snapshot.sequence, 1)
        self.assertIsNone(snapshot.in_flight_request)
        self.assertEqual(snapshot.last_request, transport.sent[0]["body"])

    def test_the_transport_receives_the_exact_durable_bytes(self):
        edge, store, transport, _ = self.build([TransportResponse(200, acknowledgement(1))])
        edge.step()
        self.assertEqual(transport.sent[0]["body"], store.snapshot().last_request)

    def test_an_outage_keeps_the_exact_request_and_keeps_counting(self):
        edge, store, transport, _ = self.build([
            TransportUnavailable("URLError"),
            TransportUnavailable("URLError"),
            TransportResponse(200, acknowledgement(1)),
        ])
        self.assertEqual(edge.step(), "network_retry")
        armed = store.snapshot().in_flight_request
        buffered_after_first = store.snapshot().buffered_minutes
        self.assertEqual(edge.step(), "network_retry")
        self.assertEqual(store.snapshot().in_flight_request, armed)
        self.assertGreaterEqual(store.snapshot().buffered_minutes, buffered_after_first)
        self.assertEqual(edge.step(), "settled")
        self.assertEqual({item["body"] for item in transport.sent}, {armed})
        self.assertEqual(store.snapshot().last_request, armed)

    def test_authentication_failure_stops_with_its_own_category(self):
        edge, _, _, _ = self.build([TransportResponse(401, {"error": "unauthorized"})])
        self.assertEqual(edge.run(max_steps=1), EXIT_AUTHENTICATION)
        self.assertTrue(any("category=authentication" in line for line in self.lines))

    def test_a_forbidden_response_also_stops_with_authentication(self):
        edge, _, _, _ = self.build([TransportResponse(403, {"error": "forbidden"})])
        self.assertEqual(edge.run(max_steps=1), EXIT_AUTHENTICATION)

    def test_rate_limiting_waits_and_retries_the_same_request(self):
        edge, store, transport, clock = self.build([
            TransportResponse(429, {"error": "rate_limited"}, {"Retry-After": "3"}),
            TransportResponse(200, acknowledgement(1)),
        ])
        self.assertEqual(edge.step(), "rate_limited")
        armed = store.snapshot().in_flight_request
        self.assertEqual(edge.step(), "settled")
        self.assertEqual([item["body"] for item in transport.sent], [armed, armed])

    def test_a_server_failure_retries_the_same_request_with_bounded_backoff(self):
        edge, store, transport, _ = self.build([
            TransportResponse(503, {"error": "unavailable"}),
            TransportResponse(200, acknowledgement(1)),
        ])
        self.assertEqual(edge.step(), "server_retry")
        self.assertEqual(edge.step(), "settled")
        self.assertEqual(len({item["body"] for item in transport.sent}), 1)
        delays = [
            int(re.search(r"delaySeconds=(\d+)", line).group(1))
            for line in self.lines
            if "delaySeconds=" in line
        ]
        self.assertTrue(delays)
        self.assertTrue(all(value <= 30 for value in delays))

    def test_an_invalid_acknowledgement_stops_without_advancing_state(self):
        edge, store, _, _ = self.build([TransportResponse(200, {"reason": "processed"})])
        self.assertEqual(edge.run(max_steps=1), EXIT_PROTOCOL)
        snapshot = store.snapshot()
        self.assertEqual(snapshot.sequence, 0)
        self.assertIsNotNone(snapshot.in_flight_request)
        self.assertIsNone(snapshot.last_request)

    def test_a_client_rejection_stops_with_the_protocol_category(self):
        edge, _, _, _ = self.build([TransportResponse(422, {"error": "invalid"})])
        self.assertEqual(edge.run(max_steps=1), EXIT_PROTOCOL)

    def test_commands_pending_resends_the_same_sequence_with_the_corrected_count(self):
        edge, store, transport, _ = self.build(
            [
                TransportResponse(
                    200,
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
                ),
                TransportResponse(200, acknowledgement(1)),
            ],
            source={"initialCount": 2},
        )
        self.assertEqual(edge.step(), "commands_pending")
        self.assertEqual(edge.step(), "settled")
        payloads = [json.loads(item["body"]) for item in transport.sent]
        self.assertEqual([item["sequence"] for item in payloads], [1, 1])
        self.assertEqual([item["mode"] for item in payloads], ["live", "live"])
        self.assertEqual(payloads[1]["currentCount"], 4)
        self.assertEqual(payloads[1]["appliedCommandId"], 8)
        self.assertEqual(store.snapshot().applied_command_id, 8)

    def test_a_sequence_gap_recovers_the_last_settled_request(self):
        edge, store, transport, _ = self.build([
            TransportResponse(200, acknowledgement(1)),
            TransportResponse(200, acknowledgement(0, reason="sequence_gap")),
            TransportResponse(200, acknowledgement(1, reason="replay")),
        ])
        self.assertEqual(edge.step(), "settled")
        settled = store.snapshot().last_request
        self.assertEqual(edge.step(), "sequence_gap_recovered")
        self.assertEqual(store.snapshot().in_flight_request, settled)
        self.assertEqual(edge.step(), "settled")
        self.assertEqual(transport.sent[-1]["body"], settled)

    def test_an_unrecoverable_gap_stops_on_durable_state(self):
        edge, _, _, _ = self.build([
            TransportResponse(200, acknowledgement(9, reason="sequence_gap")),
        ])
        self.assertEqual(edge.run(max_steps=1), EXIT_STATE)

    def test_backfill_drains_before_live_authority_resumes(self):
        edge, store, transport, clock = self.build(
            [TransportResponse(200, acknowledgement(index)) for index in range(1, 6)],
            source={"sampleIntervalSeconds": 60},
        )
        for _ in range(4):
            edge.sample()
            clock.advance(60)
        self.assertGreaterEqual(store.snapshot().buffered_minutes, 3)
        self.assertEqual(edge.step(), "settled")
        first = json.loads(transport.sent[0]["body"])
        self.assertEqual(first["mode"], "backfill")
        self.assertEqual(edge.step(), "settled")
        self.assertEqual(json.loads(transport.sent[1]["body"])["mode"], "live")

    def test_this_build_never_claims_a_working_capture_device(self):
        edge, _, transport, _ = self.build([TransportResponse(200, acknowledgement(1))])
        edge.step()
        health = json.loads(transport.sent[0]["body"])["health"]
        self.assertEqual(health["process"], "ok")
        self.assertEqual(health["camera"], "unknown")
        self.assertEqual(health["feed"], "unknown")
        self.assertIsNone(health["detectorFps"])


class DiagnosticPrivacyTests(RuntimeTestCase):
    def test_no_diagnostic_line_carries_a_secret_a_url_or_a_host(self):
        edge, _, _, _ = self.build([
            TransportUnavailable("URLError"),
            TransportResponse(429, {"error": "x"}, {"Retry-After": "2"}),
            TransportResponse(503, {"error": "x"}),
            TransportResponse(
                200,
                acknowledgement(
                    1,
                    reason="commands_pending",
                    commands=[{
                        "id": 3,
                        "type": "set_count",
                        "targetValue": 5,
                        "issuedAt": "2026-07-13T12:00:19.000Z",
                    }],
                ),
            ),
            TransportResponse(200, acknowledgement(1)),
        ])
        for _ in range(5):
            edge.step()
        joined = "\n".join(self.lines)
        self.assertTrue(joined)
        for forbidden in (TOKEN, "Bearer", "://", "fitway.example.com", "device.token", "SELECT", "sqlite"):
            self.assertNotIn(forbidden, joined, forbidden)
        self.assertNotIn("currentCount", joined)
        self.assertNotIn("targetValue", joined)

    def test_a_disallowed_diagnostic_field_is_a_programming_error(self):
        edge, _, _, _ = self.build([TransportResponse(200, acknowledgement(1))])
        with self.assertRaises(ValueError):
            edge.emit("custom", token=TOKEN)

    def test_a_token_can_never_reach_an_emitted_line(self):
        edge, _, _, _ = self.build([TransportResponse(200, acknowledgement(1))])
        edge.emit("request_prepared", mode=f"live {TOKEN}")
        self.assertNotIn(TOKEN, self.lines[-1])
        self.assertIn("<redacted>", self.lines[-1])


class _CaptureHandler(BaseHTTPRequestHandler):
    """Captures the exact transmitted bytes and never settles, so the request stays armed."""

    bodies: list

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        type(self).bodies.append({
            "path": self.path,
            "body": self.rfile.read(length),
            "contentType": self.headers.get("Content-Type"),
        })
        response = json.dumps({"error": "unavailable"}).encode()
        self.send_response(503)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)

    def log_message(self, *_args):
        return


class LoopbackTransportTests(EdgeTestCase):
    def test_the_first_body_and_the_restart_replay_equal_the_durable_bytes(self):
        bodies = []
        handler = type("CaptureHandler", (_CaptureHandler,), {"bodies": bodies})
        server = HTTPServer(("127.0.0.1", 0), handler)
        self.addCleanup(server.server_close)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(server.shutdown)

        path = self.loopback_config(server.server_address[1])
        config = load_config(path)
        self.assertEqual(
            config.endpoint.url, f"http://127.0.0.1:{server.server_address[1]}/edge/push"
        )

        store = SqliteStateStore(config.state.sqlite_path, config.source.initial_count)
        source = create_source(config.source)
        clock = FakeClock(datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc))
        lines = []
        edge = EdgeRuntime(
            config,
            store,
            source,
            runtime_module.UrllibTransport(),
            clock=clock,
            sleep=clock.advance,
            emit=lines.append,
        )
        prepared = store.prepare_request(
            runtime_module.SYNTHETIC_HEALTH, datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc)
        )
        durable = prepared.body
        edge.step()
        store.close()
        source.close()

        reopened = SqliteStateStore(config.state.sqlite_path)
        self.addCleanup(reopened.close)
        restarted = EdgeRuntime(
            config,
            reopened,
            create_source(config.source),
            runtime_module.UrllibTransport(),
            clock=FakeClock(datetime(2026, 7, 13, 12, 5, tzinfo=timezone.utc)),
            sleep=lambda _seconds: None,
            emit=lines.append,
        )
        restarted.step()

        self.assertEqual(len(bodies), 2)
        self.assertEqual(bodies[0]["body"], durable)
        self.assertEqual(bodies[0]["body"], bodies[1]["body"])
        self.assertEqual(bodies[0]["path"], "/edge/push")
        self.assertEqual(bodies[0]["contentType"], "application/json")
        self.assertEqual(reopened.snapshot().in_flight_request, durable)
        self.assertNotIn(TOKEN, "\n".join(lines))


class CommandLineTests(EdgeTestCase):
    def test_check_config_reports_a_privacy_safe_summary(self):
        stream = io.StringIO()
        with redirect_stdout(stream):
            code = client.main(["--config", str(self.write_config()), "--check-config"])
        self.assertEqual(code, EXIT_OK)
        summary = json.loads(stream.getvalue())
        self.assertEqual(summary["endpoint"], {"scheme": "https", "host": "external"})
        self.assertEqual(summary["source"], "synthetic")
        self.assertEqual(summary["retentionHours"], 48)
        self.assertEqual(summary["stateSchemaVersion"], sqlite_store.SCHEMA_VERSION)
        self.assertNotIn(TOKEN, stream.getvalue())
        self.assertNotIn("fitway.example.com", stream.getvalue())

    def test_a_rejected_configuration_exits_with_the_configuration_code(self):
        stream = io.StringIO()
        with redirect_stderr(stream):
            code = client.main(["--config", str(self.root / "absent.json")])
        self.assertEqual(code, EXIT_CONFIG)
        self.assertIn("config_unreadable", stream.getvalue())
        self.assertNotIn(TOKEN, stream.getvalue())

    def test_a_site_gated_source_exits_without_opening_anything(self):
        stream = io.StringIO()
        with redirect_stderr(stream):
            code = client.main(["--config", str(self.write_config({"source": {"kind": "rtsp"}}))])
        self.assertEqual(code, EXIT_SOURCE)
        self.assertIn("site_gated_source", stream.getvalue())
        self.assertFalse((self.root / "state").exists())

    def test_the_command_line_accepts_no_secret_or_payload_value(self):
        options = {
            action.dest for action in client.parser()._actions if action.dest != "help"
        }
        self.assertEqual(options, {"config", "check_config", "max_steps"})


class PackagePrivacyTests(unittest.TestCase):
    def test_no_module_can_capture_decode_or_persist_a_visual_record(self):
        forbidden = (
            "cv2",
            "opencv",
            "ultralytics",
            "torch",
            "numpy",
            "pillow",
            "imread",
            "imwrite",
            "videocapture",
            "frame",
            "snapshot_jpeg",
            ".jpg",
            ".png",
            ".mp4",
        )
        modules = [
            Path(module.__file__)
            for module in (
                config_module,
                protocol,
                runtime_module,
                sources,
                sqlite_store,
            )
        ]
        modules.append(Path(client.__file__))
        for path in modules:
            body = _executable_source(path).lower()
            for name in forbidden:
                self.assertNotIn(name, body, f"{name} in {path.name}")

    def test_only_the_standard_library_is_imported(self):
        allowed = {
            "argparse", "contextlib", "dataclasses", "datetime", "json", "pathlib", "random",
            "re", "signal", "sqlite3", "sys", "time", "typing", "urllib", "math",
        }
        for module in (config_module, protocol, runtime_module, sources, sqlite_store):
            body = Path(module.__file__).read_text(encoding="utf-8")
            for match in re.finditer(r"^(?:import|from)\s+([A-Za-z_][\w.]*)", body, re.MULTILINE):
                root = match.group(1).split(".")[0]
                if root in {"fitway_edge", "__future__", ""}:
                    continue
                self.assertIn(root, allowed, f"{root} in {Path(module.__file__).name}")


if __name__ == "__main__":
    unittest.main()
