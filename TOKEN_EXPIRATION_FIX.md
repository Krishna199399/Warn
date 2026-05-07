# Token Expiration Fix

## Problem
After being logged in for 2+ minutes, when you refresh the page, you get logged out and redirected to the login page.

## Root Cause
The **access token expires after 15 minutes** (`JWT_EXPIRES_IN=15m`). When you refresh the page after the token has expired:

1. Frontend tries to restore session
2. Calls `/auth/refresh` with expired access token
3. Backend rejects the expired token
4. User gets logged out

## Current Token Settings

```env
JWT_EXPIRES_IN=15m              # Access token: 15 minutes
JWT_REFRESH_EXPIRES_IN=7d       # Refresh token: 7 days
```

### Why 15 Minutes is Too Short

- **User Experience**: Users get logged out frequently
- **Productivity**: Interrupts workflow every 15 minutes
- **Frustration**: Have to login multiple times per day

---

## Solution Options

### Option 1: Increase Access Token Expiration (Recommended)

**Change**: `JWT_EXPIRES_IN=15m` → `JWT_EXPIRES_IN=24h`

**Pros**:
- ✅ Simple fix
- ✅ Better user experience
- ✅ Users stay logged in for 24 hours
- ✅ Still secure (tokens expire daily)

**Cons**:
- ⚠️ Slightly less secure (longer token lifetime)
- ⚠️ Compromised token valid for 24 hours instead of 15 minutes

**Security**: Still acceptable for most applications. Many production apps use 1-24 hour access tokens.

### Option 2: Implement Silent Token Refresh

**Change**: Add automatic token refresh before expiration

**Pros**:
- ✅ Most secure (short-lived tokens)
- ✅ Seamless user experience
- ✅ Tokens auto-refresh in background

**Cons**:
- ⚠️ More complex implementation
- ⚠️ Requires frontend timer/interval
- ⚠️ More API calls

---

## Quick Fix (Option 1)

### Step 1: Update Backend .env

```bash
ssh root@srv1642115.your-server.de
cd /var/www/Warn/wans-backend
```

Edit `.env`:
```bash
nano .env
```

Change:
```env
JWT_EXPIRES_IN=15m
```

To:
```env
JWT_EXPIRES_IN=24h
```

Save and exit (Ctrl+X, Y, Enter)

### Step 2: Restart Backend

```bash
pm2 restart project-backend --update-env
```

### Step 3: Test

1. Login: https://warnamayii.cloud/login
2. Wait 5-10 minutes
3. Refresh page (F5)
4. ✅ Should stay logged in

---

## Automated Fix

Run this script on the server:

```bash
ssh root@srv1642115.your-server.de
cd /var/www/Warn
git pull origin main
bash FIX_TOKEN_EXPIRATION.sh
```

The script will:
- ✅ Backup current .env
- ✅ Update JWT_EXPIRES_IN to 24h
- ✅ Restart backend with new settings
- ✅ Verify the change

---

## Token Expiration Recommendations

### For Different Use Cases:

**Admin Dashboard** (your case):
```env
JWT_EXPIRES_IN=24h          # 24 hours
JWT_REFRESH_EXPIRES_IN=7d   # 7 days
```

**Banking/Financial Apps**:
```env
JWT_EXPIRES_IN=15m          # 15 minutes
JWT_REFRESH_EXPIRES_IN=1h   # 1 hour
```

**E-commerce/Social Media**:
```env
JWT_EXPIRES_IN=1h           # 1 hour
JWT_REFRESH_EXPIRES_IN=30d  # 30 days
```

**Internal Tools**:
```env
JWT_EXPIRES_IN=8h           # 8 hours (work day)
JWT_REFRESH_EXPIRES_IN=30d  # 30 days
```

---

## Advanced Solution (Option 2)

If you want to keep 15-minute tokens but avoid logout, implement **silent token refresh**:

### Frontend Changes:

```javascript
// src/contexts/AuthContext.jsx

useEffect(() => {
  if (!accessToken) return;

  // Refresh token 1 minute before expiration
  const refreshInterval = setInterval(async () => {
    try {
      const res = await authApi.refresh();
      const { accessToken: newToken } = res.data.data;
      setAccessToken(newToken);
      console.log('Token refreshed silently');
    } catch (err) {
      console.error('Silent refresh failed:', err);
      // Token refresh failed - user will be logged out on next request
    }
  }, 14 * 60 * 1000); // 14 minutes (1 min before expiration)

  return () => clearInterval(refreshInterval);
}, [accessToken]);
```

