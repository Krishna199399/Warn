#!/bin/bash
# Fix Immediate Logout on Refresh
# Run on server: ssh root@srv1642115.your-server.de

echo "==================================="
echo "Immediate Logout Fix Deployment"
echo "==================================="
echo ""

cd /var/www/Warn

echo "Step 1: Pulling latest code..."
git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Code pulled successfully"
else
    echo "❌ Git pull failed!"
    exit 1
fi
echo ""

echo "Step 2: Installing dependencies (if needed)..."
npm install --production

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependency installation had issues (may be okay)"
fi
echo ""

echo "Step 3: Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
else
    echo "❌ Build failed!"
    exit 1
fi
echo ""

echo "Step 4: Checking build output..."
if [ -d "dist" ]; then
    echo "✅ dist/ directory exists"
    ls -lh dist/index.html 2>/dev/null && echo "✅ index.html found"
else
    echo "❌ dist/ directory not found!"
    exit 1
fi
echo ""

echo "Step 5: Reloading Nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx reload failed!"
    exit 1
fi
echo ""

echo "Step 6: Checking Nginx status..."
systemctl status nginx --no-pager | head -5
echo ""

echo "==================================="
echo "Deployment Complete!"
echo "==================================="
echo ""
echo "What was fixed:"
echo "  • Session restoration now works correctly"
echo "  • /auth/refresh → /auth/me flow implemented"
echo "  • API interceptor fixed to allow /auth/me retry"
echo ""
echo "Test the fix:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Login: https://warnamayii.cloud/login"
echo "3. Immediately refresh (F5)"
echo "4. ✅ You should stay logged in!"
echo ""
echo "If still having issues:"
echo "  • Check browser console (F12)"
echo "  • Check network tab for /auth/refresh and /auth/me"
echo "  • Clear cookies and cache completely"
echo "  • Try in incognito/private window"
echo ""
echo "Documentation: FIX_IMMEDIATE_LOGOUT.md"
