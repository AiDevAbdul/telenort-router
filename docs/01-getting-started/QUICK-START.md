# 🚀 Quick Start Guide - IP-Relay Platform

**Last Updated**: 2026-04-15
**Status**: Production Ready

---

## 📋 What is IP-Relay?

IP-Relay is a SaaS platform that routes remote device traffic through a static IP at your home/office using WireGuard reverse tunnels on GCP relay VMs.

**Architecture**: Remote Client → GCP Relay VM → Exit Agent (Home/Office) → Internet

---

## ⚡ Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/AiDevAbdul/telenort-router.git
cd telenor-router
```

### 2. Read Documentation
```bash
# Main entry point
cat docs/00-START-HERE.md

# Phase 2 setup
cat docs/PHASE-2-SPRINT-1.md
cat docs/PHASE-2-SPRINT-2.md
```

### 3. Choose Your Path

#### Option A: Test Phase 1 (Docker - 10 minutes)
```bash
# Start relay VM
docker-compose up -d

# Check status
docker-compose ps

# Run exit agent (in WSL/Linux)
./exit-agent.sh localhost http://localhost:8000

# Run remote client
./remote-client-setup.sh http://localhost:8000 my-device

# Verify public IPs match
curl https://icanhazip.com
```

#### Option B: Deploy Phase 2 Backend (15 minutes)
```bash
# Set up environment
cp .env.example .env
# Edit .env with Neon + Clerk credentials

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Run API
python relay-api-v2.py
```

#### Option C: Deploy Phase 2 Dashboard (10 minutes)
```bash
cd dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with Clerk + API URL

# Run development server
npm run dev

# Access at http://localhost:3000
```

---

## 📁 Project Structure

```
telenor-router/
├── CLAUDE.md                    # Project context & rules
├── relay-api.py                 # Phase 1 API
├── relay-api-v2.py              # Phase 2 API with auth
├── Dockerfile                   # Docker image
├── docker-compose.yml           # Docker Compose
├── requirements.txt             # Python dependencies
├── dashboard/                   # Next.js dashboard
│   ├── app/                     # Pages and layouts
│   ├── lib/                     # Utilities
│   └── package.json             # Dependencies
└── docs/                        # Documentation (30+ files)
```

---

## 🔑 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `relay-api.py` | Phase 1 API (original) | ✅ Working |
| `relay-api-v2.py` | Phase 2 API with auth | ✅ Complete |
| `db_config.py` | Database configuration | ✅ Complete |
| `models.py` | Database models | ✅ Complete |
| `auth.py` | Clerk authentication | ✅ Complete |
| `dashboard/` | Next.js dashboard | ✅ Complete |
| `Dockerfile` | Docker image | ✅ Fixed |
| `docker-compose.yml` | Docker Compose | ✅ Fixed |

---

## 🛠️ Setup Requirements

### For Phase 1 (Testing)
- Docker & Docker Compose
- WireGuard (for exit agent)
- Bash shell (WSL on Windows)

### For Phase 2 Backend
- Python 3.8+
- Neon PostgreSQL account
- Clerk account

### For Phase 2 Dashboard
- Node.js 18+
- npm or yarn
- Clerk account

---

## 🔐 Environment Configuration

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@host/ip_relay
CLERK_PUBLIC_KEY=your_clerk_public_key
CLERK_ISSUER=https://your-instance.clerk.accounts.com
```

### Dashboard (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
```

---

## 📊 API Endpoints

### Public (No Auth)
- `GET /health` - Health check
- `GET /server-config` - Server configuration

### Protected (Clerk JWT Required)
- `GET /users/me` - Current user
- `GET /tunnels` - List tunnels
- `POST /tunnels` - Create tunnel
- `POST /generate-client-config` - Generate config
- `GET /exit-agents` - List exit agents
- `GET /peers` - List peers
- `GET /status` - WireGuard status

---

## 🎯 Common Tasks

### Create a Tunnel
```bash
curl -X POST http://localhost:8000/tunnels \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Tunnel","relay_region":"us-central1"}'
```

### Generate Client Config
```bash
curl -X POST http://localhost:8000/generate-client-config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tunnel_id":"<id>","client_name":"my-device"}'
```

### Register Exit Agent
```bash
curl -X POST http://localhost:8000/exit-agents/register \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tunnel_id":"<id>","name":"Home PC","public_key":"<key>"}'
```

---

## 🐛 Troubleshooting

### Docker Container Won't Start
```bash
# Check logs
docker-compose logs relay-vm

