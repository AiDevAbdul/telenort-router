#!/bin/bash
# GCP Relay VM Setup Script
# Run on Ubuntu 22.04 LTS

set -e

echo "=== IP-Relay GCP VM Setup ==="

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install WireGuard
sudo apt-get install -y wireguard wireguard-tools

# Install Python and dependencies for API
sudo apt-get install -y python3 python3-pip python3-venv

# Enable IP forwarding
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Configure iptables for NAT/masquerading
# This will be applied when WireGuard interface is up
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i wg0 -o eth0 -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o wg0 -m state --state RELATED,ESTABLISHED -j ACCEPT

# Save iptables rules (persist across reboot)
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

# Create WireGuard config directory
sudo mkdir -p /etc/wireguard
sudo chmod 700 /etc/wireguard

# Generate server keys
cd /etc/wireguard
sudo wg genkey | sudo tee server_private.key | wg pubkey | sudo tee server_public.key
sudo chmod 600 server_private.key

echo "=== WireGuard Keys Generated ==="
echo "Server Private Key:"
sudo cat server_private.key
echo ""
echo "Server Public Key:"
sudo cat server_public.key

# Create basic WireGuard config
sudo tee /etc/wireguard/wg0.conf > /dev/null <<EOF
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = $(sudo cat server_private.key)

# Peers will be added dynamically
EOF

sudo chmod 600 /etc/wireguard/wg0.conf

# Enable and start WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

echo "=== WireGuard Started ==="
sudo wg show

# Create API directory
mkdir -p ~/relay-api
cd ~/relay-api

echo "=== Setup Complete ==="
echo "Next: Deploy relay-api.py to ~/relay-api/"
