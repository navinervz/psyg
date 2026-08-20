# One-command deploy: verify, package, upload, rebuild.
#
# Usage:
#   .\scripts\deploy.ps1
#   .\scripts\deploy.ps1 -SkipTests    (only when you know why)
#
# ---------------------------------------------------------------------
# Why tests run first
# ---------------------------------------------------------------------
# The first version skipped straight to packaging. A lint error in
# global-error.tsx then sailed past every local check and only surfaced
# ten minutes later, mid-build, on the server -- where fixing it costs a
# full re-upload instead of five seconds.
#
# `next build` runs ESLint; `tsc` alone does not. So a passing typecheck
# proves less than it looks like it does. The full suite is the only
# thing that checks what the server build will reject.
#
# ---------------------------------------------------------------------
# Why every message here is English
# ---------------------------------------------------------------------
# Windows PowerShell 5.1 reads .ps1 files as Windows-1252 unless they
# carry a UTF-8 BOM. Persian text arrives as mojibake and the parser
# dies on "unterminated string" -- which already happened once with
# upload.ps1. ASCII-only output sidesteps the whole question.
#
# ---------------------------------------------------------------------
# Why the filename has no uppercase
# ---------------------------------------------------------------------
# This terminal has been dropping uppercase letters on paste, which
# silently mangles commands (scp -P became scp -). Running this file
# needs no uppercase at all.

param([switch]$SkipTests)

$ErrorActionPreference = "Stop"

$server = "root@2.58.172.224"
$port = 9011
$zip = Join-Path ([Environment]::GetFolderPath("Desktop")) "psyg-deploy.zip"
$root = Split-Path -Parent $PSScriptRoot

# Keep the connection alive through silent stretches.
#
# This link drops whenever it goes quiet for a while -- it happened four
# times in one session, twice while merely sitting at an idle prompt.
# Something between here and the server (NAT table, firewall, ISP) times
# out connections with no traffic on them.
#
# `next build` has a ~30s silent window at "Collecting build traces",
# which is long enough to land in that window. A deploy died there.
#
# ServerAliveInterval sends a keepalive every 15s so the connection is
# never actually idle. CountMax=8 means we tolerate two minutes of real
# packet loss before giving up, rather than dropping at the first blip.
$sshOpts = @(
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=8",
    "-p", $port
)

function Step($n, $text) {
    Write-Host ""
    Write-Host "[$n] $text" -ForegroundColor Cyan
}

# --- 0. verify --------------------------------------------------------

if ($SkipTests) {
    Write-Host ""
    Write-Host "Skipping tests at your request." -ForegroundColor Yellow
} else {
    Step 0 "Running tests (same checks the server build will run)"

    Push-Location $root
    try {
        & npm.cmd run test:all
        $testsFailed = $LASTEXITCODE -ne 0
    } finally {
        Pop-Location
    }

    if ($testsFailed) {
        Write-Host ""
        Write-Host "Tests failed. Nothing was uploaded." -ForegroundColor Red
        Write-Host "Fix the failure above, then run this again." -ForegroundColor Yellow
        exit 1
    }
}

# --- 1. package -------------------------------------------------------

Step 1 "Packaging"

& (Join-Path $PSScriptRoot "package-for-server.ps1")

if (-not (Test-Path $zip)) {
    Write-Host "Packaging produced no file. Stopping." -ForegroundColor Red
    exit 1
}

# --- 2. upload --------------------------------------------------------

Step 2 "Uploading (server password required)"

# scp spells the port flag -P, ssh spells it -p. Same keepalives though.
scp -o ServerAliveInterval=15 -o ServerAliveCountMax=8 -P $port $zip "${server}:/opt/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed. Nothing was changed on the server." -ForegroundColor Red
    exit 1
}

# --- 3. remote unpack, prune, rebuild ---------------------------------
#
# The prune step matters and is easy to miss.
#
# `unzip -o` overwrites files but never removes ones that disappeared
# from the project. Twice already a deleted component kept living on the
# server -- PromptInput.tsx and the level-badge components -- and had to
# be removed by hand after the fact.
#
# So: the archive listing is the source of truth. Any file under src/ or
# tests/ that is not in the archive gets removed. Scope is deliberately
# limited to those two directories; node_modules, .env, and the data
# volume are never touched.

$remote = @'
set -e

# Leave a breadcrumb the watcher can poll.
#
# The default is FAILED, replaced with DONE only if we reach the very
# end. That way an interrupted run never looks successful -- the failure
# mode we want is "reports red when green", not the reverse.
trap 'echo FAILED > /opt/psyg-deploy.status' EXIT

cd /opt
unzip -o -q psyg-deploy.zip -d psyg
cd /opt/psyg

echo "--- pruning files deleted from the project ---"

# Paths inside the archive need normalising before they can be compared
# with `find` output. tar.exe writes them with a leading "./", and the
# first version of this script did not strip it -- so the grep matched
# nothing, the archive list came back empty, and comm concluded that
# every file on the server was stale. It deleted all 151 source files.
unzip -Z1 /opt/psyg-deploy.zip \
  | sed 's|^\./||' \
  | grep -E '^(src|tests)/' \
  | sort > /tmp/in-archive.txt

# Refuse to prune against an empty or implausibly short list. An archive
# that really contains this project has well over a hundred source
# files; anything less means the listing failed, not that the project
# shrank. Deleting on a failed read is how the accident happened.
archive_count=$(wc -l < /tmp/in-archive.txt)
if [ "$archive_count" -lt 100 ]; then
  echo "archive listing looks wrong ($archive_count files) - skipping prune"
