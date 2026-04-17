@echo off
REM IP-Relay Complete Startup Script for Windows
REM Runs the entire project: Relay VM, Dashboard, and optional Exit Agent
REM Usage: start-all.bat [options]
REM Options:
REM   --dev              Run in development mode (default)
REM   --prod             Run in production mode
REM   --help             Show this help message

setlocal enabledelayedexpansion

REM Colors (using ANSI escape codes)
set "BLUE=[0;34m"
set "GREEN=[0;32m"
set "RED=[0;31m"
set "YELLOW=[1;33m"
set "NC=[0m"

REM Configuration
set "MODE=dev"
set "PROJECT_ROOT=%~dp0"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"
set "ENV_FILE=%PROJECT_ROOT%.env"
set "FRONTEND_ENV=%FRONTEND_DIR%\.env.local"

REM Parse arguments
:parse_args
if "%1"=="" goto args_done
if "%1"=="--dev" (
    set "MODE=dev"
    shift
    goto parse_args
)
if "%1"=="--prod" (
    set "MODE=prod"
    shift
    goto parse_args
)
if "%1"=="--help" (
    call :show_help
    exit /b 0
)
shift
goto parse_args

:args_done

REM Check prerequisites
call :check_prerequisites
if errorlevel 1 exit /b 1

REM Setup environment
call :setup_environment

REM Install dependencies
call :install_dependencies

REM Start relay VM
call :start_relay_vm

REM Start frontend
call :start_frontend

REM Show status
call :show_status

REM Show next steps
call :show_next_steps

echo.
echo %GREEN%✓ All services started successfully!%NC%
echo %BLUE%ℹ Press Ctrl+C to stop all services%NC%

exit /b 0

REM Functions

:show_help
echo IP-Relay Complete Startup Script for Windows
echo.
echo Usage: start-all.bat [options]
echo.
echo Options:
echo   --dev              Run in development mode (default)
echo   --prod             Run in production mode
echo   --help             Show this help message
echo.
echo Examples:
echo   start-all.bat                    # Start in dev mode
echo   start-all.bat --prod             # Start in production mode
echo.
echo Components Started:
echo   1. Relay VM (Docker) - WireGuard hub + FastAPI
echo   2. Dashboard (Next.js) - Web UI
echo.
echo Ports:
echo   - WireGuard: 51820/UDP
echo   - Relay API: 8000/TCP
echo   - Dashboard: 3000/TCP
exit /b 0

:check_prerequisites
echo.
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BLUE%Checking Prerequisites%NC%
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%

set "missing=0"

where docker >nul 2>&1
if errorlevel 1 (
    echo %RED%✗ Docker is not installed%NC%
    set "missing=1"
) else (
    echo %GREEN%✓ Docker found%NC%
)

where docker-compose >nul 2>&1
if errorlevel 1 (
    echo %RED%✗ Docker Compose is not installed%NC%
    set "missing=1"
) else (
    echo %GREEN%✓ Docker Compose found%NC%
)

where node >nul 2>&1
if errorlevel 1 (
    echo %RED%✗ Node.js is not installed%NC%
    set "missing=1"
) else (
    for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
    echo %GREEN%✓ Node.js found (!NODE_VERSION!)%NC%
)

if !missing! equ 1 (
    echo.
    echo %RED%✗ Missing required dependencies. Please install them and try again.%NC%
    exit /b 1
)
exit /b 0

:setup_environment
echo.
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BLUE%Setting Up Environment%NC%
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%

if not exist "%ENV_FILE%" (
    echo %YELLOW%⚠ .env file not found, creating from .env.example%NC%
    if exist "%PROJECT_ROOT%.env.example" (
        copy "%PROJECT_ROOT%.env.example" "%ENV_FILE%" >nul
        echo %GREEN%✓ Created %ENV_FILE% from .env.example%NC%
        echo %YELLOW%⚠ Please update %ENV_FILE% with your configuration%NC%
    ) else (
        echo %RED%✗ .env.example not found%NC%
        exit /b 1
    )
) else (
    echo %GREEN%✓ .env file exists%NC%
)

