import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Heart, MapPin, User, TrendingUp } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersApi.getAll();
      const customerOrders = response.data.data || [];
      setOrders(customerOrders.slice(0, 5)); // Recent 5 orders
      
      // Calculate stats
      const pending = customerOrders.filter(o => o.status === 'PENDING').length;
      const completed = customerOrders.filter(o => o.status === 'DELIVERED').length;
      const total = customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      setStats({
        totalOrders: customerOrders.length,
        pendingOrders: pending,
        completedOrders: completed,
        totalSpent: total
      });
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: ShoppingBag, label: 'Total Orders', value: stats.totalOrders, color: 'blue' },
    { icon: Package, label: 'Pending', value: stats.pendingOrders, color: 'orange' },
    { icon: TrendingUp, label: 'Completed', value: stats.completedOrders, color: 'green' },
    { icon: Heart, label: 'Total Spent', value: `₹${stats.totalSpent.toLocaleString('en-IN')}`, color: 'purple' },
  ];

  const quickActions = [
    { icon: ShoppingBag, label: 'Browse Products', path: '/app/products', color: 'green' },
    { icon: Package, label: 'My Orders', path: '/app/customer/orders', color: 'blue' },
    { icon: User, label: 'My Profile', path: '/app/customer/profile', color: 'purple' },
    { icon: MapPin, label: 'Addresses', path: '/app/customer/addresses', color: 'orange' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-green-50">Manage your orders and explore our organic products</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1 text-center"
            >
              <div className={`h-12 w-12 rounded-lg bg-${action.color}-100 flex items-center justify-center mx-auto mb-3`}>
                <action.icon className={`h-6 w-6 text-${action.color}-600`} />
              </div>
              <p className="text-sm font-medium text-slate-900">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <button
            onClick={() => navigate('/app/customer/orders')}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">No orders yet</p>
            <button
              onClick={() => navigate('/app/products')}
              className="btn-primary"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => navigate(`/app/customer/orders/${order._id}`)}
                className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Order #{order.orderNumber || order._id.slice(-6)}</p>
                    <p className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
