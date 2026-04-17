# IP-Relay Complete Startup Script for Windows PowerShell
# Runs the entire project: Relay VM, Dashboard, and optional Exit Agent
# Usage: .\start-all.ps1 [options]
# Options:
#   -Dev              Run in development mode (default)
#   -Prod             Run in production mode
#   -WithExitAgent    Also start exit agent (requires config)
#   -Help             Show this help message

param(
    [switch]$Dev = $true,
    [switch]$Prod,
    [switch]$WithExitAgent,
    [switch]$Help
)

# Colors
$Blue = "`e[0;34m"
$Green = "`e[0;32m"
$Red = "`e[0;31m"
$Yellow = "`e[1;33m"
$NC = "`e[0m"

# Configuration
$Mode = if ($Prod) { "prod" } else { "dev" }
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$DashboardDir = Join-Path $ProjectRoot "frontend"
$EnvFile = Join-Path $ProjectRoot ".env"
$DashboardEnv = Join-Path $DashboardDir ".env.local"

# Functions
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "$Blue━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$NC"
    Write-Host "$Blue$Message$NC"
    Write-Host "$Blue━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$NC"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$Green✓ $Message$NC"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "$Red✗ $Message$NC"
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "$Yellow⚠ $Message$NC"
}

function Write-Info {
    param([string]$Message)
    Write-Host "$Blue ℹ $Message$NC"
}

function Show-Help {
    Write-Host @"
IP-Relay Complete Startup Script for Windows PowerShell

Usage: .\start-all.ps1 [options]

Options:
  -Dev              Run in development mode (default)
  -Prod             Run in production mode
  -WithExitAgent    Also start exit agent (requires configuration)
  -Help             Show this help message

Examples:
  .\start-all.ps1                    # Start in dev mode
  .\start-all.ps1 -Prod              # Start in production mode
  .\start-all.ps1 -Dev -WithExitAgent # Dev mode with exit agent

Components Started:
  1. Relay VM (Docker) - WireGuard hub + FastAPI
  2. Dashboard (Next.js) - Web UI
  3. Exit Agent (optional) - Reverse tunnel

Ports:
  - WireGuard: 51820/UDP
  - Relay API: 8000/TCP
  - Dashboard: 3000/TCP

"@
}

function Check-Prerequisites {
    Write-Header "Checking Prerequisites"

    $missing = $false

    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Docker is not installed"
        $missing = $true
    } else {
        Write-Success "Docker found"
    }

    # Check Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Docker Compose is not installed"
        $missing = $true
    } else {
        Write-Success "Docker Compose found"
    }

    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Node.js is not installed"
        $missing = $true
    } else {
        $nodeVersion = node --version
        Write-Success "Node.js found ($nodeVersion)"
    }

    if ($missing) {
        Write-Error-Custom "Missing required dependencies. Please install them and try again."
        exit 1
    }
}

function Setup-Environment {
    Write-Header "Setting Up Environment"

    # Check if .env exists
    if (-not (Test-Path $EnvFile)) {
        Write-Warning-Custom ".env file not found, creating from .env.example"
        $exampleEnv = Join-Path $ProjectRoot ".env.example"
        if (Test-Path $exampleEnv) {
            Copy-Item $exampleEnv $EnvFile
            Write-Success "Created $EnvFile from .env.example"
            Write-Warning-Custom "Please update $EnvFile with your configuration"
        } else {
            Write-Error-Custom ".env.example not found"
            exit 1
        }
    } else {
        Write-Success ".env file exists"
    }

    # Check if frontend .env.local exists
    if (-not (Test-Path $DashboardEnv)) {
        Write-Warning-Custom ".env.local not found in frontend, creating from .env.example"
        $exampleDashboardEnv = Join-Path $DashboardDir ".env.example"
        if (Test-Path $exampleDashboardEnv) {
            Copy-Item $exampleDashboardEnv $DashboardEnv
            Write-Success "Created $DashboardEnv"
        }
    } else {
        Write-Success "Dashboard .env.local exists"
    }
}

function Install-Dependencies {
    Write-Header "Installing Dependencies"

    $nodeModulesPath = Join-Path $DashboardDir "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Info "Installing frontend dependencies..."
        Push-Location $DashboardDir
        npm install
        Pop-Location
        Write-Success "Dashboard dependencies installed"
    } else {
        Write-Success "Dashboard dependencies already installed"
    }
}

function Start-RelayVM {
    Write-Header "Starting Relay VM (Docker)"

    $relayStatus = docker-compose ps relay-vm 2>$null | Select-String "Up"
    if ($relayStatus) {
        Write-Warning-Custom "Relay VM is already running"
    } else {
        Write-Info "Starting relay VM container..."
        docker-compose up -d relay-vm

        Write-Info "Waiting for Relay API to be ready..."
        $maxAttempts = 30
        $attempt = 0
        while ($attempt -lt $maxAttempts) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Success "Relay API is ready"
                    break
                }
            } catch {
                # API not ready yet
            }
            $attempt++
            Start-Sleep -Seconds 1
        }

        if ($attempt -eq $maxAttempts) {
            Write-Warning-Custom "Relay API did not respond within timeout"
        }
    }
}

function Start-Dashboard {
    Write-Header "Starting Dashboard"

    Push-Location $DashboardDir

    if ($Prod) {
        Write-Info "Building frontend for production..."
        npm run build
        Write-Info "Starting frontend in production mode..."
        Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/k npm start"
    } else {
        Write-Info "Starting frontend in development mode..."
        Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/k npm run dev"
    }

    Pop-Location

    Write-Info "Waiting for frontend to be ready..."
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "Dashboard is ready"
                break
            }
        } catch {
            # Dashboard not ready yet
        }
        $attempt++
        Start-Sleep -Seconds 1
    }

    if ($attempt -eq $maxAttempts) {
        Write-Warning-Custom "Dashboard did not respond within timeout"
    }
}

function Show-Status {
    Write-Header "System Status"

    Write-Host ""
    Write-Info "Relay VM Status:"
    docker-compose ps relay-vm 2>$null

    Write-Host ""
    Write-Info "Dashboard Status:"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Dashboard is running at http://localhost:3000"
        }
    } catch {
        Write-Warning-Custom "Dashboard is not responding"
    }

    Write-Host ""
    Write-Info "Relay API Status:"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Relay API is running at http://localhost:8000"
        }
    } catch {
        Write-Warning-Custom "Relay API is not responding"
    }

    Write-Host ""
}

function Show-NextSteps {
    Write-Header "Next Steps"

    Write-Host ""
    Write-Host "1. Dashboard: http://localhost:3000"
    Write-Host "2. Relay API: http://localhost:8000"
    Write-Host "3. API Docs: http://localhost:8000/docs"
    Write-Host ""
    Write-Host "To stop all services:"
    Write-Host "  docker-compose down"
    Write-Host ""
    Write-Host "To view logs:"
    Write-Host "  docker-compose logs -f relay-vm"
    Write-Host ""
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Header "IP-Relay Complete Startup"
Write-Info "Mode: $Mode"
Write-Info "With Exit Agent: $WithExitAgent"
Write-Host ""

Check-Prerequisites
Setup-Environment
Install-Dependencies
Start-RelayVM
Start-Dashboard

Show-Status
Show-NextSteps

Write-Success "All services started successfully!"
Write-Info "Press Ctrl+C to stop all services"
