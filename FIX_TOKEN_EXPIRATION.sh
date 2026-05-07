#!/bin/bash
# Fix Token Expiration Issue
# Run on server: ssh root@srv1642115.your-server.de

echo "==================================="
echo "Token Expiration Fix"
echo "==================================="
echo ""

cd /var/www/Warn/wans-backend

echo "Step 1: Checking current JWT_EXPIRES_IN..."
if grep -q "JWT_EXPIRES_IN" .env; then
    CURRENT=$(grep "JWT_EXPIRES_IN" .env)
    echo "Current setting: $CURRENT"
else
    echo "⚠️  JWT_EXPIRES_IN not found in .env"
fi
echo ""

echo "Step 2: Updating JWT_EXPIRES_IN to 24h (24 hours)..."
# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Update JWT_EXPIRES_IN
if grep -q "JWT_EXPIRES_IN" .env; then
    sed -i 's/JWT_EXPIRES_IN=.*/JWT_EXPIRES_IN=24h/' .env
    echo "✅ Updated JWT_EXPIRES_IN=24h"
else
    echo "JWT_EXPIRES_IN=24h" >> .env
    echo "✅ Added JWT_EXPIRES_IN=24h"
fi
echo ""

echo "Step 3: Verifying new setting..."
grep "JWT_EXPIRES_IN" .env
echo ""

echo "Step 4: Restarting backend..."
pm2 restart project-backend --update-env

if [ $? -eq 0 ]; then
    echo "✅ Backend restarted"
else
    echo "❌ Backend restart failed!"
    exit 1
fi
echo ""

echo "Step 5: Checking backend status..."
pm2 status project-backend
echo ""

echo "==================================="
echo "Fix Complete!"
echo "==================================="
echo ""
echo "What changed:"
echo "  • Access token now expires after 24 hours (was 15 minutes)"
echo "  • You can stay logged in for 24 hours without refresh"
echo "  • Refresh token still expires after 7 days"
echo ""
echo "Test the fix:"
echo "1. Login to: https://warnamayii.cloud/login"
echo "2. Wait 5-10 minutes"
echo "3. Refresh the page (F5)"
echo "4. ✅ You should stay logged in!"
echo ""
echo "Note: Users will need to login again after this change"
echo "      (existing tokens have old expiration)"
