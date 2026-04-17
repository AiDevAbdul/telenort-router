# Phase 2 Sprint 2: Dashboard Frontend - Implementation Guide

**Status**: Complete
**Sprint Duration**: Week 2
**Target Completion**: 2026-04-22

---

## Overview

Sprint 2 focuses on building a production-ready Next.js dashboard for managing tunnels, exit agents, and user accounts. The dashboard integrates with the Phase 2 Sprint 1 backend API using Clerk for authentication.

---

## What's New in Sprint 2

### Project Structure
```
dashboard/
├── app/
│   ├── layout.tsx                 # Root layout with Clerk provider
│   ├── page.tsx                   # Redirect to dashboard
│   ├── globals.css                # Global Tailwind styles
│   └── dashboard/
│       ├── layout.tsx             # Dashboard layout with sidebar
│       ├── page.tsx               # Dashboard home
│       ├── tunnels/
│       │   ├── page.tsx           # Tunnels list
│       │   ├── new/page.tsx       # Create tunnel
│       │   └── [id]/page.tsx      # Tunnel detail & config
│       ├── exit-agents/
│       │   └── page.tsx           # Exit agents list
│       └── settings/
│           └── page.tsx           # User settings
├── lib/
│   ├── api-client.ts              # Axios API client with auth
│   └── store.ts                   # Zustand state management
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind configuration
├── next.config.ts                 # Next.js configuration
├── postcss.config.js              # PostCSS configuration
├── .env.example                   # Environment template
└── .gitignore                     # Git ignore rules
```

### New Files Created (18 total)
- `package.json` - Next.js dependencies
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `app/layout.tsx` - Root layout with Clerk
- `app/page.tsx` - Root redirect
- `app/globals.css` - Global styles
- `app/dashboard/layout.tsx` - Dashboard layout with sidebar
- `app/dashboard/page.tsx` - Dashboard home
- `app/dashboard/tunnels/page.tsx` - Tunnels list
- `app/dashboard/tunnels/new/page.tsx` - Create tunnel
- `app/dashboard/tunnels/[id]/page.tsx` - Tunnel detail
- `app/dashboard/exit-agents/page.tsx` - Exit agents list
- `app/dashboard/settings/page.tsx` - User settings
- `lib/api-client.ts` - API client
- `lib/store.ts` - State management
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules

---

## Technology Stack

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing

### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management (prepared for future use)

### Authentication
- **Clerk** - Managed authentication service
- **@clerk/nextjs** - Clerk integration for Next.js

### HTTP Client
- **Axios** - HTTP client with interceptors

### UI Components
- **Lucide React** - Icon library
- **clsx** - Conditional className utility

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd dashboard
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your values
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
# CLERK_SECRET_KEY=your_secret
```

### Step 3: Run Development Server

```bash
npm run dev
```

Dashboard will be available at `http://localhost:3000`

### Step 4: Build for Production

```bash
npm run build
npm start
```

---

## Pages & Features

### Dashboard Home (`/dashboard`)
- Welcome message with user's first name
- Statistics cards (total tunnels, active tunnels, exit agents, online agents)
- Recent tunnels table with quick actions
- Create tunnel button

**Features**:
- Real-time stats from API
- Quick tunnel access
- Error handling and loading states

### Tunnels Management (`/tunnels`)

#### List Page (`/tunnels`)
- Grid view of all user's tunnels
- Status badges (Active/Inactive)
- Quick actions (View, Delete)
- Create new tunnel button
- Empty state with helpful message

**Features**:
- Responsive grid layout
- Delete confirmation dialog
- Loading and error states

#### Create Page (`/tunnels/new`)
- Tunnel name input
- Region selection (us-central1, europe-west1, asia-southeast1)
- Form validation
- Success redirect to tunnels list

**Features**:
- Form validation
- Region selection with descriptions
- Helpful tips

#### Detail Page (`/tunnels/[id]`)
- Tunnel information display
- Generate client configuration form
- Configuration preview with syntax highlighting
- Copy to clipboard button
- Download configuration file
- Next steps guide

**Features**:
- Client config generation
- Copy/download functionality
- Configuration preview
- Step-by-step instructions

### Exit Agents (`/exit-agents`)
- List of registered exit agents
- Status indicators (online/offline/error)
- Public IP display
- Tunnel IP assignment
- Delete functionality
- Register new agent button
- Informational box explaining exit agents

**Features**:
- Real-time status display
- Quick delete with confirmation
- Helpful documentation

### Settings (`/settings`)
- Account information display
- Email and full name
- Subscription tier with benefits
- Member since date
- Subscription management
- API key generation (prepared)
- Danger zone with account deletion

