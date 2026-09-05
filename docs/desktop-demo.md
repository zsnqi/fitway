# FITWAY desktop demo

The desktop demo is a disposable, loopback-only synthetic environment. It uses the repository's
reviewed migrations, real authentication, API, and edge protocol; it never uses or modifies
`apps/server/.env`.

> **Synthetic-data notice:** every preloaded occupancy minute, chart, audit event, access record,
> health incident, and credential in this environment is a demo fixture. The changing current
> count after startup comes from the repository's local simulator, not a camera or a live gym.

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

1. Run `pnpm demo:prepare` once, then `pnpm demo:reset`. Choose a synthetic owner password of
   12-128 characters and a synthetic Staff PIN of 6-12 Western digits; keep both for this local
   walkthrough.
2. Run `pnpm demo:start` and leave that terminal open.
3. Open `http://localhost:3101` for Public. Open `http://localhost:3101/login` and enter the Staff
   PIN for Staff.
4. In a second terminal, run `pnpm demo:owner` and enter the same owner password. Inspect Owner in
   the ephemeral Chromium window, then close the window when finished.
5. Optionally run `pnpm demo:verify` from a second terminal and enter the same credentials.
6. Run `pnpm demo:stop` from a second terminal to preserve the profile. Use `pnpm demo:clean` only
   when you want to remove the disposable profile and its named Docker volume.

## Owner walkthrough

The shortest coherent owner story takes about ten minutes:

1. **Public:** start at `/` and show the live crowd level, approximate count, freshness, and
   Arabic/English switch without signing in.
2. **Staff:** open `/login`, sign in with the shared synthetic PIN, and show the monitoring-only
   operational view. Staff has no Management navigation and cannot open `/admin`.
3. **Owner daily view:** run `pnpm demo:owner`; show today's populated occupancy curve, peak,
   average, estimated entrance crossings, coverage, and the expandable minute history.
4. **Reports:** move through the range summary, weekday/hour heatmap, week-over-week comparison,
   detailed history, and CSV export controls. The 28-day profile includes varied morning, lunch,
   evening, late-night, weekday, weekend, and missing-coverage patterns.
5. **Accounts & Sign-in:** show the real shared-Staff and Owner access model without revealing any
   stored credential.
6. **Activity Log:** show synthetic owner and front-desk corrections, a reset, settings history,
   and bootstrap access events, including the available filters and older-history navigation.
7. **System Status:** show the healthy current simulator plus the synthetic prior outage, alert,
   recovery, and uptime history.
8. **Settings:** show capacity, bands, schedule, freshness, polling, and business-day controls.
   Avoid saving changes during a presentation unless the intent is to demonstrate the real
   versioned settings workflow; `demo:reset` restores the canonical profile afterwards.

The seeded history ends at the most recent five-minute snapshot boundary. Rapid resets inside the
same boundary reproduce the same non-secret fingerprint, while a later reset advances today's
synthetic chart honestly instead of inserting future observations. The simulator begins near the
same time-of-day curve so the handoff from seeded history to the changing live count is coherent.

`reset` and `verify` request the owner password and staff PIN through PowerShell secure prompts;
`owner` requests only the owner password.
They enter only the credential-consuming Node process. That process removes them from its own
environment before starting Docker, application services, the simulator, or the Owner browser.
`verify` passes them explicitly to its isolated test runner; each test worker captures and removes
them before launching Chromium with a sanitized environment. They are never written to disk,
command lines, logs, or URLs. The owner identity is `owner@demo.fitway.local`; the staff identity
is shared and monitoring-only.

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
boundaries. Credential-bearing trace capture and persistent HTML/JUnit reporters are explicitly
disabled for this live proof; its line-only console reporter does not record credential-bearing UI
actions. FITWAY intentionally has no owner sign-in page: `owner` opens an ephemeral Chromium
window by authenticating through the real separately provisioned owner-password endpoint, then
navigates to `/admin`. Closing that window discards its session.
