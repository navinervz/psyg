# ============================================================================
#  Build a clean deployment package for the server.
#
#  Usage (PowerShell):
#      cd C:\Users\NAVIX\OneDrive\Desktop\psyg
#      powershell -ExecutionPolicy Bypass -File scripts\package-for-server.ps1
#
#  Why this exists:
#  "scp -r" on the project folder also copies node_modules (281 packages,
#  tens of thousands of files). That takes hours and can freeze the machine.
#  It is also pointless: Windows-built native packages do not run on Linux,
#  and the server installs its own during "docker compose build".
#
#  The real project is about 134 files, under 1 MB.
#
#  NOTE: this file is intentionally ASCII-only. Windows PowerShell 5.1 reads
#  .ps1 files as ANSI unless they have a BOM, so non-ASCII characters get
#  mangled into bytes that break the parser.
# ============================================================================

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$staging     = Join-Path $env:TEMP "psyg-package"
$output      = Join-Path ([Environment]::GetFolderPath("Desktop")) "psyg-deploy.zip"

Write-Host ""
Write-Host "Project: $projectRoot" -ForegroundColor Cyan

# --- clean previous run ---
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
if (Test-Path $output)  { Remove-Item $output -Force }

# --- copy, skipping heavy and secret files ---
Write-Host "Collecting files..." -ForegroundColor Cyan

# Built as an array instead of using backtick line-continuation, which is
# fragile if the file ever gets trailing whitespace.
$roboArgs = @(
    $projectRoot
    $staging
    "/E"
    "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS"
    "/XD", "node_modules", ".next", ".git", ".turbo", "out", "build"
    "/XF", "*.log", ".env", ".env.local", "tsconfig.tsbuildinfo"
)

& robocopy @roboArgs | Out-Null

# robocopy uses exit codes 0-7 for success variants; 8+ means real failure
if ($LASTEXITCODE -ge 8) {
    Write-Host "robocopy failed with code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# --- safety net: never ship a real .env ---
$leaked = Get-ChildItem $staging -Recurse -Force -File |
          Where-Object { $_.Name -eq ".env" }

if ($leaked) {
    Write-Host "Found a .env file in the package. Aborting." -ForegroundColor Red
    Write-Host "That file holds your tokens and must not leave this machine." -ForegroundColor Red
    Remove-Item $staging -Recurse -Force
    exit 1
}

# --- compress ---
#
# Compress-Archive is NOT used here, on purpose.
#
# Windows PowerShell 5.1 writes zip entries with backslash separators. Linux
# unzip does not treat "\" as a path separator, so instead of a directory
# tree it creates files literally named "src\app\page.tsx". The deploy then
# silently does nothing useful. unzip only prints a warning about it.
#
# tar.exe (bsdtar) ships with Windows 10/11 and writes POSIX paths.
Write-Host "Compressing..." -ForegroundColor Cyan

$tar = Join-Path $env:SystemRoot "System32\tar.exe"
if (-not (Test-Path $tar)) {
    Write-Host "tar.exe not found. Needs Windows 10 1803 or newer." -ForegroundColor Red
    Remove-Item $staging -Recurse -Force
    exit 1
}

# -a picks the format from the extension, -C runs relative to the staging dir
# so the archive has no absolute paths inside it.
& $tar -a -c -f $output -C $staging "."

if ($LASTEXITCODE -ne 0) {
    Write-Host "tar failed with code $LASTEXITCODE" -ForegroundColor Red
    Remove-Item $staging -Recurse -Force
    exit 1
}

$fileCount = (Get-ChildItem $staging -Recurse -File).Count
$sizeMb    = [math]::Round((Get-Item $output).Length / 1MB, 2)

Remove-Item $staging -Recurse -Force

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "  File:  $output"
Write-Host "  Files: $fileCount"
Write-Host "  Size:  $sizeMb MB"
Write-Host ""
Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "  scp -P 9011 `"$output`" root@2.58.172.224:/opt/"
Write-Host ""
Write-Host "On the server, unzip must NOT warn about backslashes." -ForegroundColor Yellow
Write-Host "If it does, the archive is broken - do not deploy it."
Write-Host ""
