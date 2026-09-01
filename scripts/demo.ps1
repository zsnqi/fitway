[CmdletBinding()]
param(
	[Parameter(Mandatory = $true)]
	[ValidateSet("prepare", "reset", "start", "status", "verify", "stop", "clean")]
	[string]$Action
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$repo = Split-Path -Parent $repo
Set-Location -LiteralPath $repo

function Convert-SecureDemoValue([Security.SecureString]$Value) {
	$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
	try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
	finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$needsCredentials = $Action -in @("reset", "verify")
try {
	if ($needsCredentials) {
		$owner = Read-Host "Demo owner password" -AsSecureString
		$pin = Read-Host "Demo staff PIN (6-12 Western digits)" -AsSecureString
		$env:FITWAY_DEMO_OWNER_PASSWORD = Convert-SecureDemoValue $owner
		$env:FITWAY_DEMO_STAFF_PIN = Convert-SecureDemoValue $pin
	}
	& node --import tsx scripts/demo/cli.ts $Action
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
	Remove-Item Env:FITWAY_DEMO_OWNER_PASSWORD -ErrorAction SilentlyContinue
	Remove-Item Env:FITWAY_DEMO_STAFF_PIN -ErrorAction SilentlyContinue
}
