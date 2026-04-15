#!/usr/bin/env python3
"""
Relay API - Simple service to manage WireGuard peers
Run on GCP relay VM
"""

import subprocess
import json
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI()

WG_INTERFACE = "wg0"
WG_CONFIG_PATH = "/etc/wireguard/wg0.conf"
KEYS_DIR = "/etc/wireguard/keys"

# Ensure keys directory exists
Path(KEYS_DIR).mkdir(exist_ok=True, mode=0o700)

class PeerRequest(BaseModel):
    peer_name: str
    public_key: str

class PeerResponse(BaseModel):
    peer_name: str
    public_key: str
    allowed_ip: str
    status: str

def get_server_keys():
    """Read server keys from disk"""
    private_key_path = "/etc/wireguard/server_private.key"
    public_key_path = "/etc/wireguard/server_public.key"

    with open(private_key_path, 'r') as f:
        private_key = f.read().strip()
    with open(public_key_path, 'r') as f:
        public_key = f.read().strip()

    return private_key, public_key

def generate_keypair():
    """Generate a new WireGuard keypair"""
    private_key = subprocess.check_output(['wg', 'genkey']).decode().strip()
    public_key = subprocess.check_output(
        ['wg', 'pubkey'],
        input=private_key.encode()
    ).decode().strip()
    return private_key, public_key

def get_next_peer_ip():
    """Get next available IP in 10.0.0.0/24 range"""
    # Simple approach: read existing peers and increment
    result = subprocess.run(['wg', 'show', WG_INTERFACE, 'peers'],
                          capture_output=True, text=True)
    peers = result.stdout.strip().split('\n') if result.stdout.strip() else []
    peer_count = len([p for p in peers if p])

    # Start from 10.0.0.2 (10.0.0.1 is server)
    return f"10.0.0.{2 + peer_count}/32"

def add_peer_to_wg(peer_public_key: str, allowed_ip: str):
    """Add peer to WireGuard interface"""
    try:
        subprocess.run(
            ['sudo', 'wg', 'set', WG_INTERFACE, 'peer', peer_public_key,
             'allowed-ips', allowed_ip],
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error adding peer: {e}")
        return False

@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/server-config")
def get_server_config():
    """Get server public key and endpoint"""
    try:
        _, public_key = get_server_keys()
        # Get server's public IP (you'll need to set this manually or via metadata)
        result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
        server_ip = result.stdout.strip().split()[0]

        return {
            "server_public_key": public_key,
            "server_ip": server_ip,
            "listen_port": 51820,
            "server_tunnel_ip": "10.0.0.1"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-client-config")
def generate_client_config(peer_name: str = "client"):
    """Generate a complete WireGuard client config"""
    try:
        private_key, public_key = generate_keypair()
        allowed_ip = get_next_peer_ip()

        # Add peer to WireGuard
        if not add_peer_to_wg(public_key, allowed_ip):
            raise HTTPException(status_code=500, detail="Failed to add peer to WireGuard")

        # Get server config
        server_private, server_public = get_server_keys()
        result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
        server_ip = result.stdout.strip().split()[0]

        # Generate client config
        client_config = f"""[Interface]
Address = {allowed_ip.split('/')[0]}/24
PrivateKey = {private_key}
DNS = 8.8.8.8

[Peer]
PublicKey = {server_public}
Endpoint = {server_ip}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
"""

        # Save config for reference
        config_path = f"{KEYS_DIR}/{peer_name}.conf"
        with open(config_path, 'w') as f:
            f.write(client_config)
        os.chmod(config_path, 0o600)

        return {
            "peer_name": peer_name,
            "public_key": public_key,
            "private_key": private_key,
            "allowed_ip": allowed_ip,
            "config": client_config,
            "status": "created"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/peers")
def list_peers():
    """List all connected peers"""
    try:
        result = subprocess.run(['sudo', 'wg', 'show', WG_INTERFACE],
                              capture_output=True, text=True)
        return {"peers_output": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
def get_status():
    """Get WireGuard interface status"""
    try:
        result = subprocess.run(['sudo', 'wg', 'show', WG_INTERFACE],
                              capture_output=True, text=True)
        return {"status": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
