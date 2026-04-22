# Quick Start - Authentication Fix Testing

## Step 1: Start Backend (Manual)

Open a new terminal/PowerShell and run:

```powershell
cd F:\telenor-router\backend
python relay-api.py
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 2: Start Frontend (Manual)

Open another terminal and run:

```powershell
cd F:\telenor-router\frontend
npm run dev
```

You should see output like:
```
▲ Next.js 14.0.0
- Local:        http://localhost:3000
```

## Step 3: Test Authentication

1. Open http://localhost:3000 in your browser
2. Click "Sign In"
3. Sign in with Google
4. You should be redirected to the dashboard
5. Dashboard should load without "Authentication failed" error

## Verification Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Can sign in with Google
- [ ] Dashboard loads without errors
- [ ] No "Authentication failed" message
- [ ] Check browser DevTools Network tab for Authorization header

## If You See Errors

### "Authentication failed" still appears
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for `/tunnels` request
4. Check if it has `Authorization: Bearer <token>` header
5. Check response status (should be 200, not 401)

### Backend won't start
1. Verify Python 3.13 is installed: `python --version`
2. Verify dependencies installed: `pip list | grep fastapi`
3. Check `.env.local` has database URL set
4. Check port 8000 is not in use: `netstat -ano | findstr :8000`

### Frontend won't start
1. Verify Node.js installed: `node --version`
2. Verify npm packages installed: `npm list next`
3. Check `.env.local` has Clerk keys set
4. Check port 3000 is not in use

## Environment Variables

Make sure these are set in your `.env.local` files:

**`backend/.env.local`**:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

**`frontend/.env.local`**:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Next Steps After Testing

1. Test creating a tunnel
2. Test viewing tunnel details
3. Test deleting a tunnel
4. Check database for created user record

See `docs/AUTH-TESTING-CHECKLIST.md` for comprehensive testing procedures.
