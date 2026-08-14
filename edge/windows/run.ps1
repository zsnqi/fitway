<#
.SYNOPSIS
    The FITWAY edge watchdog: one immutable version, one client process, one singleton lock.

.DESCRIPTION
    Resolves a single current-version manifest to exactly one immutable version directory, launches
    the absolute Python executable against that version's absolute client script, holds an exclusive
    singleton lock, restarts an unexpected exit after a bounded delay, refuses a hot restart loop,
    and terminates the whole child process tree on stop so nothing is orphaned.

    Every path is absolute; nothing resolves through PATH or the inherited current directory. The
    watchdog never reads the token, never reads the configuration body, and never logs a secret, a
    URL, or a payload.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$PythonExe,
    [Parameter(Mandatory = $true)][string]$CurrentManifest,
    [Parameter(Mandatory = $true)][string]$ConfigPath,
    [Parameter(Mandatory = $true)][string]$DataRoot,
    [int]$RestartDelaySeconds = 5,
    [int]$MaxRestartsInWindow = 5,
    [int]$RestartWindowSeconds = 60,
    [int]$MaxRestarts = -1,
    [int]$MaxRuntimeSeconds = 0,
    [string]$StopFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$EXIT_OK = 0
$EXIT_INVALID_ARGUMENT = 10
$EXIT_MANIFEST_INVALID = 11
$EXIT_ALREADY_RUNNING = 12
$EXIT_HOT_RESTART_LOOP = 13

$script:LogPath = $null

function Write-Event {
    param([string]$Event, [string]$Category = '')
    $line = "{0} {1}" -f (Get-Date).ToString('o'), $Event
    if ($Category -ne '') {
        $line = "{0} category={1}" -f $line, $Category
    }
    Write-Host $line
    if ($null -ne $script:LogPath) {
        Add-Content -LiteralPath $script:LogPath -Value $line -Encoding utf8
    }
}

function Assert-AbsolutePath {
    param([string]$Path, [string]$Name)
    if ([string]::IsNullOrWhiteSpace($Path) -or (-not [System.IO.Path]::IsPathRooted($Path))) {
        Write-Event -Event 'argument_rejected' -Category ("relative_or_missing:" + $Name)
        exit $EXIT_INVALID_ARGUMENT
    }
}

function Stop-ProcessTree {
    param([int]$ProcessId)
    if ($ProcessId -le 0) {
        return
    }
    & "$env:SystemRoot\System32\taskkill.exe" /PID $ProcessId /T /F 2>&1 | Out-Null
}

Assert-AbsolutePath -Path $PythonExe -Name 'PythonExe'
Assert-AbsolutePath -Path $CurrentManifest -Name 'CurrentManifest'
Assert-AbsolutePath -Path $ConfigPath -Name 'ConfigPath'
Assert-AbsolutePath -Path $DataRoot -Name 'DataRoot'
if ($StopFile -ne '') {
    Assert-AbsolutePath -Path $StopFile -Name 'StopFile'
}

if (-not (Test-Path -LiteralPath $DataRoot)) {
    New-Item -ItemType Directory -Path $DataRoot -Force | Out-Null
}
$logRoot = Join-Path $DataRoot 'logs'
if (-not (Test-Path -LiteralPath $logRoot)) {
    New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
}
$script:LogPath = Join-Path $logRoot 'watchdog.log'

if (-not (Test-Path -LiteralPath $PythonExe)) {
    Write-Event -Event 'argument_rejected' -Category 'missing:PythonExe'
    exit $EXIT_INVALID_ARGUMENT
}
if (-not (Test-Path -LiteralPath $ConfigPath)) {
    Write-Event -Event 'argument_rejected' -Category 'missing:ConfigPath'
    exit $EXIT_INVALID_ARGUMENT
}
if (-not (Test-Path -LiteralPath $CurrentManifest)) {
    Write-Event -Event 'manifest_rejected' -Category 'missing'
    exit $EXIT_MANIFEST_INVALID
}

try {
    $manifest = Get-Content -LiteralPath $CurrentManifest -Raw | ConvertFrom-Json
}
catch {
    Write-Event -Event 'manifest_rejected' -Category 'unreadable'
    exit $EXIT_MANIFEST_INVALID
}

