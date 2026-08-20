# FITWAY external worker processing authorization

- Recorded: 2026-08-21 02:18 +03:00.
- Authority: explicit human instruction in the active coordinator session.
- Scope: durable FITWAY project delegation authorization.
- Applies prospectively; no completed b05 work is reopened or rerun.

## Authorized

FITWAY repository source code and non-secret project artifacts may be sent to and processed by the
configured OpenCode Go / DeepSeek V4 Pro external worker when the current
`agent-project-workflow` route-first native-versus-external comparison selects that route.

The grant remains in force for future eligible FITWAY stages and does not need to be re-requested at
every delegation boundary.

## Excluded

This authorization does not include credentials, secrets, API keys, `.env` contents,
personal/private data, or any artifact already prohibited by FITWAY repository policy. Those items
must not be included in an external worker prompt, bundle, log, screenshot, or artifact transfer.

## Route-selection effect

This decision removes the missing external data-processing authorization that made the OpenCode Go
route ineligible for b05 Stages 1 and 2. It does not select the external route automatically. Every
future eligible delegated stage must still perform the corrected v1.4.1 route-first comparison and
record the concrete material reason for the selected route.
