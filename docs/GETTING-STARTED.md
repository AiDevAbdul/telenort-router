# Getting Started with IP-Relay Testing

## What You Have

A complete, minimal testing solution to validate the IP-Relay concept:
- Relay VM setup scripts (automated & manual)
- FastAPI service for peer management
- Exit agent script (cross-platform)
- Remote client setup script
- Comprehensive documentation
- Automated testing suite
- Docker alternative

## Before You Start

### Prerequisites
- [ ] GCP account with Compute Engine enabled
- [ ] Ubuntu 22.04 LTS VM (2 vCPU, 2GB RAM minimum)
- [ ] Home/office PC with internet access
- [ ] Remote device (laptop/mobile) for testing
- [ ] Basic familiarity with Linux/bash commands
- [ ] SSH access to GCP VM

### System Requirements
- **Relay VM**: Ubuntu 22.04 LTS, 2+ vCPU, 2GB+ RAM
- **Exit Agent**: Linux, macOS, or Windows with WireGuard support
- **Remote Client**: Any device with WireGuard support
- **Network**: All components need internet connectivity

## Step 1: Deploy Relay VM (15 minutes)

### Option A: Automated (Recommended)
```bash
# SSH into your GCP VM
gcloud compute ssh ip-relay-vm --zone=us-central1-a

# Download and run deployment script
curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/deploy-gcp-vm.sh
chmod +x deploy-gcp-vm.sh
./deploy-gcp-vm.sh

# Wait for completion, note the external IP
```

### Option B: Docker
```bash
# On your local machine
git clone https://github.com/AiDevAbdul/telenort-router.git
cd telenor-router
docker-compose up -d

# API available at http://localhost:8000
```

### Option C: Manual
```bash
# SSH into GCP VM
gcloud compute ssh ip-relay-vm --zone=us-central1-a

# Run setup script
curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/relay-vm-setup.sh
chmod +x relay-vm-setup.sh
./relay-vm-setup.sh

# Install dependencies
pip install -r requirements.txt

# Copy relay-api.py and start it
python3 relay-api.py
```

### Verify Relay VM
```bash
# Test API health
curl http://<RELAY_VM_IP>:8000/health

# Should return: {"status":"ok"}
```

## Step 2: Set Up Exit Agent (10 minutes)

On your home/office PC:

```bash
# Download exit agent script
curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/exit-agent.sh
chmod +x exit-agent.sh

# Run with relay VM IP and API URL
./exit-agent.sh <RELAY_VM_IP> http://<RELAY_VM_IP>:8000

# Example:
# ./exit-agent.sh 35.123.45.67 http://35.123.45.67:8000
```

### Monitor Exit Agent
```bash
# In another terminal, watch the logs
tail -f /tmp/exit-agent.log

# Expected output:
# [2026-04-15 10:30:45] Exit Agent Starting
# [2026-04-15 10:30:50] WireGuard installed
# [2026-04-15 10:31:00] WireGuard interface is up
# [2026-04-15 10:31:05] Public IP: 203.0.113.45
# [2026-04-15 10:31:05] SUCCESS: Exit agent is online
```

### Note the Public IP
The public IP shown in the logs is your "static IP" that remote clients will appear to use.

## Step 3: Connect Remote Client (5 minutes)

On your remote device (laptop/mobile):

```bash
# Download remote client setup script
curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/remote-client-setup.sh
chmod +x remote-client-setup.sh

# Run setup
./remote-client-setup.sh http://<RELAY_VM_IP>:8000 my-device

# Connect to tunnel
sudo wg-quick up wg-client

# Verify public IP
curl https://icanhazip.com
```

### Expected Result
The public IP should match the exit agent's public IP from Step 2.

## Step 4: Validate (5 minutes)

### Manual Validation
```bash
# On exit agent
curl https://icanhazip.com
# Note: 203.0.113.45

# On remote client
curl https://icanhazip.com
# Should also be: 203.0.113.45

# Try browsing a website
# Should work normally, but traffic routed through exit agent
```

### Automated Validation
```bash
# On any machine with curl
chmod +x test-setup.sh
./test-setup.sh http://<RELAY_VM_IP>:8000 <RELAY_VM_IP>

# Should show all tests passing
```

## Success Checklist

- [ ] Relay VM is running and API responds
- [ ] Exit agent connects and shows public IP
- [ ] Remote client receives WireGuard config
- [ ] Remote client connects to tunnel
- [ ] Remote client public IP matches exit agent public IP
- [ ] Remote client can browse websites
- [ ] Tunnel remains stable for 5+ minutes

## Troubleshooting

### API Not Responding
```bash
# Check service status
sudo systemctl status relay-api

# View logs
sudo journalctl -u relay-api -f

# Restart service
sudo systemctl restart relay-api
```

### Exit Agent Won't Connect
```bash
# Check network connectivity
ping <RELAY_VM_IP>

# Check logs
tail -f /tmp/exit-agent.log

# Verify WireGuard is installed
wg --version
```

### Public IP Not Matching
```bash
# On exit agent
curl https://icanhazip.com

# On remote client
curl https://icanhazip.com

# If different, exit agent may have disconnected
# Check exit agent logs and restart if needed
```

See TROUBLESHOOTING.md for more detailed solutions.

## Documentation

- **README.md** - Project overview
- **plan.md** - Architecture and implementation plan
- **TESTING.md** - Detailed testing procedures
- **CHECKLIST.md** - Pre-deployment checklist
- **TROUBLESHOOTING.md** - Common issues and solutions
- **QUICK-REFERENCE.md** - Quick lookup guide

## Key Concepts

### WireGuard Tunnel
- Secure VPN tunnel between exit agent and relay VM
- Exit agent initiates connection (reverse tunnel)
- Remote clients connect through relay VM

### Static IP
- Exit agent's public IP becomes the "static IP"
- All remote client traffic appears to come from this IP
- Verified via icanhazip.com

### Keep-Alive
- Exit agent sends keep-alive packets every 25 seconds
- Maintains connection through ISP firewall
- Prevents tunnel from dropping

## What's Next?

Once you've validated the testing solution works:

1. **Document Results** - Note any issues or observations
2. **Plan Phase 2** - Add authentication, dashboard, database
3. **Gather Feedback** - Does the concept work for your use case?
4. **Scale Testing** - Test with multiple exit agents and remote clients

## Important Notes

- This is a **testing solution**, not production-ready
- No authentication or authorization
- No persistent storage
- Single relay VM (no redundancy)
- Hardcoded IP ranges (10.0.0.0/24)

## Getting Help

1. Check TROUBLESHOOTING.md for common issues
2. Review TESTING.md for detailed procedures
3. Run test-setup.sh for automated validation
4. Check logs on all components
5. Verify prerequisites in CHECKLIST.md

## Quick Commands Reference

```bash
# Relay VM
curl http://<RELAY_VM_IP>:8000/health
sudo systemctl status relay-api
sudo journalctl -u relay-api -f

# Exit Agent
tail -f /tmp/exit-agent.log
curl https://icanhazip.com
sudo wg show wg-exit

# Remote Client
sudo wg-quick up wg-client
sudo wg show wg-client
curl https://icanhazip.com
```

## Estimated Timeline

- Relay VM setup: 15 minutes
- Exit agent setup: 10 minutes
- Remote client setup: 5 minutes
- Testing & validation: 10 minutes
- **Total: ~40 minutes**

Good luck! 🚀
