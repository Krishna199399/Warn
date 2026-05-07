# Database Cleanup Script

## 🎯 Purpose

This script clears all transactional data from the database while preserving:
- ✅ Admin user (`admin@wans.com`)
- ✅ Income configuration files
- ✅ Pool configuration files
- ✅ Salary plan configuration files

## 📋 What Gets Deleted

The script removes:
- All users (except admin)
- All products
- All categories
- All orders
- All inventory records
- All commissions
- All visits
- All tasks
- All farmers
- All notifications
- All bank details
- All benefit claims
- All payment proofs
- All payout batches and records
- All stock logs and transfers
- All reward progress records
- All salary status records
- All employee code counters

## 🔒 What Gets Preserved

The script keeps:
- ✅ Admin user (admin@wans.com / admin123)
- ✅ IncomeConfig collection (seed configuration)
- ✅ PoolConfig collection (seed configuration)
- ✅ SalaryPlan collection (seed configuration)

## 🚀 Usage

### Local Environment

```bash
cd wans-backend
node scripts/clear-db-keep-admin.js
```

### Production Server

```bash
cd /var/www/Warn/wans-backend
node scripts/clear-db-keep-admin.js
```

## ⚠️ Warning

**This action is IRREVERSIBLE!** Make sure you have a backup if you need to restore data later.

## 📝 After Running

You can log in with:
- **Email**: `admin@wans.com`
- **Password**: `admin123`

All configuration files will remain intact, so you can start adding new:
- Products
- Categories
- Users
- Orders
- etc.

## 🔄 Fresh Start Workflow

1. Run this script to clear the database
2. Log in as admin
3. Create new categories
4. Create new products
5. Create new users (employees, shops, etc.)
6. Start fresh with clean data!
