#!/bin/bash
set -e

# IP-Relay VM Startup Script
# Deploys relay-api.py and configures WireGuard

echo "[$(date)] Starting IP-Relay VM initialization..."

# Update system
apt-get update
apt-get upgrade -y

# Install dependencies
apt-get install -y \
  python3.11 \
  python3-pip \
  python3-venv \
  wireguard \
  wireguard-tools \
  curl \
  git \
  ufw \
  htop \
  net-tools

echo "[$(date)] Dependencies installed"

# Create app directory
mkdir -p /opt/ip-relay
cd /opt/ip-relay

# Clone repository (or download specific files)
git clone https://github.com/AiDevAbdul/telenort-router.git .
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "[$(date)] Python dependencies installed"

# Create environment file
cat > .env.local << EOF
DATABASE_URL=${database_url}
CLERK_SECRET_KEY=${clerk_secret_key}
ENVIRONMENT=${environment}
RELAY_REGION=${region}
RELAY_API_PORT=8000
WIREGUARD_PORT=51820
EOF

echo "[$(date)] Environment configured"

# Initialize database (only on primary region)
if [ "${region}" = "us-central1" ]; then
  echo "[$(date)] Initializing database..."
  python3 init_db.py
fi

# Configure WireGuard
echo "[$(date)] Configuring WireGuard..."
umask 077
mkdir -p /etc/wireguard

# Generate WireGuard keys
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey

# Create WireGuard configuration
cat > /etc/wireguard/wg0.conf << 'WGEOF'
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = $(cat /etc/wireguard/privatekey)
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
WGEOF

# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

echo "[$(date)] WireGuard configured and started"

# Create systemd service for relay API
cat > /etc/systemd/system/relay-api.service << 'SVCEOF'
[Unit]
Description=IP-Relay API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ip-relay/backend
Environment="PATH=/opt/ip-relay/backend/venv/bin"
ExecStart=/opt/ip-relay/backend/venv/bin/python3 relay-api.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SVCEOF

# Enable and start relay API service
systemctl daemon-reload
systemctl enable relay-api
systemctl start relay-api

echo "[$(date)] Relay API service started"

# Configure firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 8000/tcp
ufw allow 51820/udp

echo "[$(date)] Firewall configured"

# Health check endpoint
curl -f http://localhost:8000/health || echo "Health check pending..."

echo "[$(date)] IP-Relay VM initialization complete!"
