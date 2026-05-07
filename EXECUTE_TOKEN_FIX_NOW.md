# 🔧 Fix Token Expiration - Execute Now

## Problem
You get logged out after 2+ minutes when refreshing the page.

## Root Cause
Access token expires after **15 minutes** - this is too short!

## Solution
Change token expiration from **15 minutes** to **24 hours**.

---

## 🚀 Quick Fix (2 Minutes)

### Option 1: Automated Script (Recommended)

```bash
# 1. SSH to your server
ssh root@srv1642115.your-server.de

# 2. Go to project directory
cd /var/www/Warn

# 3. Pull latest code (includes fix script)
git pull origin main

# 4. Run the automated fix
bash FIX_TOKEN_EXPIRATION.sh
```

**Done!** The script will:
- ✅ Backup your current .env
- ✅ Change JWT_EXPIRES_IN from 15m to 24h
- ✅ Restart the backend
- ✅ Show you the status

---

### Option 2: Manual Fix (If script doesn't work)

```bash
# 1. SSH to server
ssh root@srv1642115.your-server.de

# 2. Edit backend .env file
cd /var/www/Warn/wans-backend
nano .env

# 3. Find this line:
JWT_EXPIRES_IN=15m

# 4. Change it to:
JWT_EXPIRES_IN=24h

# 5. Save and exit (Ctrl+X, then Y, then Enter)

# 6. Restart backend
pm2 restart project-backend --update-env

# 7. Check status
pm2 status project-backend
```

---

## ✅ Test the Fix

1. **Login** to your admin dashboard: https://warnamayii.cloud/login
2. **Wait 5-10 minutes** (do some work)
3. **Refresh the page** (press F5)
4. **Result**: You should stay logged in! ✅

---

## What Changed?

| Before | After |
|--------|-------|
| Token expires after **15 minutes** | Token expires after **24 hours** |
| Get logged out frequently ❌ | Stay logged in all day ✅ |
| Have to login multiple times | Login once per day |

---

## Important Notes

1. **Existing users need to login again** after this change (old tokens still have 15m expiration)
2. **New tokens will last 24 hours** - much better experience!
3. **Refresh token still expires after 7 days** (unchanged)
4. **Security is still good** - 24 hours is acceptable for admin dashboards

---

## Troubleshooting

### If you still get logged out:

**Check 1**: Verify the change was applied
```bash
cd /var/www/Warn/wans-backend
grep JWT_EXPIRES_IN .env
# Should show: JWT_EXPIRES_IN=24h
```

**Check 2**: Verify backend restarted
```bash
pm2 logs project-backend --lines 10
# Should see recent restart
```

**Check 3**: Clear browser cache and login again
- Press Ctrl+Shift+Delete
- Clear cookies and cache
- Login again with fresh token

---

## Summary

**Command to run**:
```bash
ssh root@srv1642115.your-server.de
cd /var/www/Warn
git pull origin main
bash FIX_TOKEN_EXPIRATION.sh
```

**Time**: 2 minutes

**Result**: No more logout after 2 minutes! 🎉

---

## Need Help?

If the automated script fails, use the manual fix above or check:
- `TOKEN_EXPIRATION_FIX.md` - Comprehensive documentation
- `FIX_TOKEN_EXPIRATION.sh` - The automated script
- PM2 logs: `pm2 logs project-backend`
