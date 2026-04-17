# GCP Deployment Guide for IP-Relay

## Overview
This guide walks you through deploying the IP-Relay platform to Google Cloud Platform (GCP) for production use.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     GCP Project                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Relay VM (Compute Engine)                           │   │
│  │  - Ubuntu 22.04                                      │   │
│  │  - WireGuard (port 51820/UDP)                        │   │
│  │  - Relay API (port 8000/TCP)                         │   │
│  │  - Static External IP                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↑                                   │
│                           │                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cloud SQL (PostgreSQL)                              │   │
│  │  - Database for tunnels, agents, users               │   │
│  │  - Automated backups                                 │   │
│  │  - High availability                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cloud Storage                                       │   │
│  │  - WireGuard configs                                 │   │
│  │  - Logs and backups                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
    Remote Clients                      Exit Agents
    (WireGuard)                         (WireGuard)
```

## Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** installed locally
3. **Docker** installed locally (for building images)
4. **Project files** ready to deploy

## Step 1: Set Up GCP Project

### 1.1 Create a new GCP project
```bash
gcloud projects create ip-relay-prod --name="IP-Relay Production"
gcloud config set project ip-relay-prod
```

### 1.2 Enable required APIs
```bash
gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable container.googleapis.com
```

### 1.3 Set default region and zone
```bash
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a
```

## Step 2: Create Cloud SQL Database

### 2.1 Create PostgreSQL instance
```bash
gcloud sql instances create ip-relay-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --availability-type=REGIONAL \
  --backup-start-time=03:00 \
  --enable-bin-log
```

### 2.2 Create database and user
```bash
# Get the instance connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe ip-relay-db --format='value(connectionName)')

# Create database
gcloud sql databases create ip_relay --instance=ip-relay-db

# Create user
gcloud sql users create relay_user \
  --instance=ip-relay-db \
  --password=YOUR_SECURE_PASSWORD_HERE
```

### 2.3 Configure database access
```bash
# Allow public IP access (for development only)
gcloud sql instances patch ip-relay-db --require-ssl=false

# Or use Cloud SQL Proxy for secure access (recommended)
gcloud sql instances patch ip-relay-db --require-ssl=true
```

## Step 3: Create Compute Engine VM

### 3.1 Create firewall rules
```bash
# Allow WireGuard traffic
gcloud compute firewall-rules create allow-wireguard \
  --allow=udp:51820 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=wireguard

# Allow API traffic
gcloud compute firewall-rules create allow-relay-api \
  --allow=tcp:8000 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=relay-api

# Allow SSH
gcloud compute firewall-rules create allow-ssh \
  --allow=tcp:22 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=ssh
```

### 3.2 Reserve static external IP
```bash
gcloud compute addresses create relay-vm-ip \
  --region=us-central1
```

### 3.3 Create VM instance
```bash
gcloud compute instances create relay-vm \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --zone=us-central1-a \
  --address=relay-vm-ip \
  --tags=wireguard,relay-api,ssh \
  --scopes=cloud-platform \
  --metadata-from-file startup-script=startup-script.sh
```

## Step 4: Prepare Startup Script

Create `startup-script.sh`:

```bash
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install dependencies
apt-get install -y \
  python3 \
  python3-pip \
  python3-venv \
  wireguard \
  wireguard-tools \
  curl \
  git \
  postgresql-client

# Create app directory
mkdir -p /opt/ip-relay
cd /opt/ip-relay

# Clone repository (or copy files)
git clone https://github.com/YOUR_ORG/ip-relay.git .

# Set up Python environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create WireGuard keys directory
mkdir -p /etc/wireguard/keys
chmod 700 /etc/wireguard/keys

# Set environment variables
cat > /etc/environment << EOF
DATABASE_URL=postgresql://relay_user:YOUR_PASSWORD@CLOUD_SQL_IP:5432/ip_relay
CLERK_SECRET_KEY=YOUR_CLERK_KEY
SERVER_REGION=us-central1
SERVER_PUBLIC_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")
EOF

# Create systemd service
cat > /etc/systemd/system/relay-api.service << EOF
[Unit]
Description=IP-Relay API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ip-relay/backend
Environment="PATH=/opt/ip-relay/backend/venv/bin"
EnvironmentFile=/etc/environment
ExecStart=/opt/ip-relay/backend/venv/bin/python3 relay-api.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable relay-api.service
systemctl start relay-api.service

# Initialize WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

