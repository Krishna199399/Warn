# Database Management Scripts

## Clean Database Script

The `clean-db.js` script removes all transactional data from the database while preserving:
- ✓ **Employee/User data** - All user accounts and employee information
- ✓ **Income Config** - Commission structure for all roles
- ✓ **Pool Config** - Pool percentage configuration (IV, SV, RF)
- ✓ **Salary Plans** - Salary levels and reward benefits

### What Gets Deleted:
- ✅ Orders
- ✅ Products
- ✅ Categories
- ✅ Inventory
- ✅ Commissions
- ✅ Notifications
- ✅ Tasks
- ✅ Farmers
- ✅ Visits
- ✅ Stock Logs
- ✅ Stock Transfers
- ✅ Bank Details
- ✅ Payout Batches
- ✅ Payout Records
- ✅ User Reward Progress
- ✅ User Salary Status

### What Gets Preserved:
- ✓ **Users/Employees** - All user accounts and employee data
- ✓ **Income Config** - Commission percentages (RP, IV, SV, RV) for each role
- ✓ **Pool Config** - System-wide pool configuration
- ✓ **Salary Plans** - STAR/RUBY/PEARL levels with targets and benefits

### Usage:

```bash
# From the wans-backend directory
npm run clean:db
```

Or run directly:

```bash
node scripts/clean-db.js
```

### ⚠️ Warning:
This operation is **irreversible**. Make sure you have a backup if needed before running this script.

---

## Restore Configuration Script

If you need to restore the system configuration (Income Config, Pool Config, Salary Plans):

```bash
npm run restore:configs
```

This will:
1. Seed Income Config (commission structure)
2. Seed Pool Config (pool percentages)
3. Seed Salary Plans (salary levels and rewards)

---

## Individual Configuration Scripts

You can also run individual configuration seeders:

```bash
# Restore Income Config only
node src/scripts/seed-income-config.js

# Restore Pool Config only
node src/scripts/seed-pool-config.js

# Restore Salary Plans only
node seeder/seed-salary-plans.js
```

---

## After Cleaning:
After cleaning the database, you can run seeders to populate fresh transactional data:

```bash
npm run seed              # Seed products, categories, etc.
npm run seed:hierarchy    # Seed employee hierarchy
```
