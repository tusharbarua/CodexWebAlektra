param(
  [int]$Port = 3000
)

& (Join-Path $PSScriptRoot "start-dev.ps1") -Port $Port