**Features**:
- Read-only account info
- Subscription upgrade button
- API key management (future)
- Account deletion (future)

---

## API Integration

### API Client (`lib/api-client.ts`)

```typescript
// Automatic token injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("clerk_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic redirect on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("clerk_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
```

### State Management (`lib/store.ts`)

```typescript
// Zustand store for app state
interface AppStore {
  user: User | null;
  tunnels: Tunnel[];
  selectedTunnel: Tunnel | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setTunnels: (tunnels: Tunnel[]) => void;
  // ... more actions
}
```

---

## Clerk Authentication Setup

### 1. Create Clerk Application

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Choose "Next.js" as the framework
4. Copy your keys:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### 2. Configure Clerk in Next.js

The dashboard already includes Clerk setup:
- `ClerkProvider` wraps the root layout
- `useUser()` hook provides user info
- `UserButton` component in sidebar
- Automatic redirects on auth errors

### 3. Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## Styling with Tailwind CSS

### Global Styles (`app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities */
.container {
  @apply mx-auto max-w-7xl px-4;
}
```

### Color Scheme

- **Primary**: `#3b82f6` (Blue)
- **Secondary**: `#1e293b` (Dark Slate)
- **Accent**: `#06b6d4` (Cyan)
- **Background**: `#f1f5f9` (Light Slate)

### Responsive Design

All pages are fully responsive:
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3+ columns

---

## Running the Dashboard

### Development Mode

```bash
cd dashboard
npm run dev
```

Access at: `http://localhost:3000`

### With Backend API

Make sure the Phase 2 Sprint 1 backend is running:

```bash
# In another terminal
python relay-api-v2.py
```

### Environment Setup

```bash
# dashboard/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## Testing the Dashboard

### 1. Authentication Flow
- [ ] Sign up with email
- [ ] Verify email
- [ ] Login
- [ ] User info displays correctly
- [ ] Logout works

### 2. Dashboard Home
- [ ] Stats load correctly
- [ ] Recent tunnels display
- [ ] Create tunnel button works

### 3. Tunnels Management
- [ ] Create tunnel with valid data
- [ ] Tunnel appears in list
- [ ] View tunnel details
- [ ] Generate client config
- [ ] Download config file
- [ ] Delete tunnel with confirmation

### 4. Exit Agents
- [ ] List displays (empty initially)
- [ ] Register agent button visible
- [ ] Helpful documentation shown

### 5. Settings
- [ ] User info displays
- [ ] Subscription tier shows
- [ ] Member since date correct
- [ ] Upgrade button visible

---

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Connect to Vercel
# https://vercel.com/new

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted

```bash
npm run build
npm start
```

---

## Troubleshooting

### API Connection Error
```
Error: Failed to fetch from http://localhost:8000
```
**Solution**: Ensure backend is running and `NEXT_PUBLIC_API_URL` is correct

### Clerk Authentication Error
```
Error: Invalid Clerk publishable key
```
**Solution**: Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`

### Tailwind Styles Not Loading
```
Styles not applied
```
**Solution**: Run `npm run build` and restart dev server

### TypeScript Errors
```
Type errors in components
```
**Solution**: Run `npm run type-check` to see all errors

---

## Next Steps

### Immediate (This Week)
- [ ] Install dependencies
- [ ] Configure Clerk
- [ ] Set environment variables
- [ ] Run development server
- [ ] Test all pages
- [ ] Verify API integration

### Sprint 3 (Week 3)
- [ ] Complete backend integration
- [ ] Add connection logging
- [ ] Implement audit trail
- [ ] Add usage analytics

### Sprint 4 (Week 4)
- [ ] Deploy multi-region relay VMs
- [ ] Set up load balancer
- [ ] Configure DNS

### Sprint 5 (Week 5)
- [ ] Implement key rotation
- [ ] Add rate limiting
- [ ] Security hardening

### Sprint 6 (Week 6)
- [ ] Integrate Stripe billing
- [ ] Add subscription management
- [ ] Invoice system

---

## Success Criteria

- [x] Next.js project created with TypeScript
- [x] Tailwind CSS configured
- [x] Clerk authentication integrated
- [x] Dashboard layout with sidebar
- [x] All pages implemented
- [x] API client with interceptors
- [x] State management with Zustand
- [ ] All pages tested and working
- [ ] API integration verified
- [ ] Responsive design verified
- [ ] Ready for deployment

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Clerk Docs**: https://clerk.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zustand**: https://github.com/pmndrs/zustand
- **Lucide Icons**: https://lucide.dev

---

**Ready to deploy Phase 2 Sprint 2?** Follow the setup instructions above and test all pages.
