#!/bin/bash
# Fix Frontend Environment Variables and Rebuild
# Run on server: ssh root@srv1642115.your-server.de

echo "==================================="
echo "Frontend Environment Fix"
echo "==================================="
echo ""

cd /var/www/Warn

echo "Step 1: Checking current .env file..."
if [ -f ".env" ]; then
    echo "Current .env contents:"
    cat .env
else
    echo "⚠️  No .env file found!"
fi
echo ""

echo "Step 2: Creating/updating .env with production values..."
cat > .env << 'EOF'
VITE_API_URL=https://api.warnamayii.cloud/api
EOF

echo "✅ .env file updated:"
cat .env
echo ""

echo "Step 3: Rebuilding frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi
echo ""

echo "Step 4: Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

echo "==================================="
echo "Fix Complete!"
echo "==================================="
echo ""
echo "Now test:"
echo "1. Go to: https://warnamayii.cloud/app/products"
echo "2. Check if product images display correctly"
echo "3. Open browser DevTools (F12) → Network tab"
echo "4. Look for image requests - should be:"
echo "   https://api.warnamayii.cloud/uploads/products/..."
echo ""
echo "If images still don't show, check browser console for errors"
