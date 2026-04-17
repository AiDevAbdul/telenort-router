# IP-Relay Complete Startup Guide

## Quick Start (Choose Your Platform)

### Linux/macOS
```bash
# Make the script executable
chmod +x start-all.sh

# Start all services
./start-all.sh

# Or use Make (if installed)
make start
```

### Windows
```bash
# Run the batch script
start-all.bat

# Or use PowerShell
powershell -ExecutionPolicy Bypass -File start-all.ps1
```

### Docker Compose (All Platforms)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## What Gets Started

When you run the startup command, the following services are automatically started:

### 1. **Relay VM** (Docker Container)
- **Port**: 51820/UDP (WireGuard), 8000/TCP (API)
- **Purpose**: WireGuard hub + FastAPI service for peer management
- **Status**: Automatically waits for API to be ready before starting dashboard

### 2. **Dashboard** (Next.js)
- **Port**: 3000/TCP
- **Purpose**: Web UI for managing tunnels and exit agents
- **Mode**: Development (hot reload) or Production (optimized)

### 3. **Exit Agent** (Optional)
- **Purpose**: Establishes reverse tunnel from home/office to relay VM
- **Activation**: Use `--with-exit-agent` flag (requires configuration)

---

## Detailed Usage

### Linux/macOS with Bash Script

```bash
# Development mode (default)
./start-all.sh

# Production mode
./start-all.sh --prod

# With exit agent
./start-all.sh --with-exit-agent

# Combined
./start-all.sh --prod --with-exit-agent

# Show help
./start-all.sh --help
```

**What it does:**
1. Checks for Docker, Docker Compose, and Node.js
2. Creates `.env` files from examples if missing
3. Installs dashboard dependencies
4. Starts Relay VM container
5. Waits for API to be ready
6. Starts dashboard (dev or prod mode)
7. Shows status and next steps

### Windows with Batch Script

```batch
REM Development mode (default)
start-all.bat

REM Production mode
start-all.bat --prod

REM Show help
start-all.bat --help
```

**Note**: Opens dashboard in a new command window for live output.

### Using Make (Linux/macOS)

```bash
# Show all available commands
make help

# Start in development mode
make start
make start-dev

# Start in production mode
make start-prod

# Stop all services
make stop

# Restart all services
make restart

# View logs
make logs
make logs-relay
make logs-dashboard

# Check service health
make health

# Show status
make status

# Clean up everything
make clean

# Run tests
make test

# Open shell in containers
make shell-relay
make shell-dashboard
```

### Using Docker Compose Directly

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d relay-vm
docker-compose up -d dashboard

# View logs
docker-compose logs -f
docker-compose logs -f relay-vm
docker-compose logs -f dashboard

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart services
docker-compose restart

# Check status
docker-compose ps
```

---

## Environment Configuration

### Root Level (.env)

Create or update `.env` in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/ip_relay

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Server Configuration
SERVER_REGION=us-central1
SERVER_PUBLIC_IP=your_relay_vm_public_ip

# Optional: Stripe for billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn_here
```

### Dashboard Level (dashboard/.env.local)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Accessing Services

Once everything is running:

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:3000 | Web UI |
| Relay API | http://localhost:8000 | API endpoint |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Health Check | http://localhost:8000/health | API health status |

---

## Stopping Services

### Stop All Services

```bash
# Using docker-compose
docker-compose down

# Using Make
make stop

# Using bash script (Ctrl+C)
# Press Ctrl+C in the terminal running start-all.sh
```

### Stop Specific Service

```bash
# Stop relay VM
docker-compose stop relay-vm

# Stop dashboard
docker-compose stop dashboard

# Restart a service
docker-compose restart relay-vm
```

---

## Viewing Logs

### All Services
```bash
docker-compose logs -f
make logs
```

### Relay VM Only
```bash
docker-compose logs -f relay-vm
make logs-relay
```

### Dashboard Only
```bash
docker-compose logs -f dashboard
make logs-dashboard
```

### With Timestamps
```bash
docker-compose logs -f --timestamps
```

### Last N Lines
```bash
docker-compose logs --tail=50 relay-vm
```

---

## Troubleshooting

### Services Won't Start

1. **Check Docker is running**
   ```bash
   docker ps
   ```

