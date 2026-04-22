# Quick Start Card

Print this card and keep it handy while setting up IP-Relay.

---

## 🚀 5-Minute Setup

```
1. git clone https://github.com/your-org/telenor-router.git
2. cd telenor-router
3. cd backend && pip install -r requirements.txt
4. cd ../frontend && npm install
5. Start backend: python relay-api.py
6. Start frontend: npm run dev
7. Open http://localhost:3000
8. Sign in with Google
```

---

## 📋 What You Need

- [ ] Git
- [ ] Python 3.9+
- [ ] Node.js 18+
- [ ] WireGuard
- [ ] Google Account
- [ ] 2GB disk space
- [ ] Ports: 3000, 8000, 51820

---

## 🔑 Environment Variables

**`backend/.env.local`**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=xxx
CLERK_SECRET_KEY=xxx
DATABASE_URL=xxx
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=xxx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## ✅ Verify It Works

| Check | Command | Expected |
|-------|---------|----------|
| Backend | `http://localhost:8000/health` | `{"status":"ok"}` |
| Frontend | `http://localhost:3000` | Dashboard loads |
| Sign In | Click "Sign In" | Google login works |
| Console | Press F12 | No red errors |

---

## 🆘 Quick Fixes

| Problem | Fix |
|---------|-----|
| Port in use | Kill process or use different port |
| Auth failed | Check `.env.local` files |
| Module not found | Run `pip install -r requirements.txt` or `npm install` |
| Can't connect | Verify backend/frontend running |
| Blank dashboard | Check browser console (F12) |

---

## 📞 Help Resources

- **Setup Issues** → `SETUP-CHECKLIST.md`
- **Errors** → `TROUBLESHOOTING-GUIDE.md`
- **Full Guide** → `USER-GUIDE.md`
- **Technical Details** → `docs/ARCHITECTURE.md`

---

## 🔗 Important URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Health Check: `http://localhost:8000/health`
- Clerk: `https://clerk.com`

---

**Print this page and keep it nearby!**
