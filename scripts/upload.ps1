# Upload the deploy package to the server.
#
# ---------------------------------------------------------------------
# Why this script exists
# ---------------------------------------------------------------------
# scp needs an uppercase -P for the port (lowercase -p means something
# else entirely and does not set the port). When the terminal drops
# uppercase letters on paste -- stuck Shift, a non-Latin keyboard
# layout, or a terminal bug -- the command breaks silently:
#
#     scp -P 9011 "C:\Users\..."   ->   scp - 9011 ":\sers\..."
#
# And the error you get back ('stat local "-"') says nothing about the
# real cause, so you end up hunting the wrong problem.
#
# Running this file needs no uppercase letters at all.
#
# ---------------------------------------------------------------------
# Why every message here is English
# ---------------------------------------------------------------------
# Windows PowerShell 5.1 reads .ps1 files as Windows-1252 unless they
# carry a UTF-8 BOM. Persian text then arrives as mojibake and the
# parser dies on unterminated strings -- which is exactly what happened
# to the first version of this file.
#
# Keeping output ASCII-only sidesteps the whole encoding question.
# package-for-server.ps1 does the same, which is why it always worked.

$ErrorActionPreference = "Stop"

$server = "root@2.58.172.224"
$port = 9011
$zip = Join-Path ([Environment]::GetFolderPath("Desktop")) "psyg-deploy.zip"

if (-not (Test-Path $zip)) {
    Write-Host "Package not found: $zip" -ForegroundColor Red
    Write-Host "Run .\scripts\package-for-server.ps1 first." -ForegroundColor Yellow
    exit 1
}

$item = Get-Item $zip
$sizeMb = [math]::Round($item.Length / 1MB, 2)
$age = [math]::Round(((Get-Date) - $item.LastWriteTime).TotalMinutes, 1)

Write-Host ""
Write-Host "File:  $zip"
Write-Host "Size:  $sizeMb MB"
Write-Host "Built: $age minutes ago"

# A stale package almost always means you forgot to re-package after
# changing code -- so you deploy the old build, see no change, and lose
# an hour looking for a bug that is not there.
if ($age -gt 30) {
    Write-Host ""
    Write-Host "WARNING: this package is over 30 minutes old." -ForegroundColor Yellow
    Write-Host "If you changed code since, re-package before uploading." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Uploading..." -ForegroundColor Cyan

scp -P $port $zip "${server}:/opt/"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Upload failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Uploaded." -ForegroundColor Green
Write-Host ""
Write-Host "Next step - log into the server:" -ForegroundColor Yellow
Write-Host "  ssh -p 9011 root@2.58.172.224"
Write-Host ""
