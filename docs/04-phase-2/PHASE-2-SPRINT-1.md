# Phase 2 Sprint 1: Authentication & User Management - Implementation Guide

**Status**: In Progress
**Sprint Duration**: Week 1
**Target Completion**: 2026-04-22

---

## Overview

Sprint 1 focuses on adding user authentication and database integration to transform the testing solution into a multi-user platform. We're using Clerk for authentication and Neon PostgreSQL for data persistence.

---

## What's New in Phase 2

### New Files Created
- `relay-api-v2.py` - Updated API with authentication and database support
- `db_config.py` - Database connection configuration
- `models.py` - SQLAlchemy ORM models (User, Tunnel, ExitAgent, APIKey, ConnectionLog)
- `auth.py` - Clerk authentication middleware
- `init_db.py` - Database initialization script
- `.env.example` - Environment configuration template

### Updated Files
- `requirements.txt` - Added: sqlalchemy, psycopg2, alembic, clerk-sdk, pyjwt, passlib

---

## Setup Instructions

### Step 1: Set Up Neon PostgreSQL

1. Go to https://console.neon.tech
2. Create a new project (or use existing)
3. Create a new database named `ip_relay`
4. Copy the connection string (looks like: `postgresql://user:password@host/ip_relay`)

### Step 2: Set Up Clerk Authentication

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy your:
   - **Public Key** (from API Keys section)
   - **Issuer URL** (from API Keys section)

### Step 3: Configure Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit .env with your values
# DATABASE_URL=postgresql://user:password@host/ip_relay
# CLERK_PUBLIC_KEY=your_public_key
# CLERK_ISSUER=https://your-instance.clerk.accounts.com
```

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 5: Initialize Database

```bash
python init_db.py
```

This creates all tables:
- `users` - User accounts
- `tunnels` - VPN tunnels
- `exit_agents` - Exit agent registrations
- `api_keys` - API key management
- `connection_logs` - Event logging

### Step 6: Run Phase 2 API

```bash
python relay-api-v2.py
```

The API will be available at `http://localhost:8000`

---

## API Endpoints - Phase 2

### Public Endpoints (No Auth Required)

#### Health Check
```bash
GET /health
```
Response:
```json
{
  "status": "ok",
  "version": "2.0.0"
}
```

#### Server Configuration
```bash
GET /server-config
```
Response:
```json
{
  "server_public_key": "...",
  "server_ip": "10.0.0.1",
  "listen_port": 51820,
  "server_tunnel_ip": "10.0.0.1"
}
```

### Protected Endpoints (Require Clerk JWT Token)

All protected endpoints require the `Authorization: Bearer <token>` header with a valid Clerk JWT token.

#### Get Current User
```bash
GET /users/me
Authorization: Bearer <token>
```
Response:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "subscription_tier": "free",
  "created_at": "2026-04-15T10:00:00"
}
```

#### List Tunnels
```bash
GET /tunnels
Authorization: Bearer <token>
```
Response:
```json
[
  {
    "id": "uuid",
    "name": "My Tunnel",
    "relay_region": "us-central1",
    "tunnel_ip_range": "10.0.0.0/24",
    "is_active": true,
    "created_at": "2026-04-15T10:00:00"
  }
]
```

#### Create Tunnel
```bash
POST /tunnels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Tunnel",
  "relay_region": "us-central1"
}
```
Response:
```json
{
  "id": "uuid",
  "name": "My Tunnel",
  "relay_region": "us-central1",
  "tunnel_ip_range": "10.0.0.0/24",
  "is_active": true
}
```

#### Register Exit Agent
```bash
POST /exit-agents/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "tunnel_id": "uuid",
  "name": "Home PC",
  "public_key": "wg_public_key_here"
}
```
Response:
```json
{
  "id": "uuid",
  "name": "Home PC",
  "status": "online",
  "tunnel_ip": "10.0.0.2/32",
  "message": "Exit agent registered successfully"
}
```

#### Generate Client Config
```bash
POST /generate-client-config
Authorization: Bearer <token>
Content-Type: application/json

