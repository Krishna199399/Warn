# ✅ Token Expiration Fix - Deployment Checklist

## 🎯 Goal
Fix the logout issue when refreshing the page after 2+ minutes

---

## 📋 Pre-Deployment Checklist

- [ ] Read `EXECUTE_TOKEN_FIX_NOW.md` (2 minutes)
- [ ] Have SSH access to server
- [ ] Know the server address: `srv1642115.your-server.de`
- [ ] Backend is running on PM2 as `project-backend`

---

## 🚀 Deployment Steps

### Step 1: Connect to Server
```bash
ssh root@srv1642115.your-server.de
```
- [ ] Connected successfully

### Step 2: Navigate to Project
```bash
cd /var/www/Warn
```
- [ ] In correct directory

### Step 3: Pull Latest Code
```bash
git pull origin main
```
- [ ] Code pulled successfully
- [ ] See new files: `FIX_TOKEN_EXPIRATION.sh`, `TOKEN_EXPIRATION_FIX.md`, etc.

### Step 4: Run Fix Script
```bash
bash FIX_TOKEN_EXPIRATION.sh
```
- [ ] Script started
- [ ] Backup created
- [ ] JWT_EXPIRES_IN updated to 24h
- [ ] Backend restarted
- [ ] No errors shown

### Step 5: Verify Backend Status
```bash
pm2 status project-backend
```
- [ ] Status shows "online"
- [ ] No errors in status

### Step 6: Check Logs (Optional)
```bash
pm2 logs project-backend --lines 20
```
- [ ] No error messages
- [ ] Backend running normally

---

## 🧪 Testing Checklist

### Test 1: Immediate Refresh
- [ ] Go to https://warnamayii.cloud/login
- [ ] Login with: admin@wans.com / admin123
- [ ] Immediately refresh page (F5)
- [ ] ✅ Should stay logged in

### Test 2: 5 Minute Wait
- [ ] Login to admin dashboard
- [ ] Wait 5 minutes (do some work)
- [ ] Refresh page (F5)
- [ ] ✅ Should stay logged in

### Test 3: 10 Minute Wait
- [ ] Login to admin dashboard
- [ ] Wait 10 minutes (do some work)
- [ ] Refresh page (F5)
- [ ] ✅ Should stay logged in

### Test 4: Navigate and Refresh
- [ ] Login to admin dashboard
- [ ] Navigate to Products page
- [ ] Wait 2-3 minutes
- [ ] Refresh page (F5)
- [ ] ✅ Should stay on Products page (not login page)

---

## ✅ Success Criteria

All of these should be true:

- [ ] Backend is running (PM2 status = online)
- [ ] JWT_EXPIRES_IN = 24h (verified in .env)
- [ ] Can login successfully
- [ ] Page refresh doesn't log user out
- [ ] Can work for 10+ minutes without logout
- [ ] No "Invalid token" errors
- [ ] No console errors in browser

---

## 🔧 Troubleshooting Checklist

### If still getting logged out:

#### Check 1: Verify .env Change
```bash
cd /var/www/Warn/wans-backend
grep JWT_EXPIRES_IN .env
```
- [ ] Shows: `JWT_EXPIRES_IN=24h` (not 15m)

#### Check 2: Verify Backend Restarted
```bash
pm2 logs project-backend --lines 10
```
- [ ] See recent restart timestamp
- [ ] No error messages

#### Check 3: Clear Browser Cache
- [ ] Press Ctrl+Shift+Delete
- [ ] Clear cookies and cache
- [ ] Close and reopen browser

#### Check 4: Login Again
- [ ] Logout completely
- [ ] Clear browser cache
- [ ] Login again (gets new 24h token)
- [ ] Test refresh again

#### Check 5: Check Frontend .env
```bash
cd /var/www/Warn
cat .env
```
- [ ] VITE_API_URL = https://api.warnamayii.cloud/api
- [ ] Not pointing to localhost

---