$versionPath = $null
if ($manifest.PSObject.Properties.Name -contains 'versionPath') {
    $versionPath = [string]$manifest.versionPath
}
if ([string]::IsNullOrWhiteSpace($versionPath) -or (-not [System.IO.Path]::IsPathRooted($versionPath))) {
    Write-Event -Event 'manifest_rejected' -Category 'version_path_not_absolute'
    exit $EXIT_MANIFEST_INVALID
}
$clientScript = Join-Path $versionPath 'edge\client.py'
if (-not (Test-Path -LiteralPath $clientScript)) {
    Write-Event -Event 'manifest_rejected' -Category 'client_missing_in_version'
    exit $EXIT_MANIFEST_INVALID
}

$lockPath = Join-Path $DataRoot 'watchdog.lock'
$lock = $null
try {
    $lock = [System.IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
}
catch {
    Write-Event -Event 'startup_refused' -Category 'singleton_held'
    exit $EXIT_ALREADY_RUNNING
}

$watchdogPidPath = Join-Path $DataRoot 'watchdog.pid'
$childPidPath = Join-Path $DataRoot 'client.pid'
Set-Content -LiteralPath $watchdogPidPath -Value $PID -Encoding utf8

$exitCode = $EXIT_OK
$restarts = 0
$recentStarts = New-Object System.Collections.ArrayList
$startedAt = Get-Date
$child = $null

try {
    Write-Event -Event 'watchdog_started' -Category 'boot'
    while ($true) {
        $now = Get-Date
        [void]$recentStarts.Add($now)
        $cutoff = $now.AddSeconds(-1 * $RestartWindowSeconds)
        $windowed = @($recentStarts | Where-Object { $_ -ge $cutoff })
        $recentStarts.Clear()
        foreach ($item in $windowed) {
            [void]$recentStarts.Add($item)
        }
        if ($recentStarts.Count -gt $MaxRestartsInWindow) {
            Write-Event -Event 'watchdog_stopped' -Category 'hot_restart_loop'
            $exitCode = $EXIT_HOT_RESTART_LOOP
            break
        }

        $child = Start-Process -FilePath $PythonExe `
            -ArgumentList @($clientScript, '--config', $ConfigPath) `
            -WorkingDirectory $DataRoot -PassThru -NoNewWindow
        Set-Content -LiteralPath $childPidPath -Value $child.Id -Encoding utf8
        Write-Event -Event 'client_started' -Category 'supervised'

        $stopRequested = $false
        while (-not $child.HasExited) {
            if ($StopFile -ne '' -and (Test-Path -LiteralPath $StopFile)) {
                $stopRequested = $true
                break
            }
            if ($MaxRuntimeSeconds -gt 0 -and ((Get-Date) - $startedAt).TotalSeconds -ge $MaxRuntimeSeconds) {
                $stopRequested = $true
                break
            }
            Start-Sleep -Milliseconds 200
        }

        if ($stopRequested) {
            Write-Event -Event 'stop_requested' -Category 'terminating_process_tree'
            Stop-ProcessTree -ProcessId $child.Id
            $child.WaitForExit()
            break
        }

        Write-Event -Event 'client_exited' -Category ('exit_' + $child.ExitCode)
        if ($MaxRestarts -ge 0 -and $restarts -ge $MaxRestarts) {
            Write-Event -Event 'watchdog_stopped' -Category 'restart_budget_reached'
            break
        }
        $restarts = $restarts + 1
        if ($RestartDelaySeconds -gt 0) {
            Start-Sleep -Seconds $RestartDelaySeconds
        }
        Write-Event -Event 'client_restarting' -Category ('attempt_' + $restarts)
    }
}
finally {
    if ($null -ne $child) {
        if (-not $child.HasExited) {
            Stop-ProcessTree -ProcessId $child.Id
        }
    }
    if ($null -ne $lock) {
        $lock.Close()
        $lock.Dispose()
    }
    if (Test-Path -LiteralPath $childPidPath) {
        Remove-Item -LiteralPath $childPidPath -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $watchdogPidPath) {
        Remove-Item -LiteralPath $watchdogPidPath -Force -ErrorAction SilentlyContinue
    }
    Write-Event -Event 'watchdog_exited' -Category ('exit_' + $exitCode)
}

exit $exitCode
