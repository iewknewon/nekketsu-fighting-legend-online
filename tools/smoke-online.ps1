$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Port = if ($env:PORT) { [int]$env:PORT } else { 3001 }
$BaseUrl = "http://localhost:$Port"

function Assert-Ok($url) {
    $response = Invoke-WebRequest -UseBasicParsing $url
    if ($response.StatusCode -ne 200) {
        throw "Request failed: $url => $($response.StatusCode)"
    }
    [PSCustomObject]@{
        Url = $url
        StatusCode = $response.StatusCode
        Length = $response.Content.Length
    }
}

Write-Host "Starting smoke check against $BaseUrl"

$checks = @(
    "$BaseUrl/health",
    "$BaseUrl/",
    "$BaseUrl/online.html",
    "$BaseUrl/online-config.js",
    "$BaseUrl/emulatorjs/data/loader.js",
    "$BaseUrl/emulatorjs/data/src/netplay.js",
    "$BaseUrl/emulatorjs/data/localization/zh.json",
    "$BaseUrl/emulatorjs/cores/fceumm/fceumm-wasm.data",
    "$BaseUrl/emulatorjs/cores/fceumm/reports/fceumm.json"
)

$results = foreach ($url in $checks) {
    Assert-Ok $url
}

$results | Format-Table -AutoSize
