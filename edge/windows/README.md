# FITWAY edge on Windows

Three scripts own the machine lifecycle: `install.ps1` registers the boot task and the
least-privilege ACLs, `run.ps1` supervises the client, and `uninstall.ps1` stops it and removes only
its own task. All of them take absolute paths and nothing resolves through `PATH`, the Python
launcher, or the current directory.

## Layout

Mutable operational data lives under one configurable root, separate from the immutable versioned
program directories. Nothing in `versions\` is ever edited in place.

```
%ProgramData%\FITWAY\
  config\client.json          strict client configuration
  config\device.token         device token, at least 32 bytes
  state\edge-state.sqlite3    durable state (plus -wal and -shm)
  logs\watchdog.log           watchdog events, no secrets
  current.json                the single current-version manifest
  watchdog.lock               singleton lock held while supervising
  watchdog.pid, client.pid    running process ids

%ProgramFiles%\FITWAY\versions\<version>\edge\client.py
```

`current.json` names exactly one immutable version directory:

```json
{ "version": "1.4.0", "versionPath": "C:\\Program Files\\FITWAY\\versions\\1.4.0" }
```

## Install

Always render and read the plan first. `-PlanOnly` changes nothing and is the only mode automated
checks ever use.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File edge\windows\install.ps1 `
  -PythonExe 'C:\Program Files\Python311\python.exe' `
  -WatchdogScript 'C:\Program Files\FITWAY\versions\1.4.0\edge\windows\run.ps1' `
  -CurrentManifest 'C:\ProgramData\FITWAY\current.json' `
  -ConfigPath 'C:\ProgramData\FITWAY\config\client.json' `
  -TokenPath 'C:\ProgramData\FITWAY\config\device.token' `
  -DataRoot 'C:\ProgramData\FITWAY' `
  -Principal 'FITWAY-EDGE\edge-runtime' `
  -PlanOnly
```

Replace `-PlanOnly` with `-Install` to register for real. That path requires an elevated shell on
the target edge PC and refuses to run otherwise. The task uses an `AtStartup` trigger, the supplied
principal with `S4U` logon and the `Limited` run level, `IgnoreNew` for multiple instances, three
restarts one minute apart, and no execution time limit. No password is stored: grant the principal
"Log on as a batch job" instead. No token, password, or source URL appears in the task arguments or
in the plan.

The ACL step resets inheritance on the token and the configuration so only Administrators, SYSTEM,
and the runtime principal can read them, and grants that principal modify rights on the data and log
directories only.

## Watchdog

`run.ps1` reads the single current-version manifest, launches the absolute Python executable against
that version's `edge\client.py --config <absolute path>`, and holds an exclusive lock so a second
supervisor cannot start. An unexpected exit restarts after a bounded delay; more restarts than
`-MaxRestartsInWindow` inside `-RestartWindowSeconds` stops the watchdog with the `hot_restart_loop`
category rather than thrashing. A stop terminates the entire child process tree, so no orphan
survives. Exit codes: `0` clean stop, `10` invalid argument, `11` invalid manifest, `12` another
supervisor already holds the lock, `13` hot restart loop.

## Update

The database is the only thing that must survive, and it is only safe to copy while the client is
stopped.

1. Stop and disable the task: `Stop-ScheduledTask`, then `Disable-ScheduledTask`. Confirm
   `watchdog.pid` and `client.pid` are gone.
2. With the runtime stopped, back up `state\edge-state.sqlite3` together with its `-wal` and `-shm`
   files as one recovery unit. A copy taken while the client is running is not a valid backup.
3. Stage the new release into a new immutable `versions\<version>` directory. Never modify an
   existing version directory.
4. Run the self-checks against the staged version:
   `<python> <newVersion>\edge\client.py --config <config> --check-config`. It validates the
   configuration and reports `stateSchemaVersion`. Confirm the release supports the schema version
   already in the database. Startup refuses an unsupported newer schema, and any migration the
   release performs is a single transaction.
5. Write the new manifest to a temporary file, flush it, then atomically replace `current.json` with
   it (`[System.IO.File]::Replace` or `Move-Item -Force`). There is only ever one manifest.
6. Enable and start the task, then verify the heartbeat: `logs\watchdog.log` shows `client_started`
   and the server records a fresh push.

## Rollback

- If the old version still supports the schema now in the database, roll back by atomically
  restoring the previous `current.json` and restarting. No data is touched.
- If the new version migrated the schema beyond what the old version supports, stop the runtime
  first, restore the complete stopped backup (database plus `-wal` and `-shm`), and only then restore
  the previous manifest.

There is no in-place mutable program update and no automatic remote updater. Every change is a new
version directory plus one atomic manifest swap.

## Uninstall

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File edge\windows\uninstall.ps1 -DataRoot 'C:\ProgramData\FITWAY' -PlanOnly
powershell -NoProfile -ExecutionPolicy Bypass -File edge\windows\uninstall.ps1 -DataRoot 'C:\ProgramData\FITWAY' -StopFile 'C:\ProgramData\FITWAY\stop.flag' -Remove
```

`-StopOnly` stops the process tree without touching Task Scheduler. `-Remove` additionally
unregisters the one task named by `-TaskName` and nothing else. Configuration, token, state, and
logs are always preserved unless both `-RemoveData` and `-ConfirmDataRemoval` are given.

## Still gated on the site

Passing these checks proves the scripts, not the site. Task permissions under the real principal on
the real edge PC, camera and feed access, exit-path geometry, detector accuracy, hardware
suitability, and physical reboot and power-cut recovery are all external acceptances that must be
performed on site.