else
  find src tests -type f | sed 's|^\./||' | sort > /tmp/on-server.txt
  comm -13 /tmp/in-archive.txt /tmp/on-server.txt > /tmp/stale.txt

  stale_count=$(wc -l < /tmp/stale.txt)

  # A handful of removed files is normal. Dozens means the comparison
  # is broken again, and the safe move is to touch nothing.
  if [ "$stale_count" -eq 0 ]; then
    echo "none"
  elif [ "$stale_count" -gt 20 ]; then
    echo "$stale_count files looked stale - too many to be real, skipping prune"
    head -5 /tmp/stale.txt
  else
    cat /tmp/stale.txt
    xargs -r rm -f < /tmp/stale.txt
    echo "removed $stale_count stale file(s)"
  fi
fi

# If the source tree is not intact, building would ship a broken site.
# Better to stop with a clear message than to deploy something empty.
for required in src/app/page.tsx src/lib/data.ts package.json; do
  if [ ! -f "$required" ]; then
    echo "MISSING: $required - refusing to build"
    exit 1
  fi
done

echo "--- rebuilding ---"
docker compose up -d --build
docker image prune -f

trap - EXIT
echo DONE > /opt/psyg-deploy.status
'@

# Send the script base64-encoded instead of piping it.
#
# ---------------------------------------------------------------------
# Two failed attempts got us here
# ---------------------------------------------------------------------
# Attempt 1 replaced "`r`n" with "`n". Attempt 2 stripped every "`r".
# Both looked correct and both failed the same way: docker received
# `prune -f\r` and answered "unknown shorthand flag: '\r' in -".
#
# The reason neither worked is that the carriage returns were not in the
# string at all -- the file is LF-only. PowerShell adds them itself when
# piping a string into a native process on Windows. So cleaning the
# string before the pipe cleans nothing; the pipe re-dirties it.
#
# Base64 sidesteps the whole class of problem. The payload travels as a
# single command argument with no characters that any layer wants to
# translate, and bash decodes it back to exact bytes on the far side.
#
# Symptom worth remembering: the deploy had actually succeeded both
# times. Only the final cleanup line failed, so the script reported red
# for a green outcome -- the most misleading kind of failure.
$bytes = [System.Text.Encoding]::UTF8.GetBytes($remote)
$encoded = [Convert]::ToBase64String($bytes)

# ---------------------------------------------------------------------
# Detach the build from the connection that started it
# ---------------------------------------------------------------------
# Keepalives make drops rarer; they cannot make them impossible. And a
# plain `ssh "... docker compose build ..."` ties a five-minute build to
# a connection that has been dying every couple of minutes -- one blip
# and the build is killed partway through.
#
# So the build is launched with setsid + nohup: it gets its own session
# and no controlling terminal, so losing the SSH connection cannot send
# it SIGHUP. Output goes to a log on the server, and a second connection
# follows that log.
#
# The practical difference: if the link drops now, the build finishes
# anyway. Reconnecting shows the log from where it stands rather than
# starting a fresh five-minute build from zero.

Step 3 "Starting the remote build"

$launch = "rm -f /opt/psyg-deploy.status; echo $encoded | base64 -d > /tmp/psyg-deploy.sh; setsid nohup bash /tmp/psyg-deploy.sh > /opt/psyg-deploy.log 2>&1 < /dev/null & sleep 1; echo launched"

ssh @sshOpts $server $launch

if ($LASTEXITCODE -ne 0) {
    Write-Host "Could not start the remote build." -ForegroundColor Red
    exit 1
}

# --- 4. follow the log ------------------------------------------------

Step 4 "Building (this takes a few minutes)"

# Single-quoted on purpose: $!, $TP and $s belong to bash, and a
# double-quoted PowerShell string would expand them away to nothing.
#
# And base64-encoded for a second, separate reason.
#
# ---------------------------------------------------------------------
# Why this cannot be passed to ssh as plain text
# ---------------------------------------------------------------------
# This command contains double quotes. When PowerShell hands an argument
# containing spaces to a native program, it wraps the whole thing in
# double quotes -- without escaping the ones already inside. bash then
# sees a quote that never closes:
#
#   bash: -c: line 1: unexpected EOF while looking for matching `"'
#
# $launch above survives only because it happens to contain no double
# quotes at all. That is luck, not design, and it made the bug look like
# it lived here rather than in how arguments are passed.
#
# Base64 output is alphanumeric plus +/=, so there is nothing left for
# any layer to misread. Same reasoning as the payload above.
$watch = 'tail -n +1 -f /opt/psyg-deploy.log & TP=$!; while [ ! -f /opt/psyg-deploy.status ]; do sleep 2; done; sleep 1; kill $TP 2>/dev/null; s=$(cat /opt/psyg-deploy.status); echo ""; echo "=== $s ==="; [ "$s" = DONE ]'

$watchBytes = [System.Text.Encoding]::UTF8.GetBytes($watch)
$watchEncoded = [Convert]::ToBase64String($watchBytes)

ssh @sshOpts $server "echo $watchEncoded | base64 -d | bash"
$watchExit = $LASTEXITCODE

if ($watchExit -ne 0) {
    Write-Host ""
    Write-Host "Lost the connection, or the build failed." -ForegroundColor Yellow
    Write-Host "The build itself keeps running on the server either way." -ForegroundColor Yellow
    Write-Host "To reconnect and see where it stands:" -ForegroundColor Yellow
    Write-Host "  .\scripts\watch.ps1"
    exit 1
}

Write-Host ""
Write-Host "Deployed." -ForegroundColor Green
Write-Host "  https://psygstore.shop"
Write-Host ""
