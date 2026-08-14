# Phase 12 durable edge client — coordinator integration and DONE

- Status: `DONE`. Repair attempts consumed: `0/2`.
- Integrated commit: `05ad2c4` (`merge: integrate phase 12 durable edge client b01`, no-fast-forward).
- Candidate tip: `e97fb2c` on `work/phase12-edge-client-b01`, activation `b18690b`.
- Stage commits: `5c896dc` protocol extraction, `dbe7947` SQLite client runtime, `26f8e30` Windows
  lifecycle, `e97fb2c` candidate handoff.
- Coordinator run ID / database: `p12_edge_c01` / `fitway_integration_p12_edge_c01`.

## What shipped

A contract-level production Python edge client, standard library only:

- `fitway_edge.protocol` is now the single definition of schema-v2 validation, canonical
  serialization, acknowledgement correlation, command application, and request construction. The
  accepted simulator became a thin CLI/state adapter over it rather than a second state machine.
- Strict fail-closed schema-v1 configuration with a frozen URL seam, unknown-key rejection,
  config-relative path resolution, the loopback/TLS rule, a 32-byte token-file floor, and
  secret-free diagnostics.
- A deterministic synthetic counting source. `source.kind: "rtsp"` raises a named site-gate error
  and exits without opening a stream, creating a state directory, or importing any CV code.
- A transactional SQLite store: WAL, `synchronous=FULL`, an aggregate-only two-table schema, count
  floored at zero, minute idempotency, an exact 2,880-row outbox cap, exact durable request bytes,
  and one `BEGIN IMMEDIATE`/one commit per public mutation through a single transaction helper.
- `EdgeRuntime` with exact in-flight replay, backfill draining before live, ascending pending-command
  application before live authority resumes, `commands_pending` resending the same live sequence, and
  bounded backoff.
- Windows boot-triggered Scheduled Task, watchdog, uninstall, and an update/rollback runbook, all
  reachable in CI only through a non-mutating `-PlanOnly` seam.

## Independent verification — `PASS`

A fresh verifier that did not implement the candidate ran from a clean detached worktree on its own
disposable database `fitway_integration_p12_edge_v01`, instructed not to read the implementer's
records until it had formed its own assessment.

Scope: 20 paths, all authorized — the eighteen leased edge paths plus two worker handoffs. Nothing
outside `edge/` and the phase-12 handoff glob. The four frozen device-contract fixtures are
byte-identical at both revisions, confirmed by blob hash. Every Python import root is standard
library; no dependency and no manifest change.

Contracts, each proved to a named test: behaviour-identical protocol extraction with all 18 base
simulator tests surviving and zero removed lines; exact durable bytes proved against raw wire bytes
captured by a real loopback HTTP server rather than by re-serialization; transaction atomicity with
injected pre-commit failure; in-flight discipline where sampling during an outage never mutates the
frozen BLOB and settlement deletes only the correlated request's own minutes; reconnect ordering;
the WAL/`synchronous=FULL`/aggregate-only/2,880 bounds; and the full configuration matrix including
rejection of path, query, fragment, and user-information injection in the push URL.

The verifier went beyond the required ladder and ran its own commit-boundary process-kill probe —
12 trials with the write transaction open — recovering to exact pre-state 12/12, never a partial or
cross-field mix.

Privacy was judged adversarially over the whole diff rather than through the candidate's own tests.
Every hit for CV, image, codec, or identity terms is a negative assertion in a test, a denial in a
docstring, or an unrelated Windows identity check. The controlling mechanism is structural:
`EdgeRuntime.emit` validates field names against a frozen allowlist and **raises** on anything else,
so a count, payload, URL, host, or SQL string cannot be emitted even by a careless future call site.

Lifecycle: `-PlanOnly` exits before the elevation check, log-root creation, every `icacls` call, and
task registration. No test passes `-Install`. The verifier confirmed on this machine after its runs
that no `*FITWAY*` scheduled task exists. The watchdog test spawns a grandchild and proves both
processes die with no orphan.

Flakiness: none. Full discovery green three times, the timing-sensitive lifecycle suite five times,
the socket and SQLite suites three times each.

## Findings and how they were resolved

1. **Low, resolved** — the verifier found an unfilled placeholder in the candidate record's commit
   field at `c0bf64e`. The worker had already corrected it in the tip `e97fb2c`; the field now
   identifies the candidate head unambiguously. The candidate head is `e97fb2c`.
2. **Informational, recorded consciously** — `SPEC.md:646-647` says "auto-starting,
   watchdog-supervised Windows **service**", while the delivered mechanism is a boot-triggered
   Scheduled Task plus a watchdog. This is **not** treated as a locked-product conflict, for three
   reasons: the independently reviewed Phase 12 plan specifies the Scheduled Task design explicitly;
   that plan's rejected-shortcut list forbids PyWin32, which is the standard route to a real SCM
   service; and `PHASES.md` states the requirement functionally as "auto-start, watchdog restart,
   and reboot/update/power-loss recovery", which is met. The functional requirement in `SPEC.md`
   — recovery from crash, reboot, and power loss without staff action — is satisfied. **This
   interpretation is flagged for human ratification at the site gate**, where the real Windows
   principal, logon mode, and permissions are validated anyway. It is recorded rather than silently
   assumed.
3. **Informational** — three unused entries in the diagnostic allowlist, and `edge/client.py:59`
   `_report` lacks the self-enforcing guard that `emit` has. All three call sites pass fixed literal
   values, so nothing leaks today. Noted for a future tightening, not a defect.

## Verification-target detail

Independent verification ran at `c0bf64e` while the branch tip is `e97fb2c`. The worker amended its
handoff after the verifier worktree was pinned. `git diff c0bf64e e97fb2c` touches only that one
handoff file, three insertions and two deletions; the three code commits are identical in both. The
verified code is therefore exactly the integrated code. Recorded so no later reader treats it as a
verification gap.

## Coordinator gates on merged `main`

| Gate | Result |
| --- | --- |
| `py -3 -m unittest discover -s edge -p test_*.py` | PASS — `Ran 117 tests`, `OK` |
| `pnpm verify:full` | PASS, exit 0 |
| Repository mutation guard | "Verification full passed without repository mutation." |
| `git status --short` after the ladder | clean |

## Released

Owner, heartbeat, and lease expiry cleared. The eighteen-path exclusive edge-spine lease is
released. Verification profile `12` is retained because the slice is now integrated.

## External acceptance still outstanding, and deliberately unclaimed

Real RTSP capture and feed geometry; ROI and line calibration; detector and tracker accuracy;
hardware suitability; the real Windows principal, logon mode, "log on as a batch job" right, and
`icacls` results on the actual edge PC; remote-support security; and physical reboot, update, and
power-cut recovery. The site protocol for these is in the reviewed plan and in
`edge/windows/README.md`. Nothing in this milestone claims them.

No push, no deploy, no external provisioning.
