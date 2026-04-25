import React from 'react';
import { Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { exportCSV } from '../../utils/exportCSV';

const STATUS_COLOR = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  SHIPPED: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function RecentOrdersTable({ orders, userId }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Orders</h3>
        <p className="text-sm text-slate-400 text-center py-8">No orders yet</p>
      </div>
    );
  }

  const handleExport = () => {
    const data = orders.map(o => ({
      'Order #': o.orderNumber || o._id?.slice(-8),
      Product: o.productId?.name || 'N/A',
      Quantity: o.quantity,
      Amount: o.total,
      Status: o.status,
      Type: (o.buyerId?._id === userId || o.buyerId === userId) ? 'Purchase' : 'Sale',
      Date: formatDate(o.createdAt),
    }));
    exportCSV(data, 'recent_orders');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Recent Orders</h3>
        <button onClick={handleExport} className="btn-export">
          <Download size={12} /> Export
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Order #</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Product</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Qty</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Amount</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Type</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.slice(0, 10).map((order) => {
              const isPurchase = order.buyerId?._id === userId || order.buyerId === userId;
              
              return (
                <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-600">
                      {order.orderNumber || `#${order._id?.slice(-8)}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-800 font-medium">
                      {order.productId?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-slate-700">{order.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-green-700">
                      {formatCurrency(order.total)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      isPurchase ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {isPurchase ? (
                        <>
                          <ArrowDownRight size={12} /> Purchase
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={12} /> Sale
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
