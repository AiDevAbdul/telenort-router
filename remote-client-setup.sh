#!/bin/bash
# Remote Client Setup Script
# Run on the remote device (laptop/mobile) to connect through the relay

set -e

RELAY_API_URL="${1:-}"
CLIENT_NAME="${2:-remote-client}"

if [ -z "$RELAY_API_URL" ]; then
    echo "Usage: $0 <relay_api_url> [client_name]"
    echo "Example: $0 http://35.123.45.67:8000 my-laptop"
    exit 1
fi

echo "=== Remote Client Setup ==="
echo "Relay API URL: $RELAY_API_URL"
echo "Client Name: $CLIENT_NAME"

# Install WireGuard if not present
if ! command -v wg &> /dev/null; then
    echo "Installing WireGuard..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y wireguard wireguard-tools
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install wireguard-tools
    fi
fi

# Request client config from relay API
echo "Requesting config from relay API..."
RESPONSE=$(curl -s -X POST "$RELAY_API_URL/generate-client-config?peer_name=$CLIENT_NAME")

# Extract config
CONFIG=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['config'])")

if [ -z "$CONFIG" ]; then
    echo "ERROR: Failed to get config from API"
    echo "Response: $RESPONSE"
    exit 1
fi

# Save config
CONFIG_FILE="/etc/wireguard/wg-client.conf"
echo "$CONFIG" | sudo tee "$CONFIG_FILE" > /dev/null
sudo chmod 600 "$CONFIG_FILE"

echo "Config saved to $CONFIG_FILE"
echo ""
echo "To connect, run:"
echo "  sudo wg-quick up wg-client"
echo ""
echo "To disconnect, run:"
echo "  sudo wg-quick down wg-client"
echo ""
echo "To verify public IP, run:"
echo "  curl https://icanhazip.com"
