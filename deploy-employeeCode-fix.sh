#!/bin/bash

# Deploy Employee Code Display Fix
# Fixes advisor code not displaying on dashboards

echo "🚀 Deploying Employee Code Display Fix..."
echo ""

# Pull latest changes
echo "📥 Pulling latest changes from repository..."
git pull origin main

# Install dependencies (if needed)
echo "📦 Checking dependencies..."
npm install

# Build the frontend
echo "🔨 Building frontend..."
npm run build

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Changes deployed:"
echo "  - AdminDashboard: Now shows employeeCode for admin users"
echo "  - StateHeadDashboard: Now shows employeeCode for state heads"
echo "  - SettingsPage: Now displays employeeCode instead of advisorCode"
echo "  - WholesaleDashboard: Now shows employeeCode for wholesale users"
echo "  - ShadcnDashboardPage: Now shows employeeCode for advisors"
echo "  - AreaManagerDashboard: Now shows employeeCode for area managers"
echo "  - DOManagerDashboard: Now shows employeeCode for DO managers"
echo "  - ZonalManagerDashboard: Now shows employeeCode for zonal managers"
echo ""
echo "🔍 Please verify:"
echo "  1. Login as an advisor/employee user"
echo "  2. Check that employee code displays on dashboard"
echo "  3. Verify format: 'Role · Location · Code: XXXXX'"
echo ""
