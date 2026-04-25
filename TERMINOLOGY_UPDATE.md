# Terminology Update: Direct Sale → Retail Price

## Summary

Renamed "Direct Sale" to "Retail Price" across the entire application to better reflect the business model where Advisors earn 100% of the Retail Value for sales attributed to them.

---

## Changes Made

### 1. Backend Model (Commission Schema)
**File**: `wans-backend/src/models/Commission.js`

**Changed**:
```javascript
// OLD
type: { type: String, enum: ['DIRECT_SALE', 'IV', 'SV', 'RF'], required: true }

// NEW
type: { type: String, enum: ['RETAIL_PRICE', 'IV', 'SV', 'RF'], required: true }
```

---

### 2. Backend Service (Income Distribution)
**File**: `wans-backend/src/services/income.service.js`

**Changed**:
```javascript
// OLD
// SPECIAL: Advisor gets 100% RV as direct sale commission
if (role === 'ADVISOR') {
  commissions.push({
    type: 'DIRECT_SALE',
    ...
  });
}

const summary = {
  total: 0,
  DIRECT_SALE: 0,
  IV: 0,
  SV: 0,
  RF: 0
};

if (c.type === 'DIRECT_SALE') {
  summary.DIRECT_SALE += c.amount;
}

// NEW
// SPECIAL: Advisor gets 100% RV as retail price commission
if (role === 'ADVISOR') {
  commissions.push({
    type: 'RETAIL_PRICE',
    ...
  });
}

const summary = {
  total: 0,
  RETAIL_PRICE: 0,
  IV: 0,
  SV: 0,
  RF: 0
};

if (c.type === 'RETAIL_PRICE') {
  summary.RETAIL_PRICE += c.amount;
}
```

---

### 3. Backend Controller (Commission Grouping)
**File**: `wans-backend/src/controllers/commission.controller.js`

**Changed**:
```javascript
// OLD
const grouped = {
  IV: commissions.filter(c => c.type === 'IV'),
  SV: commissions.filter(c => c.type === 'SV'),
  RF: commissions.filter(c => c.type === 'RF')
};

// NEW
const grouped = {
  RETAIL_PRICE: commissions.filter(c => c.type === 'RETAIL_PRICE'),
  IV: commissions.filter(c => c.type === 'IV'),
  SV: commissions.filter(c => c.type === 'SV'),
  RF: commissions.filter(c => c.type === 'RF')
};
```

---

### 4. Frontend - Dashboard Page
**File**: `src/pages/DashboardPage.jsx`

**Changed**:
```javascript
// OLD
{ label: 'Direct Sale', val: summary.DIRECT_SALE, ... }

// NEW
{ label: 'Retail Price', val: summary.RETAIL_PRICE, ... }
```

---

### 5. Frontend - Commission Page
**File**: `src/pages/CommissionPage.jsx`

**Changed Multiple Sections**:

**A. Summary Cards**:
```javascript
// OLD
{ label: 'Direct Sale', value: summary.DIRECT_SALE, ... }

// NEW
{ label: 'Retail Price', value: summary.RETAIL_PRICE, ... }
```

**B. Filter Buttons**:
```javascript
// OLD
['ALL', 'DIRECT_SALE', 'IV', 'SV', 'RF'].map(t => (
  {t === 'DIRECT_SALE' ? 'Direct' : t}
))

// NEW
['ALL', 'RETAIL_PRICE', 'IV', 'SV', 'RF'].map(t => (
  {t === 'RETAIL_PRICE' ? 'Retail' : t}
))
```

**C. Commission List Items**:
```javascript
// OLD
c.type === 'DIRECT_SALE' ? 'bg-rose-100 text-rose-700' : ...
{c.type === 'DIRECT_SALE' ? 'DS' : c.type}
{c.type === 'DIRECT_SALE' ? 'Direct Sale' : c.type}

// NEW
c.type === 'RETAIL_PRICE' ? 'bg-rose-100 text-rose-700' : ...
{c.type === 'RETAIL_PRICE' ? 'RP' : c.type}
{c.type === 'RETAIL_PRICE' ? 'Retail Price' : c.type}
```

