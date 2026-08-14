<#
.SYNOPSIS
    Plans, and on explicit request registers, the FITWAY edge boot task and its least-privilege ACLs.

.DESCRIPTION
    -PlanOnly renders the exact task and ACL plan as JSON and changes nothing. It is the only mode
    continuous integration ever uses. -Install performs the real registration and must be run by an
    administrator on the target edge PC.

    Nothing here depends on PATH, on Python launcher registration, or on the current directory: every
    executable and every argument is an absolute path. No token, no password, no request payload, and
    no source URL is accepted as a parameter or emitted into the plan. The task principal uses S4U
    logon so no credential is ever stored for it; grant that principal "Log on as a batch job".
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$PythonExe,
    [Parameter(Mandatory = $true)][string]$WatchdogScript,
    [Parameter(Mandatory = $true)][string]$CurrentManifest,
    [Parameter(Mandatory = $true)][string]$ConfigPath,
    [Parameter(Mandatory = $true)][string]$TokenPath,
    [Parameter(Mandatory = $true)][string]$DataRoot,
    [Parameter(Mandatory = $true)][string]$Principal,
    [string]$TaskName = 'FITWAY Edge Counter',
    [switch]$PlanOnly,
    [switch]$Install
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$EXIT_OK = 0
$EXIT_INVALID_ARGUMENT = 10
$EXIT_MODE_REQUIRED = 11
$EXIT_NOT_ELEVATED = 12

function Write-Event {
    param([string]$Event, [string]$Category)
    Write-Host ("{0} {1} category={2}" -f (Get-Date).ToString('o'), $Event, $Category)
}

function Assert-AbsolutePath {
    param([string]$Path, [string]$Name)
    if ([string]::IsNullOrWhiteSpace($Path)) {
        Write-Event -Event 'argument_rejected' -Category ("missing:" + $Name)
        exit $EXIT_INVALID_ARGUMENT
    }
    if (-not [System.IO.Path]::IsPathRooted($Path)) {
        Write-Event -Event 'argument_rejected' -Category ("relative_path:" + $Name)
        exit $EXIT_INVALID_ARGUMENT
    }
}

foreach ($pair in @(
        @{ Path = $PythonExe; Name = 'PythonExe' },
        @{ Path = $WatchdogScript; Name = 'WatchdogScript' },
        @{ Path = $CurrentManifest; Name = 'CurrentManifest' },
        @{ Path = $ConfigPath; Name = 'ConfigPath' },
        @{ Path = $TokenPath; Name = 'TokenPath' },
        @{ Path = $DataRoot; Name = 'DataRoot' })) {
    Assert-AbsolutePath -Path $pair.Path -Name $pair.Name
}

if ([string]::IsNullOrWhiteSpace($Principal)) {
    Write-Event -Event 'argument_rejected' -Category 'missing:Principal'
    exit $EXIT_INVALID_ARGUMENT
}

if ((-not $PlanOnly) -and (-not $Install)) {
    Write-Event -Event 'mode_required' -Category 'specify_plan_only_or_install'
    exit $EXIT_MODE_REQUIRED
}

$powershellExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$logRoot = Join-Path $DataRoot 'logs'

$actionArguments = @(
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-File', ('"' + $WatchdogScript + '"'),
    '-PythonExe', ('"' + $PythonExe + '"'),
    '-CurrentManifest', ('"' + $CurrentManifest + '"'),
    '-ConfigPath', ('"' + $ConfigPath + '"'),
    '-DataRoot', ('"' + $DataRoot + '"')
) -join ' '

