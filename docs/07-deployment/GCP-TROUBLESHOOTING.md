# GCP Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. API Not Responding

**Symptom**: `curl http://RELAY_IP:8000/health` returns connection refused

**Solutions**:

```bash
# SSH into VM
gcloud compute ssh relay-vm --zone=us-central1-a

# Check service status
sudo systemctl status relay-api.service

# View recent logs
sudo journalctl -u relay-api.service -n 50

# Check if port 8000 is listening
sudo netstat -tlnp | grep 8000

# Restart service
sudo systemctl restart relay-api.service
```

**Common causes**:
- Service not started: `sudo systemctl start relay-api.service`
- Python dependencies missing: `cd /opt/ip-relay/backend && source venv/bin/activate && pip install -r requirements.txt`
- Port already in use: `sudo lsof -i :8000`

---

### 2. WireGuard Not Working

**Symptom**: `sudo wg show wg0` returns error or no interface

**Solutions**:

```bash
# Check if WireGuard is installed
which wg

# Check kernel module
lsmod | grep wireguard

# Load module if missing
sudo modprobe wireguard

# Check interface status
ip link show wg0

# Bring up interface
sudo ip link add dev wg0 type wireguard
sudo ip addr add 10.0.0.1/24 dev wg0
sudo ip link set wg0 up

# Verify
sudo wg show wg0
```

**Common causes**:
- WireGuard not installed: `sudo apt-get install wireguard wireguard-tools`
- Kernel module not loaded: `sudo modprobe wireguard`
- Interface already exists: `sudo ip link del wg0` then recreate

---

### 3. Database Connection Failed

**Symptom**: API returns database connection errors

**Solutions**:

```bash
# Check environment variables
cat /etc/environment | grep DATABASE_URL

# Test connection from VM
psql -h CLOUD_SQL_IP -U relay_user -d ip_relay

# Check Cloud SQL instance status
gcloud sql instances describe ip-relay-db

# Verify firewall allows Cloud SQL
gcloud sql instances describe ip-relay-db --format='value(ipAddresses[0].ipAddress)'

# Check if Cloud SQL Proxy is running (if using proxy)
sudo systemctl status cloud-sql-proxy
```

**Common causes**:
- Wrong connection string: Verify `DATABASE_URL` format
- Cloud SQL instance not running: `gcloud sql instances patch ip-relay-db --activation-policy=ALWAYS`
- Firewall blocking connection: Add VM's IP to Cloud SQL authorized networks
- User password incorrect: Reset with `gcloud sql users set-password relay_user --instance=ip-relay-db --password=NEW_PASSWORD`

---

### 4. Firewall Rules Not Working

**Symptom**: Cannot connect to API or WireGuard from external machine

**Solutions**:

```bash
# List all firewall rules
gcloud compute firewall-rules list

# Check specific rule
gcloud compute firewall-rules describe allow-relay-api

# Verify VM has correct tags
gcloud compute instances describe relay-vm --format='value(tags.items[])'

# Test connectivity from local machine
curl -v http://RELAY_IP:8000/health

# Check VM's external IP
gcloud compute instances describe relay-vm --format='value(networkInterfaces[0].accessConfigs[0].natIP)'
```

**Common causes**:
- VM doesn't have required tags: `gcloud compute instances add-tags relay-vm --tags=relay-api,wireguard`
- Firewall rule has wrong source range: Update with `gcloud compute firewall-rules update allow-relay-api --source-ranges=YOUR_IP/32`
- Rule not applied to VM: Check tags match

---

### 5. Startup Script Failed

**Symptom**: VM created but service not running

**Solutions**:

```bash
# SSH into VM
gcloud compute ssh relay-vm --zone=us-central1-a

# Check startup script logs
sudo cat /var/log/syslog | grep startup-script

# Check if directory exists
ls -la /opt/ip-relay

# Check if Python venv created
ls -la /opt/ip-relay/backend/venv

# Manually run startup commands
cd /opt/ip-relay/backend
source venv/bin/activate
python3 relay-api.py
```

**Common causes**:
- Repository not cloned: Clone manually or use Cloud Source Repositories
- Dependencies not installed: Run `pip install -r requirements.txt`
- Permissions issue: Ensure script is executable and runs as root

---

### 6. High CPU or Memory Usage

**Symptom**: VM running slowly or becoming unresponsive

**Solutions**:

```bash
# Check resource usage
top
free -h
df -h

# Check process consuming resources
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10

# Check if multiple relay-api processes running
ps aux | grep relay-api

# Kill duplicate processes
sudo pkill -f relay-api
sudo systemctl restart relay-api.service

# Check disk space
du -sh /opt/ip-relay
du -sh /var/log

# Clean up old logs
sudo journalctl --vacuum=time=7d
```

