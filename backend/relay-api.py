#!/usr/bin/env python3
"""
Relay API - FastAPI service with database integration
Manages WireGuard peers, tunnels, and exit agents
Run on GCP relay VM
"""

import subprocess
import json
import os
import platform
from pathlib import Path
from datetime import datetime
from typing import Optional
import uuid
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uvicorn

from db_config import engine, SessionLocal, Base
from models import User, Tunnel, ExitAgent, APIKey, ConnectionLog

# Load environment variables
load_dotenv(".env.local")

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IP-Relay API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WG_INTERFACE = "wg0"

# Multi-region configuration
RELAY_REGION = os.getenv("RELAY_REGION", "us-central1")
RELAY_API_PORT = int(os.getenv("RELAY_API_PORT", "8000"))
WIREGUARD_PORT = int(os.getenv("WIREGUARD_PORT", "51820"))

# Region metadata
REGION_METADATA = {
    "us-central1": {
        "name": "North America (US Central)",
        "country": "USA",
        "latency_target_ms": 50
    },
    "europe-west1": {
        "name": "Europe (West)",
        "country": "Belgium",
        "latency_target_ms": 50
    },
    "asia-southeast1": {
        "name": "Asia-Pacific (Southeast)",
        "country": "Singapore",
        "latency_target_ms": 50
    }
}

# Platform-specific paths
if platform.system() == "Windows":
    KEYS_DIR = Path.home() / ".wireguard" / "keys"
    WG_CONFIG_PATH = Path.home() / ".wireguard" / "wg0.conf"
else:
    KEYS_DIR = Path("/etc/wireguard/keys")
    WG_CONFIG_PATH = Path("/etc/wireguard/wg0.conf")

KEYS_DIR.mkdir(parents=True, exist_ok=True)

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
    created_at: str

class ExitAgentCreate(BaseModel):
    name: str
    tunnel_id: str

class ExitAgentResponse(BaseModel):
    id: str
    name: str
    public_ip: Optional[str]
    status: str
    created_at: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    subscription_tier: str

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    """Extract user from Clerk token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")

        # For now, extract clerk_id from token (in production, verify JWT)
        # Token format: "clerk_<user_id>"
        if not token.startswith("clerk_"):
            raise HTTPException(status_code=401, detail="Invalid token format")

        clerk_id = token
        user = db.query(User).filter(User.clerk_id == clerk_id).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

# WireGuard utilities
def get_server_keys():
    """Read server keys from disk"""
    private_key_path = KEYS_DIR / "server_private.key"
    public_key_path = KEYS_DIR / "server_public.key"

    if not private_key_path.exists() or not public_key_path.exists():
        try:
            private_key = subprocess.check_output(['wg', 'genkey']).decode().strip()
            public_key = subprocess.check_output(
                ['wg', 'pubkey'],
                input=private_key.encode()
            ).decode().strip()
            private_key_path.write_text(private_key)
            public_key_path.write_text(public_key)
        except Exception as e:
            print(f"Warning: Could not generate WireGuard keys: {e}")
            return "dummy_private_key", "dummy_public_key"

    with open(private_key_path, 'r') as f:
        private_key = f.read().strip()
    with open(public_key_path, 'r') as f:
        public_key = f.read().strip()

    return private_key, public_key

def generate_keypair():
    """Generate a new WireGuard keypair"""
    try:
        private_key = subprocess.check_output(['wg', 'genkey']).decode().strip()
        public_key = subprocess.check_output(
            ['wg', 'pubkey'],
            input=private_key.encode()
        ).decode().strip()
        return private_key, public_key
    except Exception as e:
        print(f"Warning: Could not generate WireGuard keypair: {e}")
        dummy_key = str(uuid.uuid4())[:32]
        return dummy_key, dummy_key

def get_next_peer_ip(db: Session, tunnel_id: str):
    """Get next available IP in tunnel's range"""
    tunnel = db.query(Tunnel).filter(Tunnel.id == tunnel_id).first()
    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel not found")

    # Count existing exit agents for this tunnel
    agent_count = db.query(ExitAgent).filter(ExitAgent.tunnel_id == tunnel_id).count()
    ip_num = agent_count + 2

    if ip_num > 254:
        raise HTTPException(status_code=400, detail="Tunnel IP range exhausted")

    return f"10.0.0.{ip_num}/32"