# Only Administrators, SYSTEM, and the runtime principal may read the secret material. The
# principal receives read on the token and configuration and modify on data and logs, nothing more.
$aclPlan = @(
    [ordered]@{
        path       = $TokenPath
        operation  = 'reset_inheritance_and_restrict_read'
        identities = @('BUILTIN\Administrators:(R)', 'NT AUTHORITY\SYSTEM:(R)', ($Principal + ':(R)'))
        command    = ('icacls "{0}" /inheritance:r /grant:r "BUILTIN\Administrators:(R)" "NT AUTHORITY\SYSTEM:(R)" "{1}:(R)"' -f $TokenPath, $Principal)
    },
    [ordered]@{
        path       = $ConfigPath
        operation  = 'reset_inheritance_and_restrict_read'
        identities = @('BUILTIN\Administrators:(R)', 'NT AUTHORITY\SYSTEM:(R)', ($Principal + ':(R)'))
        command    = ('icacls "{0}" /inheritance:r /grant:r "BUILTIN\Administrators:(R)" "NT AUTHORITY\SYSTEM:(R)" "{1}:(R)"' -f $ConfigPath, $Principal)
    },
    [ordered]@{
        path       = $DataRoot
        operation  = 'grant_runtime_modify'
        identities = @('BUILTIN\Administrators:(OI)(CI)(F)', 'NT AUTHORITY\SYSTEM:(OI)(CI)(F)', ($Principal + ':(OI)(CI)(M)'))
        command    = ('icacls "{0}" /inheritance:r /grant:r "BUILTIN\Administrators:(OI)(CI)(F)" "NT AUTHORITY\SYSTEM:(OI)(CI)(F)" "{1}:(OI)(CI)(M)"' -f $DataRoot, $Principal)
    },
    [ordered]@{
        path       = $logRoot
        operation  = 'grant_runtime_modify'
        identities = @(($Principal + ':(OI)(CI)(M)'))
        command    = ('icacls "{0}" /grant:r "{1}:(OI)(CI)(M)"' -f $logRoot, $Principal)
    }
)

$plan = [ordered]@{
    taskName        = $TaskName
    principal       = [ordered]@{
        userId    = $Principal
        logonType = 'S4U'
        runLevel  = 'Limited'
    }
    trigger         = [ordered]@{
        type = 'AtStartup'
    }
    action          = [ordered]@{
        execute          = $powershellExe
        arguments        = $actionArguments
        workingDirectory = $DataRoot
    }
    settings        = [ordered]@{
        multipleInstances       = 'IgnoreNew'
        restartCount            = 3
        restartIntervalMinutes  = 1
        executionTimeLimit      = 'PT0S'
        startWhenAvailable      = $true
        allowStartIfOnBatteries = $true
        stopIfGoingOnBatteries  = $false
        runOnlyIfNetworkAvailable = $false
    }
    paths           = [ordered]@{
        pythonExe       = $PythonExe
        watchdogScript  = $WatchdogScript
        currentManifest = $CurrentManifest
        configPath      = $ConfigPath
        tokenPath       = $TokenPath
        dataRoot        = $DataRoot
        logRoot         = $logRoot
    }
    acl             = $aclPlan
    cwdIndependent  = $true
    usesPathLookup  = $false
    carriesSecret   = $false
}

if ($PlanOnly) {
    $plan | ConvertTo-Json -Depth 8
    exit $EXIT_OK
}

$identity = [System.Security.Principal.WindowsPrincipal]::new([System.Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $identity.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Event -Event 'install_refused' -Category 'administrator_required'
    exit $EXIT_NOT_ELEVATED
}

foreach ($required in @($PythonExe, $WatchdogScript, $CurrentManifest, $ConfigPath, $TokenPath)) {
    if (-not (Test-Path -LiteralPath $required)) {
        Write-Event -Event 'install_refused' -Category 'missing_required_path'
        exit $EXIT_INVALID_ARGUMENT
    }
}

if (-not (Test-Path -LiteralPath $logRoot)) {
    New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
}

foreach ($entry in $aclPlan) {
    Write-Event -Event 'acl_applied' -Category $entry.operation
    & cmd.exe /c $entry.command | Out-Null
}

$principalObject = New-ScheduledTaskPrincipal -UserId $Principal -LogonType S4U -RunLevel Limited
$trigger = New-ScheduledTaskTrigger -AtStartup
$action = New-ScheduledTaskAction -Execute $powershellExe -Argument $actionArguments -WorkingDirectory $DataRoot
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Principal $principalObject -Trigger $trigger -Action $action -Settings $settings -Force | Out-Null
Write-Event -Event 'task_registered' -Category 'boot_trigger'
exit $EXIT_OK
