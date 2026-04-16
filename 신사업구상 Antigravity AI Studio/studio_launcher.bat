@echo off
chcp 65001 >nul
title Antigravity Studio Total Controller
echo ==================================================
echo   AI Studio - Super Studio Starting...
echo ==================================================

set "PROJECT_ROOT=c:\ai작업\anti\신사업구상 Antigravity AI Studio"
set "PYTHON_EXE=python"
set "STUDIO_BACKEND=%PROJECT_ROOT%\shorts_factory_v2\server.py"
set "STUDIO_FRONTEND=%PROJECT_ROOT%\youtube_trend_studio"

echo [1/2] Starting Studio Engine (Background)...
start "STUDIO_ENGINE" /min cmd /c ""%PYTHON_EXE%" "%STUDIO_BACKEND%""

echo [2/2] Launching Trend Dashboard (Frontend)...
if exist "%STUDIO_FRONTEND%" (
    cd /d "%STUDIO_FRONTEND%"
    start http://localhost:3000
    npm run dev
) else (
    echo [ERROR] 프런트엔드 폴더를 찾을 수 없습니다: %STUDIO_FRONTEND%
    pause
)
