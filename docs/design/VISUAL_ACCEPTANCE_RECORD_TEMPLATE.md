# FITWAY visual acceptance record — template

> **Authority status: RECORD TEMPLATE — NOT AUTHORITY.** This template defines what a completed
> visual acceptance record must contain. The template itself creates no authority, grants no
> approval, and changes no locked decision by itself. A completed copy records one reviewer's
> perceptual judgment; it does not promote a baseline, which remains a separate serialized action
> requiring explicit human approval (`docs/WORKFLOW.md:255-260`). Use the completed record with the
> standing review duties at `docs/WORKFLOW.md:269-293`.

## Candidate identity

- Candidate / commit SHA:
- Branch:
- Worktree path:
- Run ID / evidence root:
- Surface(s) and state(s) under review:

## Reviewer and independence

- Reviewer identity:
- Independence statement (not the implementer, no implementation authorship in this candidate, own
  run ID and own evidence path where applicable):
- Date and time of the review (with timezone):

## Exact frames inspected

*Every judgment below must be traceable to a full-resolution frame listed here with its content
hash. Frames are received before test scores, implementation rationale, or canonical comparisons.
A contact sheet or downscaled composite does not substitute for the named full-resolution frames.*

| Frame path (full resolution) | sha256 | Surface / state / locale / viewport | Inspected (yes) |
| --- | --- | --- | --- |
|  |  |  |  |

## Per-surface quality judgment

*Judge each surface relative to the strongest current surface in the product, not only against its
own reference. Name the comparison surface. Cover focal hierarchy, grouping and reading order,
rhythm, density/whitespace, surface roles, and separation of governance/controls/actions/data.*

| Surface | Strongest current surface used as the bar | Judgment (meets / below / above) | Specific observations tied to frame paths |
| --- | --- | --- | --- |
|  |  |  |  |

## Disposition of the reference itself

*The reviewer must explicitly accept or reject the reference used for comparison — a canonical or
Paper frame can encode the same weakness under review. State the disposition and reasons.*

- Reference frame(s) and source:
- Does the reviewer accept the reference as a quality bar? (yes / no / yes with named limits):
- Reasons and limits:

## Acceptance basis statement (required)

*Copy and complete this statement; it is the difference between perceptual acceptance and a green
suite.*

> The reviewer confirms that broad authorization to proceed, green test/verification suites,
> generated contact sheets, and hash/provenance stability were **not** treated as visual acceptance.
> Acceptance is based solely on direct inspection of the full-resolution frames listed above, judged
> against the named strongest surface, with the reference disposition recorded above.

## Promotion action (recorded separately)

*Promotion is never part of this acceptance record. Record it after this record is complete.*

- Promotion decision (none yet / human-approved):
- Human approval reference (record path and exact grant):
- Canonical paths + new hashes promoted:
- Verification ladder rerun after promotion (profile and result):

## Not acceptable as acceptance

- [ ] Broad or standing authorization to proceed ("complete the pass", "approved to execute").
- [ ] A green `verify:fast`, `verify:phase`, or `verify:full` run, or any other passing suite.
- [ ] A generated contact sheet, gallery, or downscaled composite without the named full-resolution
      frames.
- [ ] Hash stability, byte provenance, manifest mapping, or detector cleanliness.
- [ ] Canonical comparison alone ("matches the reference") without a quality judgment and a
      reference disposition.
- [ ] A statement that a change was intentional, authorized, or reviewed by someone else.
- [ ] Inspection after receiving test scores, implementation rationale, or canonical comparisons.
- [ ] Frames that are not named with path plus sha256, or that do not exist at full resolution.
