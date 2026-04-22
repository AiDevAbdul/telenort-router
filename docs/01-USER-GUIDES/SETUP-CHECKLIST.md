# Setup Checklist

Use this checklist to make sure everything is installed and configured correctly before starting.

## ✅ Pre-Installation Checklist

- [ ] **Git installed** - Run `git --version` in terminal
- [ ] **Python 3.9+ installed** - Run `python --version` in terminal
- [ ] **Node.js 18+ installed** - Run `node --version` in terminal
- [ ] **npm installed** - Run `npm --version` in terminal
- [ ] **WireGuard installed** - Download from wireguard.com
- [ ] **Internet connection working** - Test by visiting google.com
- [ ] **At least 2GB disk space available** - Check your drive
- [ ] **Ports 3000, 8000, 51820 are available** - See troubleshooting if not

## ✅ Code Setup Checklist

- [ ] **Repository cloned** - `git clone` completed
- [ ] **Backend dependencies installed** - `pip install -r requirements.txt` completed
- [ ] **Frontend dependencies installed** - `npm install` completed
- [ ] **No errors during installation** - Check terminal output

## ✅ Configuration Checklist

- [ ] **`backend/.env.local` created** - File exists in backend folder
- [ ] **`backend/.env.local` has all required keys** - Check all 3 variables
- [ ] **`frontend/.env.local` created** - File exists in frontend folder
- [ ] **`frontend/.env.local` has all required keys** - Check all 2 variables
- [ ] **No typos in environment variables** - Double-check carefully
- [ ] **Keys are not empty** - Each variable has a value

## ✅ Startup Checklist

- [ ] **Backend started successfully** - No errors in terminal
- [ ] **Frontend started successfully** - No errors in terminal
- [ ] **Backend health check passes** - Visit `http://localhost:8000/health`
- [ ] **Frontend loads** - Visit `http://localhost:3000`
- [ ] **Can sign in with Google** - Successfully authenticated
- [ ] **Dashboard displays** - No "Authentication failed" error
- [ ] **No console errors** - Press F12, check Console tab

## ✅ Functionality Checklist

- [ ] **Can create a tunnel** - Successfully created test tunnel
- [ ] **Can view tunnel details** - Tunnel appears in list
- [ ] **Can delete a tunnel** - Successfully deleted test tunnel
- [ ] **Public IP is assigned** - Tunnel shows an IP address
- [ ] **No network errors** - Network tab shows 200 status codes

## 🆘 If Any Item Fails

1. **Note which item failed**
2. **Check the Troubleshooting Guide** - See `TROUBLESHOOTING-GUIDE.md`
3. **Look for error messages** - In terminal or browser console
4. **Try the suggested fix** - Follow the troubleshooting steps
5. **If still stuck** - Ask your administrator for help

---

**Tip:** Print this checklist and check off items as you go. It helps you track progress and identify where problems occur.

**Last Updated:** 2026-04-22
