# Brings the newest server backup down to this computer.
#
# Usage:
#   .\scripts\pull-backup.ps1
#
# ---------------------------------------------------------------------
# Why this exists
# ---------------------------------------------------------------------
# backup.sh already runs nightly on the server and keeps 30 days of
# archives. But those archives sit on the same disk as the data they
# protect. That covers "I deleted something by mistake" and covers
# nothing about "the server is gone".
#
# The archive is around 18 KB, so there is no reason not to keep copies
# somewhere else. This script pulls the newest one into your OneDrive
# folder, which means it is also off this machine.
#
# What is inside matters more than the size:
#
#   catalog.json      price history -- cannot be rebuilt, Affilio only
#                     ever returns today's price
#   subscribers.json  real people's email addresses
#   articles.json     generated articles
#   admin.json        hidden and manually added products
#
# ---------------------------------------------------------------------
# Run it when it matters
# ---------------------------------------------------------------------
# Once a week is plenty while the catalog is small. The habit worth
# building is running it before anything risky -- a server upgrade, a
# Docker volume change, a migration.
#
# ASCII-only output and a lowercase filename, for the reasons documented
# at the top of deploy.ps1.

$ErrorActionPreference = "Stop"

$server = "root@2.58.172.224"
$port = 9011
$remoteDir = "/opt/psyg-backups"

# Kept next to the project so it rides along with OneDrive's own sync.
$localDir = Join-Path ([Environment]::GetFolderPath("Desktop")) "psyg-backups"

$sshOpts = @(
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=8",
    "-p", $port
)

if (-not (Test-Path $localDir)) {
    New-Item -ItemType Directory -Path $localDir | Out-Null
}

Write-Host ""
Write-Host "Finding the newest backup" -ForegroundColor Cyan

# Base64 for the same reason as deploy.ps1: PowerShell rewrites LF to
# CRLF when piping into a native process, and quotes inside a command
# string do not survive argument passing intact.
$find = "ls -1t $remoteDir/psyg-data-*.tar.gz 2>/dev/null | head -1"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($find)
$encoded = [Convert]::ToBase64String($bytes)

$newest = (ssh @sshOpts $server "echo $encoded | base64 -d | bash") -join ""
$newest = $newest.Trim()

if (-not $newest) {
    Write-Host ""
    Write-Host "No backup found on the server." -ForegroundColor Red
    Write-Host "Check that the nightly job is running:" -ForegroundColor Yellow
    Write-Host "  crontab -l | grep backup"
    Write-Host "  cat /var/log/psyg-backup.log"
    exit 1
}

$name = Split-Path $newest -Leaf
$target = Join-Path $localDir $name

Write-Host "  $name" -ForegroundColor Green
Write-Host ""
Write-Host "Downloading" -ForegroundColor Cyan

scp -o ServerAliveInterval=15 -o ServerAliveCountMax=8 -P $port "${server}:${newest}" $target

if ($LASTEXITCODE -ne 0) {
    Write-Host "Download failed. Nothing was changed." -ForegroundColor Red
    exit 1
}

# An archive that arrived truncated is worse than no archive, because
# you will believe you have a copy. Same reasoning as the size check
# inside backup.sh.
$size = (Get-Item $target).Length

if ($size -lt 1000) {
    Write-Host ""
    Write-Host "Downloaded file is only $size bytes - that is not a real backup." -ForegroundColor Red
    Remove-Item $target
    exit 1
}

Write-Host ""
Write-Host "Saved $([math]::Round($size / 1KB, 1)) KB to:" -ForegroundColor Green
Write-Host "  $target"

$all = Get-ChildItem $localDir -Filter "psyg-data-*.tar.gz"
Write-Host ""
Write-Host "Local copies: $($all.Count)"
Write-Host ""
