# IP-Relay Complete Startup Solution

This directory contains everything needed to run the entire IP-Relay project with a single command.

## 🚀 Quick Start

Choose your platform and run the appropriate command:

### Linux/macOS
```bash
chmod +x start-all.sh
./start-all.sh
```

### Windows (PowerShell)
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\start-all.ps1
```

### Windows (Command Prompt)
```batch
start-all.bat
```

### Any Platform (Docker Compose)
```bash
docker-compose up -d
```

### Any Platform (Make)
```bash
make start
```

---

## 📋 What's Included

### Startup Scripts
- **`start-all.sh`** - Bash script for Linux/macOS (recommended)
- **`start-all.bat`** - Batch script for Windows Command Prompt
- **`start-all.ps1`** - PowerShell script for Windows (recommended)
- **`Makefile`** - Make commands for Unix-like systems
- **`docker-compose.yml`** - Docker Compose configuration

### Documentation
- **`STARTUP-GUIDE.md`** - Comprehensive startup guide with examples
- **`README.md`** - This file

### Docker
- **`dashboard/Dockerfile`** - Dashboard container image

---

## 🎯 What Gets Started

When you run any startup command, the following services are automatically started:

### 1. Relay VM (Docker Container)
- **WireGuard Hub** on port 51820/UDP
- **FastAPI Service** on port 8000/TCP
- Automatically waits for API to be ready before starting dashboard

### 2. Dashboard (Next.js)
- **Web UI** on port 3000/TCP
- Development mode with hot reload (default)
- Production mode with optimized build (with `--prod` flag)

### 3. Exit Agent (Optional)
- Establishes reverse tunnel from home/office to relay VM
- Activated with `--with-exit-agent` flag

---

## 📖 Usage Examples

### Bash Script (Linux/macOS)
```bash
# Development mode (default)
./start-all.sh

# Production mode
./start-all.sh --prod

# With exit agent
./start-all.sh --with-exit-agent

# Show help
./start-all.sh --help
```

### PowerShell Script (Windows)
```powershell
# Development mode (default)
.\start-all.ps1

# Production mode
.\start-all.ps1 -Prod

# With exit agent
.\start-all.ps1 -WithExitAgent

# Show help
.\start-all.ps1 -Help
```

### Batch Script (Windows)
```batch
# Development mode (default)
start-all.bat

# Production mode
start-all.bat --prod

# Show help
start-all.bat --help
```

### Make Commands (Linux/macOS)
```bash
make start              # Start all services (dev mode)
make start-prod         # Start all services (prod mode)
make stop               # Stop all services
make restart            # Restart all services
make logs               # View logs from all services
make status             # Show service status
make health             # Check service health
make clean              # Remove all containers and volumes
make test               # Run tests
make build              # Build for production
```

### Docker Compose (All Platforms)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Check status
docker-compose ps
```

---

## 🌐 Accessing Services

Once everything is running:

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:3000 | Web UI for managing tunnels |
| Relay API | http://localhost:8000 | API endpoint |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Health Check | http://localhost:8000/health | API health status |

---

## ⚙️ Configuration

### Environment Files

The startup scripts automatically create environment files from examples if they don't exist:

1. **`.env`** (Project root)
   - Database configuration
   - Clerk authentication keys
   - Server settings
   - Optional: Stripe, Sentry

2. **`dashboard/.env.local`** (Dashboard directory)
   - Clerk keys
   - API URL

### Manual Setup

If you need to manually configure:

```bash
# Copy example files
cp .env.example .env
cp dashboard/.env.example dashboard/.env.local

# Edit with your values
nano .env
nano dashboard/.env.local
```

---

## 🛑 Stopping Services

### Stop All Services
```bash
# Using docker-compose
docker-compose down

# Using Make
make stop

# Using bash script (Ctrl+C)
# Press Ctrl+C in the terminal
```

### Stop Specific Service
```bash
docker-compose stop relay-vm
docker-compose stop dashboard
```

---

## 📊 Viewing Logs

### All Services
```bash
docker-compose logs -f
make logs
```

### Specific Service
```bash
docker-compose logs -f relay-vm
docker-compose logs -f dashboard
make logs-relay
make logs-dashboard
```

---

## 🔧 Troubleshooting

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
```

---

## 📋 Prerequisites

Before running the startup scripts, ensure you have:

- **Docker** - Container runtime
- **Docker Compose** - Container orchestration
- **Node.js** (v18+) - JavaScript runtime
- **Git** - Version control (optional, for cloning)

### Installation

**Linux (Ubuntu/Debian)**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose nodejs npm
sudo usermod -aG docker $USER
```

**macOS**
```bash
brew install docker docker-compose node
# Start Docker Desktop from Applications
```

**Windows**
- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Download and install [Node.js](https://nodejs.org/)
- Use PowerShell or Command Prompt

---

## 🚀 Development Workflow

### Making Changes

**Backend (Relay API)**
- Edit Python files in root directory
- Restart relay VM: `docker-compose restart relay-vm`

**Frontend (Dashboard)**
- Edit files in `dashboard/` directory
- Changes auto-reload in development mode
- No restart needed

**Configuration**
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

## 📦 Production Deployment

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

---

## 🧹 Cleanup

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

---

## 📚 Additional Resources

- **[STARTUP-GUIDE.md](./STARTUP-GUIDE.md)** - Comprehensive startup guide with detailed examples
- **[docker-compose.yml](./docker-compose.yml)** - Docker Compose configuration
- **[Makefile](./Makefile)** - Make commands reference
- **[CLAUDE.md](./CLAUDE.md)** - Project context and architecture

---

## 🆘 Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Review [STARTUP-GUIDE.md](./STARTUP-GUIDE.md) troubleshooting section
3. Verify `.env` configuration
4. Ensure all prerequisites are installed
5. Verify ports are available

---

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Start all (dev) | `./start-all.sh` or `make start` |
| Start all (prod) | `./start-all.sh --prod` or `make start-prod` |
| Stop all | `docker-compose down` or `make stop` |
| View logs | `docker-compose logs -f` or `make logs` |
| Check status | `docker-compose ps` or `make status` |
| Restart | `docker-compose restart` or `make restart` |
| Clean up | `docker-compose down -v` or `make clean` |
| Health check | `make health` |

---

## 🎓 Next Steps

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

**Version**: 1.0.0
**Last Updated**: 2026-04-15
**Status**: Production Ready ✅
