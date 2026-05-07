# Deploy Both Fixes to VPS - Complete Guide

## Overview
Two fixes need to be deployed to VPS:
1. **Backend Fix** - KYC route order (prevents server crashes)
2. **Frontend Fix** - Employee code display (shows codes on dashboards)

## CRITICAL: Deploy Backend First
The backend fix is **CRITICAL** - it prevents server crashes. Deploy it first.

---

## Part 1: Deploy Backend (CRITICAL - Do This First)

### Issue
Server crashes with: `Cast to ObjectId failed for value "kyc"`

### Fix
Correct route order in `user.routes.js` (already in GitHub, needs deployment)

### Deployment Steps

```bash
# SSH into VPS
ssh root@srv1642115

# Navigate to backend
cd /var/www/Warn/wans-backend

# Check current status
git status
git log --oneline -5

# Pull latest changes
git pull origin main

# You should see:
# - wans-backend/src/routes/user.routes.js updated
# - deploy-backend-kyc-fix.sh added
# - BACKEND-KYC-FIX.md added

# Install dependencies (if needed)
npm install

# Restart PM2 with updated environment
pm2 restart project-backend --update-env

# Wait 3 seconds for restart
sleep 3

# Check status
pm2 status

# Monitor logs for errors
pm2 logs project-backend --lines 30
```

### Verification

**Before Fix (ERROR):**
```
[ERROR] GET /api/users/kyc → Cast to ObjectId failed for value "kyc"
```

**After Fix (SUCCESS):**
```
GET /api/users/kyc 200 15.234 ms - 450
```

### Test
1. Login to app as advisor/employee
2. Navigate to KYC page
3. Check PM2 logs - should see NO "Cast to ObjectId" errors
4. KYC data should load successfully

---

## Part 2: Deploy Frontend (Employee Code Display)

### Issue
Employee codes not displaying on dashboard pages

### Fix
Changed from `advisorCode` to `employeeCode` across 8 dashboard pages

### Deployment Steps

```bash
# SSH into VPS (if not already connected)
ssh root@srv1642115

# Navigate to frontend
cd /var/www/Warn/wans-frontend

# Check current status
git status
git log --oneline -5

# Pull latest changes
git pull origin main

# You should see:
# - 8 dashboard files updated
# - deploy-employeeCode-fix.sh added
# - EMPLOYEECODE-FIX.md added
# - VPS-DEPLOYMENT-GUIDE.md added

# Install dependencies (if needed)
npm install

# Build frontend
npm run build

# Verify build completed
ls -lh dist/
```

### Verification

Test each role to verify employee code displays:

| Role | Expected Format |
|------|----------------|
| Advisor | `Advisor · {location} · Code: {code}` |
| Area Manager | `Area Manager · {area} · Code: {code}` |
| DO Manager | `DO Manager · {district} · Code: {code}` |
| Zonal Manager | `Zonal Manager · {zone} · Code: {code}` |
| State Head | `State Head · {state} · Code: {code}` |
| Admin | `Super Admin · Full System Control · Code: {code}` |

---

## Complete Deployment Script (Both Fixes)

Save this as `deploy-all-fixes.sh` and run it:

```bash
#!/bin/bash

echo "🚀 Deploying All Fixes to VPS..."
echo ""

# Part 1: Backend
echo "=========================================="
echo "PART 1: BACKEND DEPLOYMENT (CRITICAL)"
echo "=========================================="
echo ""

cd /var/www/Warn/wans-backend
echo "📂 Backend directory: $(pwd)"
echo ""

echo "📥 Pulling backend changes..."
git pull origin main
echo ""

echo "📦 Installing backend dependencies..."
npm install
echo ""

echo "🔄 Restarting backend PM2..."
pm2 restart project-backend --update-env
echo ""

echo "⏳ Waiting 5 seconds for backend to restart..."
sleep 5
echo ""

echo "✅ Backend deployment complete!"
echo ""
pm2 status project-backend
echo ""

# Part 2: Frontend
echo "=========================================="
echo "PART 2: FRONTEND DEPLOYMENT"
echo "=========================================="
echo ""

cd /var/www/Warn/wans-frontend
echo "📂 Frontend directory: $(pwd)"
echo ""

echo "📥 Pulling frontend changes..."
git pull origin main
echo ""

echo "📦 Installing frontend dependencies..."
npm install
echo ""

echo "🔨 Building frontend..."
npm run build
echo ""

echo "✅ Frontend deployment complete!"
echo ""

# Verification
echo "=========================================="
echo "VERIFICATION"
echo "=========================================="
echo ""

echo "📊 Backend Status:"
cd /var/www/Warn/wans-backend
pm2 status project-backend
echo ""

echo "📊 Recent Backend Logs:"
pm2 logs project-backend --lines 20 --nostream
echo ""

echo "📊 Frontend Build:"
cd /var/www/Warn/wans-frontend
ls -lh dist/ | head -10
echo ""

echo "=========================================="
echo "✅ ALL DEPLOYMENTS COMPLETE!"
echo "=========================================="
echo ""
echo "🔍 Next Steps:"
echo "  1. Test KYC functionality (should not crash)"
echo "  2. Login as advisor - verify employee code displays"
echo "  3. Monitor logs: pm2 logs project-backend --lines 50"
echo ""
```

