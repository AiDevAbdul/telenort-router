# IP-Relay Testing Checklist

## Pre-Deployment

- [ ] GCP account created and billing enabled
- [ ] Compute Engine API enabled
- [ ] SSH key configured for GCP access
- [ ] Ubuntu 22.04 LTS VM image available
- [ ] Local machine has WireGuard installed
- [ ] Docker installed (for Docker deployment option)
- [ ] All scripts downloaded and made executable

## GCP Relay VM Deployment

### Option A: Automated Deployment
- [ ] SSH into GCP VM
- [ ] Download `deploy-gcp-vm.sh`
- [ ] Run: `chmod +x deploy-gcp-vm.sh && ./deploy-gcp-vm.sh`
- [ ] Wait for deployment to complete
- [ ] Verify: `curl http://localhost:8000/health`
- [ ] Note the external IP address

### Option B: Docker Deployment
- [ ] Clone repository locally
- [ ] Run: `docker-compose up -d`
- [ ] Wait for container to start
- [ ] Verify: `curl http://localhost:8000/health`

### Option C: Manual Deployment
- [ ] SSH into GCP VM
- [ ] Run: `chmod +x relay-vm-setup.sh && ./relay-vm-setup.sh`
- [ ] Install Python dependencies: `pip install -r requirements.txt`
- [ ] Copy `relay-api.py` to VM
- [ ] Copy `relay-api.service` to `/etc/systemd/system/`
- [ ] Enable service: `sudo systemctl enable relay-api`
- [ ] Start service: `sudo systemctl start relay-api`
- [ ] Verify: `sudo systemctl status relay-api`

## Relay API Verification

- [ ] Health endpoint responds: `curl http://<RELAY_VM_IP>:8000/health`
- [ ] Server config available: `curl http://<RELAY_VM_IP>:8000/server-config`
- [ ] Can generate client config: `curl -X POST http://<RELAY_VM_IP>:8000/generate-client-config?peer_name=test`
- [ ] Peers endpoint works: `curl http://<RELAY_VM_IP>:8000/peers`
- [ ] Status endpoint works: `curl http://<RELAY_VM_IP>:8000/status`

## Exit Agent Setup (Home/Office PC)

- [ ] Download `exit-agent.sh`
- [ ] Make executable: `chmod +x exit-agent.sh`
- [ ] Run: `./exit-agent.sh <RELAY_VM_IP> http://<RELAY_VM_IP>:8000`
- [ ] Monitor logs: `tail -f /tmp/exit-agent.log`
- [ ] Verify WireGuard interface is up: `sudo wg show wg-exit`
- [ ] Check tunnel IP: `ip addr show wg-exit` (Linux) or `ipconfig` (Windows)
- [ ] Verify public IP: `curl https://icanhazip.com`
- [ ] Note the public IP (this is your "static IP")

## Remote Client Setup

- [ ] Download `remote-client-setup.sh`
- [ ] Make executable: `chmod +x remote-client-setup.sh`
- [ ] Run: `./remote-client-setup.sh http://<RELAY_VM_IP>:8000 my-device`
- [ ] Connect to tunnel: `sudo wg-quick up wg-client`
- [ ] Verify tunnel is up: `sudo wg show wg-client`
- [ ] Check tunnel IP: `ip addr show wg-client`
- [ ] Check public IP: `curl https://icanhazip.com`

## Validation Tests

- [ ] Exit agent public IP = Remote client public IP
- [ ] Remote client can browse websites
- [ ] Tunnel remains stable for 5+ minutes
- [ ] Exit agent logs show keep-alive checks
- [ ] No packet loss on tunnel
- [ ] Latency is acceptable (<100ms)

## Run Automated Tests

```bash
chmod +x test-setup.sh
./test-setup.sh http://<RELAY_VM_IP>:8000 <RELAY_VM_IP> <EXIT_AGENT_IP>
```

- [ ] All API tests pass
- [ ] Health check passes
- [ ] Server config retrieved
- [ ] Client configs generated
- [ ] Peers listed
- [ ] WireGuard status available

## Troubleshooting Checklist

### API Not Responding
- [ ] Check relay API service: `sudo systemctl status relay-api`
- [ ] Check logs: `sudo journalctl -u relay-api -f`
- [ ] Verify port 8000 is open: `sudo netstat -tlnp | grep 8000`
- [ ] Check firewall rules on GCP

### Exit Agent Won't Connect
- [ ] Verify relay API is running
- [ ] Check network connectivity: `ping <RELAY_VM_IP>`
- [ ] Verify firewall allows UDP 51820
- [ ] Check exit agent logs: `tail -f /tmp/exit-agent.log`
- [ ] Verify WireGuard is installed: `wg --version`

### Remote Client Can't Connect
- [ ] Verify exit agent is connected
- [ ] Check client config is valid
- [ ] Verify WireGuard is installed on client
- [ ] Check firewall on client machine
- [ ] Verify tunnel IP is in 10.0.0.0/24 range

### Public IP Not Matching
- [ ] Check exit agent public IP: `curl https://icanhazip.com` (on exit agent)
- [ ] Check remote client public IP: `curl https://icanhazip.com` (on remote client)
- [ ] Verify exit agent is still connected
- [ ] Check WireGuard routing on relay VM: `sudo wg show wg0`
- [ ] Verify iptables NAT rules: `sudo iptables -t nat -L -n`

### Tunnel Drops
- [ ] Check relay VM logs: `sudo journalctl -u wg-quick@wg0 -f`
- [ ] Check exit agent logs: `tail -f /tmp/exit-agent.log`
- [ ] Verify keep-alive is set: `grep PersistentKeepalive /etc/wireguard/wg-exit.conf`
- [ ] Check network stability
- [ ] Restart WireGuard: `sudo systemctl restart wg-quick@wg0`

## Success Criteria

- [ ] Exit agent connects to relay VM
- [ ] Exit agent maintains stable connection
- [ ] Remote client receives valid WireGuard config
- [ ] Remote client connects through tunnel
- [ ] Public IP on remote client matches exit agent's public IP
- [ ] Traffic flows through exit agent (verified with icanhazip.com)
- [ ] Tunnel remains stable for extended period
- [ ] No significant latency increase
- [ ] All automated tests pass

## Documentation

- [ ] README.md reviewed
- [ ] TESTING.md reviewed
- [ ] plan.md reviewed
- [ ] All scripts are executable
- [ ] All configuration files are in place

## Next Steps (Phase 2)

- [ ] Add authentication to relay API
- [ ] Build Next.js dashboard
- [ ] Set up Neon PostgreSQL database
- [ ] Implement key rotation
- [ ] Add multi-region support
- [ ] Implement audit logging
- [ ] Add user management
- [ ] Add subscription tiers
