#!/bin/bash

# Combined deployment script for all fixes
# 1. Wholesale checkout validation fix
# 2. KYC route collision fix

echo "=========================================="
echo "Deploying All Fixes to Production"
echo "=========================================="
echo ""
echo "Fixes included:"
echo "  1. Wholesale checkout validation (order creation)"
echo "  2. KYC route collision (server crash prevention)"
echo ""

# Navigate to backend directory
cd /var/www/Warn/wans-backend || exit 1

echo "✓ Changed to backend directory"
echo ""

# Show current branch and status
echo "Current git status:"
echo "----------------------------------------"
git status
echo ""

# Pull latest changes
echo "Pulling latest changes from repository..."
git pull origin main || {
    echo "❌ Git pull failed. Please check your repository connection."
    exit 1
}
echo "✓ Git pull successful"
echo ""

# Show what changed
echo "Files changed:"
echo "----------------------------------------"
git log -1 --stat
echo ""

# Restart PM2 process
echo "Restarting PM2 process..."
pm2 restart project-backend --update-env || {
    echo "❌ PM2 restart failed"
    exit 1
}
echo "✓ PM2 restart successful"
echo ""

# Wait for server to start
echo "Waiting for server to start..."
sleep 3
echo ""

# Show recent logs
echo "Recent logs:"
echo "----------------------------------------"
pm2 logs project-backend --lines 30 --nostream
echo ""

echo "=========================================="
echo "✅ All Fixes Deployed Successfully!"
echo "=========================================="
echo ""
echo "FIXES APPLIED:"
echo ""
echo "1. WHOLESALE CHECKOUT FIX"
echo "   • Removed mandatory 'price' field from validation"
echo "   • Price now calculated server-side (security best practice)"
echo "   • Added proper validation for buyerType, deliveryAddress"
echo "   • File: src/schemas/order.schema.js"
echo ""
echo "2. KYC ROUTE FIX"
echo "   • Moved /kyc routes BEFORE /:id routes"
echo "   • Prevents 'kyc' being treated as user ID"
echo "   • Server no longer crashes on KYC page access"
echo "   • File: src/routes/user.routes.js"
echo ""
echo "TESTING:"
echo ""
echo "Test Wholesale Checkout:"
echo "  1. Login as WHOLESALE user"
echo "  2. Add products to cart"
echo "  3. Go to checkout and fill shipping details"
echo "  4. Place order - should work without validation error"
echo ""
echo "Test KYC Page:"
echo "  1. Login as WHOLESALE or MINI_STOCK user"
echo "  2. Navigate to KYC page"
echo "  3. Should load without server crash"
echo ""
echo "Monitor logs:"
echo "  pm2 logs project-backend"
echo ""
