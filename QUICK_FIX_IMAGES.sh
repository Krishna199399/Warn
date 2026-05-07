#!/bin/bash
# Quick Fix for Image Uploads - Run on server
# Usage: ssh root@srv1642115.your-server.de
# Then: cd /var/www/Warn && bash QUICK_FIX_IMAGES.sh

echo "==================================="
echo "WANS Image Upload Fix"
echo "==================================="
echo ""

# Step 1: Create uploads directory if missing
echo "Step 1: Creating uploads directory..."
cd /var/www/Warn/wans-backend
mkdir -p uploads/products
echo "✅ Directory created/verified"
echo ""

# Step 2: Set proper permissions
echo "Step 2: Setting permissions..."
chown -R www-data:www-data uploads/
chmod -R 755 uploads/
echo "✅ Permissions: www-data:www-data, 755"
echo ""

# Step 3: Check current files
echo "Step 3: Checking uploaded files..."
FILE_COUNT=$(ls -1 uploads/products/ 2>/dev/null | wc -l)
echo "Found $FILE_COUNT files in uploads/products/"
if [ $FILE_COUNT -gt 0 ]; then
    echo "Latest 5 files:"
    ls -lth uploads/products/ | head -6
fi
echo ""

# Step 4: Verify Nginx config
echo "Step 4: Checking Nginx configuration..."
if grep -q "location /uploads" /etc/nginx/sites-available/api.warnamayii.cloud.conf; then
    echo "✅ Nginx has /uploads location block"
    grep -A 3 "location /uploads" /etc/nginx/sites-available/api.warnamayii.cloud.conf
else
    echo "❌ Nginx missing /uploads location block!"
    echo ""
    echo "Add this to /etc/nginx/sites-available/api.warnamayii.cloud.conf:"
    echo ""
    echo "    location /uploads {"
    echo "        alias /var/www/Warn/wans-backend/uploads;"
    echo "        expires 1y;"
    echo "        add_header Cache-Control \"public, immutable\";"
    echo "    }"
    echo ""
fi
echo ""

# Step 5: Test Nginx config
echo "Step 5: Testing Nginx configuration..."
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    echo ""
    echo "Reloading Nginx..."
    systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config has errors!"
fi
echo ""

# Step 6: Test image access
echo "Step 6: Testing image accessibility..."
FIRST_FILE=$(ls uploads/products/ 2>/dev/null | head -1)
if [ -n "$FIRST_FILE" ]; then
    echo "Testing: https://api.warnamayii.cloud/uploads/products/$FIRST_FILE"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://api.warnamayii.cloud/uploads/products/$FIRST_FILE")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Image accessible (HTTP $HTTP_CODE)"
    else
        echo "❌ Image not accessible (HTTP $HTTP_CODE)"
    fi
else
    echo "⚠️  No files to test - upload a product image first"
fi
echo ""

# Step 7: Check database
echo "Step 7: Checking latest product in database..."
cd /var/www/Warn/wans-backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = require('./src/models/Product');
  const product = await Product.findOne().sort({ createdAt: -1 });
  if (product) {
    console.log('Latest Product:');
    console.log('  Name:', product.name);
    console.log('  Image Path:', product.image || 'No image');
    console.log('  Created:', product.createdAt);
    if (product.image) {
      console.log('  Full URL: https://api.warnamayii.cloud' + product.image);
    }
  } else {
    console.log('No products found');
  }
  process.exit(0);
}).catch(err => {
  console.error('Database error:', err.message);
  process.exit(1);
});
" 2>/dev/null
echo ""

echo "==================================="
echo "Fix Complete!"
echo "==================================="
echo ""
echo "Next Steps:"
echo "1. Go to: https://warnamayii.cloud/app/products/create"
echo "2. Create a new product with an image"
echo "3. Check if the image displays correctly"
echo ""
echo "If images still don't show:"
echo "  - Check browser console for 404 errors"
echo "  - Verify the image URL format"
echo "  - Check PM2 logs: pm2 logs project-backend"