def add_peer_to_wg(peer_public_key: str, allowed_ip: str):
    """Add peer to WireGuard interface"""
    try:
        if platform.system() == "Windows":
            subprocess.run(
                ['wg', 'set', WG_INTERFACE, 'peer', peer_public_key,
                 'allowed-ips', allowed_ip],
                check=True
            )
        else:
            subprocess.run(
                ['sudo', 'wg', 'set', WG_INTERFACE, 'peer', peer_public_key,
                 'allowed-ips', allowed_ip],
                check=True
            )
        return True
    except Exception as e:
        print(f"Warning: Could not add peer to WireGuard: {e}")
        return True

# Public endpoints
@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/server-config")
def get_server_config():
    """Get server public key, endpoint, and region info"""
    try:
        _, public_key = get_server_keys()
        try:
            if platform.system() == "Windows":
                server_ip = "127.0.0.1"
            else:
                result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
                server_ip = result.stdout.strip().split()[0]
        except:
            server_ip = "127.0.0.1"

        region_info = REGION_METADATA.get(RELAY_REGION, {
            "name": RELAY_REGION,
            "country": "Unknown",
            "latency_target_ms": 100
        })

        return {
            "server_public_key": public_key,
            "server_ip": server_ip,
            "listen_port": WIREGUARD_PORT,
            "server_tunnel_ip": "10.0.0.1",
            "region": RELAY_REGION,
            "region_name": region_info["name"],
            "country": region_info["country"],
            "api_port": RELAY_API_PORT,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Region endpoints
@app.get("/regions")
def list_regions():
    """List all available relay regions"""
    return {
        "regions": [
            {
                "id": region_id,
                "name": info["name"],
                "country": info["country"],
                "latency_target_ms": info["latency_target_ms"]
            }
            for region_id, info in REGION_METADATA.items()
        ]
    }

@app.get("/regions/{region_id}")
def get_region_info(region_id: str):
    """Get info about a specific region"""
    if region_id not in REGION_METADATA:
        raise HTTPException(status_code=404, detail="Region not found")

    info = REGION_METADATA[region_id]
    return {
        "id": region_id,
        "name": info["name"],
        "country": info["country"],
        "latency_target_ms": info["latency_target_ms"]
    }

# User endpoints
@app.get("/users/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "subscription_tier": current_user.subscription_tier
    }

# Tunnel endpoints
@app.get("/tunnels")
def list_tunnels(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List user's tunnels"""
    tunnels = db.query(Tunnel).filter(Tunnel.user_id == current_user.id).all()
    return {
        "tunnels": [
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
    }

@app.post("/tunnels", response_model=dict)
def create_tunnel(
    tunnel_data: TunnelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new tunnel"""
    try:
        tunnel = Tunnel(
            user_id=current_user.id,
            name=tunnel_data.name,
            relay_region=tunnel_data.relay_region,
            tunnel_ip_range="10.0.0.0/24",
            is_active=True
        )
        db.add(tunnel)
        db.commit()
        db.refresh(tunnel)

        # Log creation
        log = ConnectionLog(
            tunnel_id=tunnel.id,
            event="tunnel_created",
            details={"name": tunnel.name, "region": tunnel.relay_region}
        )
        db.add(log)
        db.commit()

        return {
            "id": str(tunnel.id),
            "name": tunnel.name,
            "relay_region": tunnel.relay_region,
            "tunnel_ip_range": tunnel.tunnel_ip_range,
            "is_active": tunnel.is_active,
            "created_at": tunnel.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tunnels/{tunnel_id}")
def get_tunnel(
    tunnel_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tunnel details"""
    tunnel = db.query(Tunnel).filter(
        Tunnel.id == tunnel_id,
        Tunnel.user_id == current_user.id
    ).first()

    if not tunnel:
        raise HTTPException(status_code=404, detail="Tunnel not found")

    return {
        "id": str(tunnel.id),
        "name": tunnel.name,
        "relay_region": tunnel.relay_region,
        "tunnel_ip_range": tunnel.tunnel_ip_range,
        "is_active": tunnel.is_active,
        "created_at": tunnel.created_at.isoformat()
    }

@app.delete("/tunnels/{tunnel_id}")
def delete_tunnel(
    tunnel_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a tunnel"""
    try:
        tunnel = db.query(Tunnel).filter(
            Tunnel.id == tunnel_id,
            Tunnel.user_id == current_user.id
        ).first()

        if not tunnel:
            raise HTTPException(status_code=404, detail="Tunnel not found")

        db.delete(tunnel)
        db.commit()

        return {"status": "deleted", "id": tunnel_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-client-config")
def generate_client_config(
    tunnel_id: str,
    peer_name: str = "client",
    preferred_region: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate WireGuard client config with region awareness"""
    try:
        tunnel = db.query(Tunnel).filter(
            Tunnel.id == tunnel_id,
            Tunnel.user_id == current_user.id
        ).first()

        if not tunnel:
            raise HTTPException(status_code=404, detail="Tunnel not found")

        # Use preferred region or tunnel's configured region
        target_region = preferred_region or tunnel.relay_region
        if target_region not in REGION_METADATA:
            target_region = tunnel.relay_region

        private_key, public_key = generate_keypair()
        allowed_ip = get_next_peer_ip(db, tunnel_id)

        add_peer_to_wg(public_key, allowed_ip)

        _, server_public = get_server_keys()
        try:
            if platform.system() == "Windows":
                server_ip = "127.0.0.1"
            else:
                result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
                server_ip = result.stdout.strip().split()[0]
        except:
            server_ip = "127.0.0.1"

        client_config = f"""[Interface]
Address = {allowed_ip.split('/')[0]}/24
PrivateKey = {private_key}
DNS = 8.8.8.8

[Peer]
PublicKey = {server_public}
Endpoint = {server_ip}:{WIREGUARD_PORT}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
"""

        config_path = KEYS_DIR / f"{peer_name}.conf"
        config_path.write_text(client_config)

        # Log config generation
        log = ConnectionLog(
            tunnel_id=tunnel.id,
            event="client_config_generated",
            details={
                "peer_name": peer_name,
                "region": target_region,
                "allowed_ip": allowed_ip
            }
        )
        db.add(log)
        db.commit()

        return {
            "peer_name": peer_name,
            "public_key": public_key,
            "private_key": private_key,
            "allowed_ip": allowed_ip,
            "config": client_config,
            "region": target_region,
            "server_ip": server_ip,
            "wireguard_port": WIREGUARD_PORT,
            "status": "created"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Exit Agent endpoints
@app.get("/exit-agents")
def list_exit_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's exit agents"""
    agents = db.query(ExitAgent).filter(ExitAgent.user_id == current_user.id).all()
    return {
        "exit_agents": [
            {
                "id": str(a.id),
                "name": a.name,
                "public_ip": a.public_ip,
                "status": a.status,
                "created_at": a.created_at.isoformat()
            }
            for a in agents
        ]
    }

@app.post("/exit-agents", response_model=dict)
def create_exit_agent(
    agent_data: ExitAgentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a new exit agent"""
    try:
        tunnel = db.query(Tunnel).filter(
            Tunnel.id == agent_data.tunnel_id,
            Tunnel.user_id == current_user.id
        ).first()

        if not tunnel:
            raise HTTPException(status_code=404, detail="Tunnel not found")

        agent = ExitAgent(
            user_id=current_user.id,
            tunnel_id=tunnel.id,
            name=agent_data.name,
            status="pending"
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)

        return {
            "id": str(agent.id),
            "name": agent.name,
            "public_ip": agent.public_ip,
            "status": agent.status,
            "created_at": agent.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/exit-agents/{agent_id}")
def delete_exit_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an exit agent"""
    try:
        agent = db.query(ExitAgent).filter(
            ExitAgent.id == agent_id,
            ExitAgent.user_id == current_user.id
        ).first()

        if not agent:
            raise HTTPException(status_code=404, detail="Exit agent not found")

        db.delete(agent)
        db.commit()

        return {"status": "deleted", "id": agent_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
