# Fix Session Refresh Issue

## Problem
When you refresh the browser page while logged into the admin dashboard, you get redirected to the login page.

## Root Cause
The access token is stored in **memory only** (React state) for security reasons. When you refresh the page:

1. React state is cleared (access token lost)
2. `AuthContext` tries to call `/auth/me` to restore session
3. `/auth/me` requires access token in Authorization header
4. Request fails with 401 Unauthorized
5. User gets redirected to login page

## The Solution
Instead of calling `/auth/me` directly, we now:

1. **First**: Call `/auth/refresh` to get a new access token from the httpOnly refresh token cookie
2. **Store**: The new access token in memory
3. **Set**: User data from the refresh response
4. **Fallback**: If refresh fails, try `/auth/me` (for backward compatibility)

This way, the session is properly restored on page refresh using the refresh token cookie.

---

## How It Works

### Before Fix:
```javascript
// On page refresh
useEffect(() => {
  authApi.me()  // ❌ Fails - no access token in memory
    .then(res => setUser(res.data.data))
    .catch(() => setUser(null))  // ❌ User logged out
    .finally(() => setLoading(false));
}, []);
```

### After Fix:
```javascript
// On page refresh
useEffect(() => {
  const restoreSession = async () => {
    try {
      // ✅ Get new access token from refresh token cookie
      const refreshRes = await authApi.refresh();
      const { accessToken: token, user: userData } = refreshRes.data.data;
      
      // ✅ Store token and user in memory
      setAccessToken(token);
      setUser(userData);
    } catch (refreshError) {
      // Fallback to /me endpoint
      try {
        const meRes = await authApi.me();
        setUser(meRes.data.data);
      } catch (meError) {
        setUser(null);  // Both failed - need to login
      }
    } finally {
      setLoading(false);
    }
  };

  restoreSession();
}, []);
```

---

## Deployment

### Step 1: Pull Latest Code
```bash
ssh root@srv1642115.your-server.de
cd /var/www/Warn
git pull origin main
```

### Step 2: Rebuild Frontend
```bash
npm run build
```

### Step 3: Reload Nginx
```bash
systemctl reload nginx
```

### Step 4: Test
1. Login to admin dashboard: https://warnamayii.cloud/login
2. Navigate to any page (e.g., Products)
3. **Refresh the browser** (F5 or Ctrl+R)
4. ✅ You should stay logged in (not redirected to login)

---

## Technical Details

### Refresh Token Flow

```
Browser Refresh
    ↓
React State Cleared (access token lost)
    ↓
AuthContext useEffect runs
    ↓
Call /auth/refresh
    ↓
Backend reads httpOnly refresh token cookie
    ↓
Backend validates refresh token
    ↓
Backend generates new access token
    ↓
Backend returns: { accessToken, user }
    ↓
Frontend stores token in memory
    ↓
Frontend sets user data
    ↓
✅ Session restored!
```

### Security Benefits

1. **Access token in memory only**: Prevents XSS attacks from stealing tokens
2. **Refresh token in httpOnly cookie**: Prevents JavaScript from accessing it
3. **Automatic refresh on page load**: Seamless user experience
4. **Fallback mechanism**: Backward compatible with existing sessions

---

## Verification Checklist

After deployment:

- [ ] Pull latest code from GitHub
- [ ] Rebuild frontend: `npm run build`
- [ ] Reload Nginx: `systemctl reload nginx`
- [ ] Login to admin dashboard
- [ ] Navigate to any page
- [ ] Refresh browser (F5)
- [ ] Verify you stay logged in
- [ ] Check browser console for no errors
- [ ] Test on multiple pages
- [ ] Test with different roles (Admin, Advisor, etc.)

---

## Troubleshooting

### Issue: Still getting logged out on refresh

**Check 1**: Verify refresh token cookie exists
```javascript
// In browser console
document.cookie
// Should see: refreshToken=...
```

**Check 2**: Check backend logs
```bash
pm2 logs project-backend --lines 50
```

**Check 3**: Check browser console
```javascript
// Should see successful /auth/refresh call
// Network tab → Filter by "refresh"
```

**Check 4**: Verify backend /auth/refresh endpoint works
```bash
# Test refresh endpoint
curl -X POST https://api.warnamayii.cloud/api/auth/refresh \
  -H "Cookie: refreshToken=YOUR_TOKEN" \
  -v
```

### Issue: Refresh token expired

Refresh tokens expire after a certain period (usually 7 days). If expired:
1. User needs to login again
2. New refresh token will be issued
3. Subsequent refreshes will work

---

## Related Files

- `src/contexts/AuthContext.jsx` - Session restoration logic
- `src/api/auth.api.js` - Auth API endpoints
- `src/api/client.js` - Axios interceptor for token refresh
- `wans-backend/src/routes/auth.routes.js` - Backend auth routes
- `wans-backend/src/controllers/auth.controller.js` - Backend auth logic

---

## Summary

**Problem**: Page refresh logs user out  
**Cause**: Access token stored in memory only  
**Solution**: Call `/auth/refresh` on page load to get new token from cookie  
**Result**: Session persists across page refreshes ✅

**Time to Deploy**: 2 minutes  
**Difficulty**: Easy  
**Impact**: High (better UX)  
**Status**: Ready to deploy 🚀
