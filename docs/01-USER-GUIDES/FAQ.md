# FAQ - Frequently Asked Questions

Common questions from new users.

---

## Getting Started

### Q: Do I need to be a developer to use IP-Relay?

**A:** No! You just need to follow the setup steps. If you get stuck, ask your administrator for help.

---

### Q: How long does setup take?

**A:** About 5-10 minutes if everything goes smoothly. First time might take 15-20 minutes.

---

### Q: Can I use IP-Relay on Windows/Mac/Linux?

**A:** Yes! IP-Relay works on all three operating systems.

---

### Q: Do I need a credit card to use IP-Relay?

**A:** For local testing, no. For cloud deployment, you'll need a GCP account (which requires a credit card).

---

## Installation

### Q: What if I don't have Python installed?

**A:** Download it from [python.org](https://www.python.org). Make sure to check "Add Python to PATH" during installation.

---

### Q: What if I don't have Node.js installed?

**A:** Download it from [nodejs.org](https://nodejs.org). Choose the LTS version.

---

### Q: What if installation fails?

**A:** Check the `TROUBLESHOOTING-GUIDE.md` for your specific error message.

---

## Configuration

### Q: Where do I get the Clerk keys?

**A:** Ask your project administrator. They should provide you with a `.env.local` file or the keys to put in it.

---

### Q: What if I don't have a database URL?

**A:** Ask your administrator. They'll provide the correct URL for your setup.

---

### Q: Can I use different ports?

**A:** Yes! You can change ports, but you need to update the configuration files accordingly.

---

## Running the Application

### Q: How do I start the backend?

**A:** Run `python relay-api.py` in the backend folder, or double-click `start-backend.bat` on Windows.

---

### Q: How do I start the frontend?

**A:** Run `npm run dev` in the frontend folder, or double-click `start-frontend.bat` on Windows.

---

### Q: Do I need to start both backend and frontend?

**A:** Yes! Both need to be running for the application to work.

---

### Q: Can I run them in the same terminal?

**A:** No, you need separate terminals for each. Use two terminal windows.

---

## Using the Dashboard

### Q: How do I sign in?

**A:** Click "Sign In" and choose "Sign in with Google". Use your Google account.

---

### Q: What if I can't sign in?

**A:** Check your `.env.local` files have the correct Clerk keys. See `TROUBLESHOOTING-GUIDE.md`.

---

### Q: How do I create a tunnel?

**A:** Click "Create Tunnel", enter a name, select a region, and click "Create".

---

### Q: What's a tunnel?

**A:** A tunnel is a secure connection that routes your traffic through a static IP address.

---

### Q: Can I have multiple tunnels?

**A:** Yes! You can create as many tunnels as you need.

---

### Q: How do I delete a tunnel?

**A:** Find the tunnel in the list, click the delete button (trash icon), and confirm.

---

## Troubleshooting

### Q: What does "port already in use" mean?

**A:** Something else is using that port. See `TROUBLESHOOTING-GUIDE.md` for how to fix it.

---

### Q: What does "authentication failed" mean?

**A:** Your Clerk keys are wrong or missing. Check your `.env.local` files.

---

### Q: What does "cannot connect to backend" mean?

**A:** The frontend can't reach the backend. Make sure backend is running on port 8000.

---

### Q: What if I see errors in the browser console?

**A:** Open DevTools (F12), click Console tab, and read the error message. Search for it in `TROUBLESHOOTING-GUIDE.md`.

---

### Q: What if I see errors in the terminal?

**A:** Read the error message carefully. It usually tells you what's wrong. Check `TROUBLESHOOTING-GUIDE.md`.

---

## Advanced

### Q: Can I deploy to the cloud?

**A:** Yes! See `docs/07-deployment/DEPLOYMENT-SUMMARY.md` for cloud deployment instructions.

---

### Q: Can I use a different database?

**A:** Yes, but you'll need to modify the backend code. Ask your administrator.

---

### Q: Can I customize the dashboard?

**A:** Yes, the frontend is built with Next.js and React. You can modify the code.

---

### Q: Is IP-Relay secure?

**A:** Yes! It uses WireGuard encryption and Clerk authentication. See `docs/ARCHITECTURE.md` for details.

---

## Getting Help

### Q: What if my question isn't answered here?

**A:** Check these resources in order:
1. `USER-GUIDE.md` - Full setup guide
2. `TROUBLESHOOTING-GUIDE.md` - Common problems
3. `docs/ARCHITECTURE.md` - Technical details
4. Ask your administrator

---

### Q: How do I report a bug?

**A:** Tell your administrator with:
- What you were doing
- What error you saw
- Terminal output
- Browser console errors (F12)

---

### Q: Can I contribute to IP-Relay?

**A:** Yes! Ask your administrator about contributing.

---

**Last Updated:** 2026-04-22
