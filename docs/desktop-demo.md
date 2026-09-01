# FITWAY desktop demo

The desktop demo is a disposable, loopback-only synthetic environment. It uses the repository's
reviewed migrations, real authentication, API, and edge protocol; it never uses or modifies
`apps/server/.env`.

Run commands from the repository root:

```powershell
pnpm demo:prepare
pnpm demo:reset
pnpm demo:start
pnpm demo:status
pnpm demo:verify
pnpm demo:stop
pnpm demo:clean
```

`reset` and `verify` request the owner password and staff PIN through PowerShell secure prompts.
They are passed only to the immediate child environment, never written to disk, command lines,
logs, or URLs. The owner identity is `owner@demo.fitway.local`; the staff identity is shared and
monitoring-only.

The only database is `fitway_desktop_demo`, exposed only as `127.0.0.1:55432` by the fixed
`fitway-desktop-demo` Compose project. `reset` and `clean` recheck the exact database URL,
project name, and resolved `workspace/.local/demo` path before destructive operations. `clean`
removes only that Compose volume and ignored local runtime state; `stop` preserves data.

`start` binds the services only to `127.0.0.1` and opens them through the fixed local web
(`http://localhost:3101`) and server (`http://localhost:3100`) origins. Using the `localhost`
origin lets the production-secure authentication cookies retain their normal security attributes.
It stores generated service secrets, edge token, simulator state, logs, and verified process IDs
only under `.local/demo`. A recorded PID is killed only when its live command line still contains
the role marker; any ambiguity fails closed.

Stage 1 verifies public/auth availability. The unmocked browser walkthrough and reset/restart
lifecycle proof are deliberately Stage 2 work.
