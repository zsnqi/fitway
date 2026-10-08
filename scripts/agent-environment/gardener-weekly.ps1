# FITWAY gardener: the weekly pass (docs/phase-records/handoffs/agent-environment/DECISIONS.md items 16, 18, 19).
# The Windows scheduled task "FITWAY gardener weekly" runs this on Fridays at 14:00; a missed run starts when the user
# is next logged on. It fetches, starts branch gardener/<date> from origin/main in the gardener's own worktree, and
# runs one headless Claude pass of .agents/skills/gardener/SKILL.md. The pass deletes nothing and pushes nothing; the
# coordinator reviews the branch and writes the ledger's gardener entry. -Smoke checks the set-up with a one-line reply.
param(
	[string]$Repository = 'D:/Projects/fitway',
	[string]$Worktree,
	[string]$Runs = 'D:/fitway-temp/gardener-weekly',
	[switch]$Smoke
)

$ErrorActionPreference = 'Stop'
$configPath = Join-Path $PSScriptRoot '../../.agents/skills/gardener/config.json'
$gardenerConfig = Get-Content -Raw -Encoding utf8 -LiteralPath $configPath | ConvertFrom-Json
if (-not $Worktree) { $Worktree = $gardenerConfig.weeklyWorktree }
$Worktree = [System.IO.Path]::GetFullPath($Worktree)
$env:FITWAY_GARDENER_WORKTREE = $Worktree
$env:TEMP = 'D:/fitway-temp'
$env:TMP = 'D:/fitway-temp'
$date = Get-Date -Format 'yyyy-MM-dd'
$run = Join-Path $Runs $date
if (Test-Path $run) { $run = Join-Path $Runs "$date-$(Get-Date -Format 'HHmm')" }
New-Item -ItemType Directory -Force $run | Out-Null
$log = Join-Path $run 'pass.log'

function Note([string]$Text) { "$(Get-Date -Format s) $Text" | Add-Content -Encoding utf8 $log }

function Invoke-Checked([string]$Exe, [string[]]$Arguments) {
	& $Exe @Arguments | Out-File -Append -Encoding utf8 $log
	if ($LASTEXITCODE) { throw "$Exe $($Arguments -join ' ') exited $LASTEXITCODE" }
}

function Show-Toast([string]$Text) {
	try {
		$null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
		$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(
			[Windows.UI.Notifications.ToastTemplateType]::ToastText02)
		$lines = $xml.GetElementsByTagName('text')
		$null = $lines.Item(0).AppendChild($xml.CreateTextNode('FITWAY gardener'))
		$null = $lines.Item(1).AppendChild($xml.CreateTextNode($Text))
		$app = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
		[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($app).Show(
			[Windows.UI.Notifications.ToastNotification]::new($xml))
	} catch { Note "toast failed: $_" }
}

function Get-Refs { git -C $Repository for-each-ref --format='%(refname) %(objectname)' refs/heads refs/remotes }

try {
	Note "run $run"
	Invoke-Checked git @('-C', $Repository, 'fetch', '--prune', 'origin')
	if (-not (Test-Path $Worktree)) {
		Invoke-Checked git @('-C', $Repository, 'worktree', 'add', '--detach', $Worktree, 'origin/main')
	}
	if (git -C $Worktree status --porcelain) {
		throw 'the gardener worktree has uncommitted changes; a pass does not start over them'
	}
	$branch = "gardener/$date"
	git -C $Repository show-ref --quiet --verify "refs/heads/$branch"
	if ($LASTEXITCODE -eq 0) { $branch = "$branch-$(Get-Date -Format 'HHmm')" }
	if (-not $Smoke) { Invoke-Checked git @('-C', $Worktree, 'switch', '-c', $branch, 'origin/main') }
	Invoke-Checked pnpm @('-C', $Worktree, 'install', '--frozen-lockfile', '--prefer-offline')

	# Defence in depth beside the skill and auto mode: the pass may not push or delete.
	$deny = @(
		'Bash(git push:*)', 'Bash(git branch -d:*)', 'Bash(git branch -D:*)', 'Bash(git branch --delete:*)',
		'Bash(git worktree remove:*)', 'Bash(git worktree prune:*)', 'Bash(git reset --hard:*)', 'Bash(rm:*)',
		'Bash(rmdir:*)', 'Bash(node D:/fitway-temp:*)', 'PowerShell(git push:*)', 'PowerShell(git branch -d:*)',
		'PowerShell(git branch -D:*)', 'PowerShell(git branch --delete:*)', 'PowerShell(git worktree remove:*)',
		'PowerShell(git worktree prune:*)', 'PowerShell(git reset --hard:*)', 'PowerShell(Remove-Item:*)',
		'PowerShell(rmdir:*)', 'PowerShell(node D:/fitway-temp:*)', 'Edit(PROJECT_STATE.yaml)',
		'Edit(PROJECT_STATE_HISTORY.yaml)'
	)
	$settings = Join-Path $run 'settings.json'
	@{ permissions = @{ deny = $deny } } | ConvertTo-Json -Depth 4 | Out-File -Encoding ascii $settings

	if ($Smoke) {
		$prompt = 'This is a set-up check for a scheduled run. Run `git status --short` in the current directory, then try once `git push --dry-run origin HEAD:refs/heads/gardener-probe` (a dry run sends nothing). Reply with one line: READY, the number of lines the status printed, and DENIED if the push call was refused or ALLOWED if it ran.'
		$effort = 'low'
	} else {
		$survey = "$run/survey".Replace('\', '/')
		$prompt = @"
This is FITWAY's scheduled weekly gardener pass (docs/phase-records/handoffs/agent-environment/DECISIONS.md items 16 and 19). Read .agents/skills/gardener/SKILL.md in this checkout and run one pass as it says, with the survey's output folder $survey. The user's rules for this run: delete nothing (no folder, branch, worktree or registration), push nothing, never edit PROJECT_STATE.yaml or PROJECT_STATE_HISTORY.yaml, and never run a generated cleanup script. Commit the rolling report and at most one bounded change on the current branch $branch, nothing else. Nobody will answer a question during this run: work through every step of the skill without stopping to check in, add nothing the skill does not ask for (no extra tests or documents), and verify with the project's real checks. End with one line: OUTCOME: clean, changed or blocked.
"@
		$effort = 'high'
	}

	$before = Get-Refs
	Push-Location $Worktree
	try {
		& claude -p $prompt --model claude-sonnet-5-5 --effort $effort --permission-mode auto `
			--permission-prompts none --settings $settings | Out-File -Encoding utf8 (Join-Path $run 'claude.txt')
		$claudeExit = $LASTEXITCODE
	} finally { Pop-Location }
	Note "claude exited $claudeExit"

	# Any ref that disappeared or moved, other than the pass's own branch, is reported.
	$after = Get-Refs
	$changed = Compare-Object $before $after | Where-Object { $_.InputObject -notmatch "^refs/heads/$([regex]::Escape($branch)) " }
	foreach ($entry in $changed) { Note "REF CHANGED $($entry.SideIndicator) $($entry.InputObject)" }

	$last = (Get-Content (Join-Path $run 'claude.txt') -ErrorAction SilentlyContinue | Select-Object -Last 1)
	$summary = if ($Smoke) { "set-up check: $last" } else { "pass ${date}: $last; branch $branch" }
	if ($changed) { $summary = "$summary; refs changed, see pass.log" }
	Note $summary
	Show-Toast $summary
	if ($claudeExit) { exit $claudeExit }
} catch {
	Note "FAILED: $_"
	Show-Toast "pass $date failed: $_ (log: $log)"
	exit 1
}
