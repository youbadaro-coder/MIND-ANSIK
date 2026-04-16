# encoding: utf-8
import os

content = r"""@echo off
title Shorts Factory Pro - MISSION CONTROL
color 0b

echo ==================================================
echo   Shorts Factory Pro - Nova Engine V2.0
echo ==================================================
echo.

set TARGET_DIR=c:\ai작업\anti\쇼츠생성기뉴

if not exist "%TARGET_DIR%" (
    echo [ERROR] 기지를 찾을 수 없습니다!
    echo 경로: %TARGET_DIR%
    pause
    exit
)

echo [*] 엔진 구동 중 (Port 5005)...
start "Shorts_Factory_Backend" cmd /k "cd /d \"%TARGET_DIR%\backend\" && .venv\Scripts\python.exe server.py"

echo [*] 조종석 열리는 중... 3초 대기
timeout /t 3 >nul
start chrome "%TARGET_DIR%\frontend\index.html"

echo.
echo   기동 완료!
timeout /t 5
exit
"""

with open(r'C:\Users\USER\Desktop\Shorts_Factory_Pro_LAUNCHER.bat', 'w', encoding='euc-kr') as f:
    f.write(content)

print("Batch file generated successfully.")