---

## Quick Deploy (Copy-Paste)

```bash
# SSH into VPS
ssh root@srv1642115

# Deploy Backend (CRITICAL)
cd /var/www/Warn/wans-backend && git pull origin main && npm install && pm2 restart project-backend --update-env && sleep 3 && pm2 logs project-backend --lines 20 --nostream

# Deploy Frontend
cd /var/www/Warn/wans-frontend && git pull origin main && npm install && npm run build && ls -lh dist/
```

---

## Troubleshooting

### Backend Issues

**Issue: Git pull fails**
```bash
cd /var/www/Warn/wans-backend
git stash
git pull origin main
```

**Issue: PM2 not restarting**
```bash
pm2 delete project-backend
pm2 start ecosystem.config.js
```

**Issue: Still seeing KYC errors**
```bash
# Verify route file was updated
cat /var/www/Warn/wans-backend/src/routes/user.routes.js | grep -A 10 "KYC routes"

# Should show KYC routes BEFORE /:id routes
```

### Frontend Issues

**Issue: Build fails**
```bash
cd /var/www/Warn/wans-frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue: Changes not reflecting**
```bash
# Clear browser cache (Ctrl+Shift+R)
# Or use incognito window
```

---

## Post-Deployment Checklist

### Backend
- [ ] PM2 status shows "online"
- [ ] No "Cast to ObjectId" errors in logs
- [ ] KYC page loads without errors
- [ ] Users can submit KYC data

### Frontend
- [ ] Build completed successfully
- [ ] dist/ directory has new files
- [ ] Advisor dashboard shows employee code
- [ ] Area Manager dashboard shows employee code
- [ ] DO Manager dashboard shows employee code
- [ ] Zonal Manager dashboard shows employee code
- [ ] State Head dashboard shows employee code
- [ ] Settings page shows employee code

---

## Rollback (if needed)

### Backend Rollback
```bash
cd /var/www/Warn/wans-backend
git log --oneline -10
git reset --hard <previous-commit-hash>
pm2 restart project-backend --update-env
```

### Frontend Rollback
```bash
cd /var/www/Warn/wans-frontend
git log --oneline -10
git reset --hard <previous-commit-hash>
npm run build
```

---

## Support

If issues persist:

1. **Check backend logs:**
   ```bash
   pm2 logs project-backend --lines 100
   ```

2. **Check nginx logs:**
   ```bash
   tail -50 /var/log/nginx/error.log
   ```

3. **Verify git commits:**
   ```bash
   cd /var/www/Warn/wans-backend
   git log --oneline -5
   
   cd /var/www/Warn/wans-frontend
   git log --oneline -5
   ```

4. **Check environment:**
   ```bash
   cd /var/www/Warn/wans-backend
   cat .env | grep FRONTEND_URL
   # Should be: FRONTEND_URL=https://warnamayii.cloud
   ```

---

## Summary

- **Backend Fix:** KYC route order (prevents crashes) - **DEPLOY FIRST**
- **Frontend Fix:** Employee code display (shows codes) - Deploy second
- **Total Time:** ~5-10 minutes for both deployments
- **Risk Level:** Low (both fixes are tested and documented)
- **Rollback:** Easy (git reset to previous commit)
