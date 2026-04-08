@echo off
echo =======================================================
echo   RastaRaksha AI - Complete Setup and Launch
echo =======================================================

set ROOT_DIR=c:\Users\SwarnimSugandh\Downloads\Rastaraksha-ai

echo.
echo [1/5] Cleaning broken Python environments...
if exist "%ROOT_DIR%\.venv" rmdir /s /q "%ROOT_DIR%\.venv"
if exist "%ROOT_DIR%\backend\.venv" rmdir /s /q "%ROOT_DIR%\backend\.venv"
echo   Done.

echo.
echo [2/5] Creating fresh Python environment with UV...
cd /d "%ROOT_DIR%\backend"
uv venv .venv
echo   Done.

echo.
echo [3/5] Installing Python packages...
uv pip install -r requirements.txt --python ".venv\Scripts\python.exe"
echo   Done.

echo.
echo [4/5] Seeding database with emergency services...
".venv\Scripts\python.exe" seed_db.py
echo   Done.

echo.
echo [5/5] Launching Backend and Frontend...
echo Starting Backend on port 8000...
start "RastaRaksha Backend" cmd /k "cd /d %ROOT_DIR%\backend && .venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

timeout /t 4 /nobreak >nul

echo Starting Frontend on port 5173...
start "RastaRaksha Frontend" cmd /k "cd /d %ROOT_DIR%\frontend && npm run dev"

echo.
echo =======================================================
echo   SETUP COMPLETE!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   Emergency Dashboard: http://localhost:5173/emergency-dispatch
echo =======================================================
echo.
echo Two new windows should have opened.
echo Wait 10 seconds then open your browser to:
echo   http://localhost:5173/emergency-dispatch
echo.
pause
