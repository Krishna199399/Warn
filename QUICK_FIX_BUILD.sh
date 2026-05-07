#!/bin/bash
# Quick Fix for Build Issue
# Run on server: cd /var/www/Warn && bash QUICK_FIX_BUILD.sh

echo "==================================="
echo "Quick Build Fix"
echo "==================================="
echo ""

cd /var/www/Warn

echo "Step 1: Installing ALL dependencies (including dev)..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ npm install failed!"
    exit 1
fi
echo ""

echo "Step 2: Verifying vite is installed..."
if [ -f "node_modules/.bin/vite" ]; then
    echo "✅ vite found"
else
    echo "❌ vite not found!"
    echo "Trying to install vite explicitly..."
    npm install vite --save-dev
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

echo "Step 4: Reloading Nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx reload failed!"
    exit 1
fi
echo ""

echo "==================================="
echo "Build Complete!"
echo "==================================="
echo ""
echo "Test now:"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Login: https://warnamayii.cloud/login"
echo "3. Refresh immediately (F5)"
echo "4. ✅ Should stay logged in!"
