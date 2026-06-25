$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$port = if ($env:PORT) { [int]$env:PORT } else { 3001 }
$tmpDir = Join-Path $root ".tmp"
$pidFile = Join-Path $root ".tmp\server-$port.pid"

function Resolve-NodePath {
    $command = Get-Command node -ErrorAction SilentlyContinue
    if ($command -and $command.Source) {
        return $command.Source
    }

    $candidates = @(
        "D:\nodejs\node.exe",
        "C:\Program Files\nodejs\node.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    throw "Node.js not found. Please install Node.js or add node.exe to PATH."
}

function Get-ListenerPids {
    param([int]$TargetPort)

    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -eq $TargetPort } |
        Sort-Object OwningProcess -Unique

    return @($connections | Select-Object -ExpandProperty OwningProcess)
}

function Stop-ExistingProjectServer {
    param([int]$TargetPort)

    foreach ($procId in (Get-ListenerPids -TargetPort $TargetPort)) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            $commandLine = ""
            try {
                $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction Stop).CommandLine
            } catch {
                $commandLine = ""
            }

            if ($proc.ProcessName -eq "node" -and $commandLine -like "*online-server/server.js*") {
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Output "Stopped old project server on port $TargetPort (PID $procId)"
            }
        } catch {
            Write-Output "Skip PID ${procId}: $($_.Exception.Message)"
        }
    }
}

if (-not (Test-Path -LiteralPath $tmpDir)) {
    New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
}

if (-not (Test-Path -LiteralPath (Join-Path $root "online-server\server.js"))) {
    throw "Missing server entry: online-server/server.js"
}

if (-not (Test-Path -LiteralPath (Join-Path $root "nekketsu-fighting-legend-cn.nes"))) {
    throw "Missing ROM: nekketsu-fighting-legend-cn.nes"
}

$node = Resolve-NodePath
$logStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outLog = Join-Path $tmpDir "server-$port-$logStamp.out.log"
$errLog = Join-Path $tmpDir "server-$port-$logStamp.err.log"

Stop-ExistingProjectServer -TargetPort $port

$occupiedPids = Get-ListenerPids -TargetPort $port
if ($occupiedPids.Count -gt 0) {
    throw "Port ${port} is occupied by PID(s): $($occupiedPids -join ', '). Please free the port or run with another PORT."
}
if (Test-Path -LiteralPath $pidFile) { Remove-Item -LiteralPath $pidFile -Force }

$proc = Start-Process `
    -FilePath $node `
    -ArgumentList "online-server/server.js" `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

$proc.Id | Set-Content -LiteralPath $pidFile -Encoding ascii

$healthy = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500

    if ($proc.HasExited) {
        break
    }

    try {
        $health = Invoke-RestMethod -Uri "http://localhost:$port/health" -TimeoutSec 2
        if ($health.ok -eq $true) {
            $healthy = $true
            break
        }
    } catch {
    }
}

if (-not $healthy) {
    $exitCode = if ($proc.HasExited) { $proc.ExitCode } else { "RUNNING_BUT_UNHEALTHY" }
    Write-Output "Start failed: $exitCode"
    if (Test-Path -LiteralPath $outLog) {
        Write-Output "--- STDOUT ---"
        Get-Content -LiteralPath $outLog
    }
    if (Test-Path -LiteralPath $errLog) {
        Write-Output "--- STDERR ---"
        Get-Content -LiteralPath $errLog
    }
    exit 1
}

Write-Output "Server started"
Write-Output "PID: $($proc.Id)"
Write-Output "URL: http://localhost:$port/"
Write-Output "Health: http://localhost:$port/health"
