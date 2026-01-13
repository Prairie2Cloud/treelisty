# Post-Commit Self-Tree Update Hook
# Triggered by Claude Code after Bash tool calls
# Only runs self-tree update when a git commit succeeds
#
# Hook input is passed via stdin as JSON with structure:
# { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }

$repoPath = "D:\OneDrive\Desktop\Production-Versions\treeplexity"
$lockFile = "$repoPath\.claude\hooks\.self-tree-update.lock"

# Read hook input from stdin
$hookInput = ""
try {
    if ([Console]::IsInputRedirected) {
        $hookInput = [Console]::In.ReadToEnd()
    }
} catch {
    # No stdin available, fall back to recent commit check
}

# Parse the input to check if this was a git commit
$isGitCommit = $false

if ($hookInput) {
    try {
        $json = $hookInput | ConvertFrom-Json
        $command = $json.tool_input.command
        if ($command -match "git commit") {
            $isGitCommit = $true
        }
    } catch {
        # JSON parse failed, check if raw input contains git commit
        if ($hookInput -match "git commit") {
            $isGitCommit = $true
        }
    }
}

# If we couldn't determine from input, check recent commits
if (-not $isGitCommit -and -not $hookInput) {
    Set-Location $repoPath
    $lastCommitTime = git log -1 --format="%ci" 2>$null
    if ($lastCommitTime) {
        $commitDateTime = [DateTime]::Parse($lastCommitTime)
        $timeDiff = ((Get-Date) - $commitDateTime).TotalSeconds
        if ($timeDiff -lt 10) {
            $isGitCommit = $true
        }
    }
}

# Exit if not a git commit
if (-not $isGitCommit) {
    exit 0
}

# Prevent double-triggering with a simple lockfile
if (Test-Path $lockFile) {
    $lockAge = ((Get-Date) - (Get-Item $lockFile).LastWriteTime).TotalSeconds
    if ($lockAge -lt 30) {
        # Recent update, skip
        exit 0
    }
}

# Create/update lockfile
New-Item -Path $lockFile -ItemType File -Force | Out-Null

Write-Host ""
Write-Host "========================================"
Write-Host "  Self-Tree Auto-Update Hook"
Write-Host "========================================"
Write-Host ""

Set-Location $repoPath

# Run measurement script
Write-Host "[1/2] Measuring codebase..."
try {
    $measureOutput = & node "$repoPath\scripts\measure-self-tree.js" 2>&1
    $measureText = $measureOutput -join "`n"

    # Extract key metrics from joined output
    if ($measureText -match "Size:\s+([\d.]+)\s*MB") {
        Write-Host "   Size: $($Matches[1]) MB"
    }
    if ($measureText -match "Lines:\s+([\d,]+)") {
        Write-Host "   Lines: $($Matches[1])"
    }
    if ($measureText -match "Build\s+(\d+)") {
        Write-Host "   Build: $($Matches[1])"
    }
} catch {
    Write-Host "   Warning: Measurement failed - $_"
}

# Run generation script
Write-Host ""
Write-Host "[2/2] Generating self-tree..."
try {
    $generateOutput = & node "$repoPath\scripts\generate-self-tree.js" 2>&1
    $generateText = $generateOutput -join "`n"

    if ($generateText -match "Output:\s+(.+\.json)") {
        $outputFile = $Matches[1]
        $fileName = Split-Path $outputFile -Leaf
        Write-Host "   Created: $fileName"
    }
    if ($generateText -match "Nodes:\s+(\d+)") {
        Write-Host "   Nodes: $($Matches[1])"
    }
} catch {
    Write-Host "   Warning: Generation failed - $_"
}

Write-Host ""
Write-Host "Self-tree updated for next /bootstrap"
Write-Host "========================================"
Write-Host ""
