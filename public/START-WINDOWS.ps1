$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

# Use a raw TCP server instead of HttpListener.
# HttpListener relies on http.sys URLACL reservations and can be blocked on locked-down machines.
$portsToTry = @(5173, 5174, 5175, 8080, 4173)
$listener = $null
$port = $null

foreach ($p in $portsToTry) {
  try {
    $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
    $l.Start()
    $listener = $l
    $port = $p
    break
  } catch {
    try { $l.Stop() } catch {}
  }
}

if (-not $listener) {
  Write-Host ""
  Write-Host "Could not start the local server on ports: $($portsToTry -join ', ')"
  Write-Host "Common causes:"
  Write-Host "- Another app is already using the port(s)"
  Write-Host "- Aggressive antivirus/firewall rules"
  Write-Host ""
  throw "Failed to bind any port."
}

$baseUrl = "http://127.0.0.1:$port/"
Write-Host "Local server started at $baseUrl"
Write-Host "Close this window to stop the server."

Start-Process $baseUrl | Out-Null

function Get-ContentType([string]$path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css"  { "text/css; charset=utf-8" }
    ".js"   { "text/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".svg"  { "image/svg+xml" }
    ".png"  { "image/png" }
    ".jpg"  { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".gif"  { "image/gif" }
    ".webp" { "image/webp" }
    ".wasm" { "application/wasm" }
    ".woff" { "font/woff" }
    ".woff2"{ "font/woff2" }
    ".ttf"  { "font/ttf" }
    default { "application/octet-stream" }
  }
}

function Write-HttpResponse($stream, [int]$status, [string]$contentType, [byte[]]$body) {
  $statusText = switch ($status) {
    200 { "OK" }
    400 { "Bad Request" }
    404 { "Not Found" }
    default { "Server Error" }
  }
  $headers =
    "HTTP/1.1 $status $statusText`r`n" +
    "Content-Type: $contentType`r`n" +
    "Content-Length: $($body.Length)`r`n" +
    "Connection: close`r`n`r`n"
  $hdrBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $stream.Write($hdrBytes, 0, $hdrBytes.Length)
  $stream.Write($body, 0, $body.Length)
}

while ($true) {
  $client = $null
  $stream = $null
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()

    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
    $requestLine = $reader.ReadLine()
    if (-not $requestLine) { $client.Close(); continue }

    # Read and discard headers until blank line
    while ($true) {
      $line = $reader.ReadLine()
      if ($line -eq $null -or $line -eq "") { break }
    }

    $parts = $requestLine.Split(" ")
    if ($parts.Length -lt 2) {
      Write-HttpResponse $stream 400 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Bad request"))
      $client.Close()
      continue
    }

    $method = $parts[0]
    $rawPath = $parts[1]
    if ($method -ne "GET") {
      Write-HttpResponse $stream 400 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Only GET is supported"))
      $client.Close()
      continue
    }

    # Strip query string
    $pathOnly = $rawPath.Split("?")[0]
    if ([string]::IsNullOrWhiteSpace($pathOnly) -or $pathOnly -eq "/") { $pathOnly = "/index.html" }

    # URL decode and normalize slashes
    $pathOnly = [System.Uri]::UnescapeDataString($pathOnly)
    $pathOnly = $pathOnly -replace "/", "\"

    # Prevent path traversal
    $candidate = Join-Path $here $pathOnly.TrimStart("\")
    $fullPath = [System.IO.Path]::GetFullPath($candidate)
    if (-not $fullPath.StartsWith($here, [System.StringComparison]::OrdinalIgnoreCase)) {
      Write-HttpResponse $stream 400 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Bad request"))
      $client.Close()
      continue
    }

    if (Test-Path $fullPath -PathType Container) {
      $fullPath = Join-Path $fullPath "index.html"
    }

    if (-not (Test-Path $fullPath -PathType Leaf)) {
      Write-HttpResponse $stream 404 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Not found"))
      $client.Close()
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $ct = Get-ContentType $fullPath
    Write-HttpResponse $stream 200 $ct $bytes
    $client.Close()
  } catch {
    try {
      if ($stream) {
        Write-HttpResponse $stream 500 "text/plain; charset=utf-8" ([System.Text.Encoding]::UTF8.GetBytes("Server error"))
      }
    } catch {}
    try { if ($client) { $client.Close() } } catch {}
  }
}

