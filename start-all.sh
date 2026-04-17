#!/bin/bash

# IP-Relay Complete Startup Script
# Runs the entire project: Relay VM, Dashboard, and optional Exit Agent
# Usage: ./start-all.sh [options]
# Options:
#   --dev              Run in development mode (default)
#   --prod             Run in production mode
#   --with-exit-agent  Also start exit agent (requires config)
#   --help             Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MODE="dev"
WITH_EXIT_AGENT=false
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
ENV_FILE="$PROJECT_ROOT/.env"
FRONTEND_ENV="$FRONTEND_DIR/.env.local"

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

show_help() {
    cat << EOF
IP-Relay Complete Startup Script

Usage: ./start-all.sh [options]

Options:
  --dev              Run in development mode (default)
  --prod             Run in production mode
  --with-exit-agent  Also start exit agent (requires configuration)
  --help             Show this help message

Examples:
  ./start-all.sh                    # Start in dev mode
  ./start-all.sh --prod             # Start in production mode
  ./start-all.sh --dev --with-exit-agent  # Dev mode with exit agent

Components Started:
  1. Relay VM (Docker) - WireGuard hub + FastAPI
  2. Dashboard (Next.js) - Web UI
  3. Exit Agent (optional) - Reverse tunnel

Ports:
  - WireGuard: 51820/UDP
  - Relay API: 8000/TCP
  - Dashboard: 3000/TCP

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            MODE="dev"
            shift
            ;;
        --prod)
            MODE="prod"
            shift
            ;;
        --with-exit-agent)
            WITH_EXIT_AGENT=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing=false

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        missing=true
    else
        print_success "Docker found"
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        missing=true
    else
        print_success "Docker Compose found"
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        missing=true
    else
        print_success "Node.js found ($(node --version))"
    fi

    if [ "$WITH_EXIT_AGENT" = true ]; then
        if ! command -v wg &> /dev/null; then
            print_warning "WireGuard tools not found (required for exit agent)"
        else
            print_success "WireGuard tools found"
        fi
    fi

    if [ "$missing" = true ]; then
        print_error "Missing required dependencies. Please install them and try again."
        exit 1
    fi
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"

    # Check if .env exists
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env file not found, creating from .env.example"
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
            print_success "Created $ENV_FILE from .env.example"
            print_warning "Please update $ENV_FILE with your configuration"
        else
            print_error ".env.example not found"
            exit 1
        fi
    else
        print_success ".env file exists"
    fi

    # Check if dashboard .env.local exists
    if [ ! -f "$FRONTEND_ENV" ]; then
        print_warning ".env.local not found in dashboard, creating from .env.example"
        if [ -f "$FRONTEND_DIR/.env.example" ]; then
            cp "$FRONTEND_DIR/.env.example" "$FRONTEND_ENV"
            print_success "Created $FRONTEND_ENV"
        fi
    else
        print_success "Dashboard .env.local exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    # Dashboard dependencies
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_info "Installing dashboard dependencies..."
        cd "$FRONTEND_DIR"
        npm install
        cd "$PROJECT_ROOT"
        print_success "Dashboard dependencies installed"
    else
        print_success "Dashboard dependencies already installed"
    fi
}

# Start relay VM
start_relay_vm() {
    print_header "Starting Relay VM (Docker)"

    if docker-compose ps relay-vm 2>/dev/null | grep -q "Up"; then
        print_warning "Relay VM is already running"
    else
        print_info "Starting relay VM container..."
        docker-compose up -d relay-vm

        # Wait for API to be ready
        print_info "Waiting for Relay API to be ready..."
        local max_attempts=30
        local attempt=0
        while [ $attempt -lt $max_attempts ]; do
            if curl -s http://localhost:8000/health > /dev/null 2>&1; then
                print_success "Relay API is ready"
                break
            fi
            attempt=$((attempt + 1))
            sleep 1
        done

        if [ $attempt -eq $max_attempts ]; then
            print_warning "Relay API did not respond within timeout"
        fi
    fi
}

# Start dashboard
start_dashboard() {
    print_header "Starting Dashboard"

    cd "$FRONTEND_DIR"

    if [ "$MODE" = "prod" ]; then
        print_info "Building dashboard for production..."
        npm run build
        print_info "Starting dashboard in production mode..."
        npm start &
    else
        print_info "Starting dashboard in development mode..."
        npm run dev &
    fi

    cd "$PROJECT_ROOT"

    # Wait for dashboard to be ready
    print_info "Waiting for dashboard to be ready..."
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Dashboard is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    if [ $attempt -eq $max_attempts ]; then
        print_warning "Dashboard did not respond within timeout"
    fi
}

# Start exit agent
start_exit_agent() {
    if [ "$WITH_EXIT_AGENT" = false ]; then
        return
    fi

    print_header "Starting Exit Agent"

    if [ ! -f "$PROJECT_ROOT/exit-agent.sh" ]; then
        print_error "exit-agent.sh not found"
        return
    fi

    # Check if exit agent config exists
    if [ ! -f "$PROJECT_ROOT/.exit-agent-config" ]; then
        print_warning "Exit agent configuration not found"
        print_info "Please configure exit agent and run: ./exit-agent.sh"
        return
    fi

    print_info "Starting exit agent..."
    bash "$PROJECT_ROOT/exit-agent.sh" &
    print_success "Exit agent started"
}

# Show status
show_status() {
    print_header "System Status"

    echo ""
    print_info "Relay VM Status:"
    docker-compose ps relay-vm 2>/dev/null || echo "  Not running"

    echo ""
    print_info "Dashboard Status:"
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Dashboard is running at http://localhost:3000"
    else
        print_warning "Dashboard is not responding"
    fi

    echo ""
    print_info "Relay API Status:"
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Relay API is running at http://localhost:8000"
    else
        print_warning "Relay API is not responding"
    fi

    echo ""
}

# Show next steps
show_next_steps() {
    print_header "Next Steps"

    echo ""
    echo "1. Dashboard: http://localhost:3000"
    echo "2. Relay API: http://localhost:8000"
    echo "3. API Docs: http://localhost:8000/docs"
    echo ""
    echo "To stop all services:"
    echo "  docker-compose down"
    echo ""
    echo "To view logs:"
    echo "  docker-compose logs -f relay-vm"
    echo "  npm run dev  # in dashboard directory"
    echo ""
}

# Main execution
main() {
    print_header "IP-Relay Complete Startup"
    print_info "Mode: $MODE"
    print_info "With Exit Agent: $WITH_EXIT_AGENT"
    echo ""

    check_prerequisites
    setup_environment
    install_dependencies
    start_relay_vm
    start_dashboard
    start_exit_agent

    echo ""
    show_status
    show_next_steps

    print_success "All services started successfully!"
    print_info "Press Ctrl+C to stop all services"
}

# Run main
main
