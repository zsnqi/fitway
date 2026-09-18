# FITWAY active design packet — template

> **Authority status: BRIEFING TEMPLATE — NOT AUTHORITY.** This is a fill-in brief for one bounded
> design or UI session. It creates no authority, grants no approval, and changes no locked product,
> privacy, security, accessibility, content, or visual decision by itself. The filled packet is a
> derived view: the sources it cites, not the packet, govern. An unfilled or stale field is a stop
> condition for the session, not permission to guess. Per `docs/WORKFLOW.md:263-267`, the packet is
> what the next implementation session receives.

Fill every field before implementation. Keep closed history out; retrieve it only when a decision
requires it.

## Surface and user task

*Guidance: name exactly one surface/route and the one user task it must serve; state the state and
locale scope the session may touch.*

- Surface / route:
- User task in one sentence:
- States and locales in scope:
- Explicitly out of scope:

## Locked behavior/content/accessibility/data semantics

*Guidance: list the binding Product/Spec/ADR constraints for this surface with exact paths — never
restate or reinterpret them, and stop if a requested change conflicts.*

- Locked behavior:
- Locked content/copy sources:
- Accessibility baseline (keyboard, focus, RTL/LTR, zoom/reflow, semantic alternatives):
- Data semantics and state truth (stale/absent/closed/loading never looks live):

## Current visual-authority status

*Guidance: copy the surface's current status and authority source from
`docs/design/VISUAL_AUTHORITY_STATUS.md`; do not invent or infer a status.*

- Status (one of the five, plus any `DECISION REQUIRED` flag):
- Authority source (manifest key + status line, acceptance record):
- Register entry date read:

## Open visual decisions

*Guidance: list every unanswered human decision that blocks or bounds this session, with the record
path where the decision is requested; unresolved authority questions stop the session.*

- Decision:
- Requested at:
- Impact if unanswered:

## Known perceptual failures

*Guidance: list the specific, already-observed visual failures this session must not repeat or
inherit, with the exact evidence path and frame.*

- Failure:
- Evidence path / frame:
- Status (open / frozen candidate / resolved by human):

## Exact current and reference screenshots

*Guidance: give full-resolution paths and content hashes for every current and reference frame; a
path without a hash is not usable evidence.*

| Role (current / Paper reference / canonical / rejected baseline) | Path | sha256 | Viewport / state / locale |
| --- | --- | --- | --- |
|  |  |  |  |

## Accepted spatial thesis

*Guidance: state in one paragraph what the composition is for (focal hierarchy, grouping, reading
order, rhythm, density, separation of governance/controls/actions/data) and which decision record
accepted it; do not introduce a new thesis in implementation.*

- Thesis:
- Accepted by (record path, if any):

## Allowed source paths

*Guidance: list the exact files or directories this session may write, plus shared leases; anything
not listed is forbidden.*

- Owned paths:
- Shared leases:
- Forbidden paths:

## Verification and promotion gates

*Guidance: list the gates in order — functional/accessibility verification, fresh perceptual review
of named frames, then separate human-approved canonical promotion — and note that green checks are
lint, not acceptance.*

- Verification ladder / phase profile:
- Perceptual gate (frames that must be inspected, reviewer, independence):
- Promotion gate (separate serialized action, human approval reference):
- Explicit non-evidence: broad authorization, green suites, generated contact sheets, and hash
  stability are not visual acceptance (`docs/WORKFLOW.md:255-260`).

## Paper availability/provenance

*Guidance: record the live Paper tool check result for this session; if live Paper is unavailable,
record the exact export package and its timestamp or `NOT YET DETERMINED`, and stop any composition
decision that depends on live Paper.*

- Live Paper tool check performed at (time) and result:
- If unavailable: exact export package path + export timestamp/version:
- Freshness warning (stale exports are provenance, never live authority):
