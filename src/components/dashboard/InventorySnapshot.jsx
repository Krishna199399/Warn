import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';

export default function InventorySnapshot({ inventory }) {
  const navigate = useNavigate();
  
  // Extract items array from inventory object
  const items = inventory?.items || [];
  
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Package size={14} className="text-blue-600" /> Inventory Snapshot
        </h3>
        <p className="text-sm text-slate-400 text-center py-8">No inventory items</p>
      </div>
    );
  }

  // Get top 5 items by quantity
  const topItems = [...items]
    .sort((a, b) => b.current - a.current)
    .slice(0, 5);
  
  // Get low stock items
  const lowStockItems = items.filter(item => item.current < 10 && item.current > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Package size={14} className="text-blue-600" /> Inventory Snapshot
        </h3>
        <button
          onClick={() => navigate('/app/inventory')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View All <ChevronRight size={12} />
        </button>
      </div>

      {/* Top Stock Items */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={12} className="text-green-600" />
          <span className="text-xs font-semibold text-slate-600">Top Stock Items</span>
        </div>
        <div className="space-y-2">
          {topItems.map((item, idx) => (
            <div key={item._id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                <span className="text-sm text-slate-700 truncate">{item.productId?.name || 'Unknown'}</span>
              </div>
              <span className="text-sm font-bold text-green-700">{item.current}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={12} className="text-amber-600" />
            <span className="text-xs font-semibold text-slate-600">Low Stock Alerts</span>
          </div>
          <div className="space-y-2">
            {lowStockItems.slice(0, 3).map((item) => (
              <div key={item._id} className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-sm text-slate-700 truncate">{item.productId?.name || 'Unknown'}</span>
                <span className="text-sm font-bold text-amber-700">{item.current} left</span>
              </div>
            ))}
          </div>
          {lowStockItems.length > 3 && (
            <button
              onClick={() => navigate('/app/inventory')}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-2 flex items-center gap-1"
            >
              +{lowStockItems.length - 3} more items
            </button>
          )}
        </div>
      )}
    </div>
  );
}
