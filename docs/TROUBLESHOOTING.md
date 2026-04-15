# IP-Relay Troubleshooting Guide

## Common Issues and Solutions

### 1. Relay API Not Starting

**Symptoms:**
- `curl http://localhost:8000/health` returns connection refused
- `sudo systemctl status relay-api` shows failed

**Solutions:**

Check if port 8000 is already in use:
```bash
sudo netstat -tlnp | grep 8000
# or
sudo lsof -i :8000
```

If port is in use, kill the process:
```bash
sudo kill -9 <PID>
```

Check Python dependencies:
```bash
cd ~/relay-api
source venv/bin/activate
pip install -r requirements.txt
```

Check for syntax errors:
```bash
python3 -m py_compile relay-api.py
```

View detailed logs:
```bash
sudo journalctl -u relay-api -n 50 -f
```

### 2. WireGuard Interface Won't Start

**Symptoms:**
- `sudo wg show wg0` returns "No such device"
- `sudo systemctl status wg-quick@wg0` shows failed

**Solutions:**

Verify WireGuard is installed:
```bash
wg --version
sudo apt-get install -y wireguard wireguard-tools
```

Check WireGuard config syntax:
```bash
sudo wg-quick up wg0
# Check for errors
```

Verify config file exists and has correct permissions:
```bash
sudo ls -la /etc/wireguard/wg0.conf
sudo cat /etc/wireguard/wg0.conf
```

Check if kernel module is loaded:
```bash
lsmod | grep wireguard
sudo modprobe wireguard
```

### 3. Exit Agent Won't Connect to Relay

**Symptoms:**
- Exit agent logs show "Failed to connect to relay API"
- `curl http://<RELAY_VM_IP>:8000/health` times out

**Solutions:**

Verify network connectivity:
```bash
ping <RELAY_VM_IP>
traceroute <RELAY_VM_IP>
```

Check firewall on relay VM:
```bash
sudo ufw status
sudo ufw allow 8000/tcp
sudo ufw allow 51820/udp
```

Check GCP firewall rules:
```bash
gcloud compute firewall-rules list
gcloud compute firewall-rules create allow-relay-api \
  --allow=tcp:8000,udp:51820
```

Verify relay API is actually running:
```bash
curl http://<RELAY_VM_IP>:8000/health
```

Check exit agent logs for detailed error:
```bash
tail -f /tmp/exit-agent.log
```

### 4. Remote Client Can't Connect to Tunnel

**Symptoms:**
- `sudo wg-quick up wg-client` fails
- `sudo wg show wg-client` returns "No such device"

**Solutions:**

Verify WireGuard is installed:
```bash
wg --version
```

Check client config file:
```bash
sudo cat /etc/wireguard/wg-client.conf
```

Verify config syntax:
```bash
sudo wg-quick up wg-client
# Check for specific error messages
```

Check if exit agent is still connected:
```bash
# On exit agent
sudo wg show wg-exit
```

Try manual connection:
```bash
sudo ip link add dev wg-client type wireguard
sudo ip addr add 10.0.0.X/24 dev wg-client
sudo wg set wg-client private-key <(wg genkey)
sudo ip link set wg-client up
```

### 5. Public IP Not Matching

**Symptoms:**
- Exit agent public IP: 203.0.113.45
- Remote client public IP: 198.51.100.89 (different!)

**Solutions:**

Verify exit agent is connected:
```bash
# On exit agent
sudo wg show wg-exit
curl https://icanhazip.com
```

Check relay VM routing:
```bash
# On relay VM
sudo wg show wg0
sudo ip route show
```

Verify iptables NAT rules:
```bash
sudo iptables -t nat -L -n -v
sudo iptables -L -n -v
```

Check if IP forwarding is enabled:
```bash
cat /proc/sys/net/ipv4/ip_forward
# Should be 1
```

Verify remote client is using correct gateway:
```bash
# On remote client
ip route show
# Should show tunnel interface as default route
```

### 6. Tunnel Drops Frequently

**Symptoms:**
- Connection works for a few minutes then drops
- Exit agent logs show repeated reconnection attempts

**Solutions:**

Check keep-alive setting:
```bash
# On exit agent
grep PersistentKeepalive /etc/wireguard/wg-exit.conf
# Should be: PersistentKeepalive = 25
```

Check relay VM logs:
```bash
sudo journalctl -u wg-quick@wg0 -f
```

