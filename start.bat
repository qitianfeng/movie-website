@echo off
title MovieHub Startup Script

set SERVICE=%1
if "%SERVICE%"=="" set SERVICE=all

echo.
echo  ========================================
echo        MovieHub Startup Script
echo  ========================================
echo  Backend API : http://localhost:3001
echo  H5 Frontend : http://localhost:5173
echo  Admin Panel : http://localhost:5174
echo  ========================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

if "%SERVICE%"=="backend" goto start_backend
if "%SERVICE%"=="all" goto start_backend
goto check_h5

:start_backend
echo [1/3] Starting Backend API (port 3001)...
cd /d "%SCRIPT_DIR%backend"
if not exist "node_modules" (
    echo [*] First run, installing dependencies...
    call npm install
)
start "MovieHub-Backend" cmd /k "node src/app.js"
cd /d "%SCRIPT_DIR%"
echo     [OK] Backend started
echo.
timeout /t 3 /nobreak >nul

:check_h5
if "%SERVICE%"=="h5" goto start_h5
if "%SERVICE%"=="all" goto start_h5
goto check_admin

:start_h5
echo [2/3] Starting H5 Frontend (port 5173)...
cd /d "%SCRIPT_DIR%frontend-h5"
if not exist "node_modules" (
    echo [*] First run, installing dependencies...
    call npm install
)
start "MovieHub-H5" cmd /k "npm run dev"
cd /d "%SCRIPT_DIR%"
echo     [OK] H5 Frontend started
echo.
timeout /t 2 /nobreak >nul

:check_admin
if "%SERVICE%"=="admin" goto start_admin
if "%SERVICE%"=="all" goto start_admin
goto done

:start_admin
echo [3/3] Starting Admin Panel (port 5174)...
cd /d "%SCRIPT_DIR%frontend-admin"
if not exist "node_modules" (
    echo [*] First run, installing dependencies...
    call npm install
)
start "MovieHub-Admin" cmd /k "npm run dev"
cd /d "%SCRIPT_DIR%"
echo     [OK] Admin Panel started
echo.

:done
echo.
echo  ========================================
echo            All Services Started!
echo  ========================================
echo  Test Accounts:
echo  Admin - admin@moviehub.com / admin123
echo  User  - test@example.com / 123456
echo  ========================================
echo  Tip: Close the CMD windows to stop services
echo  ========================================
echo.

if "%SERVICE%"=="all" (
    echo Press any key to open Admin Panel...
    pause >nul
    start http://localhost:5174
) else (
    pause
)
