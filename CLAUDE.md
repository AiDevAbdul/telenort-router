# IP-Relay Testing Solution - Project Context

## Project Overview
Building IP-Relay: a SaaS platform routing remote device traffic through a static IP at home/office via WireGuard reverse tunnels on GCP relay VM. Current phase: minimal testing solution (no auth, no DB, no dashboard).

## Architecture
```
Remote Client → GCP Relay VM (WireGuard Hub) → Exit Agent → Internet
```
- Exit agent's public IP becomes the "static IP" for remote clients
- WireGuard encryption throughout, keep-alive every 25 seconds
- Tunnel IP range: 10.0.0.0/24

## Core Components
- **relay-api.py**: FastAPI service on GCP VM (port 8000) for peer management
- **exit-agent.sh**: Cross-platform script (Linux/macOS/Windows) establishing reverse tunnel
- **remote-client-setup.sh**: Client setup script connecting through relay
- **deploy-gcp-vm.sh**: Automated GCP deployment (recommended)

## Key Technical Details
- WireGuard port: 51820/UDP
- Relay API port: 8000/TCP
- Keep-alive: 25 seconds (maintains through ISP firewall)
- Max peers: 254 per subnet (10.0.0.0/24)
- Encryption: ChaCha20-Poly1305 (WireGuard default)

## Documentation Structure
All docs in `/docs` directory:
- `00-START-HERE.md` - Main entry point
- `GETTING-STARTED.md` - 40-min setup guide
- `ARCHITECTURE.md` - Technical details with diagrams
- `TROUBLESHOOTING.md` - Common issues & solutions
- `QUICK-REFERENCE.md` - Commands & endpoints
- `TESTING.md` - Testing procedures
- `plan.md` - Implementation strategy
- `INDEX.md` - Master navigation

## Deployment Options
1. **Automated** (15 min): `./deploy-gcp-vm.sh`
2. **Docker** (10 min): `docker-compose up -d`
3. **Manual** (20 min): `./relay-vm-setup.sh`

## Testing Flow
1. Deploy relay VM → 2. Run exit agent → 3. Connect remote client → 4. Verify public IPs match → 5. Run automated tests

## Success Criteria
- Exit agent connects & maintains connection
- Remote client public IP = Exit agent public IP
- Tunnel stable for 5+ minutes
- All automated tests pass

## Phase 2 (Future)
Add authentication (Clerk/NextAuth), Next.js dashboard, Neon PostgreSQL, key rotation, multi-region support.

## Important Notes
- Testing only (not production-ready)
- No authentication/database/dashboard yet
- Single region, hardcoded IPs (Phase 2)
- Cross-platform exit agent support

## File Organization Rules
- **Root level**: Only code, deployment, context, and original spec files
- **Documentation**: ALL .md files (except CLAUDE.md and spec.md) MUST be in `/docs` directory
- **Never create .md files in root** - always use `/docs` directory
- Keep root clean: only .py, .sh, .yml, .txt, Dockerfile, .service, CLAUDE.md, spec.md