echo "IP-Relay deployment complete!"
```

## Step 5: Deploy Backend

### 5.1 Upload startup script
```bash
gcloud compute instances create relay-vm \
  --metadata-from-file startup-script=startup-script.sh \
  # ... other flags from Step 3.3
```

### 5.2 SSH into VM and verify
```bash
gcloud compute ssh relay-vm --zone=us-central1-a

# Check service status
sudo systemctl status relay-api.service

# Check WireGuard
sudo wg show wg0

# Test API
curl http://localhost:8000/health
```

## Step 6: Deploy Frontend (Optional)

### 6.1 Build Docker image
```bash
cd frontend
docker build -t gcr.io/ip-relay-prod/dashboard:latest .
docker push gcr.io/ip-relay-prod/dashboard:latest
```

### 6.2 Deploy to Cloud Run
```bash
gcloud run deploy ip-relay-dashboard \
  --image=gcr.io/ip-relay-prod/dashboard:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=http://RELAY_VM_IP:8000"
```

## Step 7: Configure Environment Variables

SSH into the relay VM and update environment:

```bash
sudo nano /etc/environment
```

Add:
```
DATABASE_URL=postgresql://relay_user:PASSWORD@CLOUD_SQL_IP:5432/ip_relay
CLERK_SECRET_KEY=your_clerk_secret_key
SERVER_REGION=us-central1
SERVER_PUBLIC_IP=YOUR_STATIC_IP
```

Restart service:
```bash
sudo systemctl restart relay-api.service
```

## Step 8: Verify Deployment

### 8.1 Check API health
```bash
curl http://YOUR_STATIC_IP:8000/health
curl http://YOUR_STATIC_IP:8000/server-config
```

### 8.2 Check WireGuard
```bash
gcloud compute ssh relay-vm --zone=us-central1-a
sudo wg show wg0
```

### 8.3 Test tunnel creation
```bash
curl -X POST http://YOUR_STATIC_IP:8000/tunnels \
  -H "Content-Type: application/json" \
  -d '{"peer_name":"test","public_key":"test_key","relay_region":"us-central1"}'
```

## Step 9: Set Up Monitoring

### 9.1 Enable Cloud Logging
```bash
gcloud logging sinks create relay-api-logs \
  logging.googleapis.com/projects/ip-relay-prod/logs/relay-api \
  --log-filter='resource.type="gce_instance" AND resource.labels.instance_id="relay-vm"'
```

### 9.2 Create alerts
```bash
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Relay API Down" \
  --condition-display-name="API Health Check Failed"
```

## Step 10: Security Hardening

### 10.1 Restrict firewall rules
```bash
# Only allow specific IPs for API
gcloud compute firewall-rules update allow-relay-api \
  --source-ranges=YOUR_IP/32
```

### 10.2 Enable VPC Service Controls
```bash
gcloud access-context-manager policies create \
  --title="IP-Relay Access Policy"
```

### 10.3 Set up Cloud Armor
```bash
gcloud compute security-policies create relay-policy \
  --description="IP-Relay DDoS protection"

gcloud compute security-policies rules create 100 \
  --security-policy=relay-policy \
  --action=allow
```

## Troubleshooting

### API not responding
```bash
gcloud compute ssh relay-vm --zone=us-central1-a
sudo systemctl status relay-api.service
sudo journalctl -u relay-api.service -n 50
```

### WireGuard not working
```bash
sudo wg show wg0
sudo ip link show wg0
sudo dmesg | grep wireguard
```

### Database connection issues
```bash
# Test connection
psql -h CLOUD_SQL_IP -U relay_user -d ip_relay

# Check Cloud SQL proxy
sudo systemctl status cloud-sql-proxy
```

## Scaling Considerations

1. **Multiple Relay VMs**: Deploy in different regions
2. **Load Balancing**: Use Cloud Load Balancer
3. **Auto-scaling**: Set up instance groups
4. **Database**: Upgrade to larger tier as needed
5. **CDN**: Use Cloud CDN for frontend

## Cost Optimization

- Use `e2-small` for low traffic
- Enable committed use discounts
- Use Cloud SQL shared instances for dev/test
- Archive old logs to Cloud Storage

## Next Steps

1. Set up CI/CD pipeline (Cloud Build)
2. Configure custom domain (Cloud DNS)
3. Enable SSL/TLS (Cloud Armor + Certificates)
4. Set up backup strategy
5. Create runbooks for common operations

## Support

For issues or questions:
- Check GCP documentation: https://cloud.google.com/docs
- Review logs: `gcloud logging read`
- Contact GCP support

---

**Last Updated**: 2026-04-17
**Version**: 1.0
