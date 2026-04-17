#!/bin/bash
# GCP Deployment Script - Automated setup for IP-Relay
# Usage: ./deploy-gcp.sh <project-id> <region>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-ip-relay-prod}
REGION=${2:-us-central1}
ZONE="${REGION}-a"
VM_NAME="relay-vm"
DB_INSTANCE="ip-relay-db"
DB_USER="relay_user"
DB_NAME="ip_relay"

echo -e "${GREEN}=== IP-Relay GCP Deployment ===${NC}"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Zone: $ZONE"
echo ""

# Step 1: Set up GCP project
echo -e "${YELLOW}Step 1: Setting up GCP project...${NC}"
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
gcloud config set compute/zone $ZONE

# Step 2: Enable APIs
echo -e "${YELLOW}Step 2: Enabling required APIs...${NC}"
gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com

# Step 3: Create firewall rules
echo -e "${YELLOW}Step 3: Creating firewall rules...${NC}"
gcloud compute firewall-rules create allow-wireguard \
  --allow=udp:51820 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=wireguard \
  --quiet 2>/dev/null || echo "Firewall rule 'allow-wireguard' already exists"

gcloud compute firewall-rules create allow-relay-api \
  --allow=tcp:8000 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=relay-api \
  --quiet 2>/dev/null || echo "Firewall rule 'allow-relay-api' already exists"

gcloud compute firewall-rules create allow-ssh \
  --allow=tcp:22 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=ssh \
  --quiet 2>/dev/null || echo "Firewall rule 'allow-ssh' already exists"

# Step 4: Reserve static IP
echo -e "${YELLOW}Step 4: Reserving static external IP...${NC}"
gcloud compute addresses create relay-vm-ip \
  --region=$REGION \
  --quiet 2>/dev/null || echo "Static IP 'relay-vm-ip' already exists"

STATIC_IP=$(gcloud compute addresses describe relay-vm-ip --region=$REGION --format='value(address)')
echo -e "${GREEN}Static IP: $STATIC_IP${NC}"

# Step 5: Create Cloud SQL instance
echo -e "${YELLOW}Step 5: Creating Cloud SQL PostgreSQL instance...${NC}"
gcloud sql instances create $DB_INSTANCE \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --availability-type=REGIONAL \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --quiet 2>/dev/null || echo "Cloud SQL instance '$DB_INSTANCE' already exists"

# Step 6: Create database and user
echo -e "${YELLOW}Step 6: Creating database and user...${NC}"
gcloud sql databases create $DB_NAME \
  --instance=$DB_INSTANCE \
  --quiet 2>/dev/null || echo "Database '$DB_NAME' already exists"

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)
echo -e "${YELLOW}Database password: $DB_PASSWORD${NC}"
echo "Save this password securely!"

gcloud sql users create $DB_USER \
  --instance=$DB_INSTANCE \
  --password=$DB_PASSWORD \
  --quiet 2>/dev/null || echo "User '$DB_USER' already exists"

# Get Cloud SQL connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)')
echo -e "${GREEN}Cloud SQL Connection: $INSTANCE_CONNECTION_NAME${NC}"

# Step 7: Create startup script
echo -e "${YELLOW}Step 7: Creating startup script...${NC}"
cat > /tmp/startup-script.sh << 'STARTUP_EOF'
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
  postgresql-client \
  wget

# Create app directory
mkdir -p /opt/ip-relay
cd /opt/ip-relay

# Clone or copy repository
if [ -d ".git" ]; then
  git pull origin main
else
  # For manual deployment, files should be copied separately
  echo "Repository not found. Please copy files manually."
fi

# Set up Python environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create WireGuard keys directory
mkdir -p /etc/wireguard/keys
chmod 700 /etc/wireguard/keys

# Create systemd service
cat > /etc/systemd/system/relay-api.service << 'SERVICE_EOF'
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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Enable and start service
systemctl daemon-reload
systemctl enable relay-api.service
systemctl start relay-api.service

# Initialize WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

echo "IP-Relay deployment complete!"
STARTUP_EOF

chmod +x /tmp/startup-script.sh

# Step 8: Create VM instance
echo -e "${YELLOW}Step 8: Creating Compute Engine VM...${NC}"
gcloud compute instances create $VM_NAME \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --zone=$ZONE \
  --address=relay-vm-ip \
  --tags=wireguard,relay-api,ssh \
  --scopes=cloud-platform \
  --metadata-from-file startup-script=/tmp/startup-script.sh \
  --quiet 2>/dev/null || echo "VM instance '$VM_NAME' already exists"

# Step 9: Wait for VM to be ready
echo -e "${YELLOW}Step 9: Waiting for VM to be ready...${NC}"
sleep 30
gcloud compute instances wait-until-running $VM_NAME --zone=$ZONE

# Step 10: Display summary
echo ""
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "VM Name: $VM_NAME"
echo "VM IP: $STATIC_IP"
echo "Database: $DB_INSTANCE"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASSWORD"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. SSH into VM: gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "2. Copy project files to /opt/ip-relay"
echo "3. Set environment variables in /etc/environment"
echo "4. Restart service: sudo systemctl restart relay-api.service"
echo "5. Test API: curl http://$STATIC_IP:8000/health"
echo ""
echo -e "${GREEN}Deployment script completed!${NC}"
