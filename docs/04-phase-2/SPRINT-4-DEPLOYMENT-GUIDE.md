# Sprint 4: Multi-Region Support - DEPLOYMENT GUIDE

**Date**: 2026-04-21T12:08:40.878Z
**Status**: Implementation in Progress
**Target**: Deploy relay VMs across 3 regions with load balancing

---

## Overview

Sprint 4 deploys the IP-Relay infrastructure across multiple GCP regions with automatic load balancing and failover. This enables:
- Low-latency connections for users worldwide
- Automatic failover if a region goes down
- Scalable architecture for future growth

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Global Load Balancer                 │
│                   (Static External IP)                  │
└────────────┬────────────────┬────────────────┬──────────┘
             │                │                │
      ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
      │ us-central1 │  │europe-west1 │  │asia-se-1    │
      │  Relay VM   │  │  Relay VM   │  │  Relay VM   │
      │ 10.0.0.1/24 │  │ 10.0.0.1/24 │  │ 10.0.0.1/24 │
      └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
             │                │                │
             └────────────────┼────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Neon PostgreSQL   │
                    │ (Shared Database) │
                    └───────────────────┘
```

---

## Prerequisites

1. **GCP Account** with billing enabled
2. **Terraform** installed (v1.0+)
3. **gcloud CLI** configured with your project
4. **Neon PostgreSQL** project created (from Sprint 3)
5. **Clerk** account with secret key

---

## Step 1: Prepare GCP Project

```bash
# Set your GCP project ID
export GCP_PROJECT_ID="your-project-id"

# Authenticate with gcloud
gcloud auth login
gcloud config set project $GCP_PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

---

## Step 2: Configure Terraform

```bash
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars
```

**Required values in terraform.tfvars**:
- `gcp_project_id`: Your GCP project ID
- `database_url`: Neon PostgreSQL connection string (from Sprint 3)
- `clerk_secret_key`: Your Clerk secret key

---

## Step 3: Initialize Terraform

```bash
# Initialize Terraform working directory
terraform init

# Validate configuration
terraform validate

# Plan deployment (shows what will be created)
terraform plan -out=tfplan
```

---

## Step 4: Deploy Infrastructure

```bash
# Apply the plan (creates all resources)
terraform apply tfplan

# Wait for deployment to complete (5-10 minutes)
# Terraform will output:
# - load_balancer_ip: Global load balancer IP
# - relay_vm_ips: External IPs of each relay VM
# - relay_vm_internal_ips: Internal IPs for debugging
```

---

## Step 5: Verify Deployment

```bash
# Get outputs
terraform output

# Test health check on each region
LOAD_BALANCER_IP=$(terraform output -raw load_balancer_ip)

# Health check
curl http://$LOAD_BALANCER_IP:8000/health

# Get server config
curl http://$LOAD_BALANCER_IP:8000/server-config

# Get current user (with auth token)
curl -H "Authorization: Bearer clerk_test_user_123" \
  http://$LOAD_BALANCER_IP:8000/users/me
```

---

## Step 6: Update Backend API for Multi-Region

The relay-api.py needs to be updated to:
1. Report which region it's running in
2. Support region-aware client config generation
3. Implement cross-region failover logic

See `SPRINT-4-BACKEND-UPDATES.md` for code changes.

---

## Regions Deployed

| Region | Zone | Purpose | Latency Target |
|--------|------|---------|-----------------|
| us-central1 | us-central1-a | North America | < 50ms |
| europe-west1 | europe-west1-b | Europe | < 50ms |
| asia-southeast1 | asia-southeast1-a | Asia-Pacific | < 50ms |

---

## Load Balancer Configuration

- **Type**: Global TCP Load Balancer
- **Protocol**: TCP (for WireGuard UDP passthrough)
- **Health Check**: TCP port 8000 every 10 seconds
- **Session Affinity**: CLIENT_IP (sticky sessions)
- **Timeout**: 30 seconds

---

## Firewall Rules

All relay VMs have these firewall rules:

| Port | Protocol | Purpose | Source |
|------|----------|---------|--------|
| 22 | TCP | SSH access | 0.0.0.0/0 |
| 8000 | TCP | Relay API | 0.0.0.0/0 |
| 51820 | UDP | WireGuard | 0.0.0.0/0 |

---

## Monitoring & Debugging

### SSH into a relay VM

```bash
# Get VM name
REGION="us-central1"
VM_NAME="ip-relay-vm-${REGION}"

# SSH into VM
gcloud compute ssh $VM_NAME --zone=${REGION}-a

# Check relay API status
sudo systemctl status relay-api

# View logs
sudo journalctl -u relay-api -f

# Check WireGuard status
sudo wg show

# Check database connection
curl http://localhost:8000/health
```

### View GCP Monitoring

```bash
# Open Cloud Console
gcloud compute instances list

# View instance details
gcloud compute instances describe ip-relay-vm-us-central1 --zone=us-central1-a
```

---

## Cost Estimation

**Monthly costs** (approximate):

| Component | Cost |
|-----------|------|
| 3x e2-medium VMs | ~$45 |
| Load Balancer | ~$18 |
| Network egress | ~$20 |
| **Total** | **~$83/month** |

---

## Scaling

To add more regions:

1. Add region to `relay_regions` in `terraform.tfvars`:
   ```hcl
   relay_regions = [
     "us-central1",
     "europe-west1",
     "asia-southeast1",
     "us-west1"  # New region
   ]
   ```

2. Reapply Terraform:
   ```bash
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

---

## Troubleshooting

### Load Balancer not responding

```bash
# Check backend health
gcloud compute backend-services get-health ip-relay-backend --global

# Check firewall rules
gcloud compute firewall-rules list --filter="network:ip-relay-network"

# Check instance status
gcloud compute instances list --filter="name:ip-relay-vm"
```

### Relay VM not starting

```bash
# SSH into VM and check startup script
sudo journalctl -u google-startup-scripts.service -f

# Check relay API service
sudo systemctl status relay-api
sudo journalctl -u relay-api -f

# Check database connection
cat /opt/ip-relay/backend/.env.local
```

### High latency

```bash
# Check VM CPU/memory usage
gcloud compute instances describe ip-relay-vm-us-central1 \
  --zone=us-central1-a --format="value(cpuPlatform)"

# Consider upgrading machine type in terraform.tfvars
# machine_type = "e2-standard-2"  # More CPU
```

---

## Cleanup

To destroy all infrastructure:

```bash
# WARNING: This deletes all relay VMs and load balancer
terraform destroy

# Confirm when prompted
```

---

## Next Steps

1. ✅ Deploy Terraform infrastructure
2. ✅ Verify all relay VMs are healthy
3. **Next**: Update backend API for multi-region support
4. **Next**: Test failover between regions
5. **Next**: Configure DNS for relay endpoints

---

## Files Created

- `terraform/main.tf` - Main Terraform configuration
- `terraform/variables.tf` - Variable definitions
- `terraform/terraform.tfvars.example` - Example variables
- `terraform/modules/relay-vm/main.tf` - Relay VM module
- `terraform/modules/relay-vm/startup.sh` - VM startup script

---

**Status**: Ready for deployment
**Next**: Run `terraform init && terraform plan`
