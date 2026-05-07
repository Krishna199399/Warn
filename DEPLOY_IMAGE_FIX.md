# Deploy Image Upload Fix - Step by Step

## What This Fixes
Product images are uploading but not displaying on the live website. This fix configures Nginx to serve the uploaded images correctly.

---

## Steps to Deploy (5 minutes)

### Step 1: SSH to Your Server
```bash
ssh root@srv1642115.your-server.de
```

### Step 2: Pull Latest Code
```bash
cd /var/www/Warn
git pull origin main
```

You should see:
```
QUICK_FIX_IMAGES.sh
IMAGE_UPLOAD_TROUBLESHOOTING.md
nginx-uploads-config.txt
FIX_IMAGES_SUMMARY.md
```

### Step 3: Run the Fix Script
```bash
bash QUICK_FIX_IMAGES.sh
```

The script will:
- ✅ Create uploads directory
- ✅ Set proper permissions
- ✅ Check Nginx configuration
- ⚠️ Tell you if Nginx needs updating

### Step 4: Update Nginx (If Needed)

If the script says **"❌ Nginx missing /uploads location block"**, do this:

```bash
# Open Nginx config
nano /etc/nginx/sites-available/api.warnamayii.cloud.conf
```

Find the section that looks like:
```nginx
server {
    listen 443 ssl http2;
    server_name api.warnamayii.cloud;
    
    # ... SSL config ...
    
    location /api {
        proxy_pass http://localhost:5000;
        # ... proxy config ...
    }
}
```

**Add this BEFORE the `location /api` block:**
```nginx
    # Serve uploaded files
    location /uploads {
        alias /var/www/Warn/wans-backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "https://warnamayii.cloud";
    }
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Test and Reload Nginx
```bash
# Test configuration
nginx -t
```

Should say: `syntax is ok` and `test is successful`

```bash
# Reload Nginx
systemctl reload nginx
```

### Step 6: Test the Fix

**Option A: Upload New Product**
1. Go to: https://warnamayii.cloud/app/products/create
2. Login: admin@wans.com / admin123
3. Create a product with an image
4. Check if image displays ✅

**Option B: Test Existing Image**
```bash
# List uploaded files
ls -lah /var/www/Warn/wans-backend/uploads/products/

# Test first file (replace filename)
curl -I https://api.warnamayii.cloud/uploads/products/product-1234567890.jpg
```

Should return: `HTTP/2 200` ✅

---

## Verification Checklist

After deployment, verify:

- [ ] Script ran without errors
- [ ] Nginx config updated (if needed)
- [ ] `nginx -t` shows no errors
- [ ] Nginx reloaded successfully
- [ ] Test image URL returns 200 OK
- [ ] New product images display correctly
- [ ] Existing product images display correctly
- [ ] Browser DevTools shows no 404 errors

---

## If Something Goes Wrong

### Images still not showing?
```bash
# Check permissions
ls -la /var/www/Warn/wans-backend/uploads/products/

# Should show: drwxr-xr-x www-data www-data
```

### Nginx won't reload?
```bash
# Check for syntax errors
nginx -t

# View error details
tail -20 /var/log/nginx/error.log
```

### Need to revert?
```bash
# Restore Nginx config from backup
cp /etc/nginx/sites-available/api.warnamayii.cloud.conf.backup /etc/nginx/sites-available/api.warnamayii.cloud.conf
systemctl reload nginx
```

---

## Quick Reference

**Server**: srv1642115.your-server.de
**Frontend**: https://warnamayii.cloud
**Backend**: https://api.warnamayii.cloud
**Admin Login**: admin@wans.com / admin123

**Key Directories**:
- Backend: `/var/www/Warn/wans-backend`
- Uploads: `/var/www/Warn/wans-backend/uploads/products`
- Nginx Config: `/etc/nginx/sites-available/api.warnamayii.cloud.conf`

**Key Commands**:
- Pull code: `cd /var/www/Warn && git pull origin main`
- Run fix: `bash QUICK_FIX_IMAGES.sh`
- Test Nginx: `nginx -t`
- Reload Nginx: `systemctl reload nginx`
- Check logs: `tail -f /var/log/nginx/error.log`

---

## Success Indicators

✅ **Script output shows**:
- Directory created/verified
- Permissions set correctly
- Nginx config valid
- Image accessible (HTTP 200)

✅ **Website shows**:
- Product images display correctly
- No broken image icons
- Browser DevTools shows 200 OK for images

✅ **You're done!** 🎉

---

## Need Help?

Read the detailed guides:
- **FIX_IMAGES_SUMMARY.md** - Complete overview
- **IMAGE_UPLOAD_TROUBLESHOOTING.md** - Detailed troubleshooting
- **nginx-uploads-config.txt** - Nginx configuration reference

Or check:
- PM2 logs: `pm2 logs project-backend`
- Nginx logs: `tail -f /var/log/nginx/error.log`
- Browser console (F12) for frontend errors
