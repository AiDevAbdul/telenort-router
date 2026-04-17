# IP-Relay Phase 2 - Production Features

**Status**: Planning
**Target**: Add authentication, dashboard, database, and multi-region support
**Estimated Duration**: 4-6 weeks

---

## Phase 2 Goals

Transform the testing solution into a production-ready SaaS platform with:
- User authentication and account management
- Web dashboard for managing tunnels and exit agents
- Persistent database for users, tunnels, and configurations
- Key rotation and security hardening
- Multi-region relay VM support
- Subscription tiers and billing integration

---

## Architecture Changes

### Current (Phase 1)
```
Remote Client → GCP Relay VM (hardcoded) → Exit Agent → Internet
```

### Phase 2
```
Remote Client → Load Balancer → Multiple Relay VMs (multi-region)
                                        ↓
                                   Database (Neon)
                                        ↓
                                   Auth Service (Clerk/NextAuth)
                                        ↓
                                   Dashboard (Next.js)
```

---

## Implementation Roadmap

### Sprint 1: Authentication & User Management (Week 1)
**Goal**: Secure user accounts and API access

#### 1.1 Backend Authentication
- [ ] Integrate Clerk or NextAuth.js for auth
- [ ] Create user model in Neon PostgreSQL
- [ ] Add JWT token generation and validation
- [ ] Implement API key management for programmatic access
- [ ] Add rate limiting and request throttling

**Files to create/modify**:
- `relay-api.py` - Add auth middleware, user endpoints
- `requirements.txt` - Add auth libraries (clerk-sdk, pyjwt, etc.)
- Database migrations for users table

#### 1.2 Database Setup
- [ ] Set up Neon PostgreSQL project
- [ ] Create schema for users, tunnels, exit-agents, api-keys
- [ ] Implement connection pooling
- [ ] Add database migration system (Alembic)

**Files to create**:
- `db/schema.sql` - Database schema
- `db/migrations/` - Migration files
- `db/models.py` - SQLAlchemy models

#### 1.3 API Updates
- [ ] Add `/auth/register` endpoint
- [ ] Add `/auth/login` endpoint
- [ ] Add `/auth/refresh` endpoint
- [ ] Protect existing endpoints with auth middleware
- [ ] Add user context to all requests

**Modified endpoints**:
- All existing endpoints require valid JWT token

---

### Sprint 2: Dashboard Frontend (Week 2)
**Goal**: Build web UI for tunnel management

#### 2.1 Next.js Project Setup
- [ ] Initialize Next.js 14+ project
- [ ] Set up TypeScript
- [ ] Configure Tailwind CSS for styling
- [ ] Set up authentication flow with Clerk/NextAuth

**Files to create**:
- `dashboard/` - New Next.js project directory
- `dashboard/app/` - App router structure
- `dashboard/components/` - Reusable components

#### 2.2 Core Dashboard Pages
- [ ] Login/signup page
- [ ] Dashboard home (overview of tunnels)
- [ ] Tunnels list page
- [ ] Create new tunnel page
- [ ] Exit agents management page
- [ ] Settings/profile page

**Pages to create**:
- `dashboard/app/auth/login/page.tsx`
- `dashboard/app/auth/signup/page.tsx`
- `dashboard/app/dashboard/page.tsx`
- `dashboard/app/tunnels/page.tsx`
- `dashboard/app/tunnels/[id]/page.tsx`
- `dashboard/app/exit-agents/page.tsx`
- `dashboard/app/settings/page.tsx`

#### 2.3 Dashboard Features
- [ ] Real-time tunnel status display
- [ ] Create/edit/delete tunnels
- [ ] Manage exit agents
- [ ] View connection logs
- [ ] Download WireGuard configs
- [ ] API key management

---

### Sprint 3: Database Integration (Week 2-3)
**Goal**: Persist all data and enable multi-user support

#### 3.1 Data Models
- [ ] Users table (id, email, password_hash, created_at, updated_at)
- [ ] Tunnels table (id, user_id, name, relay_region, created_at)
- [ ] Exit Agents table (id, user_id, tunnel_id, public_ip, status, last_seen)
- [ ] API Keys table (id, user_id, key_hash, created_at, expires_at)
- [ ] Connection Logs table (id, tunnel_id, event, timestamp)

#### 3.2 Backend Updates
- [ ] Replace hardcoded configs with database queries
- [ ] Add tunnel CRUD endpoints
- [ ] Add exit agent registration endpoint
- [ ] Add connection logging
- [ ] Implement audit trail

**Modified files**:
- `relay-api.py` - Add database integration
- `exit-agent.sh` - Add API key authentication
- `remote-client-setup.sh` - Add tunnel selection

---

### Sprint 4: Multi-Region Support (Week 3-4)
**Goal**: Deploy relay VMs in multiple regions

#### 4.1 Infrastructure
- [ ] Create Terraform modules for relay VM deployment
- [ ] Deploy relay VMs in: us-central1, europe-west1, asia-southeast1
- [ ] Set up load balancer to route clients to nearest region
- [ ] Configure DNS for relay endpoints

**Files to create**:
- `terraform/` - Infrastructure as code
- `terraform/main.tf` - Main configuration
- `terraform/variables.tf` - Variables
- `terraform/relay-vm.tf` - Relay VM module
- `terraform/load-balancer.tf` - Load balancer config

#### 4.2 Relay VM Updates
- [ ] Update relay-api.py to report region
- [ ] Add region selection in dashboard
- [ ] Implement region-aware client config generation
- [ ] Add cross-region failover logic

---

### Sprint 5: Key Rotation & Security (Week 4-5)
**Goal**: Implement security best practices

