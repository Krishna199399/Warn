import React from 'react';
import { Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING: { 
    label: 'Pending', 
    icon: Clock, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    barColor: 'bg-amber-500'
  },
  APPROVED: { 
    label: 'Approved', 
    icon: CheckCircle, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    barColor: 'bg-blue-500'
  },
  SHIPPED: { 
    label: 'Shipped', 
    icon: Truck, 
    color: 'text-purple-600', 
    bg: 'bg-purple-50',
    barColor: 'bg-purple-500'
  },
  DELIVERED: { 
    label: 'Delivered', 
    icon: Package, 
    color: 'text-green-600', 
    bg: 'bg-green-50',
    barColor: 'bg-green-500'
  },
  CANCELLED: { 
    label: 'Cancelled', 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50',
    barColor: 'bg-red-500'
  },
};

export default function OrderStatusOverview({ statusBreakdown }) {
  const total = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Order Status Overview</h3>
        <p className="text-sm text-slate-400 text-center py-8">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Order Status Overview</h3>
      
      <div className="space-y-3">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = statusBreakdown[status] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const Icon = config.icon;
          
          return (
            <div key={status}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon size={14} className={config.color} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{config.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800">{count}</span>
                  <span className="text-xs text-slate-400 ml-1">({percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`${config.barColor} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
