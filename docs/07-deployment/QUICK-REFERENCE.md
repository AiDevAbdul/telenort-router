# GCP Deployment Quick Reference

## Essential Commands

### Project Setup
```bash
# Set project
gcloud config set project ip-relay-prod

# Set region
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a

# List projects
gcloud projects list
```

### VM Management
```bash
# SSH into VM
gcloud compute ssh relay-vm --zone=us-central1-a

# Stop VM
gcloud compute instances stop relay-vm --zone=us-central1-a

# Start VM
gcloud compute instances start relay-vm --zone=us-central1-a

# Restart VM
gcloud compute instances reset relay-vm --zone=us-central1-a

# Delete VM
gcloud compute instances delete relay-vm --zone=us-central1-a

# Get VM details
gcloud compute instances describe relay-vm --zone=us-central1-a

# Get external IP
gcloud compute instances describe relay-vm --format='value(networkInterfaces[0].accessConfigs[0].natIP)'
```

### Database Management
```bash
# Connect to database
psql -h CLOUD_SQL_IP -U relay_user -d ip_relay

# List backups
gcloud sql backups list --instance=ip-relay-db

# Create backup
gcloud sql backups create --instance=ip-relay-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance=ip-relay-db

# Reset user password
gcloud sql users set-password relay_user --instance=ip-relay-db --password=NEW_PASSWORD

# Get connection name
gcloud sql instances describe ip-relay-db --format='value(connectionName)'
```

### Networking
```bash
# List firewall rules
gcloud compute firewall-rules list

# Create firewall rule
gcloud compute firewall-rules create allow-custom \
  --allow=tcp:PORT \
  --source-ranges=0.0.0.0/0 \
  --target-tags=custom

# Update firewall rule
gcloud compute firewall-rules update allow-relay-api \
  --source-ranges=YOUR_IP/32

# Delete firewall rule
gcloud compute firewall-rules delete allow-custom

# List static IPs
gcloud compute addresses list

# Get static IP address
gcloud compute addresses describe relay-vm-ip --region=us-central1 --format='value(address)'
```

### Logging & Monitoring
```bash
# View recent logs
gcloud logging read --limit=50

# View error logs
gcloud logging read "severity=ERROR" --limit=20

# View logs for specific resource
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=relay-vm" --limit=50

# Create log sink
gcloud logging sinks create relay-logs logging.googleapis.com/projects/PROJECT_ID/logs/relay

# List metrics
gcloud monitoring metrics-descriptors list

# Create alert policy
gcloud alpha monitoring policies create --notification-channels=CHANNEL_ID
```

### Service Management (on VM)
```bash
# Check service status
sudo systemctl status relay-api.service

# Start service
sudo systemctl start relay-api.service

# Stop service
sudo systemctl stop relay-api.service

# Restart service
sudo systemctl restart relay-api.service

# View service logs
sudo journalctl -u relay-api.service -n 50

# Follow service logs
sudo journalctl -u relay-api.service -f

# Enable service on boot
sudo systemctl enable relay-api.service

# Disable service on boot
sudo systemctl disable relay-api.service
```

### WireGuard Management (on VM)
```bash
# Show WireGuard status
sudo wg show wg0

# Show all interfaces
sudo wg show

# Add peer
sudo wg set wg0 peer PUBLIC_KEY allowed-ips 10.0.0.2/32

# Remove peer
sudo wg set wg0 peer PUBLIC_KEY remove

# Show interface details
ip link show wg0

# Show IP address
ip addr show wg0

# Bring interface up
sudo ip link set wg0 up

# Bring interface down
sudo ip link set wg0 down
```

## API Testing

### Health Check
```bash
curl http://RELAY_IP:8000/health
```

### Get Server Config
```bash
curl http://RELAY_IP:8000/server-config
```

### Create Tunnel
```bash
curl -X POST http://RELAY_IP:8000/tunnels \
  -H "Content-Type: application/json" \
  -d '{
    "peer_name": "test-tunnel",
    "public_key": "test_key",
    "relay_region": "us-central1"
  }'
```

### List Tunnels
```bash
curl http://RELAY_IP:8000/tunnels
```

### Delete Tunnel
```bash
curl -X DELETE http://RELAY_IP:8000/tunnels/TUNNEL_ID
```

### List Exit Agents
```bash
curl http://RELAY_IP:8000/exit-agents
```

## Deployment Checklist (Quick)

