# Image Upload Troubleshooting Guide

## Problem
Product images are being uploaded to the server but not displaying on the live website.

## Root Cause Analysis

### How Image Uploads Work

1. **Frontend Upload**: User selects image in Create/Edit Product form
2. **Backend Receives**: Multer middleware saves to `/var/www/Warn/wans-backend/uploads/products/`
3. **Database Stores**: Path saved as `/uploads/products/product-123456.jpg`
4. **Frontend Displays**: Image URL becomes `https://api.warnamayii.cloud/uploads/products/product-123456.jpg`
5. **Nginx Serves**: Nginx must serve files from the uploads directory

### Common Issues

#### Issue 1: Directory Doesn't Exist
**Symptom**: 500 error when uploading
**Fix**: Create directory
```bash
mkdir -p /var/www/Warn/wans-backend/uploads/products
```

#### Issue 2: Wrong Permissions
**Symptom**: 403 Forbidden or images not accessible
**Fix**: Set proper permissions
```bash
chown -R www-data:www-data /var/www/Warn/wans-backend/uploads/
chmod -R 755 /var/www/Warn/wans-backend/uploads/
```

#### Issue 3: Nginx Not Configured
**Symptom**: 404 Not Found when accessing image URL
**Fix**: Add location block to Nginx config

#### Issue 4: Wrong Image Path in Database
**Symptom**: Images uploaded but broken image icon shows
**Fix**: Verify database paths match file system

---

## Step-by-Step Fix

### Step 1: SSH to Server
```bash
ssh root@srv1642115.your-server.de
```

### Step 2: Run Quick Fix Script
```bash
cd /var/www/Warn
bash QUICK_FIX_IMAGES.sh
```

### Step 3: Verify Nginx Configuration

Check if `/etc/nginx/sites-available/api.warnamayii.cloud.conf` has:

```nginx
server {
    listen 443 ssl http2;
    server_name api.warnamayii.cloud;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.warnamayii.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.warnamayii.cloud/privkey.pem;

    # API routes
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
    }

    # CRITICAL: Serve uploaded files directly
    location /uploads {
        alias /var/www/Warn/wans-backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "https://warnamayii.cloud";
    }

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

### Step 4: Test Nginx Config
```bash
nginx -t
```

If valid:
```bash
systemctl reload nginx
```

### Step 5: Test Image Access

Upload a test product with image, then check:

```bash
# List uploaded files
ls -lah /var/www/Warn/wans-backend/uploads/products/

# Test direct access (replace with actual filename)
curl -I https://api.warnamayii.cloud/uploads/products/product-1234567890.jpg
```

Should return `HTTP/2 200` if working correctly.

### Step 6: Check Database

```bash
cd /var/www/Warn/wans-backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = require('./src/models/Product');
  const products = await Product.find().sort({ createdAt: -1 }).limit(5);
  products.forEach(p => {
    console.log(p.name, ':', p.image || 'No image');
  });
  process.exit(0);
});
"
```

---

## Manual Verification Checklist

- [ ] Directory exists: `/var/www/Warn/wans-backend/uploads/products/`
- [ ] Permissions: `www-data:www-data` with `755`
- [ ] Files exist in directory
- [ ] Nginx has `/uploads` location block
- [ ] Nginx config is valid (`nginx -t`)
- [ ] Nginx reloaded (`systemctl reload nginx`)
- [ ] Image URL accessible: `https://api.warnamayii.cloud/uploads/products/[filename]`
- [ ] Database paths start with `/uploads/products/`
- [ ] Frontend displays images correctly

---

## Testing After Fix

1. **Go to**: https://warnamayii.cloud/app/products/create
2. **Login as admin**: admin@wans.com / admin123
3. **Create new product** with image
4. **Check**:
   - Upload succeeds (no errors)
   - Product appears in list
   - Image displays correctly (not broken icon)
5. **Open browser DevTools** (F12)
   - Check Network tab for image requests
   - Should see `200 OK` for image URLs
   - If `404`, Nginx config issue
   - If `403`, permissions issue

---

## Common Error Messages

### "Cannot read properties of undefined (reading 'map')"
**Location**: EditProductPage.jsx line 153
**Status**: ✅ FIXED (added safe navigation)

### "Invalid csrf token"
**Location**: Login/API calls
**Status**: ✅ FIXED (CSRF disabled)

### "500 Internal Server Error" on /api/products
**Location**: Product validation schema
**Status**: ✅ FIXED (schema rewritten)

### "404 Not Found" for image URLs
**Location**: Nginx configuration
**Status**: ⚠️ NEEDS FIX (run QUICK_FIX_IMAGES.sh)

---

## If Images Still Don't Work

### Debug Steps:

1. **Check PM2 logs**:
```bash
pm2 logs project-backend --lines 50
```

2. **Check Nginx error logs**:
```bash
tail -f /var/log/nginx/error.log
```

3. **Check file permissions**:
```bash
ls -la /var/www/Warn/wans-backend/uploads/products/
```

4. **Test direct file access**:
```bash
# As www-data user
sudo -u www-data cat /var/www/Warn/wans-backend/uploads/products/[filename]
```

5. **Check SELinux** (if enabled):
```bash
getenforce
# If "Enforcing", may need to set context
chcon -R -t httpd_sys_content_t /var/www/Warn/wans-backend/uploads/
```

---

## Contact Information

If issues persist after following this guide:
1. Check browser console for exact error messages
2. Check PM2 logs for backend errors
3. Check Nginx error logs for server errors
4. Verify all environment variables are set correctly

**Server**: srv1642115.your-server.de
**Frontend**: https://warnamayii.cloud
**Backend**: https://api.warnamayii.cloud
**Admin**: admin@wans.com / admin123
