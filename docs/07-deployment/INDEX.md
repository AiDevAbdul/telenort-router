# GCP Deployment Documentation Index

## 📚 Complete Deployment Package

This directory contains everything you need to deploy IP-Relay to Google Cloud Platform.

---

## 📖 Documentation Files

### 1. **DEPLOYMENT-SUMMARY.md** ⭐ START HERE
   - Overview of what's included
   - Quick start options (automated vs manual)
   - Architecture diagram
   - Cost estimates
   - Post-deployment steps
   - Verification commands
   - Maintenance schedule
   - Scaling roadmap

### 2. **GCP-DEPLOYMENT-GUIDE.md** 📋 DETAILED GUIDE
   - Complete step-by-step instructions
   - All GCP setup commands
   - Database configuration
   - VM creation and setup
   - Startup script details
   - Frontend deployment (optional)
   - Environment variables
   - Security hardening
   - Monitoring setup
   - Scaling considerations

### 3. **GCP-DEPLOYMENT-CHECKLIST.md** ✅ VERIFICATION
   - Pre-deployment checklist
   - GCP setup verification
   - Database setup verification
   - Networking verification
   - VM verification
   - Application deployment verification
   - Post-deployment verification
   - Security verification
   - Backup & disaster recovery verification
   - Documentation verification

### 4. **GCP-TROUBLESHOOTING.md** 🔧 PROBLEM SOLVING
   - 10 common issues with solutions
   - API not responding
   - WireGuard not working
   - Database connection failed
   - Firewall rules not working
   - Startup script failed
   - High CPU/memory usage
   - SSL/TLS certificate issues
   - Monitoring and logging issues
   - Tunnel creation failing
   - Performance issues
   - Emergency procedures
   - Rollback procedures

### 5. **QUICK-REFERENCE.md** ⚡ CHEAT SHEET
   - Essential gcloud commands
   - VM management commands
   - Database management commands
   - Networking commands
   - Logging & monitoring commands
   - Service management commands
   - WireGuard commands
   - API testing examples
   - Quick deployment checklist
   - Common issues quick fixes
   - Environment variables
   - File locations
   - Performance tuning
   - Backup & recovery
   - Cost optimization

---

## 🚀 Deployment Scripts

### **deploy-gcp.sh** - Automated Deployment
Located in project root: `/deploy-gcp.sh`

**Usage:**
```bash
chmod +x deploy-gcp.sh
./deploy-gcp.sh ip-relay-prod us-central1
```

**What it does:**
- ✅ Creates GCP project
- ✅ Enables required APIs
- ✅ Creates firewall rules
- ✅ Reserves static IP
- ✅ Creates Cloud SQL database
- ✅ Creates Compute Engine VM
- ✅ Generates startup script
- ✅ Displays deployment summary

**Time to complete:** ~10-15 minutes

---

## 🎯 Quick Start Paths

### Path 1: Fully Automated (Recommended)
```
1. Run deploy-gcp.sh
2. Follow on-screen instructions
3. Verify with curl commands
4. Done!
```
**Time:** 15 minutes

### Path 2: Manual Step-by-Step
```
1. Read DEPLOYMENT-SUMMARY.md
2. Follow GCP-DEPLOYMENT-GUIDE.md
3. Use QUICK-REFERENCE.md for commands
4. Verify with DEPLOYMENT-CHECKLIST.md
```
**Time:** 30-45 minutes

### Path 3: Troubleshooting
```
1. Check GCP-TROUBLESHOOTING.md
2. Find your issue
3. Follow solution steps
4. Verify with QUICK-REFERENCE.md
```
**Time:** Varies

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GCP Project                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Relay VM (Compute Engine)                           │   │
│  │  - Ubuntu 22.04 LTS                                  │   │
│  │  - WireGuard (51820/UDP)                             │   │
│  │  - Relay API (8000/TCP)                              │   │
│  │  - Static External IP                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cloud SQL PostgreSQL                                │   │
│  │  - ip_relay database                                 │   │
│  │  - relay_user account                                │   │
│  │  - Automated backups                                 │   │
│  │  - Regional HA                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Networking & Security                               │   │
│  │  - Firewall rules                                    │   │
│  │  - Static IP                                         │   │
│  │  - VPC                                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Monitoring & Logging                                │   │
│  │  - Cloud Logging                                     │   │
│  │  - Cloud Monitoring                                  │   │
│  │  - Alert policies                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
    Remote Clients                      Exit Agents
    (WireGuard)                         (WireGuard)
```

---

## 💰 Cost Estimates

| Component | Size | Monthly Cost |
|-----------|------|--------------|
| Compute Engine VM | e2-medium | ~$30 |
| Cloud SQL | db-f1-micro | ~$10 |
| Static IP | 1 address | ~$3 |
| Data transfer | 100GB | ~$15 |
| **Total** | | **~$58** |

*Costs vary by region and usage. Use GCP pricing calculator for accurate estimates.*

---

## ✅ Verification Checklist

After deployment, verify:

```bash
# Get static IP
RELAY_IP=$(gcloud compute addresses describe relay-vm-ip --region=us-central1 --format='value(address)')

# Test health check
curl http://$RELAY_IP:8000/health
# Expected: {"status":"ok"}

