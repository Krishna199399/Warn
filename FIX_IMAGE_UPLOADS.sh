#!/bin/bash
# Fix Image Upload Issues on Production Server
# Run this on the server: ssh root@srv1642115

echo "=== Checking Image Upload Directory ==="

# Navigate to backend
cd /var/www/Warn/wans-backend

# Check if uploads directory exists
if [ -d "uploads/products" ]; then
    echo "✅ Directory exists: uploads/products"
else
    echo "❌ Directory missing! Creating..."
    mkdir -p uploads/products
    echo "✅ Created: uploads/products"
fi

# Set proper permissions
echo ""
echo "=== Setting Permissions ==="
chown -R www-data:www-data uploads/
chmod -R 755 uploads/
echo "✅ Permissions set: www-data:www-data, 755"

# List uploaded files
echo ""
echo "=== Uploaded Files ==="
ls -lah uploads/products/ | head -20
echo ""

# Check Nginx configuration
echo "=== Checking Nginx Configuration ==="
grep -A 5 "location /uploads" /etc/nginx/sites-available/api.warnamayii.cloud.conf
echo ""

# Test if uploads are accessible
echo "=== Testing Upload Access ==="
if [ -f "uploads/products/$(ls uploads/products/ | head -1)" ]; then
    FIRST_FILE=$(ls uploads/products/ | head -1)
    echo "Testing: https://api.warnamayii.cloud/uploads/products/$FIRST_FILE"
    curl -I "https://api.warnamayii.cloud/uploads/products/$FIRST_FILE" | head -5
else
    echo "⚠️  No files to test"
fi

echo ""
echo "=== Checking Recent Product in Database ==="
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
    console.log('  Image Path:', product.image);
    console.log('  Created:', product.createdAt);
  } else {
    console.log('No products found');
  }
  process.exit(0);
}).catch(err => {
  console.error('Database error:', err.message);
  process.exit(1);
});
"

echo ""
echo "=== Fix Complete ==="
echo "Now test by uploading a new product image at:"
echo "https://warnamayii.cloud/app/products/create"
