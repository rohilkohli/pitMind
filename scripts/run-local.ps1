$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "PitMind: starting API on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-NoProfile",
  "-Command",
  "Set-Location '$Root'; & .\.venv\Scripts\Activate.ps1; python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"
)

Write-Host "PitMind: starting UI on http://127.0.0.1:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-NoProfile",
  "-Command",
  "Set-Location '$Root\frontend'; npm install; `$env:VITE_API_BASE_URL='http://127.0.0.1:8000'; npm run dev -- --host 127.0.0.1 --port 5173"
)

Write-Host ""
Write-Host "Opened two terminals. When Vite shows 'ready', open:" -ForegroundColor Green
Write-Host "  UI:  http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "  API: http://127.0.0.1:8000/docs" -ForegroundColor Green
