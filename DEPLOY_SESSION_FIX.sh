#!/bin/bash
# Deploy Session Refresh Fix
# Run on server: ssh root@srv1642115.your-server.de

echo "==================================="
echo "Session Refresh Fix Deployment"
echo "==================================="
echo ""

cd /var/www/Warn

echo "Step 1: Pulling latest code..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi
echo "✅ Code updated"
echo ""

echo "Step 2: Rebuilding frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Frontend rebuilt"
echo ""

echo "Step 3: Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

echo "==================================="
echo "Deployment Complete!"
echo "==================================="
echo ""
echo "Test the fix:"
echo "1. Go to: https://warnamayii.cloud/login"
echo "2. Login with: admin@wans.com / admin123"
echo "3. Navigate to any page"
echo "4. Press F5 to refresh"
echo "5. ✅ You should stay logged in!"
echo ""
echo "If you still get logged out:"
echo "  - Check browser console for errors"
echo "  - Check PM2 logs: pm2 logs project-backend"
echo "  - Verify refresh token cookie exists"