**Pros**:
- ✅ Keeps short-lived tokens (more secure)
- ✅ User never gets logged out
- ✅ Automatic background refresh

**Cons**:
- ⚠️ More complex
- ⚠️ Extra API calls every 14 minutes
- ⚠️ Requires careful timing

---

## Security Considerations

### Access Token Lifetime

**15 minutes** (current):
- ✅ Very secure
- ❌ Poor UX (frequent logouts)
- ✅ Compromised token expires quickly

**1 hour**:
- ✅ Good balance
- ✅ Better UX
- ⚠️ Compromised token valid for 1 hour

**24 hours** (recommended):
- ✅ Great UX
- ⚠️ Less secure than 15m
- ⚠️ Compromised token valid for 24 hours
- ✅ Still acceptable for most apps

**7 days**:
- ❌ Too long for access tokens
- ❌ Security risk
- ✅ OK for refresh tokens only

### Best Practices

1. **Access Token**: 15m - 24h (depending on security needs)
2. **Refresh Token**: 7d - 30d (stored in httpOnly cookie)
3. **Implement Silent Refresh**: For best UX + security
4. **Use HTTPS**: Always (you already have this ✅)
5. **httpOnly Cookies**: For refresh tokens (you already have this ✅)
6. **Memory Storage**: For access tokens (you already have this ✅)

---

## Comparison Table

| Setting | Current | Recommended | High Security |
|---------|---------|-------------|---------------|
| Access Token | 15m | 24h | 15m + Silent Refresh |
| Refresh Token | 7d | 7d | 1d |
| User Experience | ❌ Poor | ✅ Good | ✅ Excellent |
| Security | ✅ High | ✅ Good | ✅ Very High |
| Complexity | ✅ Simple | ✅ Simple | ⚠️ Complex |

---

## Deployment

### Quick Fix (24 Hour Tokens):

```bash
# 1. SSH to server
ssh root@srv1642115.your-server.de

# 2. Run fix script
cd /var/www/Warn
git pull origin main
bash FIX_TOKEN_EXPIRATION.sh

# 3. Test
# Login and wait 5-10 minutes, then refresh
```

### Manual Fix:

```bash
# 1. Edit .env
cd /var/www/Warn/wans-backend
nano .env

# 2. Change JWT_EXPIRES_IN=15m to JWT_EXPIRES_IN=24h

# 3. Restart backend
pm2 restart project-backend --update-env

# 4. Verify
pm2 logs project-backend --lines 20
```

---

## Testing

### Test 1: Short Wait (5 minutes)
1. Login to admin dashboard
2. Wait 5 minutes
3. Refresh page (F5)
4. ✅ Should stay logged in

### Test 2: Long Wait (1 hour)
1. Login to admin dashboard
2. Wait 1 hour
3. Refresh page (F5)
4. ✅ Should stay logged in

### Test 3: Very Long Wait (25 hours)
1. Login to admin dashboard
2. Wait 25 hours
3. Refresh page (F5)
4. ❌ Should be logged out (token expired after 24h)
5. ✅ This is expected behavior

---

## Troubleshooting

### Issue: Still getting logged out after fix

**Check 1**: Verify .env was updated
```bash
cd /var/www/Warn/wans-backend
grep JWT_EXPIRES_IN .env
# Should show: JWT_EXPIRES_IN=24h
```

**Check 2**: Verify backend restarted
```bash
pm2 logs project-backend --lines 20
# Should see recent restart timestamp
```

**Check 3**: Clear browser cache
```
Ctrl+Shift+Delete → Clear cookies and cache
```

**Check 4**: Login again
```
Old tokens still have 15m expiration
New tokens will have 24h expiration
```

---

## Summary

**Problem**: Token expires after 15 minutes, causing logout on refresh

**Solution**: Increase token expiration to 24 hours

**Command**:
```bash
bash FIX_TOKEN_EXPIRATION.sh
```

**Result**: Users stay logged in for 24 hours ✅

**Time**: 2 minutes

**Impact**: High (much better UX)

**Security**: Still good (24h is acceptable)

---

## Next Steps

1. ✅ Deploy the fix (increase to 24h)
2. ✅ Test with users
3. ⚠️ Monitor for security issues
4. 📊 Consider implementing silent refresh later (for even better UX)

Your users will no longer get logged out after a few minutes! 🎉