#### 5.1 Key Rotation
- [ ] Implement automatic WireGuard key rotation (monthly)
- [ ] Add key rotation endpoint to API
- [ ] Notify users of key rotation
- [ ] Implement graceful key transition period

#### 5.2 Security Hardening
- [ ] Add rate limiting to all endpoints
- [ ] Implement CORS properly
- [ ] Add request signing/verification
- [ ] Implement audit logging
- [ ] Add IP whitelisting for exit agents
- [ ] Implement DDoS protection

**Files to create/modify**:
- `relay-api.py` - Add security middleware
- `security/` - Security utilities

---

### Sprint 6: Billing & Subscription (Week 5-6)
**Goal**: Monetize the platform

#### 6.1 Subscription Tiers
- [ ] Define pricing tiers (Free, Pro, Enterprise)
- [ ] Integrate Stripe for payments
- [ ] Create subscription management endpoints
- [ ] Implement usage tracking

**Tiers**:
- **Free**: 1 tunnel, 1 exit agent, 1 region
- **Pro**: 5 tunnels, 5 exit agents, all regions, $9.99/month
- **Enterprise**: Unlimited, custom SLA, contact sales

#### 6.2 Dashboard Integration
- [ ] Add billing page
- [ ] Add subscription management
- [ ] Add usage analytics
- [ ] Add invoice history

---

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Neon PostgreSQL
- **Auth**: Clerk or NextAuth.js
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **API Documentation**: OpenAPI/Swagger

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query / SWR
- **Auth**: Clerk or NextAuth.js
- **UI Components**: Shadcn/ui or Headless UI

### Infrastructure
- **Cloud**: Google Cloud Platform (GCP)
- **IaC**: Terraform
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional, Phase 2.5)
- **Monitoring**: Cloud Monitoring / Datadog
- **Logging**: Cloud Logging / ELK

### Security
- **Secrets Management**: Google Secret Manager
- **SSL/TLS**: Let's Encrypt / Google-managed certificates
- **DDoS Protection**: Cloud Armor
- **Rate Limiting**: Redis-based

---

## Database Schema (Neon PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tunnels
CREATE TABLE tunnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relay_region VARCHAR(50) NOT NULL,
  tunnel_ip_range VARCHAR(50) DEFAULT '10.0.0.0/24',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exit Agents
CREATE TABLE exit_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tunnel_id UUID NOT NULL REFERENCES tunnels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  public_ip VARCHAR(50),
  status VARCHAR(50) DEFAULT 'offline',
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Connection Logs
CREATE TABLE connection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tunnel_id UUID NOT NULL REFERENCES tunnels(id) ON DELETE CASCADE,
  event VARCHAR(255) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints (Phase 2)

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout user

### Users
- `GET /users/me` - Get current user
- `PUT /users/me` - Update user profile
- `GET /users/me/api-keys` - List API keys
- `POST /users/me/api-keys` - Create API key
- `DELETE /users/me/api-keys/{key_id}` - Delete API key

### Tunnels
- `GET /tunnels` - List user's tunnels
- `POST /tunnels` - Create new tunnel
- `GET /tunnels/{tunnel_id}` - Get tunnel details
- `PUT /tunnels/{tunnel_id}` - Update tunnel
- `DELETE /tunnels/{tunnel_id}` - Delete tunnel
- `GET /tunnels/{tunnel_id}/config` - Get WireGuard config

### Exit Agents
- `GET /exit-agents` - List user's exit agents
- `POST /exit-agents/register` - Register exit agent
- `GET /exit-agents/{agent_id}` - Get agent details
- `PUT /exit-agents/{agent_id}` - Update agent
- `DELETE /exit-agents/{agent_id}` - Delete agent
- `GET /exit-agents/{agent_id}/status` - Get agent status

### Billing
- `GET /billing/subscription` - Get subscription info
- `POST /billing/upgrade` - Upgrade subscription
- `GET /billing/invoices` - List invoices
- `POST /billing/cancel` - Cancel subscription

---

## Migration Path from Phase 1

### Step 1: Database Setup
1. Create Neon PostgreSQL project
2. Run schema migrations
3. Create admin user

### Step 2: Backend Updates
1. Add database integration to relay-api.py
2. Implement authentication middleware
3. Migrate hardcoded configs to database
4. Deploy updated relay-api.py

### Step 3: Frontend Launch
1. Deploy Next.js dashboard
2. Set up authentication flow
3. Enable user registration

### Step 4: User Migration
1. Provide migration script for existing users
2. Maintain backward compatibility during transition
3. Sunset Phase 1 API after migration period

---

## Success Criteria

- [ ] All Phase 2 features implemented
- [ ] 95%+ API test coverage
- [ ] Dashboard fully functional
- [ ] Multi-region relay VMs operational
- [ ] Key rotation working automatically
- [ ] Billing integration complete
- [ ] Security audit passed
- [ ] Performance benchmarks met (< 100ms latency)
- [ ] Documentation complete
- [ ] Ready for beta launch

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Database performance | Use connection pooling, optimize queries, add caching |
| Auth complexity | Use managed service (Clerk), thorough testing |
| Multi-region latency | Use CDN, optimize relay VM placement |
| Security vulnerabilities | Regular audits, penetration testing, bug bounty |
| Billing integration issues | Thorough Stripe testing, fallback payment methods |

---

## Next Steps

1. **Immediate**: Set up Neon PostgreSQL project
2. **Week 1**: Implement authentication in relay-api.py
3. **Week 2**: Build Next.js dashboard skeleton
4. **Week 3**: Integrate database with backend
5. **Week 4**: Deploy multi-region relay VMs
6. **Week 5**: Implement key rotation and security
7. **Week 6**: Add billing integration

---

**Ready to start Phase 2?** Let's begin with Sprint 1: Authentication & User Management.
