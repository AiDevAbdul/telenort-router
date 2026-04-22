# Authentication Testing Checklist

## Pre-Test Setup

- [ ] Backend dependencies installed: `cd backend && pip install -r requirements.txt`
- [ ] Environment variables set in `backend/.env.local`:
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [ ] `CLERK_SECRET_KEY`
  - [ ] `DATABASE_URL` (Neon PostgreSQL)
- [ ] Environment variables set in `frontend/.env.local`:
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [ ] `NEXT_PUBLIC_API_URL=http://localhost:8000`

## Test Execution

### 1. Start Backend
```bash
cd backend
python relay-api.py
```
- [ ] Backend starts without errors
- [ ] API listening on http://localhost:8000
- [ ] Health check works: `curl http://localhost:8000/health`

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
- [ ] Frontend starts without errors
- [ ] Dashboard accessible at http://localhost:3000

### 3. Test Sign-In Flow
- [ ] Navigate to http://localhost:3000
- [ ] Click "Sign In" button
- [ ] Sign in with Google
- [ ] Redirected to dashboard (NOT sign-in page)
- [ ] No "Authentication failed" error message

### 4. Test Dashboard Load
- [ ] Dashboard displays without errors
- [ ] Stats cards visible (Total Tunnels, Active Tunnels, etc.)
- [ ] "Recent Tunnels" section loads
- [ ] No console errors in browser DevTools

### 5. Test API Requests
Open browser DevTools (F12) → Network tab:
- [ ] API requests to `/tunnels` include `Authorization: Bearer <token>` header
- [ ] Response status is 200 (not 401)
- [ ] Response contains tunnel data

### 6. Test User Creation
- [ ] First-time sign-in creates user in database
- [ ] Subsequent sign-ins use existing user
- [ ] User email and name populated from Clerk

### 7. Test Tunnel Operations
- [ ] Click "New Tunnel" button
- [ ] Create a test tunnel
- [ ] Tunnel appears in dashboard
- [ ] Can view tunnel details
- [ ] Can delete tunnel

## Troubleshooting

### "Authentication failed" still appears
1. Check browser console for errors
2. Verify Clerk environment variables are set
3. Check backend logs for JWT decode errors
4. Ensure token is being sent: check Network tab in DevTools

### 401 errors on API requests
1. Verify `setClerkToken()` is being called
2. Check that token is not null/undefined
3. Verify backend is decoding token correctly
4. Check database connection is working

### User not found in database
1. Verify database is running and connected
2. Check `User` table exists in database
3. Verify `clerk_id` is being extracted from JWT
4. Check database logs for errors

### Token decode errors
1. Verify JWT format is correct
2. Check that token is not expired
3. Verify Clerk keys are correct
4. Check backend logs for specific decode errors

## Success Criteria

✅ All tests pass when:
- User can sign in with Google without errors
- Dashboard loads with tunnel data
- API requests include valid authorization header
- No 401 authentication errors
- User is created in database on first login
- Subsequent operations (create/view/delete tunnels) work correctly
