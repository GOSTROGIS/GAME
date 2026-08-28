$ErrorActionPreference = "Stop"
$gameRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$installedNode = Get-Command node -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$nodeExecutable = if ($installedNode) { $installedNode.Source } elseif (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { $null }

if (-not $nodeExecutable) {
  Write-Error "Node.js was not found. Install Node 20 or newer, then run: node serve.mjs"
  exit 1
}

$serverProcess = Start-Process -FilePath $nodeExecutable -ArgumentList "serve.mjs" -WorkingDirectory $gameRoot -WindowStyle Hidden -PassThru
Start-Sleep -Milliseconds 900
Start-Process "http://127.0.0.1:4173"
Write-Host "The Hollow March is running. Close this window to stop the local server."

try {
  Wait-Process -Id $serverProcess.Id
} finally {
  if (-not $serverProcess.HasExited) { Stop-Process -Id $serverProcess.Id }
}
