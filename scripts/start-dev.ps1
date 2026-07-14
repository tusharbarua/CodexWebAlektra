param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$project = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$nodeDir = "C:\Users\Dell\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$depsBin = "C:\Users\Dell\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin"

if (Test-Path (Join-Path $nodeDir "node.exe")) {
  $env:PATH = "$nodeDir;$env:PATH"
}

$fallbackDepsBin = Join-Path $depsBin "fallback"
if (Test-Path $depsBin) {
  $env:PATH = "$depsBin;$env:PATH"
}
if (Test-Path $fallbackDepsBin) {
  $env:PATH = "$fallbackDepsBin;$env:PATH"
}

$pnpmCandidates = @(
  (Join-Path $depsBin "pnpm.cmd"),
  (Join-Path $fallbackDepsBin "pnpm.cmd"),
  "C:\Program Files\nodejs\pnpm.cmd"
)

$pnpmCmd = $pnpmCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (!$pnpmCmd) {
  $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
  if ($pnpmCommand) {
    $pnpmCmd = $pnpmCommand.Source
  }
}

if (!$pnpmCmd) {
  throw "pnpm was not found. Install pnpm or run: corepack enable"
}

$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -eq $Port }

foreach ($listener in $listeners) {
  Write-Host "Stopping existing process $($listener.OwningProcess) on port $Port..."
  Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
}

$envPath = Join-Path $project ".env"
if (Test-Path $envPath) {
  $content = Get-Content $envPath
  if ($content -match "^NEXTAUTH_URL=") {
    $content -replace "^NEXTAUTH_URL=.*", "NEXTAUTH_URL=`"http://localhost:$Port`"" | Set-Content $envPath
  } else {
    Add-Content -Path $envPath -Value "NEXTAUTH_URL=`"http://localhost:$Port`""
  }
}

Push-Location $project
try {
  & $pnpmCmd exec prisma generate
  & $pnpmCmd exec prisma migrate deploy
  & $pnpmCmd exec next dev -H 127.0.0.1 -p $Port
} finally {
  Pop-Location
}
