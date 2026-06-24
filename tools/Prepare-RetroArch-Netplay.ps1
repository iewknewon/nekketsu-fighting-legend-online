param(
    [ValidateSet("CheckOnly", "Host", "Client")]
    [string]$Role = "CheckOnly",

    [string]$RomPath = (Join-Path $PSScriptRoot "..\\nekketsu-fighting-legend-cn.nes"),

    [string]$RetroArchPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RomInfo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "ROM file not found: $Path"
    }

    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Path))
    if ($bytes.Length -lt 16) {
        throw "ROM file is too small to contain a valid iNES header."
    }

    if ($bytes[0] -ne 0x4E -or $bytes[1] -ne 0x45 -or $bytes[2] -ne 0x53 -or $bytes[3] -ne 0x1A) {
        throw "This file does not look like a valid iNES ROM."
    }

    $prgPages = [int]$bytes[4]
    $chrPages = [int]$bytes[5]
    $flags6 = [int]$bytes[6]
    $flags7 = [int]$bytes[7]
    $mapper = (($flags6 -shr 4) -bor (($flags7 -shr 4) -shl 4))

    $mirroring = if (($flags6 -band 0x08) -ne 0) {
        "Four-screen"
    }
    elseif (($flags6 -band 0x01) -ne 0) {
        "Vertical"
    }
    else {
        "Horizontal"
    }

    $hasBattery = (($flags6 -band 0x02) -ne 0)
    $hasTrainer = (($flags6 -band 0x04) -ne 0)
    $sha256 = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash

    [pscustomobject]@{
        Path       = (Resolve-Path -LiteralPath $Path).Path
        SizeBytes  = $bytes.Length
        PrgPages   = $prgPages
        ChrPages   = $chrPages
        Mapper     = $mapper
        Mirroring  = $mirroring
        Battery    = $hasBattery
        Trainer    = $hasTrainer
        Sha256     = $sha256
    }
}

function Find-RetroArch {
    param(
        [string]$PreferredPath
    )

    $candidates = @()

    if ($PreferredPath) {
        $candidates += $PreferredPath
    }

    $candidates += @(
        "C:\\RetroArch-Win64\\RetroArch.exe",
        "C:\\Program Files\\RetroArch\\RetroArch.exe",
        "C:\\Program Files (x86)\\RetroArch\\RetroArch.exe",
        (Join-Path $HOME "AppData\\Roaming\\RetroArch\\RetroArch.exe"),
        (Join-Path (Get-Location) "RetroArch.exe")
    )

    foreach ($candidate in $candidates | Select-Object -Unique) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    return $null
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor DarkGray
}

function Write-StepList {
    param(
        [string[]]$Items
    )

    for ($i = 0; $i -lt $Items.Count; $i++) {
        Write-Host ("{0}. {1}" -f ($i + 1), $Items[$i])
    }
}

$rom = Get-RomInfo -Path $RomPath
$retroArch = Find-RetroArch -PreferredPath $RetroArchPath

Write-Section "ROM check"
Write-Host "ROM path  : $($rom.Path)"
Write-Host "ROM size  : $($rom.SizeBytes) bytes"
Write-Host "PRG / CHR : $($rom.PrgPages) / $($rom.ChrPages)"
Write-Host "Mapper    : $($rom.Mapper)"
Write-Host "Mirroring : $($rom.Mirroring)"
Write-Host "Battery   : $($rom.Battery)"
Write-Host "Trainer   : $($rom.Trainer)"
Write-Host "SHA256    : $($rom.Sha256)"

Write-Section "Recommendation"
if ($rom.Mapper -eq 74) {
    Write-Host "This ROM uses mapper 74." -ForegroundColor Yellow
    Write-Host "That is the main reason the browser prototype in this repo is not a good production path." -ForegroundColor Yellow
}
else {
    Write-Host "This ROM is not mapper 74, but a mature desktop emulator is still the safer netplay path." -ForegroundColor Yellow
}

Write-Host "Recommended stack: RetroArch + FCEUmm core + Netplay" -ForegroundColor Green

Write-Section "RetroArch detection"
if ($retroArch) {
    Write-Host "RetroArch.exe found" -ForegroundColor Green
    Write-Host $retroArch
}
else {
    Write-Host "RetroArch.exe was not found." -ForegroundColor Yellow
    Write-Host "Install RetroArch first, then run this script again."
}

Write-Section "Everyone must match"
Write-StepList -Items @(
    "Same RetroArch version",
    "Same FCEUmm core version",
    "Same ROM file",
    "Verify the SHA256 above at least once"
)

Write-Section "Default 4-player layout"
Write-Host "Most reliable layout: 4 computers, 1 player on each machine." -ForegroundColor Green
Write-StepList -Items @(
    "Host starts hosting",
    "The other 3 players join one by one",
    "If nobody manually changes Request Device, RetroArch usually assigns controllers 1 to 4 in join order",
    "If the game does not detect 4-player input automatically, set User 5 Device Type to 4-Player Adaptor in FCEUmm"
)

Write-Section "2 computers / 4 players"
Write-Host "If you have 2 computers and 2 local players on each side, use this mapping:" -ForegroundColor Green
Write-StepList -Items @(
    "Host: Request Device 1 = YES",
    "Host: Request Device 3 = YES",
    "Client: Request Device 2 = YES",
    "Client: Request Device 4 = YES",
    "Enable Settings > User Interface > Show Advanced Settings first",
    "Then configure Request Device under Settings > Network"
)

switch ($Role) {
    "Host" {
        Write-Section "Host steps"
        Write-StepList -Items @(
            "Load the FCEUmm core and this ROM",
            "Set your nickname in Settings > User > Username",
            "Open the Netplay menu and choose Start Hosting",
            "If you use direct connection, make sure TCP 55435 is reachable",
            "If port forwarding is inconvenient, enable Use Relay Server",
            "If this is a private friend room, use a password or disable Publicly Announce Netplay"
        )
    }

    "Client" {
        Write-Section "Client steps"
        Write-StepList -Items @(
            "Use the exact same RetroArch version, FCEUmm core, and ROM as the host",
            "Open the Netplay menu and refresh the room list",
            "Enter the password if the host configured one",
            "If the room is private, connect with the host IP or direct room info"
        )
    }
}

Write-Section "Repo note"
Write-Host "See README-NETPLAY.md for the Chinese walkthrough."
Write-Host "If your goal is to play as soon as possible, follow README-NETPLAY.md first instead of the old online.html prototype."
