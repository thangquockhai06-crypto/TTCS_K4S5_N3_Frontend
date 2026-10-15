@echo off
title NexusCRM - Enterprise SaaS Frontend (React 19 + TypeScript)
cd /d "%~dp0"
echo ===============================================================
echo   NexusCRM - Modern SaaS CRM (React 19 + TypeScript + Vite)
echo ===============================================================

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    for /d %%D in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS*") do (
        for /d %%S in ("%%D\node-*") do (
            if exist "%%S\npm.cmd" set "PATH=%%S;%PATH%"
        )
    )
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    )
)

if not exist "node_modules" (
  echo [1/2] Installing dependencies...
  call npm install
)
echo [2/2] Starting Vite development server at http://localhost:5173 ...
call npm run dev
pause
