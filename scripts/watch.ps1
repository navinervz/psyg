# Reconnect to a build that is already running on the server.
#
# Usage:
#   .\scripts\watch.ps1
#
# ---------------------------------------------------------------------
# What this is for
# ---------------------------------------------------------------------
# deploy.ps1 launches the build detached, so the build outlives the
# connection that started it. If the link drops mid-build -- which it
# does on this connection -- nothing is lost, but you also stop seeing
# output. This reattaches to the log.
#
# Safe to run as often as you like: it only reads. It never starts a
# build, and running it twice does nothing worse than showing the log
# twice.
#
# If the build has already finished, this prints the tail of the log and
# the final status instead of waiting.
#
# ASCII-only output, and no uppercase in the filename, for the same two
# reasons documented at the top of deploy.ps1.

$ErrorActionPreference = "Stop"

$server = "root@2.58.172.224"
$port = 9011

$sshOpts = @(
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=8",
    "-p", $port
)

Write-Host ""
Write-Host "Reconnecting to the build (server password required)" -ForegroundColor Cyan
Write-Host ""

# Single-quoted: these variables are bash's, not PowerShell's.
#
# The two cases are handled separately because `tail -f` on a build that
# already finished would hang forever waiting for output that will never
# come -- looking exactly like a stuck build.
$watch = @'
if [ -f /opt/psyg-deploy.status ]; then
  tail -n 30 /opt/psyg-deploy.log
  s=$(cat /opt/psyg-deploy.status)
  echo ""
  echo "=== already finished: $s ==="
  [ "$s" = DONE ]
else
  tail -n +1 -f /opt/psyg-deploy.log & TP=$!
  while [ ! -f /opt/psyg-deploy.status ]; do sleep 2; done
  sleep 1
  kill $TP 2>/dev/null
  s=$(cat /opt/psyg-deploy.status)
  echo ""
  echo "=== $s ==="
  [ "$s" = DONE ]
fi
'@

# Same base64 trick as deploy.ps1: PowerShell rewrites LF to CRLF when
# piping into a native process, and bash chokes on the stray \r.
$bytes = [System.Text.Encoding]::UTF8.GetBytes($watch)
$encoded = [Convert]::ToBase64String($bytes)

ssh @sshOpts $server "echo $encoded | base64 -d | bash"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Not finished yet, or the build failed." -ForegroundColor Yellow
    Write-Host "Run this again to keep watching." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Deployed." -ForegroundColor Green
Write-Host "  https://psygstore.shop"
Write-Host ""
