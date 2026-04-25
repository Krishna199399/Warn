# WANS Backend - Warnamayii Agri Network System

## Overview
WANS is a comprehensive hybrid system combining:
- **ERP**: Inventory + Supply Chain Management
- **MLM**: Employee Hierarchy + Commission Distribution
- **Order Management**: Transaction-based order processing

---

## 🏢 System Architecture

### Product Flow
```
Company (Admin) → Wholesale → Mini Stock → Farmer (Customer)
```

### Employee Hierarchy
```
Company (Admin) → State Head → Zonal Manager → Area Manager → DO Manager → Advisor
```

### Connection
- Advisors bring customers
- Sales happen at Mini Stock
- Orders include advisorId
- Commission flows up employee hierarchy

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 5+
- npm or yarn

### Installation
```bash
cd wans-backend
npm install
```

### Environment Variables
Create `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/wans
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=5000
NODE_ENV=development
```

### Run Development Server
```bash
npm run dev
```

### Run Production Server
```bash
npm start
```

---

## 📦 Order System

### Order Flow (4 Steps)

#### 1. CREATE (status = PENDING)
```bash
POST /api/orders
{
  "buyerType": "WHOLESALE" | "MINI_STOCK" | "CUSTOMER",
  "productId": "...",
  "quantity": 10,
  "advisorCode": "ADV00108"  # Required for CUSTOMER orders
}
```

#### 2. APPROVE (status = APPROVED)
```bash
PUT /api/orders/:id/approve
```
- Seller approves order
- Validates payment and stock

#### 3. SHIP (status = SHIPPED)
```bash
PUT /api/orders/:id/ship
```
- Seller marks as shipped

#### 4. DELIVER (status = DELIVERED) ⚠️ CRITICAL
```bash
PUT /api/orders/:id/deliver
```
- Buyer confirms delivery
- **Stock is updated HERE**
- **Commissions calculated HERE** (if sales order)

---

## 💰 Commission System

### Rates
| Role          | Rate | Level  |
|---------------|------|--------|
| ADVISOR       | 5.0% | Direct |
| DO_MANAGER    | 2.0% | L1     |
| AREA_MANAGER  | 1.0% | L2     |
| ZONAL_MANAGER | 0.5% | L3     |
| STATE_HEAD    | 0.2% | L4     |

### Trigger
- ONLY on Mini Stock → Customer sales
- ONLY on delivery confirmation
- Uses immutable hierarchy snapshot

---

## 🔐 Authentication

### Register
```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "ADVISOR",
  "phone": "1234567890"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## 📚 API Endpoints

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my` - My orders
- `GET /api/orders` - All orders (filtered by role)
- `GET /api/orders/:id` - Order details
- `PUT /api/orders/:id/approve` - Approve order
- `PUT /api/orders/:id/ship` - Ship order
- `PUT /api/orders/:id/deliver` - Confirm delivery

### Inventory
- `GET /api/inventory/my` - My inventory
- `POST /api/inventory/add-stock` - Add from company (Wholesale)
- `POST /api/inventory/transfer` - Transfer to mini stock (Wholesale)
- `GET /api/inventory/transfers` - Transfer history

### Commissions
- `GET /api/commissions/my` - My commissions
- `GET /api/commissions/summary` - My summary
- `GET /api/commissions/subtree` - Subtree commissions (Managers)

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - User details
- `GET /api/users/:id/downline` - User's subtree
- `GET /api/users/:id/performance` - Performance stats
- `PUT /api/users/:id/approve` - Approve user (Admin)

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

---

## 🗄️ Database Models

### Order
```javascript
{
  buyerId, buyerType,
  sellerId, sellerType,
  productId, quantity, price, total,
  status, paymentStatus,
  advisorId, farmerId,
  hierarchySnapshot,
  approvedAt, shippedAt, deliveredAt
}
```

### User
```javascript
{
  name, email, password, role,
  parentId, advisorCode,
  totalSales, teamSize,
  status, promotionStatus
}
```

### Inventory
```javascript
{
  ownerId, ownerRole,
  items: [{
    productId, received, dispatched, current, minLevel
  }]
}
```

### Commission
```javascript
{
  orderId, userId, role,
  amount, level, type,
  snapshotUsed, date
}
```

### StockLog
```javascript
{
  type, orderId, productId,
  quantity, from, to, notes
}
```

---

## 🔧 Scripts

### Create Admin User
```bash
node scripts/create-admin.js
```

### Seed Database
```bash
node seeder/seed.js
```

### Migrate Orders
```bash
node scripts/migrate-orders.js
```

### Clean Database
```bash
node scripts/clean-db.js
```

---

## 📖 Documentation

- **INTEGRATED_SYSTEM.md** - Complete system architecture
- **QUICK_REFERENCE.md** - Quick reference guide
- **NOTIFICATION_SYSTEM.md** - Notification system details
- **ADMIN_GUIDE.md** - Admin user guide

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Order Flow
1. Create order (PENDING)
2. Approve order (APPROVED)
3. Ship order (SHIPPED)
4. Confirm delivery (DELIVERED)
5. Verify stock update
6. Verify commission calculation

---

## 🚫 Critical Rules

1. **Stock updates ONLY on delivery**
2. **Commission ONLY on sales orders**
3. **Commission ONLY calculated on delivery**
4. **Hierarchy snapshot is immutable**
5. **All operations use MongoDB transactions**
6. **Buyer confirms delivery, not seller**
7. **Payment must be PAID before approval**

---

## 🐛 Troubleshooting

### Issue: "Insufficient stock"
**Solution:** Seller needs to order more stock first

### Issue: "Payment must be verified"
**Solution:** Update payment status to PAID

### Issue: "Only buyer can confirm delivery"
**Solution:** Buyer must confirm, not seller

---

## 📞 Support

For issues or questions:
1. Check documentation files
2. Check error messages in API responses
3. Check MongoDB transaction logs
4. Check notification system for alerts

---

## 📄 License

MIT License

---

## 👥 Contributors

- Development Team
- Product Team
- QA Team

---

## 🎯 Roadmap

- [ ] Payment gateway integration
- [ ] SMS notifications
- [ ] Email notifications
- [ ] Mobile app API
- [ ] Advanced analytics
- [ ] Automated stock reordering
- [ ] Commission withdrawal system
- [ ] Multi-currency support
