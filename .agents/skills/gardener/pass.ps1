param(
    [string]$Out,
    [string]$TempRoot = 'D:/fitway-temp',
    [string]$FinalReport
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../..')).Path
if (-not $Out) {
    $Out = Join-Path $TempRoot ('gardener-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N'))
}
if (-not [System.IO.Path]::IsPathRooted($Out)) { throw '-Out must be absolute' }
if (Test-Path -LiteralPath $Out) { throw "Output directory already exists: $Out" }
$scratch = Join-Path $Out 'scratch'
# The excluded output subtree owns all temporary files, never the inventory root.
$env:TEMP = $scratch
$env:TMP = $scratch
$env:NODE_DISABLE_COMPILE_CACHE = '1'
$env:pnpm_config_verify_deps_before_run = 'error'
$env:pnpm_config_manage_package_manager_versions = 'false'
$env:pnpm_config_package_manager_strict_version = 'true'
$surveyArgs = @('--out', $Out, '--temp-root', $TempRoot)
if ($FinalReport) { $surveyArgs += @('--final-report', $FinalReport) }
& node (Join-Path $root '.agents/skills/gardener/survey.mjs') @surveyArgs
exit $LASTEXITCODE
