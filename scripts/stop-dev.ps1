param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -eq $Port }

if (!$listeners) {
  Write-Host "No dev server is listening on port $Port."
  exit 0
}

foreach ($listener in $listeners) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
  if ($process) {
    Write-Host "Stopping process $($listener.OwningProcess) on port $Port..."
    Write-Host $process.CommandLine
  } else {
    Write-Host "Stopping process $($listener.OwningProcess) on port $Port..."
  }

  Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1

$remaining = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -eq $Port }

if ($remaining) {
  throw "Port $Port is still in use."
}

Write-Host "Port $Port is free."
