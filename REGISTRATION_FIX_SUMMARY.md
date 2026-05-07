# Registration 500 Error - Root Cause Analysis & Fix

## Error Symptoms
- Registration endpoint returning **500 Internal Server Error**
- Browser console: `Cannot read properties of undefined (reading 'map')`
- All registration attempts failing (WHOLESALE, MINI_STOCK, CUSTOMER, ADVISOR)

## Root Causes Identified

### 1. Missing `roleHistory` Field in User Schema ⚠️ CRITICAL
**Location:** `wans-backend/src/models/User.js`

**Problem:** 
- Auth controller was trying to save `roleHistory: [{ role, from: new Date(), to: null }]`
- But User schema didn't have this field defined
- This caused Mongoose validation errors

**Fix:**
```javascript
// Added to User schema
roleHistory: [roleHistorySchema],
```

### 2. Express Trust Proxy Not Configured ⚠️ HIGH
**Location:** `wans-backend/src/app.js`

**Problem:**
- Rate limiter was seeing `X-Forwarded-For` header from Nginx
- Express wasn't configured to trust proxy headers
- Caused: `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false`

**Fix:**
```javascript
// Added after app initialization
app.set('trust proxy', 1);
```

### 3. Notification Service Not Handling Empty Results ⚠️ MEDIUM
**Location:** `wans-backend/src/services/notification.service.js`

**Problem:**
- `notifyByRole()` was calling `.map()` on potentially empty user arrays
- When no ADMIN users exist, `users.map()` would fail
- This was the direct cause of "Cannot read properties of undefined (reading 'map')"

**Fix:**
```javascript
// Added safety checks in notifyByRole()
if (!users || users.length === 0) {
  console.warn(`No users found with role(s): ${roleArray.join(', ')}`);
  return [];
}

// Added safety checks in createBulkNotifications()
if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
  return [];
}
```

## Files Modified

1. ✅ `wans-backend/src/models/User.js` - Added `roleHistory` field
2. ✅ `wans-backend/src/app.js` - Added `trust proxy` setting
3. ✅ `wans-backend/src/services/notification.service.js` - Added null/empty checks

## Deployment Instructions

### Option 1: Using Deploy Script (Recommended)
```bash
bash deploy-registration-fix.sh
```

### Option 2: Manual Deployment
```bash
# Copy fixed files
scp wans-backend/src/app.js root@warnamayii.cloud:/var/www/Warn/wans-backend/src/
scp wans-backend/src/models/User.js root@warnamayii.cloud:/var/www/Warn/wans-backend/src/models/
scp wans-backend/src/services/notification.service.js root@warnamayii.cloud:/var/www/Warn/wans-backend/src/services/

# Restart PM2
ssh root@warnamayii.cloud "pm2 restart project-backend"
```

## Testing Checklist

After deployment, test all registration types:

- [ ] CUSTOMER registration (auto-approved)
- [ ] WHOLESALE registration (requires approval)
- [ ] MINI_STOCK registration (requires approval)
- [ ] ADVISOR registration (requires approval)

**Test URLs:**
- Production: https://warnamayii.cloud/register
- Localhost: http://localhost:5173/register

## Expected Behavior After Fix

### For CUSTOMER Role:
- ✅ Registration succeeds immediately
- ✅ User receives access token
- ✅ User can login right away
- ✅ Status: APPROVED

### For WHOLESALE/MINI_STOCK/ADVISOR Roles:
- ✅ Registration succeeds
- ✅ User receives confirmation message
- ✅ Status: PENDING (awaiting admin approval)
- ✅ No access token until approved
- ✅ Admin receives notification (if admin users exist)

## Additional Notes

### Why No Admin Notifications?
If you see the warning `No users found with role(s): ADMIN`, it means:
- No admin users exist in the database yet
- This is normal for fresh installations
- Registration will still work, just no notifications sent
- Create an admin user first to receive notifications

### Creating First Admin User
```javascript
// In MongoDB or via API
{
  name: "Admin User",
  email: "admin@wans.com",
  phone: "9999999999",
  password: "admin123", // Will be hashed
  role: "ADMIN",
  status: "APPROVED"
}
```

## Security Considerations

⚠️ **After fixing registration, complete these security tasks:**

1. **Change default admin password** from `admin123`
2. **Rotate MongoDB password** (currently exposed in git history)
3. **Switch to Live Razorpay keys** (currently using TEST mode)
4. **Remove .env from git history** using BFG Repo-Cleaner

See `SECURITY_COMPLIANCE_CERTIFICATE.md` for full security checklist.

---

**Status:** ✅ FIXED - Ready for deployment
**Priority:** CRITICAL
**Impact:** Blocks all new user registrations
**Estimated Fix Time:** 2 minutes (file copy + PM2 restart)
