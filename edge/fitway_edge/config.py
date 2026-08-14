"""Strict local-file configuration for the durable FITWAY edge client.

Fails closed: every key is required unless documented otherwise, unknown keys are rejected,
and no secret ever reaches a diagnostic. Error messages name the dotted configuration key
and a fixed category; they never echo a value, a token, a URL, or file content.

The configuration may retain an opaque `site` object for future on-site calibration input.
b01 never reads it and never logs it.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

SCHEMA_VERSION = 1
RETENTION_HOURS = 48
MINIMUM_TOKEN_BYTES = 32
EXTERNAL_RESOURCE_PATH = "/api/edge/push"
LOOPBACK_RESOURCE_PATH = "/edge/push"
LOOPBACK_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "[::1]"})
SOURCE_MODES = frozenset({"normal", "rush", "exit-heavy"})
SOURCE_KINDS = frozenset({"synthetic", "rtsp"})


class ConfigError(ValueError):
    """A fail-closed configuration rejection carrying a fixed diagnostic category."""

    def __init__(self, category: str, key: str, detail: str = "") -> None:
        self.category = category
        self.key = key
        message = f"{category} at {key}" if not detail else f"{category} at {key}: {detail}"
        super().__init__(message)


def _require_object(value: Any, key: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ConfigError("invalid_value", key, "expected an object")
    return value


def _exact_keys(value: dict[str, Any], key: str, required: set[str], optional: set[str] = frozenset()) -> None:
    present = set(value)
    missing = sorted(required - present)
    if missing:
        raise ConfigError("missing_key", f"{key}.{missing[0]}")
    unknown = sorted(present - required - set(optional))
    if unknown:
        raise ConfigError("unknown_key", f"{key}.{unknown[0]}")


def _integer(value: dict[str, Any], key: str, name: str, minimum: int, maximum: int) -> int:
    raw = value.get(name)
    if not isinstance(raw, int) or isinstance(raw, bool):
        raise ConfigError("invalid_value", f"{key}.{name}", "expected an integer")
    if not minimum <= raw <= maximum:
        raise ConfigError("invalid_value", f"{key}.{name}", "outside the permitted range")
    return raw


def _boolean(value: dict[str, Any], key: str, name: str) -> bool:
    raw = value.get(name)
    if not isinstance(raw, bool):
        raise ConfigError("invalid_value", f"{key}.{name}", "expected a boolean")
    return raw


def _text(value: dict[str, Any], key: str, name: str) -> str:
    raw = value.get(name)
    if not isinstance(raw, str) or not raw.strip():
        raise ConfigError("invalid_value", f"{key}.{name}", "expected a non-empty string")
    return raw


def _is_loopback(host: str) -> bool:
    return host in LOOPBACK_HOSTS or host.startswith("127.")


@dataclass(frozen=True)
class EndpointConfig:
    """A fully resolved request target. `url` is the frozen seam the tests assert."""

    url: str
    scheme: str
    host_category: str
    resource_path: str
    request_timeout_seconds: int
    require_tls: bool

    def describe(self) -> dict[str, Any]:
        """Diagnostics see the transport category only; never the host or the path values."""
        return {"scheme": self.scheme, "host": self.host_category}


@dataclass(frozen=True)
class CredentialsConfig:
    token_file: Path

    def read_token(self) -> str:
        try:
            raw = self.token_file.read_text(encoding="utf-8").strip()
        except OSError:
            raise ConfigError("token_unreadable", "credentials.tokenFile") from None
        if len(raw.encode("utf-8")) < MINIMUM_TOKEN_BYTES:
            raise ConfigError("token_too_short", "credentials.tokenFile")
        return raw

    def __repr__(self) -> str:
        return "CredentialsConfig(tokenFile=<redacted>)"


@dataclass(frozen=True)
class StateConfig:
    sqlite_path: Path
    retention_hours: int


@dataclass(frozen=True)
class SourceConfig:
    kind: str
    seed: int
    mode: str
    initial_count: int
    sample_interval_seconds: int


@dataclass(frozen=True)
class ProcessConfig:
    push_interval_seconds: int
    minimum_backoff_seconds: int
    maximum_backoff_seconds: int


@dataclass(frozen=True)
class EdgeConfig:
    schema_version: int
    endpoint: EndpointConfig
    credentials: CredentialsConfig
    state: StateConfig
    source: SourceConfig
    process: ProcessConfig

    def describe(self) -> dict[str, Any]:
        """The only representation permitted in logs or on standard output."""
        return {
            "schemaVersion": self.schema_version,
            "endpoint": self.endpoint.describe(),
            "source": self.source.kind,
            "retentionHours": self.state.retention_hours,
            "pushIntervalSeconds": self.process.push_interval_seconds,
        }


def _load_endpoint(value: Any, key: str) -> EndpointConfig:
    section = _require_object(value, key)
    _exact_keys(
        section,
        key,
        {"baseUrl", "resourcePath", "requestTimeoutSeconds", "requireTls"},
    )
    base_url = _text(section, key, "baseUrl")
    resource_path = _text(section, key, "resourcePath")
    require_tls = _boolean(section, key, "requireTls")
    timeout = _integer(section, key, "requestTimeoutSeconds", 1, 300)

    parts = urlsplit(base_url)
    if parts.scheme not in {"http", "https"}:
        raise ConfigError("invalid_value", f"{key}.baseUrl", "expected an http or https scheme")
    if not parts.netloc:
        raise ConfigError("invalid_value", f"{key}.baseUrl", "expected a host")
    if parts.username or parts.password:
        raise ConfigError("invalid_value", f"{key}.baseUrl", "user information is not permitted")
    if parts.query or parts.fragment:
        raise ConfigError("invalid_value", f"{key}.baseUrl", "query and fragment are not permitted")
    if parts.path not in {"", "/"}:
        raise ConfigError("invalid_value", f"{key}.baseUrl", "a base path is not permitted")

    loopback = _is_loopback(parts.hostname or "")
    if resource_path == EXTERNAL_RESOURCE_PATH:
        pass
    elif resource_path == LOOPBACK_RESOURCE_PATH:
        if not loopback:
            raise ConfigError("resource_path_not_permitted", f"{key}.resourcePath")
    else:
        raise ConfigError("resource_path_not_permitted", f"{key}.resourcePath")

    if require_tls and parts.scheme != "https":
        raise ConfigError("insecure_transport", f"{key}.baseUrl")
    if not require_tls and not loopback:
        raise ConfigError("insecure_transport", f"{key}.requireTls")

    return EndpointConfig(
        url=base_url.rstrip("/") + resource_path,
        scheme=parts.scheme,
        host_category="loopback" if loopback else "external",
        resource_path=resource_path,
        request_timeout_seconds=timeout,
        require_tls=require_tls,
    )


def _load_credentials(value: Any, key: str, root: Path) -> CredentialsConfig:
    section = _require_object(value, key)
    _exact_keys(section, key, {"tokenFile"})
    token_file = (root / _text(section, key, "tokenFile")).resolve()
    credentials = CredentialsConfig(token_file=token_file)
    credentials.read_token()
    return credentials


def _load_state(value: Any, key: str, root: Path) -> StateConfig:
    section = _require_object(value, key)
    _exact_keys(section, key, {"sqlitePath", "retentionHours"})
    retention = _integer(section, key, "retentionHours", RETENTION_HOURS, RETENTION_HOURS)
    return StateConfig(
        sqlite_path=(root / _text(section, key, "sqlitePath")).resolve(),
        retention_hours=retention,
    )


def _load_source(value: Any, key: str) -> SourceConfig:
    section = _require_object(value, key)
    kind = section.get("kind")
    if kind not in SOURCE_KINDS:
        raise ConfigError("invalid_value", f"{key}.kind", "expected a supported source kind")
    if kind == "rtsp":
        # Accepted as a declaration only. The runtime refuses it with a site-gate error and
        # never reads, resolves, or logs anything inside the opaque site object.
        _exact_keys(section, key, {"kind"}, {"site"})
        return SourceConfig(
            kind="rtsp",
            seed=0,
            mode="normal",
            initial_count=0,
            sample_interval_seconds=1,
        )
    _exact_keys(
        section,
        key,
        {"kind", "seed", "mode", "initialCount", "sampleIntervalSeconds"},
        {"site"},
    )
    mode = _text(section, key, "mode")
    if mode not in SOURCE_MODES:
        raise ConfigError("invalid_value", f"{key}.mode", "expected a supported flow mode")
    return SourceConfig(
        kind="synthetic",
        seed=_integer(section, key, "seed", 0, 2_147_483_647),
        mode=mode,
        initial_count=_integer(section, key, "initialCount", 0, 2_147_483_647),
        sample_interval_seconds=_integer(section, key, "sampleIntervalSeconds", 1, 3_600),
    )


def _load_process(value: Any, key: str) -> ProcessConfig:
    section = _require_object(value, key)
    _exact_keys(
        section,
        key,
        {"pushIntervalSeconds", "minimumBackoffSeconds", "maximumBackoffSeconds"},
    )
    minimum = _integer(section, key, "minimumBackoffSeconds", 1, 3_600)
    maximum = _integer(section, key, "maximumBackoffSeconds", 1, 3_600)
    if minimum > maximum:
        raise ConfigError("invalid_value", f"{key}.maximumBackoffSeconds", "below the minimum")
    return ProcessConfig(
        push_interval_seconds=_integer(section, key, "pushIntervalSeconds", 1, 3_600),
        minimum_backoff_seconds=minimum,
        maximum_backoff_seconds=maximum,
    )


def load_config(path: str | Path) -> EdgeConfig:
    """Load, validate, and freeze the configuration at `path`, or fail closed."""
    config_path = Path(path).resolve()
    try:
        raw = config_path.read_text(encoding="utf-8")
    except OSError:
        raise ConfigError("config_unreadable", "config") from None
    try:
        document = json.loads(raw)
    except json.JSONDecodeError:
        raise ConfigError("config_not_json", "config") from None
    document = _require_object(document, "config")
    if document.get("schemaVersion") != SCHEMA_VERSION:
        raise ConfigError("unsupported_schema_version", "config.schemaVersion")
    _exact_keys(
        document,
        "config",
        {"schemaVersion", "endpoint", "credentials", "state", "source", "process"},
        {"site"},
    )
    root = config_path.parent
    return EdgeConfig(
        schema_version=SCHEMA_VERSION,
        endpoint=_load_endpoint(document.get("endpoint"), "config.endpoint"),
        credentials=_load_credentials(document.get("credentials"), "config.credentials", root),
        state=_load_state(document.get("state"), "config.state", root),
        source=_load_source(document.get("source"), "config.source"),
        process=_load_process(document.get("process"), "config.process"),
    )
