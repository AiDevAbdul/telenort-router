# Neon PostgreSQL Setup Guide

**Date**: 2026-04-21
**Status**: Setup Instructions

---

## Quick Setup (5 Minutes)

### Step 1: Create Neon Account & Project

1. Go to https://console.neon.tech
2. Sign up or log in with GitHub/Google
3. Click "Create Project"
4. Choose:
   - **Region**: us-east-1 (or closest to you)
   - **Postgres Version**: 15 or 16
5. Click "Create Project"

### Step 2: Get Connection String

1. In Neon dashboard, go to "Connection string"
2. Select "Pooler" (for serverless compatibility)
3. Copy the full connection string
4. It looks like:
   ```
   postgresql://neondb_owner:npg_xxxxx@ep-xxxxx-pooler.c-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Configure Backend

```bash
cd backend
cp .env.example .env.local
```

Edit `.env.local` and replace the `DATABASE_URL`:
```
DATABASE_URL=postgresql://neondb_owner:npg_xxxxx@ep-xxxxx-pooler.c-2.aws.neon.tech/neondb?sslmode=require
```

### Step 4: Initialize Database

```bash
python init_db.py
```

You should see:
```
Database connection successful
Database tables created successfully
Test user created: test@example.com
Test tunnel created: Test Tunnel
```

### Step 5: Start API Server

```bash
python relay-api.py
```

Server runs on `http://localhost:8000`

### Step 6: Test It Works

```bash
# Health check
curl http://localhost:8000/health

# Get current user
curl -H "Authorization: Bearer clerk_test_user_123" \
  http://localhost:8000/users/me

# List tunnels
curl -H "Authorization: Bearer clerk_test_user_123" \
  http://localhost:8000/tunnels
```

---

## Troubleshooting

### Connection Failed: "password authentication failed"

**Cause**: DATABASE_URL not set or incorrect credentials

**Fix**:
1. Check `.env.local` exists in `backend/` directory
2. Verify DATABASE_URL is correct (copy from Neon dashboard again)
3. Make sure you're using the "Pooler" connection string, not "Direct"

### Connection Timeout

**Cause**: Firewall or network issue

**Fix**:
1. Neon allows connections from anywhere (no IP whitelist needed)
2. Check your internet connection
3. Try from a different network

### SSL Certificate Error

**Cause**: Missing `sslmode=require` in connection string

**Fix**:
- Ensure your DATABASE_URL includes `?sslmode=require`

---

## Test User Credentials

For development, a test user is automatically created:

```
Email: test@example.com
Clerk ID: clerk_test_user_123
Token: Bearer clerk_test_user_123
Tunnel: "Test Tunnel" (us-central1)
```

Use the token in the `Authorization` header for all protected endpoints.

---

## Database Schema

The following tables are automatically created:

1. **users** - User accounts with Clerk integration
2. **tunnels** - VPN tunnels (per user)
3. **exit_agents** - Exit agents (per tunnel)
4. **api_keys** - API keys for programmatic access
5. **connection_logs** - Audit trail of all events

---

## Next Steps

1. Verify all endpoints work with test user
2. Connect frontend dashboard to this API
3. Test tunnel creation and exit agent registration
4. Deploy to production (Sprint 4+)

---

## Useful Neon Commands

### View Database in Neon Console

1. Go to https://console.neon.tech
2. Click your project
3. Click "SQL Editor"
4. Run queries to inspect data:

```sql
-- View all users
SELECT * FROM users;

-- View all tunnels
SELECT * FROM tunnels;

-- View connection logs
SELECT * FROM connection_logs ORDER BY timestamp DESC LIMIT 10;
```

### Reset Database

If you need to start fresh:

```bash
# Delete all data (keeps schema)
python -c "
from db_config import SessionLocal, engine
from models import Base
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
print('Database reset')
"

# Then reinitialize
python init_db.py
```

---

## Production Considerations

- Neon provides 99.9% uptime SLA
- Automatic backups every 24 hours
- Connection pooling optimized for serverless
- Scales automatically with usage
- Free tier includes 3GB storage

For production, consider:
- Upgrading to paid plan for higher limits
- Setting up automated backups
- Monitoring query performance
- Implementing connection pooling on app side

---

**Status**: Ready to initialize database
**Next**: Run `python init_db.py` after setting DATABASE_URL
