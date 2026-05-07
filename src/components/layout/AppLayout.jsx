import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { WANSSidebar } from '@/components/wans-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Map route segments to human-readable labels
const ROUTE_LABELS = {
  'dashboard-v2':      'Dashboard',
  'dashboard':         'Dashboard',
  'products':          'Products',
  'create':            'Create',
  'settings':          'Settings',
  'reports':           'Reports',
  'network':           'Users & Network',
  'commission':        'Commissions',
  'my-salary':         'My Salary',
  'my-rewards':        'My Rewards',
  'my-payouts':        'My Payouts',
  'bank-details':      'Bank Details',
  'user-approvals':    'User Approvals',
  'stock-shops':       'Stock Shops',
  'orders':            'Orders',
  'inventory':         'Inventory',
  'pos-sale':          'POS Sale',
  'pos':               'Sales History',
  'cart':              'Cart',
  'my-farmers':        'My Customers',
  'my-sales':          'My Sales',
  'advisors':          'Advisors',
  'performance':       'Performance',
  'zonal-employees':   'Zonal Employees',
  'area-employees':    'Area Employees',
  'do-employees':      'DO Employees',
  'revenue-analytics': 'Revenue Analytics',
  'payouts':           'Payout Management',
  'admin':             'Admin',
  'tasks':             'Tasks',
};

function TopBar() {
  const location = useLocation();
  const { user } = useAuth();

  // Build breadcrumb from pathname
  const segments = location.pathname.replace('/app/', '').split('/').filter(Boolean);
  
  // Handle product detail pages (e.g., /app/products/:id or /app/products/:id/edit)
  let currentPage = ROUTE_LABELS[segments[segments.length - 1]] || segments[segments.length - 1] || 'Dashboard';
  
  if (segments[0] === 'products' && segments.length >= 2) {
    // If it's /app/products/:id/edit
    if (segments[2] === 'edit') {
      currentPage = 'Edit Product';
    }
    // If it's /app/products/:id (and the last segment looks like an ID)
    else if (segments.length === 2 && segments[1].length > 10) {
      currentPage = 'Product Details';
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <div className="h-7 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {user?.avatar || user?.name?.slice(0, 2)}
          </div>
          <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <WANSSidebar />
      <SidebarInset>
        <TopBar />
        <main className="flex-1 p-5 lg:p-6 page-enter overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