2. **Check ports are available**
   ```bash
   # Linux/macOS
   lsof -i :3000
   lsof -i :8000
   lsof -i :51820

   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :8000
   ```

3. **View detailed logs**
   ```bash
   docker-compose logs relay-vm
   docker-compose logs dashboard
   ```

### API Not Responding

```bash
# Check if container is running
docker-compose ps relay-vm

# Check logs
docker-compose logs relay-vm

# Restart the service
docker-compose restart relay-vm
```

### Dashboard Not Loading

```bash
# Check if container is running
docker-compose ps dashboard

# Check logs
docker-compose logs dashboard

# Restart the service
docker-compose restart dashboard

# Check if port 3000 is in use
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows
```

### Environment Variables Not Loaded

1. Ensure `.env` file exists in project root
2. Ensure `dashboard/.env.local` exists
3. Restart services after updating `.env` files
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## Development Workflow

### Making Changes

1. **Backend (Relay API)**
   - Edit Python files in root directory
   - Restart relay VM: `docker-compose restart relay-vm`

2. **Frontend (Dashboard)**
   - Edit files in `dashboard/` directory
   - Changes auto-reload in development mode
   - No restart needed

3. **Configuration**
   - Update `.env` or `dashboard/.env.local`
   - Restart services for changes to take effect

### Running Tests

```bash
# Type checking
make test
cd dashboard && npm run type-check

# Linting
cd dashboard && npm run lint
```

---

## Production Deployment

### Build for Production

```bash
# Using Make
make build

# Using docker-compose
docker-compose build

# Using bash script
./start-all.sh --prod
```

### Start in Production Mode

```bash
# Using Make
make start-prod

# Using bash script
./start-all.sh --prod

# Using docker-compose
docker-compose up -d
```

### Production Checklist

- [ ] Update `.env` with production values
- [ ] Set `NODE_ENV=production` in environment
- [ ] Configure database connection
- [ ] Set up Clerk authentication
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring (Sentry)
- [ ] Configure backups
- [ ] Test all endpoints

---

## Advanced Usage

### Custom Configuration

Edit `docker-compose.yml` to customize:
- Port mappings
- Environment variables
- Volume mounts
- Resource limits
- Restart policies

### Running Individual Services

```bash
# Start only relay VM
docker-compose up -d relay-vm

# Start only dashboard
docker-compose up -d dashboard

# Useful for development when you want to run dashboard locally
docker-compose up -d relay-vm
cd dashboard && npm run dev
```

### Scaling

For production with multiple instances:
1. Use load balancer (nginx, HAProxy)
2. Configure multiple relay VMs
3. Use managed database (Neon PostgreSQL)
4. Deploy dashboard to CDN/hosting service

---

## Cleanup

### Remove All Containers and Volumes

```bash
# Using docker-compose
docker-compose down -v

# Using Make
make clean

# Manual cleanup
docker-compose down
rm -rf dashboard/node_modules
rm -rf dashboard/.next
```

### Remove Specific Service

```bash
docker-compose down relay-vm
docker volume rm ip-relay_relay-data
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start all | `./start-all.sh` or `make start` |
| Stop all | `docker-compose down` or `make stop` |
| View logs | `docker-compose logs -f` or `make logs` |
| Check status | `docker-compose ps` or `make status` |
| Restart | `docker-compose restart` or `make restart` |
| Clean up | `docker-compose down -v` or `make clean` |
| Health check | `make health` |
| Open shell | `make shell-relay` or `make shell-dashboard` |

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review troubleshooting section above
3. Check `.env` configuration
4. Ensure all prerequisites are installed
5. Verify ports are available

---

## Next Steps

1. **Configure Environment**
   - Update `.env` with your settings
   - Configure Clerk authentication
   - Set database connection

2. **Access Dashboard**
   - Open http://localhost:3000
   - Sign in with Clerk
   - Create tunnels and exit agents

3. **Deploy Exit Agent**
   - Run exit agent on home/office PC
   - Configure tunnel settings
   - Verify public IP matching

4. **Monitor System**
   - Check API health: http://localhost:8000/health
   - View logs: `docker-compose logs -f`
   - Monitor performance

---

**Last Updated**: 2026-04-15
**Version**: 1.0.0
