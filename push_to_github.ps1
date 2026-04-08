# RastaRaksha AI - Install Git & Push to GitHub
# Run this script in PowerShell as Administrator

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Installing Git & Pushing to GitHub" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Step 1: Install Git using winget
Write-Host "`n[1/4] Installing Git..." -ForegroundColor Yellow
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements

# Refresh PATH so git is available immediately
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify git installed
Write-Host "`n[2/4] Verifying Git installation..." -ForegroundColor Yellow
git --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git installation failed. Please install manually from https://git-scm.com/download/win" -ForegroundColor Red
    Write-Host "After installing, CLOSE this terminal, open a new one, and run this script again." -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "  Git installed successfully!" -ForegroundColor Green

# Step 3: Initialize repo and commit
Write-Host "`n[3/4] Initializing Git repository..." -ForegroundColor Yellow
Set-Location "c:\Users\SwarnimSugandh\Downloads\Rastaraksha-ai"

# Remove old .git if exists
if (Test-Path ".git") { Remove-Item -Recurse -Force ".git" }

git init
git add .
git commit -m "RastaRaksha AI - National Road Intelligence System"
Write-Host "  Committed!" -ForegroundColor Green

# Step 4: Push to GitHub
Write-Host "`n[4/4] Pushing to GitHub..." -ForegroundColor Yellow
git remote add origin https://github.com/swarnim91/Rastaraksha-ai.git
git branch -M main
git push -u origin main

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "  DONE! Your code is on GitHub at:" -ForegroundColor Green
Write-Host "  https://github.com/swarnim91/Rastaraksha-ai" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Cyan
pause
