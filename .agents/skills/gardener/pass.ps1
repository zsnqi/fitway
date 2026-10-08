param(
    [string]$Out,
    [string]$TempRoot = 'D:/fitway-temp'
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../..')).Path
if (-not $Out) {
    $Out = Join-Path $TempRoot ('gardener-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N'))
}
$env:TEMP = $TempRoot
$env:TMP = $TempRoot
& node (Join-Path $root '.agents/skills/gardener/survey.mjs') --out $Out --temp-root $TempRoot
exit $LASTEXITCODE
