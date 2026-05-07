#!/bin/bash
# Deploy registration fix to production

echo "🚀 Deploying registration fix to production..."

# Copy fixed files
echo "📦 Copying fixed files..."
scp wans-backend/src/app.js root@warnamayii.cloud:/var/www/Warn/wans-backend/src/
scp wans-backend/src/models/User.js root@warnamayii.cloud:/var/www/Warn/wans-backend/src/models/
scp wans-backend/src/services/notification.service.js root@warnamayii.cloud:/var/www/Warn/wans-backend/src/services/

# Restart PM2
echo "🔄 Restarting PM2..."
ssh root@warnamayii.cloud "pm2 restart project-backend"

echo "✅ Deployment complete!"
echo ""
echo "Test registration at: https://warnamayii.cloud/register"
