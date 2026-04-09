@echo off
title Antigravity Studio Total Controller
echo [0/2] Cleaning old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do taskkill /F /PID %%a >nul 2>&1

set "PYTHON_EXE=C:\Users\USER\AppData\Local\Programs\Python\Python311\python.exe"
set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
set "STUDIO_BACKEND=C:\ai작업\anti\신사업구상 Antigravity AI Studio\shorts_factory_v2\server.py"
set "STUDIO_FRONTEND=C:\ai작업\anti\신사업구상 Antigravity AI Studio\youtube_trend_studio"

echo [1/2] Starting Studio Engine (Background)...
start "STUDIO_ENGINE" /min cmd /c ""%PYTHON_EXE%" "%STUDIO_BACKEND%""

echo [2/2] Launching Trend Dashboard (Frontend)...
cd /d "%STUDIO_FRONTEND%"
start http://localhost:3000
"%NPM_CMD%" run dev
pause
