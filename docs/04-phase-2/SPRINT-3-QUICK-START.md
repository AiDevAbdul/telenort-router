# Sprint 3 Quick Setup Guide

Get the database running in 5 minutes.

## Prerequisites
- Python 3.8+
- Neon PostgreSQL account (free at https://console.neon.tech)
- Git

## Step 1: Create Neon Database (2 min)

1. Go to https://console.neon.tech
2. Sign up or log in
3. Click "Create Project"
4. Copy the connection string (PostgreSQL)
5. It looks like: `postgresql://user:password@host/database`

## Step 2: Configure Backend (1 min)

```bash
cd backend
cp .env.example .env.local
```

Edit `.env.local` and paste your DATABASE_URL:
```
DATABASE_URL=postgresql://user:password@host/database
```

## Step 3: Install & Initialize (2 min)

```bash
pip install -r requirements.txt
python init_db.py
```

You should see:
```
✓ Database connection successful
✓ Database tables created successfully
✓ Test user created: test@example.com
✓ Test tunnel created: Test Tunnel
```

## Step 4: Start API Server

```bash
python relay-api.py
```

Server runs on `http://localhost:8000`

## Step 5: Test It Works

```bash
# Health check
curl http://localhost:8000/health

# Get current user (test user)
curl -H "Authorization: Bearer clerk_test_user_123" \
  http://localhost:8000/users/me

# List tunnels
curl -H "Authorization: Bearer clerk_test_user_123" \
  http://localhost:8000/tunnels
```

## Done! 🎉

Your database is now integrated. All data persists in Neon PostgreSQL.

### Next: Connect Frontend
The frontend (dashboard) can now connect to this API. See `/frontend/.env.example` for configuration.

### Test User Credentials
- Email: `test@example.com`
- Clerk ID: `clerk_test_user_123`
- Token: `Bearer clerk_test_user_123`

---

**Need help?** Check `PHASE-2-SPRINT-3.md` for detailed documentation.
