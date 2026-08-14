"""Counting sources for the durable FITWAY edge client.

b01 ships exactly one source: a deterministic, seeded synthetic generator of directional
entry/exit deltas. It produces anonymous aggregate numbers and nothing else.

An `rtsp` source is a declaration the configuration may carry, never something this build
can run. `create_source` refuses it with a named site-gate error before anything is opened,
resolved, or logged. No capture, decoding, or computer-vision library is imported anywhere
in this package, and none may be added without a new approved scope.
"""

from __future__ import annotations

import random
from dataclasses import dataclass

SITE_GATED_CATEGORY = "site_gated_source"


class SiteGatedSourceError(RuntimeError):
    """The configured source is deferred to the on-site gate and cannot run in this build."""

    category = SITE_GATED_CATEGORY

    def __init__(self, kind: str) -> None:
        self.kind = kind
        super().__init__(
            f"{SITE_GATED_CATEGORY}: source kind '{kind}' is deferred to the on-site gate "
            "and is not runnable in this build"
        )


def next_flow(rng: random.Random, mode: str, count: int) -> tuple[int, int]:
    """The canonical synthetic directional flow used by the client and the simulator."""
    if mode == "exit-heavy":
        return (0, rng.randint(1, 3))
    if mode == "rush" or rng.random() < 0.1:
        entries = rng.choices([0, 1, 2, 3, 4], weights=[20, 30, 25, 18, 7])[0]
        exits = rng.choices([0, 1, 2], weights=[55, 35, 10])[0] if count else 0
        return entries, exits
    entries = rng.choices([0, 1, 2, 3], weights=[65, 25, 8, 2])[0]
    exits = rng.choices([0, 1, 2], weights=[70, 25, 5])[0] if count else 0
    return entries, exits


@dataclass
class SyntheticCountingSource:
    """A deterministic aggregate counting source. It observes nothing and records nothing."""

    seed: int
    mode: str
    kind: str = "synthetic"

    def __post_init__(self) -> None:
        self._rng = random.Random(self.seed)
        self._closed = False

    def sample(self, count: int) -> tuple[int, int]:
        if self._closed:
            raise RuntimeError("The counting source is closed")
        return next_flow(self._rng, self.mode, count)

    def close(self) -> None:
        self._closed = True


def create_source(source_config) -> SyntheticCountingSource:
    """Build the configured source, or refuse a site-gated kind before touching anything."""
    if source_config.kind != "synthetic":
        raise SiteGatedSourceError(source_config.kind)
    return SyntheticCountingSource(seed=source_config.seed, mode=source_config.mode)
