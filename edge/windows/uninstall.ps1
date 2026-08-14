<#
.SYNOPSIS
    Stops the FITWAY edge watchdog process tree and removes only its exact named task.

.DESCRIPTION
    Data is preserved by default. Configuration, token, SQLite state, and logs survive every mode
    except an explicit, separately confirmed data removal.

    -PlanOnly renders the exact plan and changes nothing. -StopOnly stops the running process tree
    without touching Task Scheduler, which is the only mutating mode continuous integration uses.
    -Remove additionally unregisters the one task named by -TaskName and nothing else.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$DataRoot,
    [string]$TaskName = 'FITWAY Edge Counter',
    [string]$StopFile = '',
    [int]$StopTimeoutSeconds = 30,
    [switch]$PlanOnly,
    [switch]$StopOnly,
    [switch]$Remove,
    [switch]$RemoveData,
    [switch]$ConfirmDataRemoval
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$EXIT_OK = 0
$EXIT_INVALID_ARGUMENT = 10
$EXIT_MODE_REQUIRED = 11
$EXIT_DATA_REMOVAL_UNCONFIRMED = 14

function Write-Event {
    param([string]$Event, [string]$Category = '')
    $line = "{0} {1}" -f (Get-Date).ToString('o'), $Event
    if ($Category -ne '') {
        $line = "{0} category={1}" -f $line, $Category
    }
    Write-Host $line
}

if ([string]::IsNullOrWhiteSpace($DataRoot) -or (-not [System.IO.Path]::IsPathRooted($DataRoot))) {
    Write-Event -Event 'argument_rejected' -Category 'relative_or_missing:DataRoot'
    exit $EXIT_INVALID_ARGUMENT
}
if ($StopFile -ne '' -and (-not [System.IO.Path]::IsPathRooted($StopFile))) {
    Write-Event -Event 'argument_rejected' -Category 'relative_or_missing:StopFile'
    exit $EXIT_INVALID_ARGUMENT
}
if ((-not $PlanOnly) -and (-not $StopOnly) -and (-not $Remove)) {
    Write-Event -Event 'mode_required' -Category 'specify_plan_only_stop_only_or_remove'
    exit $EXIT_MODE_REQUIRED
}
if ($RemoveData -and (-not $ConfirmDataRemoval)) {
    Write-Event -Event 'data_removal_refused' -Category 'confirmation_required'
    exit $EXIT_DATA_REMOVAL_UNCONFIRMED
}

$watchdogPidPath = Join-Path $DataRoot 'watchdog.pid'
$childPidPath = Join-Path $DataRoot 'client.pid'
$preserved = @(
    (Join-Path $DataRoot 'state'),
    (Join-Path $DataRoot 'logs'),
    (Join-Path $DataRoot 'config')
)

$plan = [ordered]@{
    taskName          = $TaskName
    removesTask       = [bool]$Remove
    stopsProcessTree  = $true
    stopFile          = $StopFile
    preservedPaths    = $preserved
    removesData       = ($RemoveData -and $ConfirmDataRemoval)
    dataRoot          = $DataRoot
}

if ($PlanOnly) {
    $plan | ConvertTo-Json -Depth 6
    exit $EXIT_OK
}

if ($StopFile -ne '') {
    Set-Content -LiteralPath $StopFile -Value 'stop' -Encoding utf8
    Write-Event -Event 'stop_requested' -Category 'stop_file_written'
    $deadline = (Get-Date).AddSeconds($StopTimeoutSeconds)
    while ((Get-Date) -lt $deadline -and (Test-Path -LiteralPath $watchdogPidPath)) {
        Start-Sleep -Milliseconds 200
    }
}

foreach ($pidPath in @($childPidPath, $watchdogPidPath)) {
    if (Test-Path -LiteralPath $pidPath) {
        $recorded = (Get-Content -LiteralPath $pidPath -Raw).Trim()
        $processId = 0
        if ([int]::TryParse($recorded, [ref]$processId) -and $processId -gt 0) {
            & "$env:SystemRoot\System32\taskkill.exe" /PID $processId /T /F 2>&1 | Out-Null
            Write-Event -Event 'process_tree_stopped' -Category 'forced'
        }
        Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
    }
}

if ($Remove) {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($null -ne $existing) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Event -Event 'task_removed' -Category 'exact_name_only'
    }
    else {
        Write-Event -Event 'task_absent' -Category 'nothing_removed'
    }
}

if ($RemoveData -and $ConfirmDataRemoval) {
    Write-Event -Event 'data_removed' -Category 'explicitly_confirmed'
    Remove-Item -LiteralPath $DataRoot -Recurse -Force -ErrorAction SilentlyContinue
}
else {
    Write-Event -Event 'data_preserved' -Category 'config_token_state_logs'
}

exit $EXIT_OK
