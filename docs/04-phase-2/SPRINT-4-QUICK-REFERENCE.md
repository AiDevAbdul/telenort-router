# Sprint 4: Quick Reference Guide

**Date**: 2026-04-21T12:14:44.223Z
**Status**: Ready for Deployment

---

## Quick Start (5 Minutes)

### 1. Configure Terraform
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Fill in your values
```

### 2. Deploy Infrastructure
```bash
terraform init
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

### 3. Get Load Balancer IP
```bash
terraform output load_balancer_ip
# Save this IP for testing
```

---

## Testing Endpoints

### List Regions
```bash
curl http://<LB_IP>:8000/regions
```

### Get Region Info
```bash
curl http://<LB_IP>:8000/regions/us-central1
```

### Server Config
```bash
curl http://<LB_IP>:8000/server-config
```

### Health Check
```bash
curl http://<LB_IP>:8000/health
```

### Generate Client Config
```bash
curl -X POST "http://<LB_IP>:8000/generate-client-config?tunnel_id=<ID>&preferred_region=europe-west1" \
  -H "Authorization: Bearer clerk_test_user_123"
```

---

## SSH into Relay VMs

### US Central
```bash
gcloud compute ssh ip-relay-vm-us-central1 --zone=us-central1-a
```

### Europe West
```bash
gcloud compute ssh ip-relay-vm-europe-west1 --zone=europe-west1-b
```

### Asia Southeast
```bash
gcloud compute ssh ip-relay-vm-asia-southeast1 --zone=asia-southeast1-a
```

---

## Check VM Status

### SSH into VM
```bash
gcloud compute ssh ip-relay-vm-us-central1 --zone=us-central1-a
```

### Check Relay API
```bash
sudo systemctl status relay-api
sudo journalctl -u relay-api -f
```

### Check WireGuard
```bash
sudo wg show
```

### Check Database Connection
```bash
curl http://localhost:8000/health
```

---

## Terraform Commands

### Plan Changes
```bash
terraform plan -out=tfplan
```

### Apply Changes
```bash
terraform apply tfplan
```

### Destroy Infrastructure
```bash
terraform destroy
```

### View Outputs
```bash
terraform output
```

### Get Specific Output
```bash
terraform output load_balancer_ip
terraform output relay_vm_ips
```

---

## Environment Variables

Set in `terraform.tfvars`:
- `gcp_project_id` - Your GCP project ID
- `database_url` - Neon PostgreSQL connection string
- `clerk_secret_key` - Clerk authentication key
- `relay_regions` - List of regions to deploy
- `machine_type` - VM machine type (default: e2-medium)
- `environment` - Environment name (dev/staging/prod)

---

## Monitoring

### Backend Health
```bash
curl http://<LB_IP>:8000/health
```

### Load Balancer Status
```bash
gcloud compute backend-services get-health ip-relay-backend --global
```

### Instance Status
```bash
gcloud compute instances list --filter="name:ip-relay-vm"
```

### Firewall Rules
```bash
gcloud compute firewall-rules list --filter="network:ip-relay-network"
```

---

## Common Issues

### Load Balancer Not Responding
```bash
# Check backend health
gcloud compute backend-services get-health ip-relay-backend --global

# Check firewall rules
gcloud compute firewall-rules list --filter="network:ip-relay-network"
```

### Relay VM Not Starting
```bash
# SSH into VM
gcloud compute ssh ip-relay-vm-us-central1 --zone=us-central1-a

# Check startup script
sudo journalctl -u google-startup-scripts.service -f

# Check relay API
sudo systemctl status relay-api
```

### Database Connection Failed
```bash
# SSH into VM
gcloud compute ssh ip-relay-vm-us-central1 --zone=us-central1-a

# Check environment
cat /opt/ip-relay/backend/.env.local

# Test connection
curl http://localhost:8000/health
```

---

## Cost Estimation

| Component | Monthly Cost |
|-----------|--------------|
| 3x e2-medium VMs | ~$45 |
| Global Load Balancer | ~$18 |
| Network egress | ~$20 |
| **Total** | **~$83** |

---

## Scaling

### Add New Region

1. Edit `terraform.tfvars`:
```hcl
relay_regions = [
  "us-central1",
  "europe-west1",
  "asia-southeast1",
  "us-west1"  # New region
]
```

2. Reapply:
```bash
terraform plan -out=tfplan
terraform apply tfplan
```

### Upgrade Machine Type

1. Edit `terraform.tfvars`:
```hcl
machine_type = "e2-standard-2"  # More CPU
```

2. Reapply:
```bash
terraform plan -out=tfplan
terraform apply tfplan
```

---

## Files Reference

### Terraform
- `terraform/main.tf` - Main configuration
- `terraform/variables.tf` - Variables
- `terraform/terraform.tfvars.example` - Example config
- `terraform/modules/relay-vm/main.tf` - VM module
- `terraform/modules/relay-vm/startup.sh` - Startup script

### Backend
- `backend/relay-api.py` - API with multi-region support
- `backend/db_config.py` - Database configuration
- `backend/models.py` - Database models
- `backend/init_db.py` - Database initialization

### Documentation
- `docs/04-phase-2/SPRINT-4-DEPLOYMENT-GUIDE.md` - Full deployment guide
- `docs/04-phase-2/SPRINT-4-BACKEND-UPDATES.md` - Backend changes
- `docs/04-phase-2/SPRINT-4-COMPLETE.md` - Completion summary

---

## Next Steps

1. Deploy Terraform infrastructure
2. Verify all relay VMs are healthy
3. Test failover between regions
4. Benchmark latency from different locations
5. Proceed to Sprint 5 (Key Rotation & Security)

---

**Status**: Ready for deployment
**Next**: `cd terraform && terraform init && terraform plan`
