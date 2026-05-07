#!/bin/bash
# Deploy POS Sale Validation Fix to VPS
# This fixes the 400 Bad Request error in POS sales

echo "🚀 Deploying POS Sale Validation Fix..."
echo ""

# Navigate to backend directory
cd /var/www/Warn/wans-backend || exit 1

# Pull latest changes from GitHub
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main

# Restart backend with PM2
echo "🔄 Restarting backend server..."
pm2 restart project-backend --update-env

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check server status
echo ""
echo "📊 Server Status:"
pm2 list | grep project-backend

# Show recent logs
echo ""
echo "📋 Recent Logs (last 20 lines):"
pm2 logs project-backend --lines 20 --nostream

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test POS sale in browser to verify the fix"