**Common causes**:
- Memory leak in application: Restart service
- Disk full: Clean up logs or increase disk size
- Multiple processes: Check systemd service configuration

---

### 7. SSL/TLS Certificate Issues

**Symptom**: HTTPS connections failing or certificate errors

**Solutions**:

```bash
# Check certificate expiration
gcloud compute ssl-certificates list

# Create new certificate
gcloud compute ssl-certificates create relay-cert \
  --certificate=path/to/cert.pem \
  --private-key=path/to/key.pem

# Update load balancer with new certificate
gcloud compute backend-services update relay-backend \
  --global \
  --ssl-certificates=relay-cert
```

**Common causes**:
- Certificate expired: Renew certificate
- Wrong certificate format: Ensure PEM format
- Certificate not attached to load balancer: Attach manually

---

### 8. Monitoring and Logging Issues

**Symptom**: No logs appearing in Cloud Logging

**Solutions**:

```bash
# Check if logging agent is running
sudo systemctl status google-cloud-logging

# View logs from command line
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=relay-vm" --limit=50

# Create log sink if missing
gcloud logging sinks create relay-api-logs \
  logging.googleapis.com/projects/ip-relay-prod/logs/relay-api \
  --log-filter='resource.type="gce_instance"'

# Check log retention
gcloud logging sinks describe relay-api-logs
```

**Common causes**:
- Logging agent not installed: Install with startup script
- Logs not being written: Check application logging configuration
- Log sink not created: Create manually

---

### 9. Tunnel Creation Failing

**Symptom**: POST /tunnels returns error

**Solutions**:

```bash
# Test tunnel creation
curl -X POST http://RELAY_IP:8000/tunnels \
  -H "Content-Type: application/json" \
  -d '{"peer_name":"test","public_key":"test_key","relay_region":"us-central1"}'

# Check API logs
sudo journalctl -u relay-api.service -n 100 | grep -i error

# Verify WireGuard is working
sudo wg show wg0

# Check if keys directory exists
ls -la /etc/wireguard/keys

# Test WireGuard key generation
wg genkey | wg pubkey
```

**Common causes**:
- WireGuard not initialized: Run `sudo wg show wg0`
- Keys directory missing: Create with `sudo mkdir -p /etc/wireguard/keys`
- Database error: Check database connection
- Invalid request format: Verify JSON structure

---

### 10. Performance Issues

**Symptom**: Slow API responses or high latency

**Solutions**:

```bash
# Check network latency
ping RELAY_IP

# Check API response time
time curl http://RELAY_IP:8000/health

# Monitor real-time performance
gcloud compute instances describe relay-vm --format='value(cpuPlatform)'

# Check network throughput
iftop

# Upgrade VM if needed
gcloud compute instances stop relay-vm --zone=us-central1-a
gcloud compute instances set-machine-type relay-vm \
  --machine-type=e2-standard-2 \
  --zone=us-central1-a
gcloud compute instances start relay-vm --zone=us-central1-a
```

**Common causes**:
- Undersized VM: Upgrade machine type
- Network congestion: Check bandwidth usage
- Database slow: Optimize queries or upgrade database tier
- Too many connections: Implement connection pooling

---

## Emergency Procedures

### Rollback to Previous Version

```bash
# Stop current service
sudo systemctl stop relay-api.service

# Restore previous code
cd /opt/ip-relay
git checkout previous-version

# Reinstall dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Restart service
sudo systemctl start relay-api.service
```

### Restore from Database Backup

```bash
# List available backups
gcloud sql backups list --instance=ip-relay-db

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=ip-relay-db \
  --backup-configuration=default
```

### Emergency VM Restart

```bash
# Soft restart
gcloud compute instances stop relay-vm --zone=us-central1-a
gcloud compute instances start relay-vm --zone=us-central1-a

# Hard restart (if soft fails)
gcloud compute instances reset relay-vm --zone=us-central1-a
```

---

## Monitoring Commands

```bash
# Real-time service status
watch -n 5 'gcloud compute instances describe relay-vm --format="value(status)"'

# Monitor CPU usage
gcloud monitoring time-series list \
  --filter='metric.type="compute.googleapis.com/instance/cpu/utilization"'

# Check disk usage
gcloud compute ssh relay-vm --zone=us-central1-a -- df -h

# View recent errors
gcloud logging read "severity=ERROR" --limit=20
```

---

## Support Resources

- **GCP Documentation**: https://cloud.google.com/docs
- **WireGuard Documentation**: https://www.wireguard.com/quickstart/
- **Cloud SQL Troubleshooting**: https://cloud.google.com/sql/docs/postgres/troubleshoot
- **Compute Engine Troubleshooting**: https://cloud.google.com/compute/docs/troubleshooting

---

**Last Updated**: 2026-04-17
**Version**: 1.0
