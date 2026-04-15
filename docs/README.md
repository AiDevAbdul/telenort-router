# IP-Relay Testing Solution

A minimal, hardcoded testing setup to validate the core IP-Relay concept: routing remote device traffic through a static IP exit point via WireGuard reverse tunnel.

## What This Does

- **GCP Relay VM**: Acts as the WireGuard hub, receives connections from exit agents and remote clients
- **Exit Agent**: Runs on home/office PC, establishes reverse tunnel to relay VM, provides the static IP
- **Remote Client**: Connects through the relay to route all traffic via the exit agent's static IP

## Architecture

```
Remote Client (Laptop/Mobile)
    ↓
    └─→ GCP Relay VM (WireGuard Hub)
            ↓
            └─→ Exit Agent (Home/Office PC)
                    ↓
                    └─→ Internet (shows exit agent's static IP)
```

## Files

- `relay-vm-setup.sh` - Setup script for GCP Ubuntu VM (WireGuard + IP forwarding)
- `relay-api.py` - FastAPI service to manage WireGuard peers and generate configs
- `exit-agent.sh` - Script to run on home/office PC (establishes reverse tunnel)
- `remote-client-setup.sh` - Script to set up remote device (connects through tunnel)
- `requirements.txt` - Python dependencies for relay API
- `relay-api.service` - Systemd service file for running relay API
- `TESTING.md` - Detailed testing guide with troubleshooting

## Quick Start

### 1. Set Up GCP Relay VM

```bash
# SSH into Ubuntu 22.04 LTS VM on GCP
gcloud compute ssh ip-relay-vm --zone=us-central1-a

# Run setup script
curl -O https://raw.githubusercontent.com/your-repo/relay-vm-setup.sh
chmod +x relay-vm-setup.sh
./relay-vm-setup.sh
```

### 2. Start Relay API

```bash
# Install dependencies
pip install -r requirements.txt

# Run API (or use systemd service)
python3 relay-api.py
```

API will be available at `http://<VM_IP>:8000`

### 3. Run Exit Agent (Home/Office PC)

```bash
chmod +x exit-agent.sh
./exit-agent.sh <RELAY_VM_IP> http://<RELAY_VM_IP>:8000
```

Monitor logs:
```bash
tail -f /tmp/exit-agent.log
```

### 4. Connect Remote Client

```bash
chmod +x remote-client-setup.sh
./remote-client-setup.sh http://<RELAY_VM_IP>:8000 my-laptop

# Connect to tunnel
sudo wg-quick up wg-client

# Verify public IP matches exit agent
curl https://icanhazip.com
```

## Testing

See `TESTING.md` for:
- Detailed step-by-step setup
- Testing checklist
- Troubleshooting guide
- API endpoint reference
- Success criteria

## Key Features

✅ Minimal setup - no auth, no database, no dashboard
✅ Hardcoded for testing - easy to understand and modify
✅ Cross-platform exit agent - Linux, macOS, Windows support
✅ Automatic IP verification - checks public IP via icanhazip.com
✅ Keep-alive loop - maintains tunnel connection
✅ Simple REST API - easy to test and extend

## Success Criteria

Test is successful when:
1. Exit agent connects to relay VM
2. Remote client receives WireGuard config
3. Remote client connects through tunnel
4. **Public IP on remote client = exit agent's public IP**
5. Tunnel remains stable for 5+ minutes

## Limitations (Testing Only)

- No authentication or authorization
- No persistent storage (configs generated on-the-fly)
- Single relay VM (no multi-region)
- No key rotation
- No audit logging
- Hardcoded IP ranges (10.0.0.0/24)

## Next Steps (Phase 2)

- Add authentication (Clerk/NextAuth)
- Build Next.js dashboard
- Add Neon PostgreSQL database
- Implement key rotation
- Add multi-region support
- Implement audit logging

## Troubleshooting

**Exit agent won't connect:**
```bash
curl http://<RELAY_VM_IP>:8000/health
```

**Remote client can't connect:**
```bash
sudo wg show wg-client
```

**Public IP not matching:**
```bash
# On exit agent
curl https://icanhazip.com

# On remote client
curl https://icanhazip.com
```

See `TESTING.md` for more troubleshooting steps.

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/server-config` | GET | Get relay server config |
| `/generate-client-config` | POST | Generate new client config |
| `/peers` | GET | List connected peers |
| `/status` | GET | Get WireGuard status |

## Notes

- WireGuard listens on UDP port 51820
- Relay API listens on TCP port 8000
- Client tunnel IP range: 10.0.0.0/24
- Exit agent uses `PersistentKeepalive = 25` to maintain connection through ISP firewall
