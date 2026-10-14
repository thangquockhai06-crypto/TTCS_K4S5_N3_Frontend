@echo off
title NexusCRM - Fullstack Launcher (Frontend + Backend)
cd /d "%~dp0"

echo ===============================================================
echo          NexusCRM - Enterprise SaaS CRM System
echo ===============================================================
echo   Backend Server:  http://localhost:8000
echo   Swagger Docs:    http://localhost:8000/docs
echo   Frontend Web:    http://localhost:5173
echo ===============================================================
echo.

REM 1. Kiem tra Python
set "PYTHON_CMD="
where python >nul 2>&1
if %ERRORLEVEL% equ 0 set "PYTHON_CMD=python"
if not defined PYTHON_CMD (
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 set "PYTHON_CMD=py"
)

if exist "%~dp0serverenv\Scripts\python.exe" (
    set "PYTHON_CMD=%~dp0serverenv\Scripts\python.exe"
) else if exist "%~dp0venv\Scripts\python.exe" (
    set "PYTHON_CMD=%~dp0venv\Scripts\python.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_CMD=%~dp0.venv\Scripts\python.exe"
)

if not defined PYTHON_CMD (
    echo [LOI] Khong tim thay Python trong he thong PATH!
    echo Vui long cai dat Python va them vao PATH: https://www.python.org/
    pause
    exit /b 1
)

REM 2. Kiem tra Node va npm
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LOI] Khong tim thay Node.js / npm!
    echo Vui long cai dat Node.js tu: https://nodejs.org/
    pause
    exit /b 1
)

REM 3. Giai phong port 8000 neu tien trinh cu con treo
echo [*] Kiem tra va giai phong port 8000, 5173 neu co tien trinh cu...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM 4. Kiem tra thu vien Backend
echo [*] Kiem tra thu vien Python Backend...
%PYTHON_CMD% -c "import fastapi, uvicorn, sqlalchemy" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [THONG BAO] Dang cai dat thu vien Backend...
    %PYTHON_CMD% -m pip install -r "%~dp0serverequirements.txt"
)

REM 5. Kiem tra thu vien Frontend
if not exist "%~dp0node_modules" (
    echo [THONG BAO] Dang cai dat npm packages cho Frontend...
    call npm install
)

REM 6. Khoi dong Backend Server
echo.
echo [1/2] Dang khoi dong Backend Server (Port 8000)...
start "NexusCRM Backend (Port 8000)" /D "%~dp0server" cmd /k "%PYTHON_CMD% run.py"

REM 7. Cho 2 giay de Backend san sang
timeout /t 2 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 3 >nul

REM 8. Khoi dong Frontend Web
echo.
echo [2/2] Dang khoi dong Frontend Web (Port 5173)...
echo [*] Trinh duyet se tu dong mo tai http://localhost:5173
echo.
call npm run dev

pause
