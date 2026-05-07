#!/bin/bash
# Deploy POS Sale Validation Fix to VPS
# This script pulls the latest backend code with posOrderSchema

echo "🚀 Deploying POS Sale Validation Fix..."
echo ""

# Navigate to backend directory
cd /var/www/Warn/wans-backend || exit 1

# Pull latest changes from GitHub
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main

# Verify the schema file has posOrderSchema
echo ""
echo "✅ Verifying posOrderSchema exists..."
if grep -q "posOrderSchema" src/schemas/order.schema.js; then
    echo "   ✓ posOrderSchema found in schema file"
else
    echo "   ✗ ERROR: posOrderSchema not found!"
    exit 1
fi

# Verify the route file imports posOrderSchema
echo ""
echo "✅ Verifying route imports posOrderSchema..."
if grep -q "posOrderSchema" src/routes/order.routes.js; then
    echo "   ✓ posOrderSchema imported in routes"
else
    echo "   ✗ ERROR: posOrderSchema not imported!"
    exit 1
fi

# Restart backend with PM2
echo ""
echo "🔄 Restarting backend server..."
pm2 restart project-backend --update-env

# Wait for server to start
echo ""
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
echo ""
echo "🔍 Checking server status..."
pm2 list | grep project-backend

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Check logs: pm2 logs project-backend --lines 20 --nostream"
echo "   2. Test POS sale in browser"
echo ""
