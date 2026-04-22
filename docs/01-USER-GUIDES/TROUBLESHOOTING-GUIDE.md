# Troubleshooting Guide

Common problems and how to fix them.

---

## Installation Problems

### "Python not found" or "python: command not found"

**Problem:** Python isn't installed or not in your PATH.

**Solution:**
1. Download Python from [python.org](https://www.python.org)
2. **Important:** Check "Add Python to PATH" during installation
3. Restart your terminal
4. Run `python --version` to verify

**Windows users:** You might need to use `python3` instead of `python`

---

### "Node not found" or "npm: command not found"

**Problem:** Node.js isn't installed or not in your PATH.

**Solution:**
1. Download Node.js from [nodejs.org](https://nodejs.org)
2. Choose the LTS (Long Term Support) version
3. Run the installer and follow prompts
4. Restart your terminal
5. Run `node --version` to verify

---

### "pip install fails" or "ModuleNotFoundError"

**Problem:** Python packages aren't installing correctly.

**Solution:**
```bash
# Make sure you're in the backend folder
cd backend

# Try upgrading pip first
python -m pip install --upgrade pip

# Then install requirements
pip install -r requirements.txt
```

**If still failing:**
```bash
# Try installing packages one by one
pip install fastapi
pip install uvicorn
pip install pydantic
```

---

### "npm install fails" or "Cannot find module"

**Problem:** Node packages aren't installing correctly.

**Solution:**
```bash
# Make sure you're in the frontend folder
cd frontend

# Clear npm cache
npm cache clean --force

# Delete node_modules folder
rm -rf node_modules

# Reinstall
npm install
```

---

## Startup Problems

### "Port 3000 already in use"

**Problem:** Something else is using port 3000.

**Windows PowerShell:**
```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Kill it (replace PID with the number shown)
Stop-Process -Id PID -Force
```

**Mac/Linux:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it (replace PID with the number shown)
kill -9 PID
```

**Alternative:** Use a different port
```bash
# Frontend on port 3001 instead
npm run dev -- -p 3001

# Update backend .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### "Port 8000 already in use"

**Problem:** Something else is using port 8000.

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

**Alternative:** Use a different port
```bash
# Backend on port 8001 instead
python relay-api.py --port 8001

# Update frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

### "Backend won't start" or "ModuleNotFoundError"

**Problem:** Python dependencies aren't installed.

**Solution:**
```bash
cd backend
pip install -r requirements.txt
python relay-api.py
```

**If you see specific module errors:**
```bash
# Install the missing module
pip install module-name
```

---

### "Frontend won't start" or "Cannot find module"

**Problem:** Node dependencies aren't installed.

**Solution:**
```bash
cd frontend
npm install
npm run dev
```

---

## Authentication Problems

### "Authentication failed. Please sign in again."

**Problem:** Your Clerk keys are wrong or missing.

**Solution:**
1. Check `backend/.env.local` exists
2. Check `frontend/.env.local` exists
3. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is in both files
4. Verify `CLERK_SECRET_KEY` is in backend only
5. Make sure values aren't empty
6. Make sure there are no extra spaces or quotes
7. Restart both backend and frontend
8. Clear browser cache (Ctrl+Shift+Delete)
9. Try signing in again

---

### "Cannot connect to backend"

**Problem:** Frontend can't reach the backend API.

**Solution:**
1. Make sure backend is running: `http://localhost:8000/health`
2. Check `frontend/.env.local` has correct `NEXT_PUBLIC_API_URL`
3. If using different port, update the URL
4. Restart frontend: `npm run dev`
5. Check browser Network tab (F12) for failed requests

---

### "Clerk keys are invalid"

**Problem:** Your Clerk keys are wrong.

**Solution:**
1. Go to [clerk.com](https://clerk.com)
2. Sign in to your account
3. Go to your project
4. Find API Keys section
5. Copy the correct keys
6. Update `.env.local` files
7. Restart both services

---

## Dashboard Problems

### "Dashboard shows blank page"

**Problem:** Frontend loaded but dashboard didn't render.

**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Refresh page (Ctrl+R)
5. Clear cache (Ctrl+Shift+Delete)
6. Try signing out and back in

---

### "Dashboard shows error message"

**Problem:** Dashboard displays an error.

**Solution:**
1. Read the error message carefully
2. Check browser console (F12) for details
3. Check backend terminal for error messages
4. Verify backend is running
5. Verify all environment variables are set
6. Restart both services

---

### "Can't create a tunnel"

**Problem:** Tunnel creation fails.

**Solution:**
1. Check backend is running
2. Check browser console (F12) for error details
3. Verify database connection is working
4. Try creating with a different name
5. Check backend terminal for error messages

---

### "Can't see tunnels in dashboard"

**Problem:** Dashboard loads but no tunnels appear.

**Solution:**
1. Try creating a new tunnel
2. Refresh page (Ctrl+R)
3. Check browser console (F12) for errors
4. Check backend terminal for error messages
5. Verify database connection is working

---

## Network Problems

### "Cannot reach http://localhost:3000"

**Problem:** Frontend isn't accessible.

**Solution:**
1. Make sure frontend is running
2. Check terminal shows "ready - started server on 0.0.0.0:3000"
3. Try `http://127.0.0.1:3000` instead
4. Check firewall isn't blocking port 3000
5. Restart frontend

---

### "Cannot reach http://localhost:8000/health"

**Problem:** Backend isn't accessible.

**Solution:**
1. Make sure backend is running
2. Check terminal shows "Uvicorn running on http://0.0.0.0:8000"
3. Try `http://127.0.0.1:8000/health` instead
4. Check firewall isn't blocking port 8000
5. Restart backend

---

### "Firewall is blocking ports"

**Problem:** Windows Firewall is blocking connections.

**Solution:**
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Python and Node.js in the list
4. Check both "Private" and "Public" boxes
5. Click OK

---

## Database Problems

### "Cannot connect to database"

**Problem:** Backend can't reach the database.

**Solution:**
1. Check `DATABASE_URL` in `backend/.env.local`
2. Verify the URL is correct
3. Check your internet connection
4. Try connecting to the database directly
5. Ask your administrator for the correct URL

---

### "Database connection timeout"

**Problem:** Database is too slow or unreachable.

**Solution:**
1. Check your internet connection
2. Check database server is running
3. Try again in a few seconds
4. Restart backend
5. Ask your administrator to check database status

---

## File Permission Problems

### "Permission denied" error

**Problem:** You don't have permission to run a file.

**Solution:**

**Mac/Linux:**
```bash
# Make script executable
chmod +x exit-agent.sh
chmod +x remote-client-setup.sh

# Then run it
./exit-agent.sh
```

**Windows:** Usually not an issue, but try running as Administrator

---

## Still Stuck?

If none of these solutions work:

1. **Collect information:**
   - What error message do you see?
   - What were you trying to do?
   - What terminal output do you see?
   - What browser console errors (F12)?

2. **Check logs:**
   - Backend terminal output
   - Frontend terminal output
   - Browser console (F12)
   - Browser Network tab (F12)

3. **Ask for help:**
   - Share the error message
   - Share terminal output
   - Share browser console errors
   - Tell them what you were doing

---

**Last Updated:** 2026-04-22
