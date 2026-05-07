# VPS CORS Fix Guide

## Problem
Your application is showing CORS errors after some time:
```
Access to XMLHttpRequest has been blocked by CORS policy
Response to preflight request doesn't pass access control check
```

## Root Cause
The backend `.env` file on your VPS doesn't have the correct `FRONTEND_URL` configured, or the CORS configuration isn't properly handling the production domain.

## Solution

### Step 1: SSH into your VPS
```bash
ssh root@srv1642115
# or whatever your VPS login is
```

### Step 2: Navigate to backend directory
```bash
cd /var/www/Warn/wans-backend
```

### Step 3: Edit the .env file
```bash
nano .env
```

### Step 4: Update FRONTEND_URL
Make sure this line is set correctly:
```env
FRONTEND_URL=https://warnamayii.cloud
NODE_ENV=production
```

**IMPORTANT:** 
- Use `https://` (not `http://`)
- Use your exact frontend domain
- No trailing slash
- If you have multiple domains, separate with commas: `https://warnamayii.cloud,https://www.warnamayii.cloud`

### Step 5: Verify other environment variables
Make sure these are also set:
```env
PORT=5000
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Step 6: Save and exit
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 7: Restart the backend server
```bash
pm2 restart project-backend
```

Or if you need to reload the environment:
```bash
pm2 restart project-backend --update-env
```

### Step 8: Check PM2 logs
```bash
pm2 logs project-backend --lines 50
```

Look for:
- ✅ Server starting message
- ✅ MongoDB connection success
- ⚠️ Any CORS rejection messages (should show allowed origins)

### Step 9: Test from browser
1. Open your frontend: `https://warnamayii.cloud`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try to login
5. Check for CORS errors

## Verification Checklist

- [ ] `.env` file has `FRONTEND_URL=https://warnamayii.cloud`
- [ ] `.env` file has `NODE_ENV=production`
- [ ] PM2 restarted successfully
- [ ] No CORS errors in PM2 logs
- [ ] Frontend can make API requests
- [ ] Login works without CORS errors
- [ ] Browser console shows no red CORS errors

## Additional Nginx Configuration (if needed)

If CORS errors persist, check your Nginx configuration:

```bash
nano /etc/nginx/sites-available/warnamayii
```

Make sure your backend proxy has these headers:
```nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # CORS headers (if backend doesn't handle them)
    # add_header 'Access-Control-Allow-Origin' 'https://warnamayii.cloud' always;
    # add_header 'Access-Control-Allow-Credentials' 'true' always;
    # add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    # add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
}
```

**Note:** The commented CORS headers are only needed if your backend CORS isn't working. Try without them first.

After editing Nginx:
```bash
nginx -t  # Test configuration
systemctl reload nginx  # Reload if test passes
```

## Common Issues

### Issue 1: "Origin not allowed" in logs
**Solution:** Double-check `FRONTEND_URL` in `.env` matches exactly what browser sends

### Issue 2: CORS works initially, then fails
**Solution:** This might be a PM2 restart issue. Make sure to use `--update-env` flag

### Issue 3: Still getting CORS errors
**Solution:** Check if you have multiple backend instances running:
```bash
pm2 list
pm2 delete all  # Stop all
pm2 start ecosystem.config.js  # Start fresh
```

### Issue 4: Preflight OPTIONS requests failing
**Solution:** Make sure Nginx isn't blocking OPTIONS requests. The updated CORS config now handles this with `optionsSuccessStatus: 204`

## Testing Commands

Test CORS from command line:
```bash
# Test preflight request
curl -X OPTIONS https://api.warnamayii.cloud/api/health \
  -H "Origin: https://warnamayii.cloud" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return 204 with CORS headers
```

## Files Modified Locally
- ✅ `wans-backend/src/app.js` - Added CORS logging and better OPTIONS handling

## Next Steps
1. Apply the `.env` changes on your VPS
2. Restart PM2
3. Test the application
4. If still having issues, check PM2 logs for the CORS rejection messages
5. Share the logs if you need more help
