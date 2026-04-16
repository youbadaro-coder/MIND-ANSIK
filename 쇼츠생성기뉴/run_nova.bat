@echo off
chcp 65001 >nul
setlocal
echo ==================================================
echo   Shorts Factory Pro - Nova Engine Starting...
echo ==================================================

:: Set current directory to the project root
cd /d "%~dp0"

:: Start Backend
echo [*] Starting Nova Backend (Port 5005)...
:: We use the fully qualified path to the python executable in the venv
start "Nova Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe server.py"

:: Open Frontend
echo [*] Launching Dashboard...
timeout /t 3 >nul
start chrome "%~dp0frontend\index.html"

echo ==================================================
echo   System Online. Dashboard opened in browser.
echo ==================================================
timeout /t 5
exit
