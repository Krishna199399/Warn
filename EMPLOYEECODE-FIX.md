# Employee Code Display Fix

## Issue
Advisor/employee codes were not displaying on dashboard pages.

## Root Cause
The system migrated from `advisorCode` field to `employeeCode` field in the User model, but dashboard pages were still checking for the old `user.advisorCode` field instead of `user.employeeCode`.

**User Model Fields:**
- Line 30: `advisorCode: { type: String, default: null }` - **OLD/deprecated**
- Line 33: `employeeCode: { type: String, unique: true, sparse: true }` - **NEW/current**

## Files Fixed

### 1. `src/pages/AdminDashboard.jsx`
- **Before:** `Super Admin · Full System Control`
- **After:** `Super Admin · Full System Control · Code: XXXXX`
- Shows employeeCode for admin users (if they have one)

### 2. `src/pages/StateHeadDashboard.jsx`
- **Before:** `State Head · {state}`
- **After:** `State Head · {state} · Code: XXXXX`
- Shows employeeCode for state head users

### 3. `src/pages/SettingsPage.jsx`
- **Before:** Checked `user.advisorCode`
- **After:** Checks `user.employeeCode`
- Profile settings now display correct employee code

### 4. `src/pages/WholesaleDashboard.jsx`
- **Before:** No employee code display
- **After:** `Wholesale · {location} · Code: XXXXX`
- Shows employeeCode for wholesale users

### 5. `src/pages/ShadcnDashboardPage.jsx`
- **Before:** `Advisor · {location}`
- **After:** `Advisor · {location} · Code: XXXXX`
- Shows employeeCode for advisor users

### 6. `src/pages/AreaManagerDashboard.jsx`
- **Before:** `Area Manager · {area}`
- **After:** `Area Manager · {area} · Code: XXXXX`
- Shows employeeCode for area manager users

### 7. `src/pages/DOManagerDashboard.jsx`
- **Before:** `DO Manager · {district}`
- **After:** `DO Manager · {district} · Code: XXXXX`
- Shows employeeCode for DO manager users

### 8. `src/pages/ZonalManagerDashboard.jsx`
- **Before:** `Zonal Manager · {zone}`
- **After:** `Zonal Manager · {zone} · Code: XXXXX`
- Shows employeeCode for zonal manager users

## Implementation Pattern

All dashboards now use this pattern:
```jsx
<p className="text-muted-foreground mt-1">
  {role} · {location}
  {user?.employeeCode && ` · Code: ${user.employeeCode}`}
</p>
```

This ensures:
- Employee code only displays if it exists
- Consistent format across all dashboards
- No errors if employeeCode is null/undefined

## Deployment

### Frontend Deployment
```bash
# On VPS at /var/www/Warn/wans-frontend
git pull origin main
npm install
npm run build
```

Or use the deployment script:
```bash
chmod +x deploy-employeeCode-fix.sh
./deploy-employeeCode-fix.sh
```

## Verification Steps

1. **Login as Advisor:**
   - Navigate to dashboard
   - Verify format: `Advisor · bangalore · Code: ADV001`

2. **Login as Area Manager:**
   - Navigate to dashboard
   - Verify format: `Area Manager · North Area · Code: AM001`

3. **Login as DO Manager:**
   - Navigate to dashboard
   - Verify format: `DO Manager · District 1 · Code: DO001`

4. **Login as Zonal Manager:**
   - Navigate to dashboard
   - Verify format: `Zonal Manager · South Zone · Code: ZM001`

5. **Login as State Head:**
   - Navigate to dashboard
   - Verify format: `State Head · Karnataka · Code: SH001`

6. **Check Settings Page:**
   - Navigate to `/app/settings`
   - Verify employee code displays in profile section

## Related Issues

- **TASK 1-8:** Previous fixes (registration, KYC, wholesale checkout, etc.)
- **TASK 9:** This fix (employee code display)

## Notes

- The `advisorCode` field is deprecated but still exists in the database for backward compatibility
- All new code should use `employeeCode` instead
- Employee codes are only assigned to employee roles (STATE_HEAD, ZONAL_MANAGER, AREA_MANAGER, DO_MANAGER, ADVISOR)
- Shop roles (CUSTOMER, WHOLESALE, MINI_STOCK) do NOT have employee codes
