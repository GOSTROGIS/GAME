$ErrorActionPreference = "Stop"
$gameRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$installedNode = Get-Command node -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$nodeExecutable = if ($installedNode) { $installedNode.Source } elseif (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { $null }
$viteEntry = Join-Path $gameRoot "apps\client\node_modules\vite\bin\vite.js"

if (-not $nodeExecutable) {
  Write-Error "Node.js was not found. Install Node 22 or newer."
  exit 1
}

if (-not (Test-Path -LiteralPath $viteEntry)) {
  Write-Error "The 3D workspace dependencies are not installed. Run pnpm install in $gameRoot first."
  exit 1
}

$arguments = @($viteEntry, "--config", "apps/client/vite.config.ts")
$serverProcess = Start-Process -FilePath $nodeExecutable -ArgumentList $arguments -WorkingDirectory $gameRoot -WindowStyle Hidden -PassThru
Start-Sleep -Milliseconds 1200
Start-Process "http://127.0.0.1:4173/?renderer=webgl"
Write-Host "The Hollow March WebGL slice is running. Close this window to stop the client server."

try {
  Wait-Process -Id $serverProcess.Id
} finally {
  if (-not $serverProcess.HasExited) { Stop-Process -Id $serverProcess.Id }
}
