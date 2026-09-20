# FITWAY active design packet — compatibility pointer

> **Deprecated template — NOT AUTHORITY.** This file is retained as a compatibility pointer for
> records that cite its headings. The current briefing contract is the active task packet
> (`docs/agent-context/TASK_PACKET_TEMPLATE.yaml`, schema
> `docs/schemas/task-packet.schema.json`): its `visual`, `designContextCheck`, `accessibilityGate`,
> `scope`, `authorities`, and `verification` fields carry the surface key, authority status,
> governing decision, exact frames and hashes, open human decisions, Paper availability,
> perceptual/promotion gates, owned paths, and verification profile. `docs/agent-context/README.md`
> defines the context-layer precedence. This stub creates no authority and grants no approval.

## Paper availability/provenance

Live Paper is never assumed. Record the live-Paper check result in the packet's
`visual.paperAvailability` and `visual.openHumanDecisions`, and stop at `NEEDS_HUMAN` for any
composition decision that depends on live Paper (`docs/WORKFLOW.md`, "Design work: authority,
concepts, and perceptual gates"). Stored exports and stored canonical frames are provenance and
comparison references, never live authority.
