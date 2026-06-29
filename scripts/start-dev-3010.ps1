param(
  [int]$Port = 3010
)

$ErrorActionPreference = "Stop"

$project = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$nodeDir = "C:\Users\Dell\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"

if (Test-Path (Join-Path $nodeDir "node.exe")) {
  $env:PATH = "$nodeDir;$env:PATH"
}

$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -in @(3000, $Port) }

foreach ($listener in $listeners) {
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
  pnpm exec prisma generate
  pnpm exec prisma migrate deploy
  pnpm exec next dev -H 127.0.0.1 -p $Port
} finally {
  Pop-Location
}
