#!/bin/bash

# Deployment script for KYC route collision fix
# This fixes the server crash when accessing /api/users/kyc

echo "=========================================="
echo "Deploying KYC Route Fix"
echo "=========================================="
echo ""

# Navigate to backend directory
cd /var/www/Warn/wans-backend || exit 1

echo "✓ Changed to backend directory"
echo ""

# Pull latest changes
echo "Pulling latest changes from repository..."
git pull origin main || {
    echo "❌ Git pull failed. Please check your repository connection."
    exit 1
}
echo "✓ Git pull successful"
echo ""

# Restart PM2 process
echo "Restarting PM2 process..."
pm2 restart project-backend --update-env || {
    echo "❌ PM2 restart failed"
    exit 1
}
echo "✓ PM2 restart successful"
echo ""

# Show recent logs
echo "Recent logs:"
echo "----------------------------------------"
pm2 logs project-backend --lines 20 --nostream
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "What was fixed:"
echo "  • Moved /kyc routes BEFORE /:id routes"
echo "  • Prevents route collision where 'kyc' was treated as user ID"
echo "  • Server will no longer crash on KYC page access"
echo ""
echo "Why this happened:"
echo "  • Express matches routes in order of definition"
echo "  • GET /users/:id was catching GET /users/kyc"
echo "  • 'kyc' was being cast to ObjectId, causing crash"
echo ""
echo "Test the fix:"
echo "  1. Login as WHOLESALE or MINI_STOCK user"
echo "  2. Navigate to KYC page"
echo "  3. Should load without server crash"
echo ""
