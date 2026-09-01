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
pnpm demo:owner
pnpm demo:stop
pnpm demo:clean
```

For a walkthrough:

1. Run `pnpm demo:prepare` once, then `pnpm demo:reset`. Choose a synthetic owner password of at
   least 12 characters and a synthetic Staff PIN of 6-12 Western digits; keep both for this local
   walkthrough.
2. Run `pnpm demo:start` and leave that terminal open.
3. Open `http://localhost:3101` for Public. Open `http://localhost:3101/login` and enter the Staff
   PIN for Staff.
4. In a second terminal, run `pnpm demo:owner` and enter the same owner password. Inspect Owner in
   the ephemeral Chromium window, then close the window when finished.
5. Optionally run `pnpm demo:verify` from a second terminal and enter the same credentials.
6. Run `pnpm demo:stop` from a second terminal to preserve the profile. Use `pnpm demo:clean` only
   when you want to remove the disposable profile and its named Docker volume.

`reset` and `verify` request the owner password and staff PIN through PowerShell secure prompts;
`owner` requests only the owner password.
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

`verify` runs an unmocked Chromium walkthrough of Public, Staff, Owner, and the 401/403 role
boundaries. FITWAY intentionally has no owner sign-in page: `owner` opens an ephemeral Chromium
window by authenticating through the real separately provisioned owner-password endpoint, then
navigates to `/admin`. Closing that window discards its session.
