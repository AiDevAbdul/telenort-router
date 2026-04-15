# IP-Relay Quick Reference

## File Structure

```
telenor-router/
├── plan.md                    # Implementation plan
├── README.md                  # Project overview
├── TESTING.md                 # Detailed testing guide
├── CHECKLIST.md               # Pre-deployment checklist
├── TROUBLESHOOTING.md         # Troubleshooting guide
├── QUICK-REFERENCE.md         # This file
│
├── relay-vm-setup.sh          # Manual GCP VM setup
├── deploy-gcp-vm.sh           # Automated GCP VM deployment
├── relay-api.py               # FastAPI service (relay VM)
├── relay-api.service          # Systemd service file
│
├── exit-agent.sh              # Exit agent script (home/office PC)
├── remote-client-setup.sh     # Remote client setup script
│
├── Dockerfile                 # Docker image for relay VM
├── docker-compose.yml         # Docker Compose configuration
│
├── requirements.txt           # Python dependencies
├── test-setup.sh              # Automated testing script
```

## Quick Start (5 minutes)

### 1. Deploy Relay VM (GCP)
```bash
# SSH into Ubuntu 22.04 VM
gcloud compute ssh ip-relay-vm --zone=us-central1-a

# Run automated deployment
curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/deploy-gcp-vm.sh
chmod +x deploy-gcp-vm.sh
./deploy-gcp-vm.sh

# Note the external IP
```

### 2. Run Exit Agent (Home/Office PC)
```bash
curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/exit-agent.sh
chmod +x exit-agent.sh
./exit-agent.sh <RELAY_VM_IP> http://<RELAY_VM_IP>:8000

# Monitor logs
tail -f /tmp/exit-agent.log
```

### 3. Connect Remote Client
```bash
curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/remote-client-setup.sh
chmod +x remote-client-setup.sh
./remote-client-setup.sh http://<RELAY_VM_IP>:8000 my-device

# Connect
sudo wg-quick up wg-client

# Verify
curl https://icanhazip.com
```

## Key Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| WireGuard | 51820 | UDP | Tunnel traffic |
| Relay API | 8000 | TCP | Config management |

## Key IPs

| Component | IP Range | Purpose |
|-----------|----------|---------|
| Relay VM | 10.0.0.1 | WireGuard hub |
| Clients | 10.0.0.2-254 | Tunnel endpoints |

## API Endpoints

```bash
# Health check
curl http://<RELAY_VM_IP>:8000/health

# Get server config
curl http://<RELAY_VM_IP>:8000/server-config

# Generate client config
curl -X POST http://<RELAY_VM_IP>:8000/generate-client-config?peer_name=my-client

# List peers
curl http://<RELAY_VM_IP>:8000/peers

# Get status
curl http://<RELAY_VM_IP>:8000/status
```

## Common Commands

### On Relay VM
```bash
# Check WireGuard
sudo wg show wg0

# Check API service
sudo systemctl status relay-api
sudo journalctl -u relay-api -f

# Restart API
sudo systemctl restart relay-api

# View config
sudo cat /etc/wireguard/wg0.conf
```

### On Exit Agent
```bash
# Check tunnel
sudo wg show wg-exit

# Check public IP
curl https://icanhazip.com

# View logs
tail -f /tmp/exit-agent.log

# Restart tunnel
sudo wg-quick down wg-exit
sudo wg-quick up wg-exit
```

### On Remote Client
```bash
# Connect
sudo wg-quick up wg-client

# Disconnect
sudo wg-quick down wg-client

# Check status
sudo wg show wg-client

# Check public IP
curl https://icanhazip.com
```

## Testing

```bash
# Run automated tests
chmod +x test-setup.sh
./test-setup.sh http://<RELAY_VM_IP>:8000 <RELAY_VM_IP>

# Manual API test
curl http://<RELAY_VM_IP>:8000/health

# Manual tunnel test
# 1. Check exit agent public IP
# 2. Check remote client public IP
# 3. They should match
```

## Success Indicators

✅ Exit agent logs show "SUCCESS: Exit agent is online"
✅ Remote client public IP = Exit agent public IP
✅ Remote client can browse websites
✅ Tunnel stable for 5+ minutes
✅ All API endpoints respond

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| API not responding | Check: `sudo systemctl status relay-api` |
| Exit agent won't connect | Check: `ping <RELAY_VM_IP>` |
| Public IP not matching | Check: Exit agent still connected |
| Tunnel drops | Check: Keep-alive is set to 25 |
| High latency | Check: Relay VM CPU/memory |

See TROUBLESHOOTING.md for detailed solutions.

## Docker Alternative

```bash
# Build and run with Docker
docker-compose up -d

# Check logs
docker logs -f ip-relay-vm

# Test API
curl http://localhost:8000/health
```

## Important Notes

- Exit agent uses `PersistentKeepalive = 25` to maintain connection through ISP firewall
- All traffic from remote client is routed through exit agent
- Public IP on remote client should match exit agent's public IP
- Tunnel IP range is hardcoded to 10.0.0.0/24
- No authentication in this testing version

## Next Steps

1. Verify all components are working (see CHECKLIST.md)
2. Run automated tests (test-setup.sh)
3. Document any issues found
4. Plan Phase 2 improvements (authentication, dashboard, database)

## Documentation Map

- **plan.md** - Architecture and implementation plan
- **README.md** - Project overview and quick start
- **TESTING.md** - Detailed testing procedures
- **CHECKLIST.md** - Pre-deployment verification
- **TROUBLESHOOTING.md** - Common issues and solutions
- **QUICK-REFERENCE.md** - This file (quick lookup)

## Support

For issues:
1. Check TROUBLESHOOTING.md
2. Review TESTING.md for setup details
3. Run test-setup.sh for automated validation
4. Check logs on all components
5. Verify prerequisites in CHECKLIST.md
