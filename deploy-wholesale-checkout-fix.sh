#!/bin/bash

# Deployment script for wholesale checkout validation fix
# This fixes the "Validation failed" error when placing orders

echo "=========================================="
echo "Deploying Wholesale Checkout Fix"
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
echo "  • Removed mandatory 'price' field from order validation"
echo "  • Price is now calculated server-side (security best practice)"
echo "  • Added proper validation for buyerType, deliveryAddress, etc."
echo ""
echo "Test the fix:"
echo "  1. Login as WHOLESALE user"
echo "  2. Add products to cart"
echo "  3. Go to checkout and fill shipping details"
echo "  4. Place order - should work without validation error"
echo ""
