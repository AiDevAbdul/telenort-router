#!/usr/bin/env python3
"""
Relay API v2 - Phase 2 with authentication and database
Manages WireGuard peers with user accounts and multi-tunnel support
Run on GCP relay VM
"""

import subprocess
import json
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uvicorn

from db_config import engine, get_db, Base
from models import User, Tunnel, ExitAgent, APIKey, ConnectionLog
from auth import get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IP-Relay API v2", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WG_INTERFACE = "wg0"
WG_CONFIG_PATH = "/etc/wireguard/wg0.conf"
KEYS_DIR = "/etc/wireguard/keys"

Path(KEYS_DIR).mkdir(exist_ok=True, mode=0o700)

# Pydantic models
class TunnelCreate(BaseModel):
    name: str
    relay_region: str = "us-central1"

class TunnelResponse(BaseModel):
    id: str
    name: str
    relay_region: str
    tunnel_ip_range: str
    is_active: bool

class ExitAgentRegister(BaseModel):
    tunnel_id: str
    name: str
    public_key: str

class ExitAgentResponse(BaseModel):
    id: str
    name: str
    public_ip: str
    status: str
    tunnel_ip: str

class ClientConfigRequest(BaseModel):
    tunnel_id: str
    client_name: str = "client"

# Helper functions
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

def get_next_peer_ip(tunnel_ip_range: str = "10.0.0.0/24"):
    """Get next available IP in tunnel range"""
    result = subprocess.run(['wg', 'show', WG_INTERFACE, 'peers'],
                          capture_output=True, text=True)
    peers = result.stdout.strip().split('\n') if result.stdout.strip() else []
    peer_count = len([p for p in peers if p])

    # Extract base IP from range (e.g., "10.0.0" from "10.0.0.0/24")
    base_ip = '.'.join(tunnel_ip_range.split('.')[:-1])
    # Start from .2 (assuming .1 is server)
    return f"{base_ip}.{2 + peer_count}/32"

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

# Public endpoints (no auth required)
@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok", "version": "2.0.0"}

@app.get("/server-config")
def get_server_config():
    """Get server public key and endpoint"""
    try:
        _, public_key = get_server_keys()
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

# Protected endpoints (require authentication)
@app.get("/users/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "subscription_tier": current_user.subscription_tier,
        "created_at": current_user.created_at.isoformat()
    }

@app.get("/tunnels")
async def list_tunnels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's tunnels"""
    tunnels = db.query(Tunnel).filter(Tunnel.user_id == current_user.id).all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "relay_region": t.relay_region,
            "tunnel_ip_range": t.tunnel_ip_range,
            "is_active": t.is_active,
            "created_at": t.created_at.isoformat()
        }
        for t in tunnels
    ]

@app.post("/tunnels")
async def create_tunnel(
    tunnel: TunnelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new tunnel"""
    new_tunnel = Tunnel(
        user_id=current_user.id,
        name=tunnel.name,
        relay_region=tunnel.relay_region
    )
    db.add(new_tunnel)
    db.commit()
    db.refresh(new_tunnel)

    # Log creation
    log = ConnectionLog(
        tunnel_id=new_tunnel.id,
        event="tunnel_created",
        details={"name": tunnel.name}
    )
    db.add(log)
    db.commit()

    return {
        "id": str(new_tunnel.id),
        "name": new_tunnel.name,
        "relay_region": new_tunnel.relay_region,
        "tunnel_ip_range": new_tunnel.tunnel_ip_range,
        "is_active": new_tunnel.is_active
    }

@app.post("/exit-agents/register")
async def register_exit_agent(
    agent: ExitAgentRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register exit agent for tunnel"""
    # Verify tunnel belongs to user
    tunnel = db.query(Tunnel).filter(
        Tunnel.id == agent.tunnel_id,
        Tunnel.user_id == current_user.id
    ).first()

    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel not found")

    # Get next available IP
    tunnel_ip = get_next_peer_ip(tunnel.tunnel_ip_range)

    # Add to WireGuard
    if not add_peer_to_wg(agent.public_key, tunnel_ip):
        raise HTTPException(status_code=500, detail="Failed to add peer to WireGuard")

    # Create exit agent record
    exit_agent = ExitAgent(
        user_id=current_user.id,
        tunnel_id=tunnel.id,
        name=agent.name,
        status="online",
        public_ip="pending"
    )
    db.add(exit_agent)
    db.commit()
    db.refresh(exit_agent)

    # Log registration
    log = ConnectionLog(
        tunnel_id=tunnel.id,
        event="exit_agent_registered",
        details={"agent_name": agent.name, "tunnel_ip": tunnel_ip}
    )
    db.add(log)
    db.commit()

    return {
        "id": str(exit_agent.id),
        "name": exit_agent.name,
        "status": exit_agent.status,
        "tunnel_ip": tunnel_ip,
        "message": "Exit agent registered successfully"
    }

@app.post("/generate-client-config")
async def generate_client_config(
    request: ClientConfigRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate WireGuard client config for tunnel"""
    # Verify tunnel belongs to user
    tunnel = db.query(Tunnel).filter(
        Tunnel.id == request.tunnel_id,
        Tunnel.user_id == current_user.id
    ).first()

    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel not found")

    try:
        private_key, public_key = generate_keypair()
        allowed_ip = get_next_peer_ip(tunnel.tunnel_ip_range)

        # Add peer to WireGuard
        if not add_peer_to_wg(public_key, allowed_ip):
            raise HTTPException(status_code=500, detail="Failed to add peer to WireGuard")

        # Get server config
        _, server_public = get_server_keys()
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
        config_path = f"{KEYS_DIR}/{request.client_name}.conf"
        with open(config_path, 'w') as f:
            f.write(client_config)
        os.chmod(config_path, 0o600)

        # Log config generation
        log = ConnectionLog(
            tunnel_id=tunnel.id,
            event="client_config_generated",
            details={"client_name": request.client_name, "tunnel_ip": allowed_ip}
        )
        db.add(log)
        db.commit()

        return {
            "client_name": request.client_name,
            "public_key": public_key,
            "private_key": private_key,
            "allowed_ip": allowed_ip,
            "config": client_config,
            "status": "created"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/peers")
async def list_peers(current_user: User = Depends(get_current_user)):
    """List all connected peers"""
    try:
        result = subprocess.run(['sudo', 'wg', 'show', WG_INTERFACE],
                              capture_output=True, text=True)
        return {"peers_output": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_status(current_user: User = Depends(get_current_user)):
    """Get WireGuard interface status"""
    try:
        result = subprocess.run(['sudo', 'wg', 'show', WG_INTERFACE],
                              capture_output=True, text=True)
        return {"status": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
