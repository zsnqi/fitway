#!/usr/bin/env python3
"""The production FITWAY edge client.

`edge/client.py --config <local-json>` is the only production entry point. Every secret and
every site value comes from that local file; nothing sensitive is ever accepted as a command
line value or written to a diagnostic.

This build counts from a deterministic synthetic source. It has no capture, decoding, or
recognition capability of any kind, and it refuses a site-gated source kind before opening
anything.

Exit codes: 0 clean stop, 2 configuration, 3 authentication, 4 protocol, 5 durable state,
6 site-gated source.
"""

from __future__ import annotations

import argparse
import json
import signal
import sys
from pathlib import Path
from typing import Any

if __package__ in (None, ""):  # direct `py -3 edge/client.py` execution
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from fitway_edge.config import ConfigError, load_config
from fitway_edge.runtime import (
    EXIT_CONFIG,
    EXIT_OK,
    EXIT_SOURCE,
    EXIT_STATE,
    EdgeRuntime,
    UrllibTransport,
)
from fitway_edge.sources import SiteGatedSourceError, create_source
from fitway_edge.sqlite_store import SCHEMA_VERSION, SqliteStateStore, StoreError


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(
        description="Run the FITWAY durable edge client from a local configuration file."
    )
    value.add_argument("--config", required=True, help="Absolute path to the local JSON configuration")
    value.add_argument(
        "--check-config",
        action="store_true",
        help="Validate the configuration and durable schema compatibility, then exit",
    )
    value.add_argument(
        "--max-steps",
        type=int,
        help="QA/self-test only: stop after this many push attempts; announces itself",
    )
    return value


def _report(stream: Any, event: str, **fields: Any) -> None:
    parts = [event]
    parts.extend(f"{name}={fields[name]}" for name in sorted(fields))
    print(" ".join(parts), file=stream, flush=True)


def main(argv: list[str] | None = None) -> int:
    arguments = parser().parse_args(argv)
    if arguments.max_steps is not None:
        _report(sys.stderr, "bounded_run_active", category="qa_self_test")

    try:
        config = load_config(arguments.config)
    except ConfigError as failure:
        _report(sys.stderr, "configuration_rejected", category=failure.category, key=failure.key)
        return EXIT_CONFIG

    try:
        source = create_source(config.source)
    except SiteGatedSourceError as failure:
        _report(sys.stderr, "source_site_gated", category=failure.category, kind=failure.kind)
        return EXIT_SOURCE

    try:
        store = SqliteStateStore(config.state.sqlite_path, config.source.initial_count)
    except StoreError as failure:
        source.close()
        _report(sys.stderr, "state_unavailable", category=failure.category)
        return EXIT_STATE

    if arguments.check_config:
        summary = {**config.describe(), "stateSchemaVersion": SCHEMA_VERSION}
        store.close()
        source.close()
        print(json.dumps(summary, sort_keys=True), flush=True)
        return EXIT_OK

    runtime = EdgeRuntime(config, store, source, UrllibTransport())

    def stop(_signum: int, _context: Any) -> None:
        runtime.request_stop()

    signal.signal(signal.SIGINT, stop)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, stop)

    try:
        return runtime.run(max_steps=arguments.max_steps)
    finally:
        runtime.close()


if __name__ == "__main__":
    sys.exit(main())
