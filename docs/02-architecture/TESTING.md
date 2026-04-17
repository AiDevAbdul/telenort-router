# IP-Relay Testing Guide

## Quick Start

### Prerequisites
- GCP account with Compute Engine access
- Ubuntu 22.04 LTS VM (at least 2 vCPU, 2GB RAM)
- Home/office PC with internet access (Linux, macOS, or Windows)
- Remote device (laptop/mobile) to test with

### Step 1: Set Up GCP Relay VM

1. Create a new Compute Engine instance on GCP:
   ```bash
   gcloud compute instances create ip-relay-vm \
     --image-family=ubuntu-2204-lts \
     --image-project=ubuntu-os-cloud \
     --machine-type=e2-medium \
     --zone=us-central1-a \
     --scopes=default
   ```

2. SSH into the VM:
   ```bash
   gcloud compute ssh ip-relay-vm --zone=us-central1-a
   ```

3. Download and run the setup script:
   ```bash
   curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/relay-vm-setup.sh
   chmod +x relay-vm-setup.sh
   ./relay-vm-setup.sh
   ```

4. Install Python dependencies and start the relay API:
   ```bash
   cd ~/relay-api
   python3 -m venv venv
   source venv/bin/activate
   pip install fastapi uvicorn
   python3 relay-api.py
   ```

   The API will be available at `http://<VM_IP>:8000`

5. Note the VM's external IP:
   ```bash
   gcloud compute instances describe ip-relay-vm --zone=us-central1-a \
     --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
   ```

### Step 2: Set Up Exit Agent (Home/Office PC)

1. Download the exit agent script:
   ```bash
   curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/exit-agent.sh
   chmod +x exit-agent.sh
   ```

2. Run the exit agent with the relay VM IP and API URL:
   ```bash
   ./exit-agent.sh <RELAY_VM_IP> http://<RELAY_VM_IP>:8000
   ```

   Example:
   ```bash
   ./exit-agent.sh 35.123.45.67 http://35.123.45.67:8000
   ```

3. Monitor the logs:
   ```bash
   tail -f /tmp/exit-agent.log
   ```

   Expected output:
   ```
   [2026-04-15 10:30:45] Exit Agent Starting
   [2026-04-15 10:30:45] Relay VM IP: 35.123.45.67
   [2026-04-15 10:30:50] WireGuard installed
   [2026-04-15 10:30:55] Received config for IP: 10.0.0.2/32
   [2026-04-15 10:31:00] WireGuard interface is up
   [2026-04-15 10:31:05] Public IP: 203.0.113.45
   [2026-04-15 10:31:05] SUCCESS: Exit agent is online
   ```

### Step 3: Set Up Remote Client

1. Download the remote client setup script:
   ```bash
   curl -O https://raw.githubusercontent.com/AiDevAbdul/telenort-router/main/remote-client-setup.sh
   chmod +x remote-client-setup.sh
   ```

2. Run the setup:
   ```bash
   ./remote-client-setup.sh http://<RELAY_VM_IP>:8000 my-laptop
   ```

3. Connect to the tunnel:
   ```bash
   sudo wg-quick up wg-client
   ```

4. Verify the public IP:
   ```bash
   curl https://icanhazip.com
   ```

   **Expected result:** The public IP should match the exit agent's public IP (from Step 2)

## Testing Checklist

- [ ] GCP relay VM is running and WireGuard is active
- [ ] Relay API is responding: `curl http://<RELAY_VM_IP>:8000/health`
- [ ] Exit agent script runs without errors
- [ ] Exit agent connects to relay VM (check logs)
- [ ] Exit agent reports public IP
- [ ] Remote client receives WireGuard config
- [ ] Remote client connects to tunnel
- [ ] Remote client's public IP matches exit agent's public IP
- [ ] Tunnel remains stable for 5+ minutes
- [ ] Can browse websites from remote client (traffic routed through exit agent)

## Troubleshooting

### Exit Agent Won't Connect
```bash
# Check if relay API is running
curl http://<RELAY_VM_IP>:8000/health

# Check firewall rules on GCP VM
sudo ufw status

# Ensure port 51820 is open
gcloud compute firewall-rules create allow-wireguard \
  --allow=udp:51820
```

### Remote Client Can't Connect
```bash
# Check if WireGuard config is valid
sudo wg-quick up wg-client

# Check tunnel status
sudo wg show wg-client

# Check if exit agent is still connected
ssh <exit_agent_ip> "tail -f /tmp/exit-agent.log"
```

### Public IP Not Matching
```bash
# On exit agent, check current public IP
curl https://icanhazip.com

# On remote client, check tunnel IP
ip addr show wg-client

# Check WireGuard peers on relay VM
sudo wg show wg0
```

### Tunnel Drops
```bash
# Check relay VM logs
sudo journalctl -u wg-quick@wg0 -f

# Restart WireGuard on relay VM
sudo systemctl restart wg-quick@wg0

# Check exit agent keep-alive
tail -f /tmp/exit-agent.log
```

## API Endpoints

### GET /health
Health check
```bash
curl http://<RELAY_VM_IP>:8000/health
```

### GET /server-config
Get relay server configuration
```bash
curl http://<RELAY_VM_IP>:8000/server-config
```

### POST /generate-client-config
Generate a new client config
```bash
curl -X POST "http://<RELAY_VM_IP>:8000/generate-client-config?peer_name=my-client"
```

### GET /peers
List all connected peers
```bash
curl http://<RELAY_VM_IP>:8000/peers
```

### GET /status
Get WireGuard interface status
```bash
curl http://<RELAY_VM_IP>:8000/status
```

## Success Criteria

The test is successful when:
1. Exit agent connects to relay VM and maintains connection
2. Remote client receives valid WireGuard config
3. Remote client connects through tunnel
4. Public IP on remote client = exit agent's public IP
5. Traffic flows through exit agent (verify with `curl https://icanhazip.com`)
6. Tunnel remains stable for extended period (5+ minutes)

## Next Steps (Phase 2)

- [ ] Add authentication to relay API
- [ ] Build Next.js dashboard for config management
- [ ] Add database (Neon PostgreSQL) for user/tunnel storage
- [ ] Implement key rotation
- [ ] Add multi-region support
- [ ] Implement audit logging