# Rebuild
docker-compose down
docker-compose up -d --build
```

### API Connection Error
```bash
# Verify API is running
curl http://localhost:8000/health

# Check environment variables
cat .env
```

### Dashboard Won't Load
```bash
# Check dependencies
npm install

# Clear cache
rm -rf .next node_modules
npm install
npm run dev
```

### Database Connection Error
```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
python -c "from db_config import engine; engine.connect()"
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `docs/00-START-HERE.md` | Main entry point |
| `docs/PHASE-2-PLAN.md` | 6-week roadmap |
| `docs/PHASE-2-SPRINT-1.md` | Backend setup |
| `docs/PHASE-2-SPRINT-2.md` | Dashboard setup |
| `docs/ARCHITECTURE.md` | Technical details |
| `docs/QUICK-REFERENCE.md` | Commands & endpoints |
| `docs/TROUBLESHOOTING.md` | Common issues |

---

## 🚀 Deployment

### Docker (Recommended for Phase 1)
```bash
docker-compose up -d
```

### Vercel (Recommended for Dashboard)
```bash
# Push to GitHub
git push origin main

# Connect to Vercel
# https://vercel.com/new
```

### Self-Hosted Backend
```bash
python relay-api-v2.py
```

---

## 📈 Project Status

| Component | Status | Details |
|-----------|--------|---------|
| **Phase 1** | ✅ Complete | Docker deployment, end-to-end routing verified |
| **Phase 2 Sprint 1** | ✅ Complete | Backend with Clerk auth + Neon PostgreSQL |
| **Phase 2 Sprint 2** | ✅ Complete | Dashboard with 6 pages |
| **Phase 2 Sprint 3** | 🔜 Next | Database integration & logging |
| **Phase 2 Sprint 4** | 🔜 Future | Multi-region support |
| **Phase 2 Sprint 5** | 🔜 Future | Security hardening |
| **Phase 2 Sprint 6** | 🔜 Future | Billing integration |

---

## 🔗 Resources

- **GitHub**: https://github.com/AiDevAbdul/telenort-router.git
- **Clerk**: https://clerk.com/docs
- **Neon**: https://neon.tech/docs
- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **WireGuard**: https://www.wireguard.com/quickstart

---

## 💡 Tips

1. **Start with Phase 1** - Validate the core concept with Docker
2. **Use Clerk** - Simplifies authentication significantly
3. **Test locally first** - Before deploying to production
4. **Read CLAUDE.md** - Contains important project context
5. **Check logs** - Always check logs when something fails

---

## ❓ FAQ

**Q: Can I run this on Windows?**
A: Yes, use WSL (Windows Subsystem for Linux) for bash scripts and Docker.

**Q: Do I need a GCP account?**
A: For Phase 1 testing with Docker, no. For production, yes.

**Q: How much does this cost?**
A: Phase 1 is free (Docker). Phase 2 requires Neon (~$15/month) and Clerk (free tier available).

**Q: Can I use a different auth provider?**
A: Yes, modify `auth.py` to use NextAuth.js or custom JWT.

**Q: Is this production-ready?**
A: Phase 1 is tested. Phase 2 is complete but needs integration testing.

---

## 🎯 Next Steps

1. **Clone the repo**
   ```bash
   git clone https://github.com/AiDevAbdul/telenort-router.git
   ```

2. **Read the docs**
   ```bash
   cat docs/00-START-HERE.md
   ```

3. **Choose your path** (Phase 1, Phase 2 Backend, or Phase 2 Dashboard)

4. **Follow setup instructions** for your chosen path

5. **Test thoroughly** before deploying to production

---

**Ready to get started?** Clone the repo and read `docs/00-START-HERE.md`!

**Questions?** Check `docs/TROUBLESHOOTING.md` or review the relevant sprint documentation.

**Status**: 🚀 Production Ready for Testing
