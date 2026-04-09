@echo off
title Young Fitting App Server
echo Starting Young Fitting App...
cd /d "%~dp0"
start http://localhost:5173
npm run dev
pause
