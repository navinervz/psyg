# One-time cleanup of poisoned price-history points.
#
# Usage:
#   .\scripts\clean-history.ps1            (review only -- writes nothing)
#   .\scripts\clean-history.ps1 -Apply     (actually removes them)
#
# ---------------------------------------------------------------------
# What this cleans up
# ---------------------------------------------------------------------
# Until the toProduct fix, the "believable discount" ceiling checked
# Affilio's discount_percent field. That field sometimes disagreed with
# the price numbers in the same record, so fake discounts slipped past.
#
# Real case: a tablet whose seller listed 10,000,000 as the original
# price and 310,000 as the sale price. We recorded that 310,000 as the
# day's real price -- a lie inside the price history.
#
# The code is fixed, but recorded points stay. This removes them.
#
# ---------------------------------------------------------------------
# Why review is the default
# ---------------------------------------------------------------------
# A script that writes straight away eventually runs on data it should
# not have touched. Run it once to read the list, then again with
# -Apply if the list looks right.
#
# ---------------------------------------------------------------------
# Why base64
# ---------------------------------------------------------------------
# Same reason as deploy.ps1: PowerShell rewrites LF to CRLF when piping
# into a native process, and quotes inside a command string do not
# survive argument passing intact.

param([switch]$Apply)

$ErrorActionPreference = "Stop"

$server = "root@2.58.172.224"
$port = 9011

$sshOpts = @(
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=8",
    "-p", $port
)

$flag = if ($Apply) { " --apply" } else { "" }
$remote = "docker exec psyg-web node /app/scripts/clean-history.mjs$flag"

$bytes = [System.Text.Encoding]::UTF8.GetBytes($remote)
$encoded = [Convert]::ToBase64String($bytes)

Write-Host ""
if ($Apply) {
    Write-Host "Applying cleanup on the server" -ForegroundColor Yellow
} else {
    Write-Host "Reviewing (nothing will be written)" -ForegroundColor Cyan
}
Write-Host ""

ssh @sshOpts $server "echo $encoded | base64 -d | bash"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Failed. Nothing was changed." -ForegroundColor Red
    exit 1
}

Write-Host ""
if (-not $Apply) {
    Write-Host "To apply:  .\scripts\clean-history.ps1 -Apply" -ForegroundColor Green
}
