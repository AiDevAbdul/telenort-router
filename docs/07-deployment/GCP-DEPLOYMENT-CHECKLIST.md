# GCP Deployment Checklist

## Pre-Deployment
- [ ] GCP account created with billing enabled
- [ ] gcloud CLI installed and configured
- [ ] Docker installed locally
- [ ] All code committed to git repository
- [ ] Environment variables documented
- [ ] Database schema prepared
- [ ] SSL certificates ready (or using Cloud Armor)

## GCP Setup
- [ ] Project created: `ip-relay-prod`
- [ ] APIs enabled:
  - [ ] Compute Engine
  - [ ] Cloud SQL
  - [ ] Cloud Storage
  - [ ] Container Registry
- [ ] Default region set: `us-central1`
- [ ] Billing alerts configured

## Database Setup
- [ ] Cloud SQL PostgreSQL instance created
- [ ] Database `ip_relay` created
- [ ] User `relay_user` created with secure password
- [ ] Backups configured (daily at 03:00 UTC)
- [ ] SSL enabled for connections
- [ ] Connection tested from local machine

## Networking
- [ ] Static external IP reserved: `relay-vm-ip`
- [ ] Firewall rules created:
  - [ ] WireGuard (UDP 51820)
  - [ ] Relay API (TCP 8000)
  - [ ] SSH (TCP 22)
- [ ] VPC configured (if using custom VPC)
- [ ] Cloud NAT configured (if needed)

## Compute Engine VM
- [ ] VM instance created: `relay-vm`
- [ ] Machine type: `e2-medium` (or appropriate size)
- [ ] Image: Ubuntu 22.04 LTS
- [ ] Startup script uploaded and tested
- [ ] SSH key configured
- [ ] VM started and verified running

## Application Deployment
- [ ] Backend code deployed to `/opt/ip-relay`
- [ ] Python dependencies installed
- [ ] WireGuard installed and configured
- [ ] Systemd service created and enabled
- [ ] Environment variables set:
  - [ ] `DATABASE_URL`
  - [ ] `CLERK_SECRET_KEY`
  - [ ] `SERVER_REGION`
  - [ ] `SERVER_PUBLIC_IP`
- [ ] Service started and verified running
- [ ] Health check endpoint responding

## Frontend Deployment (Optional)
- [ ] Docker image built
- [ ] Image pushed to Container Registry
- [ ] Cloud Run service deployed
- [ ] Environment variables configured
- [ ] Frontend accessible at Cloud Run URL

## Verification
- [ ] API health check: `curl http://RELAY_IP:8000/health`
- [ ] Server config: `curl http://RELAY_IP:8000/server-config`
- [ ] Tunnel creation: `curl -X POST http://RELAY_IP:8000/tunnels ...`
- [ ] WireGuard interface up: `sudo wg show wg0`
- [ ] Database connection working
- [ ] Logs appearing in Cloud Logging

## Monitoring & Alerts
- [ ] Cloud Logging configured
- [ ] Log sink created for relay-api
- [ ] Monitoring dashboard created
- [ ] Uptime checks configured
- [ ] Alert policies created:
  - [ ] API down
  - [ ] High CPU usage
  - [ ] Database connection errors
- [ ] Notification channels configured (email/Slack)

## Security
- [ ] Firewall rules restricted to necessary IPs
- [ ] Cloud Armor DDoS protection enabled
- [ ] VPC Service Controls configured
- [ ] Service account with minimal permissions created
- [ ] Secrets stored in Secret Manager (not in code)
- [ ] SSL/TLS certificates installed
- [ ] Regular security audits scheduled

## Backup & Disaster Recovery
- [ ] Cloud SQL automated backups enabled
- [ ] Backup retention policy set (30 days)
- [ ] Manual backup tested
- [ ] Disaster recovery plan documented
- [ ] RTO/RPO targets defined

## Documentation
- [ ] Deployment guide completed
- [ ] Runbooks created for common operations
- [ ] Troubleshooting guide updated
- [ ] Architecture diagram updated
- [ ] Team trained on deployment process

## Post-Deployment
- [ ] Monitor logs for errors
- [ ] Test tunnel creation with real clients
- [ ] Verify exit agents can connect
- [ ] Load test the system
- [ ] Document any issues found
- [ ] Schedule regular maintenance windows

## Rollback Plan
- [ ] Previous version backed up
- [ ] Rollback procedure documented
- [ ] Database migration rollback tested
- [ ] Communication plan for incidents

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Status**: _______________
**Notes**: _______________