{
  "tunnel_id": "uuid",
  "client_name": "my-device"
}
```
Response:
```json
{
  "client_name": "my-device",
  "public_key": "...",
  "private_key": "...",
  "allowed_ip": "10.0.0.3/32",
  "config": "[Interface]\nAddress = 10.0.0.3/24\n...",
  "status": "created"
}
```

#### List Peers
```bash
GET /peers
Authorization: Bearer <token>
```

#### Get WireGuard Status
```bash
GET /status
Authorization: Bearer <token>
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tunnels Table
```sql
CREATE TABLE tunnels (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  relay_region VARCHAR(50) DEFAULT 'us-central1',
  tunnel_ip_range VARCHAR(50) DEFAULT '10.0.0.0/24',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Exit Agents Table
```sql
CREATE TABLE exit_agents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  tunnel_id UUID NOT NULL REFERENCES tunnels(id),
  name VARCHAR(255) NOT NULL,
  public_ip VARCHAR(50),
  status VARCHAR(50) DEFAULT 'offline',
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Connection Logs Table
```sql
CREATE TABLE connection_logs (
  id UUID PRIMARY KEY,
  tunnel_id UUID NOT NULL REFERENCES tunnels(id),
  event VARCHAR(255) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Testing Phase 2 API

### 1. Get Clerk Token

First, authenticate with Clerk to get a JWT token. You can do this through:
- Clerk Dashboard (for testing)
- Your frontend application
- Clerk SDK

For testing, use a test token from Clerk Dashboard.

### 2. Test Protected Endpoint

```bash
# Get current user
curl -H "Authorization: Bearer <your_clerk_token>" \
  http://localhost:8000/users/me

# Create tunnel
curl -X POST \
  -H "Authorization: Bearer <your_clerk_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tunnel","relay_region":"us-central1"}' \
  http://localhost:8000/tunnels

# List tunnels
curl -H "Authorization: Bearer <your_clerk_token>" \
  http://localhost:8000/tunnels
```

---

## Migration from Phase 1 to Phase 2

### Option A: Parallel Deployment (Recommended)
1. Keep Phase 1 API running on port 8000
2. Deploy Phase 2 API on port 8001
3. Test Phase 2 thoroughly
4. Switch traffic to Phase 2
5. Sunset Phase 1

### Option B: In-Place Upgrade
1. Stop Phase 1 API
2. Set up database
3. Deploy Phase 2 API
4. Downtime: ~5 minutes

### Backward Compatibility
Phase 2 API maintains Phase 1 endpoints:
- `GET /health` - Works (returns version 2.0.0)
- `GET /server-config` - Works (no auth required)
- `POST /generate-client-config` - Works (requires auth in Phase 2)
- `GET /peers` - Works (requires auth in Phase 2)
- `GET /status` - Works (requires auth in Phase 2)

---

## Troubleshooting

### Database Connection Error
```
Error: could not translate host name "host" to address
```
**Solution**: Check DATABASE_URL in .env file. Ensure Neon project is active.

### Clerk Token Invalid
```
Error: Invalid token
```
**Solution**:
1. Verify CLERK_PUBLIC_KEY is correct
2. Ensure token is not expired
3. Check token format: `Authorization: Bearer <token>`

### Permission Denied on WireGuard
```
Error: Permission denied
```
**Solution**: Run API with sudo or add user to wireguard group:
```bash
sudo usermod -aG wireguard $USER
```

### Database Tables Not Created
```
Error: relation "users" does not exist
```
**Solution**: Run initialization script:
```bash
python init_db.py
```

---

## Next Steps

### Immediate (This Week)
- [ ] Set up Neon PostgreSQL
- [ ] Configure Clerk authentication
- [ ] Deploy Phase 2 API
- [ ] Test all endpoints
- [ ] Verify database operations

### Sprint 2 (Next Week)
- [ ] Build Next.js dashboard
- [ ] Implement user registration flow
- [ ] Create tunnel management UI
- [ ] Add exit agent management

### Sprint 3 (Week 3)
- [ ] Complete database integration
- [ ] Add connection logging
- [ ] Implement audit trail
- [ ] Add usage analytics

---

## Success Criteria

- [x] Database schema created
- [x] Clerk authentication integrated
- [x] Phase 2 API endpoints implemented
- [ ] All endpoints tested and working
- [ ] Database operations verified
- [ ] Documentation complete
- [ ] Ready for dashboard development

---

## Resources

- **Clerk Docs**: https://clerk.com/docs
- **Neon Docs**: https://neon.tech/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org
- **WireGuard Docs**: https://www.wireguard.com/quickstart

---

**Ready to deploy Phase 2 Sprint 1?** Follow the setup instructions above and test the API endpoints.