- [ ] Project created
- [ ] APIs enabled
- [ ] Firewall rules created
- [ ] Static IP reserved
- [ ] Cloud SQL instance created
- [ ] Database and user created
- [ ] VM instance created
- [ ] Startup script executed
- [ ] Service running
- [ ] WireGuard interface up
- [ ] API responding
- [ ] Database connected
- [ ] Logs appearing
- [ ] Monitoring configured

## Common Issues Quick Fixes

### API Not Responding
```bash
gcloud compute ssh relay-vm --zone=us-central1-a
sudo systemctl restart relay-api.service
sudo journalctl -u relay-api.service -n 20
```

### WireGuard Not Working
```bash
gcloud compute ssh relay-vm --zone=us-central1-a
sudo wg show wg0
sudo modprobe wireguard
```

### Database Connection Failed
```bash
# Check connection string
cat /etc/environment | grep DATABASE_URL

# Test connection
psql -h CLOUD_SQL_IP -U relay_user -d ip_relay
```

### Can't SSH into VM
```bash
# Check VM status
gcloud compute instances describe relay-vm --format='value(status)'

# Check firewall allows SSH
gcloud compute firewall-rules describe allow-ssh

# Try with verbose output
gcloud compute ssh relay-vm --zone=us-central1-a --verbosity=debug
```

### High CPU Usage
```bash
gcloud compute ssh relay-vm --zone=us-central1-a
top
ps aux --sort=-%cpu | head -10
```

## Environment Variables

Set these in `/etc/environment` on the VM:

```bash
DATABASE_URL=postgresql://relay_user:PASSWORD@CLOUD_SQL_IP:5432/ip_relay
CLERK_SECRET_KEY=your_clerk_secret_key
SERVER_REGION=us-central1
SERVER_PUBLIC_IP=YOUR_STATIC_IP
PYTHONUNBUFFERED=1
```

## File Locations (on VM)

```
/opt/ip-relay/                    # Main application directory
├── backend/                       # Backend code
│   ├── relay-api.py              # Main API
│   ├── requirements.txt           # Python dependencies
│   └── venv/                      # Python virtual environment
├── frontend/                      # Frontend code (if deployed)
└── docs/                          # Documentation

/etc/wireguard/                   # WireGuard configuration
├── wg0.conf                       # Interface config
├── keys/                          # Key storage
│   ├── server_private.key
│   └── server_public.key
└── agent.conf                     # Agent config

/etc/systemd/system/              # Systemd services
└── relay-api.service             # Relay API service

/var/log/                         # System logs
/etc/environment                  # Environment variables
```

## Performance Tuning

### Increase VM Size
```bash
gcloud compute instances stop relay-vm --zone=us-central1-a
gcloud compute instances set-machine-type relay-vm \
  --machine-type=e2-standard-2 \
  --zone=us-central1-a
gcloud compute instances start relay-vm --zone=us-central1-a
```

### Upgrade Database
```bash
gcloud sql instances patch ip-relay-db \
  --tier=db-n1-standard-1
```

### Enable Caching
```bash
# Add to relay-api.py
from functools import lru_cache

@lru_cache(maxsize=128)
def get_server_config():
    # ...
```

## Backup & Recovery

### Manual Backup
```bash
gcloud sql backups create --instance=ip-relay-db
```

### List Backups
```bash
gcloud sql backups list --instance=ip-relay-db
```

### Restore Backup
```bash
gcloud sql backups restore BACKUP_ID --backup-instance=ip-relay-db
```

### Export Database
```bash
gcloud sql export sql ip-relay-db gs://bucket-name/backup.sql \
  --database=ip_relay
```

## Cost Optimization

### Reduce VM Size
```bash
gcloud compute instances set-machine-type relay-vm \
  --machine-type=e2-small \
  --zone=us-central1-a
```

### Use Committed Use Discounts
```bash
gcloud compute commitments create relay-commitment \
  --plan=one-year \
  --resources=VCPU:4,MEMORY:16GB
```

### Archive Old Logs
```bash
gcloud logging sinks create archive-logs \
  storage.googleapis.com/archive-bucket \
  --log-filter='timestamp<"2026-01-01T00:00:00Z"'
```

## Useful Links

- **GCP Console**: https://console.cloud.google.com
- **Cloud SQL**: https://console.cloud.google.com/sql
- **Compute Engine**: https://console.cloud.google.com/compute
- **Cloud Logging**: https://console.cloud.google.com/logs
- **Cloud Monitoring**: https://console.cloud.google.com/monitoring

## Emergency Contacts

- **GCP Support**: https://cloud.google.com/support
- **Status Page**: https://status.cloud.google.com
- **Community**: https://stackoverflow.com/questions/tagged/google-cloud-platform

---

**Last Updated**: 2026-04-17
**Version**: 1.0
