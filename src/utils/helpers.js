import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPoints(points) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(points) + ' pts';
}

export function formatNumber(num) {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
  if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'delivered':
      return 'bg-green-50 text-green-700';
    case 'processing':
    case 'pending':
      return 'bg-amber-50 text-amber-700';
    case 'inactive':
    case 'cancelled':
    case 'out of stock':
      return 'bg-red-50 text-red-700';
    case 'low stock':
      return 'bg-orange-50 text-orange-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function getRoleColor(role) {
  switch (role) {
    case 'ADMIN':         return 'bg-purple-50 text-purple-700';  // Admin
    case 'STATE_HEAD':    return 'bg-blue-50 text-blue-700';      // Executive Manager (EM)
    case 'ZONAL_MANAGER': return 'bg-indigo-50 text-indigo-700'; // Zonal Manager (ZM)
    case 'AREA_MANAGER':  return 'bg-cyan-50 text-cyan-700';     // Regional Manager (RM)
    case 'DO_MANAGER':    return 'bg-teal-50 text-teal-700';     // Development Officer (DO)
    case 'ADVISOR':       return 'bg-green-50 text-green-700';   // Promotion Representative (PR)
    case 'WHOLESALE':     return 'bg-amber-50 text-amber-700';
    case 'MINI_STOCK':    return 'bg-orange-50 text-orange-700';
    default:              return 'bg-slate-100 text-slate-600';
  }
}

export function getAvatarColor(name) {
  const colors = [
    'bg-green-500', 'bg-blue-500', 'bg-purple-500',
    'bg-amber-500', 'bg-teal-500', 'bg-indigo-500',
  ];
  const idx = name?.charCodeAt(0) % colors.length || 0;
  return colors[idx];
}

export function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return d.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}

// Calculate low stock items from inventory
export function calculateLowStock(inventory, threshold = 10) {
  if (!inventory || !inventory.items || !Array.isArray(inventory.items)) return [];
  return inventory.items.filter(item => item.current < threshold && item.current > 0);
}

// Get order status breakdown
export function getOrderStatusBreakdown(orders) {
  if (!orders || !Array.isArray(orders)) return {};
  
  const breakdown = {
    PENDING: 0,
    APPROVED: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  
  orders.forEach(order => {
    if (breakdown.hasOwnProperty(order.status)) {
      breakdown[order.status]++;
    }
  });
  
  return breakdown;
}

// Separate purchases and sales for wholesale users
export function separatePurchasesAndSales(orders, userId) {
  if (!orders || !Array.isArray(orders)) return { purchases: [], sales: [] };
  
  const purchases = orders.filter(order => 
    order.buyerId?._id === userId || order.buyerId === userId
  );
  
  const sales = orders.filter(order => 
    order.sellerId?._id === userId || order.sellerId === userId
  );
  
  return { purchases, sales };
}

// Calculate KPIs for wholesale dashboard
export function calculateWholesaleKPIs(orders, inventory, userId) {
  const { purchases, sales } = separatePurchasesAndSales(orders, userId);
  
  const totalPurchaseValue = purchases
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  
  const totalSalesValue = sales
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  
  const allOrders = [...purchases, ...sales];
  const pendingOrders = allOrders.filter(o => o.status === 'PENDING').length;
  const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED').length;
  
  const totalStockItems = inventory?.items?.length || 0;
  const lowStockAlerts = calculateLowStock(inventory).length;
  
  return {
    totalPurchaseValue,
    totalSalesValue,
    totalOrders: allOrders.length,
    pendingOrders,
    deliveredOrders,
    totalStockItems,
    lowStockAlerts,
  };
}

// Group items by a specific field
export function groupByField(items, field) {
  if (!items || !Array.isArray(items)) return {};
  
  return items.reduce((acc, item) => {
    const key = item[field];
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// Count items by a specific field
export function countByField(items, field) {
  if (!items || !Array.isArray(items)) return {};
  
  return items.reduce((acc, item) => {
    const key = item[field];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

// Filter items by search term across multiple fields
export function searchItems(items, searchTerm, fields) {
  if (!searchTerm || !items || !Array.isArray(items)) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    fields.some(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return value?.toString().toLowerCase().includes(term);
    })
  );
}

// Calculate percentage change
export function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Get trend direction and formatted value
export function getTrend(current, previous) {
  const change = calculatePercentageChange(current, previous);
  return {
    value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  };
}
