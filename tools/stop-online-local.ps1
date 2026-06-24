$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$port = if ($env:PORT) { [int]$env:PORT } else { 3001 }
$pidFile = Join-Path $root ".tmp\server-$port.pid"
$stopped = $false

if (Test-Path -LiteralPath $pidFile) {
    $rawPid = (Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($rawPid -match "^\d+$") {
        $procId = [int]$rawPid
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Output "Stopped PID $procId from pid file"
            $stopped = $true
        } catch {
            Write-Output "PID ${procId} not stopped from pid file: $($_.Exception.Message)"
        }
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -eq $port } |
    Sort-Object OwningProcess -Unique

foreach ($conn in $connections) {
    $procId = $conn.OwningProcess
    try {
        $commandLine = ""
        try {
            $commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction Stop).CommandLine
        } catch {
            $commandLine = ""
        }

        $proc = Get-Process -Id $procId -ErrorAction Stop
        if ($proc.ProcessName -eq "node" -and $commandLine -like "*online-server/server.js*") {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Output "Stopped PID $procId on port $port"
            $stopped = $true
        }
    } catch {
        Write-Output "Skip PID ${procId}: $($_.Exception.Message)"
    }
}

if (-not $stopped) {
    Write-Output "No local project server was stopped on port $port"
}
