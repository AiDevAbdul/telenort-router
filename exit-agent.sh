#!/bin/bash
# Exit Agent Script - Run on home/office PC
# Establishes reverse tunnel to GCP relay VM
# Usage: ./exit-agent.sh <relay_vm_ip> <relay_api_url>

set -e

RELAY_VM_IP="${1:-}"
RELAY_API_URL="${2:-}"
AGENT_NAME="exit-agent-$(hostname)"
LOG_FILE="/tmp/exit-agent.log"

if [ -z "$RELAY_VM_IP" ] || [ -z "$RELAY_API_URL" ]; then
    echo "Usage: $0 <relay_vm_ip> <relay_api_url>"
    echo "Example: $0 35.123.45.67 http://35.123.45.67:8000"
    exit 1
fi

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Exit Agent Starting ==="
log "Relay VM IP: $RELAY_VM_IP"
log "Relay API URL: $RELAY_API_URL"

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    SUDO="sudo"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    SUDO="sudo"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
    SUDO=""
else
    log "ERROR: Unsupported OS: $OSTYPE"
    exit 1
fi

log "Detected OS: $OS"

# Install WireGuard if not present
if ! command -v wg &> /dev/null; then
    log "Installing WireGuard..."
    if [ "$OS" = "linux" ]; then
        $SUDO apt-get update
        $SUDO apt-get install -y wireguard wireguard-tools
    elif [ "$OS" = "macos" ]; then
        brew install wireguard-tools
    fi
fi

log "WireGuard installed"

# Generate exit agent keypair
log "Generating keypair..."
PRIVATE_KEY=$(wg genkey)
PUBLIC_KEY=$(echo "$PRIVATE_KEY" | wg pubkey)

log "Public Key: $PUBLIC_KEY"

# Request client config from relay API
log "Requesting client config from relay API..."
RESPONSE=$(curl -s -X POST "$RELAY_API_URL/generate-client-config?peer_name=$AGENT_NAME")

if [ $? -ne 0 ]; then
    log "ERROR: Failed to connect to relay API"
    exit 1
fi

# Extract config from response
CLIENT_CONFIG=$(echo "$RESPONSE" | grep -o '"config":"[^"]*"' | cut -d'"' -f4 | sed 's/\\n/\n/g')
ALLOWED_IP=$(echo "$RESPONSE" | grep -o '"allowed_ip":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CLIENT_CONFIG" ]; then
    log "ERROR: Failed to parse client config from API response"
    log "Response: $RESPONSE"
    exit 1
fi

log "Received config for IP: $ALLOWED_IP"

# Create WireGuard config file
WG_CONFIG_DIR="/etc/wireguard"
WG_CONFIG_FILE="$WG_CONFIG_DIR/wg-exit.conf"

if [ "$OS" = "windows" ]; then
    WG_CONFIG_DIR="$APPDATA/WireGuard"
    WG_CONFIG_FILE="$WG_CONFIG_DIR/wg-exit.conf"
fi

log "Creating WireGuard config at $WG_CONFIG_FILE"

if [ "$OS" != "windows" ]; then
    $SUDO mkdir -p "$WG_CONFIG_DIR"
    echo "$CLIENT_CONFIG" | $SUDO tee "$WG_CONFIG_FILE" > /dev/null
    $SUDO chmod 600 "$WG_CONFIG_FILE"
else
    mkdir -p "$WG_CONFIG_DIR"
    echo "$CLIENT_CONFIG" > "$WG_CONFIG_FILE"
fi

# Bring up WireGuard interface
log "Bringing up WireGuard interface..."
if [ "$OS" = "windows" ]; then
    # Windows: use wg-quick
    wg-quick up wg-exit
else
    $SUDO wg-quick up wg-exit
fi

if [ $? -ne 0 ]; then
    log "ERROR: Failed to bring up WireGuard interface"
    exit 1
fi

log "WireGuard interface is up"

# Wait for tunnel to stabilize
sleep 3

# Verify connection
log "Verifying tunnel connection..."
if [ "$OS" = "windows" ]; then
    TUNNEL_IP=$(ipconfig | grep -A 5 "wg-exit" | grep "IPv4" | awk '{print $NF}')
else
    TUNNEL_IP=$($SUDO ip addr show wg-exit | grep "inet " | awk '{print $2}')
fi

log "Tunnel IP: $TUNNEL_IP"

# Get public IP
log "Checking public IP..."
PUBLIC_IP=$(curl -s https://icanhazip.com)
log "Public IP: $PUBLIC_IP"

# Verify public IP matches expected static IP
if [ -z "$PUBLIC_IP" ]; then
    log "WARNING: Could not determine public IP"
else
    log "SUCCESS: Exit agent is online with public IP: $PUBLIC_IP"
fi

# Keep-alive loop
log "Starting keep-alive loop..."
while true; do
    sleep 30

    # Check if tunnel is still up
    if [ "$OS" = "windows" ]; then
        if ! wg show wg-exit > /dev/null 2>&1; then
            log "WARNING: Tunnel down, attempting to reconnect..."
            wg-quick up wg-exit
        fi
    else
        if ! $SUDO wg show wg-exit > /dev/null 2>&1; then
            log "WARNING: Tunnel down, attempting to reconnect..."
            $SUDO wg-quick up wg-exit
        fi
    fi

    # Log status
    CURRENT_IP=$(curl -s https://icanhazip.com)
    log "Keep-alive check - Public IP: $CURRENT_IP"
done