# Test server config
curl http://$RELAY_IP:8000/server-config
# Expected: JSON with server keys and config

# Test tunnel creation
curl -X POST http://$RELAY_IP:8000/tunnels \
  -H "Content-Type: application/json" \
  -d '{"peer_name":"test","public_key":"test_key","relay_region":"us-central1"}'
# Expected: JSON with tunnel details

# SSH into VM
gcloud compute ssh relay-vm --zone=us-central1-a

# Check WireGuard (on VM)
sudo wg show wg0
# Expected: interface: wg0 with listening port 51820

# Check service status (on VM)
sudo systemctl status relay-api.service
# Expected: active (running)
```

---

## 🔧 Common Tasks

### Deploy to Production
1. Read DEPLOYMENT-SUMMARY.md
2. Run deploy-gcp.sh
3. Follow verification steps
4. Configure environment variables
5. Test with real clients

### Troubleshoot Issues
1. Check GCP-TROUBLESHOOTING.md
2. Find your issue
3. Follow solution steps
4. Use QUICK-REFERENCE.md for commands

### Scale Infrastructure
1. Read DEPLOYMENT-SUMMARY.md (Scaling section)
2. Follow GCP-DEPLOYMENT-GUIDE.md (Scaling Considerations)
3. Use QUICK-REFERENCE.md (Performance Tuning)

### Backup & Recovery
1. See QUICK-REFERENCE.md (Backup & Recovery section)
2. Or GCP-TROUBLESHOOTING.md (Emergency Procedures)

### Monitor System
1. See QUICK-REFERENCE.md (Logging & Monitoring)
2. Or GCP-DEPLOYMENT-GUIDE.md (Step 9: Set Up Monitoring)

---

## 📞 Support Resources

### Internal Documentation
- **Architecture**: `/docs/02-architecture/`
- **Testing**: `/docs/01-getting-started/`
- **Phase 2 Plan**: `/docs/04-phase-2/`
- **Troubleshooting**: `/docs/06-reference/TROUBLESHOOTING.md`

### External Resources
- **GCP Documentation**: https://cloud.google.com/docs
- **WireGuard Documentation**: https://www.wireguard.com/quickstart/
- **Cloud SQL Docs**: https://cloud.google.com/sql/docs/postgres
- **Compute Engine Docs**: https://cloud.google.com/compute/docs
- **GCP Support**: https://cloud.google.com/support

---

## 📋 File Organization

```
/docs/07-deployment/
├── DEPLOYMENT-SUMMARY.md          ⭐ Start here
├── GCP-DEPLOYMENT-GUIDE.md        📋 Detailed guide
├── GCP-DEPLOYMENT-CHECKLIST.md    ✅ Verification
├── GCP-TROUBLESHOOTING.md         🔧 Problem solving
├── QUICK-REFERENCE.md             ⚡ Cheat sheet
└── INDEX.md                       📚 This file

/
└── deploy-gcp.sh                  🚀 Automated script
```

---

## 🎓 Learning Path

### For First-Time Deployers
1. Read DEPLOYMENT-SUMMARY.md (5 min)
2. Run deploy-gcp.sh (15 min)
3. Verify with curl commands (5 min)
4. Read GCP-DEPLOYMENT-GUIDE.md for details (20 min)

### For Experienced DevOps
1. Review QUICK-REFERENCE.md (5 min)
2. Run deploy-gcp.sh (15 min)
3. Customize as needed (varies)

### For Troubleshooting
1. Check GCP-TROUBLESHOOTING.md (5 min)
2. Find your issue (5 min)
3. Follow solution (varies)

---

## 🚀 Next Steps

1. **Choose deployment method**
   - Automated: Run `deploy-gcp.sh`
   - Manual: Follow GCP-DEPLOYMENT-GUIDE.md

2. **Deploy infrastructure**
   - Create GCP project
   - Set up database
   - Create VM

3. **Verify deployment**
   - Test API endpoints
   - Check WireGuard
   - Verify database connection

4. **Configure application**
   - Set environment variables
   - Deploy frontend (optional)
   - Set up monitoring

5. **Test with clients**
   - Create tunnels
   - Connect exit agents
   - Verify traffic routing

6. **Monitor & maintain**
   - Set up alerts
   - Schedule backups
   - Plan scaling

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-17 | Initial release |

---

## ✨ What's Included

✅ Complete deployment guide
✅ Automated deployment script
✅ Comprehensive troubleshooting guide
✅ Deployment checklist
✅ Quick reference guide
✅ Architecture documentation
✅ Cost estimates
✅ Scaling roadmap
✅ Security hardening steps
✅ Monitoring setup
✅ Backup procedures
✅ Emergency procedures

---

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ API responds to health check
- ✅ WireGuard interface is up
- ✅ Tunnels can be created
- ✅ Database connection working
- ✅ Logs appearing in Cloud Logging
- ✅ Monitoring alerts configured
- ✅ Exit agents can connect
- ✅ Traffic routing working

---

**Ready to deploy? Start with DEPLOYMENT-SUMMARY.md or run deploy-gcp.sh!**

---

**Last Updated**: 2026-04-17
**Version**: 1.0
**Status**: Production Ready
