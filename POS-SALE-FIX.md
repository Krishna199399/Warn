# POS Sale Validation Fix

## Problem
POS sale endpoint was returning **400 Bad Request** with "Validation failed" error.

## Root Cause
The `/api/orders/pos-sale` route was using `createOrderSchema` which expected:
- `productId`, `quantity`, `buyerType`, `deliveryAddress`, etc.

But the POS frontend sends:
```json
{
  "farmerName": "krishna",
  "farmerPhone": "8105829199",
  "farmerLocation": "bgm",
  "advisorCode": "ADV-2026-0001",
  "discount": 0,
  "paymentMethod": "CASH",
  "items": [{"productId": "69fcf11a946fab4ae8f28ba", "quantity": 1}]
}
```

## Solution
Created a new `posOrderSchema` that matches the POS frontend payload structure:

### Changes Made

**1. `wans-backend/src/schemas/order.schema.js`**
- Added `posOrderSchema` with proper validation:
  - `farmerName`: required string
  - `farmerPhone`: 10-digit phone number
  - `farmerLocation`: required string
  - `advisorCode`: optional advisor code (ADV-2026-0001 format)
  - `discount`: optional number (0-100)
  - `paymentMethod`: enum (CASH, UPI, CARD, ONLINE)
  - `items`: array of {productId, quantity}
- Exported `posOrderSchema` in module.exports

**2. `wans-backend/src/routes/order.routes.js`**
- Imported `posOrderSchema` from schema file
- Updated POS sale route to use `validate(posOrderSchema)` instead of `validate(createOrderSchema)`

## Deployment

### On VPS (as root):
```bash
cd /var/www/Warn/wans-backend
git pull origin main
pm2 restart project-backend --update-env
pm2 logs project-backend --lines 20 --nostream
```

### Or use the deployment script:
```bash
bash deploy-pos-sale-fix.sh
```

## Testing
1. Login as Mini Stock user
2. Go to POS Sale page
3. Add customer details and products
4. Click "Complete Sale"
5. Should succeed with 201 Created response

## Commit
- **Commit**: 253df7d
- **Message**: "fix: Add posOrderSchema for POS sale validation"
- **Files**: 
  - `wans-backend/src/schemas/order.schema.js`
  - `wans-backend/src/routes/order.routes.js`

## Status
✅ **FIXED** - Ready for deployment to VPS