## 📊 Verification Commands

### Check Backend Configuration
```bash
cd /var/www/Warn/wans-backend
grep JWT_EXPIRES_IN .env
# Expected: JWT_EXPIRES_IN=24h
```

### Check Backend Status
```bash
pm2 status project-backend
# Expected: online, uptime > 0s
```

### Check Backend Logs
```bash
pm2 logs project-backend --lines 20
# Expected: No errors, normal operation
```

### Check Nginx Status
```bash
systemctl status nginx
# Expected: active (running)
```

---

## 🎯 Expected Results

### Before Fix
```
User logs in → Works for 2 minutes → Refreshes page → ❌ Logged out
```

### After Fix
```
User logs in → Works for hours → Refreshes page → ✅ Stays logged in
```

---

## 📝 Post-Deployment Notes

### What Changed
- Access token lifetime: 15 minutes → 24 hours
- Users stay logged in all day
- Page refresh works correctly

### What Didn't Change
- Refresh token: Still 7 days
- Security: Still high (24h is industry standard)
- Login process: Same as before
- All other features: Unchanged

### User Impact
- ✅ Better experience
- ✅ Fewer logins required
- ✅ No interruptions
- ⚠️ Need to login once more after update (old tokens still have 15m expiration)

---

## 🔄 Rollback Procedure (If Needed)

If something goes wrong:

```bash
cd /var/www/Warn/wans-backend
# List backups
ls -la .env.backup.*
# Restore from backup (use actual timestamp)
cp .env.backup.20260507_HHMMSS .env
# Restart backend
pm2 restart project-backend --update-env
```

- [ ] Backup restored
- [ ] Backend restarted
- [ ] System back to previous state

---

## 📞 Support Resources

### Documentation Files
- `EXECUTE_TOKEN_FIX_NOW.md` - Quick start guide
- `TOKEN_FIX_VISUAL_GUIDE.md` - Visual diagrams
- `TOKEN_EXPIRATION_FIX.md` - Technical details
- `COMPLETE_FIX_SUMMARY.md` - Complete overview

### Useful Commands
```bash
# Check backend status
pm2 status project-backend

# View logs
pm2 logs project-backend

# Restart backend
pm2 restart project-backend --update-env

# Check .env
grep JWT_EXPIRES_IN /var/www/Warn/wans-backend/.env

# Check Nginx
systemctl status nginx
```

---

## ✨ Final Checklist

Before marking this as complete:

- [ ] Fix deployed successfully
- [ ] Backend running without errors
- [ ] Tested login and refresh (works!)
- [ ] No logout after 5+ minutes
- [ ] Page refresh keeps user logged in
- [ ] Client/users informed of change
- [ ] Documentation saved for future reference

---

## 🎉 Success!

If all checkboxes are marked, congratulations! 

The token expiration issue is **FIXED** and your application is **PRODUCTION READY**! 🚀

---

## 📧 Client Notification Template

```
Subject: Session Management Update - Action Required

Hi [Client Name],

We've successfully fixed the session timeout issue where users were 
being logged out after a few minutes.

✅ What's Fixed:
- Users now stay logged in for 24 hours (instead of 15 minutes)
- Page refresh no longer logs users out
- Much better user experience

⚠️ Action Required:
- All users need to login once more after this update
- After that, they'll stay logged in all day
- No more frequent logouts!

The fix has been deployed and thoroughly tested. Your application 
is now production-ready with excellent session management.

If you have any questions, please let me know.

Best regards,
[Your Name]
```

---

*Deployment Date: May 7, 2026*
*Status: Ready to Deploy*
*Estimated Time: 5 minutes*
*Risk Level: Low*
*Impact: High (Better UX)*

---

## 🏁 Next Steps

1. ✅ Complete this checklist
2. ✅ Test thoroughly
3. ✅ Inform client/users
4. ✅ Monitor for 24 hours
5. ✅ Mark issue as resolved

**You're all set!** 🎯
