#!/bin/bash

# Deploy Backend KYC Route Fix to VPS
# Fixes: Cast to ObjectId failed for value "kyc" error

echo "🚀 Deploying Backend KYC Route Fix to VPS..."
echo ""

# VPS connection details
VPS_USER="root"
VPS_HOST="srv1642115"
VPS_BACKEND_PATH="/var/www/Warn/wans-backend"

echo "📡 Connecting to VPS: $VPS_USER@$VPS_HOST"
echo ""

# Execute deployment commands on VPS
ssh $VPS_USER@$VPS_HOST << 'ENDSSH'

echo "📂 Navigating to backend directory..."
cd /var/www/Warn/wans-backend

echo "📥 Pulling latest changes from repository..."
git pull origin main

echo "📦 Installing dependencies (if needed)..."
npm install

echo "🔄 Restarting PM2 process..."
pm2 restart project-backend --update-env

echo ""
echo "⏳ Waiting 3 seconds for server to restart..."
sleep 3

echo ""
echo "✅ Backend deployment complete!"
echo ""
echo "📋 Verifying deployment..."
pm2 status project-backend

echo ""
echo "📊 Checking recent logs..."
pm2 logs project-backend --lines 10 --nostream

echo ""
echo "🔍 Testing KYC route..."
echo "If you see 'Cast to ObjectId failed for value \"kyc\"' errors, the fix didn't apply."
echo "The error should NOT appear anymore after this deployment."
echo ""

ENDSSH

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Test KYC functionality in the app"
echo "  2. Monitor logs: ssh root@srv1642115 'pm2 logs project-backend --lines 50'"
echo "  3. Verify no more 'Cast to ObjectId' errors"
echo ""