Monitor network stability:
```bash
ping -c 100 <RELAY_VM_IP>
# Check for packet loss
```

Check for MTU issues:
```bash
# On remote client
ping -M do -s 1472 <RELAY_VM_IP>
```

Increase keep-alive interval:
```bash
# Edit /etc/wireguard/wg-exit.conf
# Change: PersistentKeepalive = 25
# To: PersistentKeepalive = 10
```

### 7. High Latency or Slow Speed

**Symptoms:**
- Tunnel works but very slow
- Latency is 500ms+

**Solutions:**

Check tunnel latency:
```bash
ping -c 10 10.0.0.1
```

Check relay VM CPU/memory:
```bash
top
free -h
```

Check network bandwidth:
```bash
iftop
nethogs
```

Verify no packet loss:
```bash
ping -c 100 <RELAY_VM_IP> | grep loss
```

Check MTU size:
```bash
ip link show wg-exit
# Should be 1420 or similar
```

### 8. API Generates Invalid Config

**Symptoms:**
- Client config has syntax errors
- `sudo wg-quick up wg-client` fails with parse error

**Solutions:**

Check API response:
```bash
curl -s -X POST "http://<RELAY_VM_IP>:8000/generate-client-config?peer_name=test" | python3 -m json.tool
```

Verify config format:
```bash
# Should have [Interface] and [Peer] sections
# Should have PrivateKey, Address, PublicKey, Endpoint, AllowedIPs
```

Check for special characters:
```bash
cat /etc/wireguard/wg-client.conf | od -c
```

Regenerate config:
```bash
curl -s -X POST "http://<RELAY_VM_IP>:8000/generate-client-config?peer_name=new-client"
```

### 9. Permission Denied Errors

**Symptoms:**
- "Permission denied" when running wg-quick
- "Operation not permitted" errors

**Solutions:**

Ensure running with sudo:
```bash
sudo wg-quick up wg-exit
# Not: wg-quick up wg-exit
```

Check file permissions:
```bash
sudo ls -la /etc/wireguard/
# Should be 700 for directory, 600 for files
```

Fix permissions:
```bash
sudo chmod 700 /etc/wireguard
sudo chmod 600 /etc/wireguard/*.conf
```

### 10. Docker Container Issues

**Symptoms:**
- Docker container exits immediately
- `docker logs ip-relay-vm` shows errors

**Solutions:**

Check container logs:
```bash
docker logs ip-relay-vm
docker logs -f ip-relay-vm
```

Verify Docker has required capabilities:
```bash
docker inspect ip-relay-vm | grep -A 10 CapAdd
```

Rebuild container:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

Check Docker resource limits:
```bash
docker stats ip-relay-vm
```

## Quick Diagnostic Commands

### On Relay VM
```bash
# Check WireGuard status
sudo wg show wg0

# Check IP forwarding
cat /proc/sys/net/ipv4/ip_forward

# Check iptables rules
sudo iptables -t nat -L -n
sudo iptables -L -n

# Check API service
sudo systemctl status relay-api
sudo journalctl -u relay-api -n 20

# Check listening ports
sudo netstat -tlnp
```

### On Exit Agent
```bash
# Check WireGuard status
sudo wg show wg-exit

# Check tunnel IP
ip addr show wg-exit

# Check public IP
curl https://icanhazip.com

# Check logs
tail -f /tmp/exit-agent.log

# Check connectivity to relay
ping <RELAY_VM_IP>
curl http://<RELAY_VM_IP>:8000/health
```

### On Remote Client
```bash
# Check WireGuard status
sudo wg show wg-client

# Check tunnel IP
ip addr show wg-client

# Check public IP
curl https://icanhazip.com

# Check routing
ip route show

# Check connectivity
ping 10.0.0.1
```

## Getting Help

If issues persist:

1. Collect logs from all components:
   ```bash
   # Relay VM
   sudo journalctl -u relay-api -n 100 > relay-api.log
   sudo journalctl -u wg-quick@wg0 -n 100 > wireguard.log

   # Exit Agent
   cp /tmp/exit-agent.log exit-agent.log

   # Remote Client
   sudo wg show wg-client > client-status.log
   ```

2. Run diagnostic commands and save output

3. Check TESTING.md for additional guidance

4. Review plan.md to understand architecture

5. Verify all prerequisites are met in CHECKLIST.md
