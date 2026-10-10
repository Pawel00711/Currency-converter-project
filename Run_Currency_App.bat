@echo off
title Launching freecurrencyapi.com Full Stack Engine
cls

echo ====================================================
echo   INITIALIZING CURRENCY APPS PIPELINE
echo ====================================================
echo.

echo [1/2] Starting Express Server with Disk Storage Cache...
start cmd /k "cd /d "%~dp0web-app\server" && node index.js"

echo [2/2] Booting Vite React Frontend Interface...
start cmd /k "cd /d "%~dp0web-app\client" && npm run dev"

:: Wait 2 seconds for the server pipelines to stabilize
timeout /t 2 /nobreak >nul

echo [Success] Automatically launching application interface...
start http://localhost:5173/
