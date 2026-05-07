# VPS Deployment Guide - Employee Code Fix

## Quick Deploy (Recommended)

```bash
# SSH into VPS
ssh root@srv1642115

# Navigate to frontend directory
cd /var/www/Warn/wans-frontend

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build frontend
npm run build

# Verify build completed
ls -lh dist/
```

## Detailed Steps

### 1. Connect to VPS
```bash
ssh root@srv1642115
```

### 2. Navigate to Frontend Directory
```bash
cd /var/www/Warn/wans-frontend
```

### 3. Check Current Status
```bash
# Check current branch
git branch

# Check for uncommitted changes
git status

# View recent commits
git log --oneline -5
```

### 4. Pull Latest Changes
```bash
git pull origin main
```

Expected output:
```
remote: Enumerating objects: 24, done.
remote: Counting objects: 100% (24/24), done.
remote: Compressing objects: 100% (16/16), done.
remote: Total 16 (delta 12), reused 0 (delta 0), pack-reused 0
Unpacking objects: 100% (16/16), done.
From https://github.com/Krishna199399/Warn
   e130a7d..8378fa3  main       -> origin/main
Updating e130a7d..8378fa3
Fast-forward
 EMPLOYEECODE-FIX.md                      | 142 +++++++++++++++++++++++++++++++
 deploy-employeeCode-fix.sh               |  28 ++++++
 src/pages/AdminDashboard.jsx             |   4 +-
 src/pages/AreaManagerDashboard.jsx       |   3 +-
 src/pages/DOManagerDashboard.jsx         |   3 +-
 src/pages/ShadcnDashboardPage.jsx        |   3 +-
 src/pages/SettingsPage.jsx               |   2 +-
 src/pages/StateHeadDashboard.jsx         |   3 +-
 src/pages/WholesaleDashboard.jsx         |   3 +-
 src/pages/ZonalManagerDashboard.jsx      |   3 +-
 10 files changed, 179 insertions(+), 15 deletions(-)
```

### 5. Install Dependencies (if package.json changed)
```bash
npm install
```

### 6. Build Frontend
```bash
npm run build
```

Expected output:
```
> wans-frontend@0.0.0 build
> vite build

vite v5.x.x building for production...
✓ 1234 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.30 kB
dist/assets/index-abc123.css     12.34 kB │ gzip:  3.45 kB
dist/assets/index-def456.js     234.56 kB │ gzip: 78.90 kB
✓ built in 12.34s
```

### 7. Verify Build
```bash
# Check dist directory
ls -lh dist/

# Check if index.html exists
cat dist/index.html | head -20
```

### 8. Restart Nginx (if needed)
```bash
# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

# Check nginx status
systemctl status nginx
```

## Verification

### 1. Check Frontend is Serving
```bash
curl -I https://warnamayii.cloud
```

Expected: `HTTP/2 200`

### 2. Test in Browser

1. **Open:** https://warnamayii.cloud
2. **Login as Advisor** (or any employee role)
3. **Check Dashboard Header** - Should show:
   ```
   Advisor · bangalore · Code: ADV001
   ```

### 3. Test Different Roles

| Role | Expected Format |
|------|----------------|
| Advisor | `Advisor · {location} · Code: {code}` |
| Area Manager | `Area Manager · {area} · Code: {code}` |
| DO Manager | `DO Manager · {district} · Code: {code}` |
| Zonal Manager | `Zonal Manager · {zone} · Code: {code}` |
| State Head | `State Head · {state} · Code: {code}` |
| Admin | `Super Admin · Full System Control · Code: {code}` |

## Troubleshooting

### Issue: Git pull fails with "uncommitted changes"
```bash
# Stash local changes
git stash

# Pull latest
git pull origin main

# Reapply stashed changes (if needed)
git stash pop
```

### Issue: Build fails with "out of memory"
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Try build again
npm run build
```

### Issue: Changes not reflecting in browser
```bash
# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
# Or use incognito/private window

# Check if dist files were updated
ls -lt dist/ | head -10
```

### Issue: Nginx not serving new files
```bash
# Check nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

# Check nginx error logs
tail -50 /var/log/nginx/error.log
```

## Rollback (if needed)

```bash
# View commit history
git log --oneline -10

# Rollback to previous commit
git reset --hard e130a7d  # Replace with actual commit hash

# Rebuild
npm run build

# Reload nginx
systemctl reload nginx
```

## Files Changed in This Deployment

1. ✅ `src/pages/AdminDashboard.jsx` - Shows employeeCode for admin
2. ✅ `src/pages/StateHeadDashboard.jsx` - Shows employeeCode for state head
3. ✅ `src/pages/SettingsPage.jsx` - Uses employeeCode instead of advisorCode
4. ✅ `src/pages/WholesaleDashboard.jsx` - Shows employeeCode for wholesale
5. ✅ `src/pages/ShadcnDashboardPage.jsx` - Shows employeeCode for advisor
6. ✅ `src/pages/AreaManagerDashboard.jsx` - Shows employeeCode for area manager
7. ✅ `src/pages/DOManagerDashboard.jsx` - Shows employeeCode for DO manager
8. ✅ `src/pages/ZonalManagerDashboard.jsx` - Shows employeeCode for zonal manager

## Post-Deployment Checklist

- [ ] Frontend build completed successfully
- [ ] Nginx serving new files
- [ ] Login as advisor - employee code displays
- [ ] Login as area manager - employee code displays
- [ ] Login as DO manager - employee code displays
- [ ] Login as zonal manager - employee code displays
- [ ] Login as state head - employee code displays
- [ ] Settings page shows employee code
- [ ] No console errors in browser
- [ ] Backend still running (pm2 status)

## Support

If issues persist:
1. Check browser console for errors (F12)
2. Check nginx error logs: `tail -50 /var/log/nginx/error.log`
3. Check backend logs: `pm2 logs project-backend --lines 50`
4. Verify backend is running: `pm2 status`
