# Set up SSH key login so deploys stop asking for the root password.
#
# Usage (run once):
#   .\scripts\setup-ssh-key.ps1
#
# ---------------------------------------------------------------------
# What this does and why
# ---------------------------------------------------------------------
# Every deploy currently types the root password three times, over the
# wire, into a terminal whose scrollback gets pasted into chat. That has
# already leaked the root password twice and two API tokens.
#
# A key pair closes the whole category: the private half never leaves
# this machine, and nothing secret is typed or transmitted again.
#
# The connection to this server also drops often, and each drop means
# another password prompt. Key login makes retries free.
#
# ---------------------------------------------------------------------
# Why everything travels base64-encoded
# ---------------------------------------------------------------------
# The first version of this script did:
#
#   $pub | ssh -p $port $server "bash -c '$remote'"
#
# Two separate bugs in one line, both of which have since bitten
# deploy.ps1 for real:
#
#   1. $remote contains double quotes. PowerShell wraps an argument
#      containing spaces in double quotes without escaping the ones
#      already inside, so bash received a quote that never closed.
#
#   2. PowerShell rewrites LF to CRLF when piping into a native process
#      on Windows, so every remote line arrived with a trailing \r.
#
# Base64 output is alphanumeric plus +/=, which no layer wants to
# translate, quote, or reinterpret. The public key goes the same way --
# it is mixed-case base64 and this terminal has been dropping uppercase
# letters on paste, which would corrupt it silently.
#
# ASCII-only output and a lowercase filename, for the reasons documented
# at the top of deploy.ps1.

$ErrorActionPreference = "Stop"

$server = "root@2.58.172.224"
$port = 9011
$keyDir = Join-Path $env:USERPROFILE ".ssh"
$keyPath = Join-Path $keyDir "id_ed25519"
$pubPath = "$keyPath.pub"

$sshOpts = @(
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=8",
    "-p", $port
)

Write-Host ""
Write-Host "SSH key setup for $server" -ForegroundColor Cyan
Write-Host ""

# --- 1. make sure a key exists ---------------------------------------

if (Test-Path $pubPath) {
    Write-Host "Existing key found: $pubPath"
} else {
    Write-Host "No key found. Creating one." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "About the passphrase prompt you are about to see:"
    Write-Host "  - Leave it empty  -> deploys never ask for anything again."
    Write-Host "                       Anyone with access to this Windows"
    Write-Host "                       account can then reach the server."
    Write-Host "  - Set one         -> you type it instead of the root"
    Write-Host "                       password. Safer, slightly slower."
    Write-Host ""
    Write-Host "Either is a real improvement over the current setup."
    Write-Host ""

    if (-not (Test-Path $keyDir)) {
        New-Item -ItemType Directory -Path $keyDir | Out-Null
    }

    # ed25519 rather than RSA: shorter, faster, and the current default
    # recommendation. -C is just a label shown in authorized_keys.
    ssh-keygen -t ed25519 -f $keyPath -C "psyg-deploy"

    if (-not (Test-Path $pubPath)) {
        Write-Host "Key generation failed." -ForegroundColor Red
        exit 1
    }
}

# --- 2. install it on the server -------------------------------------

Write-Host ""
Write-Host "Installing the public key on the server." -ForegroundColor Cyan
Write-Host "This asks for the root password one last time." -ForegroundColor Yellow
Write-Host ""

$pub = (Get-Content $pubPath -Raw).Trim()

if (-not $pub.StartsWith("ssh-")) {
    Write-Host "That does not look like a public key file." -ForegroundColor Red
    Write-Host "  $pubPath"
    exit 1
}

# The key is carried base64-encoded inside the script rather than pasted
# in as text, so no quoting, casing or line-ending layer can touch it.
$pubBytes = [System.Text.Encoding]::UTF8.GetBytes($pub)
$pubEncoded = [Convert]::ToBase64String($pubBytes)

# Running this twice must be harmless, not pile up identical lines in
# authorized_keys.
$remote = @"
set -e
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

key=`$(echo $pubEncoded | base64 -d)

if grep -qxF "`$key" ~/.ssh/authorized_keys; then
  echo "key already installed"
else
  echo "`$key" >> ~/.ssh/authorized_keys
  echo "key installed"
fi

echo "authorized_keys now has `$(wc -l < ~/.ssh/authorized_keys) line(s)"
"@

$bytes = [System.Text.Encoding]::UTF8.GetBytes($remote)
$encoded = [Convert]::ToBase64String($bytes)

ssh @sshOpts $server "echo $encoded | base64 -d | bash"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Could not install the key. Nothing was changed." -ForegroundColor Red
    Write-Host "Password login still works, so you are not locked out." -ForegroundColor Yellow
    exit 1
}

# --- 3. verify --------------------------------------------------------
#
# Installing the key and being able to log in with it are different
# claims. Everything today that looked configured but did not work --
# the nightly backup, the newsletter, the verification tag -- looked
# fine right up until someone checked the actual output.
#
# PasswordAuthentication=no and BatchMode=yes together mean this cannot
# quietly fall back to a password prompt and report success.

Write-Host ""
Write-Host "Testing key login (must not ask for a password)..." -ForegroundColor Cyan
Write-Host ""

ssh @sshOpts -o PasswordAuthentication=no -o BatchMode=yes $server "echo 'key login works'"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Key login did not work." -ForegroundColor Yellow
    Write-Host "Password login still works, so nothing is broken." -ForegroundColor Yellow
    Write-Host "Send the output above and we will look at it." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Done. Deploys will no longer ask for the root password." -ForegroundColor Green
Write-Host ""
Write-Host "Next, but not today:" -ForegroundColor Yellow
Write-Host "  Turning password login off on the server ends password"
Write-Host "  guessing for good. Do it only after key login has worked"
Write-Host "  for a few days. If the key is ever lost and passwords are"
Write-Host "  already off, you are locked out of your own server."
Write-Host ""
