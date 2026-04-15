#!/bin/bash
# Automated GCP VM Deployment Script
# Sets up relay VM, installs dependencies, and starts the API service

set -e

echo "=== IP-Relay GCP VM Automated Deployment ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Update system
log_info "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Install WireGuard
log_info "Installing WireGuard..."
sudo apt-get install -y wireguard wireguard-tools

# Step 3: Install Python and dependencies
log_info "Installing Python and dependencies..."
sudo apt-get install -y python3 python3-pip python3-venv curl

# Step 4: Enable IP forwarding
log_info "Enabling IP forwarding..."
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Step 5: Configure iptables for NAT
log_info "Configuring iptables for NAT..."
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i wg0 -o eth0 -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o wg0 -m state --state RELATED,ESTABLISHED -j ACCEPT

# Step 6: Persist iptables rules
log_info "Persisting iptables rules..."
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

# Step 7: Create WireGuard config directory
log_info "Creating WireGuard configuration..."
sudo mkdir -p /etc/wireguard
sudo chmod 700 /etc/wireguard

# Step 8: Generate WireGuard keys
log_info "Generating WireGuard keys..."
cd /etc/wireguard
sudo wg genkey | sudo tee server_private.key | wg pubkey | sudo tee server_public.key
sudo chmod 600 server_private.key

SERVER_PRIVATE=$(sudo cat server_private.key)

# Step 9: Create WireGuard config
log_info "Creating WireGuard interface config..."
sudo tee /etc/wireguard/wg0.conf > /dev/null <<EOF
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = $SERVER_PRIVATE
EOF

sudo chmod 600 /etc/wireguard/wg0.conf

# Step 10: Enable and start WireGuard
log_info "Starting WireGuard..."
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Step 11: Create relay API directory
log_info "Setting up relay API..."
mkdir -p ~/relay-api
cd ~/relay-api

# Step 12: Create Python virtual environment
log_info "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Step 13: Install Python dependencies
log_info "Installing Python dependencies..."
pip install --upgrade pip
pip install fastapi==0.104.1 uvicorn==0.24.0 pydantic==2.5.0

# Step 14: Copy relay API script (assumes it's in current directory)
log_info "Copying relay API script..."
if [ -f "relay-api.py" ]; then
    log_info "relay-api.py already exists"
else
    log_warn "relay-api.py not found in current directory"
    log_info "Please copy relay-api.py to ~/relay-api/"
fi

# Step 15: Set up systemd service
log_info "Setting up systemd service..."
sudo tee /etc/systemd/system/relay-api.service > /dev/null <<'EOF'
[Unit]
Description=IP-Relay API Service
After=network.target wg-quick@wg0.service
Wants=wg-quick@wg0.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/relay-api
Environment="PATH=/root/relay-api/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/root/relay-api/venv/bin/python3 /root/relay-api/relay-api.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable relay-api

# Step 16: Start relay API service
log_info "Starting relay API service..."
sudo systemctl start relay-api

# Step 17: Verify setup
log_info "Verifying setup..."
sleep 2

if sudo systemctl is-active --quiet relay-api; then
    log_info "Relay API service is running"
else
    log_error "Relay API service failed to start"
    sudo systemctl status relay-api
    exit 1
fi

if sudo wg show wg0 > /dev/null 2>&1; then
    log_info "WireGuard interface is up"
else
    log_error "WireGuard interface is not up"
    exit 1
fi

# Step 18: Display summary
log_info "=== Deployment Complete ==="
echo ""
echo "Server Configuration:"
echo "  WireGuard Interface: wg0"
echo "  WireGuard Port: 51820"
echo "  Relay API Port: 8000"
echo "  Tunnel IP Range: 10.0.0.0/24"
echo ""
echo "Server Keys:"
echo "  Private Key: $(sudo cat /etc/wireguard/server_private.key)"
echo "  Public Key: $(sudo cat /etc/wireguard/server_public.key)"
echo ""
echo "Get your external IP:"
echo "  curl https://icanhazip.com"
echo ""
echo "Test the API:"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:8000/server-config"
echo ""
echo "View logs:"
echo "  sudo journalctl -u relay-api -f"
echo ""
log_info "Ready for exit agent and remote client connections!"
