# RastaRaksha AI - Complete Setup and Run Script
# Uses UV package manager

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  RastaRaksha AI - Full Setup and Launch" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$ROOT_DIR = "c:\Users\SwarnimSugandh\Downloads\Rastaraksha-ai"

# Step 1: Setup Python Backend
Write-Host "`n[1/4] Setting up Python backend..." -ForegroundColor Yellow
Set-Location "$ROOT_DIR\backend"

if (-not (Test-Path ".venv")) {
    Write-Host "  Creating virtual environment..." -ForegroundColor Gray
    uv venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to create virtual environment. Make sure 'uv' is installed." -ForegroundColor Red
        Write-Host "  Install UV: pip install uv" -ForegroundColor Yellow
        pause
        exit 1
    }
} else {
    Write-Host "  Virtual environment already exists, skipping creation." -ForegroundColor Gray
}

Write-Host "  Installing Python packages..." -ForegroundColor Gray
uv pip install -r requirements.txt --python ".\.venv\Scripts\python.exe"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to install Python packages." -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  Done." -ForegroundColor Green

# Step 2: Seed database
Write-Host "`n[2/4] Seeding database..." -ForegroundColor Yellow
.\.venv\Scripts\python.exe seed_db.py
Write-Host "  Done." -ForegroundColor Green

# Step 3: Install frontend deps (only if needed)
Write-Host "`n[3/4] Checking frontend dependencies..." -ForegroundColor Yellow
Set-Location "$ROOT_DIR\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing frontend packages..." -ForegroundColor Gray
    npm install
} else {
    Write-Host "  node_modules exists, skipping install." -ForegroundColor Gray
}
Write-Host "  Done." -ForegroundColor Green

# Step 4: Launch both servers
Write-Host "`n[4/4] Launching Backend and Frontend..." -ForegroundColor Green

# Kill any existing processes on these ports (to avoid conflicts)
Write-Host "  Cleaning up old processes..." -ForegroundColor Gray
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$ROOT_DIR\backend'; Write-Host 'Starting Backend...' -ForegroundColor Cyan; .\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

Start-Sleep -Seconds 4

Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$ROOT_DIR\frontend'; Write-Host 'Starting Frontend...' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 3

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Opening browser in 5 seconds..." -ForegroundColor Yellow

Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Set-Location $ROOT_DIR
