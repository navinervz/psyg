# Set up SSH key login so deploys stop asking for the root password.
#
# Usage (run once):
#   .\scripts\setup-ssh-key.ps1
#
# ---------------------------------------------------------------------
# What this does and why
# ---------------------------------------------------------------------
# Right now every deploy types the root password twice, over the wire,
# into a terminal whose scrollback ends up pasted into chat. That has
# already leaked the root password once and two API tokens.
#
# A key pair fixes the whole category: the private half never leaves
# this machine, and nothing secret is ever typed or transmitted again.
#
# ---------------------------------------------------------------------
# Why the public key is piped instead of pasted
# ---------------------------------------------------------------------
# This terminal drops uppercase letters on paste. An ed25519 public key
# is mixed-case base64, so pasting it by hand would silently corrupt it
# and key login would fail for reasons impossible to guess from the
# error message.
#
# Piping it straight through ssh never puts the key on the clipboard.

$ErrorActionPreference = "Stop"

$server = "root@2.58.172.224"
$port = 9011
$keyDir = Join-Path $env:USERPROFILE ".ssh"
$keyPath = Join-Path $keyDir "id_ed25519"
$pubPath = "$keyPath.pub"

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

# The remote side refuses to add a duplicate. Running this script twice
# should be harmless, not pile up identical lines in authorized_keys.
$remote = @'
set -e
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
key=$(cat)
if grep -qxF "$key" ~/.ssh/authorized_keys; then
  echo "key already installed"
else
  echo "$key" >> ~/.ssh/authorized_keys
  echo "key installed"
fi
'@

# CRLF would reach bash as literal carriage returns and break every line.
$remote = $remote -replace "`r`n", "`n"

$pub = Get-Content $pubPath -Raw

# Two stdin streams cannot both be piped, so the script goes in as an
# argument and only the key travels on stdin.
$pub | ssh -p $port $server "bash -c '$remote'"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Could not install the key." -ForegroundColor Red
    exit 1
}

# --- 3. verify --------------------------------------------------------

Write-Host ""
Write-Host "Testing key login (should not ask for a password)..." -ForegroundColor Cyan
Write-Host ""

ssh -p $port -o PasswordAuthentication=no -o BatchMode=yes $server "echo 'key login works'"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Key login did not work. Password login still works," -ForegroundColor Yellow
    Write-Host "so nothing is broken -- but the key needs looking at." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Done. Deploys will no longer ask for the root password." -ForegroundColor Green
Write-Host ""
Write-Host "Optional hardening, once you trust this:" -ForegroundColor Yellow
Write-Host "  Disabling password login entirely on the server closes off"
Write-Host "  password-guessing attacks for good. Do it only after key"
Write-Host "  login has worked for a few days -- if the key is ever lost"
Write-Host "  and passwords are off, you are locked out of your own server."
Write-Host ""