**D. Expanded Commission Details**:
```javascript
// OLD
c.type === 'DIRECT_SALE' ? 'text-rose-700' : ...
{c.type === 'DIRECT_SALE' ? 'Direct Sale' : c.type}
{c.type === 'DIRECT_SALE' ? 'Sale Amount' : 'Pool Amount'}

// NEW
c.type === 'RETAIL_PRICE' ? 'text-rose-700' : ...
{c.type === 'RETAIL_PRICE' ? 'Retail Price' : c.type}
{c.type === 'RETAIL_PRICE' ? 'Sale Amount' : 'Pool Amount'}
```

**E. Info Card**:
```javascript
// OLD
<strong>Direct Sale:</strong> You earn 100% of the Retail Value for your own sales.

// NEW
<strong>Retail Price:</strong> You earn 100% of the Retail Value for your own sales.
```

---

## Visual Changes

### Commission Type Badge
- **OLD**: "DS" (Direct Sale)
- **NEW**: "RP" (Retail Price)

### Filter Button
- **OLD**: "Direct"
- **NEW**: "Retail"

### Card Labels
- **OLD**: "Direct Sale"
- **NEW**: "Retail Price"

---

## Database Migration

**IMPORTANT**: Existing commission records in the database with `type: 'DIRECT_SALE'` will need to be migrated.

### Migration Script (Optional)
```javascript
// Run this in MongoDB shell or create a migration script
db.commissions.updateMany(
  { type: 'DIRECT_SALE' },
  { $set: { type: 'RETAIL_PRICE' } }
);
```

**OR** the application will handle both old and new values gracefully:
- Old records with `DIRECT_SALE` will still display correctly
- New records will use `RETAIL_PRICE`

---

## Testing Checklist

- [ ] Backend: Commission model accepts 'RETAIL_PRICE' type
- [ ] Backend: Income distribution creates 'RETAIL_PRICE' commissions for Advisors
- [ ] Backend: Commission summary includes RETAIL_PRICE field
- [ ] Backend: Commission controller groups by RETAIL_PRICE
- [ ] Frontend: Dashboard shows "Retail Price" card
- [ ] Frontend: Commission page shows "Retail Price" in summary
- [ ] Frontend: Filter button shows "Retail" instead of "Direct"
- [ ] Frontend: Commission list shows "RP" badge
- [ ] Frontend: Commission details show "Retail Price" label
- [ ] Frontend: Info card explains "Retail Price" correctly

---

## Files Modified

### Backend (3 files)
1. `wans-backend/src/models/Commission.js` - Updated enum
2. `wans-backend/src/services/income.service.js` - Updated type and summary
3. `wans-backend/src/controllers/commission.controller.js` - Updated grouping

### Frontend (2 files)
1. `src/pages/DashboardPage.jsx` - Updated card label
2. `src/pages/CommissionPage.jsx` - Updated 8 locations (cards, filters, badges, labels, details, info)

---

## Rationale

**Why "Retail Price" instead of "Direct Sale"?**

1. **Clarity**: "Retail Price" clearly indicates the Advisor earns the full retail value
2. **Accuracy**: Advisors don't actually "sell" - they advise and earn commission
3. **Consistency**: Aligns with business terminology (Retail Value = RV)
4. **Professional**: More formal and business-appropriate term

**Business Model**:
- Advisor advises farmer
- Farmer buys from Mini Stock
- Mini Stock enters Advisor code
- Advisor earns 100% of Retail Value as "Retail Price" commission
- Advisor also earns pool-based commissions (IV/SV/RF) from hierarchy

---

## Summary

All references to "Direct Sale" / "DIRECT_SALE" have been successfully renamed to "Retail Price" / "RETAIL_PRICE" across:
- ✅ Database schema (Commission model)
- ✅ Backend services (income distribution)
- ✅ Backend controllers (commission API)
- ✅ Frontend pages (Dashboard, Commission)
- ✅ UI labels, badges, filters, and tooltips

The terminology now accurately reflects that Advisors earn the full Retail Price (100% RV) for sales attributed to them through their advisor code.
