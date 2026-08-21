# FITWAY external worker processing authorization — qualified pool extension

- Recorded: 2026-08-21 15:20 +03:00.
- Authority: explicit human instruction in the active coordinator session.
- Scope: durable FITWAY project delegation authorization.
- Extends: `20260821-021800-fitway-external-worker-authorization.md`, which remains in force.
- Applies prospectively; no completed work is reopened or rerun.

## Authorized

FITWAY non-secret repository source code and non-secret project artifacts may be sent to and
processed by the currently qualified OpenCode external-worker pool when the active
`agent-project-workflow` route-first native-versus-external comparison selects that route:

- DeepSeek V4 Pro
- Ox Alpha
- GLM-5.3
- MiniMax M3

The grant covers these candidates and the providers their currently qualified routes resolve to. It
remains in force for future eligible FITWAY stages and does not need to be re-requested at every
delegation boundary.

The prior authorization covered DeepSeek V4 Pro alone. That candidate-scoped limit no longer applies
to the three candidates named above.

## Excluded

This authorization does not include credentials, secrets, API keys, `.env` contents,
personal/private data, or any artifact already prohibited by FITWAY repository policy. Those items
must not appear in an external worker prompt, packet, bundle, log, screenshot, or artifact transfer.

## Boundaries this does not move

- **Qualification is the registry's, not this record's.** Authorization removes the data-processing
  blocker only. Candidate qualification status, consequence ceilings, demonstrated tools and
  modalities, hard constraints, and reliability limits remain owned by the shared registry at
  `references/external-workers/opencode/registry.json`, and its hard filters still apply.
- **A candidate leaving the qualified pool leaves this grant.** The authorization follows the
  currently qualified pool named above; it does not extend to a future candidate, a requalified
  route under a different provider identity, or a candidate whose qualification is withdrawn.
- **Route selection stays stage-specific.** Every eligible delegated stage still performs the
  route-first comparison and records the concrete material reason for the selected route. No
  candidate becomes a default assignment for any stage type.
- **The parent gate is unchanged.** Write isolation, the diff-and-verification gate against the
  repository, the prohibition on auto-approval, and independent review where consequence warrants it
  all continue to apply exactly as before.
