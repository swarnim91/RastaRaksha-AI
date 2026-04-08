# RastaRaksha AI - System Launcher (uses backend\.venv)

$ROOT_DIR = Get-Location

# 1. Start Backend
Write-Host "Starting RastaRaksha AI Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$ROOT_DIR\backend'; .\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

# 2. Start Frontend
Write-Host "Starting RastaRaksha AI Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$ROOT_DIR\frontend'; npm run dev"

Write-Host "Both services are starting!" -ForegroundColor Yellow
Write-Host "Backend: http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Safe Driving!" -ForegroundColor Green
