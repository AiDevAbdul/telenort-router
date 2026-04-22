# Authentication Fix - Quick Reference

## Start Services (Windows)

### Option 1: Using Batch Files (Easiest)
1. Double-click `backend/start-backend.bat`
2. Double-click `frontend/start-frontend.bat`

### Option 2: Manual (PowerShell/CMD)
```powershell
# Terminal 1
cd F:\telenor-router\backend
python relay-api.py

# Terminal 2
cd F:\telenor-router\frontend
npm run dev
```

## Test Authentication

1. Open http://localhost:3000
2. Click "Sign In"
3. Sign in with Google
4. Dashboard should load without errors

## Verify It's Working

✅ **Success indicators**:
- Dashboard loads without "Authentication failed" error
- Stats cards visible (Total Tunnels, Active Tunnels, etc.)
- No console errors in browser DevTools
- Network tab shows `/tunnels` request with `Authorization: Bearer <token>` header

❌ **If you see errors**:
- Check browser DevTools (F12) → Console tab for errors
- Check Network tab for failed requests
- Verify `.env.local` files have correct Clerk keys
- Verify backend is running on http://localhost:8000
- Verify frontend is running on http://localhost:3000

## Port Issues

If you get "port already in use" error:

**Windows PowerShell**:
```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess

# Kill the process (replace PID with actual process ID)
Stop-Process -Id PID -Force
```

**Or use a different port**:
```bash
# Backend on port 8001
python relay-api.py --port 8001

# Update frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Environment Variables Checklist

**`backend/.env.local`** (required):
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- [ ] `CLERK_SECRET_KEY` - From Clerk dashboard
- [ ] `DATABASE_URL` - Neon PostgreSQL connection string

**`frontend/.env.local`** (required):
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Same as backend
- [ ] `NEXT_PUBLIC_API_URL` - http://localhost:8000 (or your port)

## Next Steps After Testing

1. Create a test tunnel
2. View tunnel details
3. Delete the tunnel
4. Check database for user record

## Documentation

- `QUICK-START-AUTH-FIX.md` - Detailed quick start
- `AUTH-TESTING-CHECKLIST.md` - Full testing procedures
- `AUTH-FIX-GUIDE.md` - Setup and configuration
- `AUTH-FIX-SUMMARY.md` - Technical details

## Support

If issues persist:
1. Check browser console for errors
2. Check backend terminal for error messages
3. Verify all environment variables are set
4. Verify ports 3000 and 8000 are available
5. See `AUTH-TESTING-CHECKLIST.md` for troubleshooting