if not exist "%FRONTEND_ENV%" (
    echo %YELLOW%⚠ .env.local not found in frontend, creating from .env.example%NC%
    if exist "%FRONTEND_DIR%\.env.example" (
        copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_ENV%" >nul
        echo %GREEN%✓ Created %FRONTEND_ENV%%NC%
    )
) else (
    echo %GREEN%✓ Dashboard .env.local exists%NC%
)
exit /b 0

:install_dependencies
echo.
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BLUE%Installing Dependencies%NC%
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%

if not exist "%FRONTEND_DIR%\node_modules" (
    echo %BLUE%ℹ Installing frontend dependencies...%NC%
    cd /d "%FRONTEND_DIR%"
    call npm install
    cd /d "%PROJECT_ROOT%"
    echo %GREEN%✓ Dashboard dependencies installed%NC%
) else (
    echo %GREEN%✓ Dashboard dependencies already installed%NC%
)
exit /b 0

:start_relay_vm
echo.
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BLUE%Starting Relay VM (Docker)%NC%
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%

docker-compose ps relay-vm 2>nul | find "Up" >nul
if errorlevel 1 (
    echo %BLUE%ℹ Starting relay VM container...%NC%
    call docker-compose up -d relay-vm

    echo %BLUE%ℹ Waiting for Relay API to be ready...%NC%
    setlocal enabledelayedexpansion
    for /l %%i in (1,1,30) do (
        timeout /t 1 /nobreak >nul
        curl -s http://localhost:8000/health >nul 2>&1
        if errorlevel 0 (
            echo %GREEN%✓ Relay API is ready%NC%
            goto relay_ready
        )
    )
    echo %YELLOW%⚠ Relay API did not respond within timeout%NC%
    :relay_ready
) else (
    echo %YELLOW%⚠ Relay VM is already running%NC%
)
exit /b 0

:start_frontend
echo.
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BLUE%Starting Dashboard%NC%
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%

cd /d "%FRONTEND_DIR%"

if "%MODE%"=="prod" (
    echo %BLUE%ℹ Building frontend for production...%NC%
    call npm run build
    echo %BLUE%ℹ Starting frontend in production mode...%NC%
    start cmd /k npm start
) else (
    echo %BLUE%ℹ Starting frontend in development mode...%NC%
    start cmd /k npm run dev
)

cd /d "%PROJECT_ROOT%"

echo %BLUE%ℹ Waiting for frontend to be ready...%NC%
setlocal enabledelayedexpansion
for /l %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    curl -s http://localhost:3000 >nul 2>&1
    if errorlevel 0 (
        echo %GREEN%✓ Dashboard is ready%NC%
        goto frontend_ready
    )
)
echo %YELLOW%⚠ Dashboard did not respond within timeout%NC%
:frontend_ready
exit /b 0

:show_status
echo.
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BLUE%System Status%NC%
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%

echo.
echo %BLUE%ℹ Relay VM Status:%NC%
docker-compose ps relay-vm 2>nul || echo   Not running

echo.
echo %BLUE%ℹ Dashboard Status:%NC%
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 0 (
    echo %GREEN%✓ Dashboard is running at http://localhost:3000%NC%
) else (
    echo %YELLOW%⚠ Dashboard is not responding%NC%
)

echo.
echo %BLUE%ℹ Relay API Status:%NC%
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 0 (
    echo %GREEN%✓ Relay API is running at http://localhost:8000%NC%
) else (
    echo %YELLOW%⚠ Relay API is not responding%NC%
)
exit /b 0

:show_next_steps
echo.
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%
echo %BLUE%Next Steps%NC%
echo %BLUE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%NC%

echo.
echo 1. Dashboard: http://localhost:3000
echo 2. Relay API: http://localhost:8000
echo 3. API Docs: http://localhost:8000/docs
echo.
echo To stop all services:
echo   docker-compose down
echo.
echo To view logs:
echo   docker-compose logs -f relay-vm
echo.
exit /b 0
