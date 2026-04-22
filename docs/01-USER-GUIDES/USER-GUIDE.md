# IP-Relay User Guide

Welcome to IP-Relay! This guide walks you through everything you need to get started, from prerequisites to running your first tunnel.

---

## 📋 Prerequisites

Before you begin, make sure you have these installed on your computer:

### Required Software
- **Git** - Version control (download from [git-scm.com](https://git-scm.com))
- **Python 3.9+** - Programming language (download from [python.org](https://www.python.org))
- **Node.js 18+** - JavaScript runtime (download from [nodejs.org](https://nodejs.org))
- **WireGuard** - VPN software (download from [wireguard.com](https://www.wireguard.com))

### Accounts You'll Need
- **Google Account** - For signing in to the dashboard
- **GCP Account** - For deploying the relay server (optional for testing)

### System Requirements
- **Internet Connection** - Stable connection required
- **Disk Space** - At least 2GB free
- **Ports Available** - 3000 (frontend), 8000 (backend), 51820 (WireGuard)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Get the Code
```bash
git clone https://github.com/your-org/telenor-router.git
cd telenor-router
```

### Step 2: Set Up Backend
```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Set Up Frontend
```bash
cd ../frontend
npm install
```

### Step 4: Start Services

**On Windows**, double-click these files:
- `backend/start-backend.bat`
- `frontend/start-frontend.bat`

**On Mac/Linux**, run in separate terminals:
```bash
# Terminal 1
cd backend
python relay-api.py

# Terminal 2
cd frontend
npm run dev
```

### Step 5: Open Dashboard
Visit `http://localhost:3000` in your browser and sign in with Google.

---

## 🔧 Configuration

### Environment Variables

You need to set up two `.env.local` files. Ask your administrator for these values.

**`backend/.env.local`**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here
DATABASE_URL=your_database_url_here
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Where to Get These Values
1. **Clerk Keys** - Ask your project administrator
2. **Database URL** - Ask your project administrator
3. **API URL** - Use `http://localhost:8000` for local testing

---

## 📱 Using the Dashboard

### Sign In
1. Click "Sign In" button
2. Choose "Sign in with Google"
3. Select your Google account
4. You're in!

### Create a Tunnel
1. Click "Create Tunnel" button
2. Enter a name (e.g., "My Home Office")
3. Select a region (e.g., "US Central")
4. Click "Create"
5. Copy your tunnel configuration

### View Tunnels
- All your tunnels appear on the dashboard
- Click a tunnel to see details
- See the public IP address assigned to your tunnel

### Delete a Tunnel
1. Find the tunnel in the list
2. Click the delete button (trash icon)
3. Confirm deletion

---

## 🔌 Connecting Your Device

### For Exit Agent (Server)
```bash
./exit-agent.sh --relay-url http://your-relay-server:8000
```

### For Remote Client
```bash
./remote-client-setup.sh --tunnel-config your-config.conf
```

See the dashboard for your specific configuration.

---

## ✅ Verify It's Working

After starting the services, check these:

**Dashboard loads?**
- ✅ Visit `http://localhost:3000`
- ✅ You can sign in with Google
- ✅ Dashboard shows "Total Tunnels" card

**Backend running?**
- ✅ Visit `http://localhost:8000/health`
- ✅ You should see `{"status":"ok"}`

**No errors?**
- ✅ Open browser DevTools (F12)
- ✅ Check Console tab - should be clean
- ✅ Check Network tab - requests should show 200 status

---

## 🆘 Troubleshooting

### "Port already in use" Error

**Windows PowerShell:**
```powershell
# Find what's using port 8000
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess

# Kill it (replace PID with the number shown)
Stop-Process -Id PID -Force
```

**Mac/Linux:**
```bash
# Find what's using port 8000
lsof -i :8000

# Kill it (replace PID with the number shown)
kill -9 PID
```

### "Authentication failed" Error

1. Check your `.env.local` files have correct Clerk keys
2. Verify backend is running: `http://localhost:8000/health`
3. Verify frontend is running: `http://localhost:3000`
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try signing in again

### "Cannot connect to backend" Error

1. Make sure backend is running
2. Check backend terminal for error messages
3. Verify port 8000 is available
4. Check firewall isn't blocking port 8000

### "Module not found" Error

**For backend:**
```bash
cd backend
pip install -r requirements.txt
```

**For frontend:**
```bash
cd frontend
npm install
```

### Services Won't Start

1. Make sure Python 3.9+ is installed: `python --version`
2. Make sure Node.js 18+ is installed: `node --version`
3. Make sure you're in the correct directory
4. Try deleting `node_modules` and running `npm install` again

---

## 📚 Next Steps

- **Learn More**: Read `docs/ARCHITECTURE.md` for technical details
- **Deploy to Cloud**: See `docs/07-deployment/DEPLOYMENT-SUMMARY.md`
- **Advanced Setup**: Check `docs/QUICK-REFERENCE.md` for all commands

---

## 💬 Getting Help

If you're stuck:

1. **Check the logs** - Look at terminal output for error messages
2. **Check browser console** - Press F12, click Console tab
3. **Read troubleshooting** - See section above
4. **Ask your administrator** - They can help with configuration

---

## 🔒 Security Notes

- Never share your `.env.local` files
- Never commit `.env.local` to Git
- Keep your Clerk keys secret
- Use HTTPS in production (not HTTP)

---

**Last Updated:** 2026-04-22
