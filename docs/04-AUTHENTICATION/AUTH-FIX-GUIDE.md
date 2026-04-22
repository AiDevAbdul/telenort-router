# Authentication Fix Guide

## Problem
The "Authentication failed. Please sign in again." error was occurring because:

1. **Frontend**: Was trying to get token from `localStorage.getItem("clerk_token")`, but Clerk doesn't automatically store tokens there
2. **API Client**: Never had a valid token to send with requests
3. **Backend**: Expected tokens in format `clerk_<user_id>` instead of proper JWT tokens

## Solution Implemented

### Frontend Changes

#### 1. Updated `frontend/lib/api-client.ts`
- Removed localStorage token retrieval
- Added `setClerkToken()` function to set token from Clerk
- Token is now stored in memory and added to all API requests via interceptor

#### 2. Updated `frontend/app/dashboard/page.tsx`
- Added `useAuth()` hook from Clerk
- Calls `getToken()` to get the JWT token before making API requests
- Sets token via `setClerkToken()` before fetching data
- Shows error if token retrieval fails

### Backend Changes

#### 1. Updated `backend/requirements.txt`
- Added `clerk-sdk-python==0.1.0` for Clerk integration
- Added `httpx==0.24.1` for HTTP requests

#### 2. Updated `backend/relay-api.py`
- Added JWT import for token verification
- Updated `get_current_user()` function to:
  - Decode Clerk JWT tokens (without signature verification for now)
  - Extract `clerk_id` from token's `sub` claim
  - Auto-create users in database on first login
  - Extract email and name from token claims

## Setup Instructions

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Ensure Clerk Environment Variables
Make sure your `backend/.env.local` has:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

And your `frontend/.env.local` has:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Backend
```bash
cd backend
python relay-api.py
```

### 4. Start Frontend
```bash
cd frontend
npm run dev
```

## How It Works Now

1. User signs in with Google via Clerk
2. Frontend calls `useAuth().getToken()` to get JWT token
3. Token is set in API client via `setClerkToken()`
4. All subsequent API requests include `Authorization: Bearer <jwt_token>`
5. Backend decodes JWT and extracts `clerk_id`
6. Backend looks up user in database, or creates new user on first login
7. Request proceeds with authenticated user context

## Testing

1. Navigate to http://localhost:3000
2. Click "Sign In"
3. Sign in with Google
4. You should be redirected to dashboard
5. Dashboard should load tunnels without "Authentication failed" error

## Security Notes

- Currently, JWT tokens are decoded **without signature verification**
- This is acceptable for development/testing
- For production, implement proper JWT signature verification using Clerk's public key
- Consider adding token expiration checks
- Add rate limiting to prevent brute force attacks

## Next Steps

1. Test the authentication flow end-to-end
2. Verify users are created in database on first login
3. Test creating/viewing tunnels
4. Implement JWT signature verification for production
5. Add token refresh logic if needed
